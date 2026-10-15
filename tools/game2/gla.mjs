// Ghoul2 skeletal animation (.gla, MDXA version 6: Jedi Outcast / Jedi Academy) and animation.cfg readers.
// Reads the user's own game files; nothing they produce is committed (see ja-anim-bank.mjs).
//
// MDXA v6 layout (OpenJK mdx_format.h): header { ident '2LGA', version, name[64], fScale, numFrames, ofsFrames, numBones,
// ofsCompBonePool, ofsSkel, ofsEnd } (100 bytes); then numBones offsets (relative to the end of the header), each bone { name[64], flags,
// parent, BasePoseMat[3][4], BasePoseMatInv[3][4], numChildren, children[] }; frames: numFrames x numBones 24-bit indices
// into the pool of 14-byte compressed bones (MC_UnCompressQuat: 4 x u16 quaternion w x y z = v / 16383 - 2, then 3 x u16
// translation = v / 64 - 512).

export function readGla(buf) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength), i32 = o => dv.getInt32(o, true), f32 = o => dv.getFloat32(o, true);
  const ident = buf.toString('latin1', 0, 4), version = i32(4);
  if (ident !== '2LGA' || version !== 6) throw new Error('not a Ghoul2 MDXA v6 animation file (' + ident + ' v' + version + ')');
  const name = buf.toString('latin1', 8, 72).replace(/\0.*$/s, ''), scale = f32(72);
  const numFrames = i32(76), ofsFrames = i32(80), numBones = i32(84), ofsPool = i32(88), HEADER = 100;
  const bones = [];
  for (let b = 0; b < numBones; b++) { // the bone offset table follows the 100-byte header; offsets count from there
    const o = HEADER + i32(HEADER + b * 4);
    const mat = k => { const m = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) m.push(f32(k + (r * 4 + c) * 4)); return m; };
    bones.push({ name: buf.toString('latin1', o, o + 64).replace(/\0.*$/s, ''), flags: dv.getUint32(o + 64, true), parent: i32(o + 68), base: mat(o + 72), baseInv: mat(o + 120) });
  }
  // the compressed bone a frame uses for a bone
  const comp = (frame, bone) => { const p = ofsFrames + (frame * numBones + bone) * 3, idx = buf[p] | (buf[p + 1] << 8) | (buf[p + 2] << 16); return ofsPool + idx * 14; };
  const quat = (frame, bone) => { const o = comp(frame, bone); return [0, 1, 2, 3].map(k => dv.getUint16(o + k * 2, true) / 16383 - 2); }; // w x y z
  const trans = (frame, bone) => { const o = comp(frame, bone) + 8; return [0, 1, 2].map(k => dv.getUint16(o + k * 2, true) / 64 - 512); };
  return { name, scale, numFrames, numBones, bones, quat, trans };
}

// animation.cfg: "NAME first count loopFrames fps" per line (// comments); loopFrames -1 = plays once
export function readAnimationCfg(text) {
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    const s = line.replace(/\/\/.*$/, '').trim(); if (!s) continue;
    const [name, first, n, loop, fps] = s.split(/\s+/); if (!/^[A-Z]/.test(name) || fps === undefined) continue;
    out.push({ name, first: +first, n: +n, loop: +loop, fps: +fps });
  }
  return out;
}
