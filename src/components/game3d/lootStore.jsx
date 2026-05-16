// ─── Loot Store — Drop definitions, RNG, and inventory state ─────────────────
import { SKILLS_DATABASE } from './equipment/skillData';

export const LOOT_RARITIES = {
  common:    { color: '#9ca3af', hex: 0x9ca3af, glow: 0x9ca3af, label: 'Common'    },
  rare:      { color: '#60a5fa', hex: 0x60a5fa, glow: 0x60a5fa, label: 'Rare'      },
  epic:      { color: '#a78bfa', hex: 0xa78bfa, glow: 0xa78bfa, label: 'Epic'      },
  legendary: { color: '#f59e0b', hex: 0xf59e0b, glow: 0xf59e0b, label: 'Legendary' },
  mythic:    { color: '#f43f5e', hex: 0xf43f5e, glow: 0xf43f5e, label: 'Mythic'    },
  divine:    { color: '#e879f9', hex: 0xe879f9, glow: 0xe879f9, label: 'Divine'    },
};

// All possible loot items that can drop from enemies
export const LOOT_TABLE = [
  // ── Skills ────────────────────────────────────────────────────────────────
  { id: 'skill_berserker_slash', name: 'Berserker Slash',  category: 'skill',     rarity: 'epic',      icon: '⚔️',  weight: 8  },
  { id: 'skill_flame_cleave',    name: 'Flame Cleave',     category: 'skill',     rarity: 'rare',      icon: '🔥',  weight: 12 },
  { id: 'skill_void_strike',     name: 'Void Strike',      category: 'skill',     rarity: 'legendary', icon: '🌑',  weight: 3  },
  { id: 'skill_iron_fortress',   name: 'Iron Fortress',    category: 'skill',     rarity: 'rare',      icon: '🏰',  weight: 10 },
  { id: 'skill_phantom_shot',    name: 'Phantom Shot',     category: 'skill',     rarity: 'epic',      icon: '👻',  weight: 7  },
  { id: 'skill_counter_pulse',       name: 'Counter Pulse',        category: 'skill',     rarity: 'epic',      icon: '🔄',  weight: 6  },
  { id: 'skill_storm_rounds',        name: 'Storm Rounds',         category: 'skill',     rarity: 'legendary', icon: '⛈️',  weight: 2  },
  { id: 'repulsion',                 name: 'Repulsion',            category: 'skill',     rarity: 'legendary', icon: '⚡',  weight: 3  },
  { id: 'barrier_aura',              name: 'Barrier',              category: 'skill',     rarity: 'epic',      icon: '🛡️', weight: 5  },
  { id: 'heavens_destruction',       name: "Heaven's Destruction", category: 'skill',     rarity: 'mythic',    icon: '🌑',  weight: 2  },
  { id: 'power_charge',              name: 'Power Charge',         category: 'skill',     rarity: 'epic',      icon: '🔥',  weight: 6  },
  // ── Active Ability Scrolls (must be learned to equip in Q/E/R/F slots) ─
  { id: 'lightning_strike',          name: 'Lightning Strike',     category: 'skill',     rarity: 'rare',      icon: '⚡',  weight: 6  },
  { id: 'shadow_teleport',           name: 'Shadow Teleport',      category: 'skill',     rarity: 'epic',      icon: '🌀',  weight: 4  },
  { id: 'frost_tornado',             name: 'Frost Tornado',        category: 'skill',     rarity: 'rare',      icon: '🌪️', weight: 6  },
  // ── Enchanting Materials ──────────────────────────────────────────────────
  { id: 'mat_soul_fragment',     name: 'Soul Fragment',    category: 'material',  rarity: 'rare',      icon: '💠',  weight: 25 },
  { id: 'mat_void_crystal',      name: 'Void Crystal',     category: 'material',  rarity: 'epic',      icon: '🔮',  weight: 15 },
  { id: 'mat_divine_essence',    name: 'Divine Essence',   category: 'material',  rarity: 'legendary', icon: '✨',  weight: 5  },
  { id: 'mat_aura_shard',        name: 'Aura Shard',       category: 'material',  rarity: 'rare',      icon: '🌟',  weight: 20 },
  // ── Crafting Resources ────────────────────────────────────────────────────
  { id: 'craft_bone',            name: 'Creature Bone',    category: 'crafting',  rarity: 'common',    icon: '🦴',  weight: 40 },
  { id: 'craft_fang',            name: 'Toxic Fang',       category: 'crafting',  rarity: 'common',    icon: '🦷',  weight: 35 },
  { id: 'craft_hide',            name: 'Beast Hide',       category: 'crafting',  rarity: 'common',    icon: '🎭',  weight: 38 },
  { id: 'craft_essence',         name: 'Dark Essence',     category: 'crafting',  rarity: 'rare',      icon: '🫧',  weight: 18 },
  // ── Evolution Materials ────────────────────────────────────────────────────
  { id: 'evo_ancient_relic',     name: 'Ancient Relic',    category: 'evolution', rarity: 'legendary', icon: '🏺',  weight: 4  },
  { id: 'evo_boss_fragment',     name: 'Boss Fragment',    category: 'evolution', rarity: 'mythic',    icon: '💀',  weight: 2  },
  { id: 'evo_upgrade_stone',     name: 'Upgrade Stone',    category: 'evolution', rarity: 'rare',      icon: '🪨',  weight: 16 },
  // ── Companion Materials ────────────────────────────────────────────────────
  { id: 'comp_treat',            name: 'Companion Treat',  category: 'companion', rarity: 'common',    icon: '🍖',  weight: 30 },
  { id: 'comp_bond_crystal',     name: 'Bond Crystal',     category: 'companion', rarity: 'rare',      icon: '💎',  weight: 14 },
  // ── Misc ──────────────────────────────────────────────────────────────────
  { id: 'misc_coin_bag',         name: 'Gold Coins',       category: 'misc',      rarity: 'common',    icon: '🪙',  weight: 50 },
  { id: 'misc_potion',           name: 'Health Potion',    category: 'misc',      rarity: 'common',    icon: '🧪',  weight: 45 },
  { id: 'misc_event_token',      name: 'Event Token',      category: 'misc',      rarity: 'epic',      icon: '🎫',  weight: 8  },
];

