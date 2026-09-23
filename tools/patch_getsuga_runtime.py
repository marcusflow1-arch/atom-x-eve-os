from pathlib import Path

path = Path('src/components/getsuga/GetsugaAbilityRuntime.js')
s = path.read_text()
s = s.replace("import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';\n", '')

constructor = r'''  constructor({ scene, camera = null, getPlayer, onEvent = null, impactDistance = 7.2 } = {}) {
    this.scene = scene;
    this.camera = camera;
    this.getPlayer = getPlayer;
    this.onEvent = onEvent || (() => {});
    this.impactDistance = impactDistance;
    this.active = false;
    this.time = 0;
    this.lastFrame = -1;
    this.original = null;
    this.proxy = null;
    this.localFx = null;
    this.worldFx = null;
    this.released = false;
    this.impacted = false;
    this.disposed = false;
    this.materials = [];
    this.geometries = [];
    this.tmp = new THREE.Vector3();
    this.tmp2 = new THREE.Vector3();
    this.tmpQ = new THREE.Quaternion();
    this.origin = new THREE.Vector3();
    this.originQ = new THREE.Quaternion();
    this.forward = new THREE.Vector3(0, 0, 1);
    this.up = new THREE.Vector3(0, 1, 0);
    this.bones = {};
    this.rest = new Map();
    this.ready = false;
    this.pendingPlay = false;
    this.packageGltf = null;
    this.mixer = null;
    this.attackClip = null;
    this.attackAction = null;
    this.idleAction = null;
    this.packageEnergyBlade = null;
    this.followOffset = new THREE.Vector3();
    this.followRotation = new THREE.Quaternion();
    this.loadError = null;
    this.initializeCharacter();
  }

  async initializeCharacter() {
    try {
      const gltf = await loadPackagedCharacter();
      if (this.disposed) return;
      const original = this.getPlayer?.();
      if (!original?.parent) throw new Error('Luna player scene is not ready for the Getsuga character.');

      this.packageGltf = gltf;
      this.original = original;
      this.proxy = gltf.scene;
      this.proxy.name = 'Getsuga_PackageCharacter';
      this.proxy.traverse((node) => {
        if (node.isMesh) {
          node.frustumCulled = false;
          node.castShadow = true;
          node.receiveShadow = true;
        }
        if (node.name === 'SK_EnergyBlade') this.packageEnergyBlade = node;
      });

      original.updateMatrixWorld(true);
      this.proxy.position.copy(original.position);
      this.proxy.quaternion.copy(original.quaternion);
      this.proxy.scale.set(1, 1, 1);
      original.parent.add(this.proxy);
      this.proxy.updateMatrixWorld(true);

      const originalBox = new THREE.Box3().setFromObject(original);
      const packageBox = new THREE.Box3().setFromObject(this.proxy);
      const originalSize = originalBox.getSize(new THREE.Vector3());
      const packageSize = packageBox.getSize(new THREE.Vector3());
      const scale = packageSize.y > .0001 ? originalSize.y / packageSize.y : 1;
      this.proxy.scale.multiplyScalar(scale);
      this.proxy.updateMatrixWorld(true);

      const scaledBox = new THREE.Box3().setFromObject(this.proxy);
      const originalCenter = originalBox.getCenter(new THREE.Vector3());
      const packageCenter = scaledBox.getCenter(new THREE.Vector3());
      this.proxy.position.x += originalCenter.x - packageCenter.x;
      this.proxy.position.y += originalBox.min.y - scaledBox.min.y;
      this.proxy.position.z += originalCenter.z - packageCenter.z;
      this.proxy.updateMatrixWorld(true);
      this.followOffset.copy(this.proxy.position).sub(original.position);
      this.followRotation.copy(original.quaternion).invert().multiply(this.proxy.quaternion);

      this.attackClip = gltf.animations.find((clip) => clip.name === 'GetsugaTensho') || gltf.animations[0];
      if (!this.attackClip) throw new Error('GetsugaTensho animation was not found in the packaged character.');
      this.mixer = new THREE.AnimationMixer(this.proxy);
      this.attackAction = this.mixer.clipAction(this.attackClip);
      this.attackAction.setLoop(THREE.LoopOnce, 1);
      this.attackAction.clampWhenFinished = true;

      const idleClip = createIdleClip(this.attackClip);
      this.idleAction = this.mixer.clipAction(idleClip);
      this.idleAction.setLoop(THREE.LoopRepeat, Infinity);
      this.idleAction.reset().setEffectiveWeight(1).play();
      if (this.packageEnergyBlade) this.packageEnergyBlade.visible = false;

      this.captureBones();
      original.visible = false;
      this.ready = true;
      this.emit('idle');
      if (this.pendingPlay) {
        this.pendingPlay = false;
        this.play();
      }
    } catch (error) {
      this.loadError = error;
      console.error('[Getsuga] Exact packaged character failed to load:', error);
      this.emit('loadError');
    }
  }

'''
start = s.index('  constructor({')
end = s.index('  isPlaying() {', start)
s = s[:start] + constructor + s[end:]

