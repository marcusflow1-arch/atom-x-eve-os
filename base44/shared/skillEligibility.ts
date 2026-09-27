// Shared server rules for the current owned-card and frozen battle-skill shapes.
type Skill = Record<string, any> | null | undefined;

export function requiredAvatarGender(skill: Skill): 'female' | null {
  const effectIds = [skill?.animation_effect?.id, skill?.effect_id];
  return effectIds.some((id) => String(id || '').trim().toLowerCase().startsWith('artemis_'))
    ? 'female'
    : null;
}

export function avatarSkillError(skill: Skill, avatarGender: unknown): string | null {
  return requiredAvatarGender(skill) === 'female' && String(avatarGender || '').trim().toLowerCase() !== 'female'
    ? 'Artemis abilities require a female avatar. Switch to your female avatar to equip and use this skill.'
    : null;
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