// ── Drop-rate logic ────────────────────────────────────────────────────────
// Base 35% chance per kill. Boss/elite enemies have higher multipliers.
const BASE_SKILL_DROP_CHANCE = 0.35;
const TIER_MULTIPLIERS = { normal: 1.0, elite: 2.0, champion: 3.5, boss: 8.0 };
const BOSS_LEGENDARY_BOOST = 3.0; // multiplies legendary/mythic/divine weights for bosses

/**
 * Roll loot drops from a dead enemy.
 * Returns an array of 0–3 loot items (can be empty).
 */
export function rollEnemyDrops(enemyTier = 'normal', isBoss = false) {
  const drops = [];

  // 1. Primary drop: always rolled
  const primaryRoll = Math.random();
  const mult = TIER_MULTIPLIERS[enemyTier] || 1.0;
  const adjustedChance = Math.min(0.92, BASE_SKILL_DROP_CHANCE * mult);
  if (primaryRoll <= adjustedChance) {
    const item = weightedSample(buildWeightedTable(isBoss));
    if (item) drops.push({ ...item, dropId: `drop_${Date.now()}_${Math.random().toString(36).slice(2)}` });
  }

  // 2. Secondary drop: only for elite/champion/boss
  if ((enemyTier === 'elite' || enemyTier === 'champion' || enemyTier === 'boss') && Math.random() < 0.45) {
    const item = weightedSample(buildWeightedTable(isBoss));
    if (item) drops.push({ ...item, dropId: `drop_${Date.now()}_${Math.random().toString(36).slice(2)}` });
  }

  // 3. Bonus boss drop: guaranteed extra rare+
  if (isBoss && drops.length < 3) {
    const rareTable = LOOT_TABLE.filter((i) => ['legendary', 'mythic', 'divine'].includes(i.rarity));
    const item = rareTable[Math.floor(Math.random() * rareTable.length)];
    if (item) drops.push({ ...item, dropId: `drop_${Date.now()}_${Math.random().toString(36).slice(2)}` });
  }

  return drops;
}

function buildWeightedTable(isBoss) {
  if (!isBoss) return LOOT_TABLE;
  return LOOT_TABLE.map((item) => {
    const isHighRarity = ['legendary', 'mythic', 'divine'].includes(item.rarity);
    return isHighRarity ? { ...item, weight: item.weight * BOSS_LEGENDARY_BOOST } : item;
  });
}

