import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, MessageSquare, Mic, Gamepad2,
  Trophy, Heart, Zap, Activity, MoreHorizontal,
  Search, Bell, Shield, Radio, Sparkles, Sword, X, ArrowLeftRight
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../components/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { lunarDashboardInvite } from '@/functions/lunarDashboardInvite';
import FriendMessenger from '../components/friends/FriendMessenger';
import FriendProfileOverlay from '../components/streaming/FriendProfileOverlay';
import FriendTradePanel from '../components/streaming/FriendTradePanel';
import TradeInviteToast from '../components/friends/TradeInviteToast';

// --- Sub-components ---

const AICompatibilityMeter = ({ score }) => {
  const getColor = (s) => {
    if (s > 85) return 'bg-gradient-to-r from-purple-500 to-pink-500';
    if (s > 60) return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    return 'bg-gradient-to-r from-yellow-500 to-orange-500';
  };

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 border border-white/10 relative overflow-hidden group">
      <div className="flex justify-between items-end mb-2 relative z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-white/80 uppercase tracking-wider">AI Compatibility</span>
        </div>
        <span className="text-2xl font-black text-white">{score}%</span>
      </div>
      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden relative z-10">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={`h-full ${getColor(score)} shadow-[0_0_15px_rgba(168,85,247,0.5)]`}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
};

