// An early animation-only signal for Luna PvP, never a combat authority.
// The authoritative confirmation uses the existing pvp_cast / pvp_melee events.
export const PREVIEW_KINDS = Object.freeze({
  skill: 'pvp_cast_preview',
  melee: 'pvp_melee_preview',
});

export function makeAttackPreview({ type, matchId, castId, slot, effectId } = {}) {
  const kind = PREVIEW_KINDS[type];
  const match = String(matchId || '');
  const cast = String(castId || '');
  if (!kind || !match || !cast) return null;
  if (type === 'skill' && (!Number.isInteger(Number(slot)) || Number(slot) < 0)) return null;
  return {
    kind,
    matchId: match,
    cast_id: cast,
    ...(type === 'skill' ? { slot: Number(slot), effect_id: String(effectId || '') } : {}),
  };
}

export function isAttackPreview(kind) {
  return kind === PREVIEW_KINDS.skill || kind === PREVIEW_KINDS.melee;
}
