import * as THREE from 'three';

// AXE Prompt 030 — lightweight world-space Halo visual.
// It intentionally uses procedural geometry so the system works before final
// authored VFX assets arrive. Final meshes/particles can replace this adapter.
export function createAXEHaloVisualRuntime({ model, initialState = null } = {}) {
  if (!model) return { update() {}, dispose() {} };

  const group = new THREE.Group();
  group.name = 'AXE_Halo_Runtime';
  group.position.set(0, 2.05, 0);

  const geometry = new THREE.TorusGeometry(0.38, 0.028, 8, 40);
  const material = new THREE.MeshBasicMaterial({
    color: 0xf5b400,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const ring = new THREE.Mesh(geometry, material);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  model.add(group);

  let tierRank = 0;
  let pulse = false;
  let visible = false;
  let lowEffects = false;
  let elapsed = 0;

  const applyState = (state = {}) => {
    const tier = state.tier || {};
    const profile = state.visualProfile || {};
    visible = profile.visible !== false && Number(state.level || 0) > 0 && !state.hidden;
    lowEffects = !!state.lowEffects;
    pulse = !!profile.pulse && !lowEffects;
    tierRank = Math.max(0, Number(profile.rings || 1) - 1);

    if (tier.color) material.color.set(tier.color);
    material.opacity = lowEffects ? 0.5 : Math.min(0.95, 0.62 + tierRank * 0.07);
    group.visible = visible;
    ring.scale.setScalar(1 + tierRank * 0.06);
  };

  applyState(initialState || {});

  const onHaloChanged = (event) => applyState(event?.detail || {});
  if (typeof window !== 'undefined') {
    window.addEventListener('axeHaloChanged', onHaloChanged);
  }

  return {
    update(delta = 0) {
      if (!group.visible) return;
      elapsed += Math.max(0, Number(delta) || 0);
      if (!lowEffects) group.rotation.y += delta * (0.2 + tierRank * 0.04);
      const scale = pulse ? 1 + Math.sin(elapsed * 2.4) * 0.035 : 1;
      group.scale.setScalar(scale);
    },
    dispose() {
      if (typeof window !== 'undefined') {
        window.removeEventListener('axeHaloChanged', onHaloChanged);
      }
      if (group.parent) group.parent.remove(group);
      geometry.dispose();
      material.dispose();
    },
  };
}
