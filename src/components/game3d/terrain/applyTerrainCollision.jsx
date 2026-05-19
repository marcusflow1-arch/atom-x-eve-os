// ─── applyTerrainCollision ────────────────────────────────────────────────
// Per-frame push-out for solid terrain props (rocks). Reads colliders from
// window.__terrainColliders (registered by TerrainArea). Called once per
// frame from GameWorld3D's movement block, after rogue-AI collision.

export function applyTerrainCollision(model) {
  const C = window.__terrainColliders;
  if (!C || !model) return;
  for (let i = 0; i < C.length; i++) {
    const c = C[i];
    const dx = model.position.x - c.x;
    const dz = model.position.z - c.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d > 0 && d < c.r) {
      const p = (c.r - d) / d;
      model.position.x += dx * p;
      model.position.z += dz * p;
    }
  }
}