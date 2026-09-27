import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

// Accent colours match each ability's card art.
const EFFECT_COLORS = {
  basic_melee: 0xeafcff,
  getsuga_tensho: 0x7fe7ff,
  artemis_call_of_the_husky: 0x65d9ff,
  artemis_rain_of_arrows: 0x91a7ff,
  artemis_lunar_beam: 0xd19cff,
};
export const effectColor = (effectId) => EFFECT_COLORS[String(effectId || '')] ?? 0xcff8ff;

const additive = (color, opacity) => new THREE.MeshBasicMaterial({
  color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, side: THREE.DoubleSide,
});
const clamp01 = (value) => Math.max(0, Math.min(1, value));
const easeOut = (t) => 1 - (1 - t) ** 3;

// A long, thin blade shape anchored at x = 0 so scaling x "draws" the line.
function bladeGeometry(length, thickness) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(length * 0.42, thickness / 2);
  shape.lineTo(length, 0);
  shape.lineTo(length * 0.42, -thickness / 2);
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

function disposeObject(root) {
  root?.traverse?.((node) => {
    node.geometry?.dispose?.();
    (Array.isArray(node.material) ? node.material : [node.material]).forEach((material) => material?.dispose?.());
  });
  root?.removeFromParent?.();
}

const ORIGINAL_EMISSIVE = new WeakMap();

/**
 * Combat feedback for the PvP arena: slash lines, ability impacts, projectiles,
 * hit flashes and floating damage numbers. Every effect advances from the
 * arena's own render loop and is disposed with the arena, so nothing keeps
 * running after a match unmounts.
 */
