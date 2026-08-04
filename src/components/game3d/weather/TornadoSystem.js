import * as THREE from 'three';
import { createTornadoVisuals, funnelRadius } from './tornadoVisuals';

/**
 * TornadoSystem — a real-time tornado weather event.
 *
 * Life cycle (all driven from update(), no timers):
 *   forming     — ground dust kicks up, funnel builds down from the cloud deck
 *   active      — full funnel; pulls the player in, pull grows the closer you get
 *   lifted      — player is inside the core: spun around and carried upward
 *   levitating  — thrown out the top above the storm; player floats, sky is clear
 *                 so you can look up and see the sun / stars / open view
 *   landing     — float back down to the ground
 *   dissipating — funnel thins out and the storm ends
 *
 * Factory: createTornadoSystem({ scene })
 * API: spawn({ x, z }), update(delta, { player, groundY }), getState(), stop(), dispose()
 * update() returns { liftY, lockMovement, allowLookUp } for the host loop to apply.
 */

const PHASE_TIMES = {
  forming: 4.0,
  active: 22.0,      // max time hunting the player before it winds down
  lifted: 3.4,
  levitating: 7.0,
  landing: 2.6,
  dissipating: 3.2,
};

const PULL_RADIUS = 30;      // outer edge of the pull field
const CAPTURE_RADIUS = 2.6;  // inside this you get sucked into the core
const MAX_LIFT = 62;         // how high the core throws you
const FUNNEL_HEIGHT = 70;

