import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { buildCardCatalog, readCardPages } from './cardsCatalog';

export default function useCardsCatalog(games) {
  const { user } = useAuth();
  const achievements = useQuery({ queryKey: ['cards-console-achievements'], queryFn: () => readCardPages((limit, skip) => base44.entities.Achievement.list('-created_date', limit, skip)), staleTime: 60000 });
  const masters = useQuery({ queryKey: ['cards-console-masters'], queryFn: () => readCardPages((limit, skip) => base44.entities.TradingCard.list('-created_date', limit, skip)), staleTime: 60000 });
  const inventory = useQuery({ queryKey: ['cards-console-inventory', user?.id], queryFn: () => readCardPages((limit, skip) => base44.entities.UserCard.filter({ user_id: user.id }, '-created_date', limit, skip)), enabled: Boolean(user?.id), staleTime: 15000 });
  const cards = useMemo(() => buildCardCatalog({ games, achievements: achievements.data, masters: masters.data, owned: user ? inventory.data : [], unlocked: user?.unlocked_achievements || [] }), [games, achievements.data, masters.data, inventory.data, user]);
  return { cards, user, isLoading: achievements.isLoading || masters.isLoading || (Boolean(user?.id) && inventory.isLoading), isError: achievements.isError || masters.isError || inventory.isError, retry: () => { achievements.refetch(); masters.refetch(); if (user) inventory.refetch(); } };
}
