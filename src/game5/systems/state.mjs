import {
  RULES,
  SETS,
  SLOTS,
  MOUNT_SLOTS,
  VANITY_SLOTS,
  ARCHETYPES,
  MATERIALS,
} from "./rules.mjs";
export function equipment(
  id,
  slot,
  {
    set = null,
    rarity = "common",
    archetype = "martial",
    owner = "character",
  } = {},
) {
  const power = set ? SETS[set].power : 1;
  const base =
    slot === "weapon"
      ? { attack: ARCHETYPES[archetype].attack * power }
      : slot === "armor"
        ? { defense: 40 * power, hp: 150 * power }
        : slot === "wings"
          ? { attack: 10 * power, defense: 10 * power }
          : ["ring", "necklace"].includes(slot)
            ? { elemental: 12 * power, resistance: 12 * power }
            : { defense: 16 * power, hp: 60 * power };
  return {
    id,
    kind: "equipment",
    slot,
    owner,
    rarity,
    set,
    archetype: slot === "weapon" ? archetype : null,
    name: `${set ? SETS[set].name : "Wanderer"} ${slot === "weapon" ? ARCHETYPES[archetype].name : slot[0].toUpperCase() + slot.slice(1)}`,
    base,
    enchant: 0,
    overcharge: "standard",
    stage: 0,
    sockets: [],
    locked: false,
  };
}
export function createPlayer(playerId) {
  const inventory = SLOTS.map((slot) => equipment(`starter-${slot}`, slot));
  return {
    schemaVersion: RULES.version,
    playerId,
    revision: 0,
    sequence: 0,
    nextItem: 1,
    level: 1,
    xp: 0,
    rebirth: 0,
    title: 0,
    points: 5,
    attributes: { strength: 10, vitality: 10, agility: 10, spirit: 10 },
    faction: "celestial",
    origin: "celestial",
    reputation: { celestial: 0, shadow: 0, elemental: 0 },
    vow: false,
    wallet: { silver: 5000, cp: 0 },
    inventory,
    equipment: Object.fromEntries(inventory.map((i) => [i.slot, i.id])),
    weapons: ["starter-weapon", null, null],
    activeWeapon: 0,
    mastery: Object.fromEntries(Object.keys(ARCHETYPES).map((k) => [k, 0])),
    materials: { healthPotion: 5, spiritPotion: 5, "enchant-3": 3, jade: 2 },
    vanity: Object.fromEntries(VANITY_SLOTS.map((s) => [s, null])),
    mount: {
      name: "Jade Spirit",
      species: "qilin",
      element: "water",
      level: 1,
      xp: 0,
      equipment: Object.fromEntries(MOUNT_SLOTS.map((s) => [s, null])),
      vanity: Object.fromEntries(VANITY_SLOTS.map((s) => [s, null])),
      absorbedUntil: 0,
      spiritualRank: 0,
      spiritualMode: "offensive",
    },
    pets: [{ id: "pet-0", species: "tiger", tier: 0, growth: 100 }],
    activePet: "pet-0",
    headHalo: 0,
    wingHalo: 0,
    premiumUntil: 0,
    demonRounds: 0,
    kills: 0,
    towers: { force: 0, bridge: 0, mindfulness: 0 },
    combat: {
      hp: 400,
      spirit: 250,
      lastTick: 0,
      cooldowns: {},
      gcdUntil: 0,
      guardSince: null,
      guardReady: 0,
      staggerUntil: 0,
      inCombatUntil: 0,
      potionReady: 0,
    },
    encounter: null,
    duel: null,
    trade: null,
    history: [],
    receipts: {},
  };
}
/** Explicit fixture: never used to initialize an authenticated account. */
export function createDemo() {
  const p = createPlayer("demo:systems");
  p.level = 100;
  p.points = 25;
  p.wallet = { silver: 50000000, cp: 20000 };
  p.vow = true;
  for (const id of Object.keys(MATERIALS)) p.materials[id] = 30;
  for (const set of Object.keys(SETS))
    for (const slot of SLOTS) {
      const i = equipment(`${set}-${slot}`, slot, {
        set,
        rarity:
          set === "chosen" ? "mythical" : set === "elite" ? "epic" : "rare",
        archetype: set === "chosen" ? "burst" : "martial",
      });
      i.enchant = set === "chosen" ? 120 : 30;
      i.stage = set === "chosen" ? 12 : 3;
      p.inventory.push(i);
    }
  for (const archetype of Object.keys(ARCHETYPES))
    if (archetype !== "martial")
      p.inventory.push(
        equipment(`mastery-${archetype}`, "weapon", {
          archetype,
          rarity: "rare",
        }),
      );
  for (const slot of MOUNT_SLOTS)
    p.inventory.push(
      equipment(`mount-${slot}`, slot, { owner: "mount", rarity: "mythical" }),
    );
  for (const slot of VANITY_SLOTS)
    p.inventory.push({
      id: `vanity-${slot}`,
      kind: "vanity",
      owner: "mount",
      slot,
      name: `Jade ${slot}`,
      rarity: "rare",
      base: { hp: 100, attack: 10 },
      augments: [],
      locked: false,
    });
  for (const slot of VANITY_SLOTS)
    p.inventory.push({
      id: `player-vanity-${slot}`,
      kind: "vanity",
      owner: "character",
      slot,
      name: `Inkbound ${slot}`,
      rarity: "rare",
      base: {},
      augments: [],
      locked: false,
    });
  p.nextItem = 3;
  p.pets.push(
    { id: "pet-1", species: "tiger", tier: 0, growth: 100 },
    { id: "pet-2", species: "tiger", tier: 0, growth: 100 },
  );
  p.mount.level = 50;
  p.mount.xp = 10000;
  return p;
}

/** Upgrade stored v1 snapshots without losing equipment, currencies or learned ranks. */
export function migratePlayer(source) {
  const p = structuredClone(source);
  if (p.schemaVersion === 1) {
    p.vanity = Object.fromEntries(VANITY_SLOTS.map((s) => [s, null]));
    p.mount.spiritualMode = "offensive";
    for (const i of p.inventory)
      if (i.kind === "equipment")
        i.overcharge =
          i.enchant > 150 ? "mythical" : i.enchant > 120 ? "basic" : "standard";
    p.schemaVersion = RULES.version;
  }
  return p;
}
