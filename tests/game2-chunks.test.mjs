import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchGame2Binary, GAME2_SPLIT_ASSETS } from '../src/components/game2/engine/chunked.js';

const response = (buf, ok = true, contentType = 'application/octet-stream') => ({
  ok, status: ok ? 200 : 404, headers: { get: key => key === 'content-type' ? contentType : null },
  arrayBuffer: async () => Uint8Array.from(buf).buffer,
});

for (const [file, { count, bytes }] of Object.entries(GAME2_SPLIT_ASSETS)) {
  test(`${file}: streamed binary parts reassemble byte-for-byte`, async () => {
    const original = Buffer.allocUnsafe(bytes);
    for (let i = 0; i < bytes; i++) original[i] = i % 251;
    const chunkSize = 786432; // per GitHub blob, 1,048,576 Base64 characters
    const expectedParts = Array.from({ length: count }, (_, i) => original.subarray(i * chunkSize, (i + 1) * chunkSize));
    assert.ok(expectedParts.every(b => b.length));
    const urls = [];
    const fetched = await fetchGame2Binary(`https://game.invalid/game2/${file}`, async url => {
      urls.push(url);
      const match = /\.(\d{3})$/.exec(url);
      return match ? response(expectedParts[Number(match[1])]) : response([], false);
    });
    assert.equal(Buffer.compare(Buffer.from(fetched), original), 0);
    assert.equal(urls.length, count);
  });
}

test('an installed unsplit asset falls back when the part folder is absent', async () => {
  const original = Uint8Array.from([1, 2, 3, 4]);
  const result = await fetchGame2Binary('https://game.invalid/game2/Explorer_G2_Game.glb', async url =>
    url.includes('/parts/') ? response([], false) : response(original));
  assert.deepEqual(Array.from(new Uint8Array(result)), Array.from(original));
});

test('an HTML SPA fallback is not mistaken for a binary chunk', async () => {
  const original = Uint8Array.from([8, 9, 10]);
  const result = await fetchGame2Binary('https://game.invalid/game2/bank_q.bin.gz', async url =>
    url.includes('/parts/') ? response([], true, 'text/html') : response(original));
  assert.deepEqual(Array.from(new Uint8Array(result)), Array.from(original));
});
