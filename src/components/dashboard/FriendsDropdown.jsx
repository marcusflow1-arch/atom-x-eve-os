import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, MessageSquare, UserPlus, Gamepad2, 
  Swords, Repeat, Play, Crown, Shield, 
  MoreHorizontal, Check, X, Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Mock Data
const MOCK_FRIENDS = [
  { id: 1, name: 'Shadow_Striker', status: 'online', game: 'Cyberpunk 2088', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', level: 42, role: 'Damage' },
  { id: 2, name: 'CyberVixen', status: 'playing', game: 'Final Fantasy XIV', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', level: 56, role: 'Healer', inParty: true },
  { id: 3, name: 'GhostReaper', status: 'idle', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150', level: 33, role: 'Tank' },
  { id: 4, name: 'IronFist', status: 'offline', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150', level: 60, role: 'Tank' },
  { id: 5, name: 'NovaStar', status: 'online', game: 'League of Legends', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', level: 25, role: 'Support' },
];

const PARTY_MEMBERS = [
  MOCK_FRIENDS[1], // CyberVixen is in party
];

export default function FriendsDropdown() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('online'); // 'online' | 'party' | 'requests'
  const [selectedFriend, setSelectedFriend] = useState(null);

  const onlineFriends = MOCK_FRIENDS.filter(f => f.status !== 'offline');
  const offlineFriends = MOCK_FRIENDS.filter(f => f.status === 'offline');

  const FriendItem = ({ friend, isPartyMember }) => (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
        selectedFriend?.id === friend.id 
          ? 'bg-white/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
          : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
      }`}
      onClick={() => setSelectedFriend(selectedFriend?.id === friend.id ? null : friend)}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative">
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10">
            <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
          </div>
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900 ${
            friend.status === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' :
            friend.status === 'playing' ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]' :
            friend.status === 'idle' ? 'bg-yellow-500' :
            'bg-slate-500'
          }`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-white font-bold text-xs truncate">{friend.name}</h4>
            <span className="text-[10px] font-mono text-white/40">Lvl {friend.level}</span>
          </div>
          <p className="text-[10px] text-white/50 truncate flex items-center gap-1.5">
            {friend.game ? (
              <>
                <Gamepad2 className="w-3 h-3 text-cyan-400" />
                <span className="text-cyan-300">{friend.game}</span>
              </>
            ) : (
              <span className="capitalize">{friend.status}</span>
            )}
          </p>
        </div>

        {/* Quick Action Button (Hover) */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Actions */}
      <AnimatePresence>
        {selectedFriend?.id === friend.id && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/5">
              <ActionButton icon={MessageSquare} label="Message" color="blue" onClick={() => console.log('Message', friend.name)} />
              <ActionButton icon={UserPlus} label="Invite" color="green" onClick={() => console.log('Invite', friend.name)} />
              <ActionButton icon={Swords} label="Duel" color="red" onClick={() => console.log('Duel', friend.name)} />
              <ActionButton icon={Repeat} label="Trade" color="amber" onClick={() => console.log('Trade', friend.name)} />
            </div>
            
            {friend.game && (
              <button className="w-full mt-2 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/30 flex items-center justify-center gap-2 transition-all">
                <Play className="w-3 h-3 fill-current" />
                Join {friend.game}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  const ActionButton = ({ icon: Icon, label, color, onClick }) => (
    <button 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-white/5 hover:bg-${color}-500/20 border border-white/5 hover:border-${color}-500/30 transition-all group`}
    >
      <Icon className={`w-4 h-4 text-white/60 group-hover:text-${color}-400 transition-colors`} />
      <span className="text-[9px] text-white/40 group-hover:text-white transition-colors">{label}</span>
    </button>
  );

  return (
    <div className="w-full bg-[#0a0e14]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header Tabs */}
      <div className="flex items-center p-2 gap-1 border-b border-white/10 bg-black/20">
        <TabButton 
          id="online" 
          label="Friends" 
          count={onlineFriends.length} 
          active={activeTab === 'online'} 
          onClick={setActiveTab} 
          icon={Users}
        />
        <TabButton 
          id="party" 
          label="Party" 
          count={PARTY_MEMBERS.length} 
          active={activeTab === 'party'} 
          onClick={setActiveTab} 
          icon={Crown}
        />
        <TabButton 
          id="requests" 
          label="Requests" 
          count={3} 
          active={activeTab === 'requests'} 
          onClick={setActiveTab} 
          icon={Bell}
        />
        
        <div className="ml-auto flex items-center gap-1">
          <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-3 max-h-[400px] overflow-y-auto custom-scrollbar">
        {activeTab === 'online' && (
          <div className="space-y-4">
            {/* Online Section */}
            <div>
              <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2 px-1">Online ({onlineFriends.length})</h3>
              <div className="space-y-2">
                {onlineFriends.map(f => <FriendItem key={f.id} friend={f} />)}
              </div>
            </div>

            {/* Offline Section */}
            <div>
              <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2 px-1">Offline ({offlineFriends.length})</h3>
              <div className="space-y-2 opacity-60">
                {offlineFriends.map(f => <FriendItem key={f.id} friend={f} />)}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'party' && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
              <Crown className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <h3 className="text-white font-bold text-sm">Your Party</h3>
              <p className="text-white/40 text-xs">2 / 4 Slots Filled</p>
              
              <div className="flex justify-center gap-2 mt-3">
                <button className="px-4 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold transition-colors">
                  Find Match
                </button>
                <button className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors">
                  Settings
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {PARTY_MEMBERS.map(f => <FriendItem key={f.id} friend={f} isPartyMember />)}
              {/* Empty Slots */}
              {[1, 2].map(i => (
                <div key={i} className="p-3 rounded-xl border border-white/5 bg-white/[0.02] border-dashed flex items-center justify-center gap-2 text-white/20 hover:text-white/40 hover:bg-white/5 transition-all cursor-pointer">
                  <PlusCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">Invite Player</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-2">
             {[1, 2, 3].map(i => (
               <div key={i} className="p-3 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-slate-700" />
                   <div>
                     <p className="text-white text-xs font-bold">NewPlayer_{i}</p>
                     <p className="text-white/40 text-[10px]">Wants to be friends</p>
                   </div>
                 </div>
                 <div className="flex gap-2">
                   <button className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white transition-colors">
                     <Check className="w-4 h-4" />
                   </button>
                   <button className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors">
                     <X className="w-4 h-4" />
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

const TabButton = ({ id, label, count, active, onClick, icon: Icon }) => (
  <button
    onClick={() => onClick(id)}
    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all relative ${
      active 
        ? 'bg-white/10 text-white shadow-sm' 
        : 'text-white/40 hover:text-white hover:bg-white/5'
    }`}
  >
    <Icon className={`w-3.5 h-3.5 ${active ? 'text-blue-400' : ''}`} />
    {label}
    {count > 0 && (
      <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] ${
        active ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/60'
      }`}>
        {count}
      </span>
    )}
    {active && (
      <motion.div 
        layoutId="activeTabIndicator"
        className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-400 rounded-full" 
      />
    )}
  </button>
);

const PlusCircle = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </svg>
);