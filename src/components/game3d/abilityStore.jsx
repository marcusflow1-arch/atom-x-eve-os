// ─────────────────────────────────────────────
// Ability Store — equipped skills + active target
// ─────────────────────────────────────────────

export const ABILITY_DEFINITIONS = [
  {
    id: 'lightning_strike',
    name: 'Lightning Strike',
    description: 'Calls a bolt of lightning from the sky, dealing heavy electric damage to a targeted enemy.',
    icon: '⚡',
    color: '#ffe066',
    cooldown: 4.0,
    damage: 45,
    type: 'targeted',
    element: 'lightning',
  },
  {
    id: 'fireball',
    name: 'Fireball',
    description: 'Hurls a blazing fireball that explodes on impact.',
    icon: '🔥',
    color: '#ff6b35',
    cooldown: 3.0,
    damage: 30,
    type: 'targeted',
    element: 'fire',
  },
  {
    id: 'frost_nova',
    name: 'Frost Nova',
    description: 'Erupts in a burst of ice, slowing nearby enemies.',
    icon: '❄️',
    color: '#7dd3fc',
    cooldown: 6.0,
    damage: 20,
    type: 'aoe',
    element: 'ice',
  },
  {
    id: 'shadow_dash',
    name: 'Shadow Dash',
    description: 'Teleport forward through shadows, leaving enemies disoriented.',
    icon: '🌑',
    color: '#a855f7',
    cooldown: 5.0,
    damage: 0,
    type: 'self',
    element: 'shadow',
  },
];

// 4 equip slots — indices 0-3 map to keys Q, E, R, F
const DEFAULT_EQUIPPED = ['lightning_strike', null, null, null];

let state = {
  equipped: [...DEFAULT_EQUIPPED],  // ability id or null per slot
  cooldowns: [0, 0, 0, 0],          // seconds remaining per slot
  target: null,                      // { id, name, hp, maxHp, level, x, z }
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
  notify();
}

export function unequipAbility(slotIndex) {
  const next = [...state.equipped];
  next[slotIndex] = null;
  state = { ...state, equipped: next };
  notify();
}

export function setTarget(target) {
  state = { ...state, target };
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
  const ability = ABILITY_DEFINITIONS.find((a) => a.id === state.equipped[slotIndex]);
  if (!ability) return;
  const next = [...state.cooldowns];
  next[slotIndex] = ability.cooldown;
  state = { ...state, cooldowns: next };
  notify();
}