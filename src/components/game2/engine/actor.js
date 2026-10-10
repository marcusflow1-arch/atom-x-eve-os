/* eslint-disable */
// Actor = one skinned character: two animation layers (legs / torso) on the Ghoul2 _humanoid skeleton,
// frame interpolation + cross-fades, legs/torso yaw twist, forward kinematics and skin matrices.
import { G2Rig } from './g2anim.js';
import { m4, q as Q, clamp } from './math.js';

const gx = v => [v[0], v[2], -v[1]]; // G2 (X left, Y back, Z up) -> glTF (X left, Y up, Z front)

export class Skeleton {            // shared, immutable data
  constructor(rigJson, qBank, pelBank, glb) {
    this.rigJson = rigJson; this.qBank = qBank; this.pelBank = pelBank;
    const R = rigJson.rig; this.R = R;
    const names = ['model_root', ...R.nestOrder];
    if (glb) { // verify joint order against the GLB skin
      const sk = glb.json.skins[0]; const gl = sk.joints.map(i => glb.json.nodes[i].name);
      for (let i = 0; i < names.length; i++) if (gl[i] !== names[i]) throw new Error('joint order mismatch at ' + i + ' ' + gl[i] + ' vs ' + names[i]);
    }
    this.names = names; this.n = names.length; this.idx = {}; names.forEach((n, i) => this.idx[n] = i);
    this.parent = names.map(n => n === 'model_root' ? -1 : this.idx[R.nest[n]]);
    this.restW = names.map(n => gx(R.rest[n]));
    this.restL = names.map((n, i) => this.parent[i] < 0 ? [0, 0, 0] : gx(R.rest[n].map((v, k) => v - R.rest[R.nest[n]][k])));
    const tr = this.idx['lower_lumbar'];
    this.isTorso = new Uint8Array(this.n);
    for (let i = 0; i < this.n; i++) { let c = i; while (c >= 0) { if (c === tr) { this.isTorso[i] = 1; break; } c = this.parent[c]; } }
    this.anims = {}; rigJson.anims.forEach(a => this.anims[a.name] = a);
    // Jedi Outcast torso aim (cg_players.c CG_G2PlayerAngles): the torso/view offset from the legs is spread over the
    // spine, 30% lower_lumbar, 30% upper_lumbar, 40% thoracic, so attack swings follow the mouse in yaw and pitch.
    this.spineW = new Float32Array(this.n); for (const [b, w] of [['lower_lumbar', 0.3], ['upper_lumbar', 0.3], ['thoracic', 0.4]]) if (this.idx[b] != null) this.spineW[this.idx[b]] = w;
  }
}

// fractional frame: returns [fa, fb, frac]
const _ff = [0, 0, 0];
export function frameFrac(a, t, loop) {
  const n = a.n; if (n <= 1) { _ff[0] = _ff[1] = a.first; _ff[2] = 0; return _ff; }
  const fps = Math.abs(a.fps) || 20; let k = t * fps; const rev = a.fps < 0;
  if (loop && a.loop >= 0) {
    const L = a.loop, span = Math.max(1, n - L);
    if (!rev) { if (k >= n) k = L + ((k - L) % span); }
    else { k = ((k % n) + n) % n; }
  } else k = clamp(k, 0, n - 1);
  const k0 = Math.floor(k); let f = k - k0; let k1 = k0 + 1;
  if (k1 >= n) { if (loop && a.loop >= 0 && !rev) k1 = a.loop; else { k1 = n - 1; f = 0; } }
  if (rev) { const r0 = (n - 1) - k0, r1 = (n - 1) - k1; _ff[0] = a.first + clamp(r0, 0, n - 1); _ff[1] = a.first + clamp(r1, 0, n - 1); }
  else { _ff[0] = a.first + k0; _ff[1] = a.first + k1; }
  _ff[2] = f; return _ff;
}

