import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Check, Eye, Gamepad2, MessageSquare, Mic, Search, UserPlus, Users, Video, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import FriendMessenger from '../friends/FriendMessenger';

const unwrap = (result) => result?.data ?? result ?? {};
const STATUS_COLOR = { online:'bg-green-400', playing:'bg-purple-400', away:'bg-amber-400', busy:'bg-red-400', offline:'bg-slate-600' };

export default function FriendsDropdown() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('friends');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMessenger, setShowMessenger] = useState(false);
  const [pendingActionId, setPendingActionId] = useState(null);

  const friendsQuery = useQuery({
    queryKey:['luna-friends', user?.id], enabled:Boolean(user?.id), staleTime:10000,
    queryFn: async () => unwrap(await base44.functions.invoke('socialActions', { action:'list_friends', data:{} })).friends || [],
  });
  const pendingQuery = useQuery({
    queryKey:['luna-social-pending', user?.id], enabled:Boolean(user?.id), staleTime:5000,
    queryFn: async () => unwrap(await base44.functions.invoke('socialActions', { action:'get_pending_actions', data:{} })),
  });
  const partyQuery = useQuery({
    queryKey:['luna-party-state', user?.id], enabled:Boolean(user?.id), staleTime:5000,
    queryFn: async () => unwrap(await base44.functions.invoke('partySystem', { action:'get_state', data:{} })).party || null,
  });

  const friends = friendsQuery.data || [];
  const requests = pendingQuery.data?.friend_requests || [];
  const filteredFriends = useMemo(() => friends.filter(friend => String(friend.friend_name || '').toLowerCase().includes(searchQuery.trim().toLowerCase())), [friends, searchQuery]);
  const refresh = () => { queryClient.invalidateQueries({queryKey:['luna-friends',user?.id]}); queryClient.invalidateQueries({queryKey:['luna-social-pending',user?.id]}); };

  const respondRequest = async (request, decision) => {
    const key = `${decision}:${request.id}`; setPendingActionId(key);
    try { await base44.functions.invoke('socialActions', { action:'respond_friend_request', data:{ request_id:request.id, decision } }); refresh(); }
    finally { setPendingActionId(null); }
  };
  const inviteDashboard = async (friend) => {
    const key = `dashboard:${friend.friend_id}`; setPendingActionId(key);
    try { await base44.functions.invoke('socialActions', { action:'send_dashboard_invite', data:{ target_user_id:friend.friend_id } }); }
    finally { setPendingActionId(null); }
  };
  const inviteParty = async (friend) => {
    const key = `party:${friend.friend_id}`; setPendingActionId(key);
    try { await base44.functions.invoke('partySystem', { action:'invite_member', data:{ inviteeId:friend.friend_id } }); queryClient.invalidateQueries({queryKey:['luna-party-state',user?.id]}); }
    finally { setPendingActionId(null); }
  };
  const joinDashboard = async (friend) => {
    const body = unwrap(await base44.functions.invoke('socialActions', { action:'get_dashboard_join', data:{ target_user_id:friend.friend_id } }));
    if (!body.channel_id) return;
    window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', { detail:{ channelId:body.channel_id, hostId:friend.friend_id, hostName:friend.friend_name } }));
  };

  if (showMessenger && selectedFriend) return <FriendMessenger friend={selectedFriend} onClose={() => setShowMessenger(false)} />;

  return <div className="flex h-full w-full flex-col overflow-hidden bg-transparent text-white">
    <div className="flex shrink-0 items-center gap-1 px-3 pb-1 pt-2">
      {[
        ['friends','Friends',friends.filter(friend => (friend.presence_status || friend.status) !== 'offline').length],
        ['requests','Requests',requests.length],
        ['party','Party',partyQuery.data?.members?.length || partyQuery.data?.member_ids?.length || 0],
      ].map(([id,label,count]) => <button key={id} onClick={() => setActiveTab(id)} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${activeTab===id?'border-white/15 bg-white/10 text-white':'border-transparent text-white/40 hover:text-white/70'}`}>{label}{Number(count)>0&&<span className="ml-1.5 rounded-full bg-white/10 px-1.5 py-0.5 text-[9px]">{count}</span>}</button>)}
      {activeTab==='friends'&&<div className="relative ml-auto"><Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-white/30"/><input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search…" className="w-28 rounded-full border border-white/5 bg-black/20 py-1 pl-6 pr-2 text-[10px] text-white/80 outline-none"/></div>}
    </div>

    <div className="min-h-0 flex-1 overflow-y-auto px-2 py-1" style={{scrollbarWidth:'none'}}>
      {activeTab==='friends'&&<>
        {friendsQuery.isLoading&&<p className="p-4 text-center text-xs text-white/35">Loading friends…</p>}
        {!friendsQuery.isLoading&&!filteredFriends.length&&<p className="p-5 text-center text-xs text-white/30">No friends yet.</p>}
        {filteredFriends.map(friend => {
          const status = friend.presence_status || friend.status || 'offline';
          const selected = selectedFriend?.friend_id === friend.friend_id;
          return <motion.div key={friend.id || friend.friend_id} layout className={`mb-1 rounded-xl border ${selected?'border-cyan-300/20 bg-cyan-300/[0.06]':'border-white/[0.05] bg-white/[0.025]'}`}>
            <button className="flex w-full items-center gap-3 p-2.5 text-left" onClick={() => setSelectedFriend(selected?null:friend)}>
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/5">{friend.friend_avatar&&<img src={friend.friend_avatar} alt="" className="h-full w-full object-cover"/>}<span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-slate-950 ${STATUS_COLOR[status]||STATUS_COLOR.offline}`}/></div>
              <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-white/85">{friend.friend_name}</p><p className="truncate text-[10px] text-white/35">{friend.current_game || (status==='offline'?'Offline':'Online')}</p></div>
              {friend.current_game&&<Gamepad2 className="h-3.5 w-3.5 text-cyan-300/60"/>}
            </button>
            {selected&&<div className="grid grid-cols-4 gap-1 border-t border-white/[0.05] p-2">
              <button onClick={()=>setShowMessenger(true)} className="rounded-lg bg-white/[0.04] p-2 text-center text-[9px] text-white/60 hover:bg-white/[0.08]"><MessageSquare className="mx-auto mb-1 h-3.5 w-3.5"/>Message</button>
              <button onClick={()=>inviteParty(friend)} disabled={pendingActionId===`party:${friend.friend_id}`} className="rounded-lg bg-white/[0.04] p-2 text-center text-[9px] text-white/60 hover:bg-white/[0.08]"><Users className="mx-auto mb-1 h-3.5 w-3.5"/>Party</button>
              <button onClick={()=>inviteDashboard(friend)} disabled={pendingActionId===`dashboard:${friend.friend_id}`} className="rounded-lg bg-white/[0.04] p-2 text-center text-[9px] text-white/60 hover:bg-white/[0.08]"><UserPlus className="mx-auto mb-1 h-3.5 w-3.5"/>Invite</button>
              <button onClick={()=>joinDashboard(friend)} className="rounded-lg bg-white/[0.04] p-2 text-center text-[9px] text-white/60 hover:bg-white/[0.08]"><Eye className="mx-auto mb-1 h-3.5 w-3.5"/>Join</button>
            </div>}
          </motion.div>;
        })}
      </>}

      {activeTab==='requests'&&<>
        {pendingQuery.isLoading&&<p className="p-4 text-center text-xs text-white/35">Loading requests…</p>}
        {!pendingQuery.isLoading&&!requests.length&&<p className="p-5 text-center text-xs text-white/30">No pending friend requests.</p>}
        {requests.map(request=><div key={request.id} className="mb-1 flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.025] p-3"><div className="h-9 w-9 overflow-hidden rounded-full bg-white/5">{request.sender_avatar&&<img src={request.sender_avatar} alt="" className="h-full w-full object-cover"/>}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{request.sender_name}</p><p className="text-[10px] text-white/35">Friend request</p></div><button title="Accept" disabled={pendingActionId===`accept:${request.id}`} onClick={()=>respondRequest(request,'accept')} className="rounded-lg bg-emerald-500/10 p-2 text-emerald-200"><Check className="h-3.5 w-3.5"/></button><button title="Decline" disabled={pendingActionId===`decline:${request.id}`} onClick={()=>respondRequest(request,'decline')} className="rounded-lg bg-red-500/10 p-2 text-red-200"><X className="h-3.5 w-3.5"/></button></div>)}
      </>}

      {activeTab==='party'&&<div className="p-3">{partyQuery.data?<><p className="text-[10px] font-black uppercase tracking-[.18em] text-white/30">Current party</p><div className="mt-2 space-y-1">{(partyQuery.data.members||[]).map(member=><div key={member.user_id||member.id} className="rounded-lg border border-white/[0.05] bg-white/[0.025] px-3 py-2 text-xs text-white/70">{member.name||member.display_name||member.user_name||member.user_id}</div>)}</div></>:<p className="text-center text-xs text-white/30">No active party.</p>}</div>}
    </div>
  </div>;
}
