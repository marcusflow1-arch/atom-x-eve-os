import * as THREE from 'three';

const STATES = {
  IDLE: 'Idle',
  WALK: 'Walk',
  RUN: 'Run',
  CROUCH_IDLE: 'CrouchIdle',
  CROUCH_WALK: 'CrouchWalk',
  CROUCH_RUN: 'CrouchRun',
  ROLL: 'Roll',
  DODGE: 'Dodge',
  JUMP: 'Jump',
  KICK: 'Kick',
  FIRE_ARROW: 'FireArrow',
  BLOCK: 'Block',
};

// STRICT ALIASING: only exact spelling variations of the same animation.
const ACTION_ALIASES = {
  [STATES.IDLE]: ['Idle', 'idle'],
  [STATES.WALK]: ['Walk', 'walk'],
  [STATES.RUN]: ['Run', 'run', 'running'],
  [STATES.CROUCH_IDLE]: ['CrouchIdle', 'crouchIdle', 'crouch_idle'],
  [STATES.CROUCH_WALK]: ['CrouchWalk', 'crouchWalk', 'crouch_walk'],
  [STATES.CROUCH_RUN]: ['CrouchRun', 'crouchRun', 'crouch_run'],
  [STATES.ROLL]: ['Roll', 'roll'],
  [STATES.DODGE]: ['Dodge', 'dodge'],
  [STATES.JUMP]: ['Jump', 'jump', 'jumpStart'],
  [STATES.KICK]: ['Kick', 'kick'],
  [STATES.FIRE_ARROW]: ['FireArrow', 'fireArrow', 'fire_arrow'],
  [STATES.BLOCK]: ['Block', 'block'],
};

const LOOP_STATES = new Set([
  STATES.IDLE,
  STATES.WALK,
  STATES.RUN,
  STATES.CROUCH_IDLE,
  STATES.CROUCH_WALK,
  STATES.CROUCH_RUN,
  STATES.BLOCK,
]);

const ONE_SHOT_STATES = new Set([
  STATES.JUMP,
  STATES.ROLL,
  STATES.DODGE,
  STATES.KICK,
  STATES.FIRE_ARROW,
]);

const ONE_SHOT_DURATION = {
  [STATES.JUMP]: 0.9,
  [STATES.ROLL]: 0.8,
  [STATES.DODGE]: 0.6,
  [STATES.KICK]: 0.6,
  [STATES.FIRE_ARROW]: 0.7,
};

