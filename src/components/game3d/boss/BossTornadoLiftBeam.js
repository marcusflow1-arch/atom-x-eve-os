// BossTornadoLiftBeam — scripted world-boss tornado/lift/beam attack.
// This controller is hard-scoped to the live world boss. The instant that boss
// reaches 0 HP, starts dying, vanishes, or the encounter ends, the entire
// pattern is cancelled and the tornado is stopped.

import * as THREE from 'three';
import { BOSS_PATTERNS } from './BossPatternDefinitions';

function isBossAlive(boss) {
  return !!(
    boss?.group &&
    boss.alive !== false &&
    !boss.dying &&
    !boss.defeated &&
    Number(boss.hp) > 0 &&
    boss.group.visible !== false
  );
}

export function createBossTornadoLiftBeam({
  tornadoSystem,
  modelRef,
  setHP,
  getPlayerHUD,
  spawnDamageFloat,
  playActionSound,
  bossEncounter,
}) {
  const pattern = BOSS_PATTERNS.tornado_lift_beam;

  const state = {
    active: false,
    phase: 'idle',
    timer: 0,
    damageTickTimer: 0,
    hasFiredBeam: false,
    tornadoAnchor: new THREE.Vector3(),
    fallVelocity: 0,
    forcedFall: false,
    bossId: null,
  };

  const resetState = () => {
    state.active = false;
    state.phase = 'idle';
    state.timer = 0;
    state.damageTickTimer = 0;
    state.hasFiredBeam = false;
    state.fallVelocity = 0;
    state.forcedFall = false;
    state.bossId = null;
  };

  const cancel = () => {
    try { tornadoSystem?.stop?.(); } catch { /* non-fatal */ }
    resetState();
    return {
      active: false,
      cancelled: true,
      lockMovement: false,
      allowLookUp: false,
      liftY: 0,
      shake: 0,
      forcedFall: false,
    };
  };

  const encounterAllowsCombat = () => {
    if (!bossEncounter?.isActive) return true;
    return bossEncounter.isActive();
  };

  const start = ({ boss, player } = {}) => {
    if (!isBossAlive(boss) || !player || state.active || !encounterAllowsCombat()) return false;
    state.active = true;
    state.phase = 'intro';
    state.timer = 0;
    state.damageTickTimer = 0;
    state.hasFiredBeam = false;
    state.forcedFall = false;
    state.fallVelocity = 0;
    state.bossId = boss.id;
    state.tornadoAnchor.copy(player.position);

    bossEncounter?.queueLine?.({
      name: boss.name || boss.title || pattern.line.name,
      text: pattern.line.text,
      duration: pattern.line.duration,
    });
    tornadoSystem.spawn({ x: state.tornadoAnchor.x, z: state.tornadoAnchor.z });
    playActionSound?.('boss_cast');
    return true;
  };

  const applyTickDamage = (boss) => {
    if (!isBossAlive(boss) || !encounterAllowsCombat()) return;
    const hud = getPlayerHUD?.();
    if (!hud) return;
    const dmg = pattern.tickDamage;
    setHP?.(Math.max(0, (hud.hp || 0) - dmg));
    spawnDamageFloat?.('player', dmg);
  };

  const applyBeamDamage = (boss) => {
    if (!isBossAlive(boss) || !encounterAllowsCombat()) return;
    const hud = getPlayerHUD?.();
    if (!hud) return;
    const dmg = pattern.beamDamage;
    setHP?.(Math.max(0, (hud.hp || 0) - dmg));
    spawnDamageFloat?.('player', dmg);
  };

  const forcePlayerOut = (player, boss) => {
    if (!player || !isBossAlive(boss)) return;
    const origin = boss.group?.position || boss.position || new THREE.Vector3();
    const away = new THREE.Vector3().subVectors(player.position, origin).setY(0);
    if (away.lengthSq() < 0.001) away.set(0, 0, 1);
    away.normalize();
    player.position.addScaledVector(away, pattern.knockbackDistance);
    state.forcedFall = true;
    state.fallVelocity = 0;
  };

  const update = (delta, { boss, player, groundY = 0, playerAnim, tornadoResult = {} } = {}) => {
    if (!state.active) {
      return { active: false, lockMovement: false, allowLookUp: false, liftY: 0, shake: 0, forcedFall: false };
    }

    // This is the hard kill switch missing from the old implementation.
    // Death cancels every phase, including an already-running tornado.
    if (!isBossAlive(boss) || boss.id !== state.bossId || !encounterAllowsCombat()) {
      return cancel();
    }

    state.timer += delta;

    if (state.phase === 'intro' && state.timer >= pattern.introDelay) {
      state.phase = 'pulling';
      state.timer = 0;
    }

    if (state.phase === 'pulling' && tornadoResult.lockMovement) {
      state.phase = 'captured';
      state.timer = 0;
      state.damageTickTimer = 0;
      playActionSound?.('wind_loop');
    }

    if (state.phase === 'captured') {
      state.damageTickTimer += delta;
      if (state.damageTickTimer >= pattern.tickInterval) {
        state.damageTickTimer = 0;
        applyTickDamage(boss);
      }
      if (state.timer >= pattern.beamDelayAfterCapture && !state.hasFiredBeam) {
        state.phase = 'beam';
        state.timer = 0;
      }
    }

    if (state.phase === 'beam') {
      if (!isBossAlive(boss) || !encounterAllowsCombat()) return cancel();
      state.hasFiredBeam = true;
      bossEncounter?.queueLine?.({
        name: boss.name || boss.title || 'World Boss',
        text: 'Fall from the light.',
        duration: 2.2,
      });
      window.dispatchEvent(new CustomEvent('bossLightBeam', {
        detail: {
          bossId: boss.id,
          from: boss?.group?.position
            ? { x: boss.group.position.x, y: boss.group.position.y + 1.5, z: boss.group.position.z }
            : { x: 0, y: 2, z: 0 },
          to: { x: player.position.x, y: player.position.y + 1.2, z: player.position.z },
        },
      }));
      applyBeamDamage(boss);
      playActionSound?.('light_beam');
      playerAnim?.requestHitReact?.('heavy');
      forcePlayerOut(player, boss);
      tornadoSystem.stop();
      state.phase = 'fall';
      state.timer = 0;
    }

    if (state.phase === 'fall') {
      // The player's already-triggered fall may finish, but no new boss damage
      // or VFX can be produced after the boss dies.
      state.fallVelocity += 26 * delta;
      player.position.y -= state.fallVelocity * delta;
      if (player.position.y <= groundY) {
        player.position.y = groundY;
        state.phase = 'done';
        state.timer = 0;
      }
    }

    if (state.phase === 'done') {
      resetState();
      return {
        active: false,
        finished: true,
        lockMovement: false,
        allowLookUp: false,
        liftY: 0,
        shake: 0,
        forcedFall: false,
      };
    }

    const lockMovement = !!tornadoResult.lockMovement || state.phase === 'beam' || state.phase === 'fall';
    return {
      active: true,
      phase: state.phase,
      lockMovement,
      allowLookUp: !!tornadoResult.allowLookUp,
      liftY: tornadoResult.liftY || 0,
      shake: tornadoResult.shake || 0,
      forcedFall: state.forcedFall,
    };
  };

  const isActive = () => state.active;
  const getState = () => ({
    active: state.active,
    phase: state.phase,
    timer: +state.timer.toFixed(2),
    hasFiredBeam: state.hasFiredBeam,
    bossId: state.bossId,
  });

  return { start, update, cancel, isActive, getState };
}