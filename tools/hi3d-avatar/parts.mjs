// Flood a connected surface inside a spatial envelope. Welding matching UV-seam
// vertices prevents the same physical surface receiving inconsistent weights.
export function surfaceMask(positions, indices, inside, seed) {
  const count = positions.length / 3, parent = new Int32Array(count), allowed = new Uint8Array(count);
  for (let i = 0; i < count; i++) { parent[i] = i; allowed[i] = Number(inside(...positions.subarray(i * 3, i * 3 + 3))); }
  const root = i => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  const union = (a, b) => { if (allowed[a] && allowed[b]) parent[root(a)] = root(b); };
  const seam = new Map();
  for (let i = 0; i < count; i++) if (allowed[i]) {
    const key = Array.from(positions.subarray(i * 3, i * 3 + 3), x => Math.round(x * 1e5)).join(',');
    if (seam.has(key)) union(i, seam.get(key)); else seam.set(key, i);
  }
  for (let i = 0; i < indices.length; i += 3) { union(indices[i], indices[i + 1]); union(indices[i + 1], indices[i + 2]); union(indices[i + 2], indices[i]); }
  let nearest = -1, distance = Infinity;
  for (let i = 0; i < count; i++) if (allowed[i]) {
    const d = seed.reduce((sum, x, c) => sum + (positions[i * 3 + c] - x) ** 2, 0);
    if (d < distance) { nearest = i; distance = d; }
  }
  if (nearest < 0) throw new Error('No vertex in the part envelope');
  const group = root(nearest), mask = new Uint8Array(count);
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]; let selected = 0;
  for (let i = 0; i < count; i++) if (allowed[i] && root(i) === group) {
    mask[i] = 1; selected++;
    for (let c = 0; c < 3; c++) { min[c] = Math.min(min[c], positions[i * 3 + c]); max[c] = Math.max(max[c], positions[i * 3 + c]); }
  }
  console.log(JSON.stringify({ surfaceSeed: seed, selected, min, max }));
  return mask;
}
