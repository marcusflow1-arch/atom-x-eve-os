import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const asRows = (result) => Array.isArray(result) ? result : result?.data || [];

export default function useCreatorGoals(userId) {
  return useQuery({
    queryKey: ['discover-creator-goals', userId], enabled: Boolean(userId), staleTime: 60000, gcTime: 5 * 60000, retry: 1,
    queryFn: async ({ signal }) => {
      const rows = asRows(await base44.entities.UserAchievement.filter(
        { user_id: userId, status: 'in_progress' }, '-updated_date', 3, 0, ['id', 'achievement_id', 'progress'],
      ));
      signal.throwIfAborted();
      const unique = [...new Map(rows.filter((row) => row.achievement_id).map((row) => [row.achievement_id, row])).values()];
      const results = await Promise.allSettled(unique.map(async (row) => {
        const achievement = asRows(await base44.entities.Achievement.filter({ id: row.achievement_id }, '-created_date', 1, 0, ['id', 'title', 'game', 'rarity']))[0];
        if (!achievement?.title) return null;
        const current = Number(row.progress?.current), total = Number(row.progress?.total);
        const percent = row.progress?.current != null && Number.isFinite(current) && Number.isFinite(total) && total > 0 ? Math.max(0, Math.min(100, Math.round(current / total * 100))) : null;
        return { ...achievement, percent, current, total };
      }));
      signal.throwIfAborted();
      return { goals: results.filter((result) => result.status === 'fulfilled' && result.value).map((result) => result.value), incomplete: results.some((result) => result.status === 'rejected') };
    },
  });
}
