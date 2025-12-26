import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, PlayCircle, Layers, Gamepad2, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function StreamerFlow({ streamers }) {
  if (!streamers || streamers.length === 0) return null;

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Layers className="text-cyan-400" size={20} />
          <span>Alternative Paths</span>
        </h2>
        <div className="flex gap-2">
          {['Card Hunters', 'Builders', 'Lore Masters'].map(tag => (
            <Badge key={tag} variant="secondary" className="bg-white/5 hover:bg-white/10 text-white/60 cursor-pointer transition-colors">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Horizontal Fluid Scroll */}
      <div className="flex gap-6 overflow-x-auto pb-8 pt-2 px-2 scrollbar-hide snap-x">
        {streamers.map((streamer, idx) => (
          <Link key={streamer.id} to={createPageUrl('StreamerProfile') + `?id=${streamer.id}`} className="snap-center">
            <motion.div 
              whileHover={{ y: -5 }}
              className="w-[280px] flex-shrink-0 bg-slate-800/30 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden group hover:border-white/20 transition-all"
            >
              {/* Thumbnail / Intro Still */}
              <div className="relative h-40 overflow-hidden">
                <img 
                  src={streamer.intro_video_url ? streamer.intro_video_url.replace('.mp4', '.jpg') : `https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=400&fit=crop&q=80`} // Fallback for mock
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  alt={streamer.username}
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                
                {/* Live Status or Type */}
                <div className="absolute top-3 left-3">
                  <Badge className="bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold">
                    {streamer.stream_focus}
                  </Badge>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 relative">
                {/* Avatar overlapping */}
                <div className="absolute -top-8 right-4 w-12 h-12 rounded-full border-2 border-slate-800 p-0.5 bg-slate-800">
                  <img src={streamer.avatar_url} className="w-full h-full rounded-full object-cover" alt="avatar" />
                </div>

                <h3 className="text-white font-bold text-lg truncate pr-10 mb-1">{streamer.username}</h3>
                <p className="text-white/50 text-xs line-clamp-2 mb-3 h-8 leading-relaxed">
                  {streamer.bio_short}
                </p>

                {/* Games */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {(streamer.games_played || ['Unknown Game']).slice(0, 2).map((game, i) => (
                    <span key={i} className="text-[10px] text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      {game}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div className="flex items-center gap-1 text-white/40 text-xs">
                    <Heart size={12} />
                    <span>{streamer.followers || 0}</span>
                  </div>
                  <div className="flex items-center gap-1 text-white/40 text-xs group-hover:text-white transition-colors">
                    <span>Profile</span>
                    <ArrowUpRight size={12} />
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}