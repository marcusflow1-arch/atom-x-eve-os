// Rebuild the uploaded mesh with its UVs and materials intact. Run with Node 20+.
import fs from 'node:fs';
import { MeshoptSimplifier } from 'meshoptimizer';
import { readGLB, builder } from './glb.mjs';

const [input, output, target = '100000'] = process.argv.slice(2);
if (!input || !output) throw new Error('Usage: node optimize.mjs input.glb output.glb [triangles]');
const source = readGLB(input), j = structuredClone(source.json), primitive = j.meshes[0].primitives[0];
const p = source.accessor(primitive.attributes.POSITION), uv = source.accessor(primitive.attributes.TEXCOORD_0);
const n = source.accessor(primitive.attributes.NORMAL), indices = source.accessor(primitive.indices);
await MeshoptSimplifier.ready;
MeshoptSimplifier.useExperimentalFeatures = true;
const attributes = new Float32Array(p.length / 3 * 5);
for (let i = 0; i < p.length / 3; i++) {
  attributes.set(n.subarray(i * 3, i * 3 + 3), i * 5);
  attributes.set(uv.subarray(i * 2, i * 2 + 2), i * 5 + 3);
}
console.log(`Simplifying ${indices.length / 3} triangles, preserving normals and UV coordinates`);
const [reduced, error] = MeshoptSimplifier.simplifyWithAttributes(indices, p, 3, attributes, 5, [.025, .025, .025, .1, .1], null, Number(target) * 3, .006);
const [remap, count] = MeshoptSimplifier.compactMesh(reduced);
function compact(values, width) {
  const result = new Float32Array(count * width);
  for (let i = 0; i < remap.length; i++) if (remap[i] !== 0xffffffff) result.set(values.subarray(i * width, (i + 1) * width), remap[i] * width);
  return result;
}
const b = builder(j);
primitive.attributes = { POSITION: b.addAccessor(compact(p, 3), 'VEC3', 34962, true), NORMAL: b.addAccessor(compact(n, 3), 'VEC3', 34962), TEXCOORD_0: b.addAccessor(compact(uv, 2), 'VEC2', 34962) };
primitive.indices = b.addAccessor(reduced, 'SCALAR', 34963);
for (let i = 0; i < j.images.length; i++) j.images[i].bufferView = b.addView(source.view(source.json.images[i].bufferView));
j.asset.generator = 'Hi3D source; meshoptimizer UV-aware reduction';
j.asset.extras = { sourceTriangles: indices.length / 3, triangles: reduced.length / 3, simplificationError: error };
b.write(output);
console.log(JSON.stringify({ triangles: reduced.length / 3, vertices: count, error, bytes: fs.statSync(output).size }));
