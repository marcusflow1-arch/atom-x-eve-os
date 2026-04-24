import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Radio, Play, Users, ChevronRight, Gamepad2 } from 'lucide-react';
import { libraryGames } from '../dashboard/gamehub/mockLibraryData';

const mockChatMessages = [
  { user: 'NovaPulse', color: 'text-purple-400', msg: 'insane run omg!! 🔥' },
  { user: 'CyberAce', color: 'text-cyan-400', msg: 'bro just one-shotted that boss' },
  { user: 'VoidWalker', color: 'text-pink-400', msg: 'what build is this? 👀' },
  { user: 'ShadowX', color: 'text-yellow-400', msg: 'W streamer always coming through' },
  { user: 'NeonKid', color: 'text-green-400', msg: 'PogChamp PogChamp PogChamp' },
  { user: 'DataStream', color: 'text-blue-400', msg: 'this game is actually underrated' },
  { user: 'NovaPulse', color: 'text-purple-400', msg: 'how many hours do you have??' },
  { user: 'CryptoMage', color: 'text-orange-400', msg: 'just bought this game watching this lol' },
  { user: 'Axion_7', color: 'text-red-400', msg: 'clip that!! clip that!!' },
  { user: 'LunarDev', color: 'text-cyan-300', msg: 'EZ Clap the devs cooked' },
];

export default function LivestreamOverlay({ isOpen, onClose }) {
  const [selectedGame, setSelectedGame] = useState(libraryGames[0] || null);
  const [chatMsg, setChatMsg] = useState('');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[75]"
          />

          {/* Main Overlay Panel — covers everything right of the left nav */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="fixed z-[76] flex overflow-hidden"
            style={{
              left: '80px',
              top: '64px',
              bottom: 0,
              right: 0,
              background: 'rgba(8, 10, 18, 0.95)',
              backdropFilter: 'blur(40px)',
            }}
          >
            {/* ── LEFT RAIL: 15% — Other Games ── */}
            <div
              className="flex-shrink-0 flex flex-col border-r border-white/8 overflow-hidden"
              style={{ width: '15%', background: 'rgba(255,255,255,0.02)' }}
            >
              <div className="px-3 py-3 border-b border-white/8 flex-shrink-0">
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Other Games</p>
              </div>
              <div className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: 'none' }}>
                {libraryGames.map((game, i) => (
                  <button
                    key={game.id || i}
                    onClick={() => setSelectedGame(game)}
                    className={`w-full flex flex-col items-center gap-1.5 px-2 py-2.5 transition-all group ${
                      selectedGame?.id === game.id ? 'bg-red-500/10 border-r-2 border-red-500' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="w-10 h-14 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 shadow-lg group-hover:border-red-400/30 transition-colors">
                      <img
                        src={game.cover || game.cover_image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200'}
                        alt={game.title || game.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-[9px] text-white/50 text-center leading-tight line-clamp-2 group-hover:text-white/80 transition-colors w-full px-1">
                      {game.title || game.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* ── RIGHT AREA: 85% — Stream + Chat ── */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  <span className="text-white font-bold text-sm uppercase tracking-wider">Live Stream</span>
                  <span className="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold">LIVE</span>
                  {selectedGame && (
                    <span className="text-white/40 text-xs">
                      StreamerXO is playing <span className="text-white/70">{selectedGame.title || selectedGame.name}</span>
                    </span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body: Stream + Chat side by side */}
              <div className="flex-1 flex overflow-hidden">

                {/* Stream box — takes ~70% of the 85% area */}
                <div className="flex-[2] min-w-0 p-4 flex flex-col gap-3">
                  <div className="flex-1 relative bg-black/40 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center">
                    {/* Blurred game art as stream background */}
                    {selectedGame && (
                      <img
                        src={selectedGame.banner || selectedGame.cover_image || selectedGame.cover}
                        alt="stream bg"
                        className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/50" />

                    {/* Play button */}
                    <div className="relative z-10 flex flex-col items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.4)]">
                        <Play className="w-8 h-8 text-white fill-white ml-1" />
                      </div>
                      <p className="text-white font-bold text-base">Tap to Watch Live</p>
                      <p className="text-white/40 text-sm">StreamerXO • {selectedGame?.title || 'Game'} • Started 2h ago</p>
                    </div>

                    {/* Streamer badge */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white border-2 border-white/20">S</div>
                      <div className="px-2 py-1 rounded bg-black/70 backdrop-blur-sm text-xs text-white font-medium">StreamerXO</div>
                    </div>
                    <div className="absolute bottom-4 right-4 flex items-center gap-1 px-2 py-1 rounded bg-black/70 backdrop-blur-sm">
                      <Users className="w-3 h-3 text-white/60" />
                      <span className="text-white/60 text-xs">1,204</span>
                    </div>
                  </div>
                </div>

                {/* Chat box — takes ~30% of the 85% area */}
                <div className="w-72 flex-shrink-0 flex flex-col border-l border-white/8 overflow-hidden">
                  {/* Chat header */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-white font-bold text-xs uppercase tracking-wider">Stream Chat</span>
                    </div>
                    <span className="text-white/30 text-[10px]">842 chatters</span>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5" style={{ scrollbarWidth: 'none' }}>
                    {mockChatMessages.map((msg, i) => (
                      <div key={i} className="text-xs leading-relaxed">
                        <span className={`font-bold ${msg.color}`}>{msg.user}</span>
                        <span className="text-white/20 mx-1">:</span>
                        <span className="text-white/70">{msg.msg}</span>
                      </div>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="px-3 py-3 border-t border-white/8 flex-shrink-0">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                      <input
                        type="text"
                        value={chatMsg}
                        onChange={e => setChatMsg(e.target.value)}
                        placeholder="Send a message..."
                        className="flex-1 bg-transparent text-xs text-white/80 placeholder-white/25 outline-none"
                      />
                      <button className="text-red-400 hover:text-red-200 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}