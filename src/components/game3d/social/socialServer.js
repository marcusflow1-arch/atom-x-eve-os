// The in-game social actions go through the server: friend requests (socialActions),
// parties (partySystem) and duels (duelSystem). Since 2026-09-26 the request, friendship
// and duel tables only accept writes from the server, so the browser writes the game used
// to make were refused for everyone but admins (docs/game3d/BACKEND_AUDIT.md).
import { base44 } from '@/api/base44Client';
import { getPlayerHUD } from '../playerHUDStore';

const CODE_BY_STATUS = { 401: 'unauthorized', 403: 'forbidden', 404: 'not_found', 409: 'conflict', 410: 'expired', 422: 'invalid', 429: 'rate_limit' };

const coded = (message, code, extra = {}) => Object.assign(new Error(message || 'Request failed'), { code, ...extra });

// Calls a backend function and returns its data; a failure becomes an Error with a `code`
// the game's toasts already understand (cooldown, rate_limit, party_full, already_dueling…).
export async function callGameServer(fn, action, data = {}) {
  let response;
  try {
    response = await base44.functions.invoke(fn, { action, data });
  } catch (error) {
    const status = error?.response?.status || error?.status;
    const body = error?.response?.data || error?.data || {};
    const message = body.error || error?.message;
    throw coded(message, body.code || (/party is full/i.test(message || '') ? 'party_full' : CODE_BY_STATUS[status] || 'server'), { status, body });
  }
  const body = response?.data ?? response ?? {};
  if (body?.error) throw coded(body.error, body.code || 'server', { body });
  return body;
}

// The combat stats a duelist brings (the server clamps them).
export function myDuelStats() {
  const hud = getPlayerHUD() || {};
  const d = hud.derived || {};
  return {
    level: hud.level || 1,
    damage: d.damage, maxHP: d.maxHP, defense: d.defense,
    attackSuccess: d.attackSuccess, attackBlock: d.attackBlock, critChance: d.critChance,
    attributionAttack: d.attributionAttack, attributionDefense: d.attributionDefense,
    criticalDamage: d.criticalDamage, criticalDefense: d.criticalDefense,
    // the build effects (docs/game3d/BUILD_BALANCE.md); the server clamps each to its cap
    avoidPct: d.avoidPct, deflectPct: d.deflectPct, blockPct: d.blockPct, damageReductionPct: d.damageReductionPct,
    reflectPct: d.reflectPct, lifeStealPct: d.lifeStealPct, armorPenPct: d.armorPenPct, hitBonusPct: d.hitBonusPct,
    critChanceReductionPct: d.critChanceReductionPct, skillDamagePct: d.skillDamagePct,
    executeThresholdPct: d.executeThresholdPct, executeDamagePct: d.executeDamagePct,
  };
}
