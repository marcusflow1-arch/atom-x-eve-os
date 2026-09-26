import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function useOwnedGames() {
  const query = useQuery({
    queryKey: ['owned-games'],
    queryFn: async () => {
      const response = await base44.functions.invoke('ownedGames', { action: 'list' });
      return response?.data || response || { games: [], game_ids: [], dlc_ids: [] };
    },
    staleTime: 15000,
  });
  return {
    games: query.data?.games || [],
    gameIds: query.data?.game_ids || [],
    dlcIds: query.data?.dlc_ids || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
