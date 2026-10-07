import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const MAX_IMPORT_BYTES = 96 * 1024 * 1024;
const ZIP_TAIL_BYTES = 65557;
const decoder = new TextDecoder();

function adminOnly(user: any) {
  return user && user.role === 'admin';
}

function basename(path: string) {
  const parts = String(path || 'asset.bin').replace(/\\/g, '/').split('/').filter(Boolean);
  return parts[parts.length - 1] || 'asset.bin';
}

function hex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function driveMetadata(token: string, fileId: string) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `Drive metadata failed: HTTP ${response.status}`);
  return data;
}

async function driveRange(token: string, fileId: string, start: number, end: number) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Range: `bytes=${start}-${end}`,
      },
    },
  );
  if (!response.ok) throw new Error(`Drive range read failed: HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const expected = end - start + 1;
  if (response.status === 200 && bytes.byteLength !== expected) {
    throw new Error('Google Drive did not honor the range request; refusing to buffer the full retail PK3.');
  }
  if (response.status === 206 && bytes.byteLength !== expected) {
    throw new Error(`Short Drive range read: expected ${expected}, got ${bytes.byteLength}`);
  }
  return bytes;
}

async function driveWhole(token: string, fileId: string) {
  const meta = await driveMetadata(token, fileId);
  const size = Number(meta.size || 0);
  if (size <= 0) throw new Error('Drive file has no readable size.');
  if (size > MAX_IMPORT_BYTES) throw new Error(`Individual asset is too large to import (${Math.ceil(size / 1048576)} MB).`);
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) throw new Error(`Drive download failed: HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength !== size) throw new Error(`Drive download was truncated: ${bytes.byteLength}/${size} bytes.`);
  return { bytes, meta };
}

function findEocd(tail: Uint8Array, absoluteStart: number, totalSize: number) {
  const view = new DataView(tail.buffer, tail.byteOffset, tail.byteLength);
  for (let i = tail.byteLength - 22; i >= 0; i--) {
    if (view.getUint32(i, true) !== 0x06054b50) continue;
    const commentLength = view.getUint16(i + 20, true);
    if (absoluteStart + i + 22 + commentLength !== totalSize) continue;
    const disk = view.getUint16(i + 4, true);
    const centralDisk = view.getUint16(i + 6, true);
    const entriesDisk = view.getUint16(i + 8, true);
    const entries = view.getUint16(i + 10, true);
    const centralSize = view.getUint32(i + 12, true);
    const centralOffset = view.getUint32(i + 16, true);
    if (disk || centralDisk || entriesDisk !== entries || entries === 0xffff || centralSize === 0xffffffff || centralOffset === 0xffffffff) {
      throw new Error('ZIP64 or multipart PK3 archives are not supported.');
    }
    return { entries, centralSize, centralOffset };
  }
  throw new Error('PK3 end-of-directory record was not found.');
}

function findCentralEntry(directory: Uint8Array, wantedPath: string, count: number, optional = false) {
  const view = new DataView(directory.buffer, directory.byteOffset, directory.byteLength);
  let pos = 0;
  const wanted = wantedPath.replace(/\\/g, '/').toLowerCase();
  for (let i = 0; i < count; i++) {
    if (pos + 46 > directory.byteLength || view.getUint32(pos, true) !== 0x02014b50) {
      throw new Error('Damaged PK3 central directory.');
    }
    const flags = view.getUint16(pos + 8, true);
    const method = view.getUint16(pos + 10, true);
    const compressedSize = view.getUint32(pos + 20, true);
    const uncompressedSize = view.getUint32(pos + 24, true);
    const nameLength = view.getUint16(pos + 28, true);
    const extraLength = view.getUint16(pos + 30, true);
    const commentLength = view.getUint16(pos + 32, true);
    const localOffset = view.getUint32(pos + 42, true);
    const next = pos + 46 + nameLength + extraLength + commentLength;
    if (next > directory.byteLength) throw new Error('Damaged PK3 entry.');
    const name = decoder.decode(directory.subarray(pos + 46, pos + 46 + nameLength)).replace(/\\/g, '/').toLowerCase();
    if (name === wanted) {
      if (flags & 1) throw new Error(`${wantedPath}: encrypted PK3 entry is unsupported.`);
      if (![0, 8].includes(method)) throw new Error(`${wantedPath}: unsupported compression method ${method}.`);
      if (uncompressedSize > MAX_IMPORT_BYTES) throw new Error(`${wantedPath}: entry exceeds the reconstruction import limit.`);
      return { method, compressedSize, uncompressedSize, localOffset };
    }
    pos = next;
  }
  if (optional) return null;
  throw new Error(`${wantedPath}: not found in the canonical retail PK3.`);
}

