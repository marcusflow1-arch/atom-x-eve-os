import { base44 } from '@/api/base44Client';

let canonicalMaleAssetPromise = null;
let canonicalMaleAssetUrl = '';

export function getResolvedGetsugaMaleAssetUrl() {
  return canonicalMaleAssetUrl;
}

export function resolveGetsugaMaleAsset() {
  if (canonicalMaleAssetUrl) return Promise.resolve(canonicalMaleAssetUrl);
  if (!canonicalMaleAssetPromise) {
    canonicalMaleAssetPromise = base44.functions.invoke('ensureGetsugaMaleAsset', {})
      .then((result) => {
        const payload = result?.data ?? result ?? {};
        const url = payload.file_url || payload.modelUrl || payload.url || '';
        if (!url) throw new Error(payload.error || 'Getsuga male model asset was not returned by Base44.');
        canonicalMaleAssetUrl = url;
        return url;
      })
      .catch((error) => {
        canonicalMaleAssetPromise = null;
        throw error;
      });
  }
  return canonicalMaleAssetPromise;
}
