import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Gamepad2, Sparkles, Layers, Users, Search, ChevronLeft,
  ArrowRight, Code2, BookOpen, Twitter, Globe, Youtube,
  Clock, Zap, Star, TrendingUp, ShoppingCart, Info,
  Newspaper, CalendarDays, MessageSquare, Github, CheckCircle2,
  Play, Image as ImageIcon, FileText, Radio, Upload, X, Grid3x3, List, Plus
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

            {/* Cards grid — fixed height, not scrollable */}
            <div className="flex-shrink-0 p-4 border-b border-white/5">
              <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest mb-3">Trading Cards</p>
              {selectedGame.cards.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 gap-2.5">
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
                <div className="h-24 flex flex-col items-center justify-center text-slate-600">
                  <Layers className="w-8 h-8 mb-1.5 opacity-20" />
                  <p className="text-xs">No cards yet</p>
                </div>
              )}
            </div>

            {/* Also In Development — scrollable feed */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
              {/* Section header */}
              <div className="sticky top-0 z-10 px-5 py-2.5 flex items-center gap-2 border-b border-white/5"
                style={{ background: 'rgba(8,12,18,0.85)', backdropFilter: 'blur(12px)' }}>
                <Zap className="w-3.5 h-3.5 text-amber-400/70" />
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Also In Development</p>
                <span className="ml-auto text-white/15 text-[9px]">Scroll to explore</span>
              </div>

              <div className="p-5 space-y-5">
                {/* Quick stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

                {/* News feed */}
                <div>
                  <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Newspaper className="w-3 h-3" />News & Updates
                  </p>
                  <div className="space-y-3">
                    {[
                      { tag: 'Patch Notes', date: 'Apr 15', title: 'Update 2.4 — Performance & Balance', body: 'Reduced load times by 40%, rebalanced 12 card rarities based on community tier-list feedback. Three new environmental events added to ranked queue.', color: 'border-l-cyan-400/50' },
                      { tag: 'Dev Blog', date: 'Apr 10', title: 'Designing Season 4: Behind the Scenes', body: 'Our lead designer walks through the creative process behind Season 4\'s card set — from concept art to final stats. Includes early sketches and scrapped ideas.', color: 'border-l-purple-400/50' },
                      { tag: 'Community', date: 'Apr 6', title: 'Card Design Contest — Winner Announced', body: 'Over 3,400 submissions were received. The winning "Ashwalker" card design will be featured as a limited Rare drop in the Season 4 launch pack.', color: 'border-l-amber-400/50' },
                    ].map((item, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        className={`p-4 rounded-xl border border-white/6 bg-white/3 border-l-2 ${item.color}`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/8 text-white/50">{item.tag}</span>
                          <span className="text-white/20 text-[9px]">{item.date}</span>
                        </div>
                        <h4 className="text-white/80 font-semibold text-xs mb-1">{item.title}</h4>
                        <p className="text-white/40 text-[11px] leading-relaxed">{item.body}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Upcoming releases */}
                <div>
                  <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <CalendarDays className="w-3 h-3" />Upcoming Releases
                  </p>
                  <div className="space-y-2">
                    {[
                      { label: 'Season 4 Card Pack', eta: 'May 2026', status: 'In QA', dot: 'bg-amber-400' },
                      { label: 'Ranked PvP Mode', eta: 'Q3 2026', status: 'In Development', dot: 'bg-cyan-400' },
                      { label: 'Console Card Trading', eta: 'Q4 2026', status: 'Planned', dot: 'bg-white/20' },
                      { label: 'Foil Card Variants', eta: '2027', status: 'Concept Phase', dot: 'bg-white/10' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-white/5 bg-white/2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.dot}`} />
                        <p className="text-white/60 text-xs flex-1">{item.label}</p>
                        <span className="text-white/20 text-[10px]">{item.eta}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/6 text-white/35">{item.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Video teaser placeholder */}
                <div>
                  <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Youtube className="w-3 h-3" />Latest Video
                  </p>
                  <div className="relative rounded-xl overflow-hidden border border-white/8 bg-black/40 aspect-video flex items-center justify-center cursor-pointer group hover:border-white/15 transition-all">
                    <img src={selectedGame.cover} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="relative z-10 w-12 h-12 rounded-full bg-white/15 border border-white/20 flex items-center justify-center group-hover:bg-white/25 transition-all">
                      <div className="w-0 h-0 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-l-[12px] border-l-white/80 ml-1" />
                    </div>
                    <div className="absolute bottom-3 left-4 right-4">
                      <p className="text-white/70 text-xs font-semibold">Season 4 — Official Reveal Trailer</p>
                      <p className="text-white/30 text-[10px]">2:34 · 1.8M views</p>
                    </div>
                  </div>
                </div>

                {/* Community spotlight */}
                <div className="pb-4">
                  <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3" />Community Spotlight
                  </p>
                  <div className="p-4 rounded-xl border border-white/6 bg-white/3">
                    <p className="text-white/50 text-xs leading-relaxed italic">"The card balancing in this patch finally made Rare-tier cards viable in ranked. Really feel like the dev team is listening."</p>
                    <p className="text-white/25 text-[10px] mt-2">— Community member · Top voted this week</p>
                  </div>
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

// ─── Studio Media Hub Content Component ────────────────────────────────────
function MediaHub({ dev }) {
  const [activeSection, setActiveSection] = useState('media'); // 'media' | 'todo' | 'studio'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Mock media content (developers would upload these)
  const studioMedia = {
    screenshots: [
      { id: 1, url: 'https://images.unsplash.com/photo-1538481143235-d20a8f3d3f0b?w=500&h=300&fit=crop', title: 'New Forest Biome', type: 'screenshot', date: '2 days ago' },
      { id: 2, url: 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=500&h=300&fit=crop', title: 'Combat Update', type: 'screenshot', date: '4 days ago' },
      { id: 3, url: 'https://images.unsplash.com/photo-1511393877671-d01a34e1e897?w=500&h=300&fit=crop', title: 'UI Redesign', type: 'artwork', date: '1 week ago' },
    ],
    videos: [
      { id: 1, title: 'Season 4 Reveal Trailer', duration: '2:34', views: '1.8M', thumbnail: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&h=340&fit=crop' },
      { id: 2, title: 'Behind-the-Scenes Studio Tour', duration: '8:45', views: '450K', thumbnail: 'https://images.unsplash.com/photo-1559027615-cd2628902d4a?w=600&h=340&fit=crop' },
    ],
    todos: [
      { id: 1, task: 'Finalize Season 4 boss arena VFX', status: 'in-progress', priority: 'high', dueDate: 'Apr 25' },
      { id: 2, task: 'Voice-over recording sessions', status: 'in-progress', priority: 'high', dueDate: 'Apr 28' },
      { id: 3, task: 'Card balance pass for ranked', status: 'pending', priority: 'medium', dueDate: 'May 5' },
      { id: 4, task: 'Community cosmetic voting', status: 'pending', priority: 'low', dueDate: 'May 15' },
    ],
  };

  return (
    <div className="h-full flex flex-col">
      {/* Sub-navigation tabs */}
      <div className="flex-shrink-0 border-b border-white/5 px-5 py-3 flex items-center gap-4"
        style={{ background: 'rgba(8,12,18,0.6)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2">
          {[
            { id: 'media', label: 'Studio Media', icon: ImageIcon },
            { id: 'todo', label: 'Dev To-Do', icon: FileText },
            { id: 'studio', label: 'Live Studio', icon: Radio },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
                activeSection === tab.id
                  ? 'bg-white/10 text-white border-white/20'
                  : 'text-white/50 border-transparent hover:text-white/80'
              }`}>
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* View mode toggle (for media) */}
        {activeSection === 'media' && (
          <div className="ml-auto flex items-center gap-1 p-1 rounded-lg border border-white/10 bg-white/5">
            <button onClick={() => setViewMode('grid')} className={`p-1 rounded transition-all ${viewMode === 'grid' ? 'bg-white/15 text-white' : 'text-white/30'}`}>
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-1 rounded transition-all ${viewMode === 'list' ? 'bg-white/15 text-white' : 'text-white/30'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
        <AnimatePresence mode="wait">
          {activeSection === 'media' && (
            <motion.div key="media" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 space-y-6">
              {/* Upload area */}
              <div className="p-6 rounded-xl border-2 border-dashed border-cyan-400/30 bg-cyan-400/5 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-cyan-400/50 hover:bg-cyan-400/8 transition-all">
                <Upload className="w-8 h-8 text-cyan-400/50" />
                <div className="text-center">
                  <p className="text-white font-semibold text-sm">Drag to upload or click</p>
                  <p className="text-white/40 text-xs mt-1">Screenshots, artwork, videos, concept art</p>
                </div>
              </div>

              {/* Screenshots & Artwork */}
              <div>
                <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" />Studio Media</p>
                <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 gap-3' : 'space-y-2'}>
                  {studioMedia.screenshots.map((item, i) => (
                    <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className={`relative rounded-lg overflow-hidden border border-white/8 hover:border-white/15 group cursor-pointer transition-all ${viewMode === 'list' ? 'flex items-center gap-3 p-3 bg-white/3' : 'aspect-video bg-white/3'}`}>
                      <img src={item.url} alt={item.title} className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${viewMode === 'list' ? 'w-20 h-12 rounded' : ''}`} />
                      <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent ${viewMode === 'list' ? 'relative w-auto h-auto' : ''}`} />
                      <div className={`absolute bottom-2 left-2 right-2 z-10 ${viewMode === 'list' ? 'absolute relative flex-1' : ''}`}>
                        <p className="text-white text-xs font-semibold truncate">{item.title}</p>
                        <p className="text-white/40 text-[10px] mt-0.5">{item.date}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Videos */}
              <div>
                <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5"><Youtube className="w-3.5 h-3.5" />Videos & Trailers</p>
                <div className="space-y-3">
                  {studioMedia.videos.map((v, i) => (
                    <motion.div key={v.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      className="relative rounded-lg overflow-hidden border border-white/8 hover:border-white/15 aspect-video group cursor-pointer">
                      <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20" />
                      <button className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <div className="w-12 h-12 rounded-full bg-white/20 border border-white/30 flex items-center justify-center group-hover:bg-white/30 transition-all">
                          <Play className="w-5 h-5 text-white ml-0.5 fill-white" />
                        </div>
                      </button>
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-white text-xs font-semibold truncate">{v.title}</p>
                        <div className="flex items-center justify-between text-white/50 text-[10px] mt-1">
                          <span>{v.duration}</span>
                          <span>{v.views} views</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'todo' && (
            <motion.div key="todo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />Development To-Do List</p>
                <button className="w-7 h-7 rounded-lg bg-cyan-400/15 border border-cyan-400/30 flex items-center justify-center hover:bg-cyan-400/25 transition-all text-cyan-400">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {studioMedia.todos.map((todo, i) => (
                  <motion.div key={todo.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                    className="p-3 rounded-lg border border-white/6 bg-white/3 hover:bg-white/4 group transition-all">
                    <div className="flex items-start gap-3">
                      <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-white/20 accent-cyan-400 cursor-pointer" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${todo.status === 'in-progress' ? 'text-white' : 'text-white/60'}`}>{todo.task}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                            todo.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                            todo.priority === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                            'bg-white/8 text-white/50'
                          }`}>{todo.priority}</span>
                          <span className="text-white/30 text-[9px]">Due: {todo.dueDate}</span>
                          {todo.status === 'in-progress' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-300">In Progress</span>}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeSection === 'studio' && (
            <motion.div key="studio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest">Live Studio Broadcast</p>
              </div>

              {/* Live stream placeholder */}
              <div className="relative rounded-xl overflow-hidden aspect-video bg-black/40 border border-white/8 flex items-center justify-center group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 via-transparent to-black/40" />
                <img src="https://images.unsplash.com/photo-1559027615-cd2628902d4a?w=800&h=450&fit=crop" alt="Studio" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity" />
                <div className="relative z-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mb-3 mx-auto">
                    <Radio className="w-6 h-6 text-red-500" />
                  </div>
                  <p className="text-white font-bold text-sm">Live Now!</p>
                  <p className="text-white/60 text-xs mt-1">Studio walkthrough with dev team</p>
                  <p className="text-red-400 text-[10px] mt-2 flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    237 watching
                  </p>
                </div>
              </div>

              {/* Live chat area */}
              <div className="p-4 rounded-lg border border-white/6 bg-white/3">
                <p className="text-white/50 text-xs font-semibold mb-3">Stream Chat</p>
                <div className="space-y-2 h-48 overflow-y-auto mb-3" style={{ scrollbarWidth: 'thin' }}>
                  {[
                    { user: 'GameDev_Fan', msg: 'Amazing office setup! 🔥' },
                    { user: 'Artist_Pro', msg: 'Those character rigs look incredible' },
                    { user: 'Community_Lead', msg: 'Can't wait for Season 4!' },
                  ].map((chat, i) => (
                    <div key={i} className="text-[11px]">
                      <span className="text-cyan-400 font-semibold">{chat.user}:</span> <span className="text-white/60">{chat.msg}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" placeholder="Send a message..." className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/20" />
                  <button className="px-3 py-2 rounded bg-cyan-500 text-white text-[11px] font-semibold hover:bg-cyan-600 transition-all">Send</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
    <div className="h-full flex flex-col">
      {/* Hero section */}
      <div className="flex-shrink-0 p-5 border-b border-white/5">
        <div className="flex items-start gap-4">
          <img src={dev.logo} alt={dev.name} className="w-14 h-14 rounded-xl border border-white/15 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`flex items-center gap-1.5 text-[10px] font-bold ${insight.statusColor}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${insight.statusDot} animate-pulse`} />
                {insight.status}
              </span>
            </div>
            <h2 className="text-white font-bold text-sm leading-snug">{dev.name}</h2>
            <p className="text-white/40 text-[11px] mt-0.5 leading-relaxed">{insight.headline}</p>
            <div className="flex items-center gap-1.5 mt-2">
              {insight.socials.twitter && <a href={insight.socials.twitter} className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center transition-all"><Twitter className="w-2.5 h-2.5 text-white/50" /></a>}
              {insight.socials.youtube && <a href={insight.socials.youtube} className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center transition-all"><Youtube className="w-2.5 h-2.5 text-white/50" /></a>}
              {insight.socials.github && <a href={insight.socials.github} className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center transition-all"><Github className="w-2.5 h-2.5 text-white/50" /></a>}
              {insight.socials.website && <a href={insight.socials.website} className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center transition-all"><Globe className="w-2.5 h-2.5 text-white/50" /></a>}
            </div>
          </div>
        </div>
      </div>

      {/* Media Hub */}
      <MediaHub dev={dev} />
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