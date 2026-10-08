import { base44 } from '@/api/base44Client';

function unwrap(result) {
  return result?.data ?? result;
}

export async function importCanonicalJediAsset(path, category = 'runtime_asset') {
  const response = unwrap(await base44.functions.invoke('jediOutcastSource', {
    action: 'importPath',
    path,
    category,
  }));
  if (!response?.success || !response?.asset?.storage_url) {
    throw new Error(response?.error || `${path}: canonical retail asset could not be imported.`);
  }
  return response.asset;
}

export async function fetchCanonicalJediAsset(path, category = 'runtime_asset') {
  const asset = await importCanonicalJediAsset(path, category);
  const response = await fetch(asset.storage_url, { credentials: 'omit' });
  if (!response.ok) throw new Error(`${path}: imported asset fetch failed (HTTP ${response.status}).`);
  return { asset, buffer: await response.arrayBuffer() };
}

export async function getCanonicalJediAssetUrl(path, category = 'runtime_asset') {
  const asset = await importCanonicalJediAsset(path, category);
  return asset.storage_url;
}
