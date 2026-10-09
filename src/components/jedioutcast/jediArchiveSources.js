// Original Raven retail game data resolver.
// Prioritizes Admin → Game Rebuilds canonical archives. Admin-uploaded original
// PK3 files may be supplied as single verified-size storage objects; existing
// JediPakChunk cache preserves the normal 16 MiB download/repair workflow.
export const REQUIRED_JEDI_ARCHIVES = Object.freeze(['assets0.pk3','assets1.pk3','assets2.pk3','assets5.pk3']);
export const JEDI_ARCHIVE_CHUNK_BYTES = 16 * 1024 * 1024;

export function retailArchiveName(path) {
  const normalized = String(path || '').replace(/\\/g,'/').toLowerCase();
  const name = normalized.split('/').pop();
  return REQUIRED_JEDI_ARCHIVES.includes(name) ? name : null;
}

export function findRegisteredJediArchives(sourceAssets = [], rebuildFiles = []) {
  const byName = new Map();
  for (const asset of sourceAssets) {
    const name = retailArchiveName(asset.path);
    if (!name || !asset.id || Number(asset.byte_size) <= 0) continue;
    if (asset.drive_file_id) byName.set(name,{...asset,name,kind:'drive'});
    else if (/^https:\/\//i.test(String(asset.storage_url || '')))
      byName.set(name,{...asset,name,kind:'stored'});
  }
  // An admin can also upload the *original* retail PK3 directly to the
  // Game Rebuilds Original Assets tab. Those files are already in Base44 storage,
  // so the browser should consume them without asking the user again.
  for (const file of rebuildFiles) {
    if (file.area !== 'original_asset' || !file.storage_url || Number(file.byte_size) <= 0) continue;
    const name = retailArchiveName(file.path || file.display_name);
    if (!name || byName.has(name)) continue;
    if (!/^https:\/\//i.test(String(file.storage_url))) continue;
    byName.set(name,{...file,name,kind:'stored'});
  }
  return byName;
}

export function collectCachedArchiveChunks(archive, rows = [], chunkBytes = JEDI_ARCHIVE_CHUNK_BYTES) {
  const size = Number(archive.byte_size);
  if (!Number.isSafeInteger(size) || size <= 0) throw new Error(archive.name+': archive size is invalid.');
  // A direct uploaded Game Rebuilds archive has one storage object already.
  if (archive.kind === 'stored') return [{
    index:0,offset:0,size,url:archive.storage_url,sha256:archive.sha256 || ''
  }];
  const count = Math.ceil(size/chunkBytes);
  const chunks = new Array(count);
  for (const row of rows) {
    if (row.archive_asset_id !== archive.id && retailArchiveName(row.archive_name) !== archive.name) continue;
    const i = Number(row.chunk_index);
    if (!Number.isInteger(i) || i<0 || i>=count) continue;
    const offset = i*chunkBytes;
    const expectedSize = Math.min(chunkBytes,size-offset);
    if(row.status !== 'cached' || !/^https:\/\//i.test(String(row.storage_url || ''))
      || Number(row.offset)!==offset || Number(row.byte_size)!==expectedSize
      || Number(row.source_size)!==size) continue;
    chunks[i]={index:i,offset,size:expectedSize,url:row.storage_url,sha256:row.sha256 || ''};
  }
  return chunks;
}

export function missingRegisteredJediArchives(byName) {
  return REQUIRED_JEDI_ARCHIVES.filter(name => !byName.has(name));
}

export function originalArchiveManifest(byName, allCached, chunkBytes = JEDI_ARCHIVE_CHUNK_BYTES) {
  const missing = missingRegisteredJediArchives(byName);
  if (missing.length) throw new Error('Original game archives are not registered in Admin → Game Rebuilds: '+missing.join(', ')+'.');
  return REQUIRED_JEDI_ARCHIVES.map(name=>{
    const archive=byName.get(name);
    const chunks=collectCachedArchiveChunks(archive,allCached,chunkBytes);
    if (!chunks.length || chunks.some(chunk => !chunk?.url)) throw new Error(name+': incomplete archive cache.');
    const size=Number(archive.byte_size);
    const bytes=chunks.reduce((n,c)=>n+c.size,0);
    if(bytes!==size)throw new Error(name+': downloaded archive size mismatch.');
    return {name,size,sourceAssetId:archive.id || null,chunks};
  });
}
