// ─── Flat Ground ──────────────────────────────────────────────────────────
// The previous procedural rolling-hill terrain has been removed in favor of
// a stable, flat sandbox surface. Other systems still import these helpers,
// so we keep the signatures but make them trivial:
//   • sampleGroundY(x, z)    → always 0
//   • sampleGroundSlope(x,z) → always 0 (no slope)
//   • buildFlatGround()      → single THREE.Mesh used by TerrainArea
//
// `buildForestGround` is kept as an alias so any stragglers still work.

import * as THREE from 'three';

export function sampleGroundY() { return 0; }
export function sampleGroundSlope() { return 0; }

/**
 * Build the sandbox ground plane. Default size 200×200 — plenty of room
 * for hand-placed maps but small enough to cost nothing.
 */
export function buildFlatGround({ size = 200, color = 0x4a6a3e } = {}) {
  const geo = new THREE.PlaneGeometry(size, size, 1, 1);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'sandbox_ground';
  mesh.receiveShadow = true;
  return mesh;
}

// Back-compat alias
export const buildForestGround = buildFlatGround;