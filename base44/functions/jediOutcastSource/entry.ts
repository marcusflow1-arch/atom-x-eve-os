import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const MAX_IMPORT_BYTES = 96 * 1024 * 1024;
const PAK_CHUNK_BYTES = 16 * 1024 * 1024;
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

function sharedDriveUrl(fileId: string) {
  return `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download&confirm=t`;
}

async function getDriveToken(base44: any) {
  try {
    const tokenResult: any = await base44.asServiceRole.connectors.getAccessToken('googledrive');
    return String(tokenResult?.access_token || tokenResult?.token || tokenResult || '');
  } catch (_) {
    // The retail source links are shared with the app. The server-side shared-link
    // fallback remains usable even when the connector has not granted drive.file access.
    return '';
  }
}

async function driveMetadata(token: string, fileId: string) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (response.ok) return await response.json();

  // The reconstruction sources were explicitly supplied as share links. If the
  // Base44 Drive connector only has drive.file scope, use the shared file itself.
  const fallback = await fetch(sharedDriveUrl(fileId), { headers: { Range: 'bytes=0-0' } });
  if (!fallback.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error?.message || `Drive metadata failed: HTTP ${response.status}`);
  }
  const range = fallback.headers.get('content-range') || '';
  const total = Number(range.split('/').pop() || fallback.headers.get('content-length') || 0);
  const disposition = fallback.headers.get('content-disposition') || '';
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  await fallback.body?.cancel().catch(() => {});
  return { id: fileId, name: match?.[1] || fileId, mimeType: fallback.headers.get('content-type') || 'application/octet-stream', size: String(total) };
}

