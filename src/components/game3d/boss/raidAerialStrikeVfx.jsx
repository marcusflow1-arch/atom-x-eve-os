import * as THREE from 'three';

const AERIAL_STRIKE_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/94952cc10_fd37b7bec4ca48a8b6539dc4048787cf.glb';
let aerialPromise = null;

function loadAerialAsset(loader) {
  if (!aerialPromise) {
    aerialPromise = new Promise((resolve) => {
      loader.load(AERIAL_STRIKE_URL, (gltf) => resolve(gltf?.scene || null), undefined, () => resolve(null));
    });
  }
  return aerialPromise;
}

export function createRaidAerialStrike({ scene, loader, getTargetPosition, getGroundY, getLocalPlayerPosition, applyLocalDamage, radius = 5.2, damage = 5, duration = 5.5 }) {
  const group = new THREE.Group();
  const warning = new THREE.Group();
  group.add(warning);

  const fillGeo = new THREE.CircleGeometry(radius, 96);
  const fillMat = new THREE.MeshBasicMaterial({ color: 0xff1838, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide });
  const fill = new THREE.Mesh(fillGeo, fillMat);
  fill.rotation.x = -Math.PI / 2;
  warning.add(fill);

  const edgeGeo = new THREE.RingGeometry(radius * 0.9, radius, 128);
  const edgeMat = new THREE.MeshBasicMaterial({ color: 0xff284a, transparent: true, opacity: 0.58, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  const edge = new THREE.Mesh(edgeGeo, edgeMat);
  edge.rotation.x = -Math.PI / 2;
  warning.add(edge);

  const rippleGeo = new THREE.RingGeometry(radius * 0.18, radius * 0.2, 96);
  const rippleMat = new THREE.MeshBasicMaterial({ color: 0xff8a9a, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  const ripple = new THREE.Mesh(rippleGeo, rippleMat);
  ripple.rotation.x = -Math.PI / 2;
  warning.add(ripple);

  const flash = new THREE.PointLight(0xff3355, 0, radius * 4);
  flash.position.y = 5;
  group.add(flash);
  scene.add(group);

  const lockedPosition = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  let t = 0;
  let impactStarted = false;
  let aerialAsset = null;
  let tickTimer = 0;
  const FOLLOW_TIME = 1.5;
  const LOCK_DELAY = 1;
  const FIELD_TIME = duration;
  const IMPACT_TIME = FOLLOW_TIME + LOCK_DELAY;

  return {
    update(delta) {
      t += delta;
      if (t < FOLLOW_TIME) {
        const target = getTargetPosition?.();
        if (target) lockedPosition.copy(target);
      }

      const y = getGroundY?.(lockedPosition.x, lockedPosition.z) ?? 0;
      group.position.set(lockedPosition.x, y + 0.08, lockedPosition.z);

      const locked = t >= FOLLOW_TIME;
      const impactFrac = Math.min(1, Math.max(0, (t - FOLLOW_TIME) / LOCK_DELAY));
      const pulse = 1 + Math.sin(t * (locked ? 18 : 8)) * (locked ? 0.055 : 0.025);
      warning.scale.setScalar(pulse);
      edge.rotation.z += delta * 0.45;
      fillMat.opacity = locked ? 0.18 + impactFrac * 0.16 : 0.1 + Math.sin(t * 5) * 0.04;
      edgeMat.opacity = locked ? 0.78 + impactFrac * 0.2 : 0.45 + Math.sin(t * 7) * 0.18;
      ripple.scale.setScalar(1 + ((t * 0.9) % 1) * 3.6);
      rippleMat.opacity = Math.max(0, 0.35 * (1 - ((t * 0.9) % 1)));
      flash.intensity = impactFrac * 1.8;

      if (!impactStarted && t >= IMPACT_TIME) {
        impactStarted = true;
        flash.intensity = 8;
        window.dispatchEvent(new CustomEvent('bossImpactShake', { detail: { x: lockedPosition.x, z: lockedPosition.z, radius } }));
        loadAerialAsset(loader).then((src) => {
          if (!src) return;
          aerialAsset = src.clone(true);
          aerialAsset.scale.setScalar(3.4);
          aerialAsset.position.y = 0;
          aerialAsset.traverse((node) => {
            if (!node.isMesh || !node.material) return;
            const mats = Array.isArray(node.material) ? node.material : [node.material];
            mats.forEach((mat) => {
              mat.transparent = true;
              mat.depthWrite = false;
              mat.blending = THREE.AdditiveBlending;
            });
          });
          group.add(aerialAsset);
        });
      }

      if (impactStarted) {
        const fieldAge = t - IMPACT_TIME;
        flash.intensity = Math.max(0.9, 5 * Math.max(0, 1 - fieldAge / 0.8));
        fillMat.opacity = 0.2 + Math.sin(t * 10) * 0.04;
        edgeMat.opacity = 0.62 + Math.sin(t * 14) * 0.14;
        if (aerialAsset) aerialAsset.rotation.y += delta * 0.55;
        tickTimer += delta;
        while (tickTimer >= 0.1) {
          tickTimer -= 0.1;
          const player = getLocalPlayerPosition?.();
          if (player) {
            tmp.set(player.x - lockedPosition.x, 0, player.z - lockedPosition.z);
            if (tmp.lengthSq() <= radius * radius) applyLocalDamage?.(damage, lockedPosition);
          }
        }
      }
    },
    alive() { return t < IMPACT_TIME + FIELD_TIME; },
    dispose() {
      scene.remove(group);
      fillGeo.dispose(); fillMat.dispose();
      edgeGeo.dispose(); edgeMat.dispose();
      rippleGeo.dispose(); rippleMat.dispose();
    },
  };
}