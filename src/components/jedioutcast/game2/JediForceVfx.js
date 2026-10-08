import * as THREE from 'three';

const SOURCE_EFFECT_REFS = Object.freeze({
  push: 'gfx/effects/forcePush',
  saberFlare: 'gfx/effects/saberFlare',
  jumpSound: 'sound/weapons/force/jump.wav',
});

function disposeNode(node) {
  node.geometry?.dispose?.();
  const materials = node.material ? (Array.isArray(node.material) ? node.material : [node.material]) : [];
  materials.forEach((material) => material?.dispose?.());
}

export class JediForceVfx {
  constructor(scene) {
    this.scene = scene;
    this.effects = [];
  }

  radial(origin, color, { radius = 4, duration = 0.35 } = {}) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.16, 0.24, 48),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(origin);
    ring.position.y += 0.08;
    this.scene.add(ring);
    this.effects.push({
      left: duration,
      duration,
      update: (left) => {
        const t = 1 - left / duration;
        ring.scale.setScalar(1 + t * radius);
        ring.material.opacity = 0.72 * (1 - t);
      },
      dispose: () => {
        this.scene.remove(ring);
        disposeNode(ring);
      },
    });
    return SOURCE_EFFECT_REFS.push;
  }

  aura(origin, color, { duration = 0.65, size = 1.2 } = {}) {
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(size, 20, 14),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.24, wireframe: true, depthWrite: false }),
    );
    sphere.position.copy(origin);
    sphere.position.y += 0.9;
    this.scene.add(sphere);
    this.effects.push({
      left: duration,
      duration,
      update: (left) => {
        const t = 1 - left / duration;
        sphere.scale.setScalar(1 + t * 1.3);
        sphere.material.opacity = 0.24 * (1 - t);
      },
      dispose: () => {
        this.scene.remove(sphere);
        disposeNode(sphere);
      },
    });
  }

  lightning(from, to, { duration = 0.42, color = 0x8fdcff } = {}) {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 1, toneMapped: false });
    const line = new THREE.Line(geometry, material);
    this.scene.add(line);
    this.effects.push({
      left: duration,
      duration,
      update: (left) => {
        const points = [from()];
        const a = from();
        const b = to();
        for (let i = 1; i < 8; i += 1) {
          const t = i / 8;
          points.push(new THREE.Vector3().lerpVectors(a, b, t).add(new THREE.Vector3(
            (Math.random() - 0.5) * 0.16,
            (Math.random() - 0.5) * 0.16,
            (Math.random() - 0.5) * 0.16,
          )));
        }
        points.push(b);
        geometry.setFromPoints(points);
        material.opacity = Math.min(1, left / 0.08);
      },
      dispose: () => {
        this.scene.remove(line);
        geometry.dispose();
        material.dispose();
      },
    });
  }

  update(delta) {
    const keep = [];
    for (const effect of this.effects) {
      effect.left = Math.max(0, effect.left - delta);
      effect.update?.(effect.left);
      if (effect.left > 0) keep.push(effect);
      else effect.dispose?.();
    }
    this.effects = keep;
  }

  dispose() {
    for (const effect of this.effects) effect.dispose?.();
    this.effects = [];
  }
}

export { SOURCE_EFFECT_REFS };