async function inflateRaw(bytes: Uint8Array) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function locatePk3Entry(token: string, fileId: string, entryPath: string, optional = false) {
  const meta = await driveMetadata(token, fileId);
  const totalSize = Number(meta.size || 0);
  if (!totalSize) throw new Error('Retail PK3 has no readable size.');

  const tailStart = Math.max(0, totalSize - ZIP_TAIL_BYTES);
  const tail = await driveRange(token, fileId, tailStart, totalSize - 1);
  const eocd = findEocd(tail, tailStart, totalSize);
  if (eocd.centralSize > 48 * 1024 * 1024) throw new Error('PK3 central directory is unexpectedly large.');

  const directory = await driveRange(
    token,
    fileId,
    eocd.centralOffset,
    eocd.centralOffset + eocd.centralSize - 1,
  );
  const entry = findCentralEntry(directory, entryPath, eocd.entries, optional);
  return { entry, meta };
}

async function readLocatedPk3Entry(token: string, fileId: string, entryPath: string, entry: any, meta: any) {
  const localHeader = await driveRange(token, fileId, entry.localOffset, entry.localOffset + 29);
  const localView = new DataView(localHeader.buffer, localHeader.byteOffset, localHeader.byteLength);
  if (localView.getUint32(0, true) !== 0x04034b50) throw new Error(`${entryPath}: damaged local PK3 header.`);
  const nameLength = localView.getUint16(26, true);
  const extraLength = localView.getUint16(28, true);
  const dataStart = entry.localOffset + 30 + nameLength + extraLength;
  const packed = entry.compressedSize
    ? await driveRange(token, fileId, dataStart, dataStart + entry.compressedSize - 1)
    : new Uint8Array();

  const bytes = entry.method === 0 ? packed : await inflateRaw(packed);
  if (bytes.byteLength !== entry.uncompressedSize) {
    throw new Error(`${entryPath}: decompressed size mismatch (${bytes.byteLength}/${entry.uncompressedSize}).`);
  }
  return { bytes, meta: { ...meta, name: basename(entryPath), mimeType: 'application/octet-stream', size: String(bytes.byteLength) } };
}

async function readPk3Entry(token: string, fileId: string, entryPath: string) {
  const located = await locatePk3Entry(token, fileId, entryPath, false);
  return readLocatedPk3Entry(token, fileId, entryPath, located.entry, located.meta);
}

async function resolveRetailPath(base44: any, token: string, requestedPath: string) {
  const archives = await base44.asServiceRole.entities.JediSourceAsset.filter(
    { game_key: 'jedi_outcast', category: 'retail_archive' },
    'path',
    20,
  );
  let chosen: any = null;
  for (const archive of archives) {
    if (!archive.drive_file_id) continue;
    const located = await locatePk3Entry(token, String(archive.drive_file_id), requestedPath, true);
    if (located.entry) chosen = { archive, ...located };
  }
  if (!chosen) throw new Error(`${requestedPath}: not found in the canonical retail PK3 set.`);
  return chosen;
}