export default class CombatFx {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.items = new Set();
  }

  update(now = performance.now()) {
    for (const item of this.items) {
      let alive = false;
      try { alive = item.update(now); } catch (error) { console.warn('[PvP fx] effect failed', error); }
      if (!alive) {
        item.dispose();
        this.items.delete(item);
      }
    }
  }

  dispose() {
    for (const item of this.items) item.dispose();
    this.items.clear();
  }

  _track(item) {
    this.items.add(item);
    return item;
  }

  _billboard(group) {
    if (this.camera) group.quaternion.copy(this.camera.quaternion);
  }

  /** A bright blade line drawn diagonally across the target, with sparks. */
  slash(center, { color = effectColor('basic_melee'), delay = 0, flip = false } = {}) {
    const group = new THREE.Group();
    group.position.copy(center);
    group.visible = false;
    const length = 2.4;
    const angle = flip ? 0.62 : -0.62;
    const layers = [
      { thickness: 0.34, opacity: 0.28, tint: color },
      { thickness: 0.11, opacity: 1, tint: 0xffffff },
    ].map(({ thickness, opacity, tint }) => {
      const mesh = new THREE.Mesh(bladeGeometry(length, thickness), additive(tint, opacity));
      mesh.rotation.z = angle;
      mesh.position.set(-Math.cos(angle) * length / 2, -Math.sin(angle) * length / 2, 0);
      mesh.scale.x = 0.001;
      mesh.renderOrder = 20;
      mesh.userData.baseOpacity = opacity;
      group.add(mesh);
      return mesh;
    });
    const flash = new THREE.Mesh(new THREE.CircleGeometry(0.5, 28), additive(color, 0.55));
    flash.renderOrder = 19;
    group.add(flash);
    const sparks = Array.from({ length: 12 }, (_, index) => {
      const spark = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.035), additive(index % 3 ? color : 0xffffff, 1));
      const spread = angle + Math.PI / 2 + (Math.random() - 0.5) * 1.6 + (index % 2 ? Math.PI : 0);
      spark.userData.velocity = new THREE.Vector2(Math.cos(spread), Math.sin(spread)).multiplyScalar(1.4 + Math.random() * 1.6);
      spark.rotation.z = spread;
      spark.renderOrder = 21;
      group.add(spark);
      return spark;
    });
    this.scene.add(group);
    const start = performance.now() + delay;
    const draw = 110, hold = 70, fade = 280;
    return this._track({
      update: (now) => {
        const elapsed = now - start;
        if (elapsed < 0) return true;
        group.visible = true;
        this._billboard(group);
        const drawT = easeOut(clamp01(elapsed / draw));
        const fadeT = clamp01((elapsed - draw - hold) / fade);
        layers.forEach((mesh) => {
          mesh.scale.x = Math.max(0.001, drawT);
          mesh.material.opacity = mesh.userData.baseOpacity * (1 - fadeT);
        });
        flash.scale.setScalar(0.4 + drawT * 0.9);
        flash.material.opacity = 0.55 * (1 - clamp01(elapsed / 220));
        const sparkT = elapsed / 1000;
        sparks.forEach((spark) => {
          spark.position.set(spark.userData.velocity.x * sparkT, spark.userData.velocity.y * sparkT - 1.2 * sparkT * sparkT, 0);
          spark.material.opacity = 1 - clamp01(elapsed / 360);
        });
        return elapsed < draw + hold + fade;
      },
      dispose: () => disposeObject(group),
    });
  }

  /** An expanding ring and flash where an ability lands on its target. */
  burst(center, { color = 0xcff8ff, delay = 0, scale = 1 } = {}) {
    const group = new THREE.Group();
    group.position.copy(center);
    group.visible = false;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.46, 40), additive(color, 0.95));
    const core = new THREE.Mesh(new THREE.CircleGeometry(0.42, 32), additive(0xffffff, 0.8));
    const halo = new THREE.Mesh(new THREE.CircleGeometry(0.9, 32), additive(color, 0.3));
    [halo, ring, core].forEach((mesh, index) => { mesh.renderOrder = 18 + index; group.add(mesh); });
    const rays = Array.from({ length: 10 }, (_, index) => {
      const angle = (index / 10) * Math.PI * 2 + Math.random() * 0.3;
      const ray = new THREE.Mesh(bladeGeometry(0.9, 0.07), additive(color, 0.9));
      ray.rotation.z = angle;
      ray.renderOrder = 21;
      group.add(ray);
      return ray;
    });
    group.scale.setScalar(scale);
    this.scene.add(group);
    const start = performance.now() + delay;
    const duration = 520;
    return this._track({
      update: (now) => {
        const elapsed = now - start;
        if (elapsed < 0) return true;
        group.visible = true;
        this._billboard(group);
        const t = clamp01(elapsed / duration);
        const grow = easeOut(t);
        ring.scale.setScalar(0.6 + grow * 2.6);
        ring.material.opacity = 0.95 * (1 - t);
        core.scale.setScalar(1 + grow * 0.6);
        core.material.opacity = 0.8 * (1 - clamp01(elapsed / 200));
        halo.scale.setScalar(0.8 + grow * 1.4);
        halo.material.opacity = 0.3 * (1 - t);
        rays.forEach((ray) => {
          ray.scale.x = 0.3 + grow * 1.5;
          ray.material.opacity = 0.9 * (1 - t);
        });
        return t < 1;
      },
      dispose: () => disposeObject(group),
    });
  }

  /**
   * A glowing projectile that leaves the caster and arrives on the target at
   * `arriveAt` (performance.now() time), followed by an impact burst. This is
   * what visibly locks every ability onto the opponent.
   */
  tracer(getFrom, getTo, { color = 0xcff8ff, arriveAt = performance.now() + 400, travelMs = 420, impactScale = 1 } = {}) {
    const departAt = arriveAt - travelMs;
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 12), additive(0xffffff, 1));
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 12), additive(color, 0.45));
    orb.add(glow);
    orb.visible = false;
    orb.renderOrder = 22;
    const trailGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const trail = new THREE.Line(trailGeometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false }));
    trail.visible = false;
    trail.renderOrder = 21;
    this.scene.add(orb, trail);
    let landed = false;
    const from = new THREE.Vector3(), to = new THREE.Vector3(), tail = new THREE.Vector3();
    return this._track({
      update: (now) => {
        if (now < departAt) return true;
        if (!getFrom(from) || !getTo(to)) return false;
        const t = clamp01((now - departAt) / Math.max(1, travelMs));
        orb.visible = t < 1;
        trail.visible = t < 1;
        orb.position.lerpVectors(from, to, t);
        orb.position.y += Math.sin(t * Math.PI) * 0.35;
        tail.lerpVectors(from, to, Math.max(0, t - 0.28));
        trailGeometry.setFromPoints([tail, orb.position]);
        if (t >= 1 && !landed) {
          landed = true;
          this.burst(to.clone(), { color, scale: impactScale });
        }
        return t < 1;
      },
      dispose: () => { disposeObject(orb); disposeObject(trail); },
    });
  }

  /** Floating damage / MISS text above a point in the arena. */
  damageText(position, text, { crit = false, miss = false, color = '#ffffff' } = {}) {
    const div = document.createElement('div');
    div.textContent = text;
    Object.assign(div.style, {
      pointerEvents: 'none',
      fontFamily: 'inherit',
      fontWeight: '900',
      fontSize: crit ? '30px' : miss ? '18px' : '24px',
      letterSpacing: miss ? '0.2em' : '0.02em',
      color: miss ? '#cbd5e1' : crit ? '#ffd166' : color,
      textShadow: '0 2px 0 rgba(0,0,0,.85), 0 0 14px rgba(0,0,0,.65)',
      whiteSpace: 'nowrap',
      willChange: 'transform, opacity',
    });
    const label = new CSS2DObject(div);
    const origin = position.clone();
    origin.x += (Math.random() - 0.5) * 0.4;
    label.position.copy(origin);
    this.scene.add(label);
    const start = performance.now();
    const duration = 1000;
    return this._track({
      update: (now) => {
        const t = clamp01((now - start) / duration);
        label.position.y = origin.y + easeOut(t) * 0.9;
        const pop = t < 0.12 ? 1 + (1 - t / 0.12) * (crit ? 0.6 : 0.35) : 1;
        div.style.transform = `scale(${pop})`;
        div.style.opacity = String(1 - clamp01((t - 0.55) / 0.45));
        return t < 1;
      },
      dispose: () => { label.removeFromParent(); div.remove(); },
    });
  }

  /** Tint a fighter's materials briefly to show that they took damage. */
  hitFlash(root, { color = 0xff3b4d, duration = 280 } = {}) {
    if (!root) return null;
    const materials = new Set();
    root.traverse?.((node) => {
      if (!node.isMesh) return;
      (Array.isArray(node.material) ? node.material : [node.material]).forEach((material) => {
        if (!material?.emissive || /^FX/i.test(String(material.name || ''))) return;
        if (!ORIGINAL_EMISSIVE.has(material)) {
          ORIGINAL_EMISSIVE.set(material, { color: material.emissive.clone(), intensity: material.emissiveIntensity ?? 1 });
        }
        materials.add(material);
      });
    });
    if (!materials.size) return null;
    const tint = new THREE.Color(color);
    const start = performance.now();
    const restore = () => materials.forEach((material) => {
      const original = ORIGINAL_EMISSIVE.get(material);
      if (!original) return;
      material.emissive.copy(original.color);
      material.emissiveIntensity = original.intensity;
    });
    return this._track({
      update: (now) => {
        const t = clamp01((now - start) / duration);
        const k = 1 - t;
        materials.forEach((material) => {
          const original = ORIGINAL_EMISSIVE.get(material);
          material.emissive.copy(original.color).lerp(tint, k);
          material.emissiveIntensity = original.intensity + (1.6 - original.intensity) * k;
        });
        return t < 1;
      },
      dispose: restore,
    });
  }
}
