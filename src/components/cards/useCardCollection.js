import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function useCardCollection(filters = {}) {
  const gameId = filters.game_id || '';
  const cardType = filters.card_type || '';
  const query = useQuery({
    queryKey: ['card-collection', gameId, cardType],
    queryFn: async () => {
      const response = await base44.functions.invoke('cardCollection', {
        action: 'list',
        data: { game_id: gameId || undefined, card_type: cardType || undefined },
      });
      return response?.data || response || { cards: [] };
    },
    staleTime: 15000,
  });
  const cards = query.data?.cards || [];
  return {
    cards,
    owned: cards.filter((card) => card.owned),
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
