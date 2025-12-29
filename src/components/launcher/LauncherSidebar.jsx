import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Wifi, WifiOff, Clock, Shield, Bell, Trophy, Zap, Download } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export default function LauncherSidebar({ activeTab, onTabChange }) {
  const { user } = useAuth();
  
  return (
    <div className="w-72 bg-[#0F1115] border-r border-white/5 flex flex-col h-full relative z-20">
      {/* Avatar / Status Section */}
      <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-cyan-500 to-blue-600 mb-4 relative group cursor-pointer">
            <div className="w-full h-full rounded-full overflow-hidden bg-black relative">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800">
                  <Bot className="w-10 h-10 text-white/50" />
                </div>
              )}
            </div>
            {/* Status Dot */}
            <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-black flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
            </div>
          </div>
          
          <h2 className="text-white font-bold text-lg">{user?.username || 'Traveler'}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/60 border border-white/5">
              Lvl 12
            </span>
            <span className="flex items-center gap-1 text-[10px] text-green-400 font-medium">
              <Shield className="w-3 h-3" /> Synced
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-px bg-white/5">
        <div className="bg-[#0F1115] p-4 flex flex-col items-center hover:bg-white/5 transition-colors cursor-pointer group">
          <Trophy className="w-5 h-5 text-yellow-500 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-white font-bold text-sm">1,240</span>
          <span className="text-[10px] text-white/30 uppercase tracking-wider">Score</span>
        </div>
        <div className="bg-[#0F1115] p-4 flex flex-col items-center hover:bg-white/5 transition-colors cursor-pointer group">
          <Zap className="w-5 h-5 text-purple-500 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-white font-bold text-sm">42</span>
          <span className="text-[10px] text-white/30 uppercase tracking-wider">Cards</span>
        </div>
      </div>

      {/* Activity Feed (Compact) */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 pb-2 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Recent Activity</h3>
          <Bell className="w-3 h-3 text-white/20" />
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pt-0 space-y-4">
          {[
            { text: "Unlocked 'Void Walker' card", time: "2m ago", type: "card" },
            { text: "Reached Level 12", time: "1h ago", type: "level" },
            { text: "Sync completed", time: "3h ago", type: "system" },
            { text: "Purchased 'Neon City' pass", time: "1d ago", type: "store" }
          ].map((activity, i) => (
            <div key={i} className="flex gap-3 relative">
              <div className="flex flex-col items-center">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${
                  activity.type === 'card' ? 'bg-purple-500' :
                  activity.type === 'level' ? 'bg-yellow-500' :
                  activity.type === 'store' ? 'bg-green-500' : 'bg-blue-500'
                }`} />
                {i < 3 && <div className="w-px h-full bg-white/5 my-1" />}
              </div>
              <div className="pb-2">
                <p className="text-sm text-white/80 leading-snug">{activity.text}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="flex items-center justify-between text-[10px] text-white/30 font-mono mb-2">
          <span>VER: 2.4.0-REL</span>
          <span>REGION: NA-EAST</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-white/60">Systems Operational</span>
        </div>
      </div>
    </div>
  );
}