// ─── Slot Validation ───────────────────────────────────────────────────
// Player can place ATTACK and BUFF skills in any active slot they choose.
// The ONE hard rule: PASSIVE skills NEVER go into active slots — they have
// no cast and would do nothing if "activated".

import { SKILL_TYPE, SLOT_KIND } from './skillTypes';
import { getSkillById } from './skillRegistry';

/**
 * Returns { ok: true } if the skill is allowed in the given slot kind,
 * or { ok: false, reason: string } describing why not.
 */
export function canEquipToSlot(skillIdOrObj, slotKind) {
  const id = typeof skillIdOrObj === 'string' ? skillIdOrObj : skillIdOrObj?.skill_id;
  const skill = getSkillById(id);
  if (!skill) return { ok: false, reason: 'unknown_skill' };

  if (slotKind === SLOT_KIND.ACTIVE) {
    // Active slots accept ACTIVE_ATTACK and ACTIVE_BUFF freely.
    if (skill.skill_type === SKILL_TYPE.PASSIVE) {
      return { ok: false, reason: 'passives_cannot_be_in_active_slots' };
    }
    return { ok: true };
  }

  if (slotKind === SLOT_KIND.PASSIVE) {
    // Passive panel accepts PASSIVE skills only.
    if (skill.skill_type !== SKILL_TYPE.PASSIVE) {
      return { ok: false, reason: 'only_passives_in_passive_panel' };
    }
    return { ok: true };
  }

  return { ok: false, reason: 'unknown_slot_kind' };
}