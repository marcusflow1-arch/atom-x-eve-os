// ─── Loot Store — Drop definitions, RNG, and inventory state ────────────────
import { SKILLS_DATABASE } from './equipment/skillData';

export const LOOT_RARITIES = {
  common:    { color: '#9ca3af', hex: 0x9ca3af, glow: 0x9ca3af, label: 'Common' },
  rare:      { color: '#60a5fa', hex: 0x60a5fa, glow: 0x60a5fa, label: 'Rare' },
  epic:      { color: '#a78bfa', hex: 0xa78bfa, glow: 0xa78bfa, label: 'Epic' },
  legendary: { color: '#f59e0b', hex: 0xf59e0b, glow: 0xf59e0b, label: 'Legendary' },
  mythic:    { color: '#f43f5e', hex: 0xf43f5e, glow: 0xf43f5e, label: 'Mythic' },
  divine:    { color: '#e879f9', hex: 0xe879f9, glow: 0xe879f9, label: 'Divine' },
};

export const LOOT_TABLE = [
  // Skills
  { id: 'skill_berserker_slash', name: 'Berserker Slash', category: 'skill', rarity: 'epic', icon: '⚔️', weight: 8 },
  { id: 'skill_flame_cleave', name: 'Flame Cleave', category: 'skill', rarity: 'rare', icon: '🔥', weight: 12 },
  { id: 'skill_void_strike', name: 'Void Strike', category: 'skill', rarity: 'legendary', icon: '🌑', weight: 3 },
  { id: 'skill_iron_fortress', name: 'Iron Fortress', category: 'skill', rarity: 'rare', icon: '🏰', weight: 10 },
  { id: 'skill_phantom_shot', name: 'Phantom Shot', category: 'skill', rarity: 'epic', icon: '👻', weight: 7 },
  { id: 'skill_counter_pulse', name: 'Counter Pulse', category: 'skill', rarity: 'epic', icon: '🔄', weight: 6 },
  { id: 'skill_storm_rounds', name: 'Storm Rounds', category: 'skill', rarity: 'legendary', icon: '⛈️', weight: 2 },
  { id: 'repulsion', name: 'Repulsion', category: 'skill', rarity: 'legendary', icon: '⚡', weight: 3 },
  { id: 'barrier_aura', name: 'Barrier', category: 'skill', rarity: 'epic', icon: '🛡️', weight: 5 },
  { id: 'heavens_destruction', name: "Heaven's Destruction", category: 'skill', rarity: 'mythic', icon: '🌑', weight: 2 },
  { id: 'power_charge', name: 'Power Charge', category: 'skill', rarity: 'epic', icon: '🔥', weight: 6 },
  // Active ability scrolls
  { id: 'lightning_strike', name: 'Lightning Strike', category: 'skill', rarity: 'rare', icon: '⚡', weight: 6 },
  { id: 'shadow_teleport', name: 'Shadow Teleport', category: 'skill', rarity: 'epic', icon: '🌀', weight: 4 },
  { id: 'frost_tornado', name: 'Frost Tornado', category: 'skill', rarity: 'rare', icon: '🌪️', weight: 6 },
  // Enchanting materials
  { id: 'mat_soul_fragment', name: 'Soul Fragment', category: 'material', rarity: 'rare', icon: '💠', weight: 25 },
  { id: 'mat_void_crystal', name: 'Void Crystal', category: 'material', rarity: 'epic', icon: '🔮', weight: 15 },
  { id: 'mat_divine_essence', name: 'Divine Essence', category: 'material', rarity: 'legendary', icon: '✨', weight: 5 },
  { id: 'mat_aura_shard', name: 'Aura Shard', category: 'material', rarity: 'rare', icon: '🌟', weight: 20 },
  // Crafting
  { id: 'craft_bone', name: 'Creature Bone', category: 'crafting', rarity: 'common', icon: '🦴', weight: 40 },
  { id: 'craft_fang', name: 'Toxic Fang', category: 'crafting', rarity: 'common', icon: '🦷', weight: 35 },
  { id: 'craft_hide', name: 'Beast Hide', category: 'crafting', rarity: 'common', icon: '🎭', weight: 38 },
  { id: 'craft_essence', name: 'Dark Essence', category: 'crafting', rarity: 'rare', icon: '🫧', weight: 18 },
  // Evolution
  { id: 'evo_ancient_relic', name: 'Ancient Relic', category: 'evolution', rarity: 'legendary', icon: '🏺', weight: 4 },
  { id: 'evo_boss_fragment', name: 'Boss Fragment', category: 'evolution', rarity: 'mythic', icon: '💀', weight: 2 },
  { id: 'evo_upgrade_stone', name: 'Upgrade Stone', category: 'evolution', rarity: 'rare', icon: '🪨', weight: 16 },
  // Companion
  { id: 'comp_treat', name: 'Companion Treat', category: 'companion', rarity: 'common', icon: '🍖', weight: 30 },
  { id: 'comp_bond_crystal', name: 'Bond Crystal', category: 'companion', rarity: 'rare', icon: '💎', weight: 14 },
  // Misc
  { id: 'misc_coin_bag', name: 'Gold Coins', category: 'misc', rarity: 'common', icon: '🪙', weight: 50 },
  { id: 'misc_potion', name: 'Health Potion', category: 'misc', rarity: 'common', icon: '🧪', weight: 45 },
  { id: 'misc_event_token', name: 'Event Token', category: 'misc', rarity: 'epic', icon: '🎫', weight: 8 },
];

const BASE_SKILL_DROP_CHANCE = 0.35;
const TIER_MULTIPLIERS = { normal: 1.0, elite: 2.0, champion: 3.5, boss: 8.0 };
const BOSS_LEGENDARY_BOOST = 3.0;

