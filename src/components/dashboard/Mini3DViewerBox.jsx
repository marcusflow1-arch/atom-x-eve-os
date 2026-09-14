import PlayerAvatarPreview from '@/components/onboarding/PlayerAvatarPreview';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AvatarStatCard from './AvatarStatCard';
import { Check, LayoutDashboard, Mic, MicOff, UserPlus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';

const unwrap = (response) => {
  const body = response?.data ?? response;
  if (body?.error) throw new Error(body.error);
  return body || {};
};

export default function Mini3DViewerBox({ isUiVisible = false, hostName, onModelFocus }) {
  const { user } = useAuth();
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [pending, setPending] = useState({ friend_requests: [], dashboard_invites: [] });
  const [legacyInvite, setLegacyInvite] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const social = useCallback(async (action, data = {}) => unwrap(await base44.functions.invoke('socialActions', { action, data })), []);

  const refreshPending = useCallback(async () => {
    if (!user?.id) return;
    try {
      const body = await social('get_pending_actions');
      setPending({ friend_requests: body.friend_requests || [], dashboard_invites: body.dashboard_invites || [] });
      setActionError('');
    } catch (error) {
      console.warn('[Mini3DViewer] pending social actions', error);
    }
  }, [social, user?.id]);

  useEffect(() => {
    refreshPending();
    const timer = window.setInterval(refreshPending, 2500);
    return () => window.clearInterval(timer);
  }, [refreshPending]);

  useEffect(() => {
    const handleInvite = (event) => setLegacyInvite(event.detail);
    window.addEventListener('incomingInvite', handleInvite);
    return () => window.removeEventListener('incomingInvite', handleInvite);
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== '`') return;
      setVoiceEnabled((value) => {
        const next = !value;
        window.dispatchEvent(new CustomEvent('toggleDashboardMic', { detail: { enabled: next } }));
        return next;
      });
    };
    const onDisabled = () => setVoiceEnabled(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('dashboardMicDisabled', onDisabled);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('dashboardMicDisabled', onDisabled);
    };
  }, []);

  const pendingAction = useMemo(() => {
    const items = [
      ...(pending.friend_requests || []).map((item) => ({ kind: 'friend', item, date: item.created_date })),
      ...(pending.dashboard_invites || []).map((item) => ({ kind: 'dashboard', item, date: item.created_date })),
    ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    if (items[0]) return items[0];
    if (legacyInvite) return { kind: 'legacy-dashboard', item: legacyInvite, date: new Date().toISOString() };
    return null;
  }, [pending, legacyInvite]);

  const respond = async (accept) => {
    if (!pendingAction || busy) return;
    setBusy(true);
    setActionError('');
    try {
      if (pendingAction.kind === 'friend') {
        await social('respond_friend_request', { request_id: pendingAction.item.id, decision: accept ? 'accept' : 'decline' });
        window.dispatchEvent(new CustomEvent('lunaSocialChanged', { detail: { type: 'friend-request', accepted: accept } }));
      } else if (pendingAction.kind === 'dashboard') {
        const result = await social('respond_dashboard_invite', { request_id: pendingAction.item.id, decision: accept ? 'accept' : 'decline' });
        if (accept && result.accepted) {
          window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', {
            detail: {
              channelId: `dashboard_${result.host_user_id}`,
              hostId: result.host_user_id,
              hostName: result.host_name || pendingAction.item.requester_name || 'Friend',
              socialJoin: true,
            }
          }));
        }
      } else {
        const invite = pendingAction.item;
        setLegacyInvite(null);
        if (accept) {
          if (invite.fromUser?.envUrl) window.dispatchEvent(new CustomEvent('changeEnvironment', { detail: { envUrl: invite.fromUser.envUrl } }));
          window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', { detail: { channelId: `dashboard_${invite.fromUser?.id}`, hostId: invite.fromUser?.id, hostName: invite.fromUser?.friend_name || invite.fromUser?.name || 'Friend', socialJoin: true } }));
        } else {
          window.dispatchEvent(new CustomEvent('rejectInvite', { detail: { userId: invite.fromUser?.id } }));
        }
      }
      await refreshPending();
    } catch (error) {
      console.error('[Mini3DViewer] social response failed', error);
      setActionError(error.message || 'Could not complete that action.');
    } finally {
      setBusy(false);
    }
  };

  const prompt = pendingAction ? (() => {
    if (pendingAction.kind === 'friend') return {
      icon: UserPlus,
      eyebrow: 'Friend Request',
      text: `${pendingAction.item.sender_name || 'A player'} wants to add you as a friend.`,
      accept: 'Accept',
    };
    if (pendingAction.kind === 'dashboard') return {
      icon: LayoutDashboard,
      eyebrow: 'Dashboard Invite',
      text: `${pendingAction.item.requester_name || 'A friend'} invited you to join their dashboard.`,
      accept: 'Join',
    };
    return {
      icon: LayoutDashboard,
      eyebrow: 'Dashboard Invite',
      text: `Join ${pendingAction.item.fromUser?.friend_name || pendingAction.item.fromUser?.name || 'friend'} dashboard?`,
      accept: 'Join',
    };
  })() : null;

  return (
    <div className={`pointer-events-auto flex items-start gap-3 relative ${isUiVisible ? 'h-full' : 'px-3 pt-3'}`} style={isUiVisible ? { width: '100%', height: '100%' } : {}}>
      <div className={`relative z-20 flex w-full gap-3 ${isUiVisible ? 'h-full' : ''}`}>
        <div
          className={`overflow-hidden flex-shrink-0 relative rounded-xl ${!isUiVisible ? 'cursor-pointer' : ''}`}
          style={{ background: 'transparent', border: 'none', boxShadow: 'none', width: isUiVisible ? '100%' : '150px', height: isUiVisible ? '100%' : '240px' }}
          onClick={!isUiVisible ? (event) => { event.stopPropagation(); if (onModelFocus) onModelFocus(); else window.dispatchEvent(new CustomEvent('toggleAvatarFocusMode')); } : undefined}
          role={!isUiVisible ? 'button' : undefined}
          tabIndex={!isUiVisible ? 0 : undefined}
          aria-label={!isUiVisible ? 'Open full avatar view' : undefined}
          onKeyDown={!isUiVisible ? (event) => { if (event.key !== 'Enter' && event.key !== ' ') return; event.preventDefault(); event.stopPropagation(); if (onModelFocus) onModelFocus(); else window.dispatchEvent(new CustomEvent('toggleAvatarFocusMode')); } : undefined}
        >
          <div className="relative z-0 h-full w-full"><PlayerAvatarPreview controls="none" interactive={isUiVisible} /></div>

          {prompt && !isUiVisible && (
            <div onClick={(event) => event.stopPropagation()} className="absolute bottom-2 left-2 right-2 z-30 rounded-xl border border-cyan-200/15 bg-slate-950/72 p-2 shadow-[0_14px_30px_rgba(0,0,0,.34)] backdrop-blur-2xl">
              <div className="flex items-start gap-2">
                <prompt.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-200/75" />
                <div className="min-w-0 flex-1"><p className="text-[7px] font-black uppercase tracking-[.16em] text-cyan-100/45">{prompt.eyebrow}</p><p className="mt-0.5 text-[9px] font-semibold leading-3 text-white/90">{prompt.text}</p></div>
              </div>
              <div className="mt-2 flex gap-1.5"><button disabled={busy} onClick={() => respond(false)} className="flex h-7 flex-1 items-center justify-center gap-1 rounded-lg bg-white/[0.06] text-[8px] font-bold text-white/55 hover:bg-white/[0.1] disabled:opacity-40"><X className="h-3 w-3" />Decline</button><button disabled={busy} onClick={() => respond(true)} className="flex h-7 flex-1 items-center justify-center gap-1 rounded-lg bg-cyan-300 text-[8px] font-black text-slate-950 hover:bg-cyan-200 disabled:opacity-40"><Check className="h-3 w-3" />{busy ? 'Working…' : prompt.accept}</button></div>
              {actionError && <p className="mt-1 text-[7px] text-rose-300">{actionError}</p>}
            </div>
          )}

          {hostName && !isUiVisible && !prompt && <div className="pointer-events-none absolute left-2 top-2 z-20 flex max-w-[150px] items-start gap-1.5 rounded border border-white/10 bg-black/60 px-2 py-1.5 shadow-lg backdrop-blur-md"><div className="mt-[3px] h-1.5 w-1.5 flex-shrink-0 animate-pulse rounded-full bg-cyan-400" /><div><span className="block truncate text-[9px] font-bold uppercase tracking-wider text-white">{hostName.toLowerCase() === 'my' ? 'My' : hostName}</span><span className="text-[7px] uppercase tracking-wider text-white/60">Dashboard</span></div></div>}

          {!isUiVisible && <button type="button" className="absolute right-2 top-2 z-20 rounded-full border border-white/10 bg-black/40 p-1 backdrop-blur-md transition-colors hover:bg-white/10" onClick={(event) => { event.stopPropagation(); setVoiceEnabled((value) => { const next = !value; window.dispatchEvent(new CustomEvent('toggleDashboardMic', { detail: { enabled: next } })); return next; }); }} aria-label="Toggle dashboard microphone">{voiceEnabled ? <Mic className="h-3.5 w-3.5 text-green-400" /> : <MicOff className="h-3.5 w-3.5 text-red-400/80" />}</button>}
        </div>
        {!isUiVisible && <div onClick={(event) => event.stopPropagation()}><AvatarStatCard /></div>}
      </div>
    </div>
  );
}