function validateOriginalFormat(path: string, bytes: Uint8Array) {
  const lower = path.toLowerCase();
  if (!/\.(bsp|glm|gla)$/.test(lower)) return;
  if (bytes.byteLength < 8) throw new Error(`${path}: file is too small.`);
  const magic = decoder.decode(bytes.subarray(0, 4));
  const version = new DataView(bytes.buffer, bytes.byteOffset, 8).getInt32(4, true);
  const expectedMagic = lower.endsWith('.bsp') ? 'RBSP' : lower.endsWith('.glm') ? '2LGM' : '2LGA';
  const expectedVersion = lower.endsWith('.bsp') ? 1 : 6;
  if (magic !== expectedMagic || version !== expectedVersion) {
    throw new Error(`${path}: expected original Jedi Outcast ${expectedMagic} v${expectedVersion}, got ${magic} v${version}.`);
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Not found' }, { status: 404 });
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!adminOnly(user)) return Response.json({ error: 'Admin reconstruction access required.' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');

    if (action === 'status') {
      const [roots, assets, definitions] = await Promise.all([
        base44.asServiceRole.entities.JediSourceRoot.list('-created_date', 50),
        base44.asServiceRole.entities.JediSourceAsset.list('path', 500),
        base44.asServiceRole.entities.JediContentDefinition.list('content_key', 500),
      ]);
      return Response.json({
        success: true,
        roots,
        assets,
        definitions,
        counts: {
          roots: roots.length,
          assets: assets.length,
          imported_assets: assets.filter((x: any) => x.storage_url).length,
          definitions: definitions.length,
        },
      });
    }

    if (action === 'importPath') {
      const requestedPath = String(body.path || '').replace(/\\/g, '/').replace(/^\/+/, '').toLowerCase();
      if (!requestedPath || requestedPath.includes('..')) return Response.json({ error: 'A safe original game path is required.' }, { status: 400 });

      const existing = await base44.asServiceRole.entities.JediSourceAsset.filter(
        { game_key: 'jedi_outcast', path: requestedPath },
        '-updated_date',
        20,
      );
      const cached = existing.find((x: any) => x.storage_url);
      if (cached) return Response.json({ success: true, asset: cached, reused: true });

      const token = await base44.asServiceRole.connectors.getAccessToken('googledrive');
      const resolved = await resolveRetailPath(base44, token, requestedPath);
      const payload = await readLocatedPk3Entry(
        token,
        String(resolved.archive.drive_file_id),
        requestedPath,
        resolved.entry,
        resolved.meta,
      );
      validateOriginalFormat(requestedPath, payload.bytes);

      const digest = hex(await crypto.subtle.digest('SHA-256', payload.bytes));
      const file = new File([payload.bytes], basename(requestedPath), { type: 'application/octet-stream' });
      const uploaded = await base44.asServiceRole.integrations.Core.UploadFile({ file });
      if (!uploaded?.file_url) throw new Error('Base44 storage upload did not return a file URL.');

      const record = existing[0]
        ? await base44.asServiceRole.entities.JediSourceAsset.update(existing[0].id, {
            source_kind: 'pk3_entry',
            source_root_key: 'retail_game_files',
            pk3_file_id: resolved.archive.drive_file_id,
            pk3_name: resolved.archive.path,
            pk3_entry_path: requestedPath,
            storage_url: uploaded.file_url,
            sha256: digest,
            byte_size: payload.bytes.byteLength,
            canonical: true,
            editable: false,
            status: 'imported',
          })
        : await base44.asServiceRole.entities.JediSourceAsset.create({
            game_key: 'jedi_outcast',
            path: requestedPath,
            category: String(body.category || 'runtime_asset'),
            source_kind: 'pk3_entry',
            source_root_key: 'retail_game_files',
            pk3_file_id: resolved.archive.drive_file_id,
            pk3_name: resolved.archive.path,
            pk3_entry_path: requestedPath,
            storage_url: uploaded.file_url,
            sha256: digest,
            byte_size: payload.bytes.byteLength,
            canonical: true,
            editable: false,
            status: 'imported',
            metadata: { resolved_by: 'retail_pk3_precedence' },
          });

      return Response.json({ success: true, asset: record, reused: false });
    }

    if (action === 'importAsset' || action === 'readText') {
      const assetId = String(body.assetId || '');
      if (!assetId) return Response.json({ error: 'assetId required' }, { status: 400 });
      const asset = await base44.asServiceRole.entities.JediSourceAsset.get(assetId);
      if (!asset) return Response.json({ error: 'Source asset not found' }, { status: 404 });

      if (action === 'importAsset' && asset.storage_url) {
        return Response.json({ success: true, asset, reused: true });
      }

      const token = await base44.asServiceRole.connectors.getAccessToken('googledrive');
      let payload;
      if (asset.source_kind === 'drive_file' && asset.drive_file_id) {
        payload = await driveWhole(token, String(asset.drive_file_id));
      } else if (asset.source_kind === 'pk3_entry' && asset.pk3_file_id && asset.pk3_entry_path) {
        payload = await readPk3Entry(token, String(asset.pk3_file_id), String(asset.pk3_entry_path));
      } else {
        return Response.json({ error: `Unsupported asset source: ${asset.source_kind}` }, { status: 400 });
      }

      validateOriginalFormat(String(asset.path), payload.bytes);

      if (action === 'readText') {
        if (payload.bytes.byteLength > 4 * 1024 * 1024) return Response.json({ error: 'Text asset is too large to return inline.' }, { status: 413 });
        return Response.json({
          success: true,
          asset_id: asset.id,
          path: asset.path,
          content: decoder.decode(payload.bytes),
          byte_size: payload.bytes.byteLength,
        });
      }

      const digest = hex(await crypto.subtle.digest('SHA-256', payload.bytes));
      const type = String(asset.mime_type || payload.meta?.mimeType || 'application/octet-stream');
      const file = new File([payload.bytes], basename(String(asset.path)), { type });
      const uploaded = await base44.asServiceRole.integrations.Core.UploadFile({ file });
      if (!uploaded?.file_url) throw new Error('Base44 storage upload did not return a file URL.');

      const updated = await base44.asServiceRole.entities.JediSourceAsset.update(asset.id, {
        storage_url: uploaded.file_url,
        sha256: digest,
        byte_size: payload.bytes.byteLength,
        status: 'imported',
      });
      return Response.json({ success: true, asset: updated, reused: false });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('jediOutcastSource:', error);
    return Response.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
});
