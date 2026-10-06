import { useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronUp, LogIn, UserPlus, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { isLivePlayer, joinDashboard } from '@/components/social/dashboardSession';
import { showError, showSuccess } from '@/components/error/ErrorToast';
import { useAIBattleSurfaceState } from '@/components/battle/aiBattleSurfaceState';

const actionKey = (playerId, action) => `${playerId}:${action}`;

export default function AIBoxSocialPanel({ mode = 'online' }) {
  const { user } = useAuth();
  const battleSurface = useAIBattleSurfaceState();
  const [expandedId, setExpandedId] = useState('');
  const [actionState, setActionState] = useState({});

  const { data: presenceRows = [] } = useQuery({
    queryKey: ['all_users_for_online_list'],
    queryFn: () => base44.entities.PlayerState.list('-last_update', 100),
    enabled: !!user?.id,
    staleTime: 4000,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });

  const { data: friendRows = [], refetch: refetchFriends } = useQuery({
    queryKey: ['luna_presence_friends', user?.id],
    queryFn: () => base44.entities.Friend.filter({ user_id: user.id }),
    enabled: !!user?.id,
    staleTime: 15000,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  const friendIds = useMemo(
    () => new Set((friendRows || []).map((row) => String(row.friend_id || '')).filter(Boolean)),
    [friendRows],
  );
  const pvpIds = useMemo(
    () => new Set((battleSurface.participantIds || []).map(String)),
    [battleSurface.participantIds],
  );

  const onlinePlayers = useMemo(() => {
    const latest = new Map();
    const now = Date.now();
    for (const row of Array.isArray(presenceRows) ? presenceRows : []) {
      const id = String(row?.player_id || '');
      if (!id || id === String(user?.id || '') || pvpIds.has(id) || !isLivePlayer(row, now)) continue;
      const prior = latest.get(id);
      if (!prior || Number(row.last_update || 0) > Number(prior.last_update || 0)) latest.set(id, row);
    }
    return [...latest.values()]
      .sort((a, b) => Number(b.last_update || 0) - Number(a.last_update || 0))
      .map((row) => ({
        id: String(row.player_id),
        name: row.display_name || 'Player',
        avatar: row.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.player_id}`,
        status: row.status || 'online',
        friend: friendIds.has(String(row.player_id)),
      }));
  }, [presenceRows, user?.id, pvpIds, friendIds]);

  const players = useMemo(
    () => (mode === 'friends' ? onlinePlayers.filter((player) => player.friend) : onlinePlayers).slice(0, 5),
    [mode, onlinePlayers],
  );

  const setAction = (id, action, value) => {
    setActionState((current) => ({ ...current, [actionKey(id, action)]: value }));
  };

  const run = async (player, action, callback, successMessage) => {
    const key = actionKey(player.id, action);
    if (actionState[key] === 'working' || actionState[key] === 'done') return;
    setAction(player.id, action, 'working');
    try {
      await callback();
      setAction(player.id, action, 'done');
      if (successMessage) showSuccess(successMessage);
    } catch (error) {
      setAction(player.id, action, 'error');
      showError(error, action === 'friend' ? 'Friend Request' : action === 'party' ? 'Party Invite' : action === 'dashboard-invite' ? 'Dashboard Invite' : 'Join Dashboard');
    }
  };

  const addFriend = (player) => run(
    player,
    'friend',
    async () => {
      const response = await base44.functions.invoke('socialActions', { action: 'send_friend_request', data: { target_user_id: player.id } });
      const body = response?.data ?? response ?? {};
      if (body?.error) throw new Error(body.error);
      await refetchFriends();
      window.dispatchEvent(new CustomEvent('lunaSocialChanged', { detail: { type: 'friendship', friendId: player.id } }));
    },
    `Friend request sent to ${player.name}.`,
  );

  const inviteParty = (player) => run(
    player,
    'party',
    async () => {
      const response = await base44.functions.invoke('partySystem', { action: 'invite_member', data: { inviteeId: player.id } });
      const body = response?.data ?? response ?? {};
      if (body?.error) throw new Error(body.error);
    },
    `Party invite sent to ${player.name}.`,
  );

  const inviteDashboard = (player) => run(
    player,
    'dashboard-invite',
    async () => {
      const response = await base44.functions.invoke('socialActions', { action: 'send_dashboard_invite', data: { target_user_id: player.id } });
      const body = response?.data ?? response ?? {};
      if (body?.error) throw new Error(body.error);
    },
    `Dashboard invite sent to ${player.name}.`,
  );

  const joinPlayerDashboard = (player) => run(
    player,
    'join',
    () => joinDashboard(player),
    `Joining ${player.name}'s dashboard.`,
  );

  const label = mode === 'friends' ? 'Friends Online' : 'People Online';

  return (
    <div
      className="relative h-full min-h-0 overflow-y-auto px-1 pb-2"
      style={{ scrollbarWidth: 'none' }}
      aria-label={label}
    >
      <div className="sticky top-0 z-10 -mx-1 mb-2 flex items-center justify-between px-2 py-2 backdrop-blur-2xl" style={{ background: 'linear-gradient(180deg, rgba(5,12,22,.92), rgba(5,12,22,.58))' }}>
        <div>
          <div className="text-[8px] font-black uppercase tracking-[.2em] text-cyan-100/42">{label}</div>
          <div className="mt-0.5 text-[9px] text-white/32">{players.length} of 5 slots active</div>
        </div>
        <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[.12em] text-emerald-300/70">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,.7)]" />
          Live
        </div>
      </div>

      <div className="space-y-1.5">
        {players.map((player) => {
          const expanded = expandedId === player.id;
          const friendState = actionState[actionKey(player.id, 'friend')];
          const partyState = actionState[actionKey(player.id, 'party')];
          const inviteState = actionState[actionKey(player.id, 'dashboard-invite')];
          const joinState = actionState[actionKey(player.id, 'join')];
          return (
            <div key={player.id} className="overflow-hidden rounded-xl border border-white/[0.07] bg-black/20 backdrop-blur-xl">
              <button
                type="button"
                onClick={() => setExpandedId((current) => current === player.id ? '' : player.id)}
                className="flex w-full items-center gap-2.5 px-2.5 py-2 text-left transition hover:bg-white/[0.045]"
                aria-expanded={expanded}
              >
                <span className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg bg-white/[0.06]">
                  <img src={player.avatar} alt="" className="h-full w-full object-cover" />
                  <span className="absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full border border-slate-950 bg-emerald-300" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[10px] font-bold text-white/88">{player.name}</span>
                  <span className="mt-0.5 block text-[7px] uppercase tracking-[.14em] text-white/30">{player.friend ? 'Friend · Online' : 'Online now'}</span>
                </span>
                {expanded ? <ChevronUp className="h-3.5 w-3.5 text-white/35" /> : <ChevronDown className="h-3.5 w-3.5 text-white/35" />}
              </button>

              {expanded && (
                <div className="grid grid-cols-2 gap-1 border-t border-white/[0.06] bg-black/15 p-2">
                  {!player.friend && (
                    <button type="button" disabled={friendState === 'working' || friendState === 'done'} onClick={() => addFriend(player)} className="flex min-h-8 items-center justify-center gap-1 rounded-lg bg-white/[0.045] px-2 text-[7px] font-bold uppercase tracking-[.08em] text-white/62 hover:bg-white/[0.08] disabled:opacity-45">
                      {friendState === 'done' ? <Check className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
                      {friendState === 'working' ? 'Sending…' : friendState === 'done' ? 'Sent' : friendState === 'error' ? 'Retry Friend' : 'Add Friend'}
                    </button>
                  )}
                  <button type="button" disabled={partyState === 'working' || partyState === 'done'} onClick={() => inviteParty(player)} className="flex min-h-8 items-center justify-center gap-1 rounded-lg bg-white/[0.045] px-2 text-[7px] font-bold uppercase tracking-[.08em] text-white/62 hover:bg-white/[0.08] disabled:opacity-45">
                    <Users className="h-3 w-3" />
                    {partyState === 'working' ? 'Inviting…' : partyState === 'done' ? 'Party Sent' : partyState === 'error' ? 'Retry Party' : 'Invite Party'}
                  </button>
                  <button type="button" disabled={inviteState === 'working' || inviteState === 'done'} onClick={() => inviteDashboard(player)} className="flex min-h-8 items-center justify-center gap-1 rounded-lg bg-white/[0.045] px-2 text-[7px] font-bold uppercase tracking-[.08em] text-white/62 hover:bg-white/[0.08] disabled:opacity-45">
                    <UserPlus className="h-3 w-3" />
                    {inviteState === 'working' ? 'Inviting…' : inviteState === 'done' ? 'Dashboard Sent' : inviteState === 'error' ? 'Retry Invite' : 'Invite Dashboard'}
                  </button>
                  <button type="button" disabled={joinState === 'working'} onClick={() => joinPlayerDashboard(player)} className="flex min-h-8 items-center justify-center gap-1 rounded-lg bg-cyan-200/[0.09] px-2 text-[7px] font-black uppercase tracking-[.08em] text-cyan-100 hover:bg-cyan-200/[0.14] disabled:opacity-45">
                    <LogIn className="h-3 w-3" />
                    {joinState === 'working' ? 'Joining…' : joinState === 'error' ? 'Retry Join' : 'Join Dashboard'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {players.length === 0 && (
        <div className="grid min-h-[190px] place-items-center px-5 text-center">
          <div>
            <Users className="mx-auto h-5 w-5 text-white/18" />
            <div className="mt-2 text-[9px] font-bold uppercase tracking-[.16em] text-white/36">
              {mode === 'friends' ? 'No friends online' : 'No other players online'}
            </div>
            <div className="mt-1 text-[8px] leading-4 text-white/24">
              {mode === 'friends' ? 'Online friends will appear here automatically.' : 'Live dashboard presence will appear here automatically.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
