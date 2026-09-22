import { useMemo, useState } from 'react';
import { Gamepad2, MessageSquare, Search, Send, UserRound, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { showError, showSuccess } from '@/components/error/ErrorToast';

const LIVE_WINDOW_MS = 20000;

const statusTone = {
  online: 'bg-emerald-400',
  away: 'bg-amber-300',
  idle: 'bg-amber-300',
  busy: 'bg-rose-400',
  dnd: 'bg-rose-400',
  offline: 'bg-slate-500',
};

const normalizeStatus = (status) => {
  const value = String(status || '').toLowerCase();
  if (['online','away','idle','busy','dnd'].includes(value)) return value;
  return 'offline';
};

export default function LunaFriendsQuickAccessPanel() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [partyInvitingId, setPartyInvitingId] = useState(null);

  const { data: friends = [], isLoading } = useQuery({
    queryKey: ['luna-friends-quick-access', user?.id],
    queryFn: () => base44.entities.Friend.filter({ user_id: user.id }, '-favorite', 250),
    enabled: Boolean(user?.id),
    staleTime: 12000,
    refetchInterval: 12000,
  });

  const { data: playerStates = [] } = useQuery({
    queryKey: ['luna-friends-presence', user?.id],
    queryFn: () => base44.entities.PlayerState.list('-last_update', 500),
    enabled: Boolean(user?.id),
    staleTime: 5000,
    refetchInterval: 5000,
  });

  const presenceById = useMemo(() => {
    const now = Date.now();
    const map = new Map();
    (playerStates || []).forEach((state) => {
      if (!state?.player_id) return;
      const id = String(state.player_id);
      const previous = map.get(id);
      if (!previous || Number(state.last_update || 0) > Number(previous.last_update || 0)) {
        map.set(id, state);
      }
    });
    for (const [id, state] of map.entries()) {
      const fresh = Number(state.last_update || 0) > now - LIVE_WINDOW_MS;
      map.set(id, {
        ...state,
        status: fresh ? normalizeStatus(state.status || 'online') : 'offline',
      });
    }
    return map;
  }, [playerStates]);

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (friends || [])
      .map((friend) => {
        const presence = presenceById.get(String(friend.friend_id));
        const status = presence?.status || normalizeStatus(friend.status);
        const currentGame = presence?.channel_id?.startsWith?.('dashboard_')
          ? 'Luna Dashboard'
          : presence?.channel_id || friend.current_game || '';
        return {
          ...friend,
          status,
          currentGame,
          isOnline: status !== 'offline',
        };
      })
      .filter((friend) => {
        if (filter === 'online' && !friend.isOnline) return false;
        if (filter === 'offline' && friend.isOnline) return false;
        if (!needle) return true;
        return `${friend.friend_name || ''} ${friend.currentGame || ''} ${friend.status || ''}`.toLowerCase().includes(needle);
      })
      .sort((a, b) =>
        Number(b.isOnline) - Number(a.isOnline)
        || Number(Boolean(b.favorite)) - Number(Boolean(a.favorite))
        || String(a.friend_name || '').localeCompare(String(b.friend_name || ''))
      );
  }, [friends, presenceById, search, filter]);

  const onlineCount = useMemo(
    () => (friends || []).filter((friend) => {
      const presence = presenceById.get(String(friend.friend_id));
      return (presence?.status || normalizeStatus(friend.status)) !== 'offline';
    }).length,
    [friends, presenceById]
  );

  const openMessage = (friend) => {
    const target = {
      id: friend.friend_id,
      friend_id: friend.friend_id,
      friend_name: friend.friend_name || 'Friend',
      friend_avatar: friend.friend_avatar || '',
      name: friend.friend_name || 'Friend',
      avatar_url: friend.friend_avatar || '',
      is_friend: true,
    };
    window.__lunaPendingMessageTarget = target;
    window.dispatchEvent(new CustomEvent('openLunaMessages', { detail: { target } }));
  };

  const inviteParty = async (friend) => {
    const id = String(friend.friend_id || '');
    if (!id || partyInvitingId) return;
    setPartyInvitingId(id);
    try {
      const response = await base44.functions.invoke('partySystem', {
        action: 'invite_member',
        data: { inviteeId: id },
      });
      const body = response?.data ?? response ?? {};
      if (body?.error) throw new Error(body.error);
      showSuccess(`Party invite sent to ${friend.friend_name || 'friend'}.`);
    } catch (error) {
      showError(error, 'Party Invite');
    } finally {
      setPartyInvitingId(null);
    }
  };

  return (
    <div
      className="relative flex h-full w-full min-h-0 flex-col overflow-hidden text-white"
      style={{
        background: 'radial-gradient(ellipse at 46% 40%, rgba(33,51,73,.48) 0%, rgba(20,34,52,.38) 58%, rgba(11,21,34,.18) 84%, transparent 100%)',
        backdropFilter: 'blur(16px) saturate(122%)',
        WebkitBackdropFilter: 'blur(16px) saturate(122%)',
      }}
    >
      <header className="shrink-0 border-b border-white/[0.065] px-5 pb-3 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center border border-white/[0.09] bg-white/[0.035]">
            <Users className="h-4 w-4 text-cyan-100/75" />
          </div>
          <div>
            <p className="text-[7px] font-black uppercase tracking-[0.18em] text-cyan-100/45">Quick Access</p>
            <h2 className="text-[15px] font-semibold text-white">Friends</h2>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[10px] font-semibold text-white">{onlineCount} online</p>
            <p className="text-[7px] text-white/38">{friends.length} friends</p>
          </div>
        </div>

        <label className="mt-3 flex h-9 items-center gap-2 border border-white/[0.09] bg-white/[0.025] px-3 focus-within:border-cyan-200/20">
          <Search className="h-3.5 w-3.5 text-white/35" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search friends"
            className="min-w-0 flex-1 bg-transparent text-[9px] text-white outline-none placeholder:text-white/30"
          />
        </label>

        <div className="mt-2 flex items-center gap-1.5">
          {[
            ['all', 'All'],
            ['online', 'Online'],
            ['offline', 'Offline'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`h-7 border px-3 text-[6.5px] font-black uppercase tracking-[0.1em] transition-colors ${filter === id
                ? 'border-cyan-100/18 bg-cyan-100/[0.07] text-white'
                : 'border-white/[0.06] bg-white/[0.015] text-white/45 hover:bg-white/[0.04] hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 [scrollbar-width:thin]">
        {isLoading ? (
          <div className="py-14 text-center text-[9px] text-white/38">Loading friends…</div>
        ) : rows.length ? (
          <div className="space-y-1.5">
            {rows.map((friend) => {
              const inviting = partyInvitingId === String(friend.friend_id);
              return (
                <div
                  key={friend.friend_id}
                  className="group flex min-h-[64px] items-center gap-3 border border-white/[0.055] bg-white/[0.018] px-3 py-2 transition-colors hover:border-white/[0.10] hover:bg-white/[0.035]"
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden border border-white/[0.08] bg-white/[0.04]">
                    {friend.friend_avatar
                      ? <img src={friend.friend_avatar} alt="" className="h-full w-full object-cover" />
                      : <div className="grid h-full place-items-center"><UserRound className="h-4.5 w-4.5 text-white/35" /></div>}
                    <span className={`absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-slate-900 ${statusTone[friend.status] || statusTone.offline}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[10px] font-semibold text-white">{friend.friend_name || 'Friend'}</p>
                      <span className="shrink-0 text-[6px] uppercase tracking-[0.08em] text-white/35">{friend.status}</span>
                    </div>
                    <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[7px] text-white/40">
                      {friend.currentGame ? <Gamepad2 className="h-2.5 w-2.5 shrink-0 text-cyan-100/45" /> : null}
                      <span className="truncate">{friend.currentGame || (friend.isOnline ? 'Online in Atom X Eve' : 'Offline')}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openMessage(friend)}
                      className="flex h-8 items-center gap-1.5 border border-white/[0.07] bg-white/[0.025] px-2.5 text-[6px] font-black uppercase tracking-[0.08em] text-white/65 transition-colors hover:bg-cyan-100/[0.08] hover:text-white"
                      title={`Message ${friend.friend_name || 'friend'}`}
                    >
                      <MessageSquare className="h-3 w-3" />
                      Message
                    </button>
                    <button
                      type="button"
                      disabled={inviting}
                      onClick={() => inviteParty(friend)}
                      className="flex h-8 items-center gap-1.5 border border-white/[0.07] bg-white/[0.025] px-2.5 text-[6px] font-black uppercase tracking-[0.08em] text-white/65 transition-colors hover:bg-white/[0.07] hover:text-white disabled:opacity-40"
                      title={`Invite ${friend.friend_name || 'friend'} to party`}
                    >
                      <Send className="h-3 w-3" />
                      {inviting ? 'Sending' : 'Party'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid h-full min-h-48 place-items-center text-center">
            <div>
              <Users className="mx-auto h-7 w-7 text-white/22" />
              <p className="mt-2 text-[9px] text-white/42">
                {search ? 'No friends match that search.' : filter === 'online' ? 'No friends are online.' : filter === 'offline' ? 'No friends are offline.' : 'Your friends will appear here.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