export function createTornadoSystem({ scene }) {
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);

  // Funnel look (wind streaks + vapour core + wall cloud) lives in its own module.
  const visuals = createTornadoVisuals({ group, height: FUNNEL_HEIGHT });

  // ── Ground wind: dust streaks spiralling inward along the floor.
  const DUST = 420;
  const dustPos = new Float32Array(DUST * 3);
  const dustData = [];
  for (let i = 0; i < DUST; i++) {
    const ang = Math.random() * Math.PI * 2;
    const rad = 4 + Math.random() * PULL_RADIUS;
    dustData.push({ ang, rad, y: Math.random() * 3, speed: 0.5 + Math.random() * 1.2 });
    dustPos[i * 3] = Math.cos(ang) * rad;
    dustPos[i * 3 + 1] = dustData[i].y;
    dustPos[i * 3 + 2] = Math.sin(ang) * rad;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0xd8cfc0, size: 0.2, sizeAttenuation: true,
    transparent: true, opacity: 0, depthWrite: false,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  group.add(dust);

  // ── Debris caught in the vortex, climbing the funnel.
  const DEBRIS = 200;
  const debPos = new Float32Array(DEBRIS * 3);
  const debData = [];
  for (let i = 0; i < DEBRIS; i++) {
    debData.push({ ang: Math.random() * Math.PI * 2, y: Math.random() * FUNNEL_HEIGHT, climb: 8 + Math.random() * 16, spin: 2 + Math.random() * 2 });
  }
  const debGeo = new THREE.BufferGeometry();
  debGeo.setAttribute('position', new THREE.BufferAttribute(debPos, 3));
  const debMat = new THREE.PointsMaterial({
    color: 0x8d857a, size: 0.16, sizeAttenuation: true,
    transparent: true, opacity: 0, depthWrite: false,
  });
  const debris = new THREE.Points(debGeo, debMat);
  debris.frustumCulled = false;
  group.add(debris);

  const state = {
    phase: 'idle',
    timer: 0,
    strength: 0,      // 0..1 funnel build-up
    liftY: 0,
    captured: false,
    pull: 0,          // pull felt by the player this frame (0..1) — for HUD
    distance: null,
  };

  const spawn = ({ x = 0, z = 0 } = {}) => {
    group.position.set(x, 0, z);
    group.visible = true;
    state.phase = 'forming';
    state.timer = 0;
    state.strength = 0;
    state.liftY = 0;
    state.captured = false;
  };

  const stop = () => {
    if (state.phase === 'idle') return;
    state.phase = 'dissipating';
    state.timer = 0;
  };

  const setOpacity = () => {
    const s = state.strength;
    visuals.setStrength(s);
    dustMat.opacity = s * 0.75;
    debMat.opacity = s * 0.8;
  };

  const update = (delta, { player, groundY = 0 } = {}) => {
    if (state.phase === 'idle') {
      return { liftY: 0, lockMovement: false, allowLookUp: false };
    }
    state.timer += delta;
    const t = state.timer;

    // ── Phase progression
    if (state.phase === 'forming') {
      state.strength = Math.min(1, t / PHASE_TIMES.forming);
      if (t >= PHASE_TIMES.forming) { state.phase = 'active'; state.timer = 0; }
    } else if (state.phase === 'active') {
      state.strength = 1;
      if (t >= PHASE_TIMES.active) { state.phase = 'dissipating'; state.timer = 0; }
    } else if (state.phase === 'lifted') {
      state.strength = 1;
      const p = Math.min(1, t / PHASE_TIMES.lifted);
      state.liftY = MAX_LIFT * (1 - Math.pow(1 - p, 2)); // ease-out climb
      if (p >= 1) { state.phase = 'levitating'; state.timer = 0; }
    } else if (state.phase === 'levitating') {
      // Above the storm: funnel fades below you, sky opens up.
      state.strength = Math.max(0, 1 - t / PHASE_TIMES.levitating);
      state.liftY = MAX_LIFT + Math.sin(t * 0.9) * 1.6; // gentle float
      if (t >= PHASE_TIMES.levitating) { state.phase = 'landing'; state.timer = 0; }
    } else if (state.phase === 'landing') {
      state.strength = 0;
      const p = Math.min(1, t / PHASE_TIMES.landing);
      state.liftY = MAX_LIFT * (1 - p) * (1 - p);
      if (p >= 1) { state.phase = 'idle'; state.timer = 0; state.captured = false; state.liftY = 0; group.visible = false; }
    } else if (state.phase === 'dissipating') {
      state.strength = Math.max(0, 1 - t / PHASE_TIMES.dissipating);
      if (t >= PHASE_TIMES.dissipating) { state.phase = 'idle'; state.timer = 0; group.visible = false; }
    }

    setOpacity();
    group.position.y = groundY;

    // ── Animate the funnel look
    const spinT = performance.now() / 1000;
    visuals.update(delta, spinT);

    // ── Ground wind: spiral inward, respawn at the rim
    for (let i = 0; i < DUST; i++) {
      const d = dustData[i];
      d.ang += delta * (1.6 + (PULL_RADIUS - d.rad) * 0.12) * d.speed;
      d.rad -= delta * (2.5 + (PULL_RADIUS - d.rad) * 0.25) * state.strength;
      d.y += delta * 1.4 * state.strength;
      if (d.rad < 1.5 || d.y > 6) { d.rad = PULL_RADIUS * (0.6 + Math.random() * 0.4); d.y = Math.random() * 1.2; }
      dustPos[i * 3] = Math.cos(d.ang) * d.rad;
      dustPos[i * 3 + 1] = d.y;
      dustPos[i * 3 + 2] = Math.sin(d.ang) * d.rad;
    }
    dustGeo.attributes.position.needsUpdate = true;

    // ── Debris climbing the vortex
    for (let i = 0; i < DEBRIS; i++) {
      const d = debData[i];
      d.ang += delta * d.spin;
      d.y += delta * d.climb * state.strength;
      if (d.y > FUNNEL_HEIGHT) d.y = 0;
      const tNorm = d.y / FUNNEL_HEIGHT;
      const rad = funnelRadius(tNorm, FUNNEL_HEIGHT) * 0.9;
      debPos[i * 3] = Math.cos(d.ang) * rad;
      debPos[i * 3 + 1] = d.y;
      debPos[i * 3 + 2] = Math.sin(d.ang) * rad;
    }
    debGeo.attributes.position.needsUpdate = true;

    // ── Player interaction
    let lockMovement = false;
    if (player) {
      const dx = group.position.x - player.position.x;
      const dz = group.position.z - player.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      state.distance = dist;

      if (state.phase === 'lifted' || state.phase === 'levitating' || state.phase === 'landing') {
        lockMovement = true;
        if (state.phase === 'lifted') {
          // Spun around the core while being carried up.
          const swirl = spinT * 3.2;
          const rad = 2.2 * (1 - state.liftY / MAX_LIFT) + 0.6;
          player.position.x = group.position.x + Math.cos(swirl) * rad;
          player.position.z = group.position.z + Math.sin(swirl) * rad;
          player.rotation.y = -swirl;
        }
      } else if ((state.phase === 'active' || state.phase === 'forming') && dist < PULL_RADIUS) {
        // Pull ramps up sharply as you get closer, and with the funnel's build-up.
        const closeness = 1 - dist / PULL_RADIUS;
        const pull = Math.pow(closeness, 1.7) * state.strength;
        state.pull = pull;
        const inward = pull * 14 * delta;      // suction toward the core
        const tangent = pull * 10 * delta;     // sideways swirl so you orbit in
        const nx = dx / (dist || 1), nz = dz / (dist || 1);
        player.position.x += nx * inward - nz * tangent;
        player.position.z += nz * inward + nx * tangent;
        if (dist < CAPTURE_RADIUS && state.strength > 0.85) {
          state.phase = 'lifted';
          state.timer = 0;
          state.captured = true;
        }
      } else {
        state.pull = 0;
      }
    }

    return {
      liftY: state.liftY,
      lockMovement,
      // Above the storm you can crane the camera up at the open sky.
      allowLookUp: state.phase === 'levitating' || state.phase === 'lifted',
    };
  };

  const getState = () => ({
    phase: state.phase,
    active: state.phase !== 'idle',
    strength: +state.strength.toFixed(2),
    pull: +(state.pull || 0).toFixed(2),
    liftY: +state.liftY.toFixed(1),
    captured: state.captured,
    distance: state.distance == null ? null : +state.distance.toFixed(1),
  });

  const dispose = () => {
    scene.remove(group);
    visuals.dispose();
    dustGeo.dispose(); dustMat.dispose();
    debGeo.dispose(); debMat.dispose();
  };

  return { spawn, stop, update, getState, dispose, group };
}