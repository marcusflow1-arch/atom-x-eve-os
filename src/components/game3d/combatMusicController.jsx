// ─── Dynamic Music State Manager ──────────────────────────────────────
// AAA-style layered music system. Handles two states (exploration / combat)
// with cinematic crossfades, playback-position memory, and a cooldown rule
// for resuming the combat track.
//
// Public API (unchanged from previous controller):
//   bindWorldAudio(ref, currentVolume)  — wires the world <Audio> element
//   setWorldTargetVolume(v)             — keeps user slider in sync
//   enterCombat()                       — transition → COMBAT
//   exitCombat()                        — transition → EXPLORATION
//   isInCombat()                        — boolean
//   teardownCombatMusic()               — full cleanup on unmount
//
// Behavior Flow
// ─────────────
//   GAME STARTS  → state = EXPLORATION (world theme plays)
//
//   ENTER COMBAT →
//     • save worldTheme.currentTime
//     • fade world theme out over WORLD_FADE_MS, then pause it
//     • if (now - lastCombatExitTime) < COMBAT_RESUME_LIMIT_MS
//         → resume combat from saved position
//       else
//         → start combat from 0
//     • fade combat theme in at MAX volume
//
//   EXIT COMBAT →
//     • save combatTheme.currentTime
//     • stamp lastCombatExitTime
//     • fade combat theme out → pause
//     • after WORLD_RESUME_DELAY_MS, resume world theme from saved position
//       and fade it back up
//
// Each audio element has its own fade timer so the two fades run in
// parallel without cancelling each other.

import { base44 } from '@/api/base44Client';

// ─── Timing Constants ────────────────────────────────────────────────
const WORLD_FADE_MS         = 2000; // world theme fades out over 2 s, then pauses
const COMBAT_FADE_IN_MS     = 400;  // combat theme fades in after world stops
const COMBAT_FADE_OUT_MS    = 1000; // combat theme fades out after combat ends
const WORLD_RESUME_DELAY_MS = 3000; // 3 s gap before world theme returns
const WORLD_FADE_IN_MS      = 1200; // world theme fades back up

// Volume targets
const COMBAT_VOLUME = 1.0;          // combat theme always plays at MAX volume

// Resume-position rule: if combat re-enters within 5 minutes, pick up where
// the combat track left off. Otherwise restart it from 0.
const COMBAT_RESUME_LIMIT_MS = 5 * 60 * 1000;

// ─── State ───────────────────────────────────────────────────────────
const STATE = { EXPLORATION: 'exploration', COMBAT: 'combat' };

let currentState = STATE.EXPLORATION;

let combatAudio        = null;     // single combat <Audio> element
let worldAudioRef      = null;     // ref-object passed in from GameView
let worldTargetVolume  = 0.5;      // user slider value for the world theme

// Playback-position memory
let combatThemeTime    = 0;        // where combat track left off
let lastCombatExitTime = 0;        // timestamp of last exit (ms epoch)

// Transition timers
let resumeTimer        = null;     // setTimeout id for the world-resume delay
let combatStartTimer   = null;     // setTimeout id for delayed combat start

let combatUrlLoaded    = false;
let combatUrlPromise   = null;

// Per-audio fade timers — independent so fade-out of world and fade-in
// of combat don't cancel each other.
const fadeTimers = new WeakMap();

// ─── Helpers ─────────────────────────────────────────────────────────

function clearTransitionTimers() {
  if (resumeTimer)      { clearTimeout(resumeTimer);      resumeTimer = null; }
  if (combatStartTimer) { clearTimeout(combatStartTimer); combatStartTimer = null; }
}

function cancelFade(audio) {
  if (!audio) return;
  const t = fadeTimers.get(audio);
  if (t) { clearInterval(t); fadeTimers.delete(audio); }
}

// Linear volume fade. Each audio element fades independently.
function fadeTo(audio, target, durationMs, onDone) {
  if (!audio) { onDone?.(); return; }
  cancelFade(audio);
  const start = audio.volume;
  const delta = target - start;
  if (Math.abs(delta) < 0.001 || durationMs <= 0) {
    audio.volume = Math.max(0, Math.min(1, target));
    onDone?.();
    return;
  }
  const stepMs = 50;
  const steps  = Math.max(1, Math.round(durationMs / stepMs));
  let i = 0;
  const id = setInterval(() => {
    i++;
    const v = start + delta * (i / steps);
    audio.volume = Math.max(0, Math.min(1, v));
    if (i >= steps) {
      clearInterval(id);
      fadeTimers.delete(audio);
      onDone?.();
    }
  }, stepMs);
  fadeTimers.set(audio, id);
}

