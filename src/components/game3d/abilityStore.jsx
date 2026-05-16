// ─────────────────────────────────────────────
// Ability Store — equipped skills + active target
// Equipped slots are persisted to localStorage so they survive game exits.
// ─────────────────────────────────────────────

const LS_EQUIPPED_KEY = 'game_equipped_abilities_v2';

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
  },
];

// 8 equip slots — start empty; skills must be learned and equipped by the player.
// Slot can hold either an ABILITY_DEFINITIONS id (string, legacy) OR a full
// skill object { id, name, icon, color, cooldown } from the Skills Book.
const SLOT_COUNT = 8;
const DEFAULT_EQUIPPED = Array(SLOT_COUNT).fill(null);

function loadEquipped() {
  try {
    const raw = localStorage.getItem(LS_EQUIPPED_KEY);
    if (!raw) return [...DEFAULT_EQUIPPED];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...DEFAULT_EQUIPPED];
    // Pad/truncate to 8 slots so we can migrate old saves (used to be 4)
    const out = [...DEFAULT_EQUIPPED];
    for (let i = 0; i < Math.min(parsed.length, SLOT_COUNT); i++) {
      const v = parsed[i];
      if (typeof v === 'string' || (v && typeof v === 'object' && v.id)) out[i] = v;
    }
    return out;
  } catch {
    return [...DEFAULT_EQUIPPED];
  }
}

function saveEquipped(equipped) {
  try { localStorage.setItem(LS_EQUIPPED_KEY, JSON.stringify(equipped)); } catch {}
}

let state = {
  equipped: loadEquipped(),     // (string | { id, name, icon, color, cooldown } | null) × 8 — persisted
  cooldowns: Array(SLOT_COUNT).fill(0),
  target: null,                  // { id, name, hp, maxHp, level, x, z, kind: 'enemy'|'player' }
};

const subscribers = new Set();
const notify = () => subscribers.forEach((fn) => fn({ ...state }));

export function getAbilityState() { return state; }

export function subscribeAbilities(fn) {
  subscribers.add(fn);
  fn({ ...state });
  return () => subscribers.delete(fn);
}

export function equipAbility(slotIndex, abilityId) {
  const next = [...state.equipped];
  next[slotIndex] = abilityId;
  state = { ...state, equipped: next };
  saveEquipped(next);
  notify();
}

export function unequipAbility(slotIndex) {
  const next = [...state.equipped];
  next[slotIndex] = null;
  state = { ...state, equipped: next };
  saveEquipped(next);
  notify();
}

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