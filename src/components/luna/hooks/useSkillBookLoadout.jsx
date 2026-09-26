import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import useLunaStore from '@/components/luna/useLunaStore';
import { SKILL_SLOT_COUNT } from '@/components/luna/skillSlots';

const unwrap = (response) => response?.data ?? response ?? {};
const normalize = (value) => String(value || '').trim().toLowerCase();
const ICHIGO_SKILL_NAME = 'Ichigo Kurosaki - Getsuga Tenshō';

const hasIchigoSkill = (skills = []) => skills.some((skill) => {
  const effectId = String(skill?.animation_effect?.id || skill?.card?.animation_effect?.id || '').trim();
  return normalize(skill?.title || skill?.card_name) === normalize(ICHIGO_SKILL_NAME)
    || effectId === 'getsuga_tensho';
});

const restoredSkillFromCard = (card) => ({
  id: card.id,
  user_card_id: card.id,
  title: card.card_name || ICHIGO_SKILL_NAME,
  description: card.description || 'Ichigo Kurosaki\'s Getsuga Tenshō ability.',
  rarity: card.card_rarity || card.rarity || 'Unique',
  image: card.card_image || card.image || '',
  game_name: card.game_name || 'Bleach',
  game_id: card.game_id || 'bleach',
  genre: card.genre || 'Action',
  unlock_condition: card.unlock_condition || 'Owned',
  owned: true,
  animation_effect: card.animation_effect || null,
  card: {
    ...card,
    id: card.id,
    user_card_id: card.id,
    card_name: card.card_name || ICHIGO_SKILL_NAME,
    card_type: card.card_type || 'Ability',
    card_rarity: card.card_rarity || card.rarity || 'Unique',
    card_image: card.card_image || card.image || '',
    game_name: card.game_name || 'Bleach',
  },
});

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

  const restoredSkill = restoredSkillFromCard(card);
  const skills = [...(body.skills || []), restoredSkill];
  const games = [...(body.games || [])];
  const bleachIndex = games.findIndex((game) => normalize(game.title) === 'bleach');

  if (bleachIndex >= 0) {
    games[bleachIndex] = {
      ...games[bleachIndex],
      total_skills: Math.max(Number(games[bleachIndex].total_skills || 0), 1),
      owned_skills: Math.max(Number(games[bleachIndex].owned_skills || 0), 1),
    };
  } else {
    games.push({
      key: 'bleach',
      id: 'bleach',
      title: 'Bleach',
      genre: restoredSkill.genre || 'Action',
      total_skills: 1,
      owned_skills: 1,
    });
  }

  return { ...body, skills, games };
}

export function useSkillBookLoadout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const assignToHotbar = useLunaStore((state) => state.assignToHotbar);
  const clearHotbarSlot = useLunaStore((state) => state.clearHotbarSlot);
  const setActiveSkillRow = useLunaStore((state) => state.setActiveSkillRow);

  const queryKey = ['luna-skill-book', user?.id];

  const stateQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await base44.functions.invoke('skillBookLoadout', {
        action: 'getState',
        data: {},
      });
      let body = unwrap(response);
      if (body?.error) throw new Error(body.error);
      const effects = new Set((body.skills || []).map((skill) => String(skill?.card?.animation_effect?.id || skill?.animation_effect?.id || '')));
      const required = ['getsuga_tensho', 'artemis_call_of_the_husky', 'artemis_rain_of_arrows', 'artemis_lunar_beam'];
      if (required.some((id) => !effects.has(id))) {
        const bootstrap = await base44.functions.invoke('skillBookLoadout', { action: 'bootstrap', data: {} });
        body = unwrap(bootstrap);
        if (body?.error) throw new Error(body.error);
      }
      return restoreIchigoIntoState(body, user.id);
    },
    enabled: Boolean(user?.id),
    staleTime: 15000,
    refetchOnWindowFocus: false,
  });

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
      const response = await base44.functions.invoke('skillBookLoadout', { action, data });
      const body = unwrap(response);
      if (body?.error) throw new Error(body.error);
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
