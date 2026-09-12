import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Crown, Gamepad2, Headphones, Mic, MicOff, Plus, UserMinus, Users, X, Check, LogOut, Link2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const unwrap = (result) => result?.data ?? result ?? {};

export default function PartyDrawer({ user }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({ party: null, membership: null, members: [], invitations: [], launchInvites: [] });
  const [friends, setFriends] = useState([]);
  const [busy, setBusy] = useState(false);
  const seenIncomingRef = useRef(new Set());

  const invoke = useCallback(async (action, data = {}) => unwrap(await base44.functions.invoke('partySystem', { action, data })), []);

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!user?.id) return;
    try {
      const next = await invoke('get_state');
      setState(next);
      const roomId = next.party?.voiceRoomId || null;
      const participantIds = (next.members || []).map(m => m.user_id).filter(Boolean);
      window.dispatchEvent(new CustomEvent('lunaPartyVoiceRoom', { detail: { roomId, participantIds } }));
      window.dispatchEvent(new CustomEvent('lunaPartyStateChanged', { detail: next }));

      const incoming = [...(next.invitations || []), ...(next.launchInvites || [])];
      const hasNew = incoming.some(item => !seenIncomingRef.current.has(item.id));
      incoming.forEach(item => seenIncomingRef.current.add(item.id));
      if (!quiet && hasNew && incoming.length) setOpen(true);
    } catch (error) {
      console.error('[PartyDrawer] state load failed', error);
    }
  }, [invoke, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    load({ quiet: true });
    base44.entities.Friend.filter({ user_id: user.id }).then(setFriends).catch(() => setFriends([]));
    const interval = setInterval(() => load({ quiet: false }), 5000);
    return () => clearInterval(interval);
  }, [user?.id, load]);

  useEffect(() => {
    const openDrawer = () => { setOpen(true); load({ quiet: true }); };
    const launch = async (event) => {
      const game = event.detail?.game;
      if (!game?.title) return;
      try {
        const result = await invoke('broadcast_game_launch', {
          gameId: game.id || game.game_id || '',
          gameTitle: game.title,
          gameCover: game.cover_image || game.cover || game.image || '',
          launchUrl: game.play_link || '',
        });
        if (result.notified > 0) setOpen(true);
        await load({ quiet: true });
      } catch (error) {
        console.error('[PartyDrawer] launch broadcast failed', error);
      }
    };
    const mic = (event) => invoke('set_voice', { enabled: !!event.detail?.enabled }).catch(() => {});
    window.addEventListener('openLunaParty', openDrawer);
    window.addEventListener('atomxe:game-launch', launch);
    window.addEventListener('toggleDashboardMic', mic);
    return () => {
      window.removeEventListener('openLunaParty', openDrawer);
      window.removeEventListener('atomxe:game-launch', launch);
      window.removeEventListener('toggleDashboardMic', mic);
    };
  }, [invoke, load]);

  const act = async (action, data = {}) => {
    setBusy(true);
    try {
      const result = await invoke(action, data);
      if (result?.error) throw new Error(result.error);
      await load({ quiet: true });
      return result;
    } catch (error) {
      console.error(`[PartyDrawer] ${action} failed`, error);
      window.dispatchEvent(new CustomEvent('partyActionError', { detail: { message: error.message || 'Party action failed' } }));
      return null;
    } finally {
      setBusy(false);
    }
  };

  const inviteFriend = async (friend) => {
    const result = await act('invite_member', { inviteeId: friend.friend_id });
    if (result) setOpen(true);
  };

  const respondLaunch = async (invite, response) => {
    const result = await act('respond_launch_invite', { inviteId: invite.id, response });
    if (response === 'accepted' && result?.launchUrl) {
      const target = result.launchUrl.trim();
      if (/^\/(?!\/)/.test(target)) window.location.assign(target);
      else if (/^https?:\/\//i.test(target) || /^steam:\/\/rungameid\/\d+\/?$/i.test(target)) window.open(target, '_blank', 'noopener,noreferrer');
    }
  };

  const memberIds = useMemo(() => new Set((state.members || []).map(m => m.user_id)), [state.members]);
  const inviteable = friends.filter(friend => !memberIds.has(friend.friend_id)).slice(0, 8);
  const isLeader = state.party?.leaderId === user?.id;
  const latestLaunch = state.launchInvites?.[0];

  return (
    <>
      <AnimatePresence>
        {!open && latestLaunch && (
          <motion.button
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
            onClick={() => setOpen(true)}
            className="fixed right-3 top-24 z-[115] max-w-[300px] rounded-2xl border border-cyan-300/15 bg-slate-950/65 px-4 py-3 text-left shadow-2xl backdrop-blur-2xl"
          >
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/70">Party launch</div>
            <div className="mt-1 text-sm font-semibold text-white">{latestLaunch.sender_name} wants to play {latestLaunch.game_title}</div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: '105%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '105%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-2 top-[72px] bottom-[54px] z-[120] overflow-hidden rounded-[22px] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-3xl"
            style={{ width: 'clamp(260px, 10vw, 320px)', background: 'linear-gradient(155deg, rgba(20,29,43,.72), rgba(4,9,18,.84) 58%, rgba(9,19,30,.76))' }}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan-300/[0.055] via-transparent to-blue-500/[0.04]" />
            <div className="relative flex h-full flex-col">
              <header className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06]"><Users className="h-4 w-4 text-cyan-300" /></div>
                  <div><div className="text-[10px] uppercase tracking-[0.22em] text-white/35">Luna link</div><div className="text-sm font-semibold text-white">Party</div></div>
                </div>
                <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-white/35 hover:bg-white/[0.06] hover:text-white"><X className="h-4 w-4" /></button>
              </header>

              <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3 [scrollbar-width:none]">
                {(state.invitations || []).map(invite => (
                  <section key={invite.id} className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.045] p-3">
                    <div className="text-[10px] uppercase tracking-widest text-cyan-300/65">Party invitation</div>
                    <div className="mt-1 text-sm font-medium text-white">{invite.inviter_name} invited you</div>
                    <div className="mt-3 flex gap-2">
                      <button disabled={busy} onClick={() => act('accept_invite', { inviteId: invite.id })} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-cyan-400/15 py-2 text-xs text-cyan-200 hover:bg-cyan-400/25"><Check className="h-3.5 w-3.5" /> Join</button>
                      <button disabled={busy} onClick={() => act('decline_invite', { inviteId: invite.id })} className="rounded-lg bg-white/[0.05] px-3 text-white/55 hover:text-white"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  </section>
                ))}

                {(state.launchInvites || []).map(invite => (
                  <section key={invite.id} className="overflow-hidden rounded-2xl border border-violet-300/15 bg-violet-300/[0.045]">
                    {invite.game_cover && <img src={invite.game_cover} alt="" className="h-20 w-full object-cover opacity-65" />}
                    <div className="p-3">
                      <div className="text-[10px] uppercase tracking-widest text-violet-200/65">Game invite</div>
                      <div className="mt-1 text-sm font-semibold text-white">{invite.sender_name} wants to play</div>
                      <div className="text-xs text-white/55">{invite.game_title}</div>
                      <div className="mt-3 flex gap-2">
                        <button disabled={busy} onClick={() => respondLaunch(invite, 'accepted')} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-violet-400/15 py-2 text-xs text-violet-100 hover:bg-violet-400/25"><Gamepad2 className="h-3.5 w-3.5" /> Launch</button>
                        <button disabled={busy} onClick={() => respondLaunch(invite, 'declined')} className="rounded-lg bg-white/[0.05] px-3 text-white/55 hover:text-white"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  </section>
                ))}

                {state.party ? (
                  <>
                    <section>
                      <div className="mb-2 flex items-center justify-between px-1"><span className="text-[10px] uppercase tracking-[0.18em] text-white/35">Members {state.members?.length || 0}/{state.party.maxSize || 4}</span><Headphones className="h-3.5 w-3.5 text-cyan-300/60" /></div>
                      <div className="space-y-1.5">
                        {(state.members || []).map(member => (
                          <div key={member.id} className="group flex items-center gap-2 rounded-xl border border-white/[0.055] bg-white/[0.035] p-2.5">
                            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/10">{member.user_avatar ? <img src={member.user_avatar} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xs text-white/50">{member.user_name?.[0]}</div>}<span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-slate-950 bg-emerald-400" /></div>
                            <div className="min-w-0 flex-1"><div className="flex items-center gap-1 truncate text-xs font-medium text-white">{member.user_name}{member.role === 'leader' && <Crown className="h-3 w-3 text-amber-300" />}</div><div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-white/30">{member.voice_enabled === false ? <MicOff className="h-2.5 w-2.5" /> : <Mic className="h-2.5 w-2.5 text-emerald-300/70" />} {member.user_id === user?.id ? 'You' : member.role}</div></div>
                            {isLeader && member.user_id !== user?.id && <button disabled={busy} onClick={() => act('remove_member', { userId: member.user_id })} className="opacity-0 transition-opacity group-hover:opacity-100 rounded-lg p-1.5 text-red-300/70 hover:bg-red-400/10"><UserMinus className="h-3.5 w-3.5" /></button>}
                          </div>
                        ))}
                      </div>
                    </section>

                    {state.party.activeGameTitle && <section className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3"><div className="text-[10px] uppercase tracking-widest text-white/30">Party activity</div><div className="mt-1 flex items-center gap-2 text-xs text-white/75"><Gamepad2 className="h-3.5 w-3.5 text-cyan-300" /> {state.party.activeGameTitle}</div></section>}

                    <section>
                      <div className="mb-2 flex items-center justify-between px-1"><span className="text-[10px] uppercase tracking-[0.18em] text-white/35">Invite friends</span><Plus className="h-3.5 w-3.5 text-white/30" /></div>
                      <div className="space-y-1">
                        {inviteable.length ? inviteable.map(friend => <button key={friend.id} disabled={busy} onClick={() => inviteFriend(friend)} className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left hover:bg-white/[0.05]"><div className="h-7 w-7 overflow-hidden rounded-full bg-white/10">{friend.friend_avatar && <img src={friend.friend_avatar} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1 truncate text-xs text-white/70">{friend.friend_name}</div><Plus className="h-3.5 w-3.5 text-cyan-300/65" /></button>) : <div className="px-2 py-3 text-[11px] text-white/30">No additional friends available.</div>}
                      </div>
                    </section>
                  </>
                ) : (
                  <section className="rounded-2xl border border-dashed border-white/10 px-4 py-7 text-center"><Users className="mx-auto h-6 w-6 text-white/20" /><div className="mt-2 text-xs text-white/50">No active party</div><button disabled={busy} onClick={() => act('create_party')} className="mt-3 rounded-lg bg-cyan-400/10 px-3 py-2 text-xs text-cyan-200 hover:bg-cyan-400/20">Create party</button></section>
                )}
              </div>

              {state.party && <footer className="border-t border-white/[0.07] p-3"><div className="mb-2 flex items-center gap-1 text-[9px] uppercase tracking-wider text-white/25"><Link2 className="h-3 w-3" /> Voice room · {state.party.voiceRoomId}</div><button disabled={busy} onClick={() => act(isLeader ? 'disband_party' : 'leave_party')} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-300/10 bg-red-400/[0.045] py-2.5 text-xs text-red-200/70 hover:bg-red-400/10"><LogOut className="h-3.5 w-3.5" />{isLeader ? 'Disband party' : 'Leave party'}</button></footer>}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
