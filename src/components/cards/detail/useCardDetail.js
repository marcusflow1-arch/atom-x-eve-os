import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const dataOf = response => response?.data || response || {};
const errorOf = error => error?.response?.data?.error || error?.message || 'The request could not be completed. Please retry.';
export default function useCardDetail(identity) {
  const client = useQueryClient();
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(Boolean(identity));
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const alive = useRef(false), request = useRef(0), running = useRef(false), latest = useRef(null);
  const identityKey = identity ? JSON.stringify(identity) : '';
  const refresh = useCallback(async () => {
    if (!identityKey || running.current) return;
    const version = ++request.current;
    try {
      const next = dataOf(await base44.functions.invoke('cardProgression', {action:'getState',...JSON.parse(identityKey)}));
      if (next.error || !next.progression || !next.userCard) throw new Error(next.error || 'The card record is unavailable.');
      if (!alive.current || version !== request.current) return;
      latest.current = next; setState(next);
    } catch (error) {
      if (alive.current && version === request.current) setNotice({type:'error',text:errorOf(error)});
    } finally { if (alive.current && version === request.current) setLoading(false); }
  },[identityKey]);
  useEffect(() => {
    alive.current = true;
    refresh();
    return () => { alive.current = false; request.current += 1; };
  },[refresh]);
  useEffect(() => {
    const id = state?.userCard?.id;
    if (!id) return;
    let timer;
    const changed = event => {
      if (event?.data?.user_card_id !== id && event?.data?.id !== id && event?.id !== id) return;
      clearTimeout(timer); timer = setTimeout(refresh,150);
    };
    const subscriptions = ['CardProgression','UserCard'].map(entity => {
      try { return base44.entities[entity].subscribe(changed); } catch { return null; }
    });
    return () => { clearTimeout(timer); subscriptions.forEach(stop => { if (typeof stop === 'function') stop(); }); };
  },[state?.userCard?.id,refresh]);
  const act = useCallback(async (action, payload = {}, endpoint = 'cardProgression') => {
    if (running.current || !latest.current?.userCard?.id) return false;
    running.current = true; request.current += 1; setBusy(true); setNotice(null);
    const id = latest.current.userCard.id;
    try {
      const next = dataOf(await base44.functions.invoke(endpoint, endpoint === 'cardProgression'
        ? {action,userCardId:id,payload}
        : {action,payload:{...payload,userCardId:id}}));
      if (next.error || !next.success) throw new Error(next.error || 'No update was confirmed. Refresh before trying again.');
      if (endpoint === 'cardProgression' && (!next.progression || next.userCard?.id !== id)) throw new Error('The card response did not match. Refresh before trying again.');
      client.invalidateQueries({queryKey:['card-collection']});
      window.dispatchEvent(new CustomEvent('cardProgressionChanged',{detail:{user_card_id:id}}));
      if (!alive.current) return true;
      if (endpoint === 'cardProgression') { latest.current = next; setState(next); }
      else {
        const updated = {...latest.current,userCard:{...latest.current.userCard,trade_status:action === 'listCard' ? 'locked_in_trade' : 'available'}};
        latest.current = updated; setState(updated);
      }
      setNotice({type:'success',text:endpoint === 'cardProgression'
        ? (next.events?.[0]?.summary || 'Your card has been updated.')
        : action === 'listCard' ? 'Listing published. This card is reserved until it sells or you cancel.' : 'Listing cancelled. This card is available again.'});
      return true;
    } catch (error) {
      if (alive.current) setNotice({type:'error',text:errorOf(error)});
      return false;
    } finally {
      running.current = false;
      if (alive.current) { setBusy(false); refresh(); }
    }
  },[client,refresh]);
  return {state,loading,busy,notice,refresh,act};
}
