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
  RELOAD_ARROW: 'ReloadArrow',
  COMBAT_WALK: 'CombatWalk',
  COMBAT_RUN: 'CombatRun',
  HURT: 'Hurt',
  KNOCKBACK: 'Knockback',
  DEATH: 'Death',
  ROLL: 'Roll',
  DODGE: 'Dodge',
  CROUCH: 'Crouch',
  CROUCH_IDLE: 'CrouchIdle',
  CROUCH_WALK: 'CrouchWalk',
  CROUCH_RUN: 'CrouchRun',
  KICK: 'Kick',
  BLOCK_HOLD: 'BlockHold',
};

const PRIORITY = {
  [STATES.IDLE]: 0,
  [STATES.WALK]: 10,
  [STATES.RUN]: 20,
  [STATES.SPRINT]: 30,
  [STATES.CROUCH]: 30,
  [STATES.CROUCH_IDLE]: 30,
  [STATES.CROUCH_WALK]: 30,
  [STATES.CROUCH_RUN]: 30,
  [STATES.BOW_IDLE]: 35,
  [STATES.HOLD_BOW]: 36,
  [STATES.COMBAT_WALK]: 36,
  [STATES.COMBAT_RUN]: 36,
  [STATES.JUMP_START]: 40,
  [STATES.JUMP_LOOP]: 41,
  [STATES.FALL]: 42,
  [STATES.JUMP_LAND]: 43,
  [STATES.BLOCK_HOLD]: 50,
  [STATES.DRAW_BOW]: 55,
  [STATES.FIRE_ARROW]: 60,
  [STATES.RELOAD_ARROW]: 60,
  [STATES.KICK]: 60,
  [STATES.ROLL]: 65,
  [STATES.DODGE]: 65,
  [STATES.HURT]: 80,
  [STATES.KNOCKBACK]: 85,
  [STATES.DEATH]: 100,
};

const LOOP_STATES = new Set([
  STATES.IDLE, STATES.WALK, STATES.RUN, STATES.SPRINT,
  STATES.CROUCH_IDLE, STATES.CROUCH_WALK, STATES.CROUCH_RUN,
  STATES.BOW_IDLE, STATES.HOLD_BOW, STATES.COMBAT_WALK, STATES.COMBAT_RUN,
  STATES.JUMP_LOOP, STATES.FALL, STATES.BLOCK_HOLD,
]);

const ONE_SHOT_STATES = new Set([
  STATES.JUMP_START, STATES.JUMP_LAND, STATES.DRAW_BOW, STATES.FIRE_ARROW,
  STATES.RELOAD_ARROW, STATES.HURT, STATES.KNOCKBACK, STATES.DEATH,
  STATES.ROLL, STATES.DODGE, STATES.CROUCH, STATES.KICK,
]);

const CLIP_KEYS = {
  [STATES.IDLE]: ['idle'],
  [STATES.WALK]: ['walk'],
  [STATES.RUN]: ['run'],
  [STATES.SPRINT]: ['sprint', 'run'],
  [STATES.JUMP_START]: ['jumpStart', 'jump'],
  [STATES.JUMP_LOOP]: ['jumpLoop', 'jump'],
  [STATES.JUMP_LAND]: ['jumpLand', 'idle'],
  [STATES.FALL]: ['fall', 'jumpLoop', 'jump'],
  [STATES.BOW_IDLE]: ['bowIdle', 'aimIdle', 'idle'],
  [STATES.DRAW_BOW]: ['drawBow', 'aimIdle'],
  [STATES.HOLD_BOW]: ['holdBow', 'aimIdle', 'bowIdle'],
  [STATES.FIRE_ARROW]: ['fireArrow', 'attack', 'shoot'],
  [STATES.RELOAD_ARROW]: ['reloadArrow', 'bowIdle'],
  [STATES.COMBAT_WALK]: ['combatWalk', 'aimMove', 'walk'],
  [STATES.COMBAT_RUN]: ['combatRun', 'aimRun', 'run'],
  [STATES.HURT]: ['hurt', 'hitReact'],
  [STATES.KNOCKBACK]: ['knockback', 'hurt', 'hitReact'],
  [STATES.DEATH]: ['death'],
  [STATES.ROLL]: ['roll'],
  [STATES.DODGE]: ['dodge', 'roll'],
  [STATES.CROUCH]: ['crouchEnter', 'crouchIdle'],
  [STATES.CROUCH_IDLE]: ['crouchIdle', 'idle'],
  [STATES.CROUCH_WALK]: ['crouchWalk', 'walk'],
  [STATES.CROUCH_RUN]: ['crouchRun', 'run'],
  [STATES.KICK]: ['kick', 'attack'],
  [STATES.BLOCK_HOLD]: ['blockHold', 'block', 'idle'],
};

