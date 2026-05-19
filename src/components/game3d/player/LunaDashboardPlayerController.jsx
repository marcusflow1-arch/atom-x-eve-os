import * as THREE from 'three';

const STATES = {
  IDLE: 'idle',
  RUN: 'run',
  RUN_STOP: 'runStop',
  RUN_BACK: 'runBack',
  DRAW_ARROW: 'drawArrow',
  DODGE_RIGHT: 'dodgeRight',
  DODGE_LEFT: 'dodgeLeft',
  DODGE_FORWARD: 'dodgeForward',
  DODGE_BACKWARD: 'dodgeBackward',
  DIVE_FORWARD: 'diveForward',
  AIM_WALK_RIGHT: 'aimWalkRight',
  AIM_WALK_LEFT: 'aimWalkLeft',
  AIM_WALK_FORWARD: 'aimWalkForward',
  AIM_WALK_BACKWARD: 'aimWalkBackward',
};

const LOOP_STATES = new Set([
  STATES.IDLE,
  STATES.RUN,
  STATES.RUN_BACK,
  STATES.AIM_WALK_RIGHT,
  STATES.AIM_WALK_LEFT,
  STATES.AIM_WALK_FORWARD,
  STATES.AIM_WALK_BACKWARD,
]);

const ONE_SHOT_DURATION = {
  [STATES.RUN_STOP]: 0.45,
  [STATES.DRAW_ARROW]: 0.7,
  [STATES.DODGE_RIGHT]: 0.45,
  [STATES.DODGE_LEFT]: 0.45,
  [STATES.DODGE_FORWARD]: 0.45,
  [STATES.DODGE_BACKWARD]: 0.45,
  [STATES.DIVE_FORWARD]: 0.8,
};

const DODGE_STATE_BY_DIRECTION = {
  right: STATES.DODGE_RIGHT,
  left: STATES.DODGE_LEFT,
  forward: STATES.DODGE_FORWARD,
  backward: STATES.DODGE_BACKWARD,
};

