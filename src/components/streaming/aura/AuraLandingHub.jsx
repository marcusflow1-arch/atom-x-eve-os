import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CircleDot, Play, Sparkles, Trophy, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { streamerMockData } from './streamerMockData';

const games = [
  { name: 'SMITE 2', genre: 'Action / MOBA', color: 'from-cyan-500/30 to-blue-600/10', achievements: ['Divine Intervention', 'First Blood', 'Pantheon Rising'], abilities: ['Wrath of the Gods', 'Relic Mastery', 'Arena Control'] },
  { name: 'Fallout', genre: 'RPG / Survival', color: 'from-emerald-500/30 to-teal-600/10', achievements: ['Wasteland Walker', 'Vault Explorer', 'Nuclear Option'], abilities: ['V.A.T.S. Focus', 'Scavenger Sense', 'Power Armor'] },
  { name: 'The Elder Scrolls', genre: 'RPG / Fantasy', color: 'from-purple-500/30 to-indigo-600/10', achievements: ['Dragonborn', 'Guildmaster', 'Tamriel Traveler'], abilities: ['Dragon Shout', 'Arcane Surge', 'Soul Harvest'] },
  { name: 'Cyberpunk 2088', genre: 'Action / Sci-Fi', color: 'from-fuchsia-500/30 to-pink-600/10', achievements: ['Night City Legend', 'Chrome Runner', 'Ghost Protocol'], abilities: ['Overclock', 'Neural Hack', 'Sandevistan'] },
  { name: 'Starfield', genre: 'Space RPG', color: 'from-sky-500/30 to-indigo-600/10', achievements: ['Into the Unknown', 'Deep Space', 'Constellation'], abilities: ['Grav Dash', 'Scanner Boost', 'Starborn'] }
];

const featured = streamerMockData.slice(0, 5);

