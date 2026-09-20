// AXE Prompt 022 — socket drilling, gems and gem management.
// Socket creation and gem operations are separate from Aura/Core/enchantment.

export const AXE_SOCKET_CONFIG = Object.freeze({
  defaultMaxSockets: 4,
  safeSocketCount: 1,
  baseDrillSuccessChance: 0.9,
  minimumDrillSuccessChance: 0.35,
});

export const AXE_GEM_DEFINITIONS = Object.freeze({
  gem_ruby_i: Object.freeze({ id: 'gem_ruby_i', name: 'Ruby I', rarity: 'common', stat: 'attack', value: 3, allowedSlots: ['weapon','gloves','ring'] }),
  gem_sapphire_i: Object.freeze({ id: 'gem_sapphire_i', name: 'Sapphire I', rarity: 'common', stat: 'defense', value: 3, allowedSlots: ['helm','chest','legs','boots','cape'] }),
  gem_jade_i: Object.freeze({ id: 'gem_jade_i', name: 'Jade I', rarity: 'uncommon', stat: 'maxHP', value: 20, allowedSlots: ['helm','chest','necklace','cape','wings'] }),
  gem_spirit_i: Object.freeze({ id: 'gem_spirit_i', name: 'Spirit Gem I', rarity: 'uncommon', stat: 'spirit', value: 2, allowedSlots: ['weapon','necklace','wings'] }),
  gem_crit_i: Object.freeze({ id: 'gem_crit_i', name: 'Critical Gem I', rarity: 'rare', stat: 'critChance', value: 1.5, allowedSlots: ['weapon','ring'] }),
});

const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));

export function drillSuccessChance(openSockets = 0, maxSockets = AXE_SOCKET_CONFIG.defaultMaxSockets) {
  const t = clamp01((Number(openSockets) || 0) / Math.max(1, Number(maxSockets) || 1));
  return Math.max(
    AXE_SOCKET_CONFIG.minimumDrillSuccessChance,
    AXE_SOCKET_CONFIG.baseDrillSuccessChance - t * 0.5,
  );
}

export function normalizeSocketState(item = {}) {
  const maxSockets = Math.max(0, Number(item.maxSockets ?? item.max_sockets ?? AXE_SOCKET_CONFIG.defaultMaxSockets));
  const sockets = Array.isArray(item.sockets) ? item.sockets.map((s, index) => ({
    index,
    open: s?.open !== false,
    gemId: s?.gemId || s?.gem_id || null,
  })) : [];

  return { maxSockets, sockets };
}

export function resolveDrill(item = {}, {
  roll = Math.random(),
  protectedAttempt = false,
  guaranteed = false,
} = {}) {
  const state = normalizeSocketState(item);
  if (state.sockets.length >= state.maxSockets) {
    return { ok: false, reason: 'MAX_SOCKETS', sockets: state.sockets };
  }

  const chance = guaranteed ? 1 : drillSuccessChance(state.sockets.length, state.maxSockets);
  if (roll > chance) {
    return {
      ok: false,
      outcome: protectedAttempt ? 'protected' : 'failure',
      chance,
      sockets: state.sockets,
    };
  }

  const next = [...state.sockets, { index: state.sockets.length, open: true, gemId: null }];
  return { ok: true, outcome: 'success', chance, sockets: next };
}

export function canInsertAXEGem(item, socketIndex, gemId) {
  const gem = AXE_GEM_DEFINITIONS[gemId];
  if (!gem) return { ok: false, reason: 'GEM_MISSING' };

  const state = normalizeSocketState(item);
  const socket = state.sockets[socketIndex];
  if (!socket) return { ok: false, reason: 'SOCKET_MISSING' };
  if (!socket.open) return { ok: false, reason: 'SOCKET_LOCKED' };
  if (socket.gemId) return { ok: false, reason: 'SOCKET_OCCUPIED' };

  const slot = item.slot || item.category;
  if (gem.allowedSlots?.length && !gem.allowedSlots.includes(slot)) {
    return { ok: false, reason: 'GEM_SLOT_RESTRICTED' };
  }

  return { ok: true, gem };
}

export function insertAXEGem(item, socketIndex, gemId) {
  const valid = canInsertAXEGem(item, socketIndex, gemId);
  if (!valid.ok) return valid;

  const state = normalizeSocketState(item);
  const sockets = state.sockets.map((socket, index) =>
    index === socketIndex ? { ...socket, gemId } : socket
  );
  return { ok: true, sockets, gem: valid.gem };
}

export function removeAXEGem(item, socketIndex, { preserveGem = true } = {}) {
  const state = normalizeSocketState(item);
  const socket = state.sockets[socketIndex];
  if (!socket) return { ok: false, reason: 'SOCKET_MISSING' };
  if (!socket.gemId) return { ok: false, reason: 'SOCKET_EMPTY' };

  const removedGemId = socket.gemId;
  const sockets = state.sockets.map((entry, index) =>
    index === socketIndex ? { ...entry, gemId: null } : entry
  );

  return {
    ok: true,
    sockets,
    removedGemId,
    gemPreserved: !!preserveGem,
  };
}

export function replaceAXEGem(item, socketIndex, gemId, { preserveOldGem = true } = {}) {
  const state = normalizeSocketState(item);
  const socket = state.sockets[socketIndex];
  if (!socket) return { ok: false, reason: 'SOCKET_MISSING' };

  const slot = item.slot || item.category;
  const gem = AXE_GEM_DEFINITIONS[gemId];
  if (!gem) return { ok: false, reason: 'GEM_MISSING' };
  if (gem.allowedSlots?.length && !gem.allowedSlots.includes(slot)) {
    return { ok: false, reason: 'GEM_SLOT_RESTRICTED' };
  }

  const oldGemId = socket.gemId || null;
  const sockets = state.sockets.map((entry, index) =>
    index === socketIndex ? { ...entry, gemId } : entry
  );

  return { ok: true, sockets, oldGemId, oldGemPreserved: !!preserveOldGem, gem };
}

export function collectAXEGemStats(item = {}) {
  const state = normalizeSocketState(item);
  const stats = {};
  for (const socket of state.sockets) {
    if (!socket.gemId) continue;
    const gem = AXE_GEM_DEFINITIONS[socket.gemId];
    if (!gem) continue;
    stats[gem.stat] = (stats[gem.stat] || 0) + Number(gem.value || 0);
    if (gem.secondaryStat && Number.isFinite(Number(gem.secondaryValue))) {
      stats[gem.secondaryStat] = (stats[gem.secondaryStat] || 0) + Number(gem.secondaryValue);
    }
  }
  return stats;
}
