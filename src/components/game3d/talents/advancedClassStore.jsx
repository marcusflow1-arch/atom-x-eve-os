// ─── Advanced Class Store ────────────────────────────────────────────────────
// Manages selected advanced class per weapon type, combat state validation,
// and persistence. Fully subscribable — same pattern as weaponMasteryStore.

import { characterScopedStorage, subscribeCharacterChange } from '../characterStorage';
import { ADVANCED_CLASS_REGISTRY, getClassById, WEAPON_TYPES } from './advancedClassRegistry';
import { getActiveEquippedAXEWeapon } from '../axe/equipment/AXEEquipmentInventoryStore';
import { resolveAXEWeaponIdentity } from '../axe/weapons/AXEWeaponIdentity';
import { getWeaponLevel } from '../progression/weaponMasteryStore';

const storage = characterScopedStorage('advanced_class_v1');

export const ADVANCED_CLASS_REQUIRED_MASTERY_LEVEL = 10;

// ─── Combat state flags (set externally by combat systems) ────────────────────
let _inCombat        = false;
let _recentlyDamaged = false;
let _isCasting       = false;
let _isDead          = false;
let _isDueling       = false;
let _isTrading       = false;

export const setCombatFlag = (flag, value) => {
  switch (flag) {
    case 'in_combat':        _inCombat        = value; break;
    case 'recently_damaged': _recentlyDamaged = value; break;
    case 'casting':          _isCasting       = value; break;
    case 'dead':             _isDead          = value; break;
    case 'dueling':          _isDueling       = value; break;
    case 'trading':          _isTrading       = value; break;
  }
};

export const canSwitchAdvancedClass = () => {
  if (_inCombat)        return { allowed: false, reason: 'Cannot switch class while in combat.' };
  if (_recentlyDamaged) return { allowed: false, reason: 'Cannot switch class while recently damaged.' };
  if (_isCasting)       return { allowed: false, reason: 'Cannot switch class while casting.' };
  if (_isDead)          return { allowed: false, reason: 'Cannot switch class while dead.' };
  if (_isDueling)       return { allowed: false, reason: 'Cannot switch class during a duel.' };
  if (_isTrading)       return { allowed: false, reason: 'Cannot switch class while trading.' };
  return { allowed: true, reason: null };
};

// ─── State ───────────────────────────────────────────────────────────────────
const buildDefault = () => ({
  // selected class id per weapon type: { sword: 'berserker', ranged: null, guardian: null }
  selectedClasses: {
    [WEAPON_TYPES.SWORD]:    null,
    [WEAPON_TYPES.RANGED]:   null,
    [WEAPON_TYPES.GUARDIAN]: null,
  },
  // Per-class mastery XP (separate from weapon mastery)
  classXP: {},
  // Unlocked class IDs (starts with all unlocked for base advanced tier)
  unlockedClasses: ADVANCED_CLASS_REGISTRY
    .filter((c) => c.tier === 'advanced')
    .map((c) => c.class_id),
  // class loadout slots (future: per-class skill loadouts)
  loadouts: {},
});

const load = () => {
  try {
    const raw = storage.get();
    if (raw) {
      const parsed = JSON.parse(raw);
      const def = buildDefault();
      return {
        ...def,
        ...parsed,
        selectedClasses: { ...def.selectedClasses, ...(parsed.selectedClasses || {}) },
        unlockedClasses: parsed.unlockedClasses || def.unlockedClasses,
        classXP:         parsed.classXP || {},
        loadouts:        parsed.loadouts || {},
      };
    }
  } catch {}
  return buildDefault();
};

let state = load();
const listeners = new Set();

const save = () => { storage.set(JSON.stringify(state)); };
const emit = () => {
  const snap = getAdvancedClassState();
  listeners.forEach((fn) => fn(snap));
};

subscribeCharacterChange(() => { state = load(); emit(); });

// ─── Selectors ───────────────────────────────────────────────────────────────
export const getAdvancedClassState = () => ({
  selectedClasses: { ...state.selectedClasses },
  unlockedClasses: [...state.unlockedClasses],
  classXP:         { ...state.classXP },
  loadouts:        { ...state.loadouts },
});

