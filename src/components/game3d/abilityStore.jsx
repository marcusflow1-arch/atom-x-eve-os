// ─────────────────────────────────────────────
// Ability Store — equipped skills + active target
// Equipped slots are persisted to localStorage so they survive game exits.
// ─────────────────────────────────────────────
import { SKILLS_DATABASE } from './equipment/skillData';
import { getActiveWeaponPath, subscribeWeaponBuffs } from './weaponClassBuffStore';

// v3 — per-weapon-class slot loadouts. Each path (damage/defense/ranged) has
// its own 8 slots so switching weapon class swaps in a fresh hotbar without
// the player having to re-equip skills every time.
const LS_EQUIPPED_KEY = 'game_equipped_abilities_v3';
const LS_EQUIPPED_LEGACY_KEY = 'game_equipped_abilities_v2'; // migration source

export const ABILITY_DEFINITIONS = [
  {
    id: 'lightning_strike',
    name: 'Lightning Strike',
    description: 'Calls a bolt of lightning from the sky. Damages enemy AI — paralyzes players with light damage.',
    icon: '⚡',
    color: '#ffe066',
    cooldown: 4.0,
    damage: 45,           // damage vs enemies
    pvpDamage: 12,        // light damage vs players
    pvpEffect: 'paralyze',
    pvpDuration: 2.0,
    type: 'targeted',
    element: 'lightning',
    dualMode: true,
    requiresLearn: true,
    path: 'ranged',
  },
  {
    id: 'shadow_teleport',
    name: 'Shadow Teleport',
    description: 'Fade into the shadows and reappear behind your target, ready to strike.',
    icon: '🌀',
    color: '#a855f7',
    cooldown: 7.0,
    damage: 0,
    type: 'targeted',
    element: 'shadow',
    requiresLearn: true,
    path: 'damage',
  },
  {
    id: 'frost_tornado',
    name: 'Frost Tornado',
    description: 'A towering tornado of ice on enemies. On players, it freezes them in place instead.',
    icon: '🌪️',
    color: '#7dd3fc',
    cooldown: 8.0,
    damage: 35,
    radius: 4.5,
    pvpEffect: 'freeze',
    pvpDuration: 2.5,
    pvpDamage: 5,
    type: 'aoe',
    element: 'ice',
    dualMode: true,
    requiresLearn: true,
    path: 'ranged',
  },
];

// 8 equip slots — start empty; skills must be learned and equipped by the player.
// Slot can hold either an ABILITY_DEFINITIONS id (string, legacy) OR a full
// skill object { id, name, icon, color, cooldown } from the Skills Book.
const SLOT_COUNT = 8;
const DEFAULT_EQUIPPED = Array(SLOT_COUNT).fill(null);

// In the editor/preview environment, we pre-fill empty slots with a curated
// set of skills so devs can test combat without manually equipping every time.
// Live/published builds always start with empty slots.
function isEditorEnv() {
  try {
    const h = window.location.hostname;
    return h === 'localhost' || h.includes('base44.app') || h.includes('preview');
  } catch { return false; }
}

const RARITY_COLORS = {
  common: '#9ca3af', uncommon: '#22c55e', rare: '#60a5fa', epic: '#a78bfa',
  legendary: '#f59e0b', mythic: '#f43f5e', divine: '#e879f9',
};

function buildEditorDefaultSlots() {
  // Lazy import to avoid circular dep — synchronous require not available in Vite,
  // so we use dynamic import on first equip OR import statically at top.
  // Here we use a static import (added at top of file).
  const picks = [
    'aegis_shield', 'focus', 'haste', 'power_charge',
    'decisive_blow', 'gods_deflection', 'lightning_strike', 'frost_tornado',
  ];
  return picks.map((id) => {
    const sk = SKILLS_DATABASE.find((s) => s.id === id);
    if (sk) {
      return {
        id: sk.id,
        name: sk.name,
        icon: sk.icon,
        color: RARITY_COLORS[sk.rarity] || '#a78bfa',
        cooldown: sk.cooldown || 4.0,
        rarity: sk.rarity,
      };
    }
    // Fallback for ability ids like lightning_strike that live in ABILITY_DEFINITIONS
    return id;
  });
}

// Normalize an arbitrary parsed array into an 8-slot array of valid entries.
function normalizeSlotArray(parsed) {
  const out = [...DEFAULT_EQUIPPED];
  if (!Array.isArray(parsed)) return out;
  for (let i = 0; i < Math.min(parsed.length, SLOT_COUNT); i++) {
    const v = parsed[i];
    if (typeof v === 'string' || (v && typeof v === 'object' && v.id)) out[i] = v;
  }
  return out;
}

