import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Users, UserPlus, ChevronDown, ChevronUp, Check, XCircle, Trophy, Gamepad2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../auth/AuthContext';
import MiniAvatarViewer from './MiniAvatarViewer';
import MiniAchievementCard from './MiniAchievementCard';

export default function FriendsHubOverlay({ onClose }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFriendRequests, setShowFriendRequests] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    friends: 0,
    gamesMostPlayed: 0,
    friendsCurrentlyPlaying: 0,
    friendsOnline: 0
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Load friends
      const friendsList = await base44.entities.Friend.filter({ user_id: user.id });
      setFriends(friendsList);

      // Load friend requests
      const requests = await base44.entities.FriendRequest.filter({ 
        receiver_id: user.id, 
        status: 'pending' 
      });
      setFriendRequests(requests);

      // Load achievements for display
      const achievementsList = await base44.entities.Achievement.list('-created_date', 20);
      setAchievements(achievementsList);

      // Load games
      const gamesList = await base44.entities.Game.list('-created_date', 10);
      setGames(gamesList);

      // Calculate stats
      const onlineFriends = friendsList.filter(f => f.status === 'online').length;
      const playingFriends = friendsList.filter(f => f.current_game).length;
      
      setStats({
        friends: friendsList.length,
        gamesMostPlayed: gamesList.length,
        friendsCurrentlyPlaying: playingFriends,
        friendsOnline: onlineFriends
      });

    } catch (error) {
      console.error('Failed to load friends data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const request = friendRequests.find(r => r.id === requestId);
      if (!request) return;

      // Update request status
      await base44.entities.FriendRequest.update(requestId, { status: 'accepted' });

      // Create friend relationship
      await base44.entities.Friend.create({
        user_id: user.id,
        friend_id: request.sender_id,
        friend_name: request.sender_name,
        friend_avatar: request.sender_avatar,
        status: 'offline'
      });

      // Reload data
      loadData();
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      await base44.entities.FriendRequest.update(requestId, { status: 'declined' });
      loadData();
    } catch (error) {
      console.error('Failed to decline friend request:', error);
    }
  };

  // Get random achievements for a friend (mock - in real app would be from UserAchievement)
  const getRandomAchievements = () => {
    return achievements.slice(0, Math.floor(Math.random() * 3) + 2);
  };

  // Get random recent games for a friend
  const getRandomGames = () => {
    return games.slice(0, Math.floor(Math.random() * 2) + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex"
    >
      {/* Background with blur */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Main Content */}
      <div className="relative z-10 w-full h-full flex">
        {/* Left Sidebar - Stats */}
        <div 
          className="w-64 h-full flex flex-col py-8 px-6"
          style={{
            background: 'linear-gradient(180deg, rgba(107, 142, 35, 0.3) 0%, rgba(85, 107, 47, 0.2) 100%)',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* User Profile */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-700">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="User" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <span className="text-white font-semibold">{user?.full_name || 'Guest'}</span>
          </div>

          {/* Stats */}
          <div className="space-y-4 flex-1">
            <div 
              onClick={() => setActiveTab('friends')}
              className={`flex justify-between items-center text-white/90 hover:bg-white/5 px-2 py-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'friends' ? 'bg-white/10' : ''}`}
            >
              <span>Friends</span>
              <span className="text-2xl font-bold">{stats.friends}</span>
            </div>
            <div 
              onClick={() => setActiveTab('games')}
              className={`flex justify-between items-center text-white/90 hover:bg-white/5 px-2 py-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'games' ? 'bg-white/10' : ''}`}
            >
              <span>Games most played</span>
              <span className="text-2xl font-bold">{stats.gamesMostPlayed}</span>
            </div>
            <div className="flex justify-between items-center text-white/90 hover:bg-white/5 px-2 py-2 rounded-lg cursor-pointer transition-colors">
              <span>Friends currently playing</span>
              <span className="text-2xl font-bold">{stats.friendsCurrentlyPlaying}</span>
            </div>
            <div className="flex justify-between items-center text-white/90 hover:bg-white/5 px-2 py-2 rounded-lg cursor-pointer transition-colors">
              <span>Friends online</span>
              <span className="text-2xl font-bold">{stats.friendsOnline}</span>
            </div>

            {/* Friend Requests Dropdown */}
            <div className="mt-6">
              <button 
                onClick={() => setShowFriendRequests(!showFriendRequests)}
                className="w-full flex items-center justify-between text-white/70 px-2 py-2 rounded-lg cursor-pointer hover:text-white hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-cyan-400" />
                  <span>Friend requests</span>
                </div>
                <div className="flex items-center gap-2">
                  {friendRequests.length > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {friendRequests.length}
                    </span>
                  )}
                  {showFriendRequests ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Friend Requests Dropdown Content */}
              <AnimatePresence>
                {showFriendRequests && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                      {friendRequests.length === 0 ? (
                        <p className="text-white/40 text-sm px-2 py-4 text-center">No pending requests</p>
                      ) : (
                        friendRequests.map((request) => (
                          <div 
                            key={request.id}
                            className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
                          >
                            <img 
                              src={request.sender_avatar || `https://i.pravatar.cc/150?u=${request.sender_id}`}
                              alt={request.sender_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm truncate">{request.sender_name}</p>
                            </div>
                            <div className="flex gap-1">
                              <button 
                                onClick={() => handleAcceptRequest(request.id)}
                                className="p-1 rounded-full bg-green-500/20 hover:bg-green-500/40 text-green-400 transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeclineRequest(request.id)}
                                className="p-1 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Center - Main Content */}
        <div className="flex-1 h-full flex flex-col py-8 px-8">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-8 mb-8">
            <button 
              onClick={() => setActiveTab('friends')}
              className={`text-lg font-medium transition-colors ${activeTab === 'friends' ? 'text-white border-b-2 border-white pb-1' : 'text-white/50 hover:text-white/80'}`}
            >
              Friends
            </button>
            <button 
              onClick={() => setActiveTab('trophies')}
              className={`text-lg font-medium transition-colors ${activeTab === 'trophies' ? 'text-white border-b-2 border-white pb-1' : 'text-white/50 hover:text-white/80'}`}
            >
              Trophies
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="ml-auto w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto pr-2">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            ) : activeTab === 'friends' ? (
              /* Friends List */
              <div className="space-y-4">
                {friends.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <p className="text-white/40">No friends yet</p>
                    <p className="text-white/30 text-sm mt-2">Add friends to see them here</p>
                  </div>
                ) : (
                  friends.map((friend) => {
                    const friendAchievements = getRandomAchievements();
                    const friendGames = getRandomGames();

                    return (
                      <div 
                        key={friend.id}
                        className="flex gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
                      >
                        {/* Mini Avatar Viewer */}
                        <div className="flex-shrink-0">
                          <MiniAvatarViewer size={80} />
                        </div>

                        {/* Friend Info */}
                        <div className="flex-1 min-w-0">
                          {/* Name and Status */}
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-white font-bold text-lg">{friend.friend_name}</h3>
                            <div className={`w-2 h-2 rounded-full ${
                              friend.status === 'online' ? 'bg-green-400' : 
                              friend.status === 'away' ? 'bg-yellow-400' : 'bg-gray-500'
                            }`} />
                            {friend.current_game && (
                              <span className="text-green-400 text-sm">Playing {friend.current_game}</span>
                            )}
                          </div>

                          {/* Recent Games */}
                          <div className="flex items-center gap-2 mb-2">
                            <Gamepad2 className="w-4 h-4 text-white/40" />
                            <span className="text-white/60 text-sm">
                              {friendGames.map(g => g.title).join(', ') || 'No recent games'}
                            </span>
                          </div>

                          {/* Recent Achievements */}
                          <div className="flex items-center gap-2">
                            <span className="text-white/40 text-xs mr-1">Recent:</span>
                            <div className="flex gap-1">
                              {friendAchievements.map((ach, i) => (
                                <MiniAchievementCard key={i} achievement={ach} size={35} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : activeTab === 'games' ? (
              /* Games Most Played - with Avatar + Game + Achievements */
              <div className="space-y-4">
                {games.length === 0 ? (
                  <div className="text-center py-12">
                    <Gamepad2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <p className="text-white/40">No games found</p>
                  </div>
                ) : (
                  games.map((game) => {
                    const gameAchievements = achievements.filter(a => a.game === game.title).slice(0, 4);
                    
                    return (
                      <div 
                        key={game.id}
                        className="flex gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
                      >
                        {/* Mini Avatar Viewer */}
                        <div className="flex-shrink-0">
                          <MiniAvatarViewer size={80} />
                        </div>

                        {/* Game Info */}
                        <div className="flex-1 min-w-0">
                          {/* Game Title */}
                          <div className="flex items-center gap-3 mb-2">
                            <img 
                              src={game.cover_image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&h=60&fit=crop'}
                              alt={game.title}
                              className="w-16 h-10 rounded object-cover"
                            />
                            <h3 className="text-white font-bold text-lg">{game.title}</h3>
                          </div>

                          {/* Unlockable Achievements */}
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-yellow-400" />
                            <span className="text-white/40 text-xs mr-2">Achievements to unlock:</span>
                            <div className="flex gap-1">
                              {gameAchievements.length > 0 ? (
                                gameAchievements.map((ach, i) => (
                                  <MiniAchievementCard key={i} achievement={ach} size={35} />
                                ))
                              ) : (
                                <span className="text-white/30 text-xs">No achievements available</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : activeTab === 'trophies' ? (
              /* Trophies / Achievements */
              <div className="grid grid-cols-4 gap-4">
                {achievements.map((ach, i) => (
                  <div 
                    key={ach.id || i}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <MiniAchievementCard achievement={ach} size={60} />
                    <span className="text-white text-sm font-medium text-center truncate w-full">{ach.title}</span>
                    <span className="text-white/40 text-xs">{ach.game}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Sidebar - Leaderboard */}
        <div 
          className="w-72 h-full py-8 px-6"
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <h2 className="text-white font-bold text-lg mb-6 tracking-wide">LEADERBOARD</h2>

          <div className="space-y-3">
            {friends.slice(0, 7).map((friend, index) => (
              <div 
                key={friend.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
              >
                {/* Avatar */}
                <img 
                  src={friend.friend_avatar || `https://i.pravatar.cc/150?u=${friend.friend_id}`}
                  alt={friend.friend_name}
                  className="w-10 h-10 rounded-lg object-cover"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white/60 text-sm">{index + 1} -</span>
                    <span className="text-white text-sm font-medium truncate">{friend.friend_name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-cyan-400 text-xs">
                    <div className="w-3 h-3 rounded-full bg-cyan-400/30 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    </div>
                    <span>{Math.floor(Math.random() * 50000).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}

            {friends.length === 0 && (
              <p className="text-white/40 text-sm text-center py-4">Add friends to see leaderboard</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}