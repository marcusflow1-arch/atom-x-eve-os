import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import useLunaStore from '@/components/luna/useLunaStore';
import { SKILL_SLOT_COUNT } from '@/components/luna/skillSlots';
import { useCompanionIdentity } from '@/components/onboarding/CompanionIdentityContext';
import { getActiveCharacter, subscribeCharacters } from '@/components/game3d/characterStore';

const unwrap = (response) => response?.data ?? response ?? {};
const normalize = (value) => String(value || '').trim().toLowerCase();
const errorMessage = (error, fallback = 'Skill Book request failed.') => {
  const body = error?.response?.data?.data ?? error?.response?.data ?? error?.body ?? null;
  return body?.error || body?.message || error?.message || fallback;
};
const invokeSkillBook = async (action, data = {}) => {
  try {
    const response = await base44.functions.invoke('skillBookLoadout', { action, data });
    const body = unwrap(response);
    if (body?.error) throw new Error(body.error);
    return body;
  } catch (error) {
    throw new Error(errorMessage(error));
  }
};
const avatarGender = (avatar) => {
  const variant = normalize(avatar?.female_model_variant);
  const model = normalize(avatar?.model_url || avatar?.base_body_model_url);
  if (variant.includes('artemis') || model.includes('artemis')) return 'female';
  if (model.includes('getsuga')) return 'male';
  const gender = normalize(avatar?.gender);
  return gender === 'female' || gender === 'male' ? gender : '';
};
const ICHIGO_SKILL_NAME = 'Ichigo Kurosaki - Getsuga Tenshō';
const DEMO_GAME_TITLE = 'Atom X Eve';
const DEMO_GAME_GENRE = 'Action RPG';
const DEMO_ANIMATION_EFFECTS = ['getsuga_tensho', 'artemis_call_of_the_husky', 'artemis_rain_of_arrows', 'artemis_lunar_beam', 'chidori'];
const bootstrappedThisSession = new Set();

const hasIchigoSkill = (skills = []) => skills.some((skill) => {
  const effectId = String(skill?.animation_effect?.id || skill?.card?.animation_effect?.id || '').trim();
  return normalize(skill?.title || skill?.card_name) === normalize(ICHIGO_SKILL_NAME)
    || effectId === 'getsuga_tensho';
});

const restoredSkillFromCard = (card, avatarGender = '') => {
  const maleCompatible = normalize(avatarGender) === 'male';
  return {
  id: card.id,
  user_card_id: card.id,
  title: card.card_name || ICHIGO_SKILL_NAME,
  description: card.description || 'Ichigo Kurosaki\'s Getsuga Tenshō ability.',
  rarity: card.card_rarity || card.rarity || 'Unique',
  image: card.card_image || card.image || '',
  game_name: card.game_name || DEMO_GAME_TITLE,
  game_id: card.game_id || '',
  genre: card.genre || DEMO_GAME_GENRE,
  unlock_condition: card.unlock_condition || 'Owned',
  owned: true,
  can_equip: maleCompatible,
  equip_error: maleCompatible ? null : 'This ability is bound to the male combat rig. Switch to your male avatar to equip and use it.',
  required_avatar_gender: 'male',
  animation_effect: card.animation_effect || null,
  card: {
    ...card,
    id: card.id,
    user_card_id: card.id,
    card_name: card.card_name || ICHIGO_SKILL_NAME,
    card_type: card.card_type || 'Ability',
    card_rarity: card.card_rarity || card.rarity || 'Unique',
    card_image: card.card_image || card.image || '',
    game_name: card.game_name || DEMO_GAME_TITLE,
  },
  };
};

async function restoreIchigoIntoState(body, userId) {
  if (!body || hasIchigoSkill(body.skills || [])) return body;

  // skillBookLoadout.getState normally creates/repairs this card server-side.
  // If the response ever omits it, recover the owned UserCard directly so the
  // Skill Book cannot silently lose the working Getsuga ability again.
  const rows = await base44.entities.UserCard.filter({
    user_id: userId,
    card_name: ICHIGO_SKILL_NAME,
  }, '-created_date', 5).catch(() => []);

  const card = rows?.[0];
  if (!card) return body;

  const restoredSkill = restoredSkillFromCard(card, body.avatar_gender);
  const skills = [...(body.skills || []), restoredSkill];
  const games = [...(body.games || [])];
  const groupTitle = restoredSkill.game_name || DEMO_GAME_TITLE;
  const groupIndex = games.findIndex((game) => normalize(game.title) === normalize(groupTitle));

  if (groupIndex >= 0) {
    games[groupIndex] = {
      ...games[groupIndex],
      total_skills: Number(games[groupIndex].total_skills || 0) + 1,
      owned_skills: Number(games[groupIndex].owned_skills || 0) + 1,
    };
  } else {
    games.push({
      key: normalize(groupTitle),
      id: restoredSkill.game_id || '',
      title: groupTitle,
      genre: restoredSkill.genre || DEMO_GAME_GENRE,
      total_skills: 1,
      owned_skills: 1,
    });
  }

  return { ...body, skills, games };
}

