import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function useCardProgression(card) {
  const queryClient = useQueryClient();
  const [state, setState] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const inFlight = useRef(false);
  const userCardId = card?.ownedCopies?.[0]?.id || card?.user_card_id || (card?.id?.startsWith('owned:') ? card.id.slice(6) : null);
  const eligible = Boolean(userCardId || (card?.isUnlocked && card?.achievement_id));
  const load = useCallback(async () => {
    if (!eligible) { setLoading(false); return; }
    try {
      const response = await base44.functions.invoke('cardProgression', { action: 'getState', userCardId, achievementId: card?.achievement_id, payload: { gameId: card?.gameId, genre: card?.genre, cardImage: card?.image } });
      if (!response.data?.success) throw new Error(response.data?.error || 'Could not load this card.');
      setState(response.data); setError('');
    } catch (e) { setError(e.response?.data?.error || e.message); } finally { setLoading(false); }
  }, [eligible, userCardId, card?.achievement_id, card?.gameId, card?.genre, card?.image]);
  useEffect(() => { setState(null); setLoading(true); load(); }, [load]);
  useEffect(() => {
    if (!state?.userCard?.id) return;
    const refresh = (event) => { if (event.data?.user_card_id === state.userCard.id && !inFlight.current) load(); };
    const unsubscribe = base44.entities.CardProgression.subscribe(refresh);
    const timer = setInterval(() => { if (!inFlight.current) load(); }, 15000);
    return () => { unsubscribe(); clearInterval(timer); };
  }, [state?.userCard?.id, load]);
  const act = async (action, payload = {}) => {
    if (inFlight.current || !state) return false;
    inFlight.current = true; setBusy(true); setError('');
    try {
      const response = await base44.functions.invoke('cardProgression', { action, userCardId: state.userCard.id, payload });
      if (!response.data?.success) throw new Error(response.data?.error || 'The action could not be completed.');
      setState(response.data);
      queryClient.invalidateQueries({ queryKey: ['cards-console-inventory'] });
      return true;
    } catch (e) { setError(e.response?.data?.error || e.message); return false; }
    finally { inFlight.current = false; setBusy(false); }
  };
  return { state, error, busy, loading, eligible, act, reload: load };
}