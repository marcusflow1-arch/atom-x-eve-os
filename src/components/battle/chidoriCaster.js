import * as THREE from 'three';
import { createChidoriFx } from './chidoriFx';

// Timeline of the authored Chidori_Ultimate clip (seconds from cast start).
// Both character GLBs carry the same clip; the clip itself is in place, so the
// dash across the court and the return are driven procedurally.
export const CHIDORI_TIMING = {
  dashStart: 1.42, // charge ends, the caster launches
  impact: 2.0, // strike connects: the target starts Chidori_Hit_Stun_Fall
  blast: 2.35, // the target is thrown back
  returnStart: 3.3, // caster leaps back across the net to their own side
  returnEnd: 3.95,
  end: 4.2,
};
export const CHIDORI_REACTION_CLIP = 'Chidori_Hit_Stun_Fall';
// Where the caster stops in front of the target (metres, centre to centre).
export const CHIDORI_STRIKE_GAP = 0.95;

export function isChidoriCast(skillOrEffect = {}, effectId = '') {
  const effect = skillOrEffect?.animation_effect || skillOrEffect || {};
  const id = String(effectId || skillOrEffect?.effect_id || effect?.id || '').trim().toLowerCase();
  const clip = String(skillOrEffect?.clip_name || effect?.clip_name || effect?.clipName || '').trim().toLowerCase();
  return id === 'chidori' || id.endsWith('chidori_ultimate') || clip === 'chidori_ultimate';
}

const smooth = (a, b, x) => THREE.MathUtils.smoothstep(x, a, b);
const easeInQuad = (t) => t * t;
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2);
const easeOutCubic = (t) => 1 - (1 - t) ** 3;

/**
 * Caster displacement along the line to the target, as a fraction of the
 * available reach (0 = own spot, 1 = striking distance), plus a hop height for
 * the leap back.
 */
export function chidoriDashProgress(ta) {
  const { dashStart, impact, returnStart, returnEnd } = CHIDORI_TIMING;
  if (ta < dashStart) return { reach: 0, lift: 0 };
  if (ta < impact) return { reach: easeInQuad((ta - dashStart) / (impact - dashStart)), lift: 0 };
  if (ta < returnStart) return { reach: 1, lift: 0 };
  if (ta < returnEnd) {
    const u = (ta - returnStart) / (returnEnd - returnStart);
    return { reach: 1 - easeInOut(u), lift: Math.sin(Math.PI * u) * 0.45 };
  }
  return { reach: 0, lift: 0 };
}

/**
 * Target knock-back (metres, away from the caster) over the stun reaction,
 * tv = seconds since impact. The target is blasted back, stays down for the
 * fall, then walks back to their spot once the clip ends.
 */
export function chidoriKnockback(tv, distance = 1.35) {
  if (tv < 0.34) return 0;
  if (tv < 0.86) return distance * easeOutCubic((tv - 0.34) / 0.52);
  if (tv < 3.0) return distance;
  if (tv < 3.7) return distance * (1 - easeInOut((tv - 3.0) / 0.7));
  return 0;
}

function findBone(root, name) {
  if (!root) return null;
  const cache = root.userData.__chidoriBones || (root.userData.__chidoriBones = new Map());
  if (cache.has(name)) return cache.get(name);
  const wanted = String(name).toLowerCase();
  let match = null;
  root.traverse((node) => { if (!match && node.isBone && String(node.name || '').toLowerCase() === wanted) match = node; });
  cache.set(name, match);
  return match;
}

function boneWorld(actor, name) {
  const bone = findBone(actor?.model, name);
  if (bone) return bone.getWorldPosition(new THREE.Vector3());
  const base = (actor?.root || actor?.model)?.getWorldPosition?.(new THREE.Vector3()) || new THREE.Vector3();
  if (/head|neck/i.test(name)) base.y += 1.55;
  else if (/spine|pelvis/i.test(name)) base.y += 1.1;
  else if (/hand|arm|finger/i.test(name)) base.y += 0.95;
  else if (/foot|ball|calf|thigh/i.test(name)) base.y += 0.2;
  return base;
}

function forwardOf(actor) {
  const root = actor?.root || actor?.model;
  const q = root?.getWorldQuaternion?.(new THREE.Quaternion()) || new THREE.Quaternion();
  return new THREE.Vector3(0, 0, 1).applyQuaternion(q).setY(0).normalize();
}

