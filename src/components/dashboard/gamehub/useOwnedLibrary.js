import { useAuth } from '@/components/auth/AuthContext';
import useOwnedGames from '@/components/store/useOwnedGames';
import { playedHours } from '@/components/dashboard/gamehub/ownedLibraryData';

export default function useOwnedLibrary() {
  const { user, loading } = useAuth();
  const ownership = useOwnedGames();
  const games = (ownership.games || []).map(game => {
    const recent = (user?.recent_games || []).find(item => item.id === game.id || item.title === game.title);
    return { ...game, thumb: game.cover_image, image: game.banner_image || game.cover_image, playedHours: playedHours(recent?.playtime_hours ?? recent?.playtime ?? game.playtime), lastPlayed: recent?.updated_at || null };
  });
  return { games, loading: loading || ownership.isLoading, error: ownership.isError, retry: ownership.refetch };
}