const fadeForState = (state) => {
  if ([STATES.HURT, STATES.KNOCKBACK, STATES.FIRE_ARROW, STATES.KICK, STATES.ROLL, STATES.DODGE].includes(state)) return 0.05;
  if ([STATES.JUMP_LAND].includes(state)) return 0.2;
  return 0.15;
};

export function createPlayerAnimationController({ mixer, oneShotRef }) {
  const actions = {};
  let currentState = STATES.IDLE;
  let previousState = null;
  let currentActionKey = null;
  let lockedUntil = 0;
  let isGrounded = true;
  let wasAirborne = false;
  let isAttacking = false;
  let isDead = false;
  let isHurt = false;
  let isSprinting = false;
  let isRunning = false;
  let isMoving = false;
  let isBowDrawn = false;
  let isCrouching = false;
  let isBlocking = false;
  let velocity = new THREE.Vector3();
  let verticalVelocity = 0;
  let verticalOffset = 0;
  let specialVelocity = null;
  let specialTimer = 0;

  const now = () => performance.now() / 1000;
  const isLocked = () => now() < lockedUntil || isDead;
  const getClipKeyForState = (state) => (CLIP_KEYS[state] || []).find((key) => actions[key]);

  const bindClips = (clipsByKey) => {
    Object.entries(clipsByKey).forEach(([key, clip]) => {
      const action = mixer.clipAction(clip);
      action.enabled = true;
      action.setEffectiveWeight(1);
      const stateForKey = Object.keys(CLIP_KEYS).find((state) => CLIP_KEYS[state].includes(key));
      const shouldLoop = stateForKey ? LOOP_STATES.has(stateForKey) : !ONE_SHOT_STATES.has(stateForKey);
      if (!shouldLoop) {
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
      }
      actions[key] = action;
    });
    PlayAnimation(STATES.IDLE, { force: true, fade: 0.15 });
  };

  const PlayAnimation = (state, { force = false, fade = fadeForState(state), timeScale = 1 } = {}) => {
    const clipKey = getClipKeyForState(state);
    if (!clipKey) return false;
    if (!force && currentState === state && currentActionKey === clipKey) return true;
    const next = actions[clipKey];
    const prev = currentActionKey ? actions[currentActionKey] : null;
    next.enabled = true;
    next.setEffectiveTimeScale(timeScale);
    next.setEffectiveWeight(1);
    next.reset().fadeIn(fade).play();
    if (prev && prev !== next) prev.fadeOut(fade);
    currentActionKey = clipKey;
    return true;
  };

  const ChangeState = (nextState, options = {}) => {
    if (isDead && nextState !== STATES.DEATH) return false;
    if (!options.force && isLocked() && PRIORITY[nextState] <= PRIORITY[currentState]) return false;
    if (!options.force && currentState === nextState) return true;
    previousState = currentState;
    currentState = nextState;
    const played = PlayAnimation(nextState, options);
    if (!played) return false;
    if (ONE_SHOT_STATES.has(nextState)) {
      lockedUntil = now() + (options.duration || 0.45);
      if (oneShotRef) oneShotRef.current = true;
    }
    return true;
  };

  const HandleMovement = ({ moving, running, sprinting }) => {
    isMoving = moving;
    isRunning = running;
    isSprinting = sprinting;
    if (isDead || isHurt || isAttacking || !isGrounded) return;
    if (isBlocking) return ChangeState(STATES.BLOCK_HOLD);
    if (isBowDrawn) {
      if (!moving) return ChangeState(STATES.HOLD_BOW);
      return ChangeState(running || sprinting ? STATES.COMBAT_RUN : STATES.COMBAT_WALK);
    }
    if (isCrouching) {
      if (!moving) return ChangeState(STATES.CROUCH_IDLE);
      return ChangeState(running || sprinting ? STATES.CROUCH_RUN : STATES.CROUCH_WALK);
    }
    if (sprinting && moving) return ChangeState(STATES.SPRINT);
    if (running && moving) return ChangeState(STATES.RUN);
    if (moving) return ChangeState(STATES.WALK);
    return ChangeState(STATES.IDLE);
  };

  const HandleCombat = (kind = 'attack') => {
    if (isDead || isHurt || isAttacking) return false;
    isAttacking = true;
    const state = kind === 'multiShot' ? STATES.FIRE_ARROW : kind === 'kick' ? STATES.KICK : STATES.FIRE_ARROW;
    return ChangeState(state, { duration: kind === 'multiShot' ? 0.95 : 0.62, timeScale: kind === 'kick' ? 1.25 : 1 });
  };

  const HandleJump = () => {
    if (isDead || isHurt || isAttacking || !isGrounded) return false;
    isGrounded = false;
    wasAirborne = true;
    verticalVelocity = 5.2;
    return ChangeState(STATES.JUMP_START, { duration: 0.22 });
  };

  const HandleAirborne = (groundY = 0) => {
    if (isDead) return;
    if (!isGrounded) {
      if (verticalVelocity > 0.8) ChangeState(STATES.JUMP_LOOP, { force: currentState === STATES.JUMP_START && !isLocked() });
      if (verticalVelocity < -0.5) ChangeState(STATES.FALL);
      return;
    }
    if (wasAirborne) {
      wasAirborne = false;
      ChangeState(STATES.JUMP_LAND, { duration: 0.28, fade: 0.2 });
    }
  };

  const HandleDamage = () => {
    if (isDead || isHurt) return false;
    isHurt = true;
    isAttacking = false;
    return ChangeState(STATES.HURT, { force: true, duration: 0.48, fade: 0.05 });
  };

  const HandleDeath = () => {
    isDead = true;
    isHurt = false;
    isAttacking = false;
    return ChangeState(STATES.DEATH, { force: true, duration: 9999, fade: 0.05 });
  };

  const requestRoll = (direction) => {
    if (isDead || isHurt || isAttacking || !isGrounded) return false;
    const dir = direction?.clone?.() || new THREE.Vector3(0, 0, -1);
    if (dir.lengthSq() === 0) dir.set(0, 0, -1);
    dir.normalize();
    specialVelocity = dir.multiplyScalar(6.7);
    specialTimer = 0.45;
    return ChangeState(STATES.ROLL, { force: true, duration: 0.45, fade: 0.05 });
  };

  const requestCrouch = (enabled) => {
    if (isDead || isHurt || isAttacking || isCrouching === enabled) return false;
    isCrouching = enabled;
    return enabled ? ChangeState(STATES.CROUCH, { duration: 0.22 }) : ChangeState(STATES.IDLE, { force: true });
  };

  const setBlocking = (enabled) => {
    if (isDead || isHurt || isAttacking || isBlocking === enabled) return false;
    isBlocking = enabled;
    return enabled ? ChangeState(STATES.BLOCK_HOLD, { force: true }) : ChangeState(STATES.IDLE, { force: true });
  };

  const setAiming = (enabled) => {
    if (isDead || isHurt) return false;
    if (isBowDrawn === enabled) return false;
    isBowDrawn = enabled;
    if (enabled) return ChangeState(STATES.DRAW_BOW, { duration: 0.25, fade: 0.05 });
    return ChangeState(STATES.BOW_IDLE, { duration: 0.18, fade: 0.15 });
  };

  const updateMotion = (model, delta, groundY = model.position.y) => {
    if (specialTimer > 0 && specialVelocity) {
      const t = Math.max(0, specialTimer / 0.45);
      const ease = 0.35 + 0.65 * t;
      model.position.x += specialVelocity.x * ease * delta;
      model.position.z += specialVelocity.z * ease * delta;
      specialTimer -= delta;
      if (specialTimer <= 0) specialVelocity = null;
    }

    if (!isGrounded || verticalOffset > 0) {
      verticalVelocity += -16 * delta;
      verticalOffset += verticalVelocity * delta;
      if (verticalOffset <= 0) {
        verticalOffset = 0;
        verticalVelocity = 0;
        isGrounded = true;
      } else {
        isGrounded = false;
      }
    }

    model.position.y = groundY + verticalOffset;
    HandleAirborne(groundY);
  };

  const updateActionState = (state) => HandleMovement(state);

  mixer.addEventListener('finished', (e) => {
    const name = e.action?.getClip()?.name;
    const activeKey = currentActionKey;
    if (!name || name !== activeKey) return;
    if (currentState === STATES.DEATH) return;
    if ([STATES.HURT, STATES.KNOCKBACK].includes(currentState)) isHurt = false;
    if ([STATES.FIRE_ARROW, STATES.KICK, STATES.RELOAD_ARROW].includes(currentState)) isAttacking = false;
    if (oneShotRef) oneShotRef.current = false;
    lockedUntil = 0;
  });

  return {
    actions,
    bindClips,
    ChangeState,
    PlayAnimation,
    HandleMovement,
    HandleCombat,
    HandleJump,
    HandleAirborne,
    HandleDamage,
    HandleDeath,
    playOneShot: (name, timeScale = 1) => HandleCombat(name === 'kick' ? 'kick' : name),
    requestAttack: HandleCombat,
    requestCrouch,
    requestHitReact: HandleDamage,
    requestJump: HandleJump,
    requestRoll,
    setAiming,
    setBlocking,
    updateActionState,
    updateMotion,
    getCurrent: () => currentState,
    getIsAiming: () => isBowDrawn,
    getIsBlocking: () => isBlocking,
    getIsCrouching: () => isCrouching,
    isMovementOverridden: () => !isGrounded || specialTimer > 0 || isAttacking || isHurt || isDead,
    has: (name) => !!actions[name] || !!getClipKeyForState(name),
    getDebugState: () => ({ currentState, previousState, isGrounded, isAttacking, isDead, isHurt, isSprinting, isRunning, isMoving, isBowDrawn, velocity, verticalVelocity }),
  };
}