import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Gamepad2, Sparkles, Layers, Users, Search, ChevronLeft,
  ArrowRight, Code2, BookOpen, Twitter, Globe, Youtube,
  Clock, Zap, Star, TrendingUp, ShoppingCart, Info,
  Newspaper, CalendarDays, MessageSquare, Github, CheckCircle2
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { DEV_SPOTLIGHT_DATA } from '@/components/dashboard/devSpotlightData';
import { useCart } from '@/components/CartContext';

// ─── Mock developer insight data ───────────────────────────────────────────
const DEV_INSIGHTS = {
  'dev-1': {
    status: 'In Active Development',
    statusColor: 'text-green-400',
    statusDot: 'bg-green-400',
    headline: 'Pushing the limits of cyberpunk action with real-time ray tracing and AI-driven NPCs.',
    updates: [
      { date: 'Apr 15', text: 'Shipped Cyber Protocol 2.0 patch 1.4 — 60fps on all platforms 🎮' },
      { date: 'Apr 10', text: 'New card set "Chrome Elite" drops next Friday. 12 legendary cards.' },
      { date: 'Apr 3',  text: 'Beta testing Season 4 story DLC with select community members.' },
    ],
    devlog: 'This week the team wrapped up the final VFX pass on the endgame boss arena. Our lighting artist spent 3 days rebuilding the neon bloom shader from scratch — and the results are stunning. We also started integrating the new voice-over lines from our cast.',
    upcomingMilestones: ['Season 4 DLC — May 2026', 'Ranked PvP Mode — Q3 2026', 'Console Card Trading — Q4 2026'],
    focus: ['Card Design', 'Story DLC', 'Multiplayer Balance'],
    socials: { twitter: '#', youtube: '#', website: '#' },
  },
  'dev-2': {
    status: 'Pre-Release Polish',
    statusColor: 'text-amber-400',
    statusDot: 'bg-amber-400',
    headline: 'Deep lore, hand-crafted worlds, and a card system unlike anything before.',
    updates: [
      { date: 'Apr 14', text: 'Nightreign world map finalized — 4x bigger than our previous title.' },
      { date: 'Apr 8',  text: 'Community card design contest winner announced! Meet the "Ashwalker".' },
      { date: 'Mar 30', text: 'New story trailer dropped — 2.1M views in 48 hours.' },
    ],
    devlog: 'We\'ve been heads-down on combat feel this sprint. The team ran 200+ playtests over two weeks and iterated on parry timing until it felt just right. The card progression layer is now fully integrated into the skill tree — every card you collect feeds directly back into your build.',
    upcomingMilestones: ['Open Beta — June 2026', 'Card Collection Launch — June 2026', 'Full Release — Aug 2026'],
    focus: ['World Building', 'Combat Tuning', 'Card Integration'],
    socials: { twitter: '#', youtube: '#', website: '#' },
  },
  'dev-3': {
    status: 'Live & Expanding',
    statusColor: 'text-cyan-400',
    statusDot: 'bg-cyan-400',
    headline: 'Bringing the galaxy to life — one system at a time.',
    updates: [
      { date: 'Apr 16', text: 'Stellar Odyssey Update 2.1 is live — new nebula regions + 8 cards.' },
      { date: 'Apr 9',  text: 'Fleet combat overhaul shipped. Community feedback has been incredible.' },
      { date: 'Apr 1',  text: 'Partnership with IGDB for real-time discovery integration announced.' },
    ],
    devlog: 'Update 2.1 has been our most ambitious patch yet. The new nebula generation system uses procedural noise stacked 6 layers deep, producing unique skyboxes every session. Our card team released 8 new "Nebula Series" cards — all tied to in-game discoveries.',
    upcomingMilestones: ['Multiplayer Fleets — July 2026', 'Card Marketplace — Aug 2026', 'VR Support — 2027'],
    focus: ['Procedural World Gen', 'Fleet Mechanics', 'Card Drops'],
    socials: { twitter: '#', youtube: '#', website: '#' },
  },
  'dev-4': {
    status: 'Early Access',
    statusColor: 'text-purple-400',
    statusDot: 'bg-purple-400',
    headline: 'Indie spirit, AAA heart — making roguelikes feel alive.',
    updates: [
      { date: 'Apr 13', text: 'Void Runners roadmap Q2 published — 3 new biomes incoming.' },
      { date: 'Apr 7',  text: 'Co-op mode reached feature-complete milestone. Testing starts next week.' },
      { date: 'Mar 28', text: 'Card rarity rebalance deployed based on community tier-list feedback.' },
    ],
    devlog: 'Small team, big ambitions. This week: two devs worked on the new "Rift Biome" tileset while one tackled performance optimization — we shaved 18ms off per-frame costs. The co-op sync system is finally stable enough to push to public beta. Excited for you to see it.',
    upcomingMilestones: ['Co-op Beta — May 2026', 'New Biomes Pack — June 2026', 'Card Foil Variants — Q3 2026'],
    focus: ['Co-op Systems', 'Biome Design', 'Card Balancing'],
    socials: { twitter: '#', github: '#', website: '#' },
  },
};

