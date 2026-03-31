import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, MessageSquare, UserPlus, Gamepad2,
  Swords, Repeat, Check, X, Search,
  Trophy, Shield, Crosshair, ChevronRight
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

const FRIEND_ACTIONS = [
  { id: 'chat', icon: MessageSquare, label: 'Chat', color: 'text-cyan-400' },
  { id: 'invite', icon: UserPlus, label: 'Invite', color: 'text-green-400' },
  { id: 'duel', icon: Swords, label: 'Duel', color: 'text-red-400' },
  { id: 'trade', icon: Repeat, label: 'Trade', color: 'text-amber-400' },
];

export default function FriendsDropdown() {
  const [activeTab, setActiveTab] = useState('friends');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMessenger, setShowMessenger] = useState(false);

  const filteredFriends = MOCK_FRIENDS.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFriendClick = (friend) => {
    setSelectedFriend(prev => prev?.id === friend.id ? null : friend);
  };

  const handleOpenMessenger = (friend) => {
    setSelectedFriend(friend);
    setShowMessenger(true);
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
              <div className="flex-1 overflow-y-auto py-1 px-2 space-y-0.5" style={{ scrollbarWidth: 'none' }}>
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
                        dim
                      />
                    ))}
                  </>
                )}
              </div>

              {/* Right: Actions Panel */}
              <div
                className="flex-shrink-0 border-l border-white/5 flex flex-col"
                style={{ width: '140px' }}
              >
                <AnimatePresence>
                  {selectedFriend ? (
                    <motion.div
                      key={selectedFriend.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex flex-col h-full"
                    >
                      {/* Selected Friend Info */}
                      <div className="p-3 border-b border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="relative flex-shrink-0">
                            <div className="w-8 h-8 rounded-lg overflow-hidden">
                              <img src={selectedFriend.avatar} alt={selectedFriend.name} className="w-full h-full object-cover" />
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-black/50 ${STATUS_COLOR[selectedFriend.status]}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-white text-[10px] font-bold truncate">{selectedFriend.name}</p>
                            <p className="text-white/30 text-[8px]">Lv.{selectedFriend.level}</p>
                          </div>
                        </div>
                        {selectedFriend.game && (
                          <div className="flex items-center gap-1">
                            <Gamepad2 className="w-2.5 h-2.5 text-cyan-400 flex-shrink-0" />
                            <span className="text-[8px] text-cyan-200/60 truncate">{selectedFriend.game}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-1 p-2 flex-1">
                        {FRIEND_ACTIONS.map(action => (
                          <button
                            key={action.id}
                            onClick={() => action.id === 'chat' && handleOpenMessenger(selectedFriend)}
                            className="flex items-center gap-2 px-2 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.04] hover:border-white/[0.1] transition-all group"
                          >
                            <action.icon className={`w-3.5 h-3.5 ${action.color}`} />
                            <span className="text-[10px] text-white/60 group-hover:text-white/90 transition-colors">{action.label}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center text-center p-4"
                    >
                      <ChevronRight className="w-5 h-5 text-white/15 mb-2" />
                      <p className="text-[9px] text-white/20 leading-relaxed">Select a friend to see actions</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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

      {/* Full Messenger Overlay */}
      <AnimatePresence>
        {showMessenger && selectedFriend && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMessenger(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute inset-0 z-50 flex items-center justify-center p-8"
            >
              <FriendMessenger
                friend={{
                  friend_id: selectedFriend.id.toString(),
                  friend_name: selectedFriend.name,
                  friend_avatar: selectedFriend.avatar,
                  status: selectedFriend.status,
                  current_game: selectedFriend.game
                }}
                onClose={() => setShowMessenger(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Friend Row - compact book-style entry
const FriendRow = ({ friend, selected, onSelect, dim }) => (
  <button
    onClick={onSelect}
    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-xl border transition-all text-left ${
      selected
        ? 'bg-white/[0.08] border-white/10'
        : `border-transparent hover:bg-white/[0.04] ${dim ? 'opacity-50' : ''}`
    }`}
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