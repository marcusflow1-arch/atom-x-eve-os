import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { User, MessageSquare, Gamepad2, MoreHorizontal, Shield, Trophy, Globe, UserPlus } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { showError, showSuccess } from '@/components/error/ErrorToast';
import FriendMessengerPanel from '@/components/friends/FriendMessengerPanel';

const BODY_WIDTH = 0.9;
const SAFE_STAGE = { minX: -1.35, maxX: 1.35, minZ: -0.55, maxZ: 0.55 };
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : 0));
const playerIdFor = (userObj) => String(userObj?.friend_id || userObj?.player_id || userObj?.id || '').trim();

export default function FriendsListContent() {
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [activeTab, setActiveTab] = useState('friends');
  const [invitingUserId, setInvitingUserId] = useState(null);
  const [invitedUsers, setInvitedUsers] = useState({});
  const [messageTarget, setMessageTarget] = useState(null);
  const [joiningUserId, setJoiningUserId] = useState(null);
  const { user } = useAuth();

  const { data: globalUsers = [] } = useQuery({
    queryKey: ['globalUsers', user?.id],
    queryFn: async () => {
      const res = await base44.entities.PlayerState.list();
      const latestByPlayer = new Map();
      (res || []).forEach((p) => {
        if (!p?.player_id || p.player_id === user?.id) return;
        const previous = latestByPlayer.get(p.player_id);
        if (!previous || Number(p.last_update || 0) > Number(previous.last_update || 0)) latestByPlayer.set(p.player_id, p);
      });
      return [...latestByPlayer.values()].map((p) => ({
        id: p.player_id,
        player_id: p.player_id,
        friend_id: p.player_id,
        friend_name: p.display_name || 'Unknown Player',
        status: p.status || 'online',
        current_game: (p.channel_id && p.channel_id.startsWith('dashboard_')) ? 'Dashboard' : p.channel_id,
        friend_avatar: p.avatar_url || '',
        bio: 'Online Player',
        level: 1,
        modelUrl: p.model_url || '',
        envUrl: p.env_url,
        channel_id: p.channel_id,
        x: p.x,
        y: p.y,
        z: p.z,
        yaw: p.yaw,
        last_update: p.last_update,
      }));
    },
    enabled: !!user?.id,
    refetchInterval: 5000
  });

  const { data: friends = [] } = useQuery({
    queryKey: ['friends', user?.id],
    queryFn: async () => base44.entities.Friend.filter({ user_id: user.id }),
    enabled: !!user?.id,
    refetchInterval: 5000
  });

  const {
    data: incomingDashboardInvites = [],
    refetch: refetchDashboardInvites,
  } = useQuery({
    queryKey: ['lunarDashboardRequests', user?.id],
    queryFn: async () => {
      const rows = await base44.entities.LunarDashboardRequest.filter({
        target_user_id: user.id,
        status: 'pending',
      });
      return (rows || [])
        .filter((row) => row.request_type === 'invite')
        .sort((a, b) => new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime());
    },
    enabled: !!user?.id,
    refetchInterval: 3000,
  });

  const handleInviteToDashboard = async (userObj) => {
    const targetId = playerIdFor(userObj);
    if (!targetId || !user?.id || targetId === String(user.id)) return;

    setInvitingUserId(targetId);
    try {
      const existing = await base44.entities.LunarDashboardRequest.filter({
        request_type: 'invite',
        requester_id: user.id,
        target_user_id: targetId,
        host_user_id: user.id,
        status: 'pending',
      });

      if (!(existing || []).length) {
        await base44.entities.LunarDashboardRequest.create({
          request_type: 'invite',
          requester_id: user.id,
          requester_name: user.full_name || user.username || user.email?.split('@')?.[0] || 'Friend',
          target_user_id: targetId,
          host_user_id: user.id,
          status: 'pending',
        });
      }

      setInvitedUsers((prev) => ({ ...prev, [targetId]: 'sent' }));
      showSuccess(`Dashboard invite sent to ${userObj.friend_name || userObj.display_name || 'player'}.`);
    } catch (error) {
      showError(error, 'Dashboard Invite');
    } finally {
      setInvitingUserId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle':
      case 'away': return 'bg-yellow-500';
      case 'dnd':
      case 'busy': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const displayList = activeTab === 'friends' ? friends : globalUsers;

  const resolveLivePlayer = async (userObj) => {
    const targetPlayerId = playerIdFor(userObj);
    let liveState = null;
    try {
      const states = await base44.entities.PlayerState.filter({ player_id: targetPlayerId });
      liveState = (states || []).slice().sort((a, b) => Number(b.last_update || 0) - Number(a.last_update || 0))[0] || null;
    } catch (error) {
      console.warn('Could not resolve live friend state; using saved dashboard state.', error);
    }
    return { targetPlayerId, liveState };
  };

  const buildSafeCompanionSpawn = (hostState) => {
    const hostX = clamp(hostState?.x, -0.42, 0.42);
    const hostZ = clamp(hostState?.z, SAFE_STAGE.minZ, SAFE_STAGE.maxZ);
    const right = hostX + BODY_WIDTH;
    const left = hostX - BODY_WIDTH;
    const x = right <= SAFE_STAGE.maxX ? right : left >= SAFE_STAGE.minX ? left : clamp(right, SAFE_STAGE.minX, SAFE_STAGE.maxX);
    return {
      x,
      y: Number.isFinite(Number(hostState?.y)) ? Number(hostState.y) : -0.5,
      z: hostZ,
      yaw: Number.isFinite(Number(hostState?.yaw)) ? Number(hostState.yaw) : 0,
      anim: 'idle',
      hostPosition: { x: hostX, y: Number(hostState?.y ?? -0.5), z: hostZ },
      bodyWidth: BODY_WIDTH,
      safeStage: SAFE_STAGE,
    };
  };

  const handleJoin = async (userObj) => {
    const immediateId = playerIdFor(userObj);
    if (!immediateId || !user?.id || immediateId === String(user.id)) return;

    setJoiningUserId(immediateId);
    try {
      const { targetPlayerId, liveState } = await resolveLivePlayer(userObj);
      if (!targetPlayerId) throw new Error('This player does not have a dashboard ID yet.');

      // "Join Dashboard" must always target the friend's personal Luna home.
      // The previous implementation followed whatever live channel the friend was
      // currently in, which could send visitors into a game/world/other dashboard.
      const targetChannel = `dashboard_${targetPlayerId}`;
      const dashboardState = liveState?.channel_id === targetChannel ? liveState : null;
      const knownDashboardState = userObj?.channel_id === targetChannel ? userObj : null;
      const envUrl = dashboardState?.env_url || knownDashboardState?.envUrl || '';

      // Only pre-apply an environment when it is known to belong to the target
      // dashboard. MultiplayerSystem remains responsible for resolving the host's
      // saved AvatarHomeState when they are offline or currently somewhere else.
      if (envUrl) {
        window.dispatchEvent(new CustomEvent('changeEnvironment', { detail: { envUrl } }));
      }

      const spawn = buildSafeCompanionSpawn(dashboardState);
      window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', {
        detail: {
          channelId: targetChannel,
          hostId: targetPlayerId,
          hostName: userObj.friend_name || userObj.display_name || liveState?.display_name || 'Friend',
          socialJoin: true,
          companionSpawn: spawn,
        }
      }));

      window.dispatchEvent(new CustomEvent('dashboardJoinSpawn', {
        detail: { hostId: targetPlayerId, position: spawn }
      }));

      showSuccess(`Joining ${userObj.friend_name || userObj.display_name || 'friend'}'s dashboard.`);
    } catch (error) {
      showError(error, 'Join Dashboard');
    } finally {
      setJoiningUserId(null);
    }
  };

  const acceptDashboardInvite = async (request) => {
    try {
      await base44.entities.LunarDashboardRequest.update(request.id, { status: 'accepted' });
      await refetchDashboardInvites();
      await handleJoin({
        friend_id: request.host_user_id,
        player_id: request.host_user_id,
        friend_name: request.requester_name || 'Friend',
      });
    } catch (error) {
      showError(error, 'Accept Dashboard Invite');
    }
  };

  const declineDashboardInvite = async (request) => {
    try {
      await base44.entities.LunarDashboardRequest.update(request.id, { status: 'declined' });
      await refetchDashboardInvites();
    } catch (error) {
      showError(error, 'Decline Dashboard Invite');
    }
  };

  const openMessages = (userObj) => {
    const targetId = playerIdFor(userObj);
    setMessageTarget({
      ...userObj,
      friend_id: targetId,
      friend_name: userObj.friend_name || userObj.display_name || 'Player',
      friend_avatar: userObj.friend_avatar || userObj.avatar_url || '',
    });
  };

  const pendingInvite = incomingDashboardInvites[0];
  const selectedId = playerIdFor(selectedFriend);

  return (
    <>
      <div
        data-dashboard-quick-control="friends-workspace"
        className="relative flex h-full w-full overflow-hidden bg-slate-900/50 rounded-xl border border-white/10"
      >
        {pendingInvite && (
          <div className="absolute left-1/3 right-0 top-0 z-30 flex min-h-14 items-center gap-3 border-b border-cyan-300/15 bg-[#07111d]/95 px-5 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.28)]">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300/70">Dashboard Invite</p>
              <p className="truncate text-sm text-white/85">{pendingInvite.requester_name || 'A friend'} invited you to their Luna dashboard.</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => declineDashboardInvite(pendingInvite)} className="h-8 text-white/55 hover:bg-white/10 hover:text-white">Decline</Button>
            <Button size="sm" onClick={() => acceptDashboardInvite(pendingInvite)} className="h-8 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30">Join</Button>
          </div>
        )}

        <div className="w-1/3 border-r border-white/10 flex flex-col bg-black/20">
          <div className="p-4 border-b border-white/10">
            <div className="flex bg-white/5 rounded-lg p-1 mb-2">
              <button onClick={() => { setActiveTab('friends'); setSelectedFriend(null); }} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'friends' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/50 hover:text-white'}`}>Friends</button>
              <button onClick={() => { setActiveTab('global'); setSelectedFriend(null); }} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'global' ? 'bg-purple-500/20 text-purple-400' : 'text-white/50 hover:text-white'}`}>Global Online</button>
            </div>
            <h3 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 px-1">
              {activeTab === 'friends' ? <User className="w-3.5 h-3.5 text-blue-400" /> : <Globe className="w-3.5 h-3.5 text-purple-400" />}
              {activeTab === 'friends' ? `Friends (${friends.length})` : `Online (${globalUsers.length})`}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {displayList.map((friend) => {
              const friendKey = playerIdFor(friend) || friend.id;
              return (
                <button key={`${activeTab}-${friendKey}`} onClick={() => setSelectedFriend(friend)} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${playerIdFor(selectedFriend) === playerIdFor(friend) ? 'bg-white/10 border border-white/10 shadow-lg' : 'hover:bg-white/5 border border-transparent'}`}>
                  <div className="relative">
                    <Avatar className="w-10 h-10 border border-white/10"><AvatarImage src={friend.friend_avatar || friend.avatar_url} /><AvatarFallback>{friend.friend_name?.[0] || friend.display_name?.[0]}</AvatarFallback></Avatar>
                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${getStatusColor(friend.status)}`} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className={`text-sm font-medium truncate ${playerIdFor(selectedFriend) === playerIdFor(friend) ? 'text-white' : 'text-white/80'}`}>{friend.friend_name || friend.display_name || 'Player'}</p>
                    <p className="text-xs text-white/40 truncate">{friend.current_game ? <span className="text-blue-300">{friend.current_game}</span> : <span className="capitalize">{friend.status || 'offline'}</span>}</p>
                  </div>
                </button>
              );
            })}
            {displayList.length === 0 && <div className="p-3 text-xs text-white/40 text-left">{activeTab === 'friends' ? 'No real friends found yet.' : 'No live players found right now.'}</div>}
          </div>
        </div>

        <div className={`flex-1 bg-gradient-to-br from-slate-900/50 to-slate-800/50 relative overflow-hidden flex flex-col ${pendingInvite ? 'pt-14' : ''}`}>
          {selectedFriend ? (
            <motion.div key={`${activeTab}-${selectedId}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="flex-1 flex flex-col h-full">
              <div className="h-32 bg-gradient-to-r from-blue-600/20 to-purple-600/20 relative"><div className="absolute inset-0 bg-black/20" /><div className="absolute bottom-4 right-4 flex gap-2"><Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full bg-black/40 hover:bg-black/60 text-white"><MoreHorizontal className="w-4 h-4" /></Button></div></div>
              <div className="px-6 relative flex-1 overflow-y-auto">
                <div className="-mt-12 mb-4 flex justify-between items-end">
                  <div className="relative"><Avatar className="w-24 h-24 border-4 border-slate-900 shadow-xl"><AvatarImage src={selectedFriend.friend_avatar || selectedFriend.avatar_url} /><AvatarFallback className="text-2xl">{selectedFriend.friend_name?.[0] || selectedFriend.display_name?.[0]}</AvatarFallback></Avatar><div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-slate-900 ${getStatusColor(selectedFriend.status)}`} /></div>
                  <div className="flex flex-wrap justify-end gap-2 mb-1">
                    <Button size="sm" variant="outline" onClick={() => handleInviteToDashboard(selectedFriend)} disabled={invitingUserId === selectedId || invitedUsers[selectedId] === 'sent'} className="border-white/20 text-white hover:bg-white/10 px-2 disabled:opacity-50" title="Invite to my dashboard"><UserPlus className="w-4 h-4" />{invitingUserId === selectedId ? '…' : invitedUsers[selectedId] === 'sent' ? 'Sent' : 'Invite'}</Button>
                    <Button size="sm" onClick={() => openMessages(selectedFriend)} className="bg-blue-600 hover:bg-blue-500 text-white gap-2"><MessageSquare className="w-4 h-4" /> Message</Button>
                    <Button size="sm" onClick={() => handleJoin(selectedFriend)} disabled={joiningUserId === selectedId} className="bg-purple-600 hover:bg-purple-500 text-white gap-2 disabled:opacity-50"><UserPlus className="w-4 h-4" /> {joiningUserId === selectedId ? 'Joining…' : 'Join Dashboard'}</Button>
                  </div>
                </div>

                <div className="mb-6"><h2 className="text-2xl font-bold text-white flex items-center gap-2">{selectedFriend.friend_name || selectedFriend.display_name}<Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/20 ml-2">Lvl {selectedFriend.level || 1}</Badge></h2><p className="text-white/50 text-sm mt-1">{selectedFriend.bio || 'No bio available'}</p></div>

                <div className="space-y-6">
                  {selectedFriend.current_game && <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4"><div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center"><Gamepad2 className="w-6 h-6 text-blue-400" /></div><div className="flex-1"><p className="text-xs text-white/40 uppercase font-bold">Playing Now</p><p className="text-white font-semibold">{selectedFriend.current_game}</p></div><Button onClick={() => handleJoin(selectedFriend)} size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 text-white">Dashboard</Button></div>}
                  <div><h4 className="text-xs font-bold text-white/40 uppercase mb-3">Overview</h4><div className="grid grid-cols-2 gap-3"><div className="p-3 rounded-lg bg-white/5 border border-white/5"><div className="flex items-center gap-2 text-purple-400 mb-1"><Trophy className="w-4 h-4" /><span className="text-xs font-bold">Achievements</span></div><p className="text-xl font-bold text-white">1,240</p></div><div className="p-3 rounded-lg bg-white/5 border border-white/5"><div className="flex items-center gap-2 text-green-400 mb-1"><Shield className="w-4 h-4" /><span className="text-xs font-bold">Reputation</span></div><p className="text-xl font-bold text-white">Elite</p></div></div></div>
                  <div><h4 className="text-xs font-bold text-white/40 uppercase mb-3">Badges</h4><div className="flex flex-wrap gap-2"><Badge className="bg-white/5 hover:bg-white/10 text-white border-white/10">Early Adopter</Badge><Badge className="bg-white/5 hover:bg-white/10 text-white border-white/10">Beta Tester</Badge><Badge className="bg-white/5 hover:bg-white/10 text-white border-white/10">Streamer</Badge></div></div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-white/30 p-8 text-center"><div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4"><User className="w-10 h-10 opacity-50" /></div><h3 className="text-lg font-bold text-white/50">Select a Friend</h3><p className="text-sm max-w-xs mt-2">View profile details, message them, invite them over, or join their dashboard.</p></div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {messageTarget && <FriendMessengerPanel friend={messageTarget} currentUserId={user?.id} onClose={() => setMessageTarget(null)} />}
      </AnimatePresence>
    </>
  );
}
