// AI Battle owns its own audio instance. It may reuse the same configured
// music URL as Game 3D, but it never starts/stops Game 3D's runtime audio pool.
// This keeps Luna AI Battle and Game Viewer as separate runtime surfaces.

const SHARED_AUDIO_MAP_KEY = 'combat_audio_map_v1';
let battleMusic = null;

function configuredBattleMusicUrl() {
  if (typeof window === 'undefined') return '';
  try {
    const raw = window.localStorage.getItem(SHARED_AUDIO_MAP_KEY);
    const map = raw ? JSON.parse(raw) : {};
    return String(map?.bgm_boss || '');
  } catch {
    return '';
  }
}

export function startAIBattleMusic({ volume = 0.5 } = {}) {
  if (typeof Audio === 'undefined' || battleMusic) return;
  const url = configuredBattleMusicUrl();
  if (!url) return;
  const audio = new Audio(url);
  audio.loop = true;
  audio.volume = volume;
  audio.play().catch(() => {});
  battleMusic = audio;
}

export function stopAIBattleMusic() {
  if (!battleMusic) return;
  battleMusic.pause();
  battleMusic.currentTime = 0;
  battleMusic.src = '';
  battleMusic = null;
}
