// Download the player's own licensed map copies from Google Drive into the
// local Game 2 assets folder. No OAuth tokens or proprietary BSPs are committed.
// Usage: GOOGLE_DRIVE_ACCESS_TOKEN=<user_oauth_token> node tools/game2/sync-team-maps.mjs
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const token = process.env.GOOGLE_DRIVE_ACCESS_TOKEN;
if (!token) {
  console.error('Set GOOGLE_DRIVE_ACCESS_TOKEN with Drive read permission. Do not commit the token.');
  process.exitCode = 1;
} else {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const sources = [
    { id: '1uIQPWKuqMbujSn9dUrnwVFGqv6LKq3t9', name: 'duel_training.bsp', expected: 905388 },
    { id: '16dHdYcOiPIJo1lvHVhcOjEZcf3KJmIJV', name: 'duel_hangar.bsp', expected: 702604 },
    { id: '18Fb_OkshjX9SqdW-UcG1eWapc8jsKXhB', name: 'duel_carbon.bsp', expected: 910684 },
  ];
  const isRBSP = bytes => bytes.length >= 152 &&
    bytes.toString('ascii', 0, 4) === 'RBSP' && bytes.readInt32LE(4) === 1;
  for (const source of sources) {
    const target = resolve(root, 'public/game2/maps', source.name);
    let current = null;
    try { current = await readFile(target); } catch { /* new map */ }
    if (current && current.length === source.expected && isRBSP(current)) {
      console.log('Already installed:', source.name);
      continue;
    }
    const url = 'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(source.id) + '?alt=media';
    const response = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
    if (!response.ok) throw new Error('Drive download failed for ' + source.name + ': HTTP ' + response.status);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length !== source.expected || !isRBSP(bytes)) {
      throw new Error('Drive returned an invalid or unexpected map for ' + source.name);
    }
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, bytes);
    console.log('Installed locally:', source.name, '(' + bytes.length + ' bytes)');
  }
}
