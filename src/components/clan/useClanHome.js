import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function useClanHome(clanId) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['clan-home', clanId],
    enabled: Boolean(clanId),
    queryFn: async () => {
      const result = await base44.functions.invoke('clanOperations', { action: 'home_state', data: { clanId } });
      const payload = result?.data || result;
      if (!payload?.success) throw new Error(payload?.error || 'Clan information could not load');
      return payload;
    },
    staleTime: 15000, refetchInterval: 30000, refetchIntervalInBackground: false, retry: 1,
  });
  useEffect(() => {
    if (!clanId) return;
    let timer;
    const cleanups = [];
    const refresh = (event) => {
      if (event.type !== 'delete' && ![event.data?.clan_id, event.data?.divisionId, event.data?.id].includes(clanId)) return;
      clearTimeout(timer);
      timer = setTimeout(() => client.invalidateQueries({ queryKey: ['clan-home', clanId] }), 500);
    };
    for (const name of ['ClanMessage', 'ClanUpgrade', 'ClanHall', 'ClanMember', 'Division']) {
      try { cleanups.push(base44.entities[name].subscribe(refresh)); } catch { /* Polling remains available. */ }
    }
    return () => { clearTimeout(timer); cleanups.forEach((cleanup) => cleanup?.()); };
  }, [clanId, client]);
  return query;
}
