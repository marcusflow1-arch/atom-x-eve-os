import * as THREE from 'three';

const ACTION_ALIASES = {
  Idle: ['idle'],
  Running: ['running', 'run', 'sprint', 'walk'],
  Jumping: ['jumping', 'jumpStart', 'jumpLoop', 'jump'],
  Falling: ['falling', 'fall', 'jumpLoop', 'jump'],
  HurricaneKick: ['hurricane_kick', 'kick', 'attack'],
  Sprinting: ['sprinting', 'roll', 'sprint', 'run'],
  FireArrow: ['fireArrow', 'attack', 'kick'],
  Hurt: ['hurt', 'hitReact'],
  Death: ['death'],
};

export function createLunaDashboardPlayerController({ mixer, oneShotRef }) {
  const actions = {};
  let currentActionName = '';
  let lockedUntil = 0;
  let verticalVelocity = 0;
  let verticalOffset = 0;
  let isGrounded = true;
  let isDead = false;
  let isHurt = false;
  let isAttacking = false;

  const now = () => performance.now() / 1000;
  const isLocked = () => now() < lockedUntil || isDead;

  const resolveActionKey = (name) => {
    const direct = String(name || '').trim();
    const lower = direct.toLowerCase();
    if (actions[direct]) return direct;
    if (actions[lower]) return lower;

    const aliases = ACTION_ALIASES[direct] || ACTION_ALIASES[lower] || ACTION_ALIASES[name];
    if (aliases) return aliases.find((key) => actions[key]) || null;
    return null;
  };

  const fadeToAction = (name, duration = 0.2, force = false) => {
    const key = resolveActionKey(name);
    if (!key) return false;
    if (!force && currentActionName === key) return true;

    const nextAction = actions[key];
    const previousAction = currentActionName ? actions[currentActionName] : null;

    if (previousAction && previousAction !== nextAction) previousAction.fadeOut(duration);
    nextAction.reset().fadeIn(duration).play();
    currentActionName = key;
    return true;
  };

  const play = (name, force = false) => {
    if (!force && isLocked()) return false;
    return fadeToAction(name, 0.2, force);
  };

  const lockOneShot = (seconds) => {
    lockedUntil = now() + seconds;
    if (oneShotRef) oneShotRef.current = true;
  };

  const bindClips = (clipsByKey = {}) => {
    Object.entries(clipsByKey).forEach(([key, clip]) => {
      const action = mixer.clipAction(clip);
      action.enabled = true;
      action.setEffectiveWeight(1);

      if (['jumpStart', 'jumpLand', 'roll', 'dodge', 'kick', 'attack', 'fireArrow', 'hurt', 'death'].includes(key)) {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
      }

      actions[key] = action;
    });

    if (actions.run && !actions.running) actions.running = actions.run;
    if (actions.jumpStart && !actions.jumping) actions.jumping = actions.jumpStart;
    if (actions.roll && !actions.sprinting) actions.sprinting = actions.roll;
    if (actions.kick && !actions.hurricane_kick) actions.hurricane_kick = actions.kick;

    fadeToAction('Idle', 0.2, true);
  };

  const updateActionState = ({ isMoving }) => {
    if (isDead || isHurt || isAttacking || isLocked()) return;
    if (!isGrounded) {
      play(verticalVelocity > 0 ? 'Jumping' : 'Falling');
      return;
    }
    play(isMoving ? 'Running' : 'Idle');
  };

  const requestJump = () => {
    if (isDead || isHurt || isAttacking || !isGrounded) return false;
    verticalVelocity = 5;
    verticalOffset = Math.max(verticalOffset, 0.01);
    isGrounded = false;
    fadeToAction('Jumping', 0.15, true);
    return true;
  };

  const requestRoll = () => {
    if (isDead || isHurt || isAttacking || !isGrounded) return false;
    isAttacking = true;
    lockOneShot(0.6);
    return fadeToAction('Sprinting', 0.15, true);
  };

  const HandleCombat = (kind = 'attack') => {
    if (isDead || isHurt || isAttacking) return false;
    isAttacking = true;
    const actionName = kind === 'kick' ? 'HurricaneKick' : 'FireArrow';
    lockOneShot(kind === 'kick' ? 0.7 : 0.45);
    return fadeToAction(actionName, 0.15, true);
  };

  const updateMotion = (model, delta, groundY = model.position.y) => {
    if (!isGrounded || verticalOffset > 0) {
      verticalVelocity += -25 * delta;
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
  };

  const requestHitReact = () => {
    if (isDead || isHurt) return false;
    isHurt = true;
    isAttacking = false;
    lockOneShot(0.5);
    return fadeToAction('Hurt', 0.1, true);
  };

  const HandleDeath = () => {
    isDead = true;
    isHurt = false;
    isAttacking = false;
    lockedUntil = Infinity;
    return fadeToAction('Death', 0.1, true);
  };

  mixer.addEventListener('finished', () => {
    if (isDead) return;
    if (isHurt) isHurt = false;
    if (isAttacking) isAttacking = false;
    lockedUntil = 0;
    if (oneShotRef) oneShotRef.current = false;
  });

  return {
    actions,
    bindClips,
    ChangeState: (state, options = {}) => fadeToAction(state, options.fade ?? 0.2, options.force),
    PlayAnimation: (state, options = {}) => fadeToAction(state, options.fade ?? 0.2, options.force),
    HandleMovement: updateActionState,
    HandleCombat,
    HandleJump: requestJump,
    HandleAirborne: () => {},
    HandleDamage: requestHitReact,
    HandleDeath,
    playOneShot: (name) => HandleCombat(name === 'kick' ? 'kick' : 'attack'),
    requestAttack: HandleCombat,
    requestCrouch: () => false,
    requestHitReact,
    requestJump,
    requestRoll,
    setAiming: () => false,
    setBlocking: () => false,
    updateActionState,
    updateMotion,
    getCurrent: () => currentActionName || 'idle',
    getIsAiming: () => false,
    getIsBlocking: () => false,
    getIsCrouching: () => false,
    isMovementOverridden: () => false,
    has: (name) => !!resolveActionKey(name),
    getDebugState: () => ({ currentActionName, isGrounded, isAttacking, isDead, isHurt, verticalVelocity }),
  };
}