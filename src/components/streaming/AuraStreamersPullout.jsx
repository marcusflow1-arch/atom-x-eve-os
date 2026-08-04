import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tv, X, Radio } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Fallback Twitch-style recently-watched streamers (name + game they're playing)
const FALLBACK_STREAMERS = [
  { name: 'NeonNinja', game: 'Valorant', avatar: 'https://source.unsplash.com/random/100x100?face,1', isLive: true, viewers: '12.5k' },
  { name: 'CyberQueen', game: 'Cyberpunk 2077', avatar: 'https://source.unsplash.com/random/100x100?face,2', isLive: true, viewers: '8.2k' },
  { name: 'TechRunner', game: 'Apex Legends', avatar: 'https://source.unsplash.com/random/100x100?face,3', isLive: false, viewers: '5.4k' },
  { name: 'PixelPhantom', game: 'Elden Ring', avatar: 'https://source.unsplash.com/random/100x100?face,4', isLive: true, viewers: '3.1k' },
  { name: 'GlitchGod', game: 'League of Legends', avatar: 'https://source.unsplash.com/random/100x100?face,5', isLive: true, viewers: '9.7k' },
  { name: 'VortexVibe', game: 'Grand Theft Auto V', avatar: 'https://source.unsplash.com/random/100x100?face,6', isLive: false, viewers: '2.2k' },
  { name: 'ShadowCast', game: 'Diablo IV', avatar: 'https://source.unsplash.com/random/100x100?face,7', isLive: true, viewers: '4.6k' },
  { name: 'NovaStream', game: 'Starfield', avatar: 'https://source.unsplash.com/random/100x100?face,8', isLive: true, viewers: '1.8k' },
];

export default function AuraStreamersPullout({ railLeftClass = 'left-[46px]' }) {
  const [open, setOpen] = useState(false);
  const [streamers, setStreamers] = useState(FALLBACK_STREAMERS);

  // Try to pull real recently-watched streams; fall back to the mock list
  useEffect(() => {
    if (!open) return;
    base44.entities.Stream.filter({ is_live: true }, '-viewer_count', 12)
      .then(res => {
        const s = res?.data || res || [];
        if (s.length) {
          setStreamers(s.map(st => ({
            name: st.streamer_name || st.title || `Stream ${st.id?.slice(0,6)}`,
            game: st.game_title || st.game_id || 'Variety',
            avatar: st.preview_image_url || st.streamer_avatar || 'https://source.unsplash.com/random/100x100?face',
            isLive: true,
            viewers: st.viewer_count != null ? String(st.viewer_count) : '—',
          })));
        }
      })
      .catch(() => {});
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {/* The purple Watch Stream button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-10 h-10 rounded-xl flex items-center justify-center border backdrop-blur-lg transition-all duration-300 hover:scale-105 ${
          open
            ? 'border-purple-400/60 bg-purple-500/25 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.35)]'
            : 'border-purple-500/30 bg-purple-500/10 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:bg-purple-500/20'
        }`}
        title="Recently Watched Streamers"
      >
        <Tv className="w-4 h-4" />
      </button>

      {/* Pullout menu to the RIGHT of the button — glass finish, blends with page */}
      <AnimatePresence>
        {open && (
          <>
            {/* Click-away catcher (transparent so the page still shows through) */}
            <div
              className="fixed inset-0 z-[70]"
              onClick={() => setOpen(false)}
              style={{ background: 'transparent' }}
            />

            <motion.div
              initial={{ x: -12, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -12, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="fixed z-[71] flex flex-col overflow-hidden rounded-2xl"
              style={{
                left: 'calc(46px + 52px)',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '248px',
                maxHeight: '70vh',
                background: 'rgba(12, 16, 22, 0.55)',
                backdropFilter: 'blur(28px) saturate(160%)',
                WebkitBackdropFilter: 'blur(28px) saturate(160%)',
                border: '1px solid rgba(168, 85, 247, 0.22)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-purple-300" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Recently Watched</span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Vertical streamer list (scrolls up/down) */}
              <div className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: 'none' }}>
                {streamers.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left group"
                  >
                    <div className="relative flex-shrink-0">
                      <img src={s.avatar} alt={s.name} className="w-9 h-9 rounded-full object-cover border border-white/10 group-hover:border-purple-400/60 transition-colors" />
                      {s.isLive && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-[#0c1016] animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold truncate group-hover:text-purple-200 transition-colors">{s.name}</p>
                      <p className="text-white/45 text-[10px] truncate">{s.game}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-white/50 flex-shrink-0">
                      {s.isLive && <span className="text-red-400">●</span>}
                      <span>{s.viewers}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="px-3 py-2.5 border-t border-white/8 flex-shrink-0">
                <div className="text-[9px] text-white/30 text-center uppercase tracking-wider">Tap a streamer to watch</div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}