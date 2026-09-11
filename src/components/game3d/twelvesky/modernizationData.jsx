// TwelveSky2-inspired modernization rules.
// Historical values in this file are limited to mechanics that were verified
// against public TwelveSky2 guides. Atom X Eve can rebalance them centrally
// without changing UI or combat code.

export const TWELVESKY_SKILL_ROLES = [
  { slot: 1, role: 'single', label: 'Single', intent: 'Primary burst strike' },
  { slot: 2, role: 'multi',  label: 'Multi',  intent: 'Sustained combo damage' },
  { slot: 3, role: 'aoe',    label: 'AoE',    intent: 'Grinding / pack clear' },
  { slot: 4, role: 'single', label: 'Single', intent: 'Second burst strike' },
  { slot: 5, role: 'multi',  label: 'Multi',  intent: 'Sustained combo damage' },
  { slot: 6, role: 'single', label: 'Single', intent: 'High-level burst strike' },
  { slot: 7, role: 'multi',  label: 'Multi',  intent: 'High-level combo damage' },
  { slot: 8, role: 'aoe',    label: 'AoE',    intent: 'Elite area / farming skill' },
  { slot: 9, role: 'single', label: 'Single', intent: 'God-tier burst strike' },
  { slot: 10, role: 'multi', label: 'Multi',  intent: 'God-tier combo damage' },
];

export function getTwelveSkySkillRole(slot) {
  return TWELVESKY_SKILL_ROLES.find((entry) => entry.slot === Number(slot)) || null;
}

export const ELIXIR_CAPS = {
  normal: 200,
  expansion: 200,
  total: 400,
};

export const ELIXIR_DEFINITIONS = {
  vit: {
    id: 'vit', name: 'VIT Elixir', icon: '❤️',
    perDose: { hp: 20 },
    summary: '+20 Max HP per dose',
  },
  spr: {
    id: 'spr', name: 'Spirit Elixir', icon: '🔷',
    perDose: { force: 25 },
    summary: '+25 Force per dose',
  },
  agi: {
    id: 'agi', name: 'AGI Elixir', icon: '💨',
    perDose: { hit: 2, dodge: 2 },
    summary: '+2 HIT and +2 Dodge per dose',
  },
  str: {
    id: 'str', name: 'STR Elixir', icon: '⚔️',
    perDose: { damage: 3 },
    summary: '+3 ATK per dose',
  },
  aatk: {
    id: 'aatk', name: 'A.ATK Elixir', icon: '🔥',
    perDose: { attributeAttack: 10 },
    summary: '+10 Attribute ATK per dose',
  },
  adef: {
    id: 'adef', name: 'A.DEF Elixir', icon: '🛡️',
    perDose: { attributeDefense: 10 },
    summary: '+10 Attribute DEF per dose',
  },
};

// Verified modern TwelveSky2 event bands. Legacy war brackets changed over the
// years, so older level brackets should be added only after version-specific
// verification rather than guessed from memory.
export const VERIFIED_WAR_BANDS = [
  { id: 'deity_1_4', label: 'Deity 1–4', minTier: 'D1', maxTier: 'D4' },
  { id: 'deity_5_8', label: 'Deity 5–8', minTier: 'D5', maxTier: 'D8' },
  { id: 'deity_9_11', label: 'Deity 9–11', minTier: 'D9', maxTier: 'D11' },
  { id: 'rebirth_0_6', label: 'Rebirth 0–6', minTier: 'R0', maxTier: 'R6' },
  { id: 'rebirth_7_12', label: 'Rebirth 7–12', minTier: 'R7', maxTier: 'R12' },
];

export const PERSONAL_SERVICES = [
  {
    id: 'forge', icon: '⚒️', title: 'Spirit Forge',
    oldFlow: 'Travel to a blacksmith / crafting NPC.',
    modernFlow: 'Upgrade, refine, socket, combine and enchant directly from your menu.',
  },
  {
    id: 'market', icon: '🧪', title: 'Spirit Market',
    oldFlow: 'Return to a merchant for potions and selling.',
    modernFlow: 'Your bonded spirit buys consumables and sells unwanted loot while you stay in the field.',
  },
  {
    id: 'title', icon: '🏷️', title: 'Titles',
    oldFlow: 'Visit the palace NPC and exchange Contribution Points.',
    modernFlow: 'Spend CP and manage your title path from the Character menu.',
  },
  {
    id: 'halo', icon: '⭕', title: 'Halo',
    oldFlow: 'Visit the halo NPC / elder.',
    modernFlow: 'Advance and equip Halo progression from the Character menu.',
  },
  {
    id: 'quest', icon: '📜', title: 'Quest Link',
    oldFlow: 'Run back to quest NPCs to accept, report and advance.',
    modernFlow: 'Your spirit relays quest dialogue, turn-ins and next objectives remotely.',
  },
  {
    id: 'elixir', icon: '🧬', title: 'Elixirs',
    oldFlow: 'Consume permanent-stat items one at a time.',
    modernFlow: 'Use 1, 10, or max doses from one permanent progression panel.',
  },
];

// Atom X Eve balance presets inspired by the set-bonus structure the user
// described. These are design values, not claimed as archival TwelveSky2 data.
export const MODERN_SET_PRESETS = [
  { id: 'S2E', pieces: 2, grade: 'Elite', allStatsPct: 20 },
  { id: 'S4E', pieces: 4, grade: 'Elite', allStatsPct: 60 },
  { id: 'S5E', pieces: 5, grade: 'Elite', allStatsPct: 100 },
];
