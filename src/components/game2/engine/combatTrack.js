/**
 * Game 2's isolated playback of Game 1's configured HeroBackground combat music.
 * Only the URL is shared; these games never share an Audio element or its lifecycle.
 * The source is the same "Combat 2" / "Combat" record selected by Game 1's
 * combatMusicController, not Game 1's disabled world/exploration theme.
 */
export function selectGame1CombatTrack(backgrounds = []) {
  if (!Array.isArray(backgrounds)) return null;
  const find = title => backgrounds.find(row => String(row?.title || '').trim().toLowerCase() === title);
  const selected = find('combat 2') || find('combat');
  const url = selected?.audio_url || selected?.video_url;
  return typeof url === 'string' && /^(https?:\/\/|\/)/i.test(url.trim()) ? url.trim() : null;
}

const clamp01 = v => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));

/** Game 1's attack/HP trigger semantics, adapted to actual Game 2 fighter state. */
export function game2CombatActive(game) {
  if (!game || game.attract || !game.started || game.hud?.help || game.player?.status === 'dead') return false;
  if (game.duel && game.round?.state !== 'fight') return false;
  if (game.teamMatch?.ended) return false;
  const player = game.player;
  if (!player?.pos || typeof game.foesOf !== 'function') return false;
  const foes = game.foesOf(player);
  const nearby = foes.some(enemy => enemy?.pos && enemy.status !== 'dead' &&
    Math.hypot(enemy.pos[0] - player.pos[0], enemy.pos[2] - player.pos[2]) < 14);
  const recentlyFought = game.t - Math.max(player.lastHurt ?? -1e6, game.lastCombatMusicEventAt ?? -1e6) < 5;
  return nearby || recentlyFought;
}

/**
 * One HTMLAudioElement per Game 2 match. Fades are frame-driven; no fade timers
 * survive unmount. Re-enter combat resumes exactly where playback paused.
 */
export class Game2CombatTrack {
  constructor({ AudioCtor = globalThis.Audio, now = () => Date.now() } = {}) {
    this.AudioCtor = AudioCtor;
    this.now = now;
    this.audio = null;
    this.url = null;
    this.active = false;
    this.lastExitAt = null;
    this.savedTime = 0;
    this.disposed = false;
  }

  setUrl(url) {
    if (this.disposed || url === this.url) return;
    this.releaseAudio();
    this.url = typeof url === 'string' && url.trim() ? url.trim() : null;
    if (!this.url || typeof this.AudioCtor !== 'function') return;
    this.audio = new this.AudioCtor(this.url);
    this.audio.preload = 'auto';
    this.audio.loop = true;
    this.audio.volume = 0;
    this.active = false;
    this.savedTime = 0;
    this.lastExitAt = null;
  }

  play() {
    if (!this.audio || this.disposed) return;
    try {
      const promise = this.audio.play();
      promise?.catch?.(() => { /* Browser blocks autoplay until a user gesture. */ });
    } catch { /* Audio source unavailable; game and SFX still run. */ }
  }

  // Called on Game 2's existing first-input gesture to recover autoplay.
  unlock() {
    if (this.active && this.audio?.paused) this.play();
  }

  update({ fighting = false, volume = 0.5, dt = 0.016 } = {}) {
    const a = this.audio;
    if (!a || this.disposed) return false;
    const desired = Boolean(fighting);
    if (desired && !this.active) {
      // If combat returns mid fade-out, leave the audio playing at its
      // current position. Otherwise resume from the last paused timestamp.
      if (a.paused) {
        if (this.lastExitAt !== null) {
          try { a.currentTime = this.savedTime; } catch { /* unsupported media seek */ }
        }
        this.play();
      }
    } else if (!desired && this.active) {
      this.lastExitAt = this.now();
    }
    this.active = desired;
    const target = desired ? clamp01(volume) : 0;
    const seconds = desired ? 0.4 : 1.0;
    const factor = Math.min(1, Math.max(0, dt) / seconds);
    a.volume = clamp01(a.volume + (target - a.volume) * factor);
    if (!desired && a.volume < 0.008 && !a.paused) {
      a.volume = 0;
      a.pause();
      this.savedTime = Number.isFinite(a.currentTime) ? a.currentTime : 0;
    }
    // Only duck the generated arena score if the external track is playing.
    return desired && !a.paused;
  }

  releaseAudio() {
    if (!this.audio) return;
    try { this.audio.pause(); this.audio.removeAttribute?.('src'); this.audio.load?.(); } catch { /* already disposed */ }
    this.audio = null;
    this.active = false;
  }

  dispose() {
    this.disposed = true;
    this.releaseAudio();
    this.url = null;
  }
}
