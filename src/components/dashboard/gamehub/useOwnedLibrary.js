import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { playedHours } from '@/components/dashboard/gamehub/ownedLibraryData';

export default function useOwnedLibrary() {
  const { user, loading } = useAuth();
  const ids = [...new Set(user?.purchased_items || [])].sort();
  const query = useQuery({
    queryKey: ['owned-library-grid', user?.id, ids.join(',')], enabled: !!user,
    queryFn: async () => {
      const batches = [];
      for (let i = 0; i < ids.length; i += 100) batches.push(base44.entities.Game.filter({ id: { $in: ids.slice(i, i + 100) } }, 'title', 100));
      return (await Promise.all(batches)).flat();
    }, staleTime: 60000,
  });
  const games = (query.data || []).map(game => {
    const recent = (user?.recent_games || []).find(item => item.id === game.id || item.title === game.title);
    return { ...game, thumb: game.cover_image, image: game.banner_image || game.cover_image, playedHours: playedHours(recent?.playtime_hours ?? recent?.playtime ?? game.playtime), lastPlayed: recent?.updated_at || null };
  });
  return { games, loading: loading || (!!user && query.isLoading), error: query.isError, retry: query.refetch };
}