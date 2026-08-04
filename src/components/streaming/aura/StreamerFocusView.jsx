import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Users, Heart, Share2, Clock, ExternalLink, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { formatViewers, formatUptime } from './streamerMockData';

/** The 90% top region: the clicked streamer's page (player + channel info + chat). */
export default function StreamerFocusView({ streamer }) {
  const navigate = useNavigate();
  const [following, setFollowing] = useState(false);

  return (
    <motion.div
      key={streamer.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="h-full w-full overflow-y-auto px-4 md:px-6 pb-6"
    >
      <div className="max-w-[1800px] mx-auto grid grid-cols-12 gap-4">
        {/* Player */}
        <div className="col-span-12 xl:col-span-9">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10">
            <img src={streamer.thumbnail} alt={streamer.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[11px] font-bold">LIVE</span>
              <span className="px-2 py-0.5 rounded bg-black/70 text-white/90 text-[11px] font-semibold inline-flex items-center gap-1">
                <Eye className="w-3 h-3" /> {formatViewers(streamer.viewers)} watching
              </span>
              <span className="px-2 py-0.5 rounded bg-black/70 text-white/70 text-[11px] inline-flex items-center gap-1">
                <Clock className="w-3 h-3" /> {formatUptime(streamer.uptimeMinutes)}
              </span>
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <h2 className="text-white font-bold text-lg md:text-2xl drop-shadow">{streamer.title}</h2>
              <p className="text-cyan-200 text-sm font-semibold">Playing {streamer.game}</p>
            </div>
          </div>

          {/* Channel bar */}
          <div className="mt-4 flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-xl">
            <img src={streamer.avatar} alt={streamer.name} className="w-14 h-14 rounded-full border-2 border-cyan-400/50 object-cover" />
            <div className="min-w-0 flex-1">
              <h3 className="text-white font-bold text-lg truncate">{streamer.name}</h3>
              <p className="text-white/50 text-xs inline-flex items-center gap-1.5">
                <Users className="w-3 h-3" /> {formatViewers(streamer.followers)} followers
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {streamer.tags.map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-[10px] font-semibold uppercase tracking-wide">{t}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFollowing((f) => !f)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all inline-flex items-center gap-2 border ${
                  following
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-gradient-to-r from-purple-500 to-cyan-500 border-transparent text-white shadow-[0_0_20px_rgba(6,182,212,0.35)]'
                }`}
              >
                <Heart className={`w-4 h-4 ${following ? 'fill-current text-pink-400' : ''}`} />
                {following ? 'Following' : 'Follow'}
              </button>
              <button className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.12] flex items-center justify-center text-white/70">
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate(createPageUrl('StreamerProfile') + `?id=${streamer.id}`)}
                className="px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.12] text-white/80 text-xs font-bold inline-flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Full Page
              </button>
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="col-span-12 xl:col-span-3">
          <div className="h-full min-h-[320px] rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-xl flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span className="text-white text-sm font-bold">Stream Chat</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {['Let\'s go!', 'That was clean', 'first time here, love the vibe', 'what build is that?', 'GG', 'clip it'].map((m, i) => (
                <p key={i} className="text-sm">
                  <span className="font-bold text-cyan-300">viewer_{i + 1}</span>
                  <span className="text-white/70"> {m}</span>
                </p>
              ))}
            </div>
            <div className="p-3 border-t border-white/10">
              <input
                placeholder="Send a message"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 outline-none focus:border-cyan-400/40"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}