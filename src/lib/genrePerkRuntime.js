import { base44 } from '@/api/base44Client';

const unwrap = (response) => {
  const body = response?.data ?? response ?? {};
  if (body?.error) throw new Error(body.error);
  return body;
};

/**
 * Runtime bridge for Atom x Eve genre perks.
 * Games should request this once on session start and again after a perk unlock
 * or reconnect. The server only returns effects explicitly whitelisted by the
 * GamePerkIntegration record for the requested game.
 */
export async function resolveGenrePerksForGame(gameId) {
  if (!gameId) throw new Error('gameId is required');
  return unwrap(await base44.functions.invoke('genreSkillTree', {
    action: 'get_game_effects',
    data: { game_id: gameId },
  }));
}

export function effectMap(runtimeResponse) {
  return Object.fromEntries((runtimeResponse?.effects || []).map((effect) => [effect.key, effect]));
}

export function getEffectValue(runtimeResponse, key, fallback = 0) {
  const effect = (runtimeResponse?.effects || []).find((item) => item.key === key);
  return effect ? Number(effect.value || 0) : fallback;
}

export function gameSupportsGenrePerks(runtimeResponse) {
  return !!runtimeResponse?.integrated;
}
