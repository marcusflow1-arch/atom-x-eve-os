/**
 * FXVisualRenderer — Creates/updates Three.js visual FX (particle bursts, glows, beams)
 * in a given scene, attached to bone positions.
 *
 * This is shared by the admin ReactorViewport and the Luna 3D viewer.
 */
import * as THREE from 'three';

const FX_COLORS = {
  projectile: 0x3b82f6,
  burst: 0xf97316,
  aura: 0xa855f7,
  beam: 0x22d3ee,
  trail: 0x22c55e,
  impact: 0xef4444,
};

const DAMAGE_TYPE_COLORS = {
  physical: 0x94a3b8, energy: 0xfacc15, lightning: 0x60a5fa,
  fire: 0xf97316, ice: 0x22d3ee, true_damage: 0xef4444,
  poison: 0x22c55e, holy: 0xfbbf24,
};

export function createFXGroup(fxBlock, color) {
  const group = new THREE.Group();
  group.userData._fxBlockId = fxBlock._id || fxBlock.fx_id || 'unknown';
  
  const hexColor = typeof color === 'string' ? parseInt(color.replace('#', ''), 16) : 
    (FX_COLORS[fxBlock.effect_type] || 0xf97316);

  const type = fxBlock.effect_type || 'burst';

  if (type === 'burst' || type === 'impact') {
    // Glowing sphere + ring
    const sphereGeo = new THREE.SphereGeometry(0.15, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: hexColor,
      transparent: true,
      opacity: 0.6,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    group.add(sphere);

    // Outer ring
    const ringGeo = new THREE.RingGeometry(0.2, 0.35, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: hexColor,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    group.add(ring);

    // Point light
    const light = new THREE.PointLight(hexColor, 2, 3);
    group.add(light);

  } else if (type === 'aura') {
    // Larger translucent sphere
    const auraGeo = new THREE.SphereGeometry(0.4, 24, 24);
    const auraMat = new THREE.MeshBasicMaterial({
      color: hexColor,
      transparent: true,
      opacity: 0.15,
      wireframe: false,
    });
    const aura = new THREE.Mesh(auraGeo, auraMat);
    group.add(aura);

    // Inner glow
    const innerGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const innerMat = new THREE.MeshBasicMaterial({
      color: hexColor,
      transparent: true,
      opacity: 0.4,
    });
    group.add(new THREE.Mesh(innerGeo, innerMat));

    const light = new THREE.PointLight(hexColor, 1.5, 4);
    group.add(light);

  } else if (type === 'beam') {
    // Cylinder beam
    const beamGeo = new THREE.CylinderGeometry(0.03, 0.03, 2, 8);
    const beamMat = new THREE.MeshBasicMaterial({
      color: hexColor,
      transparent: true,
      opacity: 0.7,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.rotation.x = Math.PI / 2;
    beam.position.z = 1;
    group.add(beam);

    const light = new THREE.PointLight(hexColor, 1, 3);
    group.add(light);

  } else if (type === 'trail') {
    // Series of small spheres
    for (let i = 0; i < 5; i++) {
      const geo = new THREE.SphereGeometry(0.04 + i * 0.01, 8, 8);
      const mat = new THREE.MeshBasicMaterial({
        color: hexColor,
        transparent: true,
        opacity: 0.6 - i * 0.1,
      });
      const s = new THREE.Mesh(geo, mat);
      s.position.z = -i * 0.12;
      group.add(s);
    }

  } else if (type === 'projectile') {
    // Arrow-shaped
    const coneGeo = new THREE.ConeGeometry(0.08, 0.3, 8);
    const coneMat = new THREE.MeshBasicMaterial({
      color: hexColor,
      transparent: true,
      opacity: 0.8,
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.rotation.x = -Math.PI / 2;
    cone.position.z = 0.2;
    group.add(cone);

    const light = new THREE.PointLight(hexColor, 1.5, 2);
    group.add(light);

  } else {
    // Default: simple glow sphere
    const geo = new THREE.SphereGeometry(0.12, 12, 12);
    const mat = new THREE.MeshBasicMaterial({
      color: hexColor,
      transparent: true,
      opacity: 0.5,
    });
    group.add(new THREE.Mesh(geo, mat));
  }

  return group;
}

/**
 * Animate an FX group each frame (pulsing, rotation, etc.)
 */
export function updateFXGroup(group, time, type) {
  if (!group) return;

  const t = type || 'burst';
  const pulse = Math.sin(time * 6) * 0.3 + 1;

  if (t === 'burst' || t === 'impact') {
    group.scale.setScalar(pulse * 0.8);
    group.rotation.y += 0.02;
  } else if (t === 'aura') {
    group.scale.setScalar(0.8 + Math.sin(time * 3) * 0.15);
    group.rotation.y += 0.01;
  } else if (t === 'beam') {
    group.rotation.z = Math.sin(time * 4) * 0.1;
  } else if (t === 'projectile') {
    group.rotation.y += 0.05;
  } else if (t === 'trail') {
    group.rotation.y += 0.03;
    group.children.forEach((child, i) => {
      child.position.y = Math.sin(time * 5 + i * 0.5) * 0.03;
    });
  }
}

/**
 * Create a reactor firing glow (for damage reactors)
 */
export function createReactorFiringGlow(damageType) {
  const group = new THREE.Group();
  const color = DAMAGE_TYPE_COLORS[damageType] || 0x00ffcc;

  const geo = new THREE.SphereGeometry(0.2, 16, 16);
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.5,
  });
  group.add(new THREE.Mesh(geo, mat));

  const light = new THREE.PointLight(color, 3, 4);
  group.add(light);

  // Wireframe outline
  const wireGeo = new THREE.SphereGeometry(0.25, 12, 12);
  const wireMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.2,
    wireframe: true,
  });
  group.add(new THREE.Mesh(wireGeo, wireMat));

  return group;
}