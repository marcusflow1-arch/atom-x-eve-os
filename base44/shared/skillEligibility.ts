// Shared server rules for the current owned-card and frozen battle-skill shapes.
type Skill = Record<string, any> | null | undefined;

export function requiredAvatarGender(skill: Skill): 'female' | 'male' | null {
  const declared = String(skill?.required_avatar_gender || skill?.animation_effect?.required_avatar_gender || '').trim().toLowerCase();
  if (declared === 'female' || declared === 'male') return declared;
  const effectIds = [skill?.animation_effect?.id, skill?.effect_id]
    .map((id) => String(id || '').trim().toLowerCase());
  if (effectIds.some((id) => id.startsWith('artemis_'))) return 'female';
  if (effectIds.includes('getsuga_tensho')) return 'male';
  return null;
}

export function avatarSkillError(skill: Skill, avatarGender: unknown): string | null {
  const required = requiredAvatarGender(skill);
  const current = String(avatarGender || '').trim().toLowerCase();
  if (!required || current === required) return null;
  if (required === 'female') {
    return 'This ability is bound to the female Artemis rig. Switch to your female avatar to equip and use it.';
  }
  return 'This ability is bound to the male combat rig. Switch to your male avatar to equip and use it.';
}

export function skillEquipStatus(card: Skill, avatarGender: unknown) {
  const equipError = !card
    ? 'Unlock this skill card before equipping it.'
    : String(card.card_type || '').trim().toLowerCase() !== 'ability'
      ? 'Only Ability cards can be equipped in Skill Book slots.'
      : card.trade_status === 'locked_in_trade'
        ? 'That skill card is locked in a trade.'
        : avatarSkillError(card, avatarGender);
  return {
    can_equip: !equipError,
    equip_error: equipError,
    required_avatar_gender: requiredAvatarGender(card),
  };
}
