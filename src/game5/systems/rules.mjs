/** Game 5 only. Provisional balance constants are intentionally independent of Luna cards. */
export const RULES = {
  version: 2,
  bagCapacity: 80,
  enchantCap: 200,
  safeEnchant: 54,
  stageCap: 20,
  maxLevel: 200,
  mountLevel: 50,
  headHaloCap: 96,
  wingHaloCap: 20,
  gcd: 350,
  parryWindow: 220,
};
export const RARITIES = {
  common: { label: "Common", color: "#8aaf71", multiplier: 1, sockets: 1 },
  uncommon: {
    label: "Uncommon",
    color: "#68aad1",
    multiplier: 1.05,
    sockets: 2,
  },
  rare: { label: "Rare", color: "#d8c56e", multiplier: 1.15, sockets: 2 },
  unique: { label: "Unique", color: "#d89355", multiplier: 1.3, sockets: 2 },
  epic: { label: "Epic", color: "#b88bda", multiplier: 1.5, sockets: 3 },
  legendary: {
    label: "Legendary",
    color: "#db7772",
    multiplier: 1.75,
    sockets: 4,
  },
  mythical: { label: "Mythical", color: "#f4dfa1", multiplier: 2, sockets: 4 },
};
export const SLOTS = [
  "weapon",
  "head",
  "armor",
  "gloves",
  "boots",
  "ring",
  "necklace",
  "wings",
];
export const MOUNT_SLOTS = [
  "headpiece",
  "saddle",
  "barding",
  "stirrups",
  "reins",
  "harness",
  "core",
];
export const VANITY_SLOTS = ["wrap", "wingSkin", "auraTrail", "heraldry"];
export const SETS = {
  rare: { name: "Jade Sentinel", label: "Rare", power: 1, level: 1 },
  elite: { name: "Crimson Warden", label: "Elite", power: 1.35, level: 30 },
  chosen: { name: "Heavenbound", label: "Chosen", power: 1.8, level: 60 },
};
export const SET_BONUSES = [
  {
    name: "Resonance",
    slots: ["ring", "necklace"],
    stats: { elemental: 0.4, resistance: 0.4 },
  },
  {
    name: "Armament",
    slots: ["armor", "weapon"],
    stats: { attack: 0.4, defense: 0.4 },
  },
  {
    name: "Iron Triad",
    slots: ["armor", "gloves", "boots"],
    stats: { defense: 0.6, hit: 0.6, evade: 0.6 },
  },
  {
    name: "Striker",
    slots: ["weapon", "boots"],
    stats: { attack: 0.6, evade: 0.6 },
  },
];
export const FACTIONS = {
  celestial: "Celestial Order",
  shadow: "Shadow Syndicate",
  elemental: "Elemental Dominion",
  outlaw: "Outlaws",
};
export const ARCHETYPES = {
  burst: {
    name: "Greatsword",
    range: 3.4,
    attack: 48,
    skills: ["cleave", "sunder", "shockwave"],
  },
  combo: {
    name: "Twin Blades",
    range: 2.7,
    attack: 30,
    skills: ["flurry", "viper", "whirlwind"],
  },
  ranged: {
    name: "Spirit Bow",
    range: 18,
    attack: 35,
    skills: ["arrow", "pierce", "volley"],
  },
  martial: {
    name: "Dao Blade",
    range: 3,
    attack: 37,
    skills: ["strike", "rising", "sweep"],
  },
  guard: {
    name: "Guard Shield",
    range: 2.5,
    attack: 26,
    skills: ["bash", "counter", "challenge"],
  },
};
const skill = (
  name,
  archetype,
  coefficient,
  cost,
  cooldown,
  hits = 1,
  extra = {},
) => ({ name, archetype, coefficient, cost, cooldown, hits, ...extra });
export const SKILLS = {
  cleave: skill("Heavy Cleave", "burst", 1.8, 10, 700),
  sunder: skill("Sundering Edge", "burst", 2.5, 24, 4500, 1, { pierce: 0.35 }),
  shockwave: skill("Mountain Break", "burst", 1.3, 30, 6000, 1, { aoe: 5 }),
  flurry: skill("Twin Flurry", "combo", 0.55, 9, 650, 3),
  viper: skill("Viper Fang", "combo", 0.65, 18, 3500, 3, { elemental: 12 }),
  whirlwind: skill("Whirling Blades", "combo", 0.5, 28, 5500, 3, { aoe: 4 }),
  arrow: skill("Spirit Arrow", "ranged", 1.2, 8, 650),
  pierce: skill("Piercing Shot", "ranged", 1.8, 20, 3500, 1, { pierce: 0.25 }),
  volley: skill("Rain of Arrows", "ranged", 0.6, 30, 6000, 3, { aoe: 5 }),
  strike: skill("Flowing Strike", "martial", 1.3, 8, 500),
  rising: skill("Rising Palm", "martial", 1.8, 18, 3000, 1, { stagger: 450 }),
  sweep: skill("Lotus Sweep", "martial", 1.1, 24, 5000, 1, { aoe: 4 }),
  bash: skill("Shield Bash", "guard", 1.1, 8, 700),
  counter: skill("Iron Counter", "guard", 1.9, 16, 3500, 1, { stagger: 300 }),
  challenge: skill("Guardian Call", "guard", 0.9, 24, 5000, 1, { aoe: 4 }),
};
export const MATERIALS = {
  ...Object.fromEntries(
    [3, 6, 9, 12, 15].map((n) => [
      `enchant-${n}`,
      { name: `Enchant Stone +${n}%`, percent: n },
    ]),
  ),
  jade: { name: "Refinement Jade" },
  protection: { name: "Protection Scroll" },
  celestialProtection: { name: "Celestial Protection" },
  guardian: { name: "Guardian Scroll" },
  wingTalisman: { name: "Wing Talisman" },
  goldenFeather: { name: "Golden Feather" },
  blackFeather: { name: "Black Feather" },
  absorption60: { name: "Absorption Pill · 60 min" },
  absorption600: { name: "Absorption Pill · 600 min" },
  feed: { name: "Holy Mount Feed" },
  silverCard: { name: "Silver Augment Card" },
  goldScroll: { name: "Gold Augment Scroll" },
  socketStone: { name: "Socket Stone" },
  attackGem: { name: "Attack Jade", gem: { attack: 12 } },
  healthGem: { name: "Vitality Jade", gem: { hp: 100 } },
  defenseGem: { name: "Defense Jade", gem: { defense: 14 } },
  healthPotion: { name: "Health Tonic" },
  spiritPotion: { name: "Spirit Tonic" },
  premiumToken: { name: "Premium Token" },
  demonScroll: { name: "Demon Scroll" },
  petEgg: { name: "Spirit Companion Egg" },
};
export const SHOP = [
  ["protection", 3000],
  ["guardian", 3500],
  ["absorption60", 4500],
  ["feed", 1000],
  ["healthPotion", 100],
  ["spiritPotion", 100],
  ["silverCard", 8000],
  ["goldScroll", 16000],
  ["wingTalisman", 4000],
  ["premiumToken", 18000],
  ["demonScroll", 12000],
].map(([id, price]) => ({ id, price }));
export const CRAFTS = {
  protection: { silver: 2000, materials: { jade: 2 } },
  wingTalisman: { silver: 2500, materials: { blackFeather: 3 } },
  absorption60: { silver: 2000, materials: { jade: 2, goldenFeather: 1 } },
};
export const PET_TIERS = ["young", "master", "ascended", "guardian"];
export const PETS = {
  tiger: { attack: 50 },
  turtle: { defense: 70 },
  phoenix: { hp: 300 },
  dragon: { attack: 35, defense: 35, hp: 150 },
};
export const ENCOUNTERS = {
  sparring: {
    name: "Training challenge",
    count: 1,
    hp: 600,
    attack: 30,
    defense: 25,
    xp: 100,
    silver: 100,
  },
  patrol: {
    name: "Rogue patrol",
    count: 3,
    hp: 900,
    attack: 50,
    defense: 60,
    xp: 250,
    silver: 200,
  },
  elite: {
    name: "Elite trial",
    count: 1,
    hp: 7000,
    attack: 200,
    defense: 150,
    xp: 1000,
    silver: 1000,
  },
};
export const enchantChance = (n) =>
  n <= 54
    ? 1
    : n < 90
      ? 0.85
      : n < 120
        ? 0.65
        : n < 160
          ? 0.45
          : n < 200
            ? 0.25
            : 0.15;
