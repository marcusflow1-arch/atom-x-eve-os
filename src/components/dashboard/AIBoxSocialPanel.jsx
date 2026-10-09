import { useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronUp, LogIn, MessageSquare, Mic, Repeat2, Search, UserPlus, UserRound, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { usePartySession, partySession } from '@/components/social/partySession';
import { filterSocialPlayers } from './socialDiscoverySelectors.mjs';
import { isLivePlayer, joinDashboard, openPlayerMessage } from '@/components/social/dashboardSession';
import { sendTradeRequest } from '@/components/game3d/social/tradeRequest';
import { showError, showSuccess } from '@/components/error/ErrorToast';
import { useAIBattleSurfaceState } from '@/components/battle/aiBattleSurfaceState';

const actionKey = (playerId, action) => `${playerId}:${action}`;
const DISCOVERY_GENRES = ['Action', 'RPG', 'MMORPG', 'Shooter', 'Strategy', 'Adventure', 'Fighting', 'Racing', 'Simulation', 'Sports', 'Puzzle', 'Horror', 'Sci-Fi'];

export default function AIBoxSocialPanel({ mode = 'online' }) {
  const { user, updateUserData } = useAuth();
  const battleSurface = useAIBattleSurfaceState();
  const party = usePartySession();
  const [expandedId, setExpandedId] = useState('');
  const [actionState, setActionState] = useState({});
  const [genreFilter, setGenreFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editGenres, setEditGenres] = useState(false);
  const [draftGenres, setDraftGenres] = useState([]);
  const [savingGenres, setSavingGenres] = useState(false);

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

  const { data: clanMemberships = [] } = useQuery({
    queryKey: ['luna-recruiter-clans', user?.id],
    queryFn: () => base44.entities.ClanMember.filter({ user_id: user.id }),
    enabled: !!user?.id && mode === 'online',
    staleTime: 30000,
  });
  const recruitingClan = (clanMemberships || []).find(row => ['leader', 'officer'].includes(row.role));
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
        genres: Array.isArray(row.preferred_genres) ? row.preferred_genres.filter(Boolean) : [],
      }));
  }, [presenceRows, user?.id, pvpIds, friendIds]);

  // Party selector is a FRIENDS list, including offline friends rather than
  // showing an empty panel when none of them happen to be online.
  const availablePlayers = useMemo(() => {
    if (mode !== 'party') return onlinePlayers;
    const byId = new Map(onlinePlayers.map(player => [String(player.id), player]));
    for (const friend of friendRows || []) {
      const id = String(friend.friend_id || '');
      if (!id || id === String(user?.id || '') || byId.has(id) || pvpIds.has(id)) continue;
      byId.set(id, {
        id, name: friend.friend_name || 'Friend', avatar: friend.friend_avatar || '',
        status: 'offline', friend: true, genres: [],
      });
    }
    return [...byId.values()];
  }, [mode, onlinePlayers, friendRows, user?.id, pvpIds]);

  const partyMemberIds = useMemo(() => new Set((party.members || []).map(row => String(row.user_id))), [party.members]);
  const partyFull = Boolean(party.party && (party.members || []).length >= (party.party.maxSize || 5));
  const players = useMemo(
    () => filterSocialPlayers(availablePlayers, { mode, genreFilter, search, partyMemberIds }),
    [mode, availablePlayers, partyMemberIds, genreFilter, search],
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
      if (body?.error || body?.success === false) throw new Error(body.error || 'Party invite failed');
      const stateResponse = await base44.functions.invoke('partySystem', { action: 'get_state', data: {} });
      const next = stateResponse?.data ?? stateResponse ?? {};
      if (!next.error) partySession.publish(next);
      window.dispatchEvent(new Event('lunaSocialChanged'));
    },
    `Party invite sent to ${player.name}. They will appear in the five boxes after accepting.`,
  );

  const inviteClan = (player) => {
    if (!recruitingClan?.clan_id) return;
    return run(
      player,
      'clan',
      async () => {
        const response = await base44.functions.invoke('clanSystem', {
          action: 'invite_member_by_id',
          data: { divisionId: recruitingClan.clan_id, inviteeId: player.id },
        });
        const body = response?.data ?? response ?? {};
        if (body.error || body.success === false) throw new Error(body.error || 'Clan invitation failed');
      },
      `Clan invitation sent to ${player.name}.`,
    );
  };

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

  const openProfile = player => window.dispatchEvent(new CustomEvent('openLunaGamerProfile', { detail: { player } }));
  const message = player => openPlayerMessage({
    id: player.id, friend_id: player.id, friend_name: player.name, name: player.name,
    friend_avatar: player.avatar, avatar_url: player.avatar, is_friend: player.friend,
  });
  const voice = player => { window.__lunaPendingVoiceTargetId = String(player.id); message(player); };
  const trade = player => run(player, 'trade',
    () => sendTradeRequest({ id: user.id }, { id: player.id, name: player.name }),
    `Trade request sent to ${player.name}.`);
  const label = mode === 'party' ? 'Invite to Party' : mode === 'friends' ? 'Friends Online' : 'People Online';
  const saveGenres = async () => {
    setSavingGenres(true);
    try {
      const response = await updateUserData({ preferred_genres: draftGenres });
      if (!response?.success) throw new Error(response?.error || 'Could not save your genres');
      setEditGenres(false);
      showSuccess('Your shared gaming genres were updated.');
    } catch (error) { showError(error, 'Gaming Genres'); }
    finally { setSavingGenres(false); }
  };

  return (
    <div
      className="relative h-full min-h-0 overflow-y-auto px-1 pb-2"
      style={{ scrollbarWidth: 'none' }}
      aria-label={label}
    >
      <div className="sticky top-0 z-10 -mx-1 mb-2 flex items-center justify-between px-2 py-2 backdrop-blur-2xl" style={{ background: 'linear-gradient(180deg, rgba(5,12,22,.92), rgba(5,12,22,.58))' }}>
        <div>
          <div className="text-[8px] font-black uppercase tracking-[.2em] text-cyan-100/42">{label}</div>
          <div className="mt-0.5 text-[9px] text-white/32">{mode === 'party' ? `${(party.members || []).length}/5 party members · Invites require acceptance` : `${players.length} ${mode === 'friends' ? 'friends' : 'players'} visible`}</div>
        </div>
        <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[.12em] text-emerald-300/70">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,.7)]" />
          Live
        </div>
      </div>

      <div className="mb-3 space-y-2">
        <label className="flex h-8 items-center gap-2 rounded-lg border border-white/[0.08] bg-black/20 px-2">
          <Search className="h-3.5 w-3.5 text-white/35" />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search players" aria-label="Search players" className="w-full bg-transparent text-[10px] text-white placeholder-white/30 outline-none" />
        </label>
        {mode === 'online' && (
          <>
            <select aria-label="Filter people by game genre" value={genreFilter} onChange={event => setGenreFilter(event.target.value)} className="w-full rounded-lg border border-white/[0.08] bg-[#111e2c] px-2 py-2 text-[10px] text-white/85">
              <option value="all">All genres</option>
              {DISCOVERY_GENRES.map(genre => <option key={genre} value={genre}>{genre}</option>)}
            </select>
            <button type="button" onClick={() => { setEditGenres(value => !value); setDraftGenres(Array.isArray(user?.preferred_genres) ? [...user.preferred_genres] : []); }} className="text-[9px] text-cyan-200/70 underline-offset-2 hover:underline">
              {editGenres ? 'Close my genres' : `My gaming genres: ${user?.preferred_genres?.join(', ') || 'Not shared'} · Edit`}
            </button>
            {editGenres && (
              <div className="rounded-lg border border-white/[0.08] bg-black/25 p-2">
                <div className="mb-2 text-[9px] text-white/50">Choose genres you play to help others find you.</div>
                <div className="flex flex-wrap gap-1">
                  {DISCOVERY_GENRES.map(genre => <button key={genre} type="button" aria-pressed={draftGenres.includes(genre)} onClick={() => setDraftGenres(current => current.includes(genre) ? current.filter(value => value !== genre) : [...current, genre])} className={`rounded px-2 py-1 text-[9px] ${draftGenres.includes(genre) ? 'bg-cyan-300/20 text-cyan-100' : 'bg-white/[0.055] text-white/45'}`}>{genre}</button>)}
                </div>
                <button type="button" disabled={savingGenres} onClick={saveGenres} className="mt-2 rounded bg-cyan-300/15 px-3 py-1.5 text-[9px] font-bold text-cyan-100 disabled:opacity-50">{savingGenres ? 'Saving…' : 'Save genres'}</button>
              </div>
            )}
          </>
        )}
        {mode === 'party' && (
          <p className="text-[9px] leading-4 text-white/45">Invite an online friend to your party. Only accepted members appear in the five party boxes above the dashboard.{partyFull ? ' Your party is full.' : ''}</p>
        )}
      </div>
      <div className="space-y-1.5">
        {players.map((player) => {
          const expanded = expandedId === player.id;
          const friendState = actionState[actionKey(player.id, 'friend')];
          const partyState = actionState[actionKey(player.id, 'party')];
          const inviteState = actionState[actionKey(player.id, 'dashboard-invite')];
          const joinState = actionState[actionKey(player.id, 'join')];
          const clanState = actionState[actionKey(player.id, 'clan')];
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
                  <span className="mt-0.5 block truncate text-[7px] uppercase tracking-[.09em] text-white/40">{player.genres.length ? player.genres.join(' · ') : player.friend ? 'Friend · Online · Genre not shared' : 'Online · Genre not shared'}</span>
                </span>
                {expanded ? <ChevronUp className="h-3.5 w-3.5 text-white/35" /> : <ChevronDown className="h-3.5 w-3.5 text-white/35" />}
              </button>

              {expanded && (
                <div className="grid grid-cols-2 gap-1 border-t border-white/[0.06] bg-black/15 p-2">
                  {mode !== 'party' && !player.friend && (
                    <button type="button" disabled={friendState === 'working' || friendState === 'done'} onClick={() => addFriend(player)} className="flex min-h-8 items-center justify-center gap-1 rounded-lg bg-white/[0.045] px-2 text-[7px] font-bold uppercase tracking-[.08em] text-white/62 hover:bg-white/[0.08] disabled:opacity-45">
                      {friendState === 'done' ? <Check className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
                      {friendState === 'working' ? 'Sending…' : friendState === 'done' ? 'Sent' : friendState === 'error' ? 'Retry Friend' : 'Add Friend'}
                    </button>
                  )}
                  <button type="button" disabled={partyFull || partyMemberIds.has(player.id) || partyState === 'working' || partyState === 'done'} onClick={() => inviteParty(player)} className="flex min-h-8 items-center justify-center gap-1 rounded-lg bg-white/[0.045] px-2 text-[7px] font-bold uppercase tracking-[.08em] text-white/62 hover:bg-white/[0.08] disabled:opacity-45">
                    <Users className="h-3 w-3" />
                    {partyFull ? 'Party Full' : partyState === 'working' ? 'Inviting…' : partyState === 'done' ? 'Invite Sent' : partyState === 'error' ? 'Retry Party' : 'Invite Party'}
                  </button>
                  {mode !== 'party' && <button type="button" disabled={inviteState === 'working' || inviteState === 'done'} onClick={() => inviteDashboard(player)} className="flex min-h-8 items-center justify-center gap-1 rounded-lg bg-white/[0.045] px-2 text-[7px] font-bold uppercase tracking-[.08em] text-white/62 hover:bg-white/[0.08] disabled:opacity-45">
                    <UserPlus className="h-3 w-3" />
                    {inviteState === 'working' ? 'Inviting…' : inviteState === 'done' ? 'Dashboard Sent' : inviteState === 'error' ? 'Retry Invite' : 'Invite Dashboard'}
                  </button>}
                  {mode !== 'party' && <button type="button" disabled={joinState === 'working'} onClick={() => joinPlayerDashboard(player)} className="flex min-h-8 items-center justify-center gap-1 rounded-lg bg-cyan-200/[0.09] px-2 text-[7px] font-black uppercase tracking-[.08em] text-cyan-100 hover:bg-cyan-200/[0.14] disabled:opacity-45">
                    <LogIn className="h-3 w-3" />
                    {joinState === 'working' ? 'Joining…' : joinState === 'error' ? 'Retry Join' : 'Join Dashboard'}
                  </button>}
                  <button type="button" onClick={() => openProfile(player)}
                    className="flex min-h-8 items-center justify-center gap-1 rounded-lg bg-white/[0.045] px-2 text-[8px] font-semibold text-white/75 hover:bg-white/[0.09]">
                    <UserRound className="h-3 w-3" />View Profile
                  </button>
                  <button type="button" onClick={() => message(player)}
                    className="flex min-h-8 items-center justify-center gap-1 rounded-lg bg-white/[0.045] px-2 text-[8px] font-semibold text-white/75 hover:bg-white/[0.09]">
                    <MessageSquare className="h-3 w-3" />Message
                  </button>
                  <button type="button" onClick={() => voice(player)}
                    className="flex min-h-8 items-center justify-center gap-1 rounded-lg bg-white/[0.045] px-2 text-[8px] font-semibold text-white/75 hover:bg-white/[0.09]">
                    <Mic className="h-3 w-3" />Start Voice Chat
                  </button>
                  <button type="button" disabled={actionState[actionKey(player.id,'trade')] === 'working'}
                    onClick={() => trade(player)}
                    className="flex min-h-8 items-center justify-center gap-1 rounded-lg bg-white/[0.045] px-2 text-[8px] font-semibold text-white/75 hover:bg-white/[0.09] disabled:opacity-45">
                    <Repeat2 className="h-3 w-3" />Offer Trade
                  </button>
                  {mode === 'online' && recruitingClan && (
                    <button type="button" disabled={clanState === 'working' || clanState === 'done'} onClick={() => inviteClan(player)} className="col-span-2 flex min-h-8 items-center justify-center gap-1 rounded-lg bg-cyan-200/[0.06] px-2 text-[8px] font-bold uppercase tracking-[.08em] text-cyan-100/80 hover:bg-cyan-200/[0.12] disabled:opacity-45">
                      <UserPlus className="h-3 w-3" />
                      {clanState === 'working' ? 'Recruiting…' : clanState === 'done' ? 'Clan Invite Sent' : clanState === 'error' ? 'Retry Clan Invite' : 'Invite to Clan'}
                    </button>
                  )}
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
              {mode === 'party' ? 'No online friends available to invite' : mode === 'friends' ? 'No friends online' : genreFilter !== 'all' ? 'No players sharing that genre are online' : 'No other players online'}
            </div>
            <div className="mt-1 text-[8px] leading-4 text-white/24">
              {mode === 'party' ? 'Online friends who are not already in your party will appear here.' : mode === 'friends' ? 'Online friends will appear here automatically.' : 'Players appear when their dashboard presence is active. Genres show only when shared by players.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
