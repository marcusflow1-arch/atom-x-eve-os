// ─── Buff display ─────────────────────────────────────────────────────────
// Maps the live buff engine's records (skills/buffEngine.jsx, keyed by skill_id)
// to what the HUD buff strips draw: icon, name, colour, seconds left and, for
// Focus, the empowered hits left. Shared by ActiveBuffsStrip and BuffDividerLine.

import { getSkillById } from '../skills/skillRegistry';

// Strip order and look. A buff the engine holds that is not listed here still
// shows, with its registry icon and name, after these.
export const BUFF_META = {
  aegis_shield:     { icon: '🛡️', label: 'Aegis Shield',      color: '#60a5fa' },
  focus:            { icon: '🧠', label: 'Focus',             color: '#f59e0b' },
  decisive_blow:    { icon: '🎯', label: 'Decisive Blow',     color: '#ef4444' },
  gods_deflection:  { icon: '✨', label: "God's Deflection", color: '#a78bfa' },
  heavens_riposte:  { icon: '🪞', label: "Heaven's Riposte", color: '#22d3ee' },
  axe_power_charge: { icon: '🔥', label: 'Power Charge',      color: '#fb923c' },
};

const FALLBACK_COLOR = '#dcc896';

export function buffMeta(skillId) {
  if (BUFF_META[skillId]) return BUFF_META[skillId];
  const skill = getSkillById(skillId);
  return { icon: skill?.icon || '✨', label: skill?.skill_name || skillId, color: FALLBACK_COLOR };
}

/**
 * Active buffs in strip order: [{ key, remaining (s), hits? }].
 * `buffs` is the engine's buffs map; expired records are left out.
 */
export function activeBuffList(buffs, now = performance.now()) {
  if (!buffs) return [];
  const order = Object.keys(BUFF_META);
  const rank = (id) => (order.includes(id) ? order.indexOf(id) : order.length);
  return Object.values(buffs)
    .filter((b) => b && b.expiresAt > now)
    .sort((a, b) => rank(a.skill_id) - rank(b.skill_id) || a.skill_id.localeCompare(b.skill_id))
    .map((b) => ({
      key: b.skill_id,
      remaining: (b.expiresAt - now) / 1000,
      ...(b.hitsRemaining !== undefined ? { hits: b.hitsRemaining } : {}),
    }));
}

export function fmt(sec) {
  if (sec <= 0) return '0s';
  if (sec < 10) return `${sec.toFixed(1)}s`;
  return `${Math.ceil(sec)}s`;
}
