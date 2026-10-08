/* eslint-disable */
// Game 2 binary assets are delivered in Git-sized chunks on the reconstruction branch.
// A source ZIP can still contain the original, unsplit filenames; both formats work.
export const GAME2_SPLIT_ASSETS = Object.freeze({
  'Explorer_G2_Game.glb': { count: 19, bytes: 14442748 },
  'bank_q.bin.gz': { count: 5, bytes: 3810195 },
});

export async function fetchGame2Binary(url, request = (...args) => fetch(...args)) {
  const clean = url.split(/[?#]/)[0];
  const filename = clean.slice(clean.lastIndexOf('/') + 1);
  const spec = GAME2_SPLIT_ASSETS[filename];
  if (spec) {
    const base = clean.slice(0, -filename.length);
    const makeUrl = i => `${base}parts/${filename}.${String(i).padStart(3, '0')}`;
    const first = await request(makeUrl(0));
    // Some SPA hosts send the HTML entrypoint as a 200 for missing files.
    const fallbackHtml = first.headers?.get?.('content-type')?.includes('text/html');
    if (first.ok && !fallbackHtml) {
      const others = await Promise.all(Array.from({ length: spec.count - 1 }, (_, index) => request(makeUrl(index + 1))));
      for (let i = 0; i < others.length; i++) {
        if (!others[i].ok || others[i].headers?.get?.('content-type')?.includes('text/html')) {
          throw new Error(`Game 2 missing binary chunk: ${makeUrl(i + 1)} (${others[i].status})`);
        }
      }
      const buffers = await Promise.all([first, ...others].map(r => r.arrayBuffer()));
      const bytes = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
      if (bytes !== spec.bytes) throw new Error(`Game 2 damaged ${filename}: got ${bytes} bytes, expected ${spec.bytes}`);
      const merged = new Uint8Array(bytes);
      let offset = 0;
      for (const buf of buffers) { merged.set(new Uint8Array(buf), offset); offset += buf.byteLength; }
      return merged.buffer;
    }
    if (!fallbackHtml && first.status !== 404) {
      throw new Error(`Game 2 failed to fetch ${makeUrl(0)} (${first.status})`);
    }
  }
  const response = await request(url);
  if (!response.ok || response.headers?.get?.('content-type')?.includes('text/html')) {
    throw new Error(`Game 2 asset fetch failed: ${url} (${response.status})`);
  }
  return response.arrayBuffer();
}
