import * as THREE from 'three';

const ONE_SHOTS = new Set(['roll', 'kick', 'shoot', 'multiShot', 'hitReact', 'death', 'crouchEnter', 'blockEnter', 'blockExit']);
const PRIORITY = { roll: 100, hitReact: 90, kick: 80, shoot: 80, multiShot: 80, block: 60, locomotion: 10 };

export function createPlayerAnimationController({ mixer, blend = 0.2, oneShotRef }) {
  const actions = {};
  let current = 'idle';
  let lockedState = null;
  let isCrouching = false;
  let crouchEntered = false;
  let rollTimer = 0;
  let rollVelocity = null;

  const bindClips = (clipsByKey) => {
    Object.entries(clipsByKey).forEach(([key, clip]) => {
      const action = mixer.clipAction(clip);
      if (ONE_SHOTS.has(key)) {
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
      }
      actions[key] = action;
    });

    const start = actions.idle || actions.walk || actions.run;
    if (start) {
      current = start.getClip().name;
      start.reset().fadeIn(0.2).play();
    }
  };

  const has = (name) => !!actions[name];

  const playLoop = (name, timeScale = 1, fade = blend) => {
    const next = actions[name];
    if (!next || current === name || lockedState) return;
    const prev = actions[current];
    next.enabled = true;
    next.setEffectiveTimeScale(timeScale);
    next.setEffectiveWeight(1);
    next.reset().fadeIn(fade).play();
    if (prev && prev !== next) prev.fadeOut(fade);
    current = name;
  };

  const playOneShot = (name, timeScale = 1, fade = 0.1) => {
    const action = actions[name];
    if (!action || lockedState) return false;
    lockedState = name;
    if (oneShotRef) oneShotRef.current = true;
    const prev = actions[current];
    if (prev && prev !== action) prev.fadeOut(fade);
    action.enabled = true;
    action.setEffectiveTimeScale(timeScale);
    action.reset().fadeIn(fade).play();
    current = name;
    return true;
  };

  const requestCrouch = (enabled) => {
    if (isCrouching === enabled) return;
    isCrouching = enabled;
    if (enabled) {
      crouchEntered = false;
      if (has('crouchEnter')) playOneShot('crouchEnter', 1, 0.12);
      else crouchEntered = true;
    } else {
      crouchEntered = false;
      lockedState = null;
      if (oneShotRef) oneShotRef.current = false;
    }
  };

  const requestRoll = (direction) => {
    if (!has('roll') || lockedState) return false;
    const dir = direction?.clone?.() || new THREE.Vector3(0, 0, -1);
    if (dir.lengthSq() === 0) dir.set(0, 0, -1);
    dir.normalize();
    rollTimer = 0.55;
    rollVelocity = dir.multiplyScalar(4.8);
    return playOneShot('roll', 1.2, 0.08);
  };

  const updateActionState = ({ isMoving, isRunning, isSprinting }) => {
    if (lockedState) return;
    if (isCrouching) {
      if (!crouchEntered) crouchEntered = true;
      if (isMoving) playLoop(isRunning || isSprinting ? 'crouchRun' : 'crouchWalk', 1, 0.18);
      else playLoop('crouchIdle', 1, 0.18);
      return;
    }
    if (isMoving) playLoop(isSprinting && has('sprint') ? 'sprint' : isRunning ? 'run' : 'walk', 1, 0.18);
    else playLoop('idle', 1, 0.2);
  };

  const updateMotion = (model, delta) => {
    if (rollTimer > 0 && rollVelocity) {
      model.position.x += rollVelocity.x * delta;
      model.position.z += rollVelocity.z * delta;
      rollTimer -= delta;
    }
  };

  mixer.addEventListener('finished', (e) => {
    const name = e.action?.getClip()?.name;
    if (!name || !ONE_SHOTS.has(name)) return;
    lockedState = null;
    if (oneShotRef) oneShotRef.current = false;
    if (name === 'crouchEnter') crouchEntered = true;
  });

  return {
    actions,
    bindClips,
    playOneShot,
    requestCrouch,
    requestRoll,
    updateActionState,
    updateMotion,
    getCurrent: () => current,
    getIsCrouching: () => isCrouching,
    has,
  };
}