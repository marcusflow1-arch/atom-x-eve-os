import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Eye } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SectionShell, { glassCard, EmptyState, LoadingState } from '../SectionShell';
import PlayerProfilePanel from '../PlayerProfilePanel';

// Live Broadcasts — real Stream backend; click a streamer to open their profile (with Add Friend)
export default function LiveSection({ accent }) {
  const [streams, setStreams] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    base44.entities.Stream.filter({ is_live: true }, '-viewer_count', 24).then(setStreams);
  }, []);

  const openStreamer = async (stream) => {
    const users = await base44.entities.User.filter({ id: stream.streamer_id });
    const u = users[0];
    const progs = u ? await base44.entities.AvatarProgression.filter({ user_id: u.id }) : [];
    setSelectedPlayer({
      id: stream.streamer_id,
      name: u?.username || u?.full_name || 'Streamer',
      avatar: u?.avatar_url || '',
      subtitle: `Streaming: ${stream.title}`,
      level: progs[0]?.global_level ?? 1,
      xp: progs[0]?.global_xp ?? 0,
      genres: progs[0]?.genres,
    });
  };

  if (streams === null) return <LoadingState />;

  return (
    <SectionShell title="Live Broadcasts" accent={accent} subtitle="Who's on air across Atom X Eve right now">
      <div className="relative h-full">
        {streams.length === 0 ? (
          <EmptyState icon={Radio} message="Nobody is live right now. Be the first — go live from the Aura page." />
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            {streams.map((s, i) => (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => openStreamer(s)}
                className="text-left overflow-hidden group" style={glassCard('rgba(74,222,128,0.28)')}
              >
                <div className="relative aspect-video bg-black/40 overflow-hidden">
                  {s.preview_image_url
                    ? <img src={s.preview_image_url} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full flex items-center justify-center"><Radio className="w-8 h-8 text-white/15" /></div>}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-red-600 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
                  </span>
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white/80 text-[10px] font-bold flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {(s.viewer_count || 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-3.5">
                  <p className="text-white font-semibold text-sm truncate">{s.title}</p>
                  <p className="text-white/40 text-[11px] mt-0.5">
                    {s.mode === 'talking' ? 'Just Chatting' : 'Gameplay'}{s.tags?.length ? ` · ${s.tags.slice(0, 2).join(' · ')}` : ''}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
        <AnimatePresence>
          {selectedPlayer && <PlayerProfilePanel player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
        </AnimatePresence>
      </div>
    </SectionShell>
  );
}