// ─── Companion Skill Registry ──────────────────────────────────────────
// Mirrors the player skillRegistry pattern but for the companion. Each
// skill maps cleanly onto an equippable slot on the companion's 4-button
// bar (Z / X / V / B). Categorized so the Skills Book companion tab can
// partition them visually the same way the player tome does.
//
// Categories:
//   - combat:   damage-dealing strikes
//   - support:  healing / restorative skills
//   - mobility: movement & repositioning
//   - fusion:   Deity Fusion Mode (transformation ult)
//
// To add a new companion skill, just push to COMPANION_SKILLS below.

export const COMPANION_SKILL_CATEGORY = Object.freeze({
  COMBAT:   'combat',
  SUPPORT:  'support',
  MOBILITY: 'mobility',
  FUSION:   'fusion',
});

const COMPANION_SKILLS = [
  {
    skill_id:    'companion_bite',
    skill_name:  'Bite',
    category:    COMPANION_SKILL_CATEGORY.COMBAT,
    icon:        '🦷',
    color:       '#fbbf24',
    description: 'Companion lunges and bites the target with snapping fangs.',
    cooldown:    2.5,
    damage:      22,
    requiresTarget: true,
    legacy_id:   'bite', // back-compat for companionAbilityStore
  },
  {
    skill_id:    'companion_life_drain',
    skill_name:  'Life Drain',
    category:    COMPANION_SKILL_CATEGORY.COMBAT,
    icon:        '🩸',
    color:       '#dc2626',
    description: "Drains the target's life force — restores your HP, MP, and the companion's HP.",
    cooldown:    7.0,
    damage:      30,
    heal:        18,
    manaHeal:    12,
    requiresTarget: true,
    legacy_id:   'life_drain',
  },
  {
    skill_id:    'companion_teleport_dash',
    skill_name:  'Teleport Dash',
    category:    COMPANION_SKILL_CATEGORY.MOBILITY,
    icon:        '💨',
    color:       '#22d3ee',
    description: 'Companion blinks through the target, dealing damage as it passes through.',
    cooldown:    5.0,
    damage:      35,
    requiresTarget: true,
    legacy_id:   'teleport_dash',
  },
  {
    skill_id:    'companion_heal',
    skill_name:  'Heal',
    category:    COMPANION_SKILL_CATEGORY.SUPPORT,
    icon:        '✨',
    color:       '#34d399',
    description: 'Channel restoring light — heals you instantly with no target needed.',
    cooldown:    8.0,
    heal:        40,
    requiresTarget: false,
    legacy_id:   'heal',
  },

  // ── Deity Fusion (ultimate transformation) ──────────────────────────
  // Phase 1: registered & equippable. Activation logic + aura/levitation
  // visuals will be wired in Phase 2.
  {
    skill_id:    'companion_deity_fusion',
    skill_name:  'Deity Fusion',
    category:    COMPANION_SKILL_CATEGORY.FUSION,
    icon:        '👼',
    color:       '#ffd86b',
    description: 'Merge with your companion into a divine hybrid form — gain massive stat bonuses, aura, and levitation. Drains over time.',
    cooldown:    90.0,
    duration:    20.0,
    requiresTarget: false,
    fusion:      true, // flagged so the runtime can later look it up
  },
];

// Validate uniqueness on load.
const _byId = new Map();
for (const s of COMPANION_SKILLS) {
  if (_byId.has(s.skill_id)) {
    throw new Error(`[companionSkillRegistry] duplicate skill_id: ${s.skill_id}`);
  }
  _byId.set(s.skill_id, s);
}

export function getAllCompanionSkills() { return COMPANION_SKILLS; }
export function getCompanionSkillById(id) { return _byId.get(id) || null; }
export function getCompanionSkillsByCategory(cat) {
  return COMPANION_SKILLS.filter((s) => s.category === cat);
}

// Legacy → new id bridge: lets the runtime `companionAbilityStore`
// (Bite/Drain/Dash/Heal) continue to work while the UI uses new ids.
export function getCompanionSkillByLegacyId(legacyId) {
  return COMPANION_SKILLS.find((s) => s.legacy_id === legacyId) || null;
}

export default COMPANION_SKILLS;