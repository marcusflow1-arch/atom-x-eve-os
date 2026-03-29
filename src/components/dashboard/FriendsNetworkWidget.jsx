import React from 'react';
import { User } from 'lucide-react';

export default function FriendsNetworkWidget({ styleOverride = {} }) {
  const boxStyle = {
    background: 'linear-gradient(135deg, rgba(15, 20, 30, 0.7) 0%, rgba(8, 12, 18, 0.85) 100%)',
    backdropFilter: 'blur(30px) saturate(150%)',
    WebkitBackdropFilter: 'blur(30px) saturate(150%)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 15px 35px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.05)',
    ...styleOverride
  };

  const friendsList = [
    { id: 1, name: 'Shadow_Striker', status: 'online', game: 'Cyberpunk 2088', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' },
    { id: 2, name: 'CyberVixen', status: 'online', game: 'Final Fantasy XIV', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    { id: 3, name: 'GhostReaper', status: 'idle', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150' },
    { id: 4, name: 'IronFist', status: 'offline', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150' },
    { id: 5, name: 'NovaStar', status: 'online', game: 'League of Legends', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150' },
  ];

  return (
    <div 
      className="w-full h-full rounded-2xl p-6 flex flex-col gap-4 overflow-hidden relative group hover:border-white/20 transition-colors pointer-events-auto"
      style={boxStyle}
    >
      <div className="flex items-center gap-2 mb-2">
        <User className="w-5 h-5 text-blue-400" />
        <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest">Online Friends</h3>
        <span className="ml-auto text-xs text-white/40">{friendsList.length} total</span>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {friendsList.map(friend => (
          <div 
            key={friend.id} 
            className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:border-blue-400/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition cursor-pointer"
          >
            <div className="relative">
              <img src={friend.avatar} alt={friend.name} className="w-12 h-12 rounded-lg object-cover" />
              <div className={`absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full border-[3px] border-[#0a0e14] ${
                friend.status === 'online' ? 'bg-green-500' : 
                friend.status === 'idle' ? 'bg-yellow-500' : 'bg-gray-500'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-base font-semibold truncate">{friend.name}</p>
              <p className="text-white/50 text-sm truncate mt-0.5">
                {friend.game ? <span className="text-blue-300">{friend.game}</span> : <span className="capitalize">{friend.status}</span>}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}