// bossAbilityVfx — lightweight three.js visual primitives for boss abilities.
//
// Each builder returns { update(dt), alive(), dispose() } so the GameWorld3D
// active-effects loop can drive them uniformly with existing effect plumbing.

import * as THREE from 'three';

// ─── Ground warning telegraph ring (red, pulses, then fades) ─────────────────
export function createWarningCircle(scene, x, z, y, radius, duration) {
  const geo = new THREE.RingGeometry(radius * 0.85, radius, 48);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xff2233, side: THREE.DoubleSide,
    transparent: true, opacity: 0.55, depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y + 0.05, z);
  scene.add(mesh);
  let t = 0;
  return {
    update(dt) {
      t += dt;
      const frac = t / duration;
      mat.opacity = 0.35 + 0.45 * Math.sin(t * 8);
      mesh.scale.setScalar(1 + frac * 0.05);
    },
    alive() { return t < duration; },
    dispose() { scene.remove(mesh); geo.dispose(); mat.dispose(); },
  };
}

// ─── Meteor falling + impact flash ───────────────────────────────────────────
export function createMeteorImpact(scene, x, z, y, radius) {
  const group = new THREE.Group();
  // Falling rock
  const rockGeo = new THREE.IcosahedronGeometry(0.6, 0);
  const rockMat = new THREE.MeshBasicMaterial({ color: 0xff5522 });
  const rock = new THREE.Mesh(rockGeo, rockMat);
  rock.position.set(x, y + 30, z);
  // Trailing flame sphere
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0xff8844, transparent: true, opacity: 0.7, depthWrite: false,
  });
  const flame = new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 12), flameMat);
  flame.position.copy(rock.position);
  group.add(rock); group.add(flame);
  scene.add(group);

  // Impact ring (created when rock lands)
  let impactRing = null;
  let impactMat = null;
  let phase = 'falling';
  let phaseT = 0;
  const FALL_TIME = 0.6;
  const IMPACT_TIME = 0.5;

  return {
    update(dt) {
      phaseT += dt;
      if (phase === 'falling') {
        const frac = Math.min(1, phaseT / FALL_TIME);
        rock.position.y = y + 30 * (1 - frac) + 0.5;
        flame.position.copy(rock.position);
        flame.scale.setScalar(1 + frac * 0.6);
        if (frac >= 1) {
          phase = 'impact';
          phaseT = 0;
          // Spawn impact ring
          const ringGeo = new THREE.RingGeometry(0.1, radius, 32);
          impactMat = new THREE.MeshBasicMaterial({
            color: 0xff6622, side: THREE.DoubleSide,
            transparent: true, opacity: 0.9, depthWrite: false,
          });
          impactRing = new THREE.Mesh(ringGeo, impactMat);
          impactRing.rotation.x = -Math.PI / 2;
          impactRing.position.set(x, y + 0.06, z);
          scene.add(impactRing);
          // Hide rock
          rock.visible = false; flame.visible = false;
        }
      } else {
        const frac = Math.min(1, phaseT / IMPACT_TIME);
        if (impactRing) {
          impactRing.scale.setScalar(1 + frac * 0.4);
          impactMat.opacity = 0.9 * (1 - frac);
        }
      }
    },
    alive() { return phase === 'falling' || phaseT < IMPACT_TIME; },
    dispose() {
      scene.remove(group);
      rockGeo.dispose(); rockMat.dispose();
      flame.geometry.dispose(); flameMat.dispose();
      if (impactRing) {
        scene.remove(impactRing);
        impactRing.geometry.dispose();
        impactMat.dispose();
      }
    },
  };
}

