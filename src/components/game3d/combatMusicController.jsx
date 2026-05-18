// ─── Combat Music Controller ──────────────────────────────────────────
// Owns a single combat <Audio> element + fade orchestration between the
// world theme and the combat theme.
//
// Behavior:
//   enterCombat() →
//     1. Fade the world theme DOWN to 0 (over WORLD_FADE_MS).
//     2. Fade the combat theme UP to its target volume (over COMBAT_FADE_IN_MS).
//   exitCombat() →
//     1. Fade the combat theme DOWN to 0 (over COMBAT_FADE_OUT_MS), then pause.
//     2. Wait WORLD_RESUME_DELAY_MS (~3 s).
//     3. Fade the world theme back UP to its original volume.
//
// Calling enter/exit repeatedly is safe — any in-flight fade is cancelled
// and replaced with the new direction.
//
// The combat audio URL is fetched once from the HeroBackground entity with
// title "combat" (HeroBackground may store the file in `audio_url` OR
// `video_url`; both work with HTMLAudioElement since browsers decode MP4
// audio tracks).

import { base44 } from '@/api/base44Client';

const WORLD_FADE_MS        = 500;   // world theme ducks out
const COMBAT_FADE_IN_MS    = 600;   // combat theme fades in
const COMBAT_FADE_OUT_MS   = 1000;  // combat theme fades out after combat ends
const WORLD_RESUME_DELAY_MS = 3000; // 3 second gap before world theme returns
const WORLD_FADE_IN_MS     = 1200;  // world theme fades back up

const COMBAT_VOLUME_FACTOR = 1.0; // combat plays at full target (= world volume)

let combatAudio = null;
let worldAudioRef = null;        // ref-object passed in from GameView
let worldTargetVolume = 0.5;     // remembered so we can restore it after fade
let activeFadeTimer = null;      // setInterval id for the current fade
let resumeTimer = null;          // setTimeout id for the 3 s gap
let inCombat = false;
let combatUrlLoaded = false;
let combatUrlPromise = null;

// ─── Helpers ──────────────────────────────────────────────────────────

function clearTimers() {
  if (activeFadeTimer) { clearInterval(activeFadeTimer); activeFadeTimer = null; }
  if (resumeTimer)     { clearTimeout(resumeTimer);     resumeTimer = null; }
}

// Generic linear volume fade. onDone fires when target reached.
function fadeTo(audio, target, durationMs, onDone) {
  if (!audio) { onDone?.(); return; }
  const start = audio.volume;
  const delta = target - start;
  if (Math.abs(delta) < 0.001 || durationMs <= 0) {
    audio.volume = Math.max(0, Math.min(1, target));
    onDone?.();
    return;
  }
  const stepMs = 50;
  const steps = Math.max(1, Math.round(durationMs / stepMs));
  let i = 0;
  if (activeFadeTimer) clearInterval(activeFadeTimer);
  activeFadeTimer = setInterval(() => {
    i++;
    const v = start + delta * (i / steps);
    audio.volume = Math.max(0, Math.min(1, v));
    if (i >= steps) {
      clearInterval(activeFadeTimer);
      activeFadeTimer = null;
      onDone?.();
    }
  }, stepMs);
}

async function ensureCombatLoaded() {
  if (combatUrlLoaded && combatAudio) return combatAudio;
  if (!combatUrlPromise) {
    combatUrlPromise = (async () => {
      // The title in the DB has a trailing space ("combat "), so we filter
      // permissively and pick the first match.
      const all = await base44.entities.HeroBackground.list();
      const match = all.find((b) => (b.title || '').trim().toLowerCase() === 'combat');
      const url = match?.audio_url || match?.video_url || null;
      if (!url) return null;
      const a = new Audio(url);
      a.loop = true;
      a.volume = 0;
      combatAudio = a;
      combatUrlLoaded = true;
      return a;
    })();
  }
  return combatUrlPromise;
}

// ─── Public API ───────────────────────────────────────────────────────

// Called once from GameView so the controller can read/write the world
// theme's volume. worldRef is a React ref whose .current is the Audio el.
export function bindWorldAudio(worldRef, currentVolume) {
  worldAudioRef = worldRef;
  worldTargetVolume = currentVolume;
}

// Keep worldTargetVolume in sync when the user changes the volume slider.
export function setWorldTargetVolume(v) {
  worldTargetVolume = v;
  // If we're not currently in combat AND no fade is active, keep the world
  // audio at the new level. (If we ARE in combat, leave it muted.)
  if (!inCombat && worldAudioRef?.current && !activeFadeTimer) {
    worldAudioRef.current.volume = v;
  }
}

export async function enterCombat() {
  if (inCombat) return;
  inCombat = true;
  clearTimers();

  // Capture the world audio's CURRENT volume as the level we'll restore to.
  // This guarantees that even if combat ends 3+ seconds later, we fade back
  // up to wherever the user had it (slider position, etc.).
  if (worldAudioRef?.current) {
    worldTargetVolume = worldAudioRef.current.volume || worldTargetVolume;
  }

  // 1) Fade world out
  if (worldAudioRef?.current) {
    fadeTo(worldAudioRef.current, 0, WORLD_FADE_MS);
  }

  // 2) Start combat fade in
  const audio = await ensureCombatLoaded();
  if (!audio || !inCombat) return; // user may have exited combat by now
  audio.currentTime = 0;
  audio.volume = 0;
  audio.play().catch((err) => console.warn('[combatMusic] play blocked:', err));
  fadeTo(audio, worldTargetVolume * COMBAT_VOLUME_FACTOR, COMBAT_FADE_IN_MS);
}

export function exitCombat() {
  if (!inCombat) return;
  inCombat = false;
  clearTimers();

  // 1) Fade combat out → pause → wait → 2) fade world back in
  if (combatAudio) {
    fadeTo(combatAudio, 0, COMBAT_FADE_OUT_MS, () => {
      try { combatAudio.pause(); } catch {}
    });
  }

  resumeTimer = setTimeout(() => {
    resumeTimer = null;
    if (inCombat) return; // combat restarted during the gap — abort restore
    if (worldAudioRef?.current) {
      // Make sure the world audio is actually playing (it should be — we
      // only ducked its volume, not its playback state).
      if (worldAudioRef.current.paused) {
        worldAudioRef.current.play().catch(() => {});
      }
      fadeTo(worldAudioRef.current, worldTargetVolume, WORLD_FADE_IN_MS);
    }
  }, WORLD_RESUME_DELAY_MS);
}

export function isInCombat() { return inCombat; }

// Used by GameView on unmount to fully tear down audio.
export function teardownCombatMusic() {
  clearTimers();
  inCombat = false;
  if (combatAudio) {
    try { combatAudio.pause(); combatAudio.src = ''; combatAudio.load(); } catch {}
  }
  combatAudio = null;
  combatUrlLoaded = false;
  combatUrlPromise = null;
}