function weightedSample(table) {
  const total = table.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of table) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return table[table.length - 1];
}

// ── In-memory collected loot inventory (categorized) ─────────────────────
let _lootInventory = {};
const _listeners = new Set();

export function getLootInventory() { return _lootInventory; }

export function addLootToInventory(item) {
  const cat = item.category || 'misc';
  _lootInventory = {
    ..._lootInventory,
    [cat]: [...(_lootInventory[cat] || []), { ...item, collectedAt: Date.now() }],
  };
  _listeners.forEach((fn) => fn(_lootInventory));
}

export function subscribeLootInventory(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

// ── Learned skills — IDs of skill scroll items the player has "learned" ──
// Stored as a Set of skill loot item IDs (matches LOOT_TABLE id, e.g. 'skill_berserker_slash')
// Persisted to localStorage so learned skills survive game sessions.
const LS_LEARNED_KEY = 'game_learned_skills_v1';

function loadLearned() {
  try {
    const raw = localStorage.getItem(LS_LEARNED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

// In the editor/preview environment only, auto-grant ALL skills so devs can
// test every passive + active without needing to farm them. The live/published
// app keeps the normal loot-driven learning flow.
function isEditorEnv() {
  try {
    const h = window.location.hostname;
    return h === 'localhost' || h.includes('base44.app') || h.includes('preview');
  } catch { return false; }
}

function loadInitialLearned() {
  const base = loadLearned();
  if (isEditorEnv()) {
    // 1. Grant every skill loot-table id (matches inventory-based detection)
    LOOT_TABLE.forEach((item) => { if (item.category === 'skill') base.add(item.id); });
    // 2. Also grant every SKILLS_DATABASE id directly so the Skills Book shows
    //    every chapter skill (including passives like iron_fortress, counter_pulse
    //    that aren't in the loot table).
    SKILLS_DATABASE.forEach((s) => base.add(s.id));
  }
  return base;
}

let _learnedSkillIds = loadInitialLearned();
const _learnListeners = new Set();

function persistLearned() {
  try { localStorage.setItem(LS_LEARNED_KEY, JSON.stringify([..._learnedSkillIds])); } catch {}
}

// IDs in this set are ACTIVE abilities (matches abilityStore ABILITY_DEFINITIONS.id)
// and should auto-equip to the first empty Q/E/R/F slot when learned.
const ACTIVE_ABILITY_IDS = new Set(['lightning_strike', 'shadow_teleport', 'frost_tornado']);

export function getLearnedSkillIds() { return _learnedSkillIds; }

export function learnSkill(lootItem) {
  if (_learnedSkillIds.has(lootItem.id)) return; // already learned
  _learnedSkillIds = new Set([..._learnedSkillIds, lootItem.id]);
  persistLearned();
  _learnListeners.forEach((fn) => fn(_learnedSkillIds));

  // If this is an active ability, auto-equip it into the first empty Q/E/R/F slot
  // so it instantly appears on the player's hotkey bar.
  if (ACTIVE_ABILITY_IDS.has(lootItem.id)) {
    // Lazy import to avoid circular dep at module init
    import('./abilityStore').then(({ getAbilityState, equipAbility }) => {
      const equipped = getAbilityState().equipped || [];
      const emptyIdx = equipped.findIndex((v) => !v);
      if (emptyIdx !== -1 && !equipped.includes(lootItem.id)) {
        equipAbility(emptyIdx, lootItem.id);
      }
    }).catch(() => {});
  }

  // Remove the scroll from the skill inventory so it can't be used again
  const skills = _lootInventory['skill'] || [];
  const idx = skills.findIndex(
    (s) => s.dropId === lootItem.dropId || (s.id === lootItem.id && s.collectedAt === lootItem.collectedAt)
  );
  if (idx !== -1) {
    const updated = [...skills];
    updated.splice(idx, 1);
    _lootInventory = { ..._lootInventory, skill: updated };
    _listeners.forEach((fn) => fn(_lootInventory));
  }
}

export function subscribeLearnedSkills(fn) {
  _learnListeners.add(fn);
  return () => _learnListeners.delete(fn);
}