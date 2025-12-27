import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Crown } from 'lucide-react';

export default function FeaturedRightPanel({ streamers }) {
  const featured = streamers.slice(0, 3);

  return (
    <div className="h-full flex flex-col gap-6 pl-2 overflow-y-auto custom-scrollbar">
      
      {/* Featured Highlights */}
      <div>
        <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
          <TrendingUp size={12} className="text-cyan-400" />
          Featured Humans
        </h3>
        
        <div className="space-y-3">
          {featured.map((streamer) => (
            <motion.div 
              key={streamer.id}
              whileHover={{ scale: 1.02 }}
              className="group relative aspect-[4/5] rounded-xl overflow-hidden cursor-pointer border border-white/10"
            >
              <img src={streamer.avatar_url} alt={streamer.username} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] text-white/60 font-medium">LIVE</span>
                </div>
                <h4 className="text-white font-bold text-sm leading-tight">{streamer.username}</h4>
                <p className="text-[10px] text-white/60 line-clamp-1">{streamer.tagline}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Seasonal Pass Previews */}
      <div>
        <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Crown size={12} className="text-yellow-400" />
          Top Seasonal Passes
        </h3>
        
        <div className="space-y-3">
          {featured.map((streamer, idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
                  <img src={streamer.avatar_url} alt={streamer.username} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{streamer.username} Pass</h4>
                  <p className="text-[10px] text-white/40">Season 2 • Level 45</p>
                </div>
              </div>
              
              {/* Progress Bar Mockup */}
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-1">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 w-[60%]" />
              </div>
              <p className="text-[9px] text-cyan-300 text-right">Next Reward: Exclusive Skin</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}