export function createLunaDashboardPlayerController({ mixer, oneShotRef }) {
  const actions = {};
  let currentState = null;
  let currentActionKey = null;
  let lastMovement = { moving: false, running: false };

  let isBusy = false;
  let isBlocking = false;
  let isCrouching = false;
  let isGrounded = true;
  let isDead = false;
  let busyResetAt = 0;

  let velocity = new THREE.Vector3();
  let verticalOffset = 0;
  let specialMoveVelocity = null;
  let specialMoveTimer = 0;

  const now = () => performance.now() / 1000;

  const resolveActionKey = (state) => {
    const aliases = ACTION_ALIASES[state] || [state];
    for (const alias of aliases) {
      if (actions[alias]) return alias;
    }
    return null;
  };

  const ChangeState = (newState, options = {}) => {
    if (isDead) return false;
    if (isBusy && !options.force && ONE_SHOT_STATES.has(currentState)) return false;
    if (!options.force && currentState === newState) return true;

    const nextKey = resolveActionKey(newState);
    if (!nextKey) {
      console.warn(`[Controller] Missing animation for: ${newState}`);
      return false;
    }

    const nextAction = actions[nextKey];
    const previousAction = currentActionKey ? actions[currentActionKey] : null;
    nextAction.enabled = true;
    nextAction.setEffectiveWeight(1);
    nextAction.setEffectiveTimeScale(options.timeScale || 1);

    if (LOOP_STATES.has(newState)) {
      nextAction.setLoop(THREE.LoopRepeat);
      nextAction.clampWhenFinished = false;
    } else {
      nextAction.setLoop(THREE.LoopOnce, 1);
      nextAction.clampWhenFinished = true;
    }

    currentState = newState;
    currentActionKey = nextKey;

    if (previousAction !== nextAction) {
      if (previousAction) previousAction.fadeOut(options.fade ?? 0.15);
      nextAction.reset().fadeIn(options.fade ?? 0.15).play();
    } else if (!nextAction.isRunning()) {
      nextAction.play();
    }
    return true;
  };

  const ResetBusy = () => {
    isBusy = false;
    busyResetAt = 0;
    if (oneShotRef) oneShotRef.current = false;
    HandleMovement(lastMovement);
  };

  const startOneShot = (state, duration = ONE_SHOT_DURATION[state]) => {
    if (isDead || isBusy || isBlocking) return false;
    if (!resolveActionKey(state)) return false;
    const changed = ChangeState(state, { force: true, fade: 0.05 });
    if (!changed) return false;
    isBusy = true;
    busyResetAt = now() + duration;
    if (oneShotRef) oneShotRef.current = true;
    return true;
  };

  const HandleMovement = ({ moving = lastMovement.moving, running = lastMovement.running } = {}) => {
    if (isDead || isBusy) return;

    if (isBlocking) {
      ChangeState(STATES.BLOCK);
      return;
    }

    if (isCrouching) {
      if (!moving) ChangeState(STATES.CROUCH_IDLE);
      else if (running) ChangeState(STATES.CROUCH_RUN);
      else ChangeState(STATES.CROUCH_WALK);
      return;
    }

    // Common-sense fallback: if the player is not actively moving, force Idle only.
    if (!moving) ChangeState(STATES.IDLE);
    else if (running) ChangeState(STATES.RUN);
    else ChangeState(STATES.WALK);
  };

  const bindClips = (clipsByKey = {}) => {
    Object.entries(clipsByKey).forEach(([key, clip]) => {
      const action = mixer.clipAction(clip);
      action.enabled = true;
      action.setEffectiveWeight(1);
      actions[key] = action;
    });

    ChangeState(STATES.IDLE, { force: true });
  };

  const updateActionState = ({ isMoving, isRunning }) => {
    lastMovement = { moving: !!isMoving, running: !!isRunning };
    HandleMovement(lastMovement);
  };

  const requestJump = () => {
    if (!isGrounded) return false;
    velocity.y = Math.sqrt(5 * -2 * -20);
    verticalOffset = Math.max(verticalOffset, 0.01);
    isGrounded = false;
    return startOneShot(STATES.JUMP);
  };

  const startSpecialMove = (state, direction, speed, duration = ONE_SHOT_DURATION[state], options = {}) => {
    if (isDead || isBusy || isBlocking) return false;

    const dir = direction?.clone?.() || new THREE.Vector3(0, 0, -1);
    if (dir.lengthSq() === 0) dir.set(0, 0, -1);
    dir.y = 0;
    dir.normalize();

    if (!options.movementOnly) {
      const started = startOneShot(state, duration);
      if (!started) return false;
    } else {
      isBusy = true;
      busyResetAt = now() + duration;
      if (oneShotRef) oneShotRef.current = true;
    }

    specialMoveVelocity = dir.multiplyScalar(speed);
    specialMoveTimer = duration;
    return true;
  };

  const requestRoll = (direction) => startSpecialMove(STATES.ROLL, direction, 14, ONE_SHOT_DURATION[STATES.ROLL]);
  const requestDodge = (direction) => startSpecialMove(STATES.DODGE, direction, 13, ONE_SHOT_DURATION[STATES.DODGE], { movementOnly: true });

  const HandleCombat = (kind = 'attack') => {
    const state = kind === 'kick' ? STATES.KICK : STATES.FIRE_ARROW;
    return startOneShot(state);
  };

  const updateMotion = (model, delta, groundY = model.position.y) => {
    if (specialMoveTimer > 0 && specialMoveVelocity) {
      model.position.x += specialMoveVelocity.x * delta;
      model.position.z += specialMoveVelocity.z * delta;
      specialMoveTimer -= delta;
      if (specialMoveTimer <= 0) specialMoveVelocity = null;
    }

    if (busyResetAt > 0 && now() >= busyResetAt) ResetBusy();

    if (!isGrounded || verticalOffset > 0) {
      velocity.y += -20 * delta;
      verticalOffset += velocity.y * delta;

      if (verticalOffset <= 0) {
        verticalOffset = 0;
        velocity.y = 0;
        isGrounded = true;
      } else {
        isGrounded = false;
      }
    }

    model.position.y = groundY + verticalOffset;
  };

  const requestCrouch = (enabled) => {
    if (isBusy || isBlocking) return false;
    isCrouching = enabled;
    HandleMovement(lastMovement);
    return true;
  };

  const setBlocking = (enabled) => {
    if (isBusy && enabled) return false;
    isBlocking = enabled;
    if (enabled) ChangeState(STATES.BLOCK, { force: true });
    else HandleMovement(lastMovement);
    return true;
  };

  mixer.addEventListener('finished', (event) => {
    if (event.action?.getClip?.()?.name !== currentActionKey) return;
    if (ONE_SHOT_STATES.has(currentState)) ResetBusy();
  });

  return {
    actions,
    bindClips,
    ChangeState,
    PlayAnimation: ChangeState,
    HandleMovement: updateActionState,
    HandleCombat,
    HandleJump: requestJump,
    HandleAirborne: () => {},
    HandleDamage: () => false,
    HandleDeath: () => { isDead = true; return false; },
    playOneShot: (name) => HandleCombat(name === 'kick' ? 'kick' : 'attack'),
    requestAttack: HandleCombat,
    requestCrouch,
    requestDodge,
    requestHitReact: () => false,
    requestJump,
    requestRoll,
    setAiming: setBlocking,
    setBlocking,
    updateActionState,
    updateMotion,
    getCurrent: () => currentState || STATES.IDLE,
    getIsAiming: () => isBlocking,
    getIsBlocking: () => isBlocking,
    getIsCrouching: () => isCrouching,
    isMovementOverridden: () => isBusy || isBlocking,
    has: (name) => !!resolveActionKey(name),
    getDebugState: () => ({ currentState, currentActionKey, ...lastMovement, isBusy, isBlocking, isCrouching, isGrounded, velocity }),
  };
}