play = r'''  play() {
    if (this.disposed || !this.scene) return false;
    if (!this.ready) {
      this.pendingPlay = true;
      return true;
    }
    if (this.active) return false;

    this.localFx = new THREE.Group();
    this.localFx.name = 'Getsuga_LocalFX';
    this.worldFx = new THREE.Group();
    this.worldFx.name = 'Getsuga_WorldFX';
    this.scene.add(this.localFx, this.worldFx);

    this.setupEffects();
    this.time = 0;
    this.lastFrame = -1;
    this.released = false;
    this.impacted = false;
    this.active = true;
    if (this.packageEnergyBlade) this.packageEnergyBlade.visible = true;
    this.attackAction.enabled = true;
    this.attackAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1);
    this.attackAction.crossFadeFrom(this.idleAction, .18, true).play();
    this.syncLocalFrame();
    this.emit('castStart');
    return true;
  }

'''
start = s.index('  play() {')
end = s.index('  captureBones() {', start)
s = s[:start] + play + s[end:]

update = r'''  update(dt) {
    if (this.disposed) return;
    const step = Math.min(.05, Math.max(0, dt));
    this.mixer?.update(step);

    if (!this.active && this.original && this.proxy) {
      const offset = this.followOffset.clone().applyQuaternion(this.original.quaternion);
      this.proxy.position.copy(this.original.position).add(offset);
      this.proxy.quaternion.copy(this.original.quaternion).multiply(this.followRotation);
      this.proxy.updateMatrixWorld(true);
    }
    if (!this.active) return;

    this.time += step;
    const frame = this.time * FPS + 1;

    // Exact GLB animation owns the skeleton pose; effects only follow its timeline.
    this.syncLocalFrame();
    this.updateBlade(frame);
    this.updateAura(frame);
    this.updateRocks(frame);
    this.updateSwing(frame);

    if (!this.released && frame >= RELEASE_FRAME) this.releaseWave();
    this.updateWave();

    if (this.lastFrame >= 0) {
      for (const event of EVENTS) {
        if (event.name === 'release') continue;
        if (this.lastFrame < event.frame && frame >= event.frame) this.emit(event.name);
      }
    }
    this.lastFrame = frame;

    if (this.time >= DURATION) this.finish(true);
  }

'''
start = s.index('  update(dt) {')
end = s.index('  finish(emitEnd = true) {', start)
s = s[:start] + update + s[end:]

finish_dispose = r'''  finish(emitEnd = true) {
    if (!this.active && !this.localFx && !this.worldFx) return;
    if (this.idleAction && this.attackAction) {
      this.idleAction.enabled = true;
      this.idleAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();
      this.idleAction.crossFadeFrom(this.attackAction, .24, true);
    }
    if (this.packageEnergyBlade) this.packageEnergyBlade.visible = false;
    if (this.localFx) this.scene?.remove(this.localFx);
    if (this.worldFx) this.scene?.remove(this.worldFx);
    this.localFx = null;
    this.worldFx = null;
    for (const geometry of this.geometries) geometry?.dispose?.();
    for (const material of this.materials) material?.dispose?.();
    this.geometries = [];
    this.materials = [];
    this.active = false;
    this.time = 0;
    this.lastFrame = -1;
    this.released = false;
    this.impacted = false;
    if (emitEnd) {
      this.emit('end');
      this.emit('idle');
    }
  }

  dispose() {
    this.pendingPlay = false;
    this.finish(false);
    this.disposed = true;
    this.mixer?.stopAllAction();
    if (this.original) this.original.visible = true;
    if (this.proxy?.parent) this.proxy.parent.remove(this.proxy);
    this.proxy?.traverse((node) => {
      node.geometry?.dispose?.();
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.filter(Boolean).forEach((material) => material.dispose?.());
    });
    this.proxy = null;
    this.original = null;
    this.packageGltf = null;
    this.mixer = null;
    this.attackAction = null;
    this.idleAction = null;
    this.rest.clear();
    this.bones = {};
  }
'''
start = s.index('  finish(emitEnd = true) {')
end = s.index('\n}\n\nexport default GetsugaAbilityRuntime;', start)
s = s[:start] + finish_dispose + s[end:]

path.write_text(s)
print('patched', path, 'lines=', len(s.splitlines()))
