import { useMemo, useState } from 'react';
import { Search, UserRound, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';

const statusTone = {
  online: 'bg-emerald-400',
  away: 'bg-amber-300',
  idle: 'bg-amber-300',
  busy: 'bg-rose-400',
  dnd: 'bg-rose-400',
  offline: 'bg-slate-500',
};

export default function LunaMessageFriendsPanel() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const { data: friends = [], isLoading } = useQuery({
    queryKey: ['luna-message-friends', user?.id],
    queryFn: () => base44.entities.Friend.filter({ user_id: user.id }, '-favorite', 250),
    enabled: Boolean(user?.id),
    staleTime: 15000,
    refetchInterval: 15000,
  });

  const { data: inbox = {} } = useQuery({
    queryKey: ['luna-message-friend-inbox', user?.id],
    queryFn: async () => {
      const response = await base44.functions.invoke('socialActions', { action: 'get_inbox', data: {} });
      const body = response?.data ?? response ?? {};
      if (body?.error) throw new Error(body.error);
      return body;
    },
    enabled: Boolean(user?.id),
    staleTime: 10000,
    refetchInterval: 15000,
  });

  const unreadByFriend = useMemo(() => {
    const map = new Map();
    (inbox.conversations || []).forEach((conversation) => {
      map.set(String(conversation.partner_id), Number(conversation.unread_count || 0));
    });
    return map;
  }, [inbox.conversations]);

  const visibleFriends = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return [...(friends || [])]
      .sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || String(a.friend_name || '').localeCompare(String(b.friend_name || '')))
      .filter((friend) => !needle || `${friend.friend_name || ''} ${friend.current_game || ''} ${friend.status || ''}`.toLowerCase().includes(needle));
  }, [friends, search]);

  const openFriend = (friend) => {
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

  return (
    <aside
      aria-label="Message friends"
      className="relative flex h-full min-h-0 w-full flex-col overflow-hidden border-r border-white/[0.08] text-white"
      style={{
        background: 'linear-gradient(180deg, rgba(19,31,47,.78), rgba(10,18,29,.72))',
        backdropFilter: 'blur(20px) saturate(125%)',
        WebkitBackdropFilter: 'blur(20px) saturate(125%)',
      }}
    >
      <header className="shrink-0 border-b border-white/[0.07] px-4 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-cyan-100/70" />
          <div>
            <p className="text-[7px] font-black uppercase tracking-[0.18em] text-cyan-100/45">Social</p>
            <h2 className="text-sm font-semibold text-white">Friends</h2>
          </div>
          <span className="ml-auto text-[8px] font-semibold text-white/40">{friends.length}</span>
        </div>

        <label className="mt-3 flex h-8 items-center gap-2 border border-white/[0.08] bg-black/15 px-2.5 focus-within:border-cyan-200/20">
          <Search className="h-3 w-3 text-white/30" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search friends"
            className="min-w-0 flex-1 bg-transparent text-[9px] text-white outline-none placeholder:text-white/28"
          />
        </label>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-2 [scrollbar-width:thin]">
        {isLoading ? (
          <div className="py-10 text-center text-[9px] text-white/35">Loading friends…</div>
        ) : visibleFriends.length ? (
          visibleFriends.map((friend) => {
            const unread = unreadByFriend.get(String(friend.friend_id)) || 0;
            return (
              <button
                key={friend.friend_id}
                type="button"
                onClick={() => openFriend(friend)}
                className="mb-1 flex w-full items-center gap-2.5 border border-transparent px-2.5 py-2 text-left transition-colors hover:border-white/[0.07] hover:bg-white/[0.045]"
              >
                <div className="relative h-9 w-9 shrink-0 overflow-hidden border border-white/[0.08] bg-white/[0.05]">
                  {friend.friend_avatar
                    ? <img src={friend.friend_avatar} alt="" className="h-full w-full object-cover" />
                    : <div className="grid h-full place-items-center"><UserRound className="h-4 w-4 text-white/35" /></div>}
                  <span className={`absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full ring-2 ring-slate-900 ${statusTone[friend.status] || statusTone.offline}`} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`truncate text-[10px] font-semibold ${unread ? 'text-white' : 'text-white/78'}`}>{friend.friend_name || 'Friend'}</p>
                  <p className="mt-0.5 truncate text-[7px] text-white/35">{friend.current_game || friend.status || 'offline'}</p>
                </div>

                {unread > 0 && (
                  <span className="grid min-h-[17px] min-w-[17px] place-items-center rounded-full bg-cyan-300 px-1 text-[6px] font-black text-slate-950">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </button>
            );
          })
        ) : (
          <div className="px-3 py-10 text-center text-[9px] leading-5 text-white/35">
            {search ? 'No friends match that search.' : 'Your friends will appear here.'}
          </div>
        )}
      </div>
    </aside>
  );
}
