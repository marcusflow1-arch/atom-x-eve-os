import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Users, ArrowLeftRight, Swords, Check, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import toast from 'react-hot-toast';
import {
  setFriendsList, setPartyState, openTrade,
} from './socialStores';
// Each kind has its own accept/decline module so the flows stay independent.
import { acceptFriendRequest, declineFriendRequest } from './friendRequest';
import { acceptPartyInvite, declinePartyInvite, fetchPartyState } from './partyInvite';
import { acceptTradeRequest, declineTradeRequest } from './tradeRequest';
import { acceptDuelChallenge, declineDuelChallenge, fetchDuelState } from './duelChallenge';
import { partySession } from '@/components/social/partySession';

/**
 * IncomingRequestToast — global subscriber for the real-time social system.
 *
 * Responsibilities:
 *  1. Show accept/decline popups for requests addressed to the current user. They come
 *     from the shared backends (docs/game3d/BACKEND_AUDIT.md):
 *       friend → FriendRequest (socialActions), party → PartyInvite (partySystem),
 *       duel → DuelSession (duelSystem), trade → SocialRequest (friendCardTrade).
 *  2. Keep the friends list and the party in step with the server.
 *  3. Tell the sender when a request they sent is answered.
 *
 * Mounted once at the top of the game world (GameView).
 */
const asRequest = (kind, id, senderId, senderName) => ({ kind, id, sender_id: senderId, sender_name: senderName || 'Player' });

