import React, { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Play, Clock, Trophy, Star, Filter, ChevronDown,
  MessageSquare, Newspaper, Target, ShoppingBag, BookOpen, Users,
  Images, Radio, Download, Heart, Camera, Video, Wrench, Bug,
  Sparkles, Gift, CheckCircle2, Circle, Zap, ChevronLeft, ChevronRight,
  ExternalLink, Gamepad2, Activity, Swords, SlidersHorizontal
} from 'lucide-react';

const FILTERS = ['All', 'Playing', 'Installed', 'New'];

const ALL_GAMES = [
  { id: 'cyberpunk', title: 'Cyberpunk 2088', genre: 'RPG / Action', thumb: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600', status: 'Playing', progress: 72, playtime: '48.2h', achievements: '18/50', rating: 9.4, players: '2.1M', description: 'Navigate a dystopian megacity as a mercenary outlaw pursuing the key to immortality.', tags: ['Open World', 'Story Rich', 'Cyberpunk'] },
  { id: 'neon-legends', title: 'Neon Legends', genre: 'Action / Brawler', thumb: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1600', status: 'In Progress', progress: 45, playtime: '12.8h', achievements: '6/30', rating: 8.7, players: '880K', description: 'Battle across neon-lit arenas in fast-paced combat and dominate the online leaderboard.', tags: ['Fighting', 'Multiplayer', 'Competitive'] },
  { id: 'stellar-odyssey', title: 'Stellar Odyssey', genre: 'Space Sim', thumb: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=500', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=1600', status: 'Installed', progress: 10, playtime: '3.1h', achievements: '2/40', rating: 8.1, players: '320K', description: 'Chart unexplored galaxies, build starships, and forge alliances across the cosmos.', tags: ['Space', 'Exploration', 'Sci-Fi'] },
  { id: 'shadow-realm', title: 'Shadow Realm', genre: 'Fantasy RPG', thumb: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=500', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1600', status: 'New', progress: 0, playtime: '0h', achievements: '0/45', rating: 9.1, players: '1.4M', description: 'A dark fantasy epic where ancient gods clash and mortal heroes rise.', tags: ['Dark Fantasy', 'RPG', 'Souls-like'] },
  { id: 'apex-surge', title: 'Apex Surge', genre: 'Battle Royale', thumb: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600', status: 'Installed', progress: 33, playtime: '20.5h', achievements: '9/25', rating: 8.5, players: '3.8M', description: 'Drop into high-stakes arenas where movement, teamwork, and smart loadouts win.', tags: ['Battle Royale', 'FPS', 'Competitive'] },
  { id: 'mythforge', title: 'MythForge Online', genre: 'MMORPG', thumb: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=500', image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1600', status: 'Playing', progress: 88, playtime: '210h', achievements: '44/50', rating: 9.6, players: '5.2M', description: 'A living world of mythic quests, guild wars, crafting, raids, and evolving lore.', tags: ['MMORPG', 'PvP', 'Crafting', 'Guild'] },
  { id: 'dragon-siege', title: 'Dragon Siege', genre: 'Strategy', thumb: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=500', image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=1600', status: 'New', progress: 5, playtime: '1.2h', achievements: '1/20', rating: 8.3, players: '420K', description: 'Command armies, manage resources, and build an empire across a war-torn continent.', tags: ['Strategy', 'RTS'] },
  { id: 'void-runner', title: 'Void Runner', genre: 'Platformer', thumb: 'https://images.unsplash.com/photo-1461988320302-91bde64fc8e4?w=500', image: 'https://images.unsplash.com/photo-1461988320302-91bde64fc8e4?w=1600', status: 'Installed', progress: 60, playtime: '8.4h', achievements: '12/30', rating: 7.9, players: '180K', description: 'Race through procedurally generated voids with fluid movement and precision platforming.', tags: ['Platformer', 'Roguelite'] },
  { id: 'iron-alliance', title: 'Iron Alliance', genre: 'FPS / Tactical', thumb: 'https://images.unsplash.com/photo-1608501078713-8e445a709b39?w=500', image: 'https://images.unsplash.com/photo-1608501078713-8e445a709b39?w=1600', status: 'Installed', progress: 20, playtime: '5.7h', achievements: '3/35', rating: 8.0, players: '650K', description: 'A team-based tactical shooter where communication and strategy win battles.', tags: ['FPS', 'Tactical', 'Team'] },
  { id: 'nova-drift', title: 'Nova Drift', genre: 'Arcade', thumb: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600', status: 'New', progress: 0, playtime: '0h', achievements: '0/15', rating: 7.5, players: '90K', description: 'A hyper-kinetic space shooter with a deep upgrade tree and endless survival.', tags: ['Arcade', 'Space', 'Survival'] },
  { id: 'chrono-breach', title: 'Chrono Breach', genre: 'Puzzle / Adventure', thumb: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=500', image: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=1600', status: 'Playing', progress: 55, playtime: '14h', achievements: '10/28', rating: 9.0, players: '1.1M', description: 'Time-manipulation puzzles meet narrative adventure across fractured timelines.', tags: ['Puzzle', 'Adventure', 'Story'] },
  { id: 'storm-knights', title: 'Storm Knights', genre: 'Action RPG', thumb: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1600', status: 'Installed', progress: 40, playtime: '18.3h', achievements: '14/40', rating: 8.6, players: '780K', description: 'Hack-and-slash action RPG combat with deep loot and relentless boss encounters.', tags: ['Action RPG', 'Hack and Slash', 'Loot'] },
];

const TABS = [
  { id: 'community', label: 'Community Hub & Feedback', short: 'Community', icon: MessageSquare },
  { id: 'updates', label: 'Patch Notes & Live Updates', short: 'Updates', icon: Newspaper },
  { id: 'quests', label: 'Quest Log & Daily Challenges', short: 'Quests', icon: Target },
  { id: 'store', label: 'DLC & Add-On Store', short: 'DLC', icon: ShoppingBag },
  { id: 'guides', label: 'Guides & Community Builds', short: 'Guides', icon: BookOpen },
  { id: 'friends', label: 'Friends & Activity Feed', short: 'Friends', icon: Users },
  { id: 'media', label: 'Media Gallery', short: 'Media', icon: Images },
];

const PATCHES = [
  { id: '2.4.1', version: '2.4.1', title: 'Seasonal combat refresh', age: 'Today', status: 'Live', summary: 'A new seasonal event, weapon tuning, matchmaking refinements, and stability fixes.', features: ['Neon Rift seasonal event', 'Two new arena modifiers', 'Expanded spectator tools'], balance: ['Reduced burst damage on heavy class', 'Improved support cooldown economy', 'Rebalanced ranked overtime rules'], fixes: ['Fixed party reconnect loop', 'Resolved missing reward claims', 'Improved shader stability on older GPUs'] },
  { id: '2.4.0', version: '2.4.0', title: 'The Vanguard update', age: '5 days ago', status: 'Major', summary: 'New progression track, social improvements, and refreshed endgame rewards.', features: ['Vanguard mastery track', 'Cross-platform party finder', 'New legendary reward pool'], balance: ['Adjusted PvP armor scaling', 'Updated boss stagger thresholds'], fixes: ['Fixed challenge counter desync', 'Resolved rare inventory rollback'] },
  { id: '2.3.8', version: '2.3.8', title: 'Hotfix & server maintenance', age: '2 weeks ago', status: 'Hotfix', summary: 'Backend maintenance and targeted fixes for competitive sessions.', features: ['Improved server telemetry'], balance: ['Minor spawn timing adjustments'], fixes: ['Fixed ranked disconnect penalty edge case', 'Reduced lobby timeout failures'] },
];

const glassTile = 'bg-slate-950/60 backdrop-blur-md transition-all duration-200 hover:scale-[1.02] hover:ring-1 hover:ring-cyan-500/40';

function SectionTitle({ eyebrow, title, meta }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-3">
      <div>
        <p className="text-[9px] uppercase tracking-[0.24em] text-cyan-300/45">{eyebrow}</p>
        <h3 className="text-sm md:text-base font-semibold text-white/90 mt-1">{title}</h3>
      </div>
      {meta && <span className="text-[9px] uppercase tracking-widest text-white/25">{meta}</span>}
    </div>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
      <div className="h-full rounded-full bg-gradient-to-r from-cyan-400/70 to-blue-500/70" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export default function LibraryLandingPage({ games, onClose }) {
  const gamesList = (games && games.length > 0) ? games : ALL_GAMES;
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeGenre, setActiveGenre] = useState('All');
  const [genreFilterOpen, setGenreFilterOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(gamesList[0] || null);
  const [activeTab, setActiveTab] = useState('community');
  const [selectedPatch, setSelectedPatch] = useState(null);
  const carouselRef = useRef(null);

  const genres = useMemo(() => {
    const set = new Set(gamesList.map(game => game.genre).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [gamesList]);

  const filtered = useMemo(() => {
    let result = [...gamesList];
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(game => `${game.title} ${game.genre}`.toLowerCase().includes(term));
    }
    if (activeFilter !== 'All') {
      result = result.filter(game => activeFilter === 'Playing'
        ? game.status === 'Playing' || game.status === 'In Progress'
        : game.status === activeFilter);
    }
    if (activeGenre !== 'All') result = result.filter(game => game.genre === activeGenre);
    return result;
  }, [gamesList, search, activeFilter, activeGenre]);

  const game = selectedGame || filtered[0] || gamesList[0];
  const achievementProgress = useMemo(() => {
    const [earned = 0, total = 0] = String(game?.achievements || '0/0').split('/').map(Number);
    return total ? Math.round((earned / total) * 100) : 0;
  }, [game]);

  const scrollCarousel = direction => {
    carouselRef.current?.scrollBy({ left: direction * 520, behavior: 'smooth' });
  };

  const renderCommunity = () => (
    <div className="grid grid-cols-12 gap-3 min-h-full">
      <button className={`col-span-12 md:col-span-5 relative min-h-[180px] overflow-hidden rounded-2xl text-left ${glassTile}`}>
        <img src={game.image || game.thumb} alt="Trending community clip" className="absolute inset-0 w-full h-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
        <div className="relative h-full p-5 flex flex-col justify-end">
          <div className="w-9 h-9 rounded-full bg-cyan-400/20 backdrop-blur-md flex items-center justify-center mb-3"><Play className="w-4 h-4 text-cyan-200 fill-cyan-200" /></div>
          <p className="text-[9px] text-cyan-300/70 uppercase tracking-[0.22em]">Trending clip</p>
          <h4 className="text-lg font-semibold text-white mt-1">The comeback everyone is replaying</h4>
          <p className="text-[10px] text-white/40 mt-1">42.8K views · 2.9K reactions</p>
        </div>
      </button>
      <div className="col-span-12 md:col-span-7 grid grid-cols-2 gap-3">
        {[
          { icon: Camera, label: 'Fan Art Spotlight', value: 'Chrome District concept set', sub: '1.8K likes' },
          { icon: Video, label: 'Viewer Clips', value: 'Top plays this week', sub: '126 new clips' },
          { icon: MessageSquare, label: 'Player Discussion', value: 'Best loadout after 2.4.1?', sub: '389 replies' },
          { icon: Heart, label: 'Community Pulse', value: '92% positive feedback', sub: '18.4K responses' },
        ].map(({ icon: Icon, label, value, sub }) => (
          <button key={label} className={`rounded-2xl p-4 text-left min-h-[84px] ${glassTile}`}>
            <Icon className="w-4 h-4 text-cyan-300/60 mb-3" />
            <p className="text-[9px] uppercase tracking-widest text-white/30">{label}</p>
            <p className="text-xs text-white/80 font-medium mt-1">{value}</p>
            <p className="text-[9px] text-white/30 mt-1">{sub}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderUpdates = () => (
    <div className="grid grid-cols-12 gap-3 min-h-full">
      <div className="col-span-12 lg:col-span-8 space-y-2">
        <SectionTitle eyebrow="Live service" title="Patch notes & developer updates" meta="Click a patch to inspect" />
        {PATCHES.map((patch, index) => (
          <button key={patch.id} onClick={() => setSelectedPatch(patch)} className={`w-full rounded-2xl p-4 text-left ${glassTile}`}>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-cyan-400/10 flex items-center justify-center flex-shrink-0"><Newspaper className="w-4 h-4 text-cyan-300/70" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><span className="text-[9px] font-bold text-cyan-300/80">v{patch.version}</span><span className="text-[8px] uppercase tracking-widest text-white/25">{patch.status}</span></div>
                <h4 className="text-sm text-white/90 font-semibold mt-1">{patch.title}</h4>
                <p className="text-[10px] text-white/35 mt-1 line-clamp-1">{patch.summary}</p>
              </div>
              <span className="text-[9px] text-white/25 flex-shrink-0">{patch.age}</span>
            </div>
            {index === 0 && <div className="mt-3 h-px bg-gradient-to-r from-cyan-400/30 via-white/10 to-transparent" />}
          </button>
        ))}
      </div>
      <div className="col-span-12 lg:col-span-4 rounded-2xl p-5 bg-slate-950/55 backdrop-blur-md">
        <SectionTitle eyebrow="Service status" title="Network health" />
        <div className="space-y-4">
          {[
            ['Matchmaking', 'Operational', 98],
            ['Game servers', 'Operational', 100],
            ['Social services', 'Monitoring', 87],
          ].map(([label, status, value]) => (
            <div key={label}>
              <div className="flex justify-between text-[10px] mb-1.5"><span className="text-white/50">{label}</span><span className="text-cyan-300/60">{status}</span></div>
              <ProgressBar value={value} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderQuests = () => {
    const quests = [
      { title: 'Break the Circuit', type: 'Tracked Quest', progress: 68, reward: '2,400 XP', detail: 'Win 3 matches in Neon District' },
      { title: 'Precision Protocol', type: 'Daily Challenge', progress: 40, reward: '350 Credits', detail: 'Land 25 precision hits' },
      { title: 'Squad Momentum', type: 'Weekly Challenge', progress: 82, reward: 'Epic Cache', detail: 'Complete 10 matches with a party' },
      { title: 'Mastery Milestone', type: 'Season Goal', progress: game.progress || 45, reward: 'Legendary Banner', detail: 'Reach mastery level 50' },
    ];
    return (
      <div>
        <SectionTitle eyebrow="Objective network" title={`${game.title} active missions`} meta="4 tracked" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {quests.map((quest, index) => (
            <button key={quest.title} className={`rounded-2xl p-4 text-left min-h-[155px] ${glassTile}`}>
              <div className="flex items-center justify-between"><Target className="w-4 h-4 text-cyan-300/65" /><span className="text-[9px] text-cyan-300/60">{quest.progress}%</span></div>
              <p className="text-[8px] uppercase tracking-[0.2em] text-white/25 mt-5">{quest.type}</p>
              <h4 className="text-sm text-white/90 font-semibold mt-1">{quest.title}</h4>
              <p className="text-[9px] text-white/35 mt-1">{quest.detail}</p>
              <div className="mt-4"><ProgressBar value={quest.progress} /></div>
              <div className="flex items-center gap-1 mt-2 text-[9px] text-amber-300/60"><Gift className="w-3 h-3" />{quest.reward}</div>
              {index === 0 && <span className="inline-flex mt-3 px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-[8px] uppercase tracking-wider">Pinned</span>}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderStore = () => (
    <div>
      <SectionTitle eyebrow="Add-ons" title="Expansions, passes & cosmetic drops" meta="Owned items hidden" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['Season 08 · Afterglow', 'Battle Pass', '$9.99', Sparkles],
          ['Chrome Frontier', 'Expansion', '$24.99', Gamepad2],
          ['Vanguard Arsenal', 'Weapon Pack', '$6.99', Swords],
          ['Midnight Circuit', 'Cosmetic Bundle', '$11.99', ShoppingBag],
        ].map(([title, type, price, Icon], index) => (
          <button key={title} className={`relative overflow-hidden rounded-2xl min-h-[180px] text-left ${glassTile}`}>
            <img src={game.image || game.thumb} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.18]" style={{ transform: `scale(${1 + index * 0.03})` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/20" />
            <div className="relative p-4 h-full flex flex-col justify-end">
              <Icon className="w-5 h-5 text-cyan-300/60 mb-auto" />
              <p className="text-[8px] uppercase tracking-[0.2em] text-white/30">{type}</p>
              <h4 className="text-sm text-white/90 font-semibold mt-1">{title}</h4>
              <div className="flex items-center justify-between mt-3"><span className="text-xs text-cyan-200/80 font-semibold">{price}</span><Download className="w-3.5 h-3.5 text-white/35" /></div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderGuides = () => (
    <div className="grid grid-cols-12 gap-3">
      <div className="col-span-12 md:col-span-7 rounded-2xl p-5 bg-slate-950/55 backdrop-blur-md">
        <SectionTitle eyebrow="Top community build" title="Ranked meta · adaptive assault" meta="Updated for 2.4.1" />
        <div className="grid grid-cols-3 gap-2 mt-5">
          {[
            ['Power', '92', Zap],
            ['Defense', '71', CheckCircle2],
            ['Mobility', '88', Activity],
          ].map(([label, value, Icon]) => (
            <div key={label} className="rounded-xl bg-white/[0.03] p-3"><Icon className="w-3.5 h-3.5 text-cyan-300/60" /><p className="text-xl text-white/85 font-light mt-3">{value}</p><p className="text-[8px] uppercase tracking-widest text-white/25">{label}</p></div>
          ))}
        </div>
        <button className="mt-4 inline-flex items-center gap-2 text-[10px] text-cyan-200/70 hover:text-cyan-200 transition-colors">Open full build calculator <ExternalLink className="w-3 h-3" /></button>
      </div>
      <div className="col-span-12 md:col-span-5 grid gap-2">
        {['Best starter route for new players', 'Endgame farming route · 18 min loop', 'Controller settings used by top 1%'].map((title, index) => (
          <button key={title} className={`rounded-2xl p-4 text-left ${glassTile}`}>
            <div className="flex items-center gap-3"><BookOpen className="w-4 h-4 text-cyan-300/55" /><div className="min-w-0"><p className="text-xs text-white/75 font-medium truncate">{title}</p><p className="text-[9px] text-white/25 mt-1">{12.4 - index * 2.1}K saves · Community verified</p></div></div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderFriends = () => (
    <div>
      <SectionTitle eyebrow="Social presence" title={`Friends inside ${game.title}`} meta="12 online" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          ['CyberVixen', 'Playing ranked · 32 min', 'Joinable', 'CV'],
          ['Shadow_Striker', 'Unlocked “First Strike”', '2m ago', 'SS'],
          ['NovaStar', 'Shared a new screenshot', '18m ago', 'NS'],
          ['GhostReaper', 'Reached Mastery 42', '1h ago', 'GR'],
        ].map(([name, activity, state, initials], index) => (
          <button key={name} className={`rounded-2xl p-4 text-left ${glassTile}`}>
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400/25 to-indigo-500/20 flex items-center justify-center text-[10px] text-white/70 font-bold">{initials}</div><div><p className="text-xs text-white/85 font-semibold">{name}</p><p className={`text-[8px] mt-0.5 ${index === 0 ? 'text-emerald-300/65' : 'text-white/25'}`}>{state}</p></div></div>
            <p className="text-[10px] text-white/35 mt-4">{activity}</p>
            {index === 0 && <div className="mt-4 flex gap-2"><span className="px-2 py-1 rounded-full bg-cyan-500/15 text-cyan-300/70 text-[8px]">JOIN</span><span className="px-2 py-1 rounded-full bg-white/[0.04] text-white/35 text-[8px]">MESSAGE</span></div>}
          </button>
        ))}
      </div>
    </div>
  );

  const renderMedia = () => (
    <div>
      <SectionTitle eyebrow="Captured on Atom XE" title="Screenshots & highlight reels" meta="48 items" />
      <div className="grid grid-cols-12 gap-3 auto-rows-[92px]">
        {[
          { span: 'col-span-12 md:col-span-5 row-span-2', label: 'Featured highlight', icon: Play },
          { span: 'col-span-6 md:col-span-3 row-span-1', label: 'Arena finish', icon: Camera },
          { span: 'col-span-6 md:col-span-4 row-span-1', label: 'Squad victory', icon: Video },
          { span: 'col-span-6 md:col-span-4 row-span-1', label: 'Photo mode', icon: Camera },
          { span: 'col-span-6 md:col-span-3 row-span-1', label: 'Boss clear', icon: Play },
        ].map(({ span, label, icon: Icon }, index) => (
          <button key={label} className={`${span} relative overflow-hidden rounded-2xl group ${glassTile}`}>
            <img src={game.image || game.thumb} alt={label} className="absolute inset-0 w-full h-full object-cover opacity-50 transition-transform duration-300 group-hover:scale-105" style={{ objectPosition: `${50 + index * 7}% center` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
            <div className="absolute left-3 right-3 bottom-3 flex items-center justify-between"><span className="text-[10px] text-white/75 font-medium">{label}</span><Icon className="w-3.5 h-3.5 text-cyan-200/70" /></div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderWorkspace = () => {
    switch (activeTab) {
      case 'updates': return renderUpdates();
      case 'quests': return renderQuests();
      case 'store': return renderStore();
      case 'guides': return renderGuides();
      case 'friends': return renderFriends();
      case 'media': return renderMedia();
      default: return renderCommunity();
    }
  };

  return (
    <div className="relative h-full min-h-0 overflow-hidden text-white bg-transparent">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.08),transparent_35%)]" />

      {/* Minimal utility header */}
      <header className="relative z-30 h-12 px-4 md:px-6 flex items-center gap-3 bg-slate-950/55 backdrop-blur-md">
        <div className="flex items-baseline gap-2 flex-shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/85">Full Library</span>
          <span className="text-[9px] text-white/20">{filtered.length} games</span>
        </div>

        <div className="hidden md:flex items-center gap-1 ml-2">
          {FILTERS.map(filter => (
            <button key={filter} onClick={() => setActiveFilter(filter)} className={`px-2.5 py-1.5 rounded-lg text-[9px] transition-all ${activeFilter === filter ? 'bg-cyan-500/15 text-cyan-200' : 'text-white/30 hover:text-white/60 hover:bg-white/[0.03]'}`}>{filter}</button>
          ))}
        </div>

        <div className="relative hidden lg:block">
          <button onClick={() => setGenreFilterOpen(value => !value)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] text-white/35 hover:text-white/65 hover:bg-white/[0.03] transition-all">
            <Filter className="w-3 h-3" /> {activeGenre} <ChevronDown className={`w-3 h-3 transition-transform ${genreFilterOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {genreFilterOpen && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute top-full left-0 mt-2 w-48 max-h-60 overflow-y-auto rounded-xl bg-slate-950/95 backdrop-blur-xl z-50" style={{ scrollbarWidth: 'none' }}>
                {genres.map(genre => <button key={genre} onClick={() => { setActiveGenre(genre); setGenreFilterOpen(false); }} className={`w-full px-3 py-2 text-left text-[9px] transition-colors ${activeGenre === genre ? 'bg-cyan-500/15 text-cyan-200' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'}`}>{genre}</button>)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1" />
        <div className="relative w-36 md:w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/25" />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search games" className="w-full rounded-xl bg-white/[0.04] pl-7 pr-3 py-1.5 text-[9px] text-white/70 placeholder:text-white/20 outline-none focus:bg-white/[0.06]" />
        </div>
        {onClose && <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/80 hover:bg-white/[0.05] transition-all"><X className="w-3.5 h-3.5" /></button>}
      </header>

      <main className="relative z-10 h-[calc(100%-3rem)] min-h-0 flex flex-col">
        {/* TOP 50% — cinematic selected game + horizontal library */}
        <section className="relative basis-1/2 min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {game && (
              <motion.div key={game.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="absolute inset-0">
                <img src={game.image || game.thumb} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/10" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/45" />
              </motion.div>
            )}
          </AnimatePresence>

          {game && (
            <div className="relative h-full px-5 md:px-8 pt-4 pb-[118px] flex items-start justify-between gap-5">
              <div className="max-w-xl self-center">
                <p className="text-[9px] uppercase tracking-[0.25em] text-cyan-300/55">{game.status} · {game.genre}</p>
                <h1 className="text-2xl md:text-4xl font-semibold tracking-tight text-white mt-1.5">{game.title}</h1>
                <p className="hidden lg:block text-[10px] leading-relaxed text-white/40 mt-2 max-w-lg">{game.description}</p>
                <div className="flex items-center gap-2 mt-4">
                  <button className="group h-10 px-6 rounded-xl bg-white text-slate-950 text-[11px] font-black tracking-[0.14em] flex items-center gap-2 hover:scale-[1.02] transition-transform"><Play className="w-4 h-4 fill-slate-950" /> PLAY</button>
                  <button className="h-10 px-4 rounded-xl bg-slate-950/45 backdrop-blur-md text-cyan-200/70 text-[10px] font-semibold flex items-center gap-2 hover:ring-1 hover:ring-cyan-500/40 transition-all"><Radio className="w-3.5 h-3.5" /> STREAM</button>
                </div>
              </div>

              <div className="hidden md:grid grid-cols-3 gap-2 self-center">
                {[
                  { icon: Clock, label: 'Played', value: game.playtime || '0h' },
                  { icon: Trophy, label: 'Trophies', value: `${achievementProgress}%` },
                  { icon: Star, label: 'Progress', value: `${game.progress || 0}%` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="min-w-[92px] rounded-2xl bg-slate-950/45 backdrop-blur-md px-4 py-3">
                    <Icon className="w-3.5 h-3.5 text-cyan-300/55" />
                    <p className="text-lg text-white/90 font-light mt-2">{value}</p>
                    <p className="text-[8px] uppercase tracking-widest text-white/25 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Horizontal game carousel */}
          <div className="absolute left-0 right-0 bottom-0 h-[112px] bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pt-4">
            <button onClick={() => scrollCarousel(-1)} className="absolute z-20 left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/70 backdrop-blur-md flex items-center justify-center text-white/40 hover:text-white hover:bg-slate-900 transition-all"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => scrollCarousel(1)} className="absolute z-20 right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/70 backdrop-blur-md flex items-center justify-center text-white/40 hover:text-white hover:bg-slate-900 transition-all"><ChevronRight className="w-4 h-4" /></button>
            <div ref={carouselRef} className="h-full overflow-x-auto overflow-y-hidden px-12 flex items-end gap-2.5" style={{ scrollbarWidth: 'none', WebkitMaskImage: 'linear-gradient(to right, transparent, black 4%, black 96%, transparent)' }}>
              {filtered.map(item => {
                const selected = item.id === game?.id;
                return (
                  <motion.button key={item.id} onClick={() => setSelectedGame(item)} whileHover={{ y: -3 }} className={`relative flex-shrink-0 w-[132px] h-[82px] rounded-xl overflow-hidden text-left group transition-all duration-200 ${selected ? 'ring-1 ring-cyan-300/70 scale-[1.04]' : 'opacity-70 hover:opacity-100 hover:ring-1 hover:ring-cyan-500/40'}`}>
                    <img src={item.thumb || item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2"><p className="text-[9px] font-semibold text-white truncate">{item.title}</p><p className="text-[7px] text-white/35 mt-0.5 truncate">{item.genre}</p></div>
                    {selected && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.8)]" />}
                  </motion.button>
                );
              })}
              {filtered.length === 0 && <div className="w-full h-full flex items-center justify-center text-[10px] text-white/25">No games match the current filters.</div>}
            </div>
          </div>
        </section>

        {/* BOTTOM 50% — tab navigation + full-width dynamic workspace */}
        <section className="relative basis-1/2 min-h-0 bg-slate-950/80 backdrop-blur-md">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent" />
          <nav className="h-12 px-3 md:px-6 flex items-center gap-1 overflow-x-auto bg-slate-950/70 backdrop-blur-xl" style={{ scrollbarWidth: 'none', WebkitMaskImage: 'linear-gradient(to right, transparent 0, black 2%, black 98%, transparent 100%)' }}>
            {TABS.map(({ id, label, short, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button key={id} title={label} onClick={() => setActiveTab(id)} className={`relative flex-shrink-0 h-9 px-3 rounded-xl flex items-center gap-2 transition-all duration-200 ${active ? 'bg-cyan-500/12 text-cyan-200' : 'text-white/30 hover:text-white/65 hover:bg-white/[0.03]'}`}>
                  <Icon className="w-3.5 h-3.5" /><span className="text-[9px] font-medium whitespace-nowrap">{short}</span>
                  {active && <motion.span layoutId="library-tab-indicator" className="absolute left-3 right-3 -bottom-1 h-px bg-cyan-300/70" />}
                </button>
              );
            })}
          </nav>

          <div className="h-[calc(100%-3rem)] overflow-y-auto px-4 md:px-6 py-4" style={{ scrollbarWidth: 'none', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, black 5%, black 94%, transparent 100%)', maskImage: 'linear-gradient(to bottom, transparent 0, black 5%, black 94%, transparent 100%)' }}>
            <AnimatePresence mode="wait">
              <motion.div key={`${game?.id}-${activeTab}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.18 }} className="min-h-full pb-6">
                {renderWorkspace()}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      </main>

      {/* Lightweight patch inspector — stays on the library page */}
      <AnimatePresence>
        {selectedPatch && (
          <motion.div className="absolute inset-0 z-[80] flex justify-end bg-black/55 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedPatch(null)}>
            <motion.aside initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 80, opacity: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 30 }} onClick={event => event.stopPropagation()} className="h-full w-full sm:w-[480px] bg-black/80 backdrop-blur-xl p-6 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-[9px] uppercase tracking-[0.24em] text-cyan-300/55">Patch Inspector · v{selectedPatch.version}</p><h2 className="text-xl font-semibold text-white mt-2">{selectedPatch.title}</h2><p className="text-[10px] text-white/35 mt-2 leading-relaxed">{selectedPatch.summary}</p></div>
                <button onClick={() => setSelectedPatch(null)} className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-white/35 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="mt-6 h-px bg-gradient-to-r from-cyan-400/30 via-white/10 to-transparent" />
              {[
                ['New Features', Sparkles, selectedPatch.features],
                ['Balance Changes', SlidersHorizontal, selectedPatch.balance],
                ['Bug Fixes', Bug, selectedPatch.fixes],
              ].map(([title, Icon, items]) => (
                <div key={title} className="mt-6">
                  <div className="flex items-center gap-2"><Icon className="w-4 h-4 text-cyan-300/60" /><h3 className="text-xs font-semibold text-white/80">{title}</h3></div>
                  <div className="mt-3 space-y-2">{items.map(item => <div key={item} className="flex gap-2 text-[10px] text-white/40"><Circle className="w-2 h-2 mt-1 flex-shrink-0 text-cyan-300/45 fill-cyan-300/25" /><span>{item}</span></div>)}</div>
                </div>
              ))}
              <div className="mt-7 rounded-2xl overflow-hidden relative h-36 bg-slate-950/60">
                <img src={game.image || game.thumb} alt="Patch media preview" className="absolute inset-0 w-full h-full object-cover opacity-45" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                <div className="absolute left-4 right-4 bottom-4 flex items-center justify-between"><div><p className="text-[8px] uppercase tracking-widest text-cyan-300/50">Media preview</p><p className="text-xs text-white/70 mt-1">Developer breakdown</p></div><div className="w-9 h-9 rounded-full bg-cyan-300/15 flex items-center justify-center"><Play className="w-4 h-4 text-cyan-200 fill-cyan-200" /></div></div>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