export class Layer {
  constructor() { this.cur = null; this.prev = null; this.blendStart = 0; this.blendDur = 0; this.name = ''; this.timer = 0; }
  // st = {anim, t0, speed, loop}
  play(skel, name, now, o = {}) {
    const a = skel.anims[name]; if (!a) { console.warn('missing anim', name); return false; }
    if (!o.restart && this.cur && this.cur.anim === a) {
      const sp = o.speed ?? 1;
      if (this.cur.speed !== sp) { const tt = (now - this.cur.t0) * this.cur.speed; this.cur.speed = sp; this.cur.t0 = now - tt / sp; }
      return true;
    }
    if (this.cur) this.prev = this.cur;
    const looping = o.loop ?? (a.loop >= 0);
    this.cur = { anim: a, t0: now - (o.startAt || 0), speed: o.speed ?? 1, loop: looping };
    this.blendStart = now; this.blendDur = (o.blend ?? 0.12); this.name = name;
    return true;
  }
  w(now) { return this.blendDur > 0 ? clamp((now - this.blendStart) / this.blendDur, 0, 1) : 1; }
}

const _A = [], _B = [];
export class Actor {
  constructor(skel, opts = {}) {
    this.skel = skel; this.rig = new G2Rig(skel.rigJson, skel.qBank, skel.pelBank);
    this.legs = new Layer(); this.torso = new Layer(); this.torsoFollow = true;
    this.pos = [0, 0, 0]; this.yaw = 0; this.legYaw = 0; this.now = 0; this.animSpeed = 1;
    this.spineYaw = 0; this.spinePitch = 0; // torso aim relative to the legs (radians; + yaw = left, + pitch = down)
    this.tint = opts.tint || [1, 1, 1]; this.tintAmt = 0;
    const N = skel.n; this.nBones = N;
    this.lq = Array.from({ length: N }, () => [0, 0, 0, 1]);     // local quats (blended)
    this.pelvis = [0, 0, 0];
    this.skin = new Float32Array(64 * 16);                       // skin matrices (character space)
    this.Rw = new Float64Array(N * 9); this.Pw = new Float64Array(N * 3); // char-space bone rotation/position
    this.model = m4.ident();
    this.tmpR = new Float64Array(9);
    for (let i = 0; i < 64; i++) { this.skin[i * 16] = this.skin[i * 16 + 5] = this.skin[i * 16 + 10] = this.skin[i * 16 + 15] = 1; }
    this.poseA = Array.from({ length: N }, () => [0, 0, 0, 1]); this.poseB = Array.from({ length: N }, () => [0, 0, 0, 1]);
    this.pelA = [0, 0, 0]; this.pelB = [0, 0, 0];
  }
  setLegs(name, o = {}) { return this.legs.play(this.skel, name, this.now, { speed: this.animSpeed, ...o }); }
  setTorso(name, o = {}) { this.torsoFollow = false; return this.torso.play(this.skel, name, this.now, { speed: this.animSpeed, ...o }); }
  followLegs() { if (!this.torsoFollow) { this.torsoFollow = true; } }
  setBoth(name, o = {}) { this.setLegs(name, o); this.setTorso(name, { ...o, restart: o.restart }); }
  // sample a layer state at `now` into frame descriptors
  _sample(st, now) { const t = (now - st.t0) * st.speed; const r = frameFrac(st.anim, t, st.loop); return [r[0], r[1], r[2]]; }
  _evalPose(lSt, tSt, now, outQ, outPel) {
    const rig = this.rig, N = this.nBones;
    const l = this._sample(lSt, now), t = this._sample(tSt, now);
    rig.evaluate(l[0], t[0]); this._grab(rig, this.poseA, this.pelA);
    if (l[2] > 1e-4 || t[2] > 1e-4) {
      rig.evaluate(l[1], t[1]); this._grab(rig, this.poseB, this.pelB);
      for (let i = 1; i < N; i++) { const f = this.skel.isTorso[i] ? t[2] : l[2]; if (f > 1e-4) Q.slerp(this.poseA[i], this.poseB[i], f, outQ[i]); else { const a = this.poseA[i], o = outQ[i]; o[0] = a[0]; o[1] = a[1]; o[2] = a[2]; o[3] = a[3]; } }
      for (let k = 0; k < 3; k++) outPel[k] = this.pelA[k] + (this.pelB[k] - this.pelA[k]) * l[2];
    } else {
      for (let i = 1; i < N; i++) { const a = this.poseA[i], o = outQ[i]; o[0] = a[0]; o[1] = a[1]; o[2] = a[2]; o[3] = a[3]; }
      outPel[0] = this.pelA[0]; outPel[1] = this.pelA[1]; outPel[2] = this.pelA[2];
    }
  }
  _grab(rig, outQ, outPel) { // rig.localQ is in nest order (= skeleton index-1)
    for (let i = 0; i < rig.localQ.length; i++) { const s = rig.localQ[i], o = outQ[i + 1]; o[0] = s[0]; o[1] = s[1]; o[2] = s[2]; o[3] = s[3]; }
    outPel[0] = rig.pelvisPos[0]; outPel[1] = rig.pelvisPos[1]; outPel[2] = rig.pelvisPos[2];
  }
  update(now) {
    this.now = now; const sk = this.skel, N = this.nBones;
    if (!this.legs.cur) this.setLegs('BOTH_STAND1');
    const lc = this.legs.cur, tc = this.torsoFollow || !this.torso.cur ? lc : this.torso.cur;
    // current pose
    if (!this._cq) { this._cq = Array.from({ length: N }, () => [0, 0, 0, 1]); this._cp = [0, 0, 0]; this._pq = Array.from({ length: N }, () => [0, 0, 0, 1]); this._pp = [0, 0, 0]; }
    this._evalPose(lc, tc, now, this._cq, this._cp);
    const wl = this.legs.w(now), wt = this.torsoFollow ? wl : this.torso.w(now);
    const lp = this.legs.prev, tp = this.torsoFollow ? this.legs.prev : this.torso.prev;
    if ((wl < 1 && lp) || (wt < 1 && tp)) {
      this._evalPose(lp || lc, tp || tc, now, this._pq, this._pp);
      for (let i = 1; i < N; i++) { const w = sk.isTorso[i] ? wt : wl; Q.slerp(this._pq[i], this._cq[i], w, this.lq[i]); }
      for (let k = 0; k < 3; k++) this.pelvis[k] = this._pp[k] + (this._cp[k] - this._pp[k]) * wl;
    } else {
      for (let i = 1; i < N; i++) { const a = this._cq[i], o = this.lq[i]; o[0] = a[0]; o[1] = a[1]; o[2] = a[2]; o[3] = a[3]; }
      this.pelvis[0] = this._cp[0]; this.pelvis[1] = this._cp[1]; this.pelvis[2] = this._cp[2];
    }
    this.fk();
  }
  fk() {
    const sk = this.skel, N = this.nBones, Rw = this.Rw, Pw = this.Pw, par = sk.parent;
    const root = sk.restW[0]; Rw[0] = 1; Rw[1] = 0; Rw[2] = 0; Rw[3] = 0; Rw[4] = 1; Rw[5] = 0; Rw[6] = 0; Rw[7] = 0; Rw[8] = 1; Pw[0] = root[0]; Pw[1] = root[1]; Pw[2] = root[2];
    const R = this.tmpR;
    for (let i = 1; i < N; i++) {
      const p = par[i], q = this.lq[i]; const x = q[0], y = q[1], z = q[2], w = q[3];
      R[0] = 1 - 2 * (y * y + z * z); R[1] = 2 * (x * y - w * z); R[2] = 2 * (x * z + w * y);
      R[3] = 2 * (x * y + w * z); R[4] = 1 - 2 * (x * x + z * z); R[5] = 2 * (y * z - w * x);
      R[6] = 2 * (x * z - w * y); R[7] = 2 * (y * z + w * x); R[8] = 1 - 2 * (x * x + y * y);
      const t = (i === 1) ? this.pelvisLocal() : sk.restL[i]; const pb = p * 9;
      Pw[i * 3] = Pw[p * 3] + Rw[pb] * t[0] + Rw[pb + 1] * t[1] + Rw[pb + 2] * t[2];
      Pw[i * 3 + 1] = Pw[p * 3 + 1] + Rw[pb + 3] * t[0] + Rw[pb + 4] * t[1] + Rw[pb + 5] * t[2];
      Pw[i * 3 + 2] = Pw[p * 3 + 2] + Rw[pb + 6] * t[0] + Rw[pb + 7] * t[1] + Rw[pb + 8] * t[2];
      const o = i * 9;
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) Rw[o + r * 3 + c] = Rw[pb + r * 3] * R[c] + Rw[pb + r * 3 + 1] * R[3 + c] + Rw[pb + r * 3 + 2] * R[6 + c];
      const sw = sk.spineW[i];
      if (sw && (this.spineYaw || this.spinePitch)) { // E = Ry(yaw) * Rx(pitch), applied about this bone in model space
        const a = this.spineYaw * sw, b = this.spinePitch * sw, cy = Math.cos(a), sy = Math.sin(a), cx = Math.cos(b), sx = Math.sin(b);
        const E0 = cy, E1 = sy * sx, E2 = sy * cx, E4 = cx, E5 = -sx, E6 = -sy, E7 = cy * sx, E8 = cy * cx;
        for (let c = 0; c < 3; c++) { const m0 = Rw[o + c], m1 = Rw[o + 3 + c], m2 = Rw[o + 6 + c]; Rw[o + c] = E0 * m0 + E1 * m1 + E2 * m2; Rw[o + 3 + c] = E4 * m1 + E5 * m2; Rw[o + 6 + c] = E6 * m0 + E7 * m1 + E8 * m2; }
      }
    }
    // legs yaw twist (torso keeps facing, legs/pelvis turn by legYaw)
    if (Math.abs(this.legYaw) > 1e-4) {
      const c = Math.cos(this.legYaw), s = Math.sin(this.legYaw); // rotation about +Y
      const llI = sk.idx['lower_lumbar']; const lx = Pw[llI * 3], lz = Pw[llI * 3 + 2];
      const dx = c * lx + s * lz - lx, dz = -s * lx + c * lz - lz;
      for (let i = 0; i < N; i++) {
        if (sk.isTorso[i]) { Pw[i * 3] += dx; Pw[i * 3 + 2] += dz; }
        else {
          const px = Pw[i * 3], pz = Pw[i * 3 + 2]; Pw[i * 3] = c * px + s * pz; Pw[i * 3 + 2] = -s * px + c * pz;
          const o = i * 9; for (let col = 0; col < 3; col++) { const a = Rw[o + col], b = Rw[o + 6 + col]; Rw[o + col] = c * a + s * b; Rw[o + 6 + col] = -s * a + c * b; }
        }
      }
    }
    // skin matrices
    const S = this.skin;
    for (let i = 0; i < N; i++) {
      const o = i * 9, rw = sk.restW[i], k = i * 16;
      S[k] = Rw[o]; S[k + 1] = Rw[o + 3]; S[k + 2] = Rw[o + 6]; S[k + 3] = 0;
      S[k + 4] = Rw[o + 1]; S[k + 5] = Rw[o + 4]; S[k + 6] = Rw[o + 7]; S[k + 7] = 0;
      S[k + 8] = Rw[o + 2]; S[k + 9] = Rw[o + 5]; S[k + 10] = Rw[o + 8]; S[k + 11] = 0;
      S[k + 12] = Pw[i * 3] - (Rw[o] * rw[0] + Rw[o + 1] * rw[1] + Rw[o + 2] * rw[2]);
      S[k + 13] = Pw[i * 3 + 1] - (Rw[o + 3] * rw[0] + Rw[o + 4] * rw[1] + Rw[o + 5] * rw[2]);
      S[k + 14] = Pw[i * 3 + 2] - (Rw[o + 6] * rw[0] + Rw[o + 7] * rw[1] + Rw[o + 8] * rw[2]);
      S[k + 15] = 1;
    }
    m4.fromYaw(this.yaw, this.pos, this.model);
  }
  pelvisLocal() { return this.pelvis; }
  // bone world matrix (rotation+position, no scale) in world space
  boneMatrix(name, out = new Float32Array(16)) {
    const i = this.skel.idx[name], o = i * 9, M = new Float32Array(16);
    M[0] = this.Rw[o]; M[1] = this.Rw[o + 3]; M[2] = this.Rw[o + 6]; M[4] = this.Rw[o + 1]; M[5] = this.Rw[o + 4]; M[6] = this.Rw[o + 7]; M[8] = this.Rw[o + 2]; M[9] = this.Rw[o + 5]; M[10] = this.Rw[o + 8];
    M[12] = this.Pw[i * 3]; M[13] = this.Pw[i * 3 + 1]; M[14] = this.Pw[i * 3 + 2]; M[15] = 1;
    return m4.mul(this.model, M, out);
  }
  bonePos(name, out = [0, 0, 0]) { const i = this.skel.idx[name]; return m4.transformPoint(this.model, [this.Pw[i * 3], this.Pw[i * 3 + 1], this.Pw[i * 3 + 2]], out); }
}