export const getSelectedClass = (weaponType) => {
  const classId = state.selectedClasses[weaponType];
  if (!classId) return null;
  return getClassById(classId);
};

export const getActiveClassForCurrentWeapon = (activeWeaponType) => {
  if (!activeWeaponType) return null;
  return getSelectedClass(activeWeaponType);
};

export const isClassUnlocked = (classId) =>
  state.unlockedClasses.includes(classId);

export const getAdvancedClassEligibility = (classId) => {
  const classDef = getClassById(classId);
  if (!classDef) return { eligible: false, reason: 'Unknown class.' };
  if (!isClassUnlocked(classId)) return { eligible: false, reason: 'Class not unlocked.' };

  const equippedWeapon = getActiveEquippedAXEWeapon();
  if (!equippedWeapon) {
    return { eligible: false, reason: 'Equip a weapon before selecting an advanced class.' };
  }

  const identity = resolveAXEWeaponIdentity(equippedWeapon);
  if (identity.advancedWeaponType !== classDef.weapon_type) {
    return {
      eligible: false,
      reason: `Equip a compatible ${classDef.weapon_type} weapon first.`,
      identity,
    };
  }

  const masteryLevel = getWeaponLevel(identity.masteryWeaponId);
  if (masteryLevel < ADVANCED_CLASS_REQUIRED_MASTERY_LEVEL) {
    return {
      eligible: false,
      reason: `Reach Weapon Mastery ${ADVANCED_CLASS_REQUIRED_MASTERY_LEVEL} with the equipped weapon first.`,
      masteryLevel,
      requiredMasteryLevel: ADVANCED_CLASS_REQUIRED_MASTERY_LEVEL,
      identity,
    };
  }

  return {
    eligible: true,
    classDef,
    identity,
    masteryLevel,
    requiredMasteryLevel: ADVANCED_CLASS_REQUIRED_MASTERY_LEVEL,
  };
};

// ─── Mutations ───────────────────────────────────────────────────────────────
export const selectAdvancedClass = (classId) => {
  const check = canSwitchAdvancedClass();
  if (!check.allowed) {
    window.dispatchEvent(new CustomEvent('advancedClassSwitchBlocked', { detail: { reason: check.reason } }));
    return { success: false, reason: check.reason };
  }

  const eligibility = getAdvancedClassEligibility(classId);
  if (!eligibility.eligible) return { success: false, reason: eligibility.reason };
  const classDef = eligibility.classDef;

  state.selectedClasses[classDef.weapon_type] = classId;
  save();
  emit();

  // Broadcast for multiplayer sync
  window.dispatchEvent(new CustomEvent('advancedClassSelected', {
    detail: { classId, weaponType: classDef.weapon_type, classDef },
  }));

  return { success: true };
};

export const deselectAdvancedClass = (weaponType) => {
  const check = canSwitchAdvancedClass();
  if (!check.allowed) return { success: false, reason: check.reason };
  state.selectedClasses[weaponType] = null;
  save();
  emit();
  return { success: true };
};

export const unlockClass = (classId) => {
  if (!state.unlockedClasses.includes(classId)) {
    state.unlockedClasses.push(classId);
    save();
    emit();
  }
};

export const addClassXP = (classId, amount) => {
  state.classXP[classId] = (state.classXP[classId] || 0) + amount;
  save();
  emit();
};

// ─── Subscription ─────────────────────────────────────────────────────────────
export const subscribeAdvancedClass = (fn) => {
  listeners.add(fn);
  fn(getAdvancedClassState());
  return () => listeners.delete(fn);
};

// ─── Passive bonus resolver ───────────────────────────────────────────────────
// Returns merged passive bonuses for the currently selected class for a weapon type.
export const getActivePassiveBonuses = (weaponType) => {
  const cls = getSelectedClass(weaponType);
  if (!cls) return {};
  return { ...cls.passive_bonuses };
};

export const getActiveSkillModifiers = (weaponType) => {
  const cls = getSelectedClass(weaponType);
  if (!cls) return {};
  return { ...cls.skill_modifiers };
};