export default function IncomingRequestToast({ userId }) {
  const [incoming, setIncoming] = useState([]); // pending requests addressed to me
  const partyIdRef = useRef(null);

  // ─── Hydrate friends list from DB ───
  const refreshFriends = useCallback(async () => {
    if (!userId) return;
    try {
      const [asA, asB] = await Promise.all([
        base44.entities.SocialFriendship.filter({ user_a_id: userId }),
        base44.entities.SocialFriendship.filter({ user_b_id: userId }),
      ]);
      const friends = [
        ...(asA || []).map((r) => ({ id: r.user_b_id, name: r.user_b_name || 'Player' })),
        ...(asB || []).map((r) => ({ id: r.user_a_id, name: r.user_a_name || 'Player' })),
      ];
      // de-dup
      const seen = new Set();
      const unique = friends.filter((f) => (seen.has(f.id) ? false : seen.add(f.id)));
      setFriendsList(unique);
    } catch (e) { console.warn('[Social] refreshFriends', e); }
  }, [userId]);

  // ─── The party and every pending request addressed to me, in one pass ───
  // A source that fails leaves the others standing.
  const refreshSocial = useCallback(async () => {
    if (!userId) return;
    const [friendReqs, party, duels, trades] = await Promise.allSettled([
      base44.entities.FriendRequest.filter({ receiver_id: userId, status: 'pending' }),
      fetchPartyState(),
      fetchDuelState(),
      base44.entities.SocialRequest.filter({ receiver_id: userId }),
    ]);
    if (party.status === 'fulfilled') {
      const { party: p, members = [] } = party.value || {};
      partyIdRef.current = p?.id || null;
      // the same party the dashboard shows; MultiplayerSystem takes the party voice room from here
      partySession.publish({ ...(party.value || {}), party: p || null, members });
      setPartyState({
        members: p ? members.map((m) => ({ id: m.user_id, name: m.user_name || 'Player' })) : [],
        partyId: p?.id || null,
        leaderId: p?.leaderId || null,
      });
    } else console.warn('[Social] party state', party.reason);
    const list = [];
    if (friendReqs.status === 'fulfilled') {
      for (const r of friendReqs.value || []) list.push(asRequest('friend', r.id, r.sender_id, r.sender_name));
    }
    if (party.status === 'fulfilled') {
      for (const inv of party.value?.invitations || []) list.push(asRequest('party', inv.id, inv.inviter_id, inv.inviter_name));
    }
    if (duels.status === 'fulfilled') {
      for (const d of duels.value?.incoming || []) list.push(asRequest('duel', d.id, d.challenger_id, d.challenger_name));
    }
    if (trades.status === 'fulfilled') {
      for (const r of trades.value || []) if (r.kind === 'trade' && r.status === 'pending') list.push({ ...r, kind: 'trade' });
    }
    setIncoming(list);
  }, [userId]);

  // Initial load + real-time subscriptions
  useEffect(() => {
    if (!userId) return;
    refreshFriends();
    refreshSocial();

    const mine = (row) => row && (row.recipient_id === userId || row.receiver_id === userId || row.sender_id === userId
      || row.user_id === userId || row.challenger_id === userId || row.opponent_id === userId
      || (partyIdRef.current && row.party_id === partyIdRef.current));
    const unsubs = [
      // the servers notify me of friend requests, party invites and duel challenges
      base44.entities.SocialNotification.subscribe((event) => {
        const n = event?.data;
        if (!n || n.recipient_id !== userId) return;
        if (event.type === 'create' && n.type === 'friend_accepted') toast.success(n.body || 'Friend request accepted');
        refreshSocial();
        if (n.type === 'friend_accepted' || n.type === 'friend_request') refreshFriends();
      }),
      base44.entities.SocialRequest.subscribe((event) => { if (mine(event?.data)) refreshSocial(); }),
      base44.entities.SocialFriendship.subscribe(() => refreshFriends()),
      base44.entities.PartyMember.subscribe((event) => {
        const m = event?.data;
        if (!mine(m)) return;
        if (event.type === 'create' && m.user_id !== userId && m.party_id === partyIdRef.current) toast.success(`${m.user_name || 'Player'} joined your party`);
        refreshSocial();
      }),
      base44.entities.DuelSession.subscribe((event) => {
        const d = event?.data;
        if (!mine(d)) return;
        if (event.type === 'update' && d.challenger_id === userId) {
          if (d.status === 'active') toast.success(`${d.opponent_name || 'Player'} accepted your duel! Mid-click to strike.`);
          else if (d.status === 'declined') toast(`${d.opponent_name || 'Player'} declined your duel`);
        }
        refreshSocial();
      }),
    ];
    return () => unsubs.forEach((u) => u && u());
  }, [userId, refreshFriends, refreshSocial]);

  // ─── ACCEPT handler ───
  const accept = async (req) => {
    try {
      if (req.kind === 'friend') {
        await acceptFriendRequest(req);
        toast.success(`You and ${req.sender_name} are now friends`);
        refreshFriends();
      } else if (req.kind === 'party') {
        await acceptPartyInvite(req);
        toast.success(`Joined ${req.sender_name}'s party`);
      } else if (req.kind === 'trade') {
        await acceptTradeRequest(req);
        toast.success(`Trade started with ${req.sender_name}`);
      } else if (req.kind === 'duel') {
        await acceptDuelChallenge(req);
        toast.success(`Duel started with ${req.sender_name}`);
      }
    } catch (e) {
      console.error('[Social] accept failed', e);
      if (e?.code === 'party_full') toast.error('Party is full');
      else toast.error(e?.message || 'Could not accept request');
    } finally {
      refreshSocial();
    }
  };

  // ─── DECLINE handler ───
  const decline = async (req) => {
    try {
      if (req.kind === 'friend') await declineFriendRequest(req);
      else if (req.kind === 'party') await declinePartyInvite(req);
      else if (req.kind === 'trade') await declineTradeRequest(req);
      else if (req.kind === 'duel') await declineDuelChallenge(req);
      toast(`${req.sender_name}'s ${req.kind} request declined`);
    } catch (e) { console.error('[Social] decline failed', e); } finally { refreshSocial(); }
  };

  // ─── An outgoing trade request was accepted → open the trade for the sender ───
  useEffect(() => {
    if (!userId) return;
    const unsub = base44.entities.SocialRequest.subscribe((event) => {
      if (event.type !== 'update') return;
      const r = event.data;
      if (!r || r.sender_id !== userId || r.kind !== 'trade') return;
      if (r.status === 'accepted') openTrade({ id: r.receiver_id, name: r.receiver_name || 'Player' });
      else if (r.status === 'declined') toast(`${r.receiver_name || 'Player'} declined your trade request`);
    });
    return () => unsub && unsub();
  }, [userId]);

  if (!incoming.length) return null;

  return (
    <div className="fixed top-20 right-6 z-[70] flex flex-col gap-2 pointer-events-auto">
      <AnimatePresence>
        {incoming.map((req) => {
          const meta = META[req.kind] || META.friend;
          return (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="w-80 rounded-xl overflow-hidden"
              style={{
                background: 'rgba(12, 16, 24, 0.94)',
                backdropFilter: 'blur(18px) saturate(160%)',
                border: `1px solid ${meta.border}`,
                boxShadow: `0 12px 32px rgba(0,0,0,0.6), 0 0 22px ${meta.glow}`,
              }}
            >
              <div
                className="flex items-center gap-2 px-4 py-2 border-b border-white/10"
                style={{ background: meta.headerBg }}
              >
                <meta.icon className="w-4 h-4" style={{ color: meta.iconColor }} />
                <div className="text-xs font-bold tracking-wider uppercase text-white">
                  {meta.title}
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="text-sm text-white">
                  <span className="font-bold" style={{ color: meta.iconColor }}>
                    {req.sender_name}
                  </span>
                  <span className="text-white/70"> {meta.verb}</span>
                </div>
              </div>
              <div className="flex border-t border-white/10">
                <button
                  onClick={() => decline(req)}
                  className="flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-bold text-red-300 hover:bg-red-500/15 transition-colors border-r border-white/10"
                >
                  <X className="w-3.5 h-3.5" /> Decline
                </button>
                <button
                  onClick={() => accept(req)}
                  className="flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/15 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" /> Accept
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

const META = {
  friend: {
    title: 'Friend Request',
    verb: 'wants to be your friend',
    icon: UserPlus,
    iconColor: '#6ee7b7',
    border: 'rgba(16, 185, 129, 0.4)',
    glow: 'rgba(16, 185, 129, 0.18)',
    headerBg: 'rgba(16, 185, 129, 0.12)',
  },
  party: {
    title: 'Party Invite',
    verb: 'invited you to their party',
    icon: Users,
    iconColor: '#67e8f9',
    border: 'rgba(34, 211, 238, 0.4)',
    glow: 'rgba(34, 211, 238, 0.18)',
    headerBg: 'rgba(34, 211, 238, 0.12)',
  },
  trade: {
    title: 'Trade Request',
    verb: 'wants to trade with you',
    icon: ArrowLeftRight,
    iconColor: '#fcd34d',
    border: 'rgba(251, 191, 36, 0.4)',
    glow: 'rgba(251, 191, 36, 0.18)',
    headerBg: 'rgba(251, 191, 36, 0.12)',
  },
  duel: {
    title: 'Duel Challenge',
    verb: 'challenges you to a duel',
    icon: Swords,
    iconColor: '#fca5a5',
    border: 'rgba(239, 68, 68, 0.45)',
    glow: 'rgba(239, 68, 68, 0.20)',
    headerBg: 'rgba(239, 68, 68, 0.14)',
  },
};