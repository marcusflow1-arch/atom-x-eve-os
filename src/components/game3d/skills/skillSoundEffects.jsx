// ─── Skill Sound Effects ───────────────────────────────────────────────
// Tiny audio player keyed by skill_id. Plays one sound per skill while
// it's casting. Stops the sound the moment casting ends (or if a fresh
// cast comes in mid-play).
//
// Per-skill behavior:
//   • sword_triple_slash  — start sfx at cast begin, stop after final hit
//   • ranged_double_shot  — play bow sfx once per hit (back-to-back)
//
// Sounds are sourced from the HeroBackground admin entries — URLs are
// captured here as constants. Add new skills by extending SKILL_SOUNDS.

const SKILL_SOUNDS = {
  sword_triple_slash: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/73e547a69_sword.mp3',
  ranged_double_shot: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/8b42dddde_bow_shoot.mp3',
};

// Active audio instances keyed by skill_id so we can stop on demand.
const active = new Map();

function stopSkillSound(skillId) {
  const audio = active.get(skillId);
  if (audio) {
    try { audio.pause(); audio.currentTime = 0; } catch {}
    active.delete(skillId);
  }
}

function playSkillSound(skillId) {
  const url = SKILL_SOUNDS[skillId];
  if (!url) return;
  // If a prior instance is still playing, stop it first.
  stopSkillSound(skillId);
  const audio = new Audio(url);
  audio.volume = 0.7;
  active.set(skillId, audio);
  audio.play().catch(() => {});
}

// Sword triple slash: one continuous sfx, started at cast, stopped after
// the final hit (3 hits × 0.5s = ~1.5s total).
export function onTripleSlashCast() {
  playSkillSound('sword_triple_slash');
  // Failsafe: stop slightly after the full cast window even if no hits land.
  setTimeout(() => stopSkillSound('sword_triple_slash'), 1600);
}

export function onTripleSlashFinalHit() {
  stopSkillSound('sword_triple_slash');
}

// Bow double shot: play bow sfx for each of the 2 hits.
export function onDoubleShotHit() {
  playSkillSound('ranged_double_shot');
}

// End-of-cast guard — invoked when the cast window is fully done.
export function onDoubleShotCastEnd() {
  stopSkillSound('ranged_double_shot');
}