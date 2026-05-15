import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Users, ArrowLeftRight, Check, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import toast from 'react-hot-toast';
import {
  setFriendsList, setPartyState, openTrade, PARTY_MAX,
} from './socialStores';

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
  const refreshIncoming = useCallback(async () => {
    if (!userId) return;
    try {
      const reqs = await base44.entities.SocialRequest.filter({
        receiver_id: userId, status: 'pending',
      });
      setIncoming(reqs || []);
    } catch (e) { console.warn('[Social] refreshIncoming', e); }
  }, [userId]);

  // Initial load + real-time subscriptions
  useEffect(() => {
    if (!userId) return;
    refreshFriends();
    refreshParty();
    refreshIncoming();

    const unsubReq = base44.entities.SocialRequest.subscribe(() => refreshIncoming());
    const unsubFriend = base44.entities.SocialFriendship.subscribe(() => refreshFriends());
    const unsubParty = base44.entities.PartySession.subscribe(() => refreshParty());

    return () => {
      unsubReq && unsubReq();
      unsubFriend && unsubFriend();
      unsubParty && unsubParty();
    };
  }, [userId, refreshFriends, refreshParty, refreshIncoming]);

  // ─── ACCEPT handler ───
  const accept = async (req) => {
    try {
      // Mark accepted first so both sides see the update
      await base44.entities.SocialRequest.update(req.id, { status: 'accepted' });

      if (req.kind === 'friend') {
        // Create the friendship record (visible to both)
        await base44.entities.SocialFriendship.create({
          user_a_id: req.sender_id, user_a_name: req.sender_name,
          user_b_id: req.receiver_id, user_b_name: req.receiver_name || userName,
        });
        toast.success(`You and ${req.sender_name} are now friends`);
      } else if (req.kind === 'party') {
        // Find or create the party session
        let session = null;
        if (req.party_id) {
          const found = await base44.entities.PartySession.filter({ id: req.party_id });
          session = (found || [])[0];
        }
        if (!session) {
          // Sender had no party yet — create one with both members
          session = await base44.entities.PartySession.create({
            leader_id: req.sender_id,
            member_ids: [req.sender_id, req.receiver_id],
            members: [
              { id: req.sender_id, name: req.sender_name },
              { id: req.receiver_id, name: req.receiver_name || userName },
            ],
            active: true,
          });
        } else {
          // Add receiver to existing party
          if ((session.member_ids || []).length >= PARTY_MAX) {
            toast.error('Party is full');
            return;
          }
          const newMemberIds = Array.from(new Set([...(session.member_ids || []), req.receiver_id]));
          const newMembers = [
            ...(session.members || []),
            { id: req.receiver_id, name: req.receiver_name || userName },
          ];
          await base44.entities.PartySession.update(session.id, {
            member_ids: newMemberIds, members: newMembers,
          });
        }
        toast.success(`Joined ${req.sender_name}'s party`);
      } else if (req.kind === 'trade') {
        // Open the trade panel on BOTH sides. The receiver opens with sender as partner.
        openTrade({ id: req.sender_id, name: req.sender_name });
        // Signal sender to also open (their listener will see status=accepted and open)
        toast.success(`Trade started with ${req.sender_name}`);
      }
    } catch (e) {
      console.error('[Social] accept failed', e);
      toast.error('Could not accept request');
    }
  };

  // ─── DECLINE handler ───
  const decline = async (req) => {
    try {
      await base44.entities.SocialRequest.update(req.id, { status: 'declined' });
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
};