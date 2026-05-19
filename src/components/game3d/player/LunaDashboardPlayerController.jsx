import * as THREE from 'three';

const STATES = {
  IDLE: 'Idle',
  WALK: 'Walk',
  RUN: 'Run',
  SPRINT: 'Sprint',
  JUMP_START: 'JumpStart',
  JUMP_LOOP: 'JumpLoop',
  JUMP_LAND: 'JumpLand',
  FALL: 'Fall',
  BOW_IDLE: 'BowIdle',
  DRAW_BOW: 'DrawBow',
  HOLD_BOW: 'HoldBow',
  FIRE_ARROW: 'FireArrow',
  HURT: 'Hurt',
  DEATH: 'Death',
};

const ACTION_ALIASES = {
  [STATES.IDLE]: ['idle'],
  [STATES.WALK]: ['walk', 'running', 'run'],
  [STATES.RUN]: ['run', 'running', 'walk'],
  [STATES.SPRINT]: ['sprint', 'sprinting', 'running', 'run'],
  [STATES.JUMP_START]: ['jumpStart', 'jumping', 'jump'],
  [STATES.JUMP_LOOP]: ['jumpLoop', 'jumping', 'jump'],
  [STATES.JUMP_LAND]: ['jumpLand', 'idle'],
  [STATES.FALL]: ['fall', 'falling', 'jumpLoop', 'jumping'],
  [STATES.BOW_IDLE]: ['bowIdle', 'holdBow', 'idle'],
  [STATES.DRAW_BOW]: ['drawBow', 'holdBow', 'bowIdle'],
  [STATES.HOLD_BOW]: ['holdBow', 'bowIdle', 'idle'],
  [STATES.FIRE_ARROW]: ['fireArrow', 'attack', 'kick', 'hurricane_kick'],
  [STATES.HURT]: ['hurt', 'hitReact'],
  [STATES.DEATH]: ['death'],
  HurricaneKick: ['hurricane_kick', 'kick', 'attack'],
};

const ONE_SHOT_KEYS = new Set([
  'jumpStart', 'jumpLand', 'drawBow', 'fireArrow', 'attack', 'kick',
  'hurricane_kick', 'hurt', 'hitReact', 'death', 'roll', 'dodge', 'sprinting',
]);

const LOOP_STATES = new Set([
  STATES.IDLE, STATES.WALK, STATES.RUN, STATES.SPRINT,
  STATES.JUMP_LOOP, STATES.FALL, STATES.BOW_IDLE, STATES.HOLD_BOW,
]);

