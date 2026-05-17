// ─── One-Time Progression Reset ────────────────────────────────────────────
// Wipes Halo + Title progression a single time on app load, then marks it
// done in localStorage so it never runs again. Bumping RESET_VERSION will
// trigger a fresh reset for everyone.
//
// Only resets Halo and Title systems — does NOT touch player level, XP,
// attribute points, equipment, gold, or any other progression.

import { resetHalo } from './haloStore';
import { resetTitles } from './titleStore';
import { incrementKillCount, getKillCount } from '../killCountStore';

const RESET_VERSION = 'reset_halo_title_2026_05_17';

export function runOneTimeProgressionReset() {
  try {
    if (localStorage.getItem(RESET_VERSION) === 'done') return;
    resetHalo();
    resetTitles();
    // Also drain the banked-kills currency so Halo truly starts from zero.
    const banked = getKillCount();
    if (banked > 0) incrementKillCount(-banked);
    localStorage.setItem(RESET_VERSION, 'done');
    console.log('[Progression] Halo + Title systems reset to zero.');
  } catch (e) {
    console.warn('[Progression] One-time reset failed:', e);
  }
}