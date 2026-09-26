import { useMemo } from 'react';
import useCardCollection from '@/components/cards/useCardCollection';

export default function useOwnedEquipment() {
  const collection = useCardCollection({ card_type: 'equipment' });
  const items = useMemo(() => collection.cards
    .filter((card) => card.owned && card.user_card_id)
    .map((card) => ({
      id: card.user_card_id,
      user_card_id: card.user_card_id,
      trading_card_id: card.trading_card_id,
      name: card.name,
      title: card.name,
      image: card.image || card.image_url || '',
      icon_url: card.image || card.image_url || '',
      rarity: card.rarity || 'Common',
      equip_slot: card.equip_slot || '',
      stats: { ...(card.stats || {}), ...(card.progression?.enhanced_stats || {}) },
      level: Number(card.progression?.level || 1),
      game_id: card.game_id || '',
      game_title: card.game_title || '',
      game: card.game_title || '',
      genre: card.genre || '',
      card_type: 'equipment',
      itemType: 'equipment',
      type: 'equipment',
      model_url: card.model_url || '',
      progression: card.progression || null,
    })), [collection.cards]);
  return { ...collection, items, equipment: items };
}
