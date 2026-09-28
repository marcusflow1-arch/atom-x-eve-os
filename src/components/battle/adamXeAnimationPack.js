import * as THREE from 'three';
import maleAttackPack from './adamXeMaleAttack.b64?raw';
import maleUltimatePack from './adamXeMaleUltimate.b64?raw';
import femaleUltimatePack from './adamXeFemaleUltimate.b64?raw';

// The current hosted Adam/Artemis meshes predate the user's enhanced GLBs, but
// their named skeleton joints are identical. These packs contain the exact
// skeletal channels authored in the enhanced files, half-float + gzip packed.
// We merge them over the hosted GLTF animation list at runtime so the visible
// avatar stays the same while the new authored Chidori motion is available.
const decoded = new Map();
const clipCache = new Map();

function base64Bytes(value) {
  const binary = atob(String(value || '').replace(/\s+/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function decodePack(encoded) {
  const key = String(encoded || '').replace(/\s+/g, '');
  if (decoded.has(key)) return decoded.get(key);
  const promise = (async () => {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('This browser cannot decode the Adam XE animation pack.');
    }
    const zipped = base64Bytes(key);
    const stream = new Blob([zipped]).stream().pipeThrough(new DecompressionStream('gzip'));
    const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const headerLength = view.getUint32(0, true);
    const headerStart = 4;
    const bodyStart = headerStart + headerLength;
    const header = JSON.parse(new TextDecoder().decode(bytes.subarray(headerStart, bodyStart)));
    return { header, bytes, bodyStart };
  })();
  decoded.set(key, promise);
  return promise;
}

function halfFloats(pack, accessor) {
  const [offset, count] = accessor;
  const view = new DataView(
    pack.bytes.buffer,
    pack.bytes.byteOffset + pack.bodyStart + Number(offset || 0),
    Number(count || 0) * 2,
  );
  const values = new Float32Array(Number(count || 0));
  for (let i = 0; i < values.length; i += 1) values[i] = THREE.DataUtils.fromHalfFloat(view.getUint16(i * 2, true));
  return values;
}

function trackFromRow(row, accessors, pack) {
  const [node, path, interpolation, inputIndex, outputIndex] = row;
  const times = halfFloats(pack, accessors[inputIndex]);
  const values = halfFloats(pack, accessors[outputIndex]);
  const property = path === 'translation' ? 'position' : path === 'rotation' ? 'quaternion' : path;
  const Track = path === 'rotation' ? THREE.QuaternionKeyframeTrack : THREE.VectorKeyframeTrack;
  const track = new Track(`${node}.${property}`, times, values);
  track.setInterpolation(interpolation === 'STEP' ? THREE.InterpolateDiscrete : THREE.InterpolateLinear);
  return track;
}

async function clipsFromPack(encoded, gender) {
  const cacheKey = `${gender}:${String(encoded || '').length}:${String(encoded || '').slice(-24)}`;
  if (clipCache.has(cacheKey)) return clipCache.get(cacheKey);
  const promise = (async () => {
    const pack = await decodePack(encoded);
    const source = pack.header?.[gender] || {};
    return Object.entries(source).map(([name, spec]) => new THREE.AnimationClip(
      name,
      -1,
      (spec.t || []).map((row) => trackFromRow(row, spec.a || [], pack)),
    ));
  })();
  clipCache.set(cacheKey, promise);
  return promise;
}

export async function loadAdamXeInjectedClips(gender = 'male') {
  if (String(gender).toLowerCase() === 'female') {
    return clipsFromPack(femaleUltimatePack, 'female');
  }
  const packs = await Promise.all([
    clipsFromPack(maleAttackPack, 'male'),
    clipsFromPack(maleUltimatePack, 'male'),
  ]);
  return packs.flat();
}

const PACKED_CLIP_NAMES = {
  male: ['Chidori_Attack_01', 'Chidori_Ultimate'],
  female: ['Chidori_Ultimate'],
};

export async function mergeAdamXeInjectedClips(animations = [], gender = 'male') {
  const list = (animations || []).filter(Boolean);
  const byName = new Map(list.map((clip) => [String(clip.name || ''), clip]));
  const key = String(gender).toLowerCase() === 'female' ? 'female' : 'male';
  // The current character GLBs (public/models/characters) already contain the
  // authored Chidori clips at full precision. The packs are only a fallback for
  // an older body that lacks them; never replace a clip the model already has.
  if (PACKED_CLIP_NAMES[key].every((name) => byName.has(name))) return list;
  const injected = await loadAdamXeInjectedClips(key);
  injected.forEach((clip) => {
    const name = String(clip.name || '');
    if (!byName.has(name)) byName.set(name, clip);
  });
  return [...byName.values()];
}