// Load per-path loadouts: { damage: [...8], defense: [...8], ranged: [...8] }.
// Migrates from the legacy v2 single-array save by copying it into all 3 paths.
function loadLoadouts() {
  const empty = () => [...DEFAULT_EQUIPPED];
  const editorDefaults = () => buildEditorDefaultSlots();
  const blank = () => ({ damage: empty(), defense: empty(), ranged: empty() });
  try {
    const raw = localStorage.getItem(LS_EQUIPPED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        damage:  normalizeSlotArray(parsed?.damage),
        defense: normalizeSlotArray(parsed?.defense),
        ranged:  normalizeSlotArray(parsed?.ranged),
      };
    }
    // Migrate from legacy v2 (single shared array)
    const legacy = localStorage.getItem(LS_EQUIPPED_LEGACY_KEY);
    if (legacy) {
      const arr = normalizeSlotArray(JSON.parse(legacy));
      return { damage: [...arr], defense: [...arr], ranged: [...arr] };
    }
    if (isEditorEnv()) {
      const ed = editorDefaults();
      return { damage: [...ed], defense: [...ed], ranged: [...ed] };
    }
    return blank();
  } catch {
    return isEditorEnv()
      ? { damage: editorDefaults(), defense: editorDefaults(), ranged: editorDefaults() }
      : blank();
  }
}

function saveLoadouts(loadouts) {
  try { localStorage.setItem(LS_EQUIPPED_KEY, JSON.stringify(loadouts)); } catch {}
}

const initialLoadouts = loadLoadouts();
const initialPath = getActiveWeaponPath() || 'damage';

let state = {
  loadouts: initialLoadouts,                  // per-path slot arrays
  activePath: initialPath,                    // current weapon class
  equipped: initialLoadouts[initialPath] || [...DEFAULT_EQUIPPED], // computed view for active path
  cooldowns: Array(SLOT_COUNT).fill(0),       // shared — resets on swap to avoid carry-over
  target: null,                                // { id, name, hp, maxHp, level, x, z, kind: 'enemy'|'player' }
};

// Re-sync `equipped` whenever the player swaps weapon class.
subscribeWeaponBuffs(({ activePath }) => {
  if (!activePath || activePath === state.activePath) return;
  state = {
    ...state,
    activePath,
    equipped: state.loadouts[activePath] || [...DEFAULT_EQUIPPED],
    cooldowns: Array(SLOT_COUNT).fill(0),
  };
  notify();
});

const subscribers = new Set();
const notify = () => subscribers.forEach((fn) => fn({ ...state }));

export function getAbilityState() { return state; }

export function subscribeAbilities(fn) {
  subscribers.add(fn);
  fn({ ...state });
  return () => subscribers.delete(fn);
}

export function equipAbility(slotIndex, abilityId) {
  const path = state.activePath;
  const next = [...(state.loadouts[path] || DEFAULT_EQUIPPED)];
  next[slotIndex] = abilityId;
  const loadouts = { ...state.loadouts, [path]: next };
  state = { ...state, loadouts, equipped: next };
  saveLoadouts(loadouts);
  notify();
}

export function unequipAbility(slotIndex) {
  const path = state.activePath;
  const next = [...(state.loadouts[path] || DEFAULT_EQUIPPED)];
  next[slotIndex] = null;
  const loadouts = { ...state.loadouts, [path]: next };
  state = { ...state, loadouts, equipped: next };
  saveLoadouts(loadouts);
  notify();
}

// Read-only access to all 3 loadouts (for UI that wants to show all classes).
export function getAllLoadouts() { return state.loadouts; }
export function getActiveLoadoutPath() { return state.activePath; }

export function setTarget(target) {
  // target.kind defaults to 'enemy' for backwards compatibility
  const t = target ? { kind: 'enemy', ...target } : null;
  state = { ...state, target: t };
  notify();
}

export function clearTarget() {
  state = { ...state, target: null };
  notify();
}

export function updateTargetHP(id, hp) {
  if (state.target?.id === id) {
    state = { ...state, target: { ...state.target, hp } };
    notify();
  }
}

// Tick cooldowns (call this every frame with delta seconds)
export function tickCooldowns(delta) {
  let changed = false;
  const next = state.cooldowns.map((cd) => {
    const v = Math.max(0, cd - delta);
    if (v !== cd) changed = true;
    return v;
  });
  if (changed) {
    state = { ...state, cooldowns: next };
    notify();
  }
}

// Start cooldown for a slot
export function startCooldown(slotIndex) {
  const entry = state.equipped[slotIndex];
  let cooldown = 0;
  if (typeof entry === 'string') {
    const ability = ABILITY_DEFINITIONS.find((a) => a.id === entry);
    cooldown = ability?.cooldown || 0;
  } else if (entry && typeof entry === 'object') {
    cooldown = entry.cooldown || 0;
  }
  if (!cooldown) return;
  const next = [...state.cooldowns];
  next[slotIndex] = cooldown;
  state = { ...state, cooldowns: next };
  notify();
}

// Resolve a slot entry → { id, name, icon, color, cooldown } for the HUD.
// Accepts either a string ability id (legacy) or a full skill object.
export function resolveSlotData(entry) {
  if (!entry) return null;
  if (typeof entry === 'string') {
    const ab = ABILITY_DEFINITIONS.find((a) => a.id === entry);
    return ab ? { id: ab.id, name: ab.name, icon: ab.icon, color: ab.color, cooldown: ab.cooldown, element: ab.element } : null;
  }
  return entry; // already a full object
}