import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';

export const storeError = error => error?.response?.data?.error || error?.data?.error || error?.message || 'Please try again.';
export default function useGameClaim(gameId) {
  const { user } = useAuth();
  const client = useQueryClient();
  const key = ['game-claim', user?.id, gameId];
  const status = useQuery({
    queryKey: key, enabled: Boolean(user?.id && gameId), retry: false, staleTime: 15000,
    queryFn: async () => {
      const response = await base44.functions.invoke('claimFreeGame', { action: 'status', game_id: gameId });
      const data = response?.data || response;
      if (!data?.success) throw new Error(data?.error || 'Claim status is unavailable');
      return data;
    },
  });
  const claim = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Please sign in to claim this game.');
      const response = await base44.functions.invoke('claimFreeGame', { game_id: gameId });
      const data = response?.data || response;
      if (!data?.success) throw new Error(data?.error || 'The game could not be claimed.');
      return data;
    },
    onSuccess: data => {
      client.setQueryData(key, data);
      void client.invalidateQueries({ queryKey: ['owned-games', user?.id] });
      void client.invalidateQueries({ queryKey: ['card-collection'] });
    },
  });
  return { data: status.data, statusError: status.error, statusLoading: status.isLoading,
    refresh: status.refetch, claim: claim.mutateAsync, busy: claim.isPending, error: claim.error };
}
