import * as THREE from 'three';

const ACTION_CLIPS = new Set([
  'death', 'hitReact', 'roll', 'attack', 'shoot', 'multiShot', 'kick',
  'crouchEnter', 'blockEnter', 'blockExit',
]);

const PRIORITY = {
  idle: 0,
  movement: 10,
  aim: 20,
  block: 30,
  attack: 40,
  roll: 50,
  hitReact: 60,
  death: 70,
};

const ACTION_PRIORITY = {
  death: PRIORITY.death,
  hitReact: PRIORITY.hitReact,
  roll: PRIORITY.roll,
  attack: PRIORITY.attack,
  shoot: PRIORITY.attack,
  multiShot: PRIORITY.attack,
  kick: PRIORITY.attack,
  crouchEnter: PRIORITY.movement,
  blockEnter: PRIORITY.block,
  blockExit: PRIORITY.block,
};

export function createPlayerAnimationController({ mixer, blend = 0.2, oneShotRef }) {
  const actions = {};
  let current = 'idle';
  let lockedState = null;
  let lockedPriority = PRIORITY.idle;
  let isCrouching = false;
  let isBlocking = false;
  let isAiming = false;
  let rollTimer = 0;
  let rollVelocity = null;

  const bindClips = (clipsByKey) => {
    Object.entries(clipsByKey).forEach(([key, clip]) => {
      const action = mixer.clipAction(clip);
      if (ACTION_CLIPS.has(key)) {
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = key !== 'blockExit';
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
  const fallback = (...names) => names.find((name) => name && actions[name]);
  const canInterrupt = (priority) => !lockedState || priority > lockedPriority;

  const fadeTo = (name, { timeScale = 1, fade = blend } = {}) => {
    const next = actions[name];
    if (!next || current === name) return false;
    const prev = actions[current];
    next.enabled = true;
    next.setEffectiveTimeScale(timeScale);
    next.setEffectiveWeight(1);
    next.reset().fadeIn(fade).play();
    if (prev && prev !== next) prev.fadeOut(fade);
    current = name;
    return true;
  };

  const clearLock = () => {
    lockedState = null;
    lockedPriority = PRIORITY.idle;
    if (oneShotRef) oneShotRef.current = false;
  };

  const playAction = (name, { priority = ACTION_PRIORITY[name] || PRIORITY.attack, timeScale = 1, fade = 0.1 } = {}) => {
    if (!actions[name] || !canInterrupt(priority)) return false;
    lockedState = name;
    lockedPriority = priority;
    if (oneShotRef) oneShotRef.current = true;
    return fadeTo(name, { timeScale, fade });
  };

  const requestCrouch = (enabled) => {
    if (isCrouching === enabled || lockedPriority >= PRIORITY.roll) return false;
    isCrouching = enabled;
    if (enabled && has('crouchEnter')) return playAction('crouchEnter', { priority: PRIORITY.movement, fade: 0.12 });
    clearLock();
    return true;
  };

  const setBlocking = (enabled) => {
    if (isBlocking === enabled) return false;
    isBlocking = enabled;
    if (enabled) {
      if (has('blockEnter')) return playAction('blockEnter', { priority: PRIORITY.block, fade: 0.12 });
      clearLock();
      return fadeTo(fallback('blockHold', 'block', 'idle'), { fade: 0.16 });
    }
    if (has('blockExit')) return playAction('blockExit', { priority: PRIORITY.block, fade: 0.12 });
    clearLock();
    return true;
  };

  const setAiming = (enabled) => {
    if (isAiming === enabled) return false;
    isAiming = enabled;
    return true;
  };

  const requestAttack = (kind = 'attack', timeScale = 1) => {
    const clip = fallback(kind, kind === 'attack' ? 'shoot' : null, 'attack', 'kick');
    if (!clip || isBlocking || lockedPriority >= PRIORITY.attack) return false;
    return playAction(clip, { priority: PRIORITY.attack, timeScale, fade: 0.08 });
  };

  const requestHitReact = () => {
    const clip = fallback('hitReact');
    return clip ? playAction(clip, { priority: PRIORITY.hitReact, fade: 0.08 }) : false;
  };

  const requestRoll = (direction) => {
    const clip = fallback('roll');
    if (!clip || lockedPriority >= PRIORITY.roll) return false;
    const dir = direction?.clone?.() || new THREE.Vector3(0, 0, -1);
    if (dir.lengthSq() === 0) dir.set(0, 0, -1);
    dir.normalize();
    rollTimer = 0.45;
    rollVelocity = dir.multiplyScalar(6.7);
    return playAction(clip, { priority: PRIORITY.roll, timeScale: 1.15, fade: 0.07 });
  };

  const updateActionState = ({ isMoving, isRunning, isSprinting }) => {
    if (lockedPriority >= PRIORITY.attack) return;

    if (isBlocking) {
      if (!lockedState) fadeTo(fallback('blockHold', 'block', 'idle'), { fade: 0.16 });
      return;
    }

    const movingTier = isSprinting ? 'sprint' : isRunning ? 'run' : 'walk';

    if (isAiming) {
      if (isMoving) fadeTo(fallback('aimMove', `aim${movingTier.charAt(0).toUpperCase()}${movingTier.slice(1)}`, movingTier), { fade: 0.18 });
      else fadeTo(fallback('aimIdle', 'aim', 'idle'), { fade: 0.18 });
      return;
    }

    if (isCrouching) {
      if (isMoving) fadeTo(fallback(isRunning || isSprinting ? 'crouchRun' : 'crouchWalk', 'crouchIdle', 'walk'), { fade: 0.18 });
      else fadeTo(fallback('crouchIdle', 'idle'), { fade: 0.18 });
      return;
    }

    if (isMoving) fadeTo(fallback(movingTier, isRunning ? 'run' : 'walk', 'idle'), { fade: 0.18 });
    else fadeTo(fallback('idle'), { fade: 0.2 });
  };

  const updateMotion = (model, delta) => {
    if (rollTimer > 0 && rollVelocity) {
      const t = Math.max(0, rollTimer / 0.45);
      const ease = 0.35 + 0.65 * t;
      model.position.x += rollVelocity.x * ease * delta;
      model.position.z += rollVelocity.z * ease * delta;
      rollTimer -= delta;
      if (rollTimer <= 0) rollVelocity = null;
    }
  };

  mixer.addEventListener('finished', (e) => {
    const name = e.action?.getClip()?.name;
    if (!name || !ACTION_CLIPS.has(name)) return;

    if (name === 'blockEnter' && isBlocking) {
      clearLock();
      fadeTo(fallback('blockHold', 'block', 'idle'), { fade: 0.12 });
      return;
    }

    clearLock();
  });

  return {
    actions,
    bindClips,
    playOneShot: (name, timeScale = 1) => playAction(name, { timeScale }),
    requestAttack,
    requestCrouch,
    requestHitReact,
    requestRoll,
    setAiming,
    setBlocking,
    updateActionState,
    updateMotion,
    getCurrent: () => current,
    getIsAiming: () => isAiming,
    getIsBlocking: () => isBlocking,
    getIsCrouching: () => isCrouching,
    isMovementOverridden: () => lockedPriority >= PRIORITY.roll,
    has,
  };
}