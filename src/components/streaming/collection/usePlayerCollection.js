import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { buildPlayerCollection } from './playerCollectionModel';

async function allRows(entity, filter, fields) {
  const rows = [];
  let page;
  do {
    const result = filter ? await entity.filter(filter, 'created_date', 500, rows.length, fields) : await entity.list('created_date', 500, rows.length, fields);
    page = Array.isArray(result) ? result : result?.data || [];
    rows.push(...page);
  } while (page.length === 500);
  return rows;
}

export default function usePlayerCollection(user, { publicView = false } = {}) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['stream-player-collection', user?.id, publicView, user?.unlocked_achievements, user?.achievement_rewards, user?.purchased_items, user?.current_activity?.gameId],
    enabled: Boolean(user?.id),
    staleTime: 60000,
    retry: 1,
    queryFn: async () => {
      const [ownedCards, userAchievements, achievements, tradingCards, games, libraryEntries] = await Promise.all([
        allRows(base44.entities.UserCard, { user_id: user.id }, ['id', 'user_id', 'trading_card_id', 'card_name', 'card_type', 'card_rarity', 'card_image', 'game_name', 'game_id', 'genre', 'acquisition_method', 'unlocked_date']),
        allRows(base44.entities.UserAchievement, { user_id: user.id }, ['id', 'user_id', 'achievement_id', 'status', 'progress', ...(publicView ? [] : ['proof_media_url'])]),
        allRows(base44.entities.Achievement), allRows(base44.entities.TradingCard), allRows(base44.entities.Game),
        // Older deployments keep play history in UserLibrary; it is an optional supplement.
        publicView ? Promise.resolve([]) : allRows(base44.entities.UserLibrary, { user_id: user.id }, ['id', 'game_id', 'game_title', 'game_genre', 'game_cover', 'last_played', 'play_time_minutes']).catch(() => []),
      ]);
      return buildPlayerCollection({ user, ownedCards, userAchievements, achievements, tradingCards, games, libraryEntries });
    },
  });
  useEffect(() => {
    if (!user?.id) return;
    const cleanups = [];
    for (const entity of ['UserCard', 'UserAchievement']) {
      try {
        cleanups.push(base44.entities[entity].subscribe((event) => {
          if (event.type === 'delete' || event.data?.user_id === user.id) client.invalidateQueries({ queryKey: ['stream-player-collection', user.id] });
        }));
      } catch { /* Reopening the collection will refresh data when realtime is unavailable. */ }
    }
    return () => cleanups.forEach((unsubscribe) => unsubscribe?.());
  }, [user?.id, client]);
  return query;
}