const RARITY_COLORS = {
  Legendary: 'border-orange-500/50 text-orange-400 bg-orange-500/8',
  Epic: 'border-purple-500/50 text-purple-400 bg-purple-500/8',
  Rare: 'border-blue-500/50 text-blue-400 bg-blue-500/8',
  Common: 'border-slate-500/50 text-slate-400 bg-slate-500/8',
};

// ─── Left panel: developer list ────────────────────────────────────────────
function DevList({ devs, selectedDev, onSelect, searchQuery, onSearchChange }) {
  return (
    <div className="h-full flex flex-col" style={{ background: 'rgba(8,12,18,0.7)' }}>
      {/* Search */}
      <div className="p-3 flex-shrink-0 border-b border-white/5">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/25" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search studios..."
            className="w-full bg-white/4 border border-white/8 rounded-lg pl-7 pr-3 py-2 text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/15 transition-all"
          />
        </div>
      </div>

      {/* Dev list */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {devs.length === 0 ? (
          <div className="text-center py-10 text-white/20">
            <Users className="w-7 h-7 mx-auto mb-2 opacity-30" />
            <p className="text-[11px]">No studios found</p>
          </div>
        ) : devs.map(dev => {
          const isActive = selectedDev?.id === dev.id;
          const insight = DEV_INSIGHTS[dev.id];
          return (
            <motion.button
              key={dev.id}
              whileHover={{ x: 2 }}
              onClick={() => onSelect(dev)}
              className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-all border-l-2 border-b border-b-white/4 ${
                isActive
                  ? 'border-l-cyan-400 bg-white/6'
                  : 'border-l-transparent hover:bg-white/3 hover:border-l-white/20'
              }`}
            >
              <div className="relative flex-shrink-0">
                <img src={dev.logo} alt={dev.name} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                {insight && (
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-black/80 ${insight.statusDot}`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate transition-colors ${isActive ? 'text-cyan-200' : 'text-white/80'}`}>{dev.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-white/25 text-[10px] flex items-center gap-0.5"><Gamepad2 className="w-2.5 h-2.5" />{dev.gameCount}</span>
                  <span className="text-cyan-400/35 text-[10px] flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5" />{dev.cardCount}</span>
                </div>
              </div>
              {isActive && <ChevronLeft className="w-3 h-3 text-cyan-400/60 rotate-180 flex-shrink-0" />}
            </motion.button>
          );
        })}
      </div>

      {/* Footer stat */}
      <div className="flex-shrink-0 px-3 py-2 border-t border-white/5 flex items-center justify-between">
        <span className="text-white/20 text-[10px]">{devs.length} studios</span>
        <span className="text-cyan-400/25 text-[10px] flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" />{devs.reduce((s, d) => s + d.cardCount, 0)} cards</span>
      </div>
    </div>
  );
}

// ─── Right panel: Games sub-page ───────────────────────────────────────────
function GamesPanel({ dev, selectedGame, onSelectGame }) {
  const games = dev.games.map(g => ({ ...g, developerName: dev.name, cardCount: g.cards.length }));

  return (
    <div className="h-full flex flex-col">
      {/* Game grid or detail */}
      <AnimatePresence mode="wait">
        {selectedGame ? (
          <motion.div key={`game-${selectedGame.id}`} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="h-full flex flex-col">
            {/* Game header */}
            <div className="flex-shrink-0 flex items-center gap-4 p-4 border-b border-white/5">
              <motion.button whileHover={{ x: -2 }} onClick={() => onSelectGame(null)} className="flex items-center gap-1 text-white/40 hover:text-white text-[11px] transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" /> All Games
              </motion.button>
              <div className="w-px h-4 bg-white/10" />
              <div className="w-10 h-14 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                <img src={selectedGame.cover} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-sm truncate">{selectedGame.title}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge className="bg-white/8 text-white/60 border-white/15 text-[10px] h-4">{selectedGame.genre}</Badge>
                  <span className="text-white/25 text-[10px]">{selectedGame.year}</span>
                  <span className="text-cyan-400/50 text-[10px] flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5" />{selectedGame.cards.length} cards</span>
                </div>
              </div>
            </div>

            {/* Cards grid */}
            <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: 'none' }}>
              <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest mb-4">Trading Cards</p>
              {selectedGame.cards.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
                  {selectedGame.cards.map((card, i) => {
                    const rc = RARITY_COLORS[card.rarity] || RARITY_COLORS.Common;
                    return (
                      <motion.div key={card.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}
                        whileHover={{ scale: 1.06, y: -4 }}
                        className={`aspect-[2.5/3.5] rounded-xl overflow-hidden cursor-pointer border transition-all relative shadow-lg hover:shadow-cyan-500/10 ${rc}`}
                      >
                        <div className="relative w-full h-[58%] overflow-hidden">
                          <img src={card.image || selectedGame.cover} alt={card.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
                          {card.tag && <span className="absolute top-1 left-1 text-[7px] font-bold px-1 py-0.5 rounded bg-black/60 text-white/70">{card.tag}</span>}
                        </div>
                        <div className="p-1.5 flex flex-col gap-0.5">
                          <h3 className="text-white font-bold text-[9px] leading-tight line-clamp-2">{card.name}</h3>
                          <Badge variant="outline" className={`text-[7px] h-3 px-1 border w-fit ${rc}`}>{card.rarity}</Badge>
                          {card.price && <span className="text-cyan-400/70 text-[8px] font-semibold">{card.price}</span>}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-slate-600">
                  <Layers className="w-10 h-10 mb-2 opacity-20" />
                  <p className="text-xs">No cards yet</p>
                </div>
              )}

              {/* Also working on section */}
              <div className="mt-8 pt-5 border-t border-white/5">
                <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest mb-3">Also In Development</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Next Content Drop', value: 'Season 4 Cards', icon: Sparkles, color: 'text-cyan-400' },
                    { label: 'Current Build', value: 'v2.4.1 Beta', icon: Code2, color: 'text-purple-400' },
                    { label: 'Community Events', value: '2 Active', icon: CalendarDays, color: 'text-amber-400' },
                    { label: 'Patch ETA', value: '~2 weeks', icon: Clock, color: 'text-green-400' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2.5 p-3 rounded-xl border border-white/6 bg-white/3">
                      <item.icon className={`w-4 h-4 flex-shrink-0 ${item.color}`} />
                      <div>
                        <p className="text-white/30 text-[9px]">{item.label}</p>
                        <p className="text-white/80 text-xs font-semibold">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="game-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col">
            <div className="flex-shrink-0 p-4 border-b border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                <img src={dev.logo} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">{dev.name}</h3>
                <p className="text-white/30 text-[10px]">{games.length} game{games.length !== 1 ? 's' : ''} · {games.reduce((s, g) => s + g.cardCount, 0)} cards total</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: 'none' }}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {games.map((game, i) => (
                  <motion.div key={game.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    onClick={() => onSelectGame(game)}
                    className="group aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border border-white/8 hover:border-cyan-400/30 relative bg-slate-900 shadow-lg transition-all"
                  >
                    <img src={game.cover} alt={game.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h4 className="text-white font-bold text-xs leading-tight truncate">{game.title}</h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-white/35 text-[10px]">{game.genre}</span>
                        <span className="text-cyan-400/70 text-[10px] flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5" />{game.cardCount}</span>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-3.5 h-3.5 text-white/60" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Right panel: Developer Insight sub-page ───────────────────────────────
function InsightPanel({ dev }) {
  const insight = DEV_INSIGHTS[dev.id];
  if (!insight) return (
    <div className="h-full flex items-center justify-center text-white/20">
      <p className="text-sm">No insight data available</p>
    </div>
  );

  return (
    <div className="h-full flex flex-col overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
      {/* Hero */}
      <div className="flex-shrink-0 p-6 border-b border-white/5">
        <div className="flex items-start gap-4">
          <img src={dev.logo} alt={dev.name} className="w-16 h-16 rounded-2xl border border-white/15 shadow-xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`flex items-center gap-1.5 text-[10px] font-bold ${insight.statusColor}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${insight.statusDot} animate-pulse`} />
                {insight.status}
              </span>
            </div>
            <h2 className="text-white font-bold text-lg leading-snug">{dev.name}</h2>
            <p className="text-white/40 text-xs mt-1 leading-relaxed">{insight.headline}</p>
            {/* Socials */}
            <div className="flex items-center gap-2 mt-3">
              {insight.socials.twitter && <a href={insight.socials.twitter} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center transition-all"><Twitter className="w-3 h-3 text-white/50" /></a>}
              {insight.socials.youtube && <a href={insight.socials.youtube} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center transition-all"><Youtube className="w-3 h-3 text-white/50" /></a>}
              {insight.socials.github && <a href={insight.socials.github} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center transition-all"><Github className="w-3 h-3 text-white/50" /></a>}
              {insight.socials.website && <a href={insight.socials.website} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center transition-all"><Globe className="w-3 h-3 text-white/50" /></a>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-5 space-y-5">
        {/* Focus tags */}
        <div>
          <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest mb-2">Current Focus</p>
          <div className="flex flex-wrap gap-2">
            {insight.focus.map(f => (
              <span key={f} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-400/8 border border-cyan-400/15 text-cyan-300/70 text-[10px] font-semibold">
                <Zap className="w-2.5 h-2.5" />{f}
              </span>
            ))}
          </div>
        </div>

        {/* Dev log */}
        <div>
          <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5"><Newspaper className="w-3 h-3" />Dev Log</p>
          <div className="p-4 rounded-xl border border-white/6 bg-white/3">
            <p className="text-white/60 text-xs leading-relaxed">{insight.devlog}</p>
          </div>
        </div>

        {/* Latest updates */}
        <div>
          <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5"><MessageSquare className="w-3 h-3" />Latest Updates</p>
          <div className="space-y-2">
            {insight.updates.map((u, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-white/3">
                <span className="text-white/20 text-[9px] font-semibold w-10 shrink-0 pt-0.5">{u.date}</span>
                <p className="text-white/60 text-xs leading-relaxed flex-1">{u.text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Upcoming milestones */}
        <div>
          <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5"><TrendingUp className="w-3 h-3" />Upcoming Milestones</p>
          <div className="space-y-2">
            {insight.upcomingMilestones.map((m, i) => (
              <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-white/5 bg-white/3">
                <CheckCircle2 className="w-3.5 h-3.5 text-white/15 flex-shrink-0" />
                <p className="text-white/55 text-xs">{m}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── No developer selected placeholder ─────────────────────────────────────
function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-10">
      <div className="w-16 h-16 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mb-5">
        <Users className="w-7 h-7 text-white/20" />
      </div>
      <h2 className="text-white/30 font-bold text-lg mb-2">Select a Developer</h2>
      <p className="text-white/15 text-sm max-w-xs leading-relaxed">Choose a studio from the left panel to explore their games, trading cards, and what they're currently working on.</p>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function DevEditionContent() {
  const [selectedDev, setSelectedDev] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [activeTab, setActiveTab] = useState('games'); // 'games' | 'insight'
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDevs = useMemo(() => {
    const devs = DEV_SPOTLIGHT_DATA.map(dev => ({
      ...dev,
      gameCount: dev.games.length,
      cardCount: dev.games.reduce((sum, g) => sum + g.cards.length, 0),
    }));
    if (!searchQuery.trim()) return devs;
    const q = searchQuery.toLowerCase();
    return devs.filter(d => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q));
  }, [searchQuery]);

  const handleSelectDev = (dev) => {
    setSelectedDev(dev);
    setSelectedGame(null);
    setActiveTab('games');
  };

  return (
    <div className="w-full h-full flex flex-col text-white overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 30%, #0d1117 60%, #1a1f2e 100%)' }}>

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-600/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/8 rounded-full blur-[100px]" />
      </div>

      {/* ── TOP HEADER ── */}
      <div className="relative z-10 flex-shrink-0 flex items-center gap-4 px-5 h-11 border-b border-white/6"
        style={{ background: 'rgba(8,12,18,0.6)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5 text-cyan-400/70" />
          <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Developer Studio</span>
        </div>
        <div className="w-px h-4 bg-white/8" />
        <span className="text-white/20 text-[10px]">{filteredDevs.length} studios · {filteredDevs.reduce((s, d) => s + d.cardCount, 0)} cards</span>

        {/* Sub-page tabs — only when a dev is selected */}
        {selectedDev && (
          <>
            <div className="flex-1" />
            <div className="flex items-center gap-1 p-0.5 rounded-lg border border-white/8 bg-white/3">
              {[
                { id: 'games', label: 'Games & Cards', icon: Gamepad2 },
                { id: 'insight', label: 'Dev Insight', icon: BookOpen },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-white/12 text-white border border-white/15'
                      : 'text-white/35 hover:text-white/60 hover:bg-white/4'
                  }`}>
                  <tab.icon className="w-3 h-3" />
                  {tab.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── BODY: 20 / 80 ── */}
      <div className="relative z-10 flex-1 flex min-h-0">

        {/* 20% — Developer list */}
        <div className="flex-shrink-0 border-r border-white/6 overflow-hidden" style={{ width: '20%', minWidth: '180px' }}>
          <DevList
            devs={filteredDevs}
            selectedDev={selectedDev}
            onSelect={handleSelectDev}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* 80% — Content area */}
        <div className="flex-1 overflow-hidden" style={{ width: '80%' }}>
          <AnimatePresence mode="wait">
            {!selectedDev ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <EmptyState />
              </motion.div>
            ) : activeTab === 'games' ? (
              <motion.div key={`games-${selectedDev.id}`} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="h-full">
                <GamesPanel dev={selectedDev} selectedGame={selectedGame} onSelectGame={setSelectedGame} />
              </motion.div>
            ) : (
              <motion.div key={`insight-${selectedDev.id}`} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="h-full">
                <InsightPanel dev={selectedDev} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── BOTTOM FOOTER ── */}
      <div className="relative z-10 flex-shrink-0 flex items-center justify-between px-5 h-8 border-t border-white/5"
        style={{ background: 'rgba(8,12,18,0.5)', backdropFilter: 'blur(12px)' }}>
        <span className="text-white/15 text-[10px]">Dev Edition · Atom×Eve</span>
        {selectedDev && (
          <span className="text-white/20 text-[10px] flex items-center gap-1">
            <Star className="w-2.5 h-2.5" /> {selectedDev.name} · {selectedDev.games.length} games
          </span>
        )}
        <span className="text-white/15 text-[10px]">Cards update weekly</span>
      </div>
    </div>
  );
}