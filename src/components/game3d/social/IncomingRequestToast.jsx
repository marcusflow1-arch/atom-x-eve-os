import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Users, ArrowLeftRight, Swords, Check, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import toast from 'react-hot-toast';
import {
  setFriendsList, setPartyState, openTrade,
} from './socialStores';
// Each kind has its own accept/decline module so the flows stay independent.
import { acceptFriendRequest, declineFriendRequest } from './friendRequest';
import { acceptPartyInvite, declinePartyInvite } from './partyInvite';
import { acceptTradeRequest, declineTradeRequest } from './tradeRequest';
import { acceptDuelChallenge, declineDuelChallenge } from './duelChallenge';

/**
 * IncomingRequestToast — global subscriber for the real-time social system.
 *
 * Responsibilities:
 *  1. Subscribe to SocialRequest changes → show accept/decline popups for
 *     incoming pending requests addressed to the current user.
 *  2. When a request is accepted, persist the friendship / party membership
 *     and push updates to BOTH users' local stores.
 *  3. Sync the user's accepted friends and active party session from the DB
 *     so both panels show real-time, verified shared state.
 *
 * Mounted once at the top of the game world (GameView).
 */
export default function IncomingRequestToast({ userId, userName }) {
  const [incoming, setIncoming] = useState([]); // pending requests addressed to me

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

  // ─── Hydrate party from DB ───
  const refreshParty = useCallback(async () => {
    if (!userId) return;
    try {
      const sessions = await base44.entities.PartySession.filter({ active: true });
      const mine = (sessions || []).find((s) => (s.member_ids || []).includes(userId));
      if (mine) {
        setPartyState({
          members: mine.members || [],
          partyId: mine.id,
          leaderId: mine.leader_id,
        });
      } else {
        setPartyState({ members: [], partyId: null, leaderId: null });
      }
    } catch (e) { console.warn('[Social] refreshParty', e); }
  }, [userId]);

  // ─── Refresh pending incoming requests ───
  // Fetch all requests where I am the receiver (RLS allows this),
  // then filter to pending client-side to avoid multi-field filter issues
  // on the live published app.
  const refreshIncoming = useCallback(async () => {
    if (!userId) return;
    try {
      const reqs = await base44.entities.SocialRequest.filter({ receiver_id: userId });
      const pending = (reqs || []).filter((r) => r.status === 'pending');
      console.log(`[Social] refreshIncoming for ${userId}: ${pending.length} pending`);
      setIncoming(pending);
    } catch (e) { console.warn('[Social] refreshIncoming', e); }
  }, [userId]);

  // Initial load + real-time subscriptions
  useEffect(() => {
    if (!userId) return;
    console.log(`[Social] IncomingRequestToast mounted for user ${userId}`);
    refreshFriends();
    refreshParty();
    refreshIncoming();

    // Poll every 20s as a safety net in case real-time subscription drops.
    // (Real-time subscription is the primary mechanism — this just covers gaps.)
    // Lowered from 5s to avoid hitting the entity API rate limit alongside
    // other social/world pollers.
    const pollInterval = setInterval(() => refreshIncoming(), 20000);

    const unsubReq = base44.entities.SocialRequest.subscribe(() => refreshIncoming());
    const unsubFriend = base44.entities.SocialFriendship.subscribe(() => refreshFriends());
    const unsubParty = base44.entities.PartySession.subscribe(() => refreshParty());

    return () => {
      clearInterval(pollInterval);
      unsubReq && unsubReq();
      unsubFriend && unsubFriend();
      unsubParty && unsubParty();
    };
  }, [userId, refreshFriends, refreshParty, refreshIncoming]);

  // ─── ACCEPT handler ───
  // Each kind has its own accept module. We dispatch to the right one and
  // show a kind-specific success toast — the flows are kept independent.
  const accept = async (req) => {
    try {
      if (req.kind === 'friend') {
        await acceptFriendRequest(req, userName);
        toast.success(`You and ${req.sender_name} are now friends`);
      } else if (req.kind === 'party') {
        await acceptPartyInvite(req, userName);
        toast.success(`Joined ${req.sender_name}'s party`);
      } else if (req.kind === 'trade') {
        await acceptTradeRequest(req);
        toast.success(`Trade started with ${req.sender_name}`);
      } else if (req.kind === 'duel') {
        await acceptDuelChallenge(req, userName);
        toast.success(`Duel started with ${req.sender_name}`);
      }
    } catch (e) {
      console.error('[Social] accept failed', e);
      if (e?.code === 'party_full') toast.error('Party is full');
      else toast.error('Could not accept request');
    }
  };

  // ─── DECLINE handler ───
  // Same per-kind dispatch — each module owns the timing of the hard-delete
  // that prevents declined rows from blocking future retries.
  const decline = async (req) => {
    try {
      if (req.kind === 'friend') await declineFriendRequest(req);
      else if (req.kind === 'party') await declinePartyInvite(req);
      else if (req.kind === 'trade') await declineTradeRequest(req);
      else if (req.kind === 'duel') await declineDuelChallenge(req);
      toast(`${req.sender_name}'s ${req.kind} request declined`);
    } catch (e) { console.error('[Social] decline failed', e); }
  };

  // ─── Watch for OUTGOING requests that got accepted/declined → notify sender ───
  useEffect(() => {
    if (!userId) return;
    const unsub = base44.entities.SocialRequest.subscribe(async (event) => {
      if (event.type !== 'update') return;
      const r = event.data;
      if (!r || r.sender_id !== userId) return;
      if (r.status === 'accepted') {
        if (r.kind === 'trade') {
          openTrade({ id: r.receiver_id, name: r.receiver_name || 'Player' });
        } else if (r.kind === 'friend') {
          toast.success(`${r.receiver_name || 'Player'} accepted your friend request`);
        } else if (r.kind === 'party') {
          toast.success(`${r.receiver_name || 'Player'} joined your party`);
        } else if (r.kind === 'duel') {
          toast.success(`${r.receiver_name || 'Player'} accepted your duel! Mid-click to strike.`);
        }
      } else if (r.status === 'declined') {
        toast(`${r.receiver_name || 'Player'} declined your ${r.kind} request`);
      }
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