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

const ACTION_ALIASES = {
  [STATES.IDLE]: ['idle'],
  [STATES.WALK]: ['walk', 'walking'],
  [STATES.RUN]: ['run', 'running'],
  [STATES.CROUCH_IDLE]: ['crouchIdle', 'crouch_idle', 'crouch', 'idle'],
  [STATES.CROUCH_WALK]: ['crouchWalk', 'crouch_walk', 'walk'],
  [STATES.CROUCH_RUN]: ['crouchRun', 'crouch_run', 'run'],
  [STATES.ROLL]: ['roll', 'sprinting'],
  [STATES.DODGE]: ['dodge', 'roll'],
  [STATES.JUMP]: ['jump', 'jumping', 'jumpStart'],
  [STATES.KICK]: ['kick', 'hurricane_kick', 'attack'],
  [STATES.FIRE_ARROW]: ['fireArrow', 'attack', 'shoot'],
  [STATES.BLOCK]: ['block', 'blockHold', 'holdBow', 'idle'],
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

  const now = () => performance.now() / 1000;

  const resolveActionKey = (state) => {
    const direct = String(state || '').trim();
    const lower = direct.toLowerCase();
    if (actions[direct]) return direct;
    if (actions[lower]) return lower;
    return (ACTION_ALIASES[direct] || ACTION_ALIASES[lower] || []).find((key) => actions[key]) || null;
  };

  const ChangeState = (newState, options = {}) => {
    if (isDead) return false;
    if (!options.force && currentState === newState) return true;

    const nextKey = resolveActionKey(newState);
    if (!nextKey) return false;

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

    if (previousAction && previousAction !== nextAction) previousAction.fadeOut(options.fade ?? 0.15);
    nextAction.reset().fadeIn(options.fade ?? 0.15).play();
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
    isBusy = true;
    busyResetAt = now() + duration;
    if (oneShotRef) oneShotRef.current = true;
    return ChangeState(state, { force: true, fade: 0.05 });
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

    if (actions.run && !actions.running) actions.running = actions.run;
    if (actions.jump && !actions.jumping) actions.jumping = actions.jump;
    if (actions.kick && !actions.hurricane_kick) actions.hurricane_kick = actions.kick;
    if (actions.blockHold && !actions.block) actions.block = actions.blockHold;

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

  const requestRoll = () => startOneShot(STATES.ROLL);
  const requestDodge = () => startOneShot(STATES.DODGE);

  const HandleCombat = (kind = 'attack') => {
    const state = kind === 'kick' ? STATES.KICK : STATES.FIRE_ARROW;
    return startOneShot(state);
  };

  const updateMotion = (model, delta, groundY = model.position.y) => {
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