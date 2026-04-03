import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { lunarDashboardInvite } from '@/functions/lunarDashboardInvite';
import {
  Users, MessageSquare, UserPlus, Gamepad2,
  Swords, Repeat, Check, X, Search,
  Trophy, Shield, Crosshair, ChevronRight,
  Video, Mic, Eye, Phone
} from 'lucide-react';
import FriendMessenger from '../friends/FriendMessenger';

// Mock Data
const MOCK_FRIENDS = [
  { id: 1, name: 'Shadow_Striker', status: 'online', game: 'Cyberpunk 2088', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', level: 42 },
  { id: 2, name: 'CyberVixen', status: 'playing', game: 'Final Fantasy XIV', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', level: 56 },
  { id: 3, name: 'GhostReaper', status: 'idle', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150', level: 33 },
  { id: 4, name: 'IronFist', status: 'offline', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150', level: 60 },
  { id: 5, name: 'NovaStar', status: 'online', game: 'League of Legends', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', level: 25 },
];

const MOCK_REQUESTS = [
  { id: 101, name: 'BladeRunner_X', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', sentAgo: '2h', achievementRank: 'Diamond', pvpRank: 'Platinum II', pveRank: 'Mythic', genres: ['RPG', 'Sci-Fi'], mutualFriends: ['Shadow_Striker'] },
  { id: 102, name: 'NightOwl_92', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', sentAgo: '5h', achievementRank: 'Gold', pvpRank: 'Silver III', pveRank: 'Epic', genres: ['Horror', 'FPS'], mutualFriends: [] },
];

const STATUS_COLOR = {
  online: 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]',
  playing: 'bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.6)]',
  idle: 'bg-amber-400',
  offline: 'bg-slate-600',
};

const MESSENGER_ACTIONS = [
  { id: 'video', icon: Video, label: 'Video Call', color: 'text-cyan-400', bg: 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20' },
  { id: 'voice', icon: Mic, label: 'Voice Call', color: 'text-green-400', bg: 'bg-green-500/10 hover:bg-green-500/20 border-green-500/20' },
  { id: 'watch', icon: Eye, label: 'Watch Game', color: 'text-purple-400', bg: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20' },
];

export default function FriendsDropdown() {
  const [activeTab, setActiveTab] = useState('friends');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMessenger, setShowMessenger] = useState(false);
  const [showCallUI, setShowCallUI] = useState(false);
  const [pendingActionId, setPendingActionId] = useState(null);

  const filteredFriends = MOCK_FRIENDS.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFriendClick = (friend) => {
    setSelectedFriend(friend);
  };

  const handleOpenMessenger = (friend) => {
    setSelectedFriend(friend);
    setShowMessenger(true);
    setShowCallUI(false);
  };

  const handleOpenCallUI = (friend) => {
    setSelectedFriend(friend);
    setShowCallUI(true);
    setShowMessenger(false);
  };

  const handleDashboardInvite = async (friend, action) => {
    const actionKey = `${action}-${friend.id}`;
    setPendingActionId(actionKey);
    try {
      await lunarDashboardInvite({ action, friend_id: String(friend.id) });
    } finally {
      setPendingActionId(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ background: 'transparent' }}>
      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 pt-2 pb-1 flex-shrink-0">
        {[
          { id: 'friends', label: 'Friends', count: filteredFriends.filter(f => f.status !== 'offline').length },
          { id: 'requests', label: 'Requests', count: MOCK_REQUESTS.length, alert: true },
          { id: 'party', label: 'Party', count: 1 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-white/10 text-white border border-white/15'
                : 'text-white/40 hover:text-white/70 border border-transparent'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40'}`}>
                {tab.count}
              </span>
            )}
            {tab.alert && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />}
          </button>
        ))}

        {/* Search */}
        {activeTab === 'friends' && (
          <div className="ml-auto relative">
            <Search className="w-3 h-3 text-white/30 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-28 bg-black/20 border border-white/5 rounded-full pl-6 pr-2 py-1 text-[10px] text-white/80 placeholder:text-white/20 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        <AnimatePresence mode="wait">
          {activeTab === 'friends' && (
            <motion.div
              key="friends"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex overflow-hidden"
            >
              {/* Left: Friends List */}
              <div className={`${showMessenger ? 'w-1/2' : 'flex-1'} overflow-y-auto py-1 px-2 space-y-0.5 transition-all duration-300`} style={{ scrollbarWidth: 'none' }}>
                {/* Online */}
                <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest px-2 py-1">
                  Online — {filteredFriends.filter(f => f.status !== 'offline').length}
                </p>
                {filteredFriends.filter(f => f.status !== 'offline').map(friend => (
                  <FriendRow
                    key={friend.id}
                    friend={friend}
                    selected={selectedFriend?.id === friend.id}
                    onSelect={() => handleFriendClick(friend)}
                    onMessage={handleOpenMessenger}
                    onCall={handleOpenCallUI}
                    onInvite={handleDashboardInvite}
                    pendingActionId={pendingActionId}
                  />
                ))}
                {/* Offline */}
                {filteredFriends.filter(f => f.status === 'offline').length > 0 && (
                  <>
                    <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest px-2 py-1 mt-2">
                      Offline — {filteredFriends.filter(f => f.status === 'offline').length}
                    </p>
                    {filteredFriends.filter(f => f.status === 'offline').map(friend => (
                      <FriendRow
                        key={friend.id}
                        friend={friend}
                        selected={selectedFriend?.id === friend.id}
                        onSelect={() => handleFriendClick(friend)}
                        onMessage={handleOpenMessenger}
                        onCall={handleOpenCallUI}
                        onInvite={handleDashboardInvite}
                        pendingActionId={pendingActionId}
                        dim
                      />
                    ))}
                  </>
                )}
              </div>

              {/* Right: Messenger Panel */}
              <AnimatePresence>
                {showMessenger && selectedFriend && (
                  <motion.div
                    key="messenger"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: '50%' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="border-l border-white/10 flex flex-col overflow-hidden"
                  >
                    {/* Messenger Header */}
                    <div className="p-4 border-b border-white/10 bg-white/[0.02]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-cyan-400/30">
                              <img src={selectedFriend.avatar} alt={selectedFriend.name} className="w-full h-full object-cover" />
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black/60 ${STATUS_COLOR[selectedFriend.status]}`} />
                          </div>
                          <div>
                            <h3 className="text-white font-bold text-sm">{selectedFriend.name}</h3>
                            {selectedFriend.game ? (
                              <div className="flex items-center gap-1">
                                <Gamepad2 className="w-3 h-3 text-cyan-400" />
                                <span className="text-[10px] text-cyan-300/60">{selectedFriend.game}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-white/40 capitalize">{selectedFriend.status}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setShowMessenger(false)}
                          className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center transition-colors"
                        >
                          <X className="w-4 h-4 text-white/60" />
                        </button>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-2">
                        {MESSENGER_ACTIONS.map(action => (
                          <button
                            key={action.id}
                            onClick={() => {
                              if (action.id === 'video') handleOpenCallUI(selectedFriend);
                              if (action.id === 'voice') handleOpenCallUI(selectedFriend);
                              if (action.id === 'watch') handleOpenCallUI(selectedFriend);
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-all ${action.bg}`}
                          >
                            <action.icon className={`w-4 h-4 ${action.color}`} />
                            <span className={`text-[10px] font-semibold ${action.color}`}>{action.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Messenger Content */}
                    <div className="flex-1 overflow-hidden">
                      <FriendMessenger
                        friend={{
                          friend_id: selectedFriend.id.toString(),
                          friend_name: selectedFriend.name,
                          friend_avatar: selectedFriend.avatar,
                          status: selectedFriend.status,
                          current_game: selectedFriend.game
                        }}
                        onClose={() => setShowMessenger(false)}
                        compact
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Right: Call UI Panel */}
              <AnimatePresence>
                {showCallUI && selectedFriend && (
                  <motion.div
                    key="call-ui"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: '50%' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="border-l border-white/10 flex flex-col overflow-hidden"
                  >
                    {/* Call UI Header */}
                    <div className="p-4 border-b border-white/10 bg-white/[0.02]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-cyan-400/30">
                              <img src={selectedFriend.avatar} alt={selectedFriend.name} className="w-full h-full object-cover" />
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black/60 ${STATUS_COLOR[selectedFriend.status]}`} />
                          </div>
                          <div>
                            <h3 className="text-white font-bold text-sm">{selectedFriend.name}</h3>
                            {selectedFriend.game ? (
                              <div className="flex items-center gap-1">
                                <Gamepad2 className="w-3 h-3 text-cyan-400" />
                                <span className="text-[10px] text-cyan-300/60">{selectedFriend.game}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-white/40 capitalize">{selectedFriend.status}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setShowCallUI(false)}
                          className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center transition-colors"
                        >
                          <X className="w-4 h-4 text-white/60" />
                        </button>
                      </div>

                      {/* Call Actions */}
                      <div className="flex gap-2">
                        {MESSENGER_ACTIONS.map(action => (
                          <button
                            key={action.id}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-all ${action.bg}`}
                          >
                            <action.icon className={`w-4 h-4 ${action.color}`} />
                            <span className={`text-[10px] font-semibold ${action.color}`}>{action.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Call UI Content - Same as FriendMessenger call overlay */}
                    <div className="flex-1 overflow-hidden relative">
                      <FriendMessenger
                        friend={{
                          friend_id: selectedFriend.id.toString(),
                          friend_name: selectedFriend.name,
                          friend_avatar: selectedFriend.avatar,
                          status: selectedFriend.status,
                          current_game: selectedFriend.game
                        }}
                        onClose={() => setShowCallUI(false)}
                        compact
                        showCallOverlay
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'requests' && (
            <motion.div
              key="requests"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto py-2 px-3 space-y-2"
              style={{ scrollbarWidth: 'none' }}
            >
              {MOCK_REQUESTS.map(req => (
                <RequestRow key={req.id} request={req} />
              ))}
              {MOCK_REQUESTS.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-white/20 text-xs pt-12">
                  No pending requests
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'party' && (
            <motion.div
              key="party"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto py-2 px-3 space-y-1"
              style={{ scrollbarWidth: 'none' }}
            >
              <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest px-1 py-1">Current Party</p>
              {MOCK_FRIENDS.filter(f => f.id === 2).map(f => (
                <FriendRow key={f.id} friend={f} selected={false} onSelect={() => {}} />
              ))}
              {/* Empty slots */}
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 px-2 py-2 rounded-xl border border-dashed border-white/10 text-white/20 hover:border-white/20 transition-all cursor-pointer">
                  <div className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center">
                    <UserPlus className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px]">Empty Slot</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>


    </div>
  );
}

// Friend Row - compact book-style entry
const FriendRow = ({ friend, selected, onSelect, onMessage, onTrade, onInvite, dim, onCall, pendingActionId }) => (
  <div className={`w-full rounded-xl border transition-all ${
    selected
      ? 'bg-white/[0.08] border-white/10'
      : `border-transparent hover:bg-white/[0.04] ${dim ? 'opacity-50' : ''}`
  }`}>
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-2.5 px-2 py-2 text-left"
    >
      <div className="relative flex-shrink-0">
        <div className={`w-8 h-8 rounded-lg overflow-hidden ring-1 transition-all ${selected ? 'ring-cyan-400/40' : 'ring-transparent'}`}>
          <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
        </div>
        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-black/60 ${STATUS_COLOR[friend.status]}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold truncate ${selected ? 'text-white' : 'text-white/75'}`}>{friend.name}</p>
        {friend.game ? (
          <p className="text-[9px] text-cyan-300/50 truncate">{friend.game}</p>
        ) : (
          <p className="text-[9px] text-white/25 capitalize">{friend.status}</p>
        )}
      </div>
      <span className="text-[9px] text-white/20 flex-shrink-0">Lv.{friend.level}</span>
    </button>
    
    {/* Action Buttons - shown when selected */}
    {selected && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="px-2 pb-2"
      >
        <div className="flex gap-1.5 mt-1 flex-wrap">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMessage?.(friend);
            }}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors"
          >
            <MessageSquare className="w-3 h-3 text-cyan-400" />
            <span className="text-[9px] font-medium text-cyan-400">Message</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCall?.(friend);
            }}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 transition-colors"
          >
            <Phone className="w-3 h-3 text-green-400" />
            <span className="text-[9px] font-medium text-green-400">Call</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInvite?.(friend, 'invite');
            }}
            disabled={pendingActionId === `invite-${friend.id}`}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-colors disabled:opacity-50"
          >
            <UserPlus className="w-3 h-3 text-blue-400" />
            <span className="text-[9px] font-medium text-blue-400">Invite</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInvite?.(friend, 'join');
            }}
            disabled={pendingActionId === `join-${friend.id}`}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 transition-colors disabled:opacity-50"
          >
            <ChevronRight className="w-3 h-3 text-violet-400" />
            <span className="text-[9px] font-medium text-violet-400">Join</span>
          </button>
        </div>
      </motion.div>
    )}
  </div>
);

// Request Row - compact inline
const RequestRow = ({ request }) => (
  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-colors">
    <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
      <img src={request.avatar} alt={request.name} className="w-full h-full object-cover" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-0.5">
        <p className="text-white text-[10px] font-bold truncate">{request.name}</p>
        <span className="text-[8px] text-white/25">{request.sentAgo} ago</span>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-[8px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/20">{request.achievementRank}</span>
        {request.mutualFriends.length > 0 && (
          <span className="text-[8px] text-white/30">{request.mutualFriends.length} mutual</span>
        )}
      </div>
    </div>
    <div className="flex flex-col gap-1 flex-shrink-0">
      <button className="w-6 h-6 rounded-md bg-green-500/15 hover:bg-green-500/30 border border-green-500/20 flex items-center justify-center text-green-400 transition-colors">
        <Check className="w-3 h-3" />
      </button>
      <button className="w-6 h-6 rounded-md bg-white/[0.04] hover:bg-red-500/15 border border-white/[0.06] hover:border-red-500/20 flex items-center justify-center text-white/30 hover:text-red-400 transition-colors">
        <X className="w-3 h-3" />
      </button>
    </div>
  </div>
);