export function createLunaDashboardPlayerController({ mixer, oneShotRef }) {
  const actions = {};
  let currentState = null;
  let currentActionKey = null;
  let lastMovement = { moving: false, running: false, sprinting: false };

  let isMoving = false;
  let isRunning = false;
  let isSprinting = false;
  let isJumping = false;
  let isGrounded = true;
  let isAttacking = false;
  let isBowDrawn = false;
  let isHurt = false;
  let isDead = false;

  let velocity = new THREE.Vector3();
  let verticalOffset = 0;
  let attackResetAt = 0;
  let hurtResetAt = 0;
  let landingResetAt = 0;

  const now = () => performance.now() / 1000;

  const resolveActionKey = (state) => {
    const direct = String(state || '').trim();
    const lower = direct.toLowerCase();
    if (actions[direct]) return direct;
    if (actions[lower]) return lower;
    return (ACTION_ALIASES[direct] || ACTION_ALIASES[lower] || []).find((key) => actions[key]) || null;
  };

  const ChangeState = (newState, options = {}) => {
    if (isDead && newState !== STATES.DEATH) return false;
    if (isHurt && newState !== STATES.HURT && newState !== STATES.DEATH) return false;
    if (!options.force && currentState === newState) return true;

    const nextKey = resolveActionKey(newState);
    if (!nextKey) return false;

    const nextAction = actions[nextKey];
    const previousAction = currentActionKey ? actions[currentActionKey] : null;
    nextAction.enabled = true;
    nextAction.setEffectiveWeight(1);
    nextAction.setEffectiveTimeScale(options.timeScale || 1);

    if (!LOOP_STATES.has(newState)) {
      nextAction.setLoop(THREE.LoopOnce, 1);
      nextAction.clampWhenFinished = true;
    } else {
      nextAction.setLoop(THREE.LoopRepeat);
      nextAction.clampWhenFinished = false;
    }

    currentState = newState;
    currentActionKey = nextKey;

    if (previousAction && previousAction !== nextAction) previousAction.fadeOut(options.fade ?? 0.15);
    nextAction.reset().fadeIn(options.fade ?? 0.15).play();
    return true;
  };

  const HandleMovement = () => {
    if (isDead || isHurt || isAttacking || !isGrounded) return;

    if (isBowDrawn) {
      ChangeState(STATES.HOLD_BOW);
      return;
    }

    if (!isMoving) {
      ChangeState(STATES.IDLE);
      return;
    }

    if (isMoving && isSprinting) {
      ChangeState(STATES.SPRINT);
      return;
    }

    if (isMoving && isRunning) {
      ChangeState(STATES.RUN);
      return;
    }

    ChangeState(STATES.WALK);
  };

  const ReturnToMovement = () => {
    landingResetAt = 0;
    HandleMovement();
  };

  const ResetAttack = () => {
    attackResetAt = 0;
    isAttacking = false;
    if (oneShotRef) oneShotRef.current = false;

    if (isBowDrawn) ChangeState(STATES.HOLD_BOW, { force: true });
    else HandleMovement();
  };

  const ResetHurt = () => {
    hurtResetAt = 0;
    isHurt = false;
    if (oneShotRef) oneShotRef.current = false;
    HandleMovement();
  };

  const bindClips = (clipsByKey = {}) => {
    Object.entries(clipsByKey).forEach(([key, clip]) => {
      const action = mixer.clipAction(clip);
      action.enabled = true;
      action.setEffectiveWeight(1);
      if (ONE_SHOT_KEYS.has(key)) {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
      }
      actions[key] = action;
    });

    if (actions.run && !actions.running) actions.running = actions.run;
    if (actions.jumpStart && !actions.jumping) actions.jumping = actions.jumpStart;
    if (actions.kick && !actions.hurricane_kick) actions.hurricane_kick = actions.kick;
    if (actions.roll && !actions.sprinting) actions.sprinting = actions.roll;

    ChangeState(STATES.IDLE, { force: true });
  };

  const updateActionState = ({ isMoving: moving, isRunning: running, isSprinting: sprinting }) => {
    isMoving = !!moving;
    isRunning = !!running;
    isSprinting = !!sprinting;
    lastMovement = { moving: isMoving, running: isRunning, sprinting: isSprinting };

    if (isDead) {
      ChangeState(STATES.DEATH, { force: true });
      return;
    }

    if (isHurt) {
      ChangeState(STATES.HURT, { force: true });
      return;
    }

    if (isAttacking) return;
    if (landingResetAt > 0) return;

    HandleMovement();
  };

  const requestJump = () => {
    if (isDead || isHurt || isAttacking || !isGrounded) return false;
    velocity.y = Math.sqrt(5 * -2 * -20);
    isJumping = true;
    isGrounded = false;
    if (oneShotRef) oneShotRef.current = true;
    return ChangeState(STATES.JUMP_START, { force: true });
  };

  const HandleCombat = () => {
    if (isDead || isHurt || isAttacking) return false;
    isAttacking = true;
    attackResetAt = now() + 0.4;
    if (oneShotRef) oneShotRef.current = true;
    return ChangeState(STATES.FIRE_ARROW, { force: true, fade: 0.05 });
  };

  const requestRoll = () => HandleCombat('kick');

  const setAiming = (enabled) => {
    if (isDead || isHurt || isAttacking) return false;

    if (enabled) {
      isBowDrawn = true;
      return ChangeState(STATES.DRAW_BOW, { force: true, fade: 0.05 });
    }

    isBowDrawn = false;
    ChangeState(STATES.BOW_IDLE, { force: true });
    HandleMovement();
    return true;
  };

  const updateMotion = (model, delta, groundY = model.position.y) => {
    if (attackResetAt > 0 && now() >= attackResetAt) ResetAttack();
    if (hurtResetAt > 0 && now() >= hurtResetAt) ResetHurt();
    if (landingResetAt > 0 && now() >= landingResetAt) ReturnToMovement();

    if (!isGrounded) {
      velocity.y += -20 * delta;
      verticalOffset += velocity.y * delta;

      if (velocity.y > 0) ChangeState(STATES.JUMP_LOOP);
      else ChangeState(STATES.FALL);

      if (verticalOffset <= 0) {
        verticalOffset = 0;
        velocity.y = 0;
        isGrounded = true;

        if (isJumping) {
          isJumping = false;
          ChangeState(STATES.JUMP_LAND, { force: true });
          landingResetAt = now() + 0.2;
        }
      }
    }

    model.position.y = groundY + verticalOffset;
  };

  const requestHitReact = () => {
    if (isDead) return false;
    isHurt = true;
    isAttacking = false;
    hurtResetAt = now() + 0.5;
    if (oneShotRef) oneShotRef.current = true;
    return ChangeState(STATES.HURT, { force: true, fade: 0.05 });
  };

  const HandleDeath = () => {
    isDead = true;
    isHurt = false;
    isAttacking = false;
    return ChangeState(STATES.DEATH, { force: true, fade: 0.05 });
  };

  mixer.addEventListener('finished', (event) => {
    if (event.action?.getClip?.()?.name !== currentActionKey || isDead) return;
    if (currentState === STATES.FIRE_ARROW) ResetAttack();
    if (currentState === STATES.HURT) ResetHurt();
    if (currentState === STATES.DRAW_BOW && isBowDrawn) ChangeState(STATES.HOLD_BOW, { force: true });
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
    HandleDamage: requestHitReact,
    HandleDeath,
    playOneShot: HandleCombat,
    requestAttack: HandleCombat,
    requestCrouch: () => false,
    requestHitReact,
    requestJump,
    requestRoll,
    setAiming,
    setBlocking: () => false,
    updateActionState,
    updateMotion,
    getCurrent: () => currentState || STATES.IDLE,
    getIsAiming: () => isBowDrawn,
    getIsBlocking: () => false,
    getIsCrouching: () => false,
    isMovementOverridden: () => isAttacking || isHurt || isDead || landingResetAt > 0,
    has: (name) => !!resolveActionKey(name),
    getDebugState: () => ({ currentState, currentActionKey, ...lastMovement, isGrounded, isJumping, isAttacking, isBowDrawn, isHurt, isDead, velocity }),
  };
}