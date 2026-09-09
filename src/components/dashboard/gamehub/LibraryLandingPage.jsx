import React, { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity, BookOpen, Bug, Camera, ChevronDown, ChevronLeft, ChevronRight,
  Circle, Clock, Download, ExternalLink, Filter, Gamepad2, Gift, Heart,
  Images, MessageSquare, Newspaper, Play, Radio, Search, ShoppingBag,
  SlidersHorizontal, Sparkles, Star, Swords, Target, Trophy, Users, Video,
  X, Zap
} from 'lucide-react';

const FILTERS = ['All', 'Playing', 'Installed', 'New'];

const ALL_GAMES = [
  { id: 'cyberpunk', title: 'Cyberpunk 2088', genre: 'RPG / Action', thumb: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600', status: 'Playing', progress: 72, playtime: '48.2h', achievements: '18/50', rating: 9.4, description: 'Navigate a dystopian megacity as a mercenary outlaw pursuing the key to immortality.' },
  { id: 'neon-legends', title: 'Neon Legends', genre: 'Action / Brawler', thumb: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1600', status: 'In Progress', progress: 45, playtime: '12.8h', achievements: '6/30', rating: 8.7, description: 'Battle across neon-lit arenas in fast-paced combat and dominate the online leaderboard.' },
  { id: 'stellar-odyssey', title: 'Stellar Odyssey', genre: 'Space Sim', thumb: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=500', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=1600', status: 'Installed', progress: 10, playtime: '3.1h', achievements: '2/40', rating: 8.1, description: 'Chart unexplored galaxies, build starships, and forge alliances across the cosmos.' },
  { id: 'shadow-realm', title: 'Shadow Realm', genre: 'Fantasy RPG', thumb: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=500', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1600', status: 'New', progress: 0, playtime: '0h', achievements: '0/45', rating: 9.1, description: 'A dark fantasy epic where ancient gods clash and mortal heroes rise.' },
  { id: 'apex-surge', title: 'Apex Surge', genre: 'Battle Royale', thumb: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600', status: 'Installed', progress: 33, playtime: '20.5h', achievements: '9/25', rating: 8.5, description: 'Drop into high-stakes arenas where movement, teamwork, and smart loadouts win.' },
  { id: 'mythforge', title: 'MythForge Online', genre: 'MMORPG', thumb: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=500', image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1600', status: 'Playing', progress: 88, playtime: '210h', achievements: '44/50', rating: 9.6, description: 'A living world of mythic quests, guild wars, crafting, raids, and evolving lore.' },
  { id: 'dragon-siege', title: 'Dragon Siege', genre: 'Strategy', thumb: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=500', image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=1600', status: 'New', progress: 5, playtime: '1.2h', achievements: '1/20', rating: 8.3, description: 'Command armies, manage resources, and build an empire across a war-torn continent.' },
  { id: 'void-runner', title: 'Void Runner', genre: 'Platformer', thumb: 'https://images.unsplash.com/photo-1461988320302-91bde64fc8e4?w=500', image: 'https://images.unsplash.com/photo-1461988320302-91bde64fc8e4?w=1600', status: 'Installed', progress: 60, playtime: '8.4h', achievements: '12/30', rating: 7.9, description: 'Race through procedurally generated voids with fluid movement and precision platforming.' },
  { id: 'iron-alliance', title: 'Iron Alliance', genre: 'FPS / Tactical', thumb: 'https://images.unsplash.com/photo-1608501078713-8e445a709b39?w=500', image: 'https://images.unsplash.com/photo-1608501078713-8e445a709b39?w=1600', status: 'Installed', progress: 20, playtime: '5.7h', achievements: '3/35', rating: 8.0, description: 'A team-based tactical shooter where communication and strategy win battles.' },
  { id: 'nova-drift', title: 'Nova Drift', genre: 'Arcade', thumb: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600', status: 'New', progress: 0, playtime: '0h', achievements: '0/15', rating: 7.5, description: 'A hyper-kinetic space shooter with a deep upgrade tree and endless survival.' },
  { id: 'chrono-breach', title: 'Chrono Breach', genre: 'Puzzle / Adventure', thumb: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=500', image: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=1600', status: 'Playing', progress: 55, playtime: '14h', achievements: '10/28', rating: 9.0, description: 'Time-manipulation puzzles meet narrative adventure across fractured timelines.' },
  { id: 'storm-knights', title: 'Storm Knights', genre: 'Action RPG', thumb: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1600', status: 'Installed', progress: 40, playtime: '18.3h', achievements: '14/40', rating: 8.6, description: 'Hack-and-slash action RPG combat with deep loot and relentless boss encounters.' },
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
  { id: '2.4.1', title: 'Seasonal combat refresh', age: 'Today', status: 'LIVE', summary: 'Seasonal event, weapon tuning, matchmaking refinements, and stability fixes.', features: ['Neon Rift seasonal event', 'Two new arena modifiers', 'Expanded spectator tools'], balance: ['Reduced heavy-class burst damage', 'Improved support cooldown economy', 'Rebalanced ranked overtime'], fixes: ['Fixed party reconnect loop', 'Resolved missing reward claims', 'Improved shader stability'] },
  { id: '2.4.0', title: 'The Vanguard update', age: '5 days ago', status: 'MAJOR', summary: 'New progression track, social improvements, and refreshed endgame rewards.', features: ['Vanguard mastery track', 'Cross-platform party finder', 'New legendary reward pool'], balance: ['Adjusted PvP armor scaling', 'Updated boss stagger thresholds'], fixes: ['Fixed challenge counter desync', 'Resolved rare inventory rollback'] },
  { id: '2.3.8', title: 'Server hotfix', age: '2 weeks ago', status: 'HOTFIX', summary: 'Backend maintenance and targeted fixes for competitive sessions.', features: ['Improved server telemetry'], balance: ['Minor spawn timing adjustments'], fixes: ['Fixed disconnect penalty edge case', 'Reduced lobby timeout failures'] },
];

const tile = 'bg-slate-950/60 backdrop-blur-md transition-all duration-200 hover:scale-[1.02] hover:ring-1 hover:ring-cyan-500/40';

function Heading({ eyebrow, title, meta }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <p className="text-[9px] uppercase tracking-[0.24em] text-cyan-300/45">{eyebrow}</p>
        <h3 className="mt-1 text-sm font-semibold text-white/90 md:text-base">{title}</h3>
      </div>
      {meta && <span className="text-[9px] uppercase tracking-widest text-white/25">{meta}</span>}
    </div>
  );
}

function Progress({ value }) {
  return <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400/70 to-blue-500/70" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

export default function LibraryLandingPage({ games, onClose }) {
  const gamesList = games?.length ? games : ALL_GAMES;
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [genre, setGenre] = useState('All');
  const [genreOpen, setGenreOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(gamesList[0] || null);
  const [tab, setTab] = useState('community');
  const [patch, setPatch] = useState(null);
  const carouselRef = useRef(null);

  const genres = useMemo(() => ['All', ...Array.from(new Set(gamesList.map(g => g.genre).filter(Boolean))).sort()], [gamesList]);
  const filtered = useMemo(() => gamesList.filter(g => {
    const haystack = `${g.title || ''} ${g.genre || ''}`.toLowerCase();
    const searchOK = !search || haystack.includes(search.toLowerCase());
    const filterOK = filter === 'All' || (filter === 'Playing' ? ['Playing', 'In Progress'].includes(g.status) : g.status === filter);
    const genreOK = genre === 'All' || g.genre === genre;
    return searchOK && filterOK && genreOK;
  }), [gamesList, search, filter, genre]);

  const game = selectedGame || filtered[0] || gamesList[0];
  const achievementProgress = useMemo(() => {
    const [earned, total] = String(game?.achievements || '0/0').split('/').map(Number);
    return total ? Math.round((earned / total) * 100) : 0;
  }, [game]);

  const scrollCarousel = dir => carouselRef.current?.scrollBy({ left: dir * 520, behavior: 'smooth' });

  const community = (
    <div className="grid min-h-full grid-cols-12 gap-3">
      <button className={`relative col-span-12 min-h-[180px] overflow-hidden rounded-2xl text-left md:col-span-5 ${tile}`}>
        <img src={game?.image || game?.thumb} alt="Trending community clip" className="absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
        <div className="relative flex h-full flex-col justify-end p-5"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/20 backdrop-blur-md"><Play className="h-4 w-4 fill-cyan-200 text-cyan-200" /></div><p className="text-[9px] uppercase tracking-[0.22em] text-cyan-300/70">Trending clip</p><h4 className="mt-1 text-lg font-semibold">The comeback everyone is replaying</h4><p className="mt-1 text-[10px] text-white/40">42.8K views · 2.9K reactions</p></div>
      </button>
      <div className="col-span-12 grid grid-cols-2 gap-3 md:col-span-7">
        {[[Camera, 'Fan Art Spotlight', 'Chrome District concept set', '1.8K likes'], [Video, 'Viewer Clips', 'Top plays this week', '126 new clips'], [MessageSquare, 'Player Discussion', 'Best loadout after 2.4.1?', '389 replies'], [Heart, 'Community Pulse', '92% positive feedback', '18.4K responses']].map(([Icon, label, value, sub]) => (
          <button key={label} className={`min-h-[84px] rounded-2xl p-4 text-left ${tile}`}><Icon className="mb-3 h-4 w-4 text-cyan-300/60" /><p className="text-[9px] uppercase tracking-widest text-white/30">{label}</p><p className="mt-1 text-xs font-medium text-white/80">{value}</p><p className="mt-1 text-[9px] text-white/30">{sub}</p></button>
        ))}
      </div>
    </div>
  );

  const updates = (
    <div className="grid min-h-full grid-cols-12 gap-3">
      <div className="col-span-12 space-y-2 lg:col-span-8"><Heading eyebrow="Live service" title="Patch notes & developer updates" meta="Select to inspect" />{PATCHES.map(p => <button key={p.id} onClick={() => setPatch(p)} className={`w-full rounded-2xl p-4 text-left ${tile}`}><div className="flex items-start gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10"><Newspaper className="h-4 w-4 text-cyan-300/70" /></div><div className="min-w-0 flex-1"><div className="flex gap-2 text-[8px] uppercase tracking-widest"><span className="font-bold text-cyan-300/80">v{p.id}</span><span className="text-white/25">{p.status}</span></div><h4 className="mt-1 text-sm font-semibold text-white/90">{p.title}</h4><p className="mt-1 truncate text-[10px] text-white/35">{p.summary}</p></div><span className="shrink-0 text-[9px] text-white/25">{p.age}</span></div></button>)}</div>
      <div className="col-span-12 rounded-2xl bg-slate-950/55 p-5 backdrop-blur-md lg:col-span-4"><Heading eyebrow="Service status" title="Network health" />{[['Matchmaking', 98], ['Game servers', 100], ['Social services', 87]].map(([name, value]) => <div key={name} className="mb-4"><div className="mb-1.5 flex justify-between text-[10px]"><span className="text-white/50">{name}</span><span className="text-cyan-300/60">{value > 90 ? 'Operational' : 'Monitoring'}</span></div><Progress value={value} /></div>)}</div>
    </div>
  );

  const quests = (
    <div><Heading eyebrow="Objective network" title={`${game?.title || 'Game'} active missions`} meta="4 tracked" /><div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">{[['Break the Circuit', 'Tracked Quest', 68, '2,400 XP', 'Win 3 matches in Neon District'], ['Precision Protocol', 'Daily Challenge', 40, '350 Credits', 'Land 25 precision hits'], ['Squad Momentum', 'Weekly Challenge', 82, 'Epic Cache', 'Complete 10 matches with a party'], ['Mastery Milestone', 'Season Goal', game?.progress || 45, 'Legendary Banner', 'Reach mastery level 50']].map(([title, type, value, reward, detail]) => <button key={title} className={`min-h-[155px] rounded-2xl p-4 text-left ${tile}`}><div className="flex items-center justify-between"><Target className="h-4 w-4 text-cyan-300/65" /><span className="text-[9px] text-cyan-300/60">{value}%</span></div><p className="mt-5 text-[8px] uppercase tracking-[0.2em] text-white/25">{type}</p><h4 className="mt-1 text-sm font-semibold text-white/90">{title}</h4><p className="mt-1 text-[9px] text-white/35">{detail}</p><div className="mt-4"><Progress value={value} /></div><div className="mt-2 flex items-center gap-1 text-[9px] text-amber-300/60"><Gift className="h-3 w-3" />{reward}</div></button>)}</div></div>
  );

  const store = (
    <div><Heading eyebrow="Add-ons" title="Expansions, passes & cosmetic drops" meta="Game-specific catalog" /><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[['Season 08 · Afterglow', 'Battle Pass', '$9.99', Sparkles], ['Chrome Frontier', 'Expansion', '$24.99', Gamepad2], ['Vanguard Arsenal', 'Weapon Pack', '$6.99', Swords], ['Midnight Circuit', 'Cosmetic Bundle', '$11.99', ShoppingBag]].map(([title, type, price, Icon]) => <button key={title} className={`relative min-h-[180px] overflow-hidden rounded-2xl text-left ${tile}`}><img src={game?.image || game?.thumb} alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.18]" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/20" /><div className="relative flex h-full flex-col justify-end p-4"><Icon className="mb-auto h-5 w-5 text-cyan-300/60" /><p className="text-[8px] uppercase tracking-[0.2em] text-white/30">{type}</p><h4 className="mt-1 text-sm font-semibold text-white/90">{title}</h4><div className="mt-3 flex items-center justify-between"><span className="text-xs font-semibold text-cyan-200/80">{price}</span><Download className="h-3.5 w-3.5 text-white/35" /></div></div></button>)}</div></div>
  );

  const guides = (
    <div className="grid grid-cols-12 gap-3"><div className="col-span-12 rounded-2xl bg-slate-950/55 p-5 backdrop-blur-md md:col-span-7"><Heading eyebrow="Top community build" title="Ranked meta · adaptive assault" meta="Updated for 2.4.1" /><div className="mt-5 grid grid-cols-3 gap-2">{[[Zap, 'Power', 92], [Activity, 'Mobility', 88], [Star, 'Control', 81]].map(([Icon, label, value]) => <div key={label} className="rounded-xl bg-white/[0.03] p-3"><Icon className="h-3.5 w-3.5 text-cyan-300/60" /><p className="mt-3 text-xl font-light text-white/85">{value}</p><p className="text-[8px] uppercase tracking-widest text-white/25">{label}</p></div>)}</div><button className="mt-4 inline-flex items-center gap-2 text-[10px] text-cyan-200/70 transition-colors hover:text-cyan-200">Open full build calculator <ExternalLink className="h-3 w-3" /></button></div><div className="col-span-12 grid gap-2 md:col-span-5">{['Best starter route for new players', 'Endgame farming route · 18 min loop', 'Controller settings used by top 1%'].map((title, i) => <button key={title} className={`rounded-2xl p-4 text-left ${tile}`}><div className="flex items-center gap-3"><BookOpen className="h-4 w-4 text-cyan-300/55" /><div className="min-w-0"><p className="truncate text-xs font-medium text-white/75">{title}</p><p className="mt-1 text-[9px] text-white/25">{Math.round(12.4 - i * 2.1)}K saves · Community verified</p></div></div></button>)}</div></div>
  );

  const friends = (
    <div><Heading eyebrow="Social presence" title={`Friends inside ${game?.title || 'this game'}`} meta="12 online" /><div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">{[['CyberVixen', 'Playing ranked · 32 min', 'JOINABLE', 'CV'], ['Shadow_Striker', 'Unlocked “First Strike”', '2M AGO', 'SS'], ['NovaStar', 'Shared a new screenshot', '18M AGO', 'NS'], ['GhostReaper', 'Reached Mastery 42', '1H AGO', 'GR']].map(([name, activity, state, initials], i) => <button key={name} className={`rounded-2xl p-4 text-left ${tile}`}><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/25 to-indigo-500/20 text-[10px] font-bold text-white/70">{initials}</div><div><p className="text-xs font-semibold text-white/85">{name}</p><p className={`mt-0.5 text-[8px] ${i === 0 ? 'text-emerald-300/65' : 'text-white/25'}`}>{state}</p></div></div><p className="mt-4 text-[10px] text-white/35">{activity}</p></button>)}</div></div>
  );

  const media = (
    <div><Heading eyebrow="Captured on Atom XE" title="Screenshots & highlight reels" meta="48 items" /><div className="grid auto-rows-[92px] grid-cols-12 gap-3">{[['col-span-12 row-span-2 md:col-span-5', 'Featured highlight', Play], ['col-span-6 md:col-span-3', 'Arena finish', Camera], ['col-span-6 md:col-span-4', 'Squad victory', Video], ['col-span-6 md:col-span-4', 'Photo mode', Camera], ['col-span-6 md:col-span-3', 'Boss clear', Play]].map(([span, label, Icon], i) => <button key={label} className={`${span} ${tile} group relative overflow-hidden rounded-2xl`}><img src={game?.image || game?.thumb} alt={label} className="absolute inset-0 h-full w-full object-cover opacity-50 transition-transform duration-300 group-hover:scale-105" style={{ objectPosition: `${45 + i * 8}% center` }} /><div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" /><div className="absolute bottom-3 left-3 right-3 flex items-center justify-between"><span className="text-[10px] font-medium text-white/75">{label}</span><Icon className="h-3.5 w-3.5 text-cyan-200/70" /></div></button>)}</div></div>
  );

  const workspace = { community, updates, quests, store, guides, friends, media }[tab];

  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-transparent text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.08),transparent_35%)]" />

      <header className="relative z-30 flex h-12 items-center gap-3 bg-slate-950/55 px-4 backdrop-blur-md md:px-6">
        <div className="flex shrink-0 items-baseline gap-2"><span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/85">Full Library</span><span className="text-[9px] text-white/20">{filtered.length} games</span></div>
        <div className="ml-2 hidden items-center gap-1 md:flex">{FILTERS.map(name => <button key={name} onClick={() => setFilter(name)} className={`rounded-lg px-2.5 py-1.5 text-[9px] transition-all ${filter === name ? 'bg-cyan-500/15 text-cyan-200' : 'text-white/30 hover:bg-white/[0.03] hover:text-white/60'}`}>{name}</button>)}</div>
        <div className="relative hidden lg:block"><button onClick={() => setGenreOpen(v => !v)} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[9px] text-white/35 transition-all hover:bg-white/[0.03] hover:text-white/65"><Filter className="h-3 w-3" />{genre}<ChevronDown className={`h-3 w-3 transition-transform ${genreOpen ? 'rotate-180' : ''}`} /></button><AnimatePresence>{genreOpen && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute left-0 top-full z-50 mt-2 max-h-60 w-48 overflow-y-auto rounded-xl bg-slate-950/95 backdrop-blur-xl" style={{ scrollbarWidth: 'none' }}>{genres.map(name => <button key={name} onClick={() => { setGenre(name); setGenreOpen(false); }} className={`w-full px-3 py-2 text-left text-[9px] ${genre === name ? 'bg-cyan-500/15 text-cyan-200' : 'text-white/40 hover:bg-white/[0.04] hover:text-white/70'}`}>{name}</button>)}</motion.div>}</AnimatePresence></div>
        <div className="flex-1" />
        <div className="relative w-36 md:w-48"><Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-white/25" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search games" className="w-full rounded-xl bg-white/[0.04] py-1.5 pl-7 pr-3 text-[9px] text-white/70 outline-none placeholder:text-white/20 focus:bg-white/[0.06]" /></div>
        {onClose && <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition-all hover:bg-white/[0.05] hover:text-white/80"><X className="h-3.5 w-3.5" /></button>}
      </header>

      <main className="relative z-10 flex min-h-0 flex-col" style={{ height: 'calc(100% - 3rem)' }}>
        <section className="relative min-h-0 basis-1/2 overflow-hidden">
          <AnimatePresence mode="wait">{game && <motion.div key={game.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="absolute inset-0"><img src={game.image || game.thumb} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/10" /><div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/45" /></motion.div>}</AnimatePresence>
          {game && <div className="relative flex h-full items-start justify-between gap-5 px-5 pb-[118px] pt-4 md:px-8"><div className="max-w-xl self-center"><p className="text-[9px] uppercase tracking-[0.25em] text-cyan-300/55">{game.status} · {game.genre}</p><h1 className="mt-1.5 text-2xl font-semibold tracking-tight md:text-4xl">{game.title}</h1><p className="mt-2 hidden max-w-lg text-[10px] leading-relaxed text-white/40 lg:block">{game.description}</p><div className="mt-4 flex items-center gap-2"><button className="group flex h-10 items-center gap-2 rounded-xl bg-white px-6 text-[11px] font-black tracking-[0.14em] text-slate-950 transition-transform hover:scale-[1.02]"><Play className="h-4 w-4 fill-slate-950" />PLAY</button><button className="flex h-10 items-center gap-2 rounded-xl bg-slate-950/45 px-4 text-[10px] font-semibold text-cyan-200/70 backdrop-blur-md transition-all hover:ring-1 hover:ring-cyan-500/40"><Radio className="h-3.5 w-3.5" />STREAM</button></div></div><div className="hidden grid-cols-3 gap-2 self-center md:grid">{[[Clock, 'Played', game.playtime || '0h'], [Trophy, 'Trophies', `${achievementProgress}%`], [Star, 'Progress', `${game.progress || 0}%`]].map(([Icon, label, value]) => <div key={label} className="min-w-[92px] rounded-2xl bg-slate-950/45 px-4 py-3 backdrop-blur-md"><Icon className="h-3.5 w-3.5 text-cyan-300/55" /><p className="mt-2 text-lg font-light text-white/90">{value}</p><p className="mt-0.5 text-[8px] uppercase tracking-widest text-white/25">{label}</p></div>)}</div></div>}
          <div className="absolute bottom-0 left-0 right-0 h-[112px] bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pt-4"><button onClick={() => scrollCarousel(-1)} className="absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/70 text-white/40 backdrop-blur-md transition-all hover:bg-slate-900 hover:text-white"><ChevronLeft className="h-4 w-4" /></button><button onClick={() => scrollCarousel(1)} className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/70 text-white/40 backdrop-blur-md transition-all hover:bg-slate-900 hover:text-white"><ChevronRight className="h-4 w-4" /></button><div ref={carouselRef} className="flex h-full items-end gap-2.5 overflow-x-auto overflow-y-hidden px-12" style={{ scrollbarWidth: 'none', WebkitMaskImage: 'linear-gradient(to right, transparent, black 4%, black 96%, transparent)' }}>{filtered.map(item => { const selected = item.id === game?.id; return <motion.button key={item.id} onClick={() => setSelectedGame(item)} whileHover={{ y: -3 }} className={`group relative h-[82px] w-[132px] shrink-0 overflow-hidden rounded-xl text-left transition-all duration-200 ${selected ? 'scale-[1.04] ring-1 ring-cyan-300/70' : 'opacity-70 hover:opacity-100 hover:ring-1 hover:ring-cyan-500/40'}`}><img src={item.thumb || item.image} alt={item.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent" /><div className="absolute bottom-2 left-2 right-2"><p className="truncate text-[9px] font-semibold">{item.title}</p><p className="mt-0.5 truncate text-[7px] text-white/35">{item.genre}</p></div>{selected && <div className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.8)]" />}</motion.button>; })}{filtered.length === 0 && <div className="flex h-full w-full items-center justify-center text-[10px] text-white/25">No games match the current filters.</div>}</div></div>
        </section>

        <section className="relative min-h-0 basis-1/2 bg-slate-950/80 backdrop-blur-md"><div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent" /><nav className="flex h-12 items-center gap-1 overflow-x-auto bg-slate-950/70 px-3 backdrop-blur-xl md:px-6" style={{ scrollbarWidth: 'none', WebkitMaskImage: 'linear-gradient(to right, transparent 0, black 2%, black 98%, transparent 100%)' }}>{TABS.map(({ id, label, short, icon: Icon }) => { const active = tab === id; return <button key={id} title={label} onClick={() => setTab(id)} className={`relative flex h-9 shrink-0 items-center gap-2 rounded-xl px-3 transition-all duration-200 ${active ? 'bg-cyan-500/12 text-cyan-200' : 'text-white/30 hover:bg-white/[0.03] hover:text-white/65'}`}><Icon className="h-3.5 w-3.5" /><span className="whitespace-nowrap text-[9px] font-medium">{short}</span>{active && <motion.span layoutId="library-tab-indicator" className="absolute -bottom-1 left-3 right-3 h-px bg-cyan-300/70" />}</button>; })}</nav><div className="overflow-y-auto px-4 py-4 md:px-6" style={{ height: 'calc(100% - 3rem)', scrollbarWidth: 'none', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, black 5%, black 94%, transparent 100%)', maskImage: 'linear-gradient(to bottom, transparent 0, black 5%, black 94%, transparent 100%)' }}><AnimatePresence mode="wait"><motion.div key={`${game?.id}-${tab}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.18 }} className="min-h-full pb-6">{workspace}</motion.div></AnimatePresence></div></section>
      </main>

      <AnimatePresence>{patch && <motion.div className="absolute inset-0 z-[80] flex justify-end bg-black/55 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPatch(null)}><motion.aside initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 80, opacity: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 30 }} onClick={e => e.stopPropagation()} className="h-full w-full overflow-y-auto bg-black/80 p-6 backdrop-blur-xl sm:w-[480px]" style={{ scrollbarWidth: 'none' }}><div className="flex items-start justify-between gap-4"><div><p className="text-[9px] uppercase tracking-[0.24em] text-cyan-300/55">Patch Inspector · v{patch.id}</p><h2 className="mt-2 text-xl font-semibold">{patch.title}</h2><p className="mt-2 text-[10px] leading-relaxed text-white/35">{patch.summary}</p></div><button onClick={() => setPatch(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.05] text-white/35 hover:text-white"><X className="h-4 w-4" /></button></div><div className="mt-6 h-px bg-gradient-to-r from-cyan-400/30 via-white/10 to-transparent" />{[['New Features', Sparkles, patch.features], ['Balance Changes', SlidersHorizontal, patch.balance], ['Bug Fixes', Bug, patch.fixes]].map(([title, Icon, items]) => <div key={title} className="mt-6"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-cyan-300/60" /><h3 className="text-xs font-semibold text-white/80">{title}</h3></div><div className="mt-3 space-y-2">{items.map(item => <div key={item} className="flex gap-2 text-[10px] text-white/40"><Circle className="mt-1 h-2 w-2 shrink-0 fill-cyan-300/25 text-cyan-300/45" /><span>{item}</span></div>)}</div></div>)}<div className="relative mt-7 h-36 overflow-hidden rounded-2xl bg-slate-950/60"><img src={game?.image || game?.thumb} alt="Patch media preview" className="absolute inset-0 h-full w-full object-cover opacity-45" /><div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" /><div className="absolute bottom-4 left-4 right-4 flex items-center justify-between"><div><p className="text-[8px] uppercase tracking-widest text-cyan-300/50">Media preview</p><p className="mt-1 text-xs text-white/70">Developer breakdown</p></div><div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-300/15"><Play className="h-4 w-4 fill-cyan-200 text-cyan-200" /></div></div></div></motion.aside></motion.div>}</AnimatePresence>
    </div>
  );
}
