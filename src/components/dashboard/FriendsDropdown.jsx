import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, MessageSquare, UserPlus, Gamepad2, 
  Swords, Repeat, Play, Crown, Shield, 
  MoreHorizontal, Check, X, Bell, Search,
  Circle, Activity, Trophy, Star, Target, Crosshair
} from 'lucide-react';

// Mock Data
const MOCK_FRIENDS = [
  { id: 1, name: 'Shadow_Striker', status: 'online', game: 'Cyberpunk 2088', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', level: 42, role: 'Damage' },
  { id: 2, name: 'CyberVixen', status: 'playing', game: 'Final Fantasy XIV', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', level: 56, role: 'Healer', inParty: true },
  { id: 3, name: 'GhostReaper', status: 'idle', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150', level: 33, role: 'Tank' },
  { id: 4, name: 'IronFist', status: 'offline', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150', level: 60, role: 'Tank' },
  { id: 5, name: 'NovaStar', status: 'online', game: 'League of Legends', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', level: 25, role: 'Support' },
];

const PARTY_MEMBERS = [MOCK_FRIENDS[1]];

export default function FriendsDropdown() {
  const [activeTab, setActiveTab] = useState('online'); 
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFriends = MOCK_FRIENDS.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onlineFriends = filteredFriends.filter(f => f.status !== 'offline');
  const offlineFriends = filteredFriends.filter(f => f.status === 'offline');

  return (
    <div 
      className="w-full rounded-3xl overflow-hidden border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
      style={{
        background: 'rgba(10, 12, 16, 0.6)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      }}
    >
      {/* Header & Tabs */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
        <div className="flex gap-6">
          <TabItem id="online" label="Friends" active={activeTab === 'online'} onClick={setActiveTab} count={MOCK_FRIENDS.length} />
          <TabItem id="party" label="Party" active={activeTab === 'party'} onClick={setActiveTab} count={PARTY_MEMBERS.length} />
          <TabItem id="requests" label="Requests" active={activeTab === 'requests'} onClick={setActiveTab} count={3} alert />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-white/60 transition-colors" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-40 bg-black/20 border border-white/5 rounded-full pl-9 pr-3 py-1.5 text-xs text-white/80 placeholder:text-white/20 focus:outline-none focus:bg-black/40 focus:border-white/10 transition-all"
            />
          </div>
          <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center transition-colors">
            <UserPlus className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 min-h-[300px] max-h-[500px] overflow-y-auto custom-scrollbar">
        {activeTab === 'online' && (
          <div className="space-y-6">
            {/* Online Section */}
            <FriendGroup title="Online" count={onlineFriends.length}>
              {onlineFriends.map(f => (
                <FriendRow 
                  key={f.id} 
                  friend={f} 
                  selected={selectedFriend?.id === f.id}
                  onSelect={() => setSelectedFriend(selectedFriend?.id === f.id ? null : f)}
                />
              ))}
            </FriendGroup>

            {/* Offline Section */}
            {offlineFriends.length > 0 && (
              <FriendGroup title="Offline" count={offlineFriends.length} className="opacity-60">
                {offlineFriends.map(f => (
                  <FriendRow 
                    key={f.id} 
                    friend={f} 
                    selected={selectedFriend?.id === f.id}
                    onSelect={() => setSelectedFriend(selectedFriend?.id === f.id ? null : f)}
                  />
                ))}
              </FriendGroup>
            )}
          </div>
        )}

        {activeTab === 'party' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/5 border border-purple-500/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                  <Crown className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Squad Alpha</h3>
                  <p className="text-purple-300/60 text-xs">2 / 4 Members • Open</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-purple-500/20">
                  Ready Up
                </button>
                <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 transition-colors">
                  <SettingsIcon />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {PARTY_MEMBERS.map(f => (
                <FriendRow key={f.id} friend={f} selected={selectedFriend?.id === f.id} onSelect={() => setSelectedFriend(selectedFriend?.id === f.id ? null : f)} />
              ))}
              {/* Empty Slots */}
              {[1, 2].map(i => (
                <div key={i} className="h-16 rounded-xl border border-white/5 bg-white/[0.02] border-dashed flex items-center justify-center gap-3 text-white/20 hover:text-white/40 hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer group">
                  <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/30">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium tracking-wide">Invite Player</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10" />
                  <div>
                    <p className="text-white text-sm font-bold">NewPlayer_{i}</p>
                    <p className="text-white/40 text-xs">Sent 2h ago</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg bg-white/5 hover:bg-green-500/20 text-white/40 hover:text-green-400 transition-colors">
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-components

const TabItem = ({ id, label, active, onClick, count, alert }) => (
  <button 
    onClick={() => onClick(id)}
    className={`relative py-2 text-sm font-medium transition-colors ${active ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
  >
    {label}
    {count > 0 && (
      <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40'}`}>
        {count}
      </span>
    )}
    {alert && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]" />}
    {active && (
      <motion.div 
        layoutId="tab-line" 
        className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_-2px_10px_rgba(34,211,238,0.5)]" 
      />
    )}
  </button>
);

const FriendGroup = ({ title, count, children, className = "" }) => (
  <div className={className}>
    <div className="flex items-center gap-3 mb-3 px-2">
      <h4 className="text-xs font-bold text-white/30 uppercase tracking-widest">{title}</h4>
      <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
      <span className="text-[10px] text-white/20 font-mono">{count}</span>
    </div>
    <div className="space-y-1">
      {children}
    </div>
  </div>
);

const FriendRow = ({ friend, selected, onSelect }) => (
  <div className="relative">
    <div 
      onClick={onSelect}
      className={`group flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer ${
        selected 
          ? 'bg-white/10 border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.2)]' 
          : 'bg-transparent border-transparent hover:bg-white/5'
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className={`w-10 h-10 rounded-lg overflow-hidden ring-2 transition-all ${
          selected ? 'ring-cyan-400/50' : 'ring-transparent group-hover:ring-white/10'
        }`}>
          <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
        </div>
        
        {/* Status Dot */}
        <div className="absolute -bottom-1 -right-1 p-0.5 bg-[#0a0c10] rounded-full">
          <div className={`w-2.5 h-2.5 rounded-full border border-black/50 ${
            friend.status === 'online' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]' :
            friend.status === 'playing' ? 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.6)]' :
            friend.status === 'idle' ? 'bg-amber-400' : 'bg-slate-600'
          }`} />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className={`text-sm font-semibold truncate transition-colors ${selected ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
            {friend.name}
          </h4>
          <span className="text-[10px] font-mono text-white/20">Lv.{friend.level}</span>
        </div>
        
        <div className="flex items-center gap-2 mt-0.5">
          {friend.game ? (
            <>
              <Gamepad2 className="w-3 h-3 text-cyan-400" />
              <span className="text-xs text-cyan-100/60 truncate group-hover:text-cyan-100 transition-colors">
                {friend.game}
              </span>
            </>
          ) : (
            <span className="text-xs text-white/30 capitalize">{friend.status}</span>
          )}
        </div>
      </div>

      {/* Hover Action */}
      <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ${selected ? 'opacity-100' : ''}`}>
        <MoreHorizontal className="w-4 h-4 text-white/40" />
      </div>
    </div>

    {/* Expanded Controls */}
    <AnimatePresence>
      {selected && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="overflow-hidden bg-black/20 rounded-b-xl mx-2 -mt-2 border-x border-b border-white/5"
        >
          <div className="p-3 pt-4 grid grid-cols-4 gap-2">
            <QuickAction icon={MessageSquare} label="Chat" onClick={() => {}} />
            <QuickAction icon={UserPlus} label="Invite" onClick={() => {}} />
            <QuickAction icon={Swords} label="Duel" onClick={() => {}} />
            <QuickAction icon={Repeat} label="Trade" onClick={() => {}} />
          </div>
          
          {friend.game && (
            <div className="px-3 pb-3">
              <button className="w-full py-2.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 border border-white/5 hover:border-cyan-500/30 text-white/60 hover:text-cyan-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all group">
                <Play className="w-3 h-3 fill-current" />
                Join Session
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const QuickAction = ({ icon: Icon, label, onClick }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-white/10 transition-colors group"
  >
    <Icon className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
    <span className="text-[9px] font-medium text-white/30 group-hover:text-white/80 transition-colors">{label}</span>
  </button>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);