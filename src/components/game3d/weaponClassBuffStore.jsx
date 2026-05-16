// ─── Weapon-Class Native Passive Buffs ─────────────────────────────────────
// Three native passives — one per weapon class — that are ALWAYS-ON and scale
// with their own level (1 → max). The player swaps weapon classes via the
// bottom-right weapon switcher; whichever class is active applies its buff.
//
//   DAMAGE  → Brutal Force   (max lvl 20): +damage, +lethal-blow instant-kill %
//   RANGED  → Swift Marksman (max lvl 25): +move, +hit, +damage, +crit
//   DEFENSE → Iron Stance    (max lvl 20): +defense, +damage, +dodge, +guard
//
// Values scale LINEARLY from 0% at level 0 to the listed max at the cap level.
// Level 1 = first tick of the curve.

const STORAGE_KEY = 'weapon_class_buffs_v1';

export const WEAPON_CLASS_BUFFS = {
  damage: {
    id: 'brutal_force',
    name: 'Brutal Force',
    path: 'damage',
    icon: '⚔️',
    color: '#ef4444',
    maxLevel: 20,
    description: 'Native passive of all damage-class weapons. Increases damage and grants a chance for Lethal Blow — an instant-kill on the target.',
    curves: {
      damageBonusPct:  { min: 0, max: 0.35 }, // 0% → 35% bonus damage
      lethalBlowPct:   { min: 0, max: 0.02 }, // 0% → 2% instant-kill chance
    },
  },
  ranged: {
    id: 'swift_marksman',
    name: 'Swift Marksman',
    path: 'ranged',
    icon: '🏹',
    color: '#10b981',
    maxLevel: 25,
    description: 'Native passive of all ranged-class weapons. Increases mobility, accuracy, damage and critical strike.',
    curves: {
      moveSpeedBonusPct: { min: 0, max: 0.25 }, // +25% movement
      damageBonusPct:    { min: 0, max: 0.10 }, // +10% damage
      hitChanceBonusPct: { min: 0, max: 0.15 }, // +15% hit chance
      critChanceBonusPct:{ min: 0, max: 0.05 }, // +5% crit chance
    },
  },
  defense: {
    id: 'iron_stance',
    name: 'Iron Stance',
    path: 'defense',
    icon: '🛡️',
    color: '#3b82f6',
    maxLevel: 20,
    description: 'Native passive of all defense-class weapons. Hardens your stance — bolstering defense, damage, evasion and guard.',
    curves: {
      defenseBonusPct: { min: 0, max: 0.40 }, // +40% defense
      damageBonusPct:  { min: 0, max: 0.20 }, // +20% damage
      dodgeChancePct:  { min: 0, max: 0.07 }, // +7% dodge
      guardChancePct:  { min: 0, max: 0.07 }, // +7% enemy-miss/guard
    },
  },
};

// ── State ───────────────────────────────────────────────────────────────
const loadLevels = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { damage: 1, ranged: 1, defense: 1 };
};

let levels = loadLevels();
let activePath = 'damage'; // current weapon class equipped
const listeners = new Set();

const save = () => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(levels)); } catch {}
};
const emit = () => listeners.forEach((fn) => fn({ levels, activePath }));

export function subscribeWeaponBuffs(fn) {
  listeners.add(fn);
  fn({ levels, activePath });
  return () => listeners.delete(fn);
}

export function getWeaponBuffLevels() { return levels; }
export function getActiveWeaponPath() { return activePath; }

export function setActiveWeaponPath(path) {
  if (!WEAPON_CLASS_BUFFS[path]) return;
  activePath = path;
  emit();
}

export function setWeaponBuffLevel(path, level) {
  const cfg = WEAPON_CLASS_BUFFS[path];
  if (!cfg) return;
  const clamped = Math.max(0, Math.min(cfg.maxLevel, Math.round(level)));
  levels = { ...levels, [path]: clamped };
  save();
  emit();
}

export function levelUpWeaponBuff(path) {
  const cfg = WEAPON_CLASS_BUFFS[path];
  if (!cfg) return;
  setWeaponBuffLevel(path, (levels[path] || 0) + 1);
}

// Linear interp between min and max at level/maxLevel.
function curveValue(curve, level, maxLevel) {
  if (maxLevel <= 0) return 0;
  const t = Math.max(0, Math.min(1, level / maxLevel));
  return curve.min + (curve.max - curve.min) * t;
}

// Resolve all curve values for a given class at its current level.
export function getBuffValuesFor(path) {
  const cfg = WEAPON_CLASS_BUFFS[path];
  if (!cfg) return {};
  const lvl = levels[path] || 0;
  const out = {};
  for (const key of Object.keys(cfg.curves)) {
    out[key] = curveValue(cfg.curves[key], lvl, cfg.maxLevel);
  }
  return out;
}

// Convenience: values of the CURRENTLY-ACTIVE weapon class only.
export function getActiveBuffValues() {
  return getBuffValuesFor(activePath);
}