const FriendCard = ({ friend, isSelected, onClick }) => {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative p-4 rounded-2xl cursor-pointer transition-all duration-300 border
        ${isSelected 
          ? 'bg-white/10 border-white/30 shadow-[0_0_30px_rgba(59,130,246,0.15)] backdrop-blur-md' 
          : 'bg-black/20 border-white/5 hover:border-white/20 backdrop-blur-sm'
        }
      `}
    >
      {/* Selection Glow Indicator */}
      {isSelected && (
        <motion.div 
          layoutId="activeGlow"
          className="absolute inset-0 rounded-2xl border-2 border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.3)] z-0"
          initial={false}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}

      <div className="flex items-center gap-4 relative z-10">
        {/* Avatar with Status Ring */}
        <div className="relative">
          <div className={`w-14 h-14 rounded-full p-0.5 ${
            friend.status === 'online' ? 'bg-gradient-to-tr from-green-400 to-emerald-600' :
            friend.status === 'away' ? 'bg-gradient-to-tr from-yellow-400 to-orange-500' :
            friend.status === 'busy' ? 'bg-gradient-to-tr from-red-500 to-pink-600' :
            'bg-gradient-to-tr from-slate-600 to-slate-800'
          }`}>
            <div className="w-full h-full rounded-full overflow-hidden bg-black/50">
              <img 
                src={friend.friend_avatar || `https://i.pravatar.cc/150?u=${friend.friend_id}`} 
                alt={friend.friend_name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          {/* Online Indicator Badge */}
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-[#0f1419] flex items-center justify-center ${
             friend.status === 'online' ? 'bg-green-500' :
             friend.status === 'away' ? 'bg-yellow-500' :
             friend.status === 'busy' ? 'bg-red-500' : 'bg-slate-600'
          }`}>
            {friend.status === 'online' && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
          </div>
        </div>

        {/* Text Info */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-lg truncate ${isSelected ? 'text-white' : 'text-white/90'}`}>
            {friend.friend_name}
          </h3>
          <div className="flex items-center gap-2 text-sm">
            {friend.current_game ? (
              <>
                <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-cyan-400 truncate">{friend.current_game}</span>
              </>
            ) : (
              <span className="text-white/40">{friend.status === 'offline' ? 'Offline' : 'Online'}</span>
            )}
          </div>
        </div>

        {/* Chevron */}
        <div className={`transition-transform duration-300 ${isSelected ? 'rotate-90 text-white' : 'text-white/20'}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>
    </motion.div>
  );
};

const ActionButton = ({ icon: Icon, label, primary, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`
      flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition-all
      ${primary 
        ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]' 
        : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/10'
      }
    `}
  >
    <Icon className={`w-4 h-4 ${primary ? 'fill-black' : ''}`} />
    {label}
  </motion.button>
);

const ActivityItem = ({ icon: Icon, text, time }) => (
  <div className="flex gap-4 items-start p-3 rounded-xl hover:bg-white/5 transition-colors">
    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 text-white/70" />
    </div>
    <div>
      <p className="text-sm text-white/90 leading-tight">{text}</p>
      <span className="text-xs text-white/40 mt-1 block">{time}</span>
    </div>
  </div>
);

// --- Main Page Component ---

export default function FriendsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Data State
  const [friends, setFriends] = useState([]);
  const [selectedFriendId, setSelectedFriendId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [aiPartyMode, setAiPartyMode] = useState(false);
  const [activePanel, setActivePanel] = useState(null); // 'messenger', 'profile', 'trade', etc.
  const [incomingTrade, setIncomingTrade] = useState(null);
  
  // Refs
  const seededRef = useRef(false);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      try {
        let friendsList = await base44.entities.Friend.filter({ user_id: user.id });
        
        // Seeding logic preserved from original
        if (friendsList.length === 0 && !seededRef.current) {
          await base44.entities.Friend.bulkCreate([
            { user_id: user.id, friend_id: 'temp_logan', friend_name: 'Logan_X', friend_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', status: 'online', current_game: 'Cyberpunk 2077' },
            { user_id: user.id, friend_id: 'temp_ariana', friend_name: 'Ariana_V', friend_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', status: 'away', current_game: 'Starfield' },
            { user_id: user.id, friend_id: 'temp_kai', friend_name: 'Kai_Zero', friend_avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150', status: 'online', current_game: 'Apex Legends' },
            { user_id: user.id, friend_id: 'temp_nova', friend_name: 'Nova_Prime', friend_avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', status: 'offline' },
          ]);
          seededRef.current = true;
          friendsList = await base44.entities.Friend.filter({ user_id: user.id });
        }
        
        // Enhance with mock console-like data
        const enhancedFriends = friendsList.map(f => ({
          ...f,
          ai_compatibility: Math.floor(Math.random() * 40) + 60, // 60-100%
          shared_achievements: Math.floor(Math.random() * 50),
          rivalry_score: Math.floor(Math.random() * 100),
          last_active: '2h ago',
          bg_image: f.current_game === 'Cyberpunk 2077' ? 'https://images.unsplash.com/photo-1533972724312-6eafa2708b28?w=1200' :
                   f.current_game === 'Starfield' ? 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200' :
                   'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200'
        }));

        setFriends(enhancedFriends);
        if (enhancedFriends.length > 0) setSelectedFriendId(enhancedFriends[0].id);
      } catch (err) {
        console.error("Failed to load friends", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;

    const loadIncomingTrade = async () => {
      const sessions = await base44.entities.TradeSession.filter({ recipient_id: user.id, status: 'pending' });
      setIncomingTrade(sessions[0] || null);
    };

    loadIncomingTrade();
    const unsubscribe = base44.entities.TradeSession.subscribe((event) => {
      const data = event.data;
      if (data?.recipient_id === user.id && data?.status === 'pending') {
        setIncomingTrade(data);
      }
      if (data?.recipient_id === user.id && ['accepted', 'declined', 'cancelled'].includes(data?.status)) {
        loadIncomingTrade();
      }
    });

    return unsubscribe;
  }, [user?.id]);

  // Derived State
  const selectedFriend = friends.find(f => f.id === selectedFriendId);
  const filteredFriends = activeTab === 'all' ? friends :
                         activeTab === 'online' ? friends.filter(f => f.status === 'online') :
                         friends.filter(f => f.current_game);

  // Action Handlers
  const handleClosePanel = () => {
    setSelectedFriendId(null);
    setActivePanel(null);
  };

  const handleInviteToLunar = async () => {
    if (!selectedFriend) return;
    try {
      const response = await lunarDashboardInvite({
        action: 'invite',
        friend_id: selectedFriend.friend_id
      });
      if (response.data.success) {
        alert('Invite sent to ' + selectedFriend.friend_name + '. They will see a yes/no popup.');
      }
    } catch (err) {
      console.error('Invite failed:', err);
      alert('Failed to send invitation');
    }
  };

  const handleOpenMessenger = () => {
    setActivePanel('messenger');
  };

  const handleOpenTrade = () => {
    setActivePanel('trade');
  };

  const handleAcceptTradeInvite = async () => {
    if (!incomingTrade) return;
    await base44.entities.TradeSession.update(incomingTrade.id, { status: 'accepted' });
    const matchedFriend = friends.find((entry) => entry.friend_id === incomingTrade.initiator_id);
    if (matchedFriend) {
      setSelectedFriendId(matchedFriend.id);
      setActivePanel('trade');
    }
    setIncomingTrade(null);
  };

  const handleDeclineTradeInvite = async () => {
    if (!incomingTrade) return;
    await base44.entities.TradeSession.update(incomingTrade.id, { status: 'declined' });
    setIncomingTrade(null);
  };

  const handlePanelChange = (panel) => {
    setActivePanel(panel);
  };

  const handleJoinLunar = async () => {
    if (!selectedFriend) return;
    try {
      const response = await lunarDashboardInvite({
        action: 'join',
        friend_id: selectedFriend.friend_id
      });
      if (response.data.success) {
        alert('Join request sent. They will see a yes/no popup.');
      }
    } catch (err) {
      console.error('Join failed:', err);
      alert('Failed to join Lunar Dashboard');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0f1419] text-white font-sans overflow-hidden relative selection:bg-cyan-500/30">
      
      {/* 1. Animated Background Starfield/Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(76,29,149,0.15),_transparent_70%)]" />
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', 
          backgroundSize: '40px 40px',
          maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)'
        }} />
        <motion.div 
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ opacity: [0.2, 0.5, 0.2], scale: [1.1, 1, 1.1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px]" 
        />
      </div>

      <div className="relative z-10 flex h-screen p-8 gap-8">
        
        {/* 2. Left Panel: Friend List */}
        <div className="w-[400px] flex flex-col gap-6 shrink-0">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-black tracking-tighter italic">SOCIAL HUB</h1>
              {selectedFriendId && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={handleClosePanel}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5 text-white/70" />
                </motion.button>
              )}
            </div>
            <div className="flex gap-2">
              <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                <Search className="w-5 h-5 text-white/70" />
              </button>
              <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                <UserPlus className="w-5 h-5 text-white/70" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex p-1 bg-white/5 rounded-xl backdrop-blur-md">
            {['all', 'online', 'playing'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  activeTab === tab ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
            {loading ? (
              <div className="text-center text-white/30 py-10">Loading neural network...</div>
            ) : filteredFriends.map((friend) => (
              <FriendCard 
                key={friend.id} 
                friend={friend} 
                isSelected={selectedFriendId === friend.id}
                onClick={() => {
                  setSelectedFriendId(friend.id);
                  setActivePanel(null);
                }}
              />
            ))}
          </div>

          {/* AI Party Mode Toggle */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-white/10 backdrop-blur-md flex items-center justify-between group cursor-pointer" onClick={() => setAiPartyMode(!aiPartyMode)}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${aiPartyMode ? 'bg-cyan-500 text-black' : 'bg-white/10 text-white/50'}`}>
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">AI Party Mode</h4>
                <p className="text-xs text-white/50 group-hover:text-cyan-400 transition-colors">Enhance voice clarity</p>
              </div>
            </div>
            <div className={`w-12 h-7 rounded-full p-1 transition-colors ${aiPartyMode ? 'bg-cyan-500' : 'bg-white/10'}`}>
              <motion.div 
                animate={{ x: aiPartyMode ? 20 : 0 }}
                className="w-5 h-5 bg-white rounded-full shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* 3. Right Panel: Cinematic Preview or Chat */}
        <AnimatePresence mode="wait">
          {selectedFriend && (
            <motion.div 
              key={`${selectedFriend.id}-${activePanel || 'profile'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex-1 relative rounded-[32px] overflow-hidden border border-white/10 shadow-2xl"
            >
              {activePanel === 'messenger' ? (
                <div className="absolute inset-0 z-10 bg-[#0f1419]/95">
                  <FriendMessenger 
                    friend={{
                      friend_id: selectedFriend.friend_id,
                      friend_name: selectedFriend.friend_name,
                      friend_avatar: selectedFriend.friend_avatar,
                      status: selectedFriend.status,
                      current_game: selectedFriend.current_game
                    }}
                    onClose={() => setActivePanel(null)}
                  />
                </div>
              ) : activePanel === 'trade' ? (
                <div className="absolute inset-0 z-10 bg-[#0f1419]/95">
                  <FriendTradePanel
                    friend={{
                      friend_id: selectedFriend.friend_id,
                      name: selectedFriend.friend_name,
                      avatar: selectedFriend.friend_avatar,
                      status: selectedFriend.status,
                    }}
                    currentUser={user}
                    onClose={() => setActivePanel(null)}
                  />
                </div>
              ) : activePanel === 'profile' ? (
                /* PROFILE OVERLAY */
                <div className="absolute inset-0 z-10">
                  <FriendProfileOverlay 
                    friend={selectedFriend} 
                    onClose={() => setActivePanel(null)}
                    onPanelChange={handlePanelChange}
                  />
                </div>
              ) : (
                /* DEFAULT PROFILE VIEW */
                <>
                  {/* Dynamic Background Image */}
                  <div className="absolute inset-0 z-0">
                    <img 
                      src={selectedFriend.bg_image} 
                      alt="Background" 
                      className="w-full h-full object-cover opacity-60 scale-105 group-hover:scale-110 transition-transform duration-[20s]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f1419] via-[#0f1419]/80 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#0f1419]/40 to-[#0f1419]" />
                  </div>

                  {/* Content Container */}
                  <div className="absolute inset-0 z-10 p-12 flex flex-col justify-end">
                    
                    {/* Top Actions (Close/More) */}
                    <div className="absolute top-8 right-8 flex gap-4">
                      <button className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-white">
                        <Bell className="w-5 h-5" />
                      </button>
                      <button className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-white">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Main Profile Info */}
                    <div className="flex items-end gap-10 mb-12">
                      {/* Large Avatar */}
                      <div className="relative group">
                        <div className="w-48 h-48 rounded-[3rem] overflow-hidden border-4 border-white/10 shadow-2xl relative z-10">
                          <img 
                            src={selectedFriend.friend_avatar || `https://i.pravatar.cc/300?u=${selectedFriend.friend_id}`}
                            alt={selectedFriend.friend_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {/* Glow effect behind avatar */}
                        <div className="absolute inset-0 bg-cyan-500/30 blur-[60px] rounded-full z-0 group-hover:bg-cyan-400/50 transition-colors duration-500" />
                        
                        {/* Status Badge */}
                        <div className="absolute -bottom-4 -right-4 bg-black/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 z-20">
                          <div className={`w-3 h-3 rounded-full ${
                            selectedFriend.status === 'online' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 
                            selectedFriend.status === 'away' ? 'bg-yellow-500' : 'bg-slate-500'
                          }`} />
                          <span className="font-bold text-sm uppercase tracking-wide">
                            {selectedFriend.status}
                          </span>
                        </div>
                      </div>

                      {/* Name & Title */}
                      <div className="mb-4">
                        <motion.h2 
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="text-6xl font-black text-white tracking-tight mb-2 drop-shadow-lg"
                        >
                          {selectedFriend.friend_name}
                        </motion.h2>
                        <div className="flex items-center gap-4 text-white/60">
                          <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg">
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            <span className="font-mono text-sm">LVL 42</span>
                          </div>
                          <span className="w-1 h-1 bg-white/20 rounded-full" />
                          <span className="text-lg">{selectedFriend.current_game || "Chilling in Lobby"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Grid Layout: Stats & Activity */}
                    <div className="grid grid-cols-12 gap-6 mb-10">
                      
                      {/* Left Column: Stats */}
                      <div className="col-span-8 grid grid-cols-2 gap-4">
                        <AICompatibilityMeter score={selectedFriend.ai_compatibility} />
                        
                        <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 border border-white/10 flex flex-col justify-between group hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-2 text-white/60 mb-2">
                            <Sword className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">Rivalry Stats</span>
                          </div>
                          <div className="flex items-end justify-between">
                            <div>
                              <div className="text-2xl font-black text-white">{selectedFriend.rivalry_score}</div>
                              <div className="text-xs text-white/40">Matches Won</div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-black text-red-400">12</div>
                              <div className="text-xs text-white/40">Losses</div>
                            </div>
                          </div>
                        </div>

                        <div className="col-span-2 bg-black/40 backdrop-blur-md rounded-xl p-4 border border-white/10 flex items-center justify-between group hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-xl font-bold">
                              {selectedFriend.shared_achievements}
                            </div>
                            <div>
                              <div className="font-bold text-white">Shared Achievements</div>
                              <div className="text-xs text-white/50">Across 14 Games</div>
                            </div>
                          </div>
                          <div className="flex -space-x-2">
                            {[1,2,3].map(i => (
                              <div key={i} className="w-8 h-8 rounded-full bg-white/10 border border-white/20" />
                            ))}
                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/20 flex items-center justify-center text-xs">+5</div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Activity Feed */}
                      <div className="col-span-4 bg-black/40 backdrop-blur-md rounded-xl p-4 border border-white/10 flex flex-col gap-2">
                        <div className="text-xs font-bold text-white/50 uppercase mb-2 flex items-center gap-2">
                          <Activity className="w-3 h-3" /> Recent Activity
                        </div>
                        <div className="space-y-1">
                          <ActivityItem icon={Trophy} text={`Earned "Legendary" in ${selectedFriend.current_game || 'Apex'}`} time="2m ago" />
                          <ActivityItem icon={Gamepad2} text="Started playing Starfield" time="2h ago" />
                          <ActivityItem icon={MessageSquare} text="Commented on your clip" time="5h ago" />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Row */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <ActionButton 
                        icon={Users} 
                        label="Invite to Lunar" 
                        primary 
                        onClick={handleInviteToLunar} 
                      />
                      <ActionButton 
                        icon={Gamepad2} 
                        label="Join Lunar" 
                        onClick={handleJoinLunar} 
                      />
                      <ActionButton 
                        icon={Mic} 
                        label="Start Party" 
                        onClick={() => console.log('Voice')} 
                      />
                      <ActionButton 
                        icon={MessageSquare} 
                        label={activePanel === 'messenger' ? "Close Chat" : "Message"} 
                        onClick={handleOpenMessenger} 
                      />
                      <ActionButton 
                        icon={ArrowLeftRight} 
                        label="Trade" 
                        onClick={handleOpenTrade} 
                      />
                    </div>

                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {incomingTrade && (
            <TradeInviteToast
              friendName={friends.find((entry) => entry.friend_id === incomingTrade.initiator_id)?.friend_name || 'A friend'}
              onAccept={handleAcceptTradeInvite}
              onDecline={handleDeclineTradeInvite}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}