// BossTornadoLiftBeam — orchestrates the existing tornado system as a scripted
// boss attack pattern.
//
// Flow: intro (tornado spins up) → pulling → captured (trapped + lifted) →
// beam (boss fires through the funnel) → fall (player is knocked out and
// drops) → done. The world passes in the tornado result it already computed
// this frame, so the tornado physics only advance once per tick.
//
// This controller does NOT replace the tornado system — it sequences boss
// logic (dialogue, damage ticks, beam timing, knockback, fall) on top of it.

import * as THREE from 'three';
import { BOSS_PATTERNS } from './BossPatternDefinitions';

export function createBossTornadoLiftBeam({
  tornadoSystem,
  modelRef,        // reserved for future boss-relative targeting
  setHP,
  getPlayerHUD,
  spawnDamageFloat,
  playActionSound,
  bossEncounter,
}) {
  const pattern = BOSS_PATTERNS.tornado_lift_beam;

  const state = {
    active: false,
    phase: 'idle', // idle | intro | pulling | captured | beam | fall | done
    timer: 0,
    damageTickTimer: 0,
    hasFiredBeam: false,
    tornadoAnchor: new THREE.Vector3(),
    fallVelocity: 0,
    forcedFall: false,
  };

  const start = ({ boss, player } = {}) => {
    if (!boss || !player || state.active) return false;
    state.active = true;
    state.phase = 'intro';
    state.timer = 0;
    state.damageTickTimer = 0;
    state.hasFiredBeam = false;
    state.forcedFall = false;
    state.fallVelocity = 0;
    state.tornadoAnchor.copy(player.position);
    bossEncounter?.queueLine?.(pattern.line);
    tornadoSystem.spawn({ x: state.tornadoAnchor.x, z: state.tornadoAnchor.z });
    playActionSound?.('boss_cast');
    return true;
  };

  const applyTickDamage = () => {
    const hud = getPlayerHUD?.();
    if (!hud) return;
    const dmg = pattern.tickDamage;
    setHP?.(Math.max(0, (hud.hp || 0) - dmg));
    spawnDamageFloat?.('player', dmg);
  };

  const applyBeamDamage = () => {
    const hud = getPlayerHUD?.();
    if (!hud) return;
    const dmg = pattern.beamDamage;
    setHP?.(Math.max(0, (hud.hp || 0) - dmg));
    spawnDamageFloat?.('player', dmg);
  };

  const forcePlayerOut = (player, boss) => {
    if (!player || !boss) return;
    const origin = boss.group?.position
      ? boss.group.position
      : boss.position || new THREE.Vector3();
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
    state.timer += delta;

    if (state.phase === 'intro') {
      if (state.timer >= pattern.introDelay) {
        state.phase = 'pulling';
        state.timer = 0;
      }
    }

    if (state.phase === 'pulling') {
      // The tornado's own update decides when the player is captured.
      if (tornadoResult.lockMovement) {
        state.phase = 'captured';
        state.timer = 0;
        state.damageTickTimer = 0;
        playActionSound?.('wind_loop');
      }
    }

    if (state.phase === 'captured') {
      state.damageTickTimer += delta;
      if (state.damageTickTimer >= pattern.tickInterval) {
        state.damageTickTimer = 0;
        applyTickDamage();
      }
      if (state.timer >= pattern.beamDelayAfterCapture && !state.hasFiredBeam) {
        state.phase = 'beam';
        state.timer = 0;
      }
    }

    if (state.phase === 'beam') {
      state.hasFiredBeam = true;
      bossEncounter?.queueLine?.({ name: 'Kali', text: 'Fall from the light.', duration: 2.2 });
      // Beam VFX hook — a VFX layer can render the bolt from these endpoints.
      window.dispatchEvent(new CustomEvent('bossLightBeam', {
        detail: {
          from: boss?.group?.position
            ? { x: boss.group.position.x, y: boss.group.position.y + 1.5, z: boss.group.position.z }
            : { x: 0, y: 2, z: 0 },
          to: { x: player.position.x, y: player.position.y + 1.2, z: player.position.z },
        },
      }));
      applyBeamDamage();
      playActionSound?.('light_beam');
      playerAnim?.requestHitReact?.('heavy');
      forcePlayerOut(player, boss);
      tornadoSystem.stop();
      state.phase = 'fall';
      state.timer = 0;
    }

    if (state.phase === 'fall') {
      state.fallVelocity += 26 * delta;
      player.position.y -= state.fallVelocity * delta;
      if (player.position.y <= groundY) {
        player.position.y = groundY;
        state.phase = 'done';
        state.timer = 0;
      }
    }

    if (state.phase === 'done') {
      state.active = false;
      state.phase = 'idle';
      state.timer = 0;
      state.damageTickTimer = 0;
      state.hasFiredBeam = false;
      state.forcedFall = false;
      state.fallVelocity = 0;
      return { active: false, finished: true, lockMovement: false, allowLookUp: false, liftY: 0, shake: 0, forcedFall: false };
    }

    const lockMovement =
      !!tornadoResult.lockMovement ||
      state.phase === 'beam' ||
      state.phase === 'fall';

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
  });

  return { start, update, isActive, getState };
}