function samplePath(samples, time, fallback) {
  if (!samples.length) return { palm: fallback.palm.clone(), tip: fallback.tip.clone() };
  if (time <= samples[0].t) return { palm: samples[0].palm.clone(), tip: samples[0].tip.clone() };
  const last = samples[samples.length - 1];
  if (time >= last.t) return { palm: last.palm.clone(), tip: last.tip.clone() };
  let lo = 0, hi = samples.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (samples[mid].t <= time) lo = mid; else hi = mid; }
  const a = samples[lo], b = samples[hi];
  const u = THREE.MathUtils.clamp((time - a.t) / Math.max(1e-4, b.t - a.t), 0, 1);
  return { palm: a.palm.clone().lerp(b.palm, u), tip: a.tip.clone().lerp(b.tip, u) };
}

function hideFromOutlinePass(group) {
  group.traverse((node) => {
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.filter(Boolean).forEach((material) => {
      material.userData = material.userData || {};
      material.userData.outlineParameters = { ...(material.userData.outlineParameters || {}), visible: false };
    });
  });
}

/**
 * Drives the supplied Chidori lightning FX for one cast at a time.
 *   actor = { model: skinned GLB root (bones), root: object that carries the facing, female }
 *   start({ attacker, victim?, startedAt? })  — victim omitted on the dashboard or on a miss
 *   update(now, camera) → screen-effect hints { flash, invert, shake, exposure, … } or null
 */
export function createChidoriCaster(scene, { lights = true } = {}) {
  let fx = null;
  let cast = null;

  // A fresh FX rig per cast: no stale ground scars/skids from the previous one,
  // and disposing it restores the target's electrified materials.
  const disposeFx = () => {
    if (!fx) return;
    const group = fx.group;
    fx.dispose();
    group.traverse((node) => {
      node.geometry?.dispose?.();
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.filter(Boolean).forEach((material) => material.dispose?.());
    });
    fx = null;
  };

  const stop = () => {
    cast = null;
    disposeFx();
  };

  return {
    start({ attacker, victim = null, startedAt = performance.now() } = {}) {
      if (!attacker?.model && !attacker?.root) return false;
      disposeFx();
      fx = createChidoriFx(THREE, scene, { lights });
      hideFromOutlinePass(fx.group);
      cast = { attacker, victim, startedAt, samples: [], victimRoots: [] };
      return true;
    },
    // Dodged/missed strike: the lightning still fires, the target is spared.
    // Call at or before impact (the target is not electrified before then).
    spareVictim() {
      if (cast) cast.victim = null;
    },
    active() { return Boolean(cast); },
    elapsed(now = performance.now()) { return cast ? (now - cast.startedAt) / 1000 : -1; },
    update(now, camera) {
      if (!cast || !fx || !camera) return null;
      const ta = (now - cast.startedAt) / 1000;
      if (ta > 4.6 || ta < -0.5) { stop(); return null; }
      const { attacker, victim } = cast;
      const hand = boneWorld(attacker, 'hand_r');
      const fingers = boneWorld(attacker, 'fingers_r');
      const palm = hand.clone().lerp(fingers, 0.55);
      const forward = forwardOf(attacker);
      let tip = palm.clone().addScaledVector(forward, 0.34);
      if (victim) tip = tip.lerp(boneWorld(victim, 'spine_02'), smooth(1.62, CHIDORI_TIMING.impact, ta));
      const samples = cast.samples;
      const previous = samples[samples.length - 1];
      if (!previous || ta - previous.t >= 1 / 90) {
        samples.push({ t: ta, palm: palm.clone(), tip: tip.clone() });
        if (samples.length > 480) samples.splice(0, samples.length - 480);
      }
      const tv = ta >= CHIDORI_TIMING.impact ? ta - CHIDORI_TIMING.impact : -1;
      let vic;
      if (victim) {
        const victimRoot = (victim.root || victim.model).getWorldPosition(new THREE.Vector3());
        if (tv >= 0) cast.victimRoots.push({ t: tv, p: victimRoot.clone() });
        vic = {
          bone: (name) => boneWorld(victim, name),
          root: victim.model || victim.root,
          rootDelta: (t0) => {
            const first = cast.victimRoots.find((row) => row.t >= t0) || cast.victimRoots[0];
            return first ? victimRoot.clone().sub(first.p) : new THREE.Vector3();
          },
        };
        const victimBow = victim.female ? findBone(victim.model, 'bow') : null;
        if (victimBow) vic.bowPos = victimBow.getWorldPosition(new THREE.Vector3());
      }
      const bow = attacker.female ? findBone(attacker.model, 'bow') : null;
      return fx.update({
        ta,
        tv,
        camera,
        att: {
          bone: (name) => boneWorld(attacker, name),
          fwd: forward,
          pathAt: (t) => samplePath(samples, t, { palm, tip }),
          ...(bow ? { bowPos: bow.getWorldPosition(new THREE.Vector3()) } : {}),
        },
        vic,
      });
    },
    stop,
    dispose: stop,
  };
}
