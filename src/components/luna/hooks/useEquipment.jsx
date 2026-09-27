import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import useLunaStore from '../useLunaStore';
import { itemFitsSlot } from '@/components/dashboard/equipmentSlotRules';

const unwrap = (response) => response?.data ?? response ?? {};

/**
 * Canonical Luna equipment hook.
 * The active equipment map is persisted in Loadout(loadout_type=equipment), so
 * Dashboard, AI Attributes and AI Battle all read the same gear state.
 */
export function useEquipment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [weaponModelUrl, setWeaponModelUrl] = useState(null);
  const { setWeapon, setEquippedWeapon } = useLunaStore();
  const queryKey = ['luna-equipment-loadout', user?.id];

  const query = useQuery({
    queryKey,
    enabled: Boolean(user?.id),
    staleTime: 15000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await base44.functions.invoke('equipmentLoadout', { action: 'getState', data: {} });
      const body = unwrap(response);
      if (body?.error) throw new Error(body.error);
      return body;
    },
  });

  const equippedItems = useMemo(() => query.data?.loadout?.equipped_items || {}, [query.data]);

  useEffect(() => {
    const primary = equippedItems['weapon-1'] || equippedItems['weapon-2'] || equippedItems['weapon-3'] || null;
    const abyss = /blade of (the )?abyss/i.test(primary?.name || '');
    setWeapon(abyss ? 'sword_of_the_abyss' : null);
    setEquippedWeapon(abyss ? 'sword_of_the_abyss' : null);
    if (primary?.model_url) setWeaponModelUrl(primary.model_url);
  }, [equippedItems, setWeapon, setEquippedWeapon]);

  useEffect(()=>{
    const refresh=()=>{void queryClient.invalidateQueries({queryKey:['luna-equipment-loadout',user?.id]});};
    window.addEventListener('cardProgressionChanged',refresh);
    return()=>window.removeEventListener('cardProgressionChanged',refresh);
  },[queryClient,user?.id]);

  const mutation = useMutation({
    mutationFn: async ({ action, data }) => {
      const response = await base44.functions.invoke('equipmentLoadout', { action, data });
      const body = unwrap(response);
      if (body?.error) throw new Error(body.error);
      return body;
    },
    onSuccess: (body) => {
      queryClient.setQueryData(queryKey, body);
      queryClient.invalidateQueries({ queryKey: ['battle-expeditions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['avatar-combat-stats', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['luna-skill-book', user?.id] });
      window.dispatchEvent(new CustomEvent('lunaEquipmentChanged', { detail: { loadout: body?.loadout || null } }));
    },
  });

  const equipItem = (slotId, item) => {
    if (!itemFitsSlot(item, slotId) || !item?.user_card_id) return false;
    mutation.mutate({ action: 'equip', data: { slot: slotId, user_card_id: item.user_card_id } });
    return true;
  };

  const unequipItem = (slotId) => {
    const previous = queryClient.getQueryData(queryKey);
    if (previous?.loadout) {
      const nextItems = { ...(previous.loadout.equipped_items || {}) };
      delete nextItems[slotId];
      queryClient.setQueryData(queryKey, { ...previous, loadout: { ...previous.loadout, equipped_items: nextItems } });
    }
    mutation.mutate({ action: 'unequip', data: { slot: slotId } });
  };

  return {
    equippedItems,
    weaponModelUrl,
    setWeaponModelUrl,
    equipItem,
    unequipItem,
    isLoading: query.isLoading,
    isSaving: mutation.isPending,
    refetch: query.refetch,
  };
}
