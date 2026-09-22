import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import useLunaStore from '@/components/luna/useLunaStore';

const unwrap = (response) => response?.data ?? response ?? {};

export function useSkillBookLoadout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const assignToHotbar = useLunaStore((state) => state.assignToHotbar);
  const clearHotbarSlot = useLunaStore((state) => state.clearHotbarSlot);

  const queryKey = ['luna-skill-book', user?.id];

  const stateQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await base44.functions.invoke('skillBookLoadout', {
        action: 'getState',
        data: {},
      });
      const body = unwrap(response);
      if (body?.error) throw new Error(body.error);
      return body;
    },
    enabled: Boolean(user?.id),
    staleTime: 15000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const slots = stateQuery.data?.loadout?.slots;
    if (!Array.isArray(slots)) return;

    for (let index = 0; index < 4; index += 1) {
      const card = slots.find((slot) => Number(slot.index) === index)?.card || null;
      if (card) assignToHotbar(index, card);
      else clearHotbarSlot(index);
    }

    window.dispatchEvent(new CustomEvent('lunaSkillBookState', {
      detail: { state: stateQuery.data },
    }));
  }, [stateQuery.data, assignToHotbar, clearHotbarSlot]);

  const mutation = useMutation({
    mutationFn: async ({ action, data }) => {
      const response = await base44.functions.invoke('skillBookLoadout', { action, data });
      const body = unwrap(response);
      if (body?.error) throw new Error(body.error);
      return body;
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