export const glowFor = (n) =>
  n >= 200
    ? "celestial"
    : n >= 160
      ? "crimson"
      : n >= 120
        ? "amber"
        : n >= 90
          ? "purple"
          : n >= 60
            ? "blue"
            : n > 0
              ? "yellow"
              : "none";
export const xpNeeded = (n) => 100 + n * n * 25;
export class RuleError extends Error {
  constructor(code, message = code, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
export function check(ok, code, message, status) {
  if (!ok) throw new RuleError(code, message, status);
}
export function integer(n, min, max) {
  check(Number.isSafeInteger(n) && n >= min && n <= max, "INVALID_NUMBER");
  return n;
}
export const owned = (p, id) => {
  const i = p.inventory.find((x) => x.id === id);
  check(i, "ITEM_NOT_FOUND", "Select an owned item.");
  return i;
};
export const isEquipped = (p, id) =>
  [
    ...Object.values(p.equipment),
    ...p.weapons,
    ...Object.values(p.mount.equipment),
    ...Object.values(p.mount.vanity),
    ...Object.values(p.vanity || {}),
  ].includes(id);
export function spend(p, cost) {
  for (const [k, v] of Object.entries(cost)) {
    check(p.wallet[k] >= v, "INSUFFICIENT_FUNDS", `Requires ${v} ${k}.`);
  }
  for (const [k, v] of Object.entries(cost)) p.wallet[k] -= v;
}
export function consume(p, cost) {
  for (const [k, v] of Object.entries(cost))
    check(
      (p.materials[k] || 0) >= v,
      "MISSING_MATERIAL",
      `Requires ${v} ${MATERIALS[k]?.name || k}.`,
    );
  for (const [k, v] of Object.entries(cost)) p.materials[k] -= v;
}

/** Confirmed percentage ceilings; costs remain tuneable development balance. */
export const OVERCHARGE = Object.freeze({
  standard: {
    label: "Standard",
    cap: 120,
    next: "basic",
    silver: 50000,
    cp: 100,
  },
  basic: {
    label: "Basic overcharge",
    cap: 150,
    next: "mythical",
    silver: 150000,
    cp: 300,
  },
  mythical: {
    label: "Mythical overcharge",
    cap: 200,
    next: null,
    silver: 0,
    cp: 0,
  },
});
export const CULTIVATION = Object.freeze({
  artDirection: "sumi-e ink",
  mountBaseShare: 0.25,
  mountGearShare: 0.02,
  mountShareCap: 0.39,
  spiritualRankCap: 20,
  spiritualXpPerRank: 500,
  offensiveDamagePerRank: 8,
  utilityAgilityPerRank: 1,
  utilityMovementPerRank: 0.005,
  utilityCritPerRank: 0.001,
  // Retain existing limits until the dictated 12/25/25, 120 and 450 values are resolved.
  refinementCap: RULES.stageCap,
  headHaloCap: RULES.headHaloCap,
  wingHaloCap: RULES.wingHaloCap,
  protectionFrom: 90,
  celestialProtectionFrom: 160,
});
export const AUGMENTS = Object.freeze({
  silver: [
    { stat: "attackSpeed", min: 0.01, max: 0.03 },
    { stat: "critical", min: 0.01, max: 0.03 },
  ],
  gold: [
    { stat: "attackPercent", min: 0.04, max: 0.08 },
    { stat: "skillDamage", min: 0.05, max: 0.1 },
  ],
});
export const tierFor = (i) =>
  i.overcharge ||
  (i.enchant > 150 ? "mythical" : i.enchant > 120 ? "basic" : "standard");
