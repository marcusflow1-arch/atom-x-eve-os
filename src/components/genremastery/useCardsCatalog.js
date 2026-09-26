import { useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import useCardCollection from '@/components/cards/useCardCollection';

export default function useCardsCatalog(games = []) {
  const { user } = useAuth();
  const collection = useCardCollection();
  const gameById = useMemo(() => new Map((games || []).map((game) => [String(game.id), game])), [games]);
  const cards = useMemo(() => collection.cards.map((card) => {
    const game = gameById.get(String(card.game_id || '')) || null;
    const type = String(card.card_type || '').toLowerCase();
    const group = /companion|pet|mount/.test(type) ? 'companion' : /equipment|material/.test(type) ? 'equipment' : /ability/.test(type) ? 'skill' : 'achievement';
    return {
      ...card,
      id: card.trading_card_id || card.id,
      title: card.name,
      series: game?.title || '',
      gameId: card.game_id || '',
      genre: game?.genre || '',
      image: card.image || card.image_url || game?.cover_image || '',
      description: card.description || '',
      group,
      ownedCopies: card.owned && card.user_card_id ? [{ id: card.user_card_id, quantity: card.quantity, equipped_to: card.equipped_to }] : [],
      isOwned: Boolean(card.owned),
      isUnlocked: Boolean(card.owned),
      isPurchased: false,
      showcase: card.showcase || (card.animation_effect ? { model_url: card.model_url || card.animation_effect.model_url, animation_clip: card.animation_effect.clip_name } : null),
    };
  }), [collection.cards, gameById]);
  return { cards, user, isLoading: collection.isLoading, isError: collection.isError, retry: collection.refetch };
}
