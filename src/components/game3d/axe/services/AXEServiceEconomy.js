// Central resource-cost contract for equipment Services not already owned by
// enchantmentStore. Costs are real inventory items from lootStore.
//
// These numbers are provisional balance values. The backend contract is the
// important part: preview -> validate ownership -> consume -> mutate item state.

export const AXE_SERVICE_COST_RULES = Object.freeze({
  stage: Object.freeze({
    base: Object.freeze({ evo_upgrade_stone: 1 }),
    growthEveryRank: 1,
  }),
  refine: Object.freeze({
    base: Object.freeze({ mat_reinforce: 1 }),
    growthEveryLevels: 3,
    protected: Object.freeze({ mat_protection: 1 }),
  }),
  ultimate: Object.freeze({
    base: Object.freeze({ mat_divine_essence: 1, mat_heroic_core: 1 }),
    growthEveryLevels: 2,
    protected: Object.freeze({ mat_protection: 1 }),
  }),
  sockets: Object.freeze({
    base: Object.freeze({ mat_crystal: 1 }),
    growthEverySockets: 1,
    protected: Object.freeze({ mat_protection: 1 }),
  }),
  equipment_aura: Object.freeze({
    base: Object.freeze({ mat_aura_shard: 1 }),
  }),
});

const scaleCost = (base = {}, scale = 1) => Object.fromEntries(
  Object.entries(base).map(([id, value]) => [id, Math.max(1, Math.floor(Number(value || 0) * scale))]),
);

const mergeCost = (...costs) => {
  const out = {};
  for (const cost of costs) {
    for (const [id, value] of Object.entries(cost || {})) {
      out[id] = (out[id] || 0) + Math.max(0, Number(value || 0));
    }
  }
  return out;
};

export function getAXEServiceInventoryCost(serviceId, {
  advancement = null,
  sockets = null,
  protectedAttempt = false,
} = {}) {
  if (serviceId === 'stage') {
    const rank = Math.max(0, Number(advancement?.stage?.rank || 0));
    return scaleCost(AXE_SERVICE_COST_RULES.stage.base, 1 + rank * AXE_SERVICE_COST_RULES.stage.growthEveryRank);
  }

  if (serviceId === 'refine') {
    const level = Math.max(0, Number(advancement?.refine?.level || 0));
    const scale = 1 + Math.floor(level / AXE_SERVICE_COST_RULES.refine.growthEveryLevels);
    return mergeCost(
      scaleCost(AXE_SERVICE_COST_RULES.refine.base, scale),
      protectedAttempt ? AXE_SERVICE_COST_RULES.refine.protected : null,
    );
  }

  if (serviceId === 'ultimate') {
    const level = Math.max(0, Number(advancement?.ultimate?.level || 0));
    const scale = 1 + Math.floor(level / AXE_SERVICE_COST_RULES.ultimate.growthEveryLevels);
    return mergeCost(
      scaleCost(AXE_SERVICE_COST_RULES.ultimate.base, scale),
      protectedAttempt ? AXE_SERVICE_COST_RULES.ultimate.protected : null,
    );
  }

  if (serviceId === 'sockets') {
    const open = Math.max(0, Number(sockets?.sockets?.length || 0));
    return mergeCost(
      scaleCost(AXE_SERVICE_COST_RULES.sockets.base, 1 + open * AXE_SERVICE_COST_RULES.sockets.growthEverySockets),
      protectedAttempt ? AXE_SERVICE_COST_RULES.sockets.protected : null,
    );
  }

  if (serviceId === 'equipment_aura') {
    return { ...AXE_SERVICE_COST_RULES.equipment_aura.base };
  }

  return {};
}
