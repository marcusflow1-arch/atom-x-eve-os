#!/usr/bin/env node
/**
 * Reconcile the user-provided October 8 Game Two replacement package with the
 * current Game Two asset tree WITHOUT overwriting newer gameplay or networking.
 *
 * Run:
 *   GOOGLE_DRIVE_ACCESS_TOKEN=... node tools/game2/drive-source-sync.mjs
 *   GOOGLE_DRIVE_ACCESS_TOKEN=... node tools/game2/drive-source-sync.mjs --verify
 *   GOOGLE_DRIVE_ACCESS_TOKEN=... node tools/game2/drive-source-sync.mjs --sync-missing
 *
 * The script never writes under src/, never deletes files, and never overwrites
 * an existing asset. Token stays in the process environment, not a repo file.
 */
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, rename, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const SOURCE_FOLDER_ID = '1Ug-lWjnJBFI9tq51kjTn6Q04r5f_V_sG';
export const PUBLIC_GAME2_FOLDER_ID = '15PAB_alifRzJjo4HulGP-0QSdEEU9POH';
export const CHUNKED_ASSETS = Object.freeze({
  'Explorer_G2_Game.glb': 19,
  'bank_q.bin.gz': 5,
});
const API = 'https://www.googleapis.com/drive/v3/files';
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const TARGET_ROOT = path.join(ROOT, 'public/game2');

export function safeName(name) {
  return typeof name === 'string'
    && name.length > 0 && name !== '.' && name !== '..'
    && !/[/\\\u0000-\u001f]/.test(name)
    && !name.startsWith('.');
}
export function splitPaths(name, root = TARGET_ROOT) {
  const count = CHUNKED_ASSETS[name];
  return count ? Array.from({ length: count }, (_, i) =>
    path.join(root, 'parts', name + '.' + String(i).padStart(3, '0'))) : [];
}
export function md5(content) {
  return createHash('md5').update(content).digest('hex');
}

function verifyMode() {
  const flags = process.argv.slice(2);
  if (flags.some(flag => !['--verify', '--sync-missing', '--help'].includes(flag))) {
    throw new Error('Use --verify, --sync-missing, or --help (no other flags)');
  }
  if (flags.includes('--verify') && flags.includes('--sync-missing')) {
    throw new Error('Choose --verify OR --sync-missing');
  }
  return flags.includes('--sync-missing') ? 'sync' : flags.includes('--verify') ? 'verify' : 'audit';
}
async function googleJson(url, token) {
  const response = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
  if (!response.ok) throw new Error('Google Drive metadata request failed (HTTP ' + response.status + ')');
  return response.json();
}
async function listChildren(parent, token) {
  let next;
  const files = [];
  do {
    const query = new URLSearchParams({
      q: "'" + parent + "' in parents and trashed = false",
      fields: 'nextPageToken,files(id,name,mimeType,size,md5Checksum)',
      pageSize: '1000',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    });
    if (next) query.set('pageToken', next);
    const result = await googleJson(API + '?' + query.toString(), token);
    files.push(...(result.files || []));
    next = result.nextPageToken;
  } while (next);
  return files;
}
async function discoverAssets(token, folderId = PUBLIC_GAME2_FOLDER_ID, prefix = '') {
  const entries = await listChildren(folderId, token);
  const assets = [];
  for (const item of entries) {
    if (!safeName(item.name)) throw new Error('Unsafe Google Drive entry name');
    const relative = prefix ? prefix + '/' + item.name : item.name;
    if (item.mimeType === 'application/vnd.google-apps.folder') {
      assets.push(...await discoverAssets(token, item.id, relative));
    } else {
      if (!/^[a-zA-Z0-9_.\/-]+$/.test(relative)) throw new Error('Unsafe relative asset path');
      assets.push({ ...item, relative });
    }
  }
  return assets.sort((a, b) => a.relative.localeCompare(b.relative));
}
async function presentLocal(file, remoteMd5) {
  const target = path.join(TARGET_ROOT, ...file.relative.split('/'));
  const pieces = file.relative.includes('/') ? [] : splitPaths(file.name);
  if (existsSync(target)) {
    if (!remoteMd5) return { state: 'present', target };
    const local = await readFile(target);
    return { state: md5(local) === remoteMd5 ? 'verified' : 'mismatch', target };
  }
  if (pieces.length && pieces.every(existsSync)) {
    if (!remoteMd5) return { state: 'present-as-chunks', target };
    const digest = createHash('md5');
    for (const piece of pieces) digest.update(await readFile(piece));
    return { state: digest.digest('hex') === remoteMd5 ? 'verified-as-chunks' : 'mismatch', target };
  }
  return { state: 'missing', target };
}
async function downloadMissing(file, token, target) {
  const url = API + '/' + encodeURIComponent(file.id) + '?alt=media';
  const response = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
  if (!response.ok) throw new Error('Google Drive asset download failed: ' + file.relative + ' (HTTP ' + response.status + ')');
  const length = Number(file.size ?? 0);
  if (length > 50000000) throw new Error('Asset exceeds 50MB safety limit: ' + file.relative);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (length && bytes.length !== length) throw new Error('Incomplete Drive asset: ' + file.relative);
  if (file.md5Checksum && md5(bytes) !== file.md5Checksum) throw new Error('Checksum mismatch from Drive: ' + file.relative);
  if (existsSync(target)) return false; // never overwrite
  await mkdir(path.dirname(target), { recursive: true });
  const temporary = target + '.game2-drive-pending-' + process.pid;
  try {
    await writeFile(temporary, bytes, { flag: 'wx' });
    // Recheck before finalizing. No existing file is knowingly replaced.
    if (existsSync(target)) return false;
    await rename(temporary, target);
    return true;
  } finally {
    await rm(temporary, { force: true });
  }
}
export async function run() {
  const mode = verifyMode();
  if (process.argv.includes('--help')) {
    console.log('Game 2 Drive sync: default audit, --verify checks local MD5 against Drive, --sync-missing imports missing public/game2 assets only.');
    return;
  }
  const token = process.env.GOOGLE_DRIVE_ACCESS_TOKEN;
  if (!token) throw new Error('Set GOOGLE_DRIVE_ACCESS_TOKEN with read-only Drive access. Do not commit a token.');
  const assets = await discoverAssets(token);
  const counts = { total: assets.length, verified: 0, existing: 0, missing: 0, imported: 0, mismatched: 0 };
  for (const asset of assets) {
    const local = await presentLocal(asset, mode === 'audit' ? null : asset.md5Checksum);
    counts.total = assets.length;
    if (local.state === 'missing') {
      counts.missing += 1;
      if (mode === 'sync' && await downloadMissing(asset, token, local.target)) {
        counts.imported += 1;
        counts.missing -= 1;
      } else if (mode !== 'sync') {
        console.log('MISSING', asset.relative);
      }
    } else if (local.state === 'mismatch') {
      counts.mismatched += 1;
      console.error('MISMATCH (not overwritten)', asset.relative);
    } else if (local.state.startsWith('verified')) {
      counts.verified += 1;
    } else {
      counts.existing += 1;
    }
  }
  console.log(JSON.stringify({ sourceFolderId: SOURCE_FOLDER_ID, mode, ...counts }, null, 2));
  if (counts.mismatched > 0 || (mode === 'verify' && counts.missing > 0)) {
    process.exitCode = 1;
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch(error => { console.error('Game 2 Drive source sync:', error.message); process.exitCode = 1; });
}