export function rollEnemyDrops(enemyTier = 'normal', isBoss = false) {
  const drops = [];
  const mult = TIER_MULTIPLIERS[enemyTier] || 1.0;
  const adjustedChance = Math.min(0.92, BASE_SKILL_DROP_CHANCE * mult);

  if (Math.random() <= adjustedChance) {
    const item = weightedSample(buildWeightedTable(isBoss));
    if (item) drops.push(withDropId(item));
  }

  if ((enemyTier === 'elite' || enemyTier === 'champion' || enemyTier === 'boss') && Math.random() < 0.45) {
    const item = weightedSample(buildWeightedTable(isBoss));
    if (item) drops.push(withDropId(item));
  }

  if (isBoss && drops.length < 3) {
    const rareTable = LOOT_TABLE.filter((i) => ['legendary', 'mythic', 'divine'].includes(i.rarity));
    const item = rareTable[Math.floor(Math.random() * rareTable.length)];
    if (item) drops.push(withDropId(item));
  }

  return drops;
}

function withDropId(item) {
  return { ...item, dropId: `drop_${Date.now()}_${Math.random().toString(36).slice(2)}` };
}

function buildWeightedTable(isBoss) {
  if (!isBoss) return LOOT_TABLE;
  return LOOT_TABLE.map((item) => {
    const high = ['legendary', 'mythic', 'divine'].includes(item.rarity);
    return high ? { ...item, weight: item.weight * BOSS_LEGENDARY_BOOST } : item;
  });
}

function weightedSample(table) {
  const total = table.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of table) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return table[table.length - 1];
}

// ── Collected loot inventory ─────────────────────────────────────────────
let _lootInventory = {};
const _listeners = new Set();

export function getLootInventory() { return _lootInventory; }

export function addLootToInventory(item) {
  const cat = item.category || 'misc';
  _lootInventory = {
    ..._lootInventory,
    [cat]: [...(_lootInventory[cat] || []), { ...item, collectedAt: Date.now() }],
  };
  notifyLoot();
}

// Removes one exact field-loot instance. Spirit Market uses dropId so two
// identical drops remain independently sellable.
export function removeLootFromInventory(dropId) {
  if (!dropId) return null;
  for (const [category, items] of Object.entries(_lootInventory)) {
    const index = items.findIndex((item) => item.dropId === dropId);
    if (index === -1) continue;
    const removed = items[index];
    const nextItems = [...items];
    nextItems.splice(index, 1);
    const next = { ..._lootInventory };
    if (nextItems.length) next[category] = nextItems;
    else delete next[category];
    _lootInventory = next;
    notifyLoot();
    return removed;
  }
  return null;
}

export function removeLootWhere(predicate) {
  if (typeof predicate !== 'function') return [];
  const removed = [];
  const next = {};
  Object.entries(_lootInventory).forEach(([category, items]) => {
    const kept = [];
    items.forEach((item) => {
      if (predicate(item)) removed.push(item);
      else kept.push(item);
    });
    if (kept.length) next[category] = kept;
  });
  if (removed.length) {
    _lootInventory = next;
    notifyLoot();
  }
  return removed;
}

function notifyLoot() {
  _listeners.forEach((fn) => fn(_lootInventory));
}

export function subscribeLootInventory(fn) {
  _listeners.add(fn);
  fn(_lootInventory);
  return () => _listeners.delete(fn);
}

// ── Learned skills ───────────────────────────────────────────────────────
const LS_LEARNED_KEY = 'game_learned_skills_v1';

function loadLearned() {
  try {
    const raw = localStorage.getItem(LS_LEARNED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function isEditorEnv() {
  try {
    const h = window.location.hostname;
    return h === 'localhost' || h.includes('base44.app') || h.includes('preview');
  } catch { return false; }
}

function loadInitialLearned() {
  const base = loadLearned();
  if (isEditorEnv()) {
    LOOT_TABLE.forEach((item) => { if (item.category === 'skill') base.add(item.id); });
    SKILLS_DATABASE.forEach((skill) => base.add(skill.id));
  }
  return base;
}

let _learnedSkillIds = loadInitialLearned();
const _learnListeners = new Set();

function persistLearned() {
  try { localStorage.setItem(LS_LEARNED_KEY, JSON.stringify([..._learnedSkillIds])); } catch {}
}

const ACTIVE_ABILITY_IDS = new Set(['lightning_strike', 'shadow_teleport', 'frost_tornado']);

export function getLearnedSkillIds() { return _learnedSkillIds; }

export function learnSkill(lootItem) {
  if (_learnedSkillIds.has(lootItem.id)) return;
  _learnedSkillIds = new Set([..._learnedSkillIds, lootItem.id]);
  persistLearned();
  _learnListeners.forEach((fn) => fn(_learnedSkillIds));

  if (ACTIVE_ABILITY_IDS.has(lootItem.id)) {
    import('./abilityStore').then(({ getAbilityState, equipAbility }) => {
      const equipped = getAbilityState().equipped || [];
      const emptyIdx = equipped.findIndex((value) => !value);
      if (emptyIdx !== -1 && !equipped.includes(lootItem.id)) equipAbility(emptyIdx, lootItem.id);
    }).catch(() => {});
  }

  // Learning a scroll consumes the physical drop.
  if (lootItem.dropId) removeLootFromInventory(lootItem.dropId);
  else {
    const skills = _lootInventory.skill || [];
    const match = skills.find((item) => item.id === lootItem.id && item.collectedAt === lootItem.collectedAt);
    if (match?.dropId) removeLootFromInventory(match.dropId);
  }
}

export function subscribeLearnedSkills(fn) {
  _learnListeners.add(fn);
  return () => _learnListeners.delete(fn);
}