async function driveRange(token: string, fileId: string, start: number, end: number) {
  let response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Range: `bytes=${start}-${end}`,
      },
    },
  );
  if (!response.ok) {
    response = await fetch(sharedDriveUrl(fileId), {
      headers: { Range: `bytes=${start}-${end}` },
      redirect: 'follow',
    });
  }
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
  let response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) response = await fetch(sharedDriveUrl(fileId), { redirect: 'follow' });
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
  const owned = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const stream = new Blob([owned]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
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
    const base44: any = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!adminOnly(user)) return Response.json({ error: 'Admin reconstruction access required.' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');

    if (action === 'status') {
      const [roots, assets, definitions, pakChunks] = await Promise.all([
        base44.asServiceRole.entities.JediSourceRoot.list('-created_date', 50),
        base44.asServiceRole.entities.JediSourceAsset.list('path', 500),
        base44.asServiceRole.entities.JediContentDefinition.list('content_key', 500),
        base44.asServiceRole.entities.JediPakChunk.list('archive_name', 500),
      ]);
      return Response.json({
        success: true,
        roots,
        assets,
        definitions,
        pak_chunks: pakChunks,
        counts: {
          roots: roots.length,
          assets: assets.length,
          imported_assets: assets.filter((x: any) => x.storage_url).length,
          definitions: definitions.length,
          pak_chunks: pakChunks.length,
        },
        pak_chunk_bytes: PAK_CHUNK_BYTES,
      });
    }

    if (action === 'cacheSourceArchive') {
      const sourceCommit = '85f58467344d3ccbc6e2501a9af573ff4488a898';
      const archivePath = `source/grayj-Jedi-Outcast-${sourceCommit}.zip`;
      const existing = await base44.asServiceRole.entities.GameReconstructionFile.filter(
        { game_key: 'jedi_outcast', area: 'source_code', path: archivePath },
        '-updated_date',
        10,
      );
      const cached = existing.find((row: any) => row.storage_url && row.status === 'stored');
      if (cached) return Response.json({ success: true, reused: true, file: cached });

      const url = `https://github.com/grayj/Jedi-Outcast/archive/${sourceCommit}.zip`;
      const response = await fetch(url, { redirect: 'follow' });
      if (!response.ok) throw new Error(`Raven source archive download failed: HTTP ${response.status}`);
      const contentLength = Number(response.headers.get('content-length') || 0);
      if (contentLength > MAX_IMPORT_BYTES) throw new Error('Raven source archive exceeds the Base44 reconstruction import limit.');

      const bytes = new Uint8Array(await response.arrayBuffer());
      if (!bytes.byteLength || bytes.byteLength > MAX_IMPORT_BYTES) throw new Error('Raven source archive is empty or too large.');
      const digest = hex(await crypto.subtle.digest('SHA-256', bytes));
      const owned = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      const file = new File([owned], `Jedi-Outcast-${sourceCommit}.zip`, { type: 'application/zip' });
      const uploaded = await base44.asServiceRole.integrations.Core.UploadFile({ file });
      if (!uploaded?.file_url) throw new Error('Base44 source archive upload did not return a file URL.');

      const data = {
        game_key: 'jedi_outcast',
        area: 'source_code',
        path: archivePath,
        display_name: `Jedi-Outcast-${sourceCommit}.zip`,
        language: 'Source archive',
        source_origin: 'grayj/Jedi-Outcast',
        source_url: url,
        source_commit: sourceCommit,
        storage_url: uploaded.file_url,
        content: '',
        byte_size: bytes.byteLength,
        sha256: digest,
        canonical: true,
        editable: false,
        status: 'stored',
        metadata: { complete_source_snapshot: true, license: 'GPL-2.0' },
      };

      const record = existing[0]
        ? await base44.asServiceRole.entities.GameReconstructionFile.update(existing[0].id, data)
        : await base44.asServiceRole.entities.GameReconstructionFile.create(data);

      return Response.json({ success: true, reused: false, file: record });
    }

    if (action === 'registerProvidedArchive') {
      // Whitelisted fallback from the user's newly provided GOG GameData/base
      // folder. No arbitrary Drive file IDs or URL parameters are accepted.
      // The other retail archives must still exist in Game Rebuilds.
      const name = String(body.archiveName || '').toLowerCase();
      if (name !== 'assets5.pk3') {
        return Response.json({ success: false, error: 'Only the confirmed assets5.pk3 Drive fallback is registered.' }, { status: 400 });
      }
      const fileId = '1uGN9pbzUvPueJVXv_vtqYE3L7xDdCrBP';
      const existing = await base44.asServiceRole.entities.JediSourceAsset.filter(
        { game_key: 'jedi_outcast', path: name, category: 'retail_archive' },
        '-updated_date',
        20,
      );
      const usable = existing.find((row: any) => row.drive_file_id && Number(row.byte_size) > 0);
      if (usable) return Response.json({ success: true, reused: true, asset: usable });
      const token = await getDriveToken(base44);
      const meta = await driveMetadata(token, fileId);
      const size = Number(meta.size || 0);
      if (!Number.isSafeInteger(size) || size < 1024 || size > MAX_IMPORT_BYTES) {
        return Response.json({ success: false, error: 'Provided assets5.pk3 size is invalid.' }, { status: 422 });
      }
      const head = await driveRange(token, fileId, 0, 3);
      if (head[0] !== 80 || head[1] !== 75 || (head[2] !== 3 && head[2] !== 5) || (head[3] !== 4 && head[3] !== 6)) {
        return Response.json({ success: false, error: 'The supplied file is not a PK3/ZIP archive.' }, { status: 422 });
      }
      const row = {
        game_key: 'jedi_outcast',
        path: name,
        category: 'retail_archive',
        source_kind: 'drive_file',
        source_root_key: 'user_drive_gog_2026_10_08',
        drive_file_id: fileId,
        drive_parent_id: '1DX9GDa0vUqJ_IokcEgI4TzjF9YfKjlO_',
        byte_size: size,
        mime_type: 'application/zip',
        canonical: true,
        editable: false,
        status: 'verified',
        metadata: { source: 'user_provided_gog_game_data', validated_header: true },
      };
      const asset = existing[0]
        ? await base44.asServiceRole.entities.JediSourceAsset.update(existing[0].id, row)
        : await base44.asServiceRole.entities.JediSourceAsset.create(row);
      return Response.json({ success: true, reused: false, asset });
    }

    if (action === 'cachePakChunk') {
      const archiveAssetId = String(body.archiveAssetId || '');
      const chunkIndex = Number(body.chunkIndex);
      if (!archiveAssetId || !Number.isInteger(chunkIndex) || chunkIndex < 0) {
        return Response.json({ error: 'archiveAssetId and a non-negative integer chunkIndex are required.' }, { status: 400 });
      }

      const archive = await base44.asServiceRole.entities.JediSourceAsset.get(archiveAssetId);
      if (!archive || archive.game_key !== 'jedi_outcast' || archive.category !== 'retail_archive' || !archive.drive_file_id) {
        return Response.json({ error: 'Canonical Jedi Outcast retail archive not found.' }, { status: 404 });
      }

      const sourceSize = Number(archive.byte_size || 0);
      if (!(sourceSize > 0)) return Response.json({ error: `${archive.path}: source size is missing.` }, { status: 400 });
      const chunkCount = Math.ceil(sourceSize / PAK_CHUNK_BYTES);
      if (chunkIndex >= chunkCount) return Response.json({ error: `${archive.path}: chunk index ${chunkIndex} is out of range.` }, { status: 400 });

      const offset = chunkIndex * PAK_CHUNK_BYTES;
      const expectedSize = Math.min(PAK_CHUNK_BYTES, sourceSize - offset);
      const existing = await base44.asServiceRole.entities.JediPakChunk.filter(
        { game_key: 'jedi_outcast', archive_asset_id: archive.id, chunk_index: chunkIndex },
        '-updated_date',
        10,
      );
      const cached = existing.find((row: any) =>
        row.status === 'cached' &&
        row.storage_url &&
        Number(row.offset) === offset &&
        Number(row.byte_size) === expectedSize &&
        Number(row.source_size) === sourceSize
      );
      if (cached) {
        return Response.json({
          success: true,
          reused: true,
          chunk: cached,
          archive: { id: archive.id, name: archive.path, size: sourceSize, chunk_count: chunkCount, chunk_bytes: PAK_CHUNK_BYTES },
        });
      }

      const token = await getDriveToken(base44);
      const bytes = await driveRange(token, String(archive.drive_file_id), offset, offset + expectedSize - 1);
      if (bytes.byteLength !== expectedSize) throw new Error(`${archive.path}: chunk ${chunkIndex} size mismatch.`);

      const digest = hex(await crypto.subtle.digest('SHA-256', bytes));
      const owned = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      const file = new File([owned], `${String(archive.path).replace(/[^a-z0-9_.-]+/gi, '_')}.part${String(chunkIndex).padStart(3, '0')}`, {
        type: 'application/octet-stream',
      });
      const uploaded = await base44.asServiceRole.integrations.Core.UploadFile({ file });
      if (!uploaded?.file_url) throw new Error(`${archive.path}: Base44 chunk upload did not return a file URL.`);

      const data = {
        game_key: 'jedi_outcast',
        archive_name: archive.path,
        archive_asset_id: archive.id,
        chunk_index: chunkIndex,
        offset,
        byte_size: expectedSize,
        source_size: sourceSize,
        storage_url: uploaded.file_url,
        sha256: digest,
        status: 'cached',
        metadata: { source: 'google_drive_range', chunk_bytes: PAK_CHUNK_BYTES },
      };

      const chunk = existing[0]
        ? await base44.asServiceRole.entities.JediPakChunk.update(existing[0].id, data)
        : await base44.asServiceRole.entities.JediPakChunk.create(data);

      return Response.json({
        success: true,
        reused: false,
        chunk,
        archive: { id: archive.id, name: archive.path, size: sourceSize, chunk_count: chunkCount, chunk_bytes: PAK_CHUNK_BYTES },
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

      const token = await getDriveToken(base44);
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

      const token = await getDriveToken(base44);
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
  } catch (error: any) {
    console.error('jediOutcastSource:', error);
    // This is an admin-only development bridge. Return the real backend error in
    // JSON so the reconstruction UI can identify the failing stage instead of
    // Base44 replacing it with the generic "Request failed with status code 500".
    return Response.json({ success: false, error: error?.message || String(error) });
  }
});