export function createLunaDashboardPlayerController({ mixer, oneShotRef }) {
  const actions = {};
  let currentState = null;
  let previousMoving = false;
  let lastMovement = { moving: false, running: false, direction: 'forward', aiming: false };
  let isBusy = false;
  let isAiming = false;
  let isDead = false;
  let busyResetAt = 0;
  let specialMoveVelocity = null;
  let specialMoveTimer = 0;

  const now = () => performance.now() / 1000;
  const hasAction = (state) => !!actions[state];

  const playState = (state, options = {}) => {
    if (isDead || !hasAction(state)) return false;
    if (!options.force && currentState === state) return true;

    const nextAction = actions[state];
    const previousAction = currentState ? actions[currentState] : null;

    nextAction.enabled = true;
    nextAction.setEffectiveWeight(1);
    nextAction.setEffectiveTimeScale(options.timeScale || 1);

    if (LOOP_STATES.has(state)) {
      nextAction.setLoop(THREE.LoopRepeat, Infinity);
      nextAction.clampWhenFinished = false;
    } else {
      nextAction.setLoop(THREE.LoopOnce, 1);
      nextAction.clampWhenFinished = true;
    }

    if (previousAction && previousAction !== nextAction) previousAction.fadeOut(options.fade ?? 0.12);
    nextAction.reset().fadeIn(options.fade ?? 0.12).play();
    currentState = state;
    return true;
  };

  const movementStateFor = ({ moving, direction, aiming }) => {
    if (!moving) return STATES.IDLE;
    if (aiming) {
      if (direction === 'right') return STATES.AIM_WALK_RIGHT;
      if (direction === 'left') return STATES.AIM_WALK_LEFT;
      if (direction === 'backward') return STATES.AIM_WALK_BACKWARD;
      return STATES.AIM_WALK_FORWARD;
    }
    if (direction === 'backward') return STATES.RUN_BACK;
    return STATES.RUN;
  };

  const resetBusy = () => {
    isBusy = false;
    busyResetAt = 0;
    if (oneShotRef) oneShotRef.current = false;
    handleMovement(lastMovement);
  };

  const handleMovement = ({ moving = lastMovement.moving, running = lastMovement.running, direction = lastMovement.direction, aiming = isAiming } = {}) => {
    lastMovement = { moving: !!moving, running: !!running, direction, aiming: !!aiming };
    if (isDead || isBusy) return;

    if (previousMoving && !moving && hasAction(STATES.RUN_STOP)) {
      previousMoving = false;
      isBusy = true;
      busyResetAt = now() + ONE_SHOT_DURATION[STATES.RUN_STOP];
      if (oneShotRef) oneShotRef.current = true;
      playState(STATES.RUN_STOP, { force: true, fade: 0.05 });
      return;
    }

    previousMoving = !!moving;
    playState(movementStateFor(lastMovement));
  };

  const bindClips = (clipsByKey = {}) => {
    Object.entries(clipsByKey).forEach(([key, clip]) => {
      const action = mixer.clipAction(clip);
      action.enabled = true;
      action.setEffectiveWeight(1);
      actions[key] = action;
    });

    playState(STATES.IDLE, { force: true });
  };

  const startSpecialMove = (state, directionVector, speed, duration = ONE_SHOT_DURATION[state]) => {
    if (isDead || isBusy || !hasAction(state)) return false;

    const dir = directionVector?.clone?.() || new THREE.Vector3(0, 0, -1);
    if (dir.lengthSq() === 0) dir.set(0, 0, -1);
    dir.y = 0;
    dir.normalize();

    isBusy = true;
    busyResetAt = now() + duration;
    if (oneShotRef) oneShotRef.current = true;
    specialMoveVelocity = dir.multiplyScalar(speed);
    specialMoveTimer = duration;
    return playState(state, { force: true, fade: 0.05 });
  };

  const requestDodge = (directionVector, directionName = 'forward') => {
    const state = DODGE_STATE_BY_DIRECTION[directionName] || STATES.DODGE_FORWARD;
    return startSpecialMove(state, directionVector, 13, ONE_SHOT_DURATION[state]);
  };

  const requestRoll = (directionVector) => startSpecialMove(STATES.DIVE_FORWARD, directionVector, 14, ONE_SHOT_DURATION[STATES.DIVE_FORWARD]);

  const requestAttack = () => {
    if (isDead || isBusy) return false;
    isBusy = true;
    busyResetAt = now() + ONE_SHOT_DURATION[STATES.DRAW_ARROW];
    if (oneShotRef) oneShotRef.current = true;
    return playState(STATES.DRAW_ARROW, { force: true, fade: 0.05 });
  };

  const updateMotion = (model, delta, groundY = model.position.y) => {
    if (specialMoveTimer > 0 && specialMoveVelocity) {
      model.position.x += specialMoveVelocity.x * delta;
      model.position.z += specialMoveVelocity.z * delta;
      specialMoveTimer -= delta;
      if (specialMoveTimer <= 0) specialMoveVelocity = null;
    }

    if (busyResetAt > 0 && now() >= busyResetAt) resetBusy();
    model.position.y = groundY;
  };

  const setAiming = (enabled) => {
    isAiming = !!enabled;
    handleMovement({ ...lastMovement, aiming: isAiming });
    return true;
  };

  mixer.addEventListener('finished', (event) => {
    if (event.action !== actions[currentState]) return;
    if (!LOOP_STATES.has(currentState)) resetBusy();
  });

  return {
    actions,
    bindClips,
    ChangeState: playState,
    PlayAnimation: playState,
    HandleMovement: handleMovement,
    HandleCombat: requestAttack,
    HandleJump: () => false,
    HandleAirborne: () => {},
    HandleDamage: () => false,
    HandleDeath: () => { isDead = true; return false; },
    playOneShot: requestAttack,
    requestAttack,
    requestCrouch: () => false,
    requestDodge,
    requestHitReact: () => false,
    requestJump: () => false,
    requestRoll,
    setAiming,
    setBlocking: setAiming,
    updateActionState: handleMovement,
    updateMotion,
    getCurrent: () => currentState || STATES.IDLE,
    getIsAiming: () => isAiming,
    getIsBlocking: () => isAiming,
    getIsCrouching: () => false,
    isMovementOverridden: () => isBusy,
    has: hasAction,
    getDebugState: () => ({ currentState, ...lastMovement, isBusy, isAiming, specialMoveTimer }),
  };
}