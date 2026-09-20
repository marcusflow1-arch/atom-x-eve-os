// AXE Prompt 031 — permanent Elixir stat growth.

export const AXE_ELIXIR_CONFIG = Object.freeze({
  baseCapacity: 200,
  perUseCost: 1,
  resetRefundsItems: false,
});

export const AXE_ELIXIR_TYPES = Object.freeze({
  strength: Object.freeze({ id: 'strength', label: 'Strength Elixir', stat: 'strength', valuePerUse: 1 }),
  dexterity: Object.freeze({ id: 'dexterity', label: 'Dexterity Elixir', stat: 'dexterity', valuePerUse: 1 }),
  vitality: Object.freeze({ id: 'vitality', label: 'Vitality Elixir', stat: 'constitution', valuePerUse: 1 }),
  spirit: Object.freeze({ id: 'spirit', label: 'Spirit Elixir', stat: 'focus', valuePerUse: 1 }),
});

export function getAXEElixirCapacityBreakdown({
  haloBonus = 0,
  titleBonus = 0,
  eventBonus = 0,
} = {}) {
  const base = AXE_ELIXIR_CONFIG.baseCapacity;
  const halo = Math.max(0, Number(haloBonus) || 0);
  const title = Math.max(0, Number(titleBonus) || 0);
  const event = Math.max(0, Number(eventBonus) || 0);
  return {
    base,
    halo,
    title,
    event,
    total: base + halo + title + event,
  };
}

export function getAXEElixirAttributeBonusesFromAllocations(allocations = {}) {
  const out = { strength: 0, dexterity: 0, constitution: 0, focus: 0 };
  for (const type of Object.values(AXE_ELIXIR_TYPES)) {
    const uses = Math.max(0, Number(allocations[type.id] || 0));
    out[type.stat] += uses * Number(type.valuePerUse || 0);
  }
  return out;
}
