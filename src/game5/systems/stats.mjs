import { RARITIES, SETS, SET_BONUSES, MATERIALS, PETS, ARCHETYPES, CULTIVATION, glowFor } from './rules.mjs';
export const itemById = (p, id) => p.inventory.find(i => i.id === id);
const add = (to, from, weight = 1) => {
  for (const [k, v] of Object.entries(from || {})) to[k] = (to[k] || 0) + v * weight;
  return to;
};
export function itemStats(i) {
  if (i?.kind !== 'equipment') return {};
  const s = {};
  for (const [k, v] of Object.entries(i.base)) s[k] = (v + i.stage * (k === 'hp' ? 20 : 3)) * RARITIES[i.rarity].multiplier * (1 + i.enchant / 100);
  for (const g of i.sockets) add(s, MATERIALS[g]?.gem);
  return s;
}
export function equippedItems(p) {
  return Object.entries(p.equipment).map(([k, id]) => itemById(p, k === 'weapon' ? p.weapons[p.activeWeapon] : id)).filter(Boolean);
}
export function activeSets(p) {
  const items = equippedItems(p);
  return Object.entries(SETS).map(([id, set]) => ({ id, ...set, pieces: items.filter(i => i.set === id).length, bonuses: SET_BONUSES.map(b => ({ ...b, active: b.slots.every(slot => items.some(i => i.slot === slot && i.set === id)) })) }));
}
export function mountShare(p) {
  const maxed = Object.values(p.mount.equipment).filter(id => {
    const i = itemById(p, id);
    return i?.enchant === 200 && i.stage === CULTIVATION.refinementCap;
  }).length;
  return Math.min(CULTIVATION.mountShareCap, CULTIVATION.mountBaseShare + maxed * CULTIVATION.mountGearShare);
}
export function vanityStats(p, slots, weight = 1) {
  const out = {};
  for (const id of Object.values(slots || {})) {
    const item = itemById(p, id);
    if (item?.kind !== 'vanity') continue;
    add(out, item.base, weight);
    for (const augment of item.augments) add(out, { [augment.stat]: augment.value }, weight);
  }
  return out;
}
export function statsFor(p, now) {
  const absorbed = p.mount.absorbedUntil > now;
  const share = absorbed ? mountShare(p) : 0;
  const utilityRank = absorbed && p.mount.spiritualMode === 'utility' ? p.mount.spiritualRank : 0;
  const a = Object.fromEntries(Object.entries(p.attributes).map(([k, v]) => [k, v + p.headHalo]));
  a.agility += utilityRank * CULTIVATION.utilityAgilityPerRank;
  const g = { attack: 0, defense: 0, hp: 0, elemental: 0, resistance: 0, hit: 0, evade: 0 };
  for (const item of equippedItems(p)) add(g, itemStats(item));
  const bonus = {};
  for (const set of activeSets(p)) for (const b of set.bonuses) if (b.active) add(bonus, b.stats);
  for (const k of Object.keys(g)) g[k] *= (1 + (bonus[k] || 0)) * (1 + share) * (1 + p.wingHalo * .01);
  if (absorbed) for (const id of Object.values(p.mount.equipment)) add(g, itemStats(itemById(p, id)), share);
  const vanity = vanityStats(p, p.vanity);
  if (absorbed) add(vanity, vanityStats(p, p.mount.vanity, share));
  add(g, vanity);
  const pet = p.pets.find(x => x.id === p.activePet);
  if (pet) add(g, PETS[pet.species], (1 + pet.tier * .7) * pet.growth / 100);
  const w = itemById(p, p.weapons[p.activeWeapon]), archetype = w?.archetype || 'martial';
  return {
    attack: Math.round((20 + a.strength * 2.8 + a.spirit * 1.5 + g.attack + p.title * 5) * (1 + Math.min(1, vanity.attackPercent || 0))),
    defense: Math.round(a.agility * 1.6 + g.defense + p.title * 3),
    maxHp: Math.round(200 + a.vitality * 20 + g.hp + p.level * 10), maxSpirit: 100 + a.spirit * 15,
    hit: 100 + a.strength * 2 + g.hit, evade: a.vitality * .9 + a.agility * 1.67 + g.evade,
    elemental: Math.round(g.elemental), resistance: Math.round(g.resistance),
    critical: Math.min(.4, .05 + a.agility * .001 + (vanity.critical || 0) + utilityRank * CULTIVATION.utilityCritPerRank),
    criticalMultiplier: 1.5 + Math.min(.5, p.mastery[archetype] / 20000),
    spiritual: absorbed && p.mount.spiritualMode !== 'utility' ? p.mount.spiritualRank * CULTIVATION.offensiveDamagePerRank : 0,
    attackSpeed: Math.min(.5, vanity.attackSpeed || 0), skillDamage: Math.min(1, vanity.skillDamage || 0),
    movementMultiplier: 1 + utilityRank * CULTIVATION.utilityMovementPerRank,
    agility: a.agility, archetype, range: ARCHETYPES[archetype].range, absorbed, share, glow: glowFor(w?.enchant || 0),
  };
}