export default function AuraLandingHub() {
  const navigate = useNavigate();
  const [selectedGame, setSelectedGame] = useState(0);
  const [hero, setHero] = useState(0);

  const game = games[selectedGame];
  const heroStreamer = featured[hero % featured.length];
  const liveRows = useMemo(() => [
    { title: 'Live Channels We Think You\'ll Like', items: featured },
    { title: 'Trending Now', items: [...featured].reverse() },
    { title: 'New Streamers', items: featured.slice(1).concat(featured.slice(0, 1)) }
  ], []);

  const openStreamer = (streamer) => {
    navigate(createPageUrl('StreamingHome'), { state: { streamer } });
  };

  return (
    <div className="w-full px-4 md:px-8 pb-10 text-white">
      <div className="max-w-[1800px] mx-auto space-y-8">
        <section className="relative overflow-hidden border border-white/10 bg-white/[0.035] backdrop-blur-2xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10 pointer-events-none" />
          <div className="grid lg:grid-cols-[1.55fr_.45fr] min-h-[390px]">
            <div className="relative p-7 md:p-10 flex flex-col justify-end min-h-[390px]">
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-purple-300 mb-4"><CircleDot className="w-3 h-3" /> Featured Live</div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight">{heroStreamer?.display_name || 'Aura Live'}</h1>
                <p className="mt-3 max-w-2xl text-white/65">{heroStreamer?.title || 'Discover live creators, community moments, achievements and abilities.'}</p>
                <div className="flex items-center gap-3 mt-6">
                  <button onClick={() => openStreamer(heroStreamer)} className="px-5 py-3 bg-white text-black font-bold hover:bg-white/90 transition-colors flex items-center gap-2"><Play className="w-4 h-4 fill-current" /> Watch Stream</button>
                  <div className="px-4 py-3 bg-white/5 border border-white/10 backdrop-blur-xl text-sm">{(heroStreamer?.viewers || 0).toLocaleString()} watching</div>
                </div>
              </div>
              <div className="absolute bottom-5 right-5 flex gap-2 z-10">
                <button onClick={() => setHero((hero - 1 + featured.length) % featured.length)} className="w-10 h-10 border border-white/15 bg-black/30 backdrop-blur-xl flex items-center justify-center"><ChevronLeft /></button>
                <button onClick={() => setHero((hero + 1) % featured.length)} className="w-10 h-10 border border-white/15 bg-black/30 backdrop-blur-xl flex items-center justify-center"><ChevronRight /></button>
              </div>
            </div>
            <div className="p-6 border-t lg:border-t-0 lg:border-l border-white/10 bg-black/20 flex flex-col justify-center">
              <div className="text-xs uppercase tracking-widest text-white/40 mb-5">Aura Signal</div>
              <div className="text-3xl font-black">{featured.length * 12}+</div><div className="text-sm text-white/45 mb-5">live moments indexed</div>
              <div className="h-px bg-gradient-to-r from-white/30 via-white/10 to-transparent mb-5" />
              <div className="flex items-center gap-3"><Sparkles className="w-5 h-5 text-purple-300" /><span className="text-sm text-white/70">Community highlights updated continuously</span></div>
            </div>
          </div>
        </section>

        {liveRows.map((row) => (
          <section key={row.title}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold">{row.title}</h2><span className="text-xs uppercase tracking-widest text-white/30">Explore</span></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {row.items.map((streamer, i) => (
                <button key={`${row.title}-${i}`} onClick={() => openStreamer(streamer)} className="text-left group border border-white/10 bg-white/[0.035] backdrop-blur-xl hover:bg-white/[0.07] transition-all overflow-hidden">
                  <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-950 relative">
                    {streamer.avatar_url && <img src={streamer.avatar_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />}
                    <div className="absolute left-3 top-3 px-2 py-1 text-[10px] font-bold bg-red-500/90">LIVE</div>
                    <div className="absolute right-3 bottom-3 px-2 py-1 text-[10px] bg-black/70 backdrop-blur-md">{(streamer.viewers || 0).toLocaleString()} viewers</div>
                  </div>
                  <div className="p-3"><div className="font-bold truncate group-hover:text-purple-300">{streamer.display_name || streamer.name}</div><div className="text-xs text-white/45 truncate mt-1">{streamer.game || game.name}</div></div>
                </button>
              ))}
            </div>
          </section>
        ))}

        <section className="border-y border-white/10 py-7">
          <div className="flex items-center justify-between mb-5"><div><div className="text-xs uppercase tracking-[0.25em] text-purple-300">Collection System</div><h2 className="text-2xl font-black mt-1">Achievements & Abilities</h2></div><div className="text-xs text-white/35">Select a streamed game</div></div>
          <div className="flex gap-3 overflow-x-auto pb-3">
            {games.map((item, i) => <button key={item.name} onClick={() => setSelectedGame(i)} className={`shrink-0 px-5 py-3 border transition-all ${selectedGame === i ? 'border-purple-300/50 bg-purple-400/10' : 'border-white/10 bg-white/[0.025] hover:bg-white/[0.05]'}`}>{item.name}</button>)}
          </div>
          <div className="grid lg:grid-cols-2 gap-5 mt-5">
            <div className={`relative overflow-hidden border border-white/10 bg-gradient-to-br ${game.color} backdrop-blur-xl p-6`}>
              <div className="flex items-center gap-3 mb-5"><Trophy className="w-5 h-5 text-yellow-200" /><h3 className="font-bold">{game.name} Achievements</h3></div>
              <div className="grid grid-cols-3 gap-3">{game.achievements.map((a, i) => <div key={a} className="aspect-square border border-white/15 bg-black/20 p-3 flex flex-col justify-end"><div className="w-8 h-8 border border-white/20 flex items-center justify-center mb-auto">{i + 1}</div><div className="text-xs font-semibold">{a}</div><div className="text-[10px] text-white/35 mt-1">Locked</div></div>)}</div>
            </div>
            <div className="border border-white/10 bg-white/[0.025] backdrop-blur-xl p-6"><div className="flex items-center gap-3 mb-5"><Zap className="w-5 h-5 text-cyan-300" /><h3 className="font-bold">{game.name} Abilities</h3></div><div className="space-y-3">{game.abilities.map((a, i) => <div key={a} className="flex items-center justify-between border-b border-white/10 py-3"><div><div className="font-semibold text-sm">{a}</div><div className="text-xs text-white/35">Ability tier {i + 1}</div></div><span className="text-[10px] uppercase tracking-widest text-cyan-300/70">Discover</span></div>)}</div></div>
          </div>
        </section>
      </div>
    </div>
  );
}