export function useSkillBookLoadout() {
  const { user } = useAuth();
  const companion = useCompanionIdentity();
  const [activeCharacter, setActiveCharacter] = useState(() => getActiveCharacter());
  useEffect(() => subscribeCharacters(() => setActiveCharacter(getActiveCharacter())), []);
  const companionDetectedGender = avatarGender(companion);
  const selectedAvatar = companionDetectedGender
    ? companion
    : activeCharacter && !activeCharacter.isDevTest
      ? activeCharacter
      : companion;
  const activeAvatarGender = avatarGender(selectedAvatar);
  const queryClient = useQueryClient();
  const assignToHotbar = useLunaStore((state) => state.assignToHotbar);
  const clearHotbarSlot = useLunaStore((state) => state.clearHotbarSlot);
  const setActiveSkillRow = useLunaStore((state) => state.setActiveSkillRow);

  const queryKey = ['luna-skill-book', user?.id, activeAvatarGender || 'persisted-avatar'];

  const stateQuery = useQuery({
    queryKey,
    queryFn: async () => {
      let body = await invokeSkillBook('getState', { avatar_gender: activeAvatarGender });
      const effects = new Set((body.skills || []).map((skill) => String(skill?.card?.animation_effect?.id || skill?.animation_effect?.id || '')));
      // Every demo animation card is filed under "Atom X Eve" for both bodies
      // (gender-locked cards show there too, flagged as not equippable).
      // bootstrap grants whichever are missing; its tombstones stop a card the
      // player consumed from being re-minted.
      const bootstrapKey = `${user.id}:${activeAvatarGender || 'persisted-avatar'}`;
      if (DEMO_ANIMATION_EFFECTS.some((id) => !effects.has(id)) && !bootstrappedThisSession.has(bootstrapKey)) {
        // Once per session: a card the player traded away stays missing, and
        // re-running the grants on every refetch only adds backend load.
        bootstrappedThisSession.add(bootstrapKey);
        try {
          body = await invokeSkillBook('bootstrap', { avatar_gender: activeAvatarGender });
        } catch (error) {
          bootstrappedThisSession.delete(bootstrapKey);
          console.warn('[SkillBook] demo card bootstrap failed; showing current cards', error);
        }
      }
      return restoreIchigoIntoState(body, user.id);
    },
    enabled: Boolean(user?.id),
    staleTime: 15000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!user?.id) return;
    const refreshEligibility = (event) => {
      const avatarUserId = event.detail?.avatar?.user_id;
      if (avatarUserId && String(avatarUserId) !== String(user.id)) return;
      void queryClient.invalidateQueries({ queryKey: ['luna-skill-book', user.id] }, { cancelRefetch: false });
    };
    window.addEventListener('cardProgressionChanged', refreshEligibility);
    window.addEventListener('syncPlayerStats', refreshEligibility);
    window.addEventListener('lunaEquipmentChanged', refreshEligibility);
    window.addEventListener('avatarAppearanceSaved', refreshEligibility);
    window.addEventListener('axeCharacterActivated', refreshEligibility);
    return () => {
      window.removeEventListener('cardProgressionChanged', refreshEligibility);
      window.removeEventListener('syncPlayerStats', refreshEligibility);
      window.removeEventListener('lunaEquipmentChanged', refreshEligibility);
      window.removeEventListener('avatarAppearanceSaved', refreshEligibility);
      window.removeEventListener('axeCharacterActivated', refreshEligibility);
    };
  }, [queryClient, user?.id]);

  useEffect(() => {
    const slots = stateQuery.data?.loadout?.slots;
    const rowIndex = Number(stateQuery.data?.loadout?.skill_set_order || 0);
    setActiveSkillRow(Math.max(0, Math.min(2, rowIndex)));
    if (!Array.isArray(slots)) return;

    for (let index = 0; index < SKILL_SLOT_COUNT; index += 1) {
      const card = slots.find((slot) => Number(slot.index) === index)?.card || null;
      if (card) assignToHotbar(index, card);
      else clearHotbarSlot(index);
    }
    window.dispatchEvent(new CustomEvent('lunaSkillBookState', {
      detail: { state: stateQuery.data },
    }));
  }, [stateQuery.data, assignToHotbar, clearHotbarSlot, setActiveSkillRow]);

  const mutation = useMutation({
    mutationFn: async ({ action, data }) => {
      const body = await invokeSkillBook(action, { ...(data || {}), avatar_gender: activeAvatarGender });
      return restoreIchigoIntoState(body, user.id);
    },
    onSuccess: (next) => {
      queryClient.setQueryData(queryKey, next);
      window.dispatchEvent(new CustomEvent('lunaSkillBookState', {
        detail: { state: next },
      }));
    },
  });

  return {
    state: stateQuery.data || null,
    games: stateQuery.data?.games || [],
    skills: stateQuery.data?.skills || [],
    slots: stateQuery.data?.loadout?.slots || [],
    skillSets: stateQuery.data?.skill_sets || stateQuery.data?.jawans || [],
    activeSkillSetId: stateQuery.data?.active_skill_set_id || '',
    jawans: stateQuery.data?.jawans || [],
    activeJawanId: stateQuery.data?.active_jawan_id || '',
    isLoading: stateQuery.isLoading,
    isFetching: stateQuery.isFetching,
    error: stateQuery.error,
    isSaving: mutation.isPending,
    equip: (slot, userCardId) => mutation.mutateAsync({
      action: 'equip',
      data: { slot, user_card_id: userCardId },
    }),
    unequip: (slot) => mutation.mutateAsync({
      action: 'unequip',
      data: { slot },
    }),
    clear: () => mutation.mutateAsync({ action: 'clear', data: {} }),
    selectSkillSet: (skillSetId) => mutation.mutateAsync({
      action: 'selectSkillSet',
      data: { skill_set_id: skillSetId },
    }),
    selectJawan: (jawanId) => mutation.mutateAsync({
      action: 'selectJawan',
      data: { jawan_id: jawanId },
    }),
    refetch: stateQuery.refetch,
  };
}

export default useSkillBookLoadout;
