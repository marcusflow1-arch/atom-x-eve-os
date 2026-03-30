import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Users, MessageSquare, Swords, Target, Clock, Newspaper } from 'lucide-react';
import Mini3DViewerBox from '@/components/dashboard/Mini3DViewerBox';

const MOCK_GAMES = [
  { id: 1, title: 'Elden Ring', cover: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=200&q=80', hours: '124h' },
  { id: 2, title: 'Cyberpunk 2077', cover: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&q=80', hours: '89h' },
  { id: 3, title: 'Shadow Realm', cover: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=200&q=80', hours: '42h' },
  { id: 4, title: 'Stellar Odyssey', cover: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=200&q=80', hours: '67h' },
  { id: 5, title: 'Neon Legends', cover: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&q=80', hours: '31h' },
  { id: 6, title: 'Dragon Age', cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&q=80', hours: '156h' },
  { id: 7, title: 'Apex Legends', cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&q=80', hours: '210h' },
  { id: 8, title: 'The Witcher 3', cover: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=200&q=80', hours: '98h' },
];

const TROPHY_COUNTS = { platinum: 0, gold: 136, silver: 652, bronze: 3300 };
const TROPHY_TOTAL = Object.values(TROPHY_COUNTS).reduce((a, b) => a + b, 0);

const ACH_CARDS = Array.from({ length: 20 }).map((_, i) => ({
  id: i,
  rarity: i % 8 === 0 ? 'legendary' : i % 4 === 0 ? 'epic' : i % 2 === 0 ? 'rare' : 'common',
  type: ['Ability', 'Equipment', 'Companion', 'Environment'][i % 4],
  gameId: MOCK_GAMES[i % MOCK_GAMES.length].id,
}));

const rarityGlow = { legendary: 'rgba(251,191,36,0.5)', epic: 'rgba(168,85,247,0.4)', rare: 'rgba(59,130,246,0.35)', common: 'rgba(255,255,255,0.1)' };
const rarityBorder = { legendary: 'border-amber-400/60', epic: 'border-purple-400/50', rare: 'border-blue-400/40', common: 'border-white/10' };
const rarityText = { legendary: 'text-amber-300', epic: 'text-purple-300', rare: 'text-blue-300', common: 'text-white/30' };

export default function FriendProfilePopover({ friend, onClose }) {
  const [friendTab, setFriendTab] = useState('games');
  const [friendRecentFilter, setFriendRecentFilter] = useState(null);
  const [achCardTilts, setAchCardTilts] = useState({});

  const displayedAchCards = friendRecentFilter ? ACH_CARDS.filter(c => c.gameId === friendRecentFilter) : ACH_CARDS;

  const handleCardMouseMove = (e, id) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setAchCardTilts(prev => ({ ...prev, [id]: { x: (y - 0.5) * 22, y: (x - 0.5) * -22, mx: x, my: y } }));
  };
  const handleCardMouseLeave = (id) => setAchCardTilts(prev => ({ ...prev, [id]: null }));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, x: -20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95, x: -20 }}
      transition={{ duration: 0.3 }}
      className="fixed top-16 right-0 bottom-12 left-[348px] z-[76] flex flex-col overflow-hidden bg-[#050a14]"
      style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Full-page background — friend's environment/skybox feel */}
      <div className="absolute inset-0 -z-0">
        <img
          src="https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1600&q=80"
          alt="bg"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(5,10,20,0.55) 0%, rgba(5,10,20,0.85) 40%, rgba(5,10,20,0.97) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(60,100,200,0.15) 0%, transparent 70%)' }} />
      </div>

      {/* Close */}
      <div className="absolute top-4 right-4 z-50">
        <button onClick={onClose} className="p-2 bg-black/30 hover:bg-black/50 rounded-full text-white/50 hover:text-white transition-colors border border-white/10 backdrop-blur-md">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── PS5-style top nav: Games ── */}
      <div className="relative z-10 flex-shrink-0 pt-5 px-8">
        <div className="flex items-center gap-8 border-b border-white/10 pb-0">
          {[
            { id: 'games', label: 'Games' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFriendTab(tab.id)}
              className={`relative pb-3 text-sm font-bold tracking-wide transition-colors ${friendTab === tab.id ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
            >
              {tab.label}
              {friendTab === tab.id && (
                <motion.div layoutId="friendTabIndicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full" />
              )}
            </button>
          ))}

          {/* Right side — user info */}
          <div className="ml-auto flex items-center gap-3 pb-3">
            <div className={`w-2.5 h-2.5 rounded-full ${friend.status === 'online' || friend.status === 'playing' ? 'bg-green-400' : 'bg-gray-500'}`} />
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
              <img src={friend.avatar} alt="avatar" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-white text-sm font-bold leading-tight">{friend.name}</p>
              <p className="text-white/40 text-[10px]">Level 42 • Diamond II</p>
            </div>
            {(friend.status === 'playing' || friend.is_streaming) && (
              <span className="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-400 text-[9px] font-bold uppercase tracking-wider animate-pulse">LIVE</span>
            )}
          </div>
        </div>
      </div>

      {/* ── GAMES TAB ── */}
      <AnimatePresence mode="wait">
        {friendTab === 'games' && (
          <motion.div
            key="games"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex-1 flex flex-col overflow-hidden px-8 py-6"
            style={{ scrollbarWidth: 'none' }}
          >
            {/* Top section: 3D viewer + recent games left, achievements right */}
            <div className="flex gap-6 mb-4 flex-shrink-0 h-[280px]">
              {/* Left: 3D Avatar Viewer + Stat Card */}
              <div className="flex-shrink-0 flex flex-col h-full w-[240px] xl:w-[280px]">
                <div className="h-full flex-shrink-0 flex flex-col items-center">
                  <Mini3DViewerBox />
                </div>
              </div>

              {/* Right: Currently playing + Recent Games + Achievements */}
              <div className="flex-1 min-w-0 flex flex-col">
                {/* Currently playing banner (compact) */}
                {(friend.status === 'playing' || friend.game) && (
                  <div className="mb-4 relative rounded-xl overflow-hidden border border-white/10 h-16 flex-shrink-0 group flex items-center px-4 gap-4"
                    style={{ background: 'rgba(15,22,38,0.8)' }}>
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] text-white/50 uppercase tracking-widest">Now Playing</p>
                      <p className="text-white font-bold text-sm truncate">{friend.game || 'Elden Ring'}</p>
                    </div>
                    <div className="ml-auto flex gap-2">
                      <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-black text-[10px] font-bold hover:bg-white/90 transition">
                        <Play className="w-2.5 h-2.5 fill-black" /> Watch
                      </button>
                      <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-white text-[10px] font-bold hover:bg-white/15 transition">
                        <Users className="w-2.5 h-2.5" /> Join
                      </button>
                    </div>
                  </div>
                )}

                {/* Recent Games - horizontal scroll */}
                <div className="mb-4 flex-shrink-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-2">Recent Games</p>
                  <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar">
                    {MOCK_GAMES.map((game) => (
                      <motion.div
                        key={game.id}
                        onClick={() => setFriendRecentFilter(friendRecentFilter === game.id ? null : game.id)}
                        whileHover={{ scale: 1.05, y: -2 }}
                        className={`flex-shrink-0 cursor-pointer group w-16 p-1 rounded-xl border transition-all ${
                          friendRecentFilter === game.id ? 'bg-white/10 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'border-transparent hover:border-white/20'
                        }`}
                      >
                        <div className="w-14 h-14 rounded-lg overflow-hidden border border-white/10 shadow-lg mb-1.5 aspect-square">
                          <img src={game.cover} alt={game.title} className="w-full h-full object-cover" />
                        </div>
                        <p className={`text-[8px] text-center font-bold truncate ${
                          friendRecentFilter === game.id ? 'text-cyan-300' : 'text-white/60 group-hover:text-white/90'
                        }`}>{game.title}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Achievements - fitted into remaining space */}
                <div className="flex-1 min-h-0 flex flex-col">
                  <div className="flex items-center justify-between mb-2 flex-shrink-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                      {friendRecentFilter ? `${MOCK_GAMES.find(g => g.id === friendRecentFilter)?.title} Achievement Cards` : 'Achievement Cards'}
                    </p>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto pr-1" style={{ scrollbarWidth: 'none' }}>
                    {/* Reduced size grid (smaller gaps, more cols) */}
                    <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-[repeat(14,minmax(0,1fr))] gap-1.5 pb-2">
                      {displayedAchCards.map((card, i) => {
                        const tilt = achCardTilts[card.id];
                        return (
                          <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            onMouseMove={(e) => handleCardMouseMove(e, card.id)}
                            onMouseLeave={() => handleCardMouseLeave(card.id)}
                            style={{
                              transformStyle: 'preserve-3d',
                              perspective: '800px',
                              transform: tilt ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` : 'rotateX(0) rotateY(0)',
                              transition: tilt ? 'transform 0.05s ease-out' : 'transform 0.4s ease-out',
                            }}
                            className={`relative rounded-xl border-2 ${rarityBorder[card.rarity]} overflow-hidden cursor-pointer group`}
                          >
                            <div style={{ aspectRatio: '2/3.5', background: 'linear-gradient(135deg, rgba(20,30,50,0.98) 0%, rgba(10,15,28,1) 100%)' }}>
                                {tilt && (
                                  <div
                                    className="absolute inset-0 pointer-events-none z-10"
                                    style={{ background: `radial-gradient(ellipse 80% 60% at ${(tilt.mx || 0.5) * 100}% ${(tilt.my || 0.5) * 100}%, rgba(255,255,255,0.12) 0%, transparent 70%)` }}
                                  />
                                )}
                                <div className="absolute inset-0" style={{ boxShadow: `inset 0 0 14px ${rarityGlow[card.rarity]}`, pointerEvents: 'none' }} />
                                <div className={`absolute top-1 left-1 w-2 h-2 border-t border-l-[1.5px] ${rarityBorder[card.rarity]} rounded-tl`} />
                                <div className={`absolute top-1 right-1 w-2 h-2 border-t border-r-[1.5px] ${rarityBorder[card.rarity]} rounded-tr`} />
                                <div className={`absolute bottom-1 left-1 w-2 h-2 border-b border-l-[1.5px] ${rarityBorder[card.rarity]} rounded-bl`} />
                                <div className={`absolute bottom-1 right-1 w-2 h-2 border-b border-r-[1.5px] ${rarityBorder[card.rarity]} rounded-br`} />
                                {card.rarity === 'legendary' && <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.8)]" />}
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-1">
                                  <span className="text-xl opacity-60 group-hover:opacity-90 transition-opacity">?</span>
                                  <span className={`text-[6px] font-bold uppercase tracking-widest ${rarityText[card.rarity]}`}>{card.rarity}</span>
                                </div>
                                <div className="absolute bottom-1.5 left-0 right-0 text-center">
                                  <span className="text-[5px] text-white/20 uppercase tracking-wider">{card.type}</span>
                                </div>
                              </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Redesigned Bottom Section - Bento Box Style */}
            <div className="flex-1 min-h-0 mt-2 overflow-y-auto custom-scrollbar pr-2">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pb-6">
                
                {/* Column 1: Player ID & Rank */}
                <div className="flex flex-col gap-5">
                  {/* Rank Card */}
                  <div className="rounded-3xl p-6 border border-white/10 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(30,40,60,0.4), rgba(15,20,30,0.8))', backdropFilter: 'blur(20px)' }}>
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Target className="w-24 h-24 text-amber-400" />
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-3">PUP Rank Score</p>
                    <div className="flex items-end gap-3 mb-5 relative z-10">
                      <span className="text-5xl font-black text-amber-400 tracking-tighter drop-shadow-lg">8,420</span>
                      <span className="mb-2 px-3 py-1 rounded-lg bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[11px] font-bold shadow-lg">Diamond II</span>
                    </div>
                    <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden mb-3 border border-white/5">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-300" style={{ width: '72%' }} />
                    </div>
                    <p className="text-[10px] text-white/50 font-medium">72% to Diamond I</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button className="flex flex-col items-center justify-center gap-2.5 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group">
                      <MessageSquare className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
                      <span className="text-[11px] font-semibold text-white/60 group-hover:text-white">Message</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-2.5 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group">
                      <Swords className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
                      <span className="text-[11px] font-semibold text-white/60 group-hover:text-white">Challenge</span>
                    </button>
                  </div>
                </div>

                {/* Column 2: Trophies & Genres */}
                <div className="flex flex-col gap-5">
                  {/* Trophies */}
                  <div className="rounded-3xl p-6 border border-white/10" style={{ background: 'rgba(15,22,38,0.4)', backdropFilter: 'blur(20px)' }}>
                    <div className="flex items-center justify-between mb-5">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-white/50">Trophies</p>
                      <span className="text-white font-bold text-xs bg-white/10 px-3 py-1 rounded-xl border border-white/10 shadow-sm">{TROPHY_TOTAL.toLocaleString()} Total</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { count: TROPHY_COUNTS.platinum, color: 'text-cyan-300', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', icon: '🏆', label: 'Platinum' },
                        { count: TROPHY_COUNTS.gold, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: '🥇', label: 'Gold' },
                        { count: TROPHY_COUNTS.silver, color: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: '🥈', label: 'Silver' },
                        { count: TROPHY_COUNTS.bronze, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: '🥉', label: 'Bronze' },
                      ].map((t, i) => (
                        <div key={i} className={`flex items-center gap-3 p-3.5 rounded-2xl border ${t.bg} ${t.border} transition-transform hover:scale-[1.02] cursor-default`}>
                          <span className="text-2xl drop-shadow-md">{t.icon}</span>
                          <div>
                            <p className={`text-base font-black ${t.color}`}>{t.count === 0 ? '0' : t.count >= 1000 ? (t.count/1000).toFixed(1)+'K' : t.count}</p>
                            <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold mt-0.5">{t.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Genres */}
                  <div className="rounded-3xl p-6 border border-white/10" style={{ background: 'rgba(15,22,38,0.4)', backdropFilter: 'blur(20px)' }}>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-4">Top Genres</p>
                    <div className="flex flex-wrap gap-2.5">
                      {['RPG', 'Action', 'Horror', 'Strategy'].map(g => (
                        <span key={g} className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 shadow-sm transition-colors hover:bg-indigo-500/20 cursor-default">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Column 3: Highlights & News */}
                <div className="flex flex-col gap-5">
                  {/* Last Action / Highlight */}
                  <div className="rounded-3xl border border-white/10 overflow-hidden group cursor-pointer relative shadow-xl" style={{ background: 'rgba(15,22,38,0.4)' }}>
                    <div className="aspect-video relative">
                      <img src="https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=600&q=80" alt="highlight" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-all duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                          <Play className="w-5 h-5 text-white fill-white ml-1" />
                        </div>
                      </div>
                      <div className="absolute top-4 right-4 px-2.5 py-1 rounded-md bg-black/60 text-[10px] text-white/90 font-mono font-semibold backdrop-blur-md border border-white/10">0:08</div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                          <p className="text-[10px] text-white/80 uppercase tracking-widest font-bold">Latest Clip</p>
                        </div>
                        <p className="text-white text-base font-bold truncate drop-shadow-md">Shadow Realm • Boss Kill</p>
                      </div>
                    </div>
                  </div>

                  {/* News Update */}
                  <div className="rounded-3xl p-6 border border-white/10 flex-1 flex flex-col justify-between" style={{ background: 'rgba(15,22,38,0.4)', backdropFilter: 'blur(20px)' }}>
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                          <Newspaper className="w-4 h-4 text-blue-400" />
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-white/50">Status Update</p>
                      </div>
                      <p className="text-white/90 text-sm leading-relaxed italic border-l-2 border-blue-500/50 pl-4 py-1">"Going AFK for 30 mins, back for the raid at 9pm!"</p>
                    </div>
                    <p className="text-white/40 text-[11px] font-semibold flex items-center gap-1.5 mt-6">
                      <Clock className="w-3.5 h-3.5" /> 12 minutes ago
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}