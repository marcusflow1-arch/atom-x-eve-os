import React from 'react';
import { motion } from 'framer-motion';
import { Play, Users, Calendar, Trophy, Star, Zap, Shield, Heart } from 'lucide-react';

const STREAM_MODES = {
  'Card Collector': { color: 'text-amber-400', icon: Trophy },
  'Explorer': { color: 'text-emerald-400', icon: Calendar },
  'Completionist': { color: 'text-blue-400', icon: Shield },
  'Strategist': { color: 'text-purple-400', icon: Zap },
};

export default function StreamerProfilePreview({ streamer, onEnterStream }) {
  const ModeIcon = STREAM_MODES[streamer.focus]?.icon || Star;
  const modeColor = STREAM_MODES[streamer.focus]?.color || 'text-cyan-400';

  return (
    <div className="h-screen w-full flex items-center justify-center p-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-900" />
      <div className="absolute inset-0 opacity-20">
        <img src={streamer.avatar} className="w-full h-full object-cover blur-3xl scale-150" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
      >
        {/* Left: Streamer Visual */}
        <div className="space-y-6">
          <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
            <img 
              src={streamer.avatar} 
              alt={streamer.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            {streamer.is_live && (
              <div className="absolute top-6 left-6 px-4 py-2 bg-red-500 rounded-full flex items-center gap-2 font-bold text-white shadow-lg animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full" />
                LIVE NOW
              </div>
            )}

            <div className="absolute bottom-6 left-6 right-6 space-y-3">
              <h1 className="text-5xl font-black text-white tracking-tight">
                {streamer.name}
              </h1>
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/20`}>
                  <ModeIcon className={`w-4 h-4 ${modeColor}`} />
                  <span className={`text-sm font-bold ${modeColor}`}>{streamer.focus}</span>
                </div>
                {streamer.is_live && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/20">
                    <Users className="w-4 h-4 text-white" />
                    <span className="text-white font-bold text-sm">{streamer.viewer_count?.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Profile Info */}
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 space-y-6">
            <div>
              <h3 className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-3">About</h3>
              <p className="text-white/80 leading-relaxed text-lg">
                {streamer.bio || "No bio available."}
              </p>
            </div>

            <div>
              <h3 className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-3">Games</h3>
              <div className="flex flex-wrap gap-2">
                {streamer.recent_games?.map((game, i) => (
                  <div key={i} className="px-3 py-1.5 bg-white/10 border border-white/10 rounded-lg text-sm text-white">
                    {game}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-3">Schedule</h3>
              <div className="flex items-center gap-2 text-white/80">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{streamer.schedule || "No schedule set"}</span>
              </div>
            </div>
          </div>

          {/* Enter Stream CTA */}
          {streamer.is_live && (
            <motion.button
              onClick={onEnterStream}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-6 rounded-2xl font-black text-xl uppercase tracking-wider relative overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.8) 0%, rgba(220, 38, 38, 0.9) 100%)',
                boxShadow: '0 20px 60px rgba(239, 68, 68, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <span className="relative z-10 flex items-center justify-center gap-3 text-white">
                <Play className="w-6 h-6 fill-white" />
                Enter Live Stream
              </span>
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}