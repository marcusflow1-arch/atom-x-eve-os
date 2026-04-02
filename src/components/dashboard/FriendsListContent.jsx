import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MessageSquare, Gamepad2, Circle, MoreHorizontal, Shield, Star, Heart, Trophy, Globe, UserPlus } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';


export default function FriendsListContent() {
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [activeTab, setActiveTab] = useState('friends');
  const [invitingUserId, setInvitingUserId] = useState(null);
  const [invitedUsers, setInvitedUsers] = useState({});
  const { user } = useAuth();

  const { data: globalUsers = [] } = useQuery({
    queryKey: ['globalUsers', user?.id],
    queryFn: async () => {
      const res = await base44.entities.PlayerState.list();
      return res
        .filter(p => p.player_id !== user?.id)
        .map(p => ({
          id: p.player_id,
          friend_name: p.display_name || 'Unknown Player',
          status: p.status || 'online',
          current_game: (p.channel_id && p.channel_id.startsWith('dashboard_')) ? 'Dashboard' : p.channel_id,
          friend_avatar: p.avatar_url || '',
          bio: 'Online Player',
          level: 1,
          modelUrl: p.model_url || '',
          envUrl: p.env_url,
          channel_id: p.channel_id
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

  const handleInviteToDashboard = (userObj) => {
    setInvitingUserId(userObj.id);
    setTimeout(() => {
      setInvitingUserId(null);
      setInvitedUsers(prev => ({ ...prev, [userObj.id]: 'accepted' }));
      
      // Simulate them inviting YOU back for demo purposes
      setTimeout(() => {
         window.dispatchEvent(new CustomEvent('incomingInvite', {
            detail: { fromUser: userObj }
         }));
      }, 1000);
      
      // Send invite - they join our local world instance
      window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', {
        detail: { channelId: `dashboard_${user?.id || 'local'}`, hostId: user?.id }
      }));
    }, 2000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const displayList = activeTab === 'friends' ? friends : globalUsers;

  const handleJoin = (userObj) => {
    // Switch environment to match the host
    if (userObj.envUrl) {
      window.dispatchEvent(new CustomEvent('changeEnvironment', {
        detail: { envUrl: userObj.envUrl }
      }));
    }

    const targetChannel = userObj.channel_id || `dashboard_${userObj.id}`;
    let targetHostId = userObj.id;
    if (targetChannel.startsWith('dashboard_')) {
      targetHostId = targetChannel.replace('dashboard_', '');
    } else if (targetChannel.startsWith('world_instance_')) {
      targetHostId = targetChannel.replace('world_instance_', '');
    }

    // Connect to their specific multiplayer world instance channel
    window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', {
      detail: { channelId: targetChannel, hostId: targetHostId }
    }));
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-900/50 rounded-xl border border-white/10">
      {/* Left List */}
      <div className="w-1/3 border-r border-white/10 flex flex-col bg-black/20">
        <div className="p-4 border-b border-white/10">
          <div className="flex bg-white/5 rounded-lg p-1 mb-2">
            <button 
              onClick={() => { setActiveTab('friends'); setSelectedFriend(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'friends' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/50 hover:text-white'}`}
            >
              Friends
            </button>
            <button 
              onClick={() => { setActiveTab('global'); setSelectedFriend(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'global' ? 'bg-purple-500/20 text-purple-400' : 'text-white/50 hover:text-white'}`}
            >
              Global Online
            </button>
          </div>
          <h3 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 px-1">
            {activeTab === 'friends' ? <User className="w-3.5 h-3.5 text-blue-400" /> : <Globe className="w-3.5 h-3.5 text-purple-400" />}
            {activeTab === 'friends' ? `Friends (${friends.length})` : `Online (${globalUsers.length})`}
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {displayList.map((friend) => (
            <button
              key={friend.id}
              onClick={() => {
                setSelectedFriend(friend);
                if (activeTab === 'global') handleJoin(friend);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                selectedFriend?.id === friend.id 
                  ? 'bg-white/10 border border-white/10 shadow-lg' 
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="relative">
                <Avatar className="w-10 h-10 border border-white/10">
                  <AvatarImage src={friend.friend_avatar} />
                  <AvatarFallback>{friend.friend_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${getStatusColor(friend.status)}`} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className={`text-sm font-medium truncate ${selectedFriend?.id === friend.id ? 'text-white' : 'text-white/80'}`}>
                  {friend.friend_name}
                </p>
                <p className="text-xs text-white/40 truncate">
                  {friend.current_game ? (
                    <span className="text-blue-300">{friend.current_game}</span>
                  ) : (
                    <span className="capitalize">{friend.status}</span>
                  )}
                </p>
              </div>
            </button>
          ))}
          {displayList.length === 0 && (
            <div className="p-3 text-xs text-white/40 text-left">
              {activeTab === 'friends' ? 'No real friends found yet.' : 'No live players found right now.'}
            </div>
          )}
        </div>
      </div>

      {/* Right Profile Overview */}
      <div className="flex-1 bg-gradient-to-br from-slate-900/50 to-slate-800/50 relative overflow-hidden flex flex-col">
        {selectedFriend ? (
          <motion.div 
            key={selectedFriend.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col h-full"
          >
            {/* Header / Banner */}
            <div className="h-32 bg-gradient-to-r from-blue-600/20 to-purple-600/20 relative">
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute bottom-4 right-4 flex gap-2">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full bg-black/40 hover:bg-black/60 text-white">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Profile Info */}
            <div className="px-6 relative flex-1 overflow-y-auto">
              {/* Avatar overlap */}
              <div className="-mt-12 mb-4 flex justify-between items-end">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-slate-900 shadow-xl">
                    <AvatarImage src={selectedFriend.friend_avatar} />
                    <AvatarFallback className="text-2xl">{selectedFriend.friend_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-slate-900 ${getStatusColor(selectedFriend.status)}`} />
                </div>
                <div className="flex gap-2 mb-1">
                  {activeTab === 'global' ? (
                    <>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); handleInviteToDashboard(selectedFriend); }}
                        className="border-white/20 text-white hover:bg-white/10 px-2"
                        title="Send Invite"
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleJoin(selectedFriend)}
                        className="bg-purple-600 hover:bg-purple-500 text-white gap-2"
                      >
                        <UserPlus className="w-4 h-4" /> Join Channel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white gap-2">
                        <MessageSquare className="w-4 h-4" /> Message
                      </Button>
                      <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10 gap-2">
                        <User className="w-4 h-4" /> Profile
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  {selectedFriend.friend_name}
                  <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/20 ml-2">
                    Lvl {selectedFriend.level || 1}
                  </Badge>
                </h2>
                <p className="text-white/50 text-sm mt-1">{selectedFriend.bio || 'No bio available'}</p>
              </div>

              {/* Status / Activity */}
              <div className="space-y-6">
                {selectedFriend.current_game && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Gamepad2 className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-white/40 uppercase font-bold">Playing Now</p>
                      <p className="text-white font-semibold">{selectedFriend.current_game}</p>
                    </div>
                    <Button onClick={() => handleJoin(selectedFriend)} size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 text-white">
                      Join
                    </Button>
                  </div>
                )}

                {/* Stats Grid */}
                <div>
                  <h4 className="text-xs font-bold text-white/40 uppercase mb-3">Overview</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="flex items-center gap-2 text-purple-400 mb-1">
                        <Trophy className="w-4 h-4" />
                        <span className="text-xs font-bold">Achievements</span>
                      </div>
                      <p className="text-xl font-bold text-white">1,240</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="flex items-center gap-2 text-green-400 mb-1">
                        <Shield className="w-4 h-4" />
                        <span className="text-xs font-bold">Reputation</span>
                      </div>
                      <p className="text-xl font-bold text-white">Elite</p>
                    </div>
                  </div>
                </div>

                {/* Badges/Tags */}
                <div>
                  <h4 className="text-xs font-bold text-white/40 uppercase mb-3">Badges</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-white/5 hover:bg-white/10 text-white border-white/10">Early Adopter</Badge>
                    <Badge className="bg-white/5 hover:bg-white/10 text-white border-white/10">Beta Tester</Badge>
                    <Badge className="bg-white/5 hover:bg-white/10 text-white border-white/10">Streamer</Badge>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/30 p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <User className="w-10 h-10 opacity-50" />
            </div>
            <h3 className="text-lg font-bold text-white/50">Select a Friend</h3>
            <p className="text-sm max-w-xs mt-2">View profile details, current activity, and stats.</p>
          </div>
        )}
      </div>
    </div>
  );
}