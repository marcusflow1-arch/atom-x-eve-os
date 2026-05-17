import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { tradeStore, openTrade } from './socialStores';

/**
 * TradeSessionWatcher — headless component that watches the TradeSession entity
 * for any 'accepted' session involving the current user, and auto-opens the
 * TradePanel for both sides.
 *
 * This is the RELIABLE bootstrap path for the trade UI:
 *  • The receiver creates the TradeSession in acceptTradeRequest.
 *  • Both clients (sender + receiver) discover it here via polling +
 *    realtime subscription.
 *  • TradePanel then renders against that session.
 *
 * Without this watcher, the sender depended on a flaky realtime update of
 * SocialRequest (which is also hard-deleted ~3s after accept) — leading to
 * "trade request sent" toast but no UI ever appearing.
 */
export default function TradeSessionWatcher({ userId }) {
  const openedFor = useRef(new Set()); // session ids we've already opened for

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const tryOpenSession = async (s) => {
      if (!s || cancelled) return;
      if (s.status !== 'accepted') return;
      if (s.initiator_id !== userId && s.recipient_id !== userId) return;
      if (openedFor.current.has(s.id)) return;
      const partnerId = s.initiator_id === userId ? s.recipient_id : s.initiator_id;
      // Don't reopen if the trade panel is already open with this partner.
      const existing = tradeStore.get();
      if (existing.open && existing.partner?.id === partnerId) {
        openedFor.current.add(s.id);
        return;
      }
      openedFor.current.add(s.id);
      // Look up the partner name from a recent SocialRequest if available.
      let partnerName = 'Trade Partner';
      try {
        const reqs = await base44.entities.SocialRequest.filter({ kind: 'trade' });
        const match = (reqs || []).find((r) =>
          (r.sender_id === partnerId && r.receiver_id === userId) ||
          (r.sender_id === userId && r.receiver_id === partnerId)
        );
        if (match) {
          partnerName = match.sender_id === partnerId
            ? (match.sender_name || partnerName)
            : (match.receiver_name || partnerName);
        }
      } catch {}
      if (cancelled) return;
      openTrade({ id: partnerId, name: partnerName });
    };

    const scan = async () => {
      try {
        const rows = await base44.entities.TradeSession.filter({ status: 'accepted' });
        (rows || []).forEach(tryOpenSession);
      } catch (e) {
        // silent — polling will retry
      }
    };

    // Initial scan
    scan();

    // Poll every 2s as a reliable fallback. TradeSession is short-lived and
    // low-volume so polling cost is negligible.
    const interval = setInterval(scan, 2000);

    // Realtime subscription — opens the panel instantly when the row appears.
    const unsub = base44.entities.TradeSession.subscribe((event) => {
      if (event?.data) tryOpenSession(event.data);
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      unsub && unsub();
    };
  }, [userId]);

  return null;
}