async function ensureCombatLoaded() {
  if (combatUrlLoaded && combatAudio) return combatAudio;
  if (!combatUrlPromise) {
    combatUrlPromise = (async () => {
      // DB stores the title as "combat " (trailing space) — filter permissively.
      const all   = await base44.entities.HeroBackground.list();
      const match = all.find((b) => (b.title || '').trim().toLowerCase() === 'combat');
      const url   = match?.audio_url || match?.video_url || null;
      if (!url) return null;
      const a   = new Audio(url);
      a.loop    = true;
      a.volume  = 0;
      combatAudio     = a;
      combatUrlLoaded = true;
      return a;
    })();
  }
  return combatUrlPromise;
}

// ─── Public API ──────────────────────────────────────────────────────

// Called once from GameView so the manager can read/write the world
// theme's volume. worldRef is a React ref whose .current is the Audio el.
export function bindWorldAudio(worldRef, currentVolume) {
  worldAudioRef     = worldRef;
  worldTargetVolume = currentVolume;
}

// Keep worldTargetVolume in sync when the user changes the volume slider.
export function setWorldTargetVolume(v) {
  worldTargetVolume = v;
  // If exploration is active and no fade is in progress, apply immediately.
  if (
    currentState === STATE.EXPLORATION &&
    worldAudioRef?.current &&
    !fadeTimers.get(worldAudioRef.current)
  ) {
    worldAudioRef.current.volume = v;
  }
}

export async function enterCombat() {
  if (currentState === STATE.COMBAT) return;
  currentState = STATE.COMBAT;
  clearTransitionTimers();

  // Remember the user's current world volume so we can restore it later.
  const worldEl = worldAudioRef?.current;
  if (worldEl) worldTargetVolume = worldEl.volume || worldTargetVolume;

  // 1) Fade the world theme out over 2 s. Once silent, save its playback
  //    position and PAUSE it so nothing bleeds through.
  if (worldEl) {
    fadeTo(worldEl, 0, WORLD_FADE_MS, () => {
      if (currentState !== STATE.COMBAT) return; // exited combat during fade
      try {
        // Save playback memory of the world theme.
        // (No-op if the element doesn't expose currentTime.)
        if (typeof worldEl.currentTime === 'number') {
          // We don't need to read it explicitly — just leave it paused.
          // currentTime is preserved by the element while paused.
        }
        worldEl.pause();
        worldEl.volume = 0;
      } catch {}
    });
  }

  // 2) Preload combat audio while the world fades out.
  const audio = await ensureCombatLoaded();
  if (!audio || currentState !== STATE.COMBAT) return;

  // 3) After world has fully faded, start combat. Decide whether to resume
  //    from saved position or restart from 0 based on the 5-minute rule.
  combatStartTimer = setTimeout(() => {
    combatStartTimer = null;
    if (currentState !== STATE.COMBAT) return;

    const sinceLastExit = Date.now() - lastCombatExitTime;
    const resumeFromMemory =
      lastCombatExitTime > 0 && sinceLastExit < COMBAT_RESUME_LIMIT_MS;

    try {
      audio.currentTime = resumeFromMemory ? combatThemeTime : 0;
    } catch {
      audio.currentTime = 0;
    }
    audio.volume = 0;
    audio.play().catch((err) => console.warn('[musicManager] play blocked:', err));
    fadeTo(audio, COMBAT_VOLUME, COMBAT_FADE_IN_MS);
  }, WORLD_FADE_MS);
}

export function exitCombat() {
  if (currentState === STATE.EXPLORATION) return;
  currentState = STATE.EXPLORATION;
  clearTransitionTimers();

  // 1) Save combat playback position + exit timestamp, then fade out + pause.
  if (combatAudio) {
    try { combatThemeTime = combatAudio.currentTime || 0; } catch {}
    lastCombatExitTime = Date.now();

    fadeTo(combatAudio, 0, COMBAT_FADE_OUT_MS, () => {
      try { combatAudio.pause(); } catch {}
    });
  }

  // 2) After the resume delay, fade the world theme back in from its saved
  //    position. (The HTMLAudioElement preserves currentTime while paused,
  //    so just calling play() picks up exactly where we left off.)
  resumeTimer = setTimeout(() => {
    resumeTimer = null;
    if (currentState !== STATE.EXPLORATION) return; // combat restarted

    const worldEl = worldAudioRef?.current;
    if (worldEl) {
      worldEl.volume = 0;
      if (worldEl.paused) worldEl.play().catch(() => {});
      fadeTo(worldEl, worldTargetVolume, WORLD_FADE_IN_MS);
    }
  }, WORLD_RESUME_DELAY_MS);
}

export function isInCombat() { return currentState === STATE.COMBAT; }

// Full teardown on GameView unmount.
export function teardownCombatMusic() {
  clearTransitionTimers();
  currentState = STATE.EXPLORATION;
  if (combatAudio) {
    try { combatAudio.pause(); combatAudio.src = ''; combatAudio.load(); } catch {}
  }
  combatAudio        = null;
  combatUrlLoaded    = false;
  combatUrlPromise   = null;
  combatThemeTime    = 0;
  lastCombatExitTime = 0;
}