// ─── Shadow Charge trail (dark line + smoke from start to end) ───────────────
export function createShadowChargeTrail(scene, fromX, fromZ, toX, toZ, groundY) {
  const dx = toX - fromX, dz = toZ - fromZ;
  const len = Math.sqrt(dx * dx + dz * dz);
  const geo = new THREE.PlaneGeometry(len, 1.4);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x6a00b0, transparent: true, opacity: 0.85,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const trail = new THREE.Mesh(geo, mat);
  trail.rotation.x = -Math.PI / 2;
  trail.rotation.z = -Math.atan2(dz, dx);
  trail.position.set((fromX + toX) / 2, groundY + 0.07, (fromZ + toZ) / 2);
  scene.add(trail);
  let t = 0;
  const DURATION = 0.8;
  return {
    update(dt) { t += dt; mat.opacity = 0.85 * Math.max(0, 1 - t / DURATION); },
    alive() { return t < DURATION; },
    dispose() { scene.remove(trail); geo.dispose(); mat.dispose(); },
  };
}

// ─── World Breaker cone telegraph (red cone in front of boss) ────────────────
export function createConeTelegraph(scene, bossX, bossZ, bossY, yaw, angleDeg, range, duration) {
  const half = (angleDeg * Math.PI / 180) / 2;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  const SEGS = 24;
  for (let i = 0; i <= SEGS; i++) {
    const a = -half + (i / SEGS) * half * 2;
    shape.lineTo(Math.cos(a) * range, Math.sin(a) * range);
  }
  shape.lineTo(0, 0);
  const geo = new THREE.ShapeGeometry(shape);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xff3344, side: THREE.DoubleSide,
    transparent: true, opacity: 0.45, depthWrite: false,
  });
  const cone = new THREE.Mesh(geo, mat);
  cone.rotation.x = -Math.PI / 2;
  cone.rotation.z = -yaw + Math.PI / 2;
  cone.position.set(bossX, bossY + 0.05, bossZ);
  scene.add(cone);
  let t = 0;
  return {
    update(dt) {
      t += dt;
      const frac = t / duration;
      // Strobe between warning red and bright crimson; flash bright at the end
      mat.opacity = 0.4 + 0.4 * Math.abs(Math.sin(t * 6 + frac * 6));
      if (frac > 0.85) mat.color.setHex(0xff8800);
    },
    alive() { return t < duration; },
    dispose() { scene.remove(cone); geo.dispose(); mat.dispose(); },
  };
}

// ─── Chaos Orb tracking projectile (purple sphere with glow) ─────────────────
export function createChaosOrb(scene, fromX, fromZ, fromY, getTargetPos, speed = 6) {
  const geo = new THREE.SphereGeometry(0.45, 16, 16);
  const mat = new THREE.MeshBasicMaterial({ color: 0xaa44ff });
  const orb = new THREE.Mesh(geo, mat);
  orb.position.set(fromX, fromY + 1.5, fromZ);
  // Glow halo
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xcc88ff, transparent: true, opacity: 0.35, depthWrite: false }),
  );
  halo.position.copy(orb.position);
  scene.add(orb); scene.add(halo);

  let exploded = false;
  let t = 0;
  const MAX_LIFE = 6.0; // safety timeout
  const HIT_RADIUS = 1.0;
  let onHit = null;

  return {
    update(dt) {
      t += dt;
      if (exploded) return;
      const tgt = getTargetPos();
      if (!tgt) { exploded = true; return; }
      const dx = tgt.x - orb.position.x;
      const dy = (tgt.y + 1.0) - orb.position.y;
      const dz = tgt.z - orb.position.z;
      const d = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (d < HIT_RADIUS) {
        exploded = true;
        if (onHit) onHit({ x: orb.position.x, z: orb.position.z });
        return;
      }
      const nx = dx / d, ny = dy / d, nz = dz / d;
      orb.position.x += nx * speed * dt;
      orb.position.y += ny * speed * dt;
      orb.position.z += nz * speed * dt;
      halo.position.copy(orb.position);
      halo.scale.setScalar(1 + 0.15 * Math.sin(t * 12));
    },
    alive() { return !exploded && t < MAX_LIFE; },
    setOnHit(fn) { onHit = fn; },
    dispose() {
      scene.remove(orb); scene.remove(halo);
      geo.dispose(); mat.dispose();
      halo.geometry.dispose(); halo.material.dispose();
    },
  };
}