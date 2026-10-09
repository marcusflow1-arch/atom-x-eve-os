import { useEffect, useState } from 'react';
import { ChevronDown, Flag, Heart, LogIn, MessageSquare, Mic, Repeat2, UserMinus, UserPlus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { joinDashboard, openPlayerMessage } from '@/components/social/dashboardSession';
import { sendTradeRequest } from '@/components/game3d/social/tradeRequest';
import { showError, showSuccess } from '@/components/error/ErrorToast';

const unwrap = result => {
  const body = result?.data ?? result ?? {};
  if (body.error || body.success === false) throw new Error(body.error || 'Action unsuccessful');
  return body;
};

export const asSocialTarget = player => ({
  id: String(player?.id || player?.friend_id || player?.player_id || ''),
  name: player?.name || player?.friend_name || player?.display_name || 'Player',
  avatar: player?.avatar || player?.friend_avatar || player?.avatar_url || '',
  is_friend: Boolean(player?.friend || player?.is_friend),
  status: player?.status || 'offline',
  genres: player?.genres || [],
});

export default function LunaGamerProfile({ player, onClose }) {
  const { user } = useAuth();
  const p = asSocialTarget(player);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState('');
  const [friend, setFriend] = useState(p.is_friend);
  const [following, setFollowing] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState('harassment');
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (!user?.id || !p.id) return;
    let active = true;
    Promise.all([
      base44.entities.Follow.filter({ follower_id: user.id, followed_id: p.id }),
      base44.entities.Friend.filter({ user_id: user.id, friend_id: p.id }),
    ]).then(([follows, friends]) => {
      if (active) { setFollowing(Boolean(follows?.length)); setFriend(Boolean(friends?.length)); }
    }).catch(() => {});
    return () => { active = false; };
  }, [p.id, user?.id]);

  const act = async (name, task, success) => {
    if (busy || !p.id) return;
    setBusy(name);
    try {
      await task();
      if (success) showSuccess(success);
    } catch (error) { showError(error, name); }
    finally { setBusy(''); }
  };

  const message = () => openPlayerMessage({
    id: p.id, friend_id: p.id, friend_name: p.name,
    name: p.name, avatar_url: p.avatar, friend_avatar: p.avatar, is_friend: friend,
  });
  const voice = () => {
    // The real Luna Messenger owns WebRTC call setup, microphone permission
    // and signaling. It consumes this explicit target/voice intent.
    window.__lunaPendingVoiceTargetId = p.id;
    message();
  };
  const trade = () => act('Trade', async () => {
    await sendTradeRequest({ id: user.id }, { id: p.id, name: p.name });
  }, 'Trade request sent to ' + p.name + '.');
  const toggleFollow = () => act('Follow', async () => {
    const existing = await base44.entities.Follow.filter({ follower_id: user.id, followed_id: p.id });
    if (existing?.length) {
      await Promise.all(existing.map(row => base44.entities.Follow.delete(row.id)));
      setFollowing(false);
    } else {
      await base44.entities.Follow.create({ follower_id: user.id, followed_id: p.id });
      setFollowing(true);
    }
  });
  const friendAction = () => act(friend ? 'Unfriend' : 'Add friend', async () => {
    if (friend) {
      if (!window.confirm('Remove ' + p.name + ' from your friends?')) return;
      unwrap(await base44.functions.invoke('socialActions', { action: 'remove_friend', data: { friend_user_id: p.id } }));
      setFriend(false);
    } else {
      unwrap(await base44.functions.invoke('socialActions', { action: 'send_friend_request', data: { target_user_id: p.id } }));
      showSuccess('Friend request sent to ' + p.name + '.');
    }
    window.dispatchEvent(new CustomEvent('lunaSocialChanged', { detail: { type:'friends', friendId:p.id } }));
  });
  const report = () => act('Report', async () => {
    unwrap(await base44.functions.invoke('forumSystem', {
      action: 'report',
      data: { target_type:'user', target_id:p.id, reason, details:details.trim() },
    }));
    setReporting(false);setMore(false);
  }, 'Report submitted for review.');

  return (
    <div className="h-full overflow-y-auto bg-[linear-gradient(155deg,#1b3953,#0c1929)] p-5 text-white" data-luna-gamer-profile={p.id}>
      <div className="flex items-center gap-4 border-b border-white/10 pb-5">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/15 bg-white/5">
          {p.avatar ? <img className="h-full w-full object-cover" src={p.avatar} alt="" /> : <UserPlus className="m-5 h-6 w-6 text-white/50" />}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">{p.name}</h2>
          <p className="text-xs text-cyan-100/65">{p.status} · {friend ? 'Friend' : 'Gamer'}</p>
          {p.genres?.length > 0 && <p className="mt-1 truncate text-xs text-white/45">{p.genres.join(' · ')}</p>}
        </div>
      </div>
      <p className="mt-4 text-xs text-white/45">Gamer profile · Further customization coming later.</p>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => act('Join dashboard', () => joinDashboard(p), 'Joining ' + p.name + '\'s dashboard.')} disabled={!!busy} className="flex items-center justify-center gap-2 rounded-md bg-cyan-200 px-3 py-3 text-xs font-semibold text-slate-950 disabled:opacity-50"><LogIn size={15}/>Join Dashboard</button>
        <button type="button" onClick={message} className="flex items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-3 text-xs"><MessageSquare size={15}/>Message</button>
        <button type="button" onClick={trade} disabled={!!busy} className="flex items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-3 text-xs disabled:opacity-50"><Repeat2 size={15}/>Offer Trade</button>
        <button type="button" onClick={voice} className="flex items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-3 text-xs"><Mic size={15}/>Voice Chat</button>
      </div>
      <div className="mt-4 rounded-md border border-white/10 bg-white/[.025]">
        <button aria-expanded={more} onClick={() => { setMore(value => !value); setReporting(false); }} type="button" className="flex w-full items-center justify-between px-4 py-3 text-xs text-white/80">More options <ChevronDown size={15}/></button>
        {more && <div className="grid gap-1 border-t border-white/10 p-2">
          <button type="button" onClick={toggleFollow} disabled={!!busy} className="flex items-center gap-2 rounded px-3 py-2 text-left text-xs hover:bg-white/10 disabled:opacity-50"><Heart size={14}/>{following ? 'Unfollow' : 'Follow'}</button>
          <button type="button" onClick={friendAction} disabled={!!busy} className="flex items-center gap-2 rounded px-3 py-2 text-left text-xs hover:bg-white/10 disabled:opacity-50"><UserMinus size={14}/>{friend ? 'Unfriend' : 'Add Friend'}</button>
          <button type="button" onClick={() => setReporting(value => !value)} className="flex items-center gap-2 rounded px-3 py-2 text-left text-xs text-rose-200 hover:bg-rose-200/10"><Flag size={14}/>Report Player</button>
          {reporting && <div className="space-y-2 border-t border-white/10 p-2">
            <label className="block text-xs text-white/70">Reason
              <select aria-label="Report reason" value={reason} onChange={e => setReason(e.target.value)} className="mt-1 block w-full rounded border border-white/15 bg-slate-900 p-2 text-xs">
                {['harassment','spam','hate','other'].map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <textarea aria-label="Report details" value={details} onChange={e=>setDetails(e.target.value)} className="w-full rounded border border-white/15 bg-slate-900 p-2 text-xs" placeholder="Optional details" maxLength={1000} rows={2} />
            <button type="button" disabled={!!busy} onClick={report} className="rounded bg-rose-300 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50">Submit report</button>
          </div>}
        </div>}
      </div>
    </div>
  );
}
