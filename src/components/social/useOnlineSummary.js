import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function useOnlineSummary() {
  return useQuery({
    queryKey: ['luna-online-summary'],
    queryFn: async () => {
      const response = await base44.functions.invoke('dashboardSession', { action: 'online_summary', data: {} });
      return response?.data ?? response ?? { online: 0, in_queue: 0, matches_live: 0 };
    },
    refetchInterval: () => document.visibilityState === 'visible' ? 20000 : false,
    refetchOnWindowFocus: true,
    staleTime: 10000,
  });
}
