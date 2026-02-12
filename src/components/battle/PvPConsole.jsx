import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Crosshair, Zap, Crown, Globe, ChevronDown, ChevronUp, Users, Shield, Star, Clock, Activity, Radio } from 'lucide-react';

// ── Genre Data (Simulation Protocols) ──
const GENRES = [
  {
    id: 'fighting',
    name: 'Fighting',
    protocol: 'Close Combat Protocol',
    icon: Swords,
    modes: [
      { name: 'Z-Arena Style', desc: '3D fly-around combat, destructible environments', origin: 'Tenkaichi' },
      { name: 'Hyper Versus', desc: 'Team-based tag combat with massive combos', origin: 'MvC / Street Fighter' },
      { name: 'Iron Fist', desc: 'Grounded technical martial arts, spacing & punishment', origin: 'Tekken' },
      { name: 'Fatality Rush', desc: 'Brutal finisher-based fighting with environmental kills', origin: 'Mortal Kombat' },
      { name: 'Platform Brawl', desc: 'Multi-player arena brawling with items & hazards', origin: 'Smash Bros' },
      { name: 'Anime Clash', desc: 'High-speed aerial combat with cinematic specials', origin: 'Naruto / Dragon Ball' },
    ],
    matchTypes: ['Casual', 'Ranked', 'Private'],
    maps: ['Auto Select', 'Vote', 'Random'],
  },
  {
    id: 'shooter',
    name: 'Shooter',
    protocol: 'Ballistics Protocol',
    icon: Crosshair,
    modes: [
      { name: 'Tac-Shooter', desc: 'Precise 5v5 objective combat, one life per round', origin: 'Valorant / CS' },
      { name: 'Arena Quake', desc: 'Fast movement, power weapons, jump pads', origin: 'Halo / Quake' },
      { name: 'Warzone', desc: 'Large-scale vehicular warfare with squads', origin: 'Battlefield' },
      { name: 'Survival Zone', desc: 'Drop in, loot up, last one standing', origin: 'Battle Royale' },
      { name: 'Run & Gun', desc: 'Fast-paced respawn combat with killstreaks', origin: 'Call of Duty' },
      { name: 'Extraction', desc: 'Loot high-value zones and extract before time runs out', origin: 'Tarkov / DMZ' },
    ],
    matchTypes: ['Casual', 'Ranked', 'Custom'],
    maps: ['Auto Select', 'Vote', 'Random'],
  },
  {
    id: 'racing',
    name: 'Racing',
    protocol: 'Velocity Combat Protocol',
    icon: Zap,
    modes: [
      { name: 'Street Circuit', desc: 'Illegal street races through neon-lit cities', origin: 'Midnight Club / NFS' },
      { name: 'Open World Rally', desc: 'Cross-country racing across diverse biomes', origin: 'Forza Horizon' },
      { name: 'Vehicular Combat', desc: 'Armed vehicles in demolition arenas', origin: 'Twisted Metal' },
      { name: 'Sim Racing', desc: 'Realistic physics, pit strategy, endurance', origin: 'Gran Turismo' },
      { name: 'Kart Chaos', desc: 'Item-based racing with power-ups', origin: 'Mario Kart' },
      { name: 'Drift King', desc: 'Score-based drifting through technical courses', origin: 'Initial D' },
    ],
    matchTypes: ['Quick Race', 'Ranked Series', 'Custom Lobby'],
    maps: ['Auto Track', 'Vote', 'Random'],
  },
  {
    id: 'cards',
    name: 'Cards',
    protocol: 'Tactical Simulation Protocol',
    icon: Crown,
    modes: [
      { name: 'Duel Masters', desc: 'Head-to-head card battles with summoned creatures', origin: 'Yu-Gi-Oh!' },
      { name: 'Creature Clash', desc: 'Elemental creature battles with type advantages', origin: 'Pokémon TCG' },
      { name: 'Spell Wars', desc: 'Wizard dueling with spell decks and mana systems', origin: 'Wizard101' },
      { name: 'Tavern Brawl', desc: 'Hero-based card combat with random modifiers', origin: 'Hearthstone' },
      { name: 'Triple Triad', desc: 'Grid-based card placement with capture mechanics', origin: 'Final Fantasy' },
      { name: 'Deck Raid', desc: 'Co-op deck building against AI bosses', origin: 'WoW TCG' },
    ],
    matchTypes: ['Casual', 'Ranked', 'Tournament'],
    maps: ['Auto Arena', 'Classic Board', 'Random'],
  },
  {
    id: 'mmo',
    name: 'MMO',
    protocol: 'Strategic Combat Protocol',
    icon: Globe,
    modes: [
      { name: 'ATB Combat', desc: 'Active Time Battle — wait for gauge, then strike', origin: 'Final Fantasy' },
      { name: 'Force Tactics', desc: 'Pause-based tactical combat with abilities', origin: 'KOTOR' },
      { name: 'Expedition Turn', desc: 'Pure turn-based party combat with positioning', origin: 'Expedition 33' },
      { name: 'Tab Target', desc: 'Classic MMO rotation-based combat with cooldowns', origin: 'WoW / FFXIV' },
      { name: 'Action MMORPG', desc: 'Real-time dodge and combo-based MMO combat', origin: 'Black Desert' },
      { name: 'Raid Boss', desc: 'Multi-party coordinated boss encounters', origin: 'WoW / Destiny' },
    ],
    matchTypes: ['Casual', 'Ranked', 'Guild War'],
    maps: ['Auto Dungeon', 'Vote', 'Random'],
  },
];

// ── Mock rank data ──
const RANK_DATA = {
  rank: 'Gold II',
  mmr: 1540,
  wins: 87,
  losses: 62,
  season: 'Season 3',
  winRate: '58%',
};

// ── Collapsible Section (Arena Edition) ──
function CollapsibleSection({ title, defaultOpen = false, children, accentColor = 'cyan' }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl overflow-hidden" style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 transition-colors group"
        style={{ background: open ? 'rgba(34,211,238,0.03)' : 'transparent' }}
      >
        <div className="flex items-center gap-3">
          <div className={`w-1 h-4 rounded-full transition-all duration-300 ${open ? 'bg-cyan-400' : 'bg-white/10'}`} />
          <span className="text-white/60 text-[11px] font-semibold tracking-[0.2em] uppercase group-hover:text-white/80 transition-colors">{title}</span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className={`w-4 h-4 transition-colors ${open ? 'text-cyan-400/60' : 'text-white/20'}`} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-5 pt-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Genre Rail (Simulation Protocols) ──
function GenreRail({ genres, selected, onSelect }) {
  return (
    <div className="flex flex-col gap-1">
      {genres.map((g) => {
        const isActive = selected?.id === g.id;
        return (
          <button
            key={g.id}
            onClick={() => onSelect(g)}
            className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-300 border overflow-hidden group ${
              isActive
                ? 'border-cyan-500/30 bg-cyan-500/[0.06]'
                : 'border-transparent hover:bg-white/[0.03] hover:border-white/[0.06]'
            }`}
          >
            {/* Active glow effect */}
            {isActive && (
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(ellipse at left center, rgba(34,211,238,0.08), transparent 70%)',
              }} />
            )}
            {/* Violet inner aura on active */}
            {isActive && (
              <div className="absolute right-0 top-0 bottom-0 w-12 pointer-events-none" style={{
                background: 'radial-gradient(ellipse at right center, rgba(139,92,246,0.06), transparent 70%)',
              }} />
            )}

            <div className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${
              isActive
                ? 'bg-cyan-500/10 border border-cyan-500/25'
                : 'bg-white/[0.03] border border-white/[0.06] group-hover:border-white/10'
            }`}>
              <g.icon className={`w-4 h-4 transition-all duration-300 ${isActive ? 'text-cyan-400' : 'text-white/30 group-hover:text-white/50'}`} />
            </div>
            <div className="relative flex-1 min-w-0">
              <span className={`block text-sm font-medium tracking-wide transition-colors duration-300 ${isActive ? 'text-white' : 'text-white/45 group-hover:text-white/70'}`}>
                {g.name}
              </span>
              <span className={`block text-[9px] tracking-wider uppercase transition-colors duration-300 ${isActive ? 'text-cyan-400/50' : 'text-white/15'}`}>
                {g.protocol}
              </span>
            </div>
            {/* Active indicator bar */}
            {isActive && (
              <motion.div
                layoutId="genre-indicator"
                className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-cyan-400"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Holographic Background Grid ──
function HolographicBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: 0.04 }}>
      {/* Grid lines */}
      <div className="absolute inset-0" style={{
        backgroundImage: `
          linear-gradient(rgba(34,211,238,0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(34,211,238,0.3) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }} />
      {/* Drifting particles (CSS only) */}
      <div className="absolute w-1 h-1 rounded-full bg-cyan-400/40 animate-pulse" style={{ top: '20%', left: '30%' }} />
      <div className="absolute w-0.5 h-0.5 rounded-full bg-violet-400/40 animate-pulse" style={{ top: '60%', left: '70%', animationDelay: '1s' }} />
      <div className="absolute w-1 h-1 rounded-full bg-cyan-400/30 animate-pulse" style={{ top: '80%', left: '15%', animationDelay: '2s' }} />
      <div className="absolute w-0.5 h-0.5 rounded-full bg-violet-400/30 animate-pulse" style={{ top: '35%', left: '85%', animationDelay: '0.5s' }} />
    </div>
  );
}

// ── Scan Line Animation ──
function ScanLine() {
  return (
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: '200%' }}
      transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 10 }}
      className="absolute top-0 left-0 h-full w-32 pointer-events-none"
      style={{
        background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.06), transparent)',
      }}
    />
  );
}

// ── Main PvP Console ──
export default function PvPConsole({ onBack }) {
  const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);
  const [selectedMode, setSelectedMode] = useState(null);
  const [selectedMatchType, setSelectedMatchType] = useState(null);
  const [selectedMap, setSelectedMap] = useState(null);
  const [genreShift, setGenreShift] = useState(false);
  const [inQueue, setInQueue] = useState(false);
  const [queueTime, setQueueTime] = useState(0);

  // Reset config when genre changes
  useEffect(() => {
    setSelectedMode(null);
    setSelectedMatchType(null);
    setSelectedMap(null);
    setGenreShift(false);
  }, [selectedGenre]);

  // Queue timer
  useEffect(() => {
    if (!inQueue) { setQueueTime(0); return; }
    const interval = setInterval(() => setQueueTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [inQueue]);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ── Queue State ──
  if (inQueue) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 relative">
        <HolographicBg />

        {/* Animated rings */}
        <div className="w-36 h-36 relative mb-12">
          <div className="absolute inset-0 rounded-full border border-cyan-500/10 animate-ping" style={{ animationDuration: '3s' }} />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border border-cyan-500/20"
            style={{ borderTopColor: 'transparent', borderLeftColor: 'transparent' }}
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-3 rounded-full border border-violet-500/15"
            style={{ borderTopColor: 'transparent', borderRightColor: 'transparent' }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <selectedGenre.icon className="w-6 h-6 text-cyan-400 mb-1" />
            <span className="text-cyan-400/80 text-xs font-mono">{formatTime(queueTime)}</span>
          </div>
        </div>

        <h2 className="text-2xl font-light text-white mb-1 tracking-[0.15em] uppercase">Simulation Matching</h2>
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent mb-5" />

        <div className="flex items-center gap-3 text-white/30 text-xs mb-2">
          <span className="text-cyan-400">{selectedGenre.name}</span>
          {selectedMode && <><span className="text-white/15">·</span><span>{selectedMode.name}</span></>}
          {selectedMatchType && <><span className="text-white/15">·</span><span>{selectedMatchType}</span></>}
        </div>
        <p className="text-white/15 text-[10px] tracking-widest uppercase mb-10">AI opponent calibration in progress</p>

        <button
          onClick={() => setInQueue(false)}
          className="px-10 py-3 rounded-full text-xs tracking-widest uppercase transition-all duration-300 border border-white/10 hover:border-red-500/40 text-white/50 hover:text-red-400 hover:bg-red-500/[0.05]"
        >
          Abort Simulation
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col relative" style={{ background: 'linear-gradient(135deg, #0D1117 0%, #111827 50%, #0D1117 100%)' }}>
      <HolographicBg />

      {/* ── Top: PvP Simulation Header ── */}
      <div className="flex-shrink-0 relative overflow-hidden" style={{
        background: 'rgba(8,12,18,0.7)',
        backdropFilter: 'blur(25px) saturate(150%)',
        WebkitBackdropFilter: 'blur(25px) saturate(150%)',
        borderBottom: '1px solid rgba(34,211,238,0.08)',
      }}>
        <ScanLine />
        <div className="flex items-center justify-between px-6 py-4 relative z-10">
          <div className="flex items-center gap-6">
            {/* Status indicator */}
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                <div className="absolute inset-0 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-40" />
              </div>
              <span className="text-cyan-400/80 text-[10px] font-semibold tracking-[0.2em] uppercase">Combat Simulation Active</span>
            </div>

            <div className="h-4 w-px bg-white/8" />

            {/* Rank badge with glow */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{
              background: 'rgba(234,179,8,0.06)',
              border: '1px solid rgba(234,179,8,0.12)',
            }}>
              <Shield className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-yellow-400 font-semibold text-xs tracking-wide">{RANK_DATA.rank}</span>
            </div>

            <div className="flex items-center gap-5 text-[11px] text-white/35">
              <span>MMR <span className="text-white/70 font-mono font-medium">{RANK_DATA.mmr}</span></span>
              <span>W <span className="text-emerald-400 font-mono">{RANK_DATA.wins}</span> / L <span className="text-red-400 font-mono">{RANK_DATA.losses}</span></span>
              <span>WR <span className="text-white/70 font-mono">{RANK_DATA.winRate}</span></span>
            </div>
          </div>

          <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg" style={{
            background: 'rgba(139,92,246,0.06)',
            border: '1px solid rgba(139,92,246,0.1)',
          }}>
            <Star className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-violet-400/80 text-xs tracking-wider font-medium">{RANK_DATA.season}</span>
          </div>
        </div>

        {/* Energy line under header */}
        <div className="h-px w-full" style={{
          background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.15) 30%, rgba(139,92,246,0.1) 70%, transparent)',
        }} />
      </div>

      {/* ── Main: Genre Rail + Config Panel ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* Left: Genre Control Rail */}
        <div className="w-60 flex-shrink-0 overflow-y-auto p-4 relative" style={{
          background: 'rgba(8,12,18,0.5)',
          borderRight: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div className="flex items-center gap-2 mb-5 px-2">
            <Radio className="w-3 h-3 text-cyan-400/40" />
            <p className="text-cyan-400/30 text-[9px] font-bold tracking-[0.25em] uppercase">Genre Protocols</p>
          </div>
          <GenreRail genres={GENRES} selected={selectedGenre} onSelect={setSelectedGenre} />
        </div>

        {/* Center: Arena Configuration Panel */}
        <div className="flex-1 overflow-y-auto p-6 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedGenre.id}
              initial={{ opacity: 0, x: 20, filter: 'blur(4px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl mx-auto space-y-4"
            >
              {/* Genre header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center relative" style={{
                  background: 'rgba(34,211,238,0.08)',
                  border: '1px solid rgba(34,211,238,0.15)',
                  boxShadow: '0 0 20px rgba(34,211,238,0.08)',
                }}>
                  <selectedGenre.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white tracking-wide">{selectedGenre.name}</h2>
                  <p className="text-cyan-400/30 text-[10px] tracking-[0.15em] uppercase">{selectedGenre.protocol}</p>
                </div>
              </div>

              {/* ▶ Combat Mode (always visible) */}
              <CollapsibleSection title="Combat Mode" defaultOpen={true}>
                <div className="grid grid-cols-2 gap-2.5">
                  {selectedGenre.modes.map((mode) => {
                    const isSelected = selectedMode?.name === mode.name;
                    return (
                      <button
                        key={mode.name}
                        onClick={() => setSelectedMode(isSelected ? null : mode)}
                        className={`text-left p-4 rounded-xl border transition-all duration-300 group relative overflow-hidden ${
                          isSelected
                            ? 'border-cyan-500/25 bg-cyan-500/[0.06]'
                            : 'border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.04] hover:border-white/10'
                        }`}
                      >
                        {/* Selected glow */}
                        {isSelected && (
                          <div className="absolute inset-0 pointer-events-none" style={{
                            background: 'radial-gradient(ellipse at top left, rgba(34,211,238,0.06), transparent 60%)',
                          }} />
                        )}
                        <h4 className={`relative text-sm font-medium mb-1 transition-colors duration-200 ${isSelected ? 'text-white' : 'text-white/60 group-hover:text-white/80'}`}>
                          {mode.name}
                        </h4>
                        <p className="relative text-white/25 text-[11px] leading-relaxed mb-1.5">{mode.desc}</p>
                        <span className={`relative text-[9px] tracking-widest uppercase transition-colors duration-200 ${
                          isSelected ? 'text-cyan-400/60' : 'text-white/10 group-hover:text-white/20'
                        }`}>
                          {mode.origin}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CollapsibleSection>

              {/* ▶ Simulation Rules (always visible) */}
              <CollapsibleSection title="Simulation Rules" defaultOpen={true}>
                <div className="flex gap-2.5">
                  {selectedGenre.matchTypes.map((mt) => {
                    const isSelected = selectedMatchType === mt;
                    const isRanked = mt.toLowerCase() === 'ranked' || mt.toLowerCase() === 'ranked series';
                    return (
                      <button
                        key={mt}
                        onClick={() => setSelectedMatchType(isSelected ? null : mt)}
                        className={`flex-1 py-3 rounded-xl text-xs font-medium tracking-wider uppercase transition-all duration-300 border relative overflow-hidden ${
                          isSelected
                            ? isRanked
                              ? 'border-red-500/25 bg-red-500/[0.06] text-red-300'
                              : 'border-cyan-500/25 bg-cyan-500/[0.06] text-white'
                            : 'border-white/[0.05] bg-white/[0.015] text-white/40 hover:bg-white/[0.04] hover:text-white/60'
                        }`}
                      >
                        {mt}
                        {isSelected && isRanked && (
                          <div className="absolute inset-0 pointer-events-none" style={{
                            background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.04), transparent 60%)',
                          }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </CollapsibleSection>

              {/* ▼ Environment Parameters (collapsed) */}
              <CollapsibleSection title="Environment Parameters">
                <div className="mb-5">
                  <p className="text-white/35 text-[10px] mb-3 tracking-[0.15em] uppercase">Genre Shift</p>
                  <div className="flex gap-2.5">
                    {[false, true].map((val) => (
                      <button
                        key={String(val)}
                        onClick={() => setGenreShift(val)}
                        className={`flex-1 py-2.5 rounded-lg border text-xs font-medium transition-all duration-300 ${
                          genreShift === val
                            ? 'bg-cyan-500/[0.06] border-cyan-500/20 text-white'
                            : 'bg-white/[0.015] border-white/[0.05] text-white/30 hover:bg-white/[0.03]'
                        }`}
                      >
                        {val ? 'Enabled' : 'Disabled'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-white/35 text-[10px] mb-3 tracking-[0.15em] uppercase">Map Rotation</p>
                  <div className="flex gap-2.5">
                    {selectedGenre.maps.map((m) => {
                      const isSelected = selectedMap === m;
                      return (
                        <button
                          key={m}
                          onClick={() => setSelectedMap(isSelected ? null : m)}
                          className={`flex-1 py-2.5 rounded-lg border text-xs font-medium transition-all duration-300 ${
                            isSelected
                              ? 'bg-cyan-500/[0.06] border-cyan-500/20 text-white'
                              : 'bg-white/[0.015] border-white/[0.05] text-white/30 hover:bg-white/[0.03]'
                          }`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CollapsibleSection>

              {/* ▼ Advanced Override (collapsed) */}
              <CollapsibleSection title="Advanced Override">
                <div className="text-white/20 text-xs text-center py-6 tracking-wider">
                  AI Modifiers and custom rulesets coming soon
                </div>
              </CollapsibleSection>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Bottom: Match Command Bar (sticky) ── */}
      <div className="flex-shrink-0 relative overflow-hidden" style={{
        background: 'rgba(8,12,18,0.75)',
        backdropFilter: 'blur(25px) saturate(150%)',
        WebkitBackdropFilter: 'blur(25px) saturate(150%)',
        borderTop: '1px solid rgba(34,211,238,0.06)',
      }}>
        {/* Top energy line */}
        <div className="h-px w-full" style={{
          background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.12) 30%, rgba(139,92,246,0.08) 70%, transparent)',
        }} />

        <div className="px-6 py-4 flex items-center justify-between">
          {/* Left: Mode Summary */}
          <div className="flex items-center gap-4 text-[11px] text-white/35">
            <div className="flex items-center gap-2">
              <selectedGenre.icon className="w-3.5 h-3.5 text-cyan-400/70" />
              <span className="text-white/60">{selectedGenre.name}</span>
            </div>
            {selectedMode && (
              <>
                <div className="w-px h-3.5 bg-white/8" />
                <span>{selectedMode.name}</span>
              </>
            )}
            {selectedMatchType && (
              <>
                <div className="w-px h-3.5 bg-white/8" />
                <span className={selectedMatchType.toLowerCase().includes('ranked') ? 'text-red-400/60' : ''}>{selectedMatchType}</span>
              </>
            )}
            {genreShift && (
              <>
                <div className="w-px h-3.5 bg-white/8" />
                <span className="text-violet-400/50">Shift: On</span>
              </>
            )}
          </div>

          {/* Center: Estimated Queue Time */}
          <div className="flex items-center gap-2 text-white/25 text-[10px] tracking-wider">
            <Clock className="w-3 h-3" />
            <span>~2:30 est.</span>
            <div className="w-px h-3 bg-white/8 mx-1" />
            <Users className="w-3 h-3" />
            <span>Solo</span>
          </div>

          {/* Right: Queue Button */}
          <button
            onClick={() => { if (selectedMode && selectedMatchType) setInQueue(true); }}
            disabled={!selectedMode || !selectedMatchType}
            className={`relative px-10 py-3 rounded-full text-xs font-semibold tracking-[0.15em] uppercase transition-all duration-300 flex items-center gap-3 overflow-hidden ${
              selectedMode && selectedMatchType
                ? 'text-black border border-cyan-400/30'
                : 'bg-white/[0.02] text-white/15 border border-white/[0.05] cursor-not-allowed'
            }`}
            style={selectedMode && selectedMatchType ? {
              background: 'linear-gradient(135deg, rgba(34,211,238,0.9), rgba(34,211,238,0.7))',
              boxShadow: '0 0 25px rgba(34,211,238,0.2), 0 0 60px rgba(34,211,238,0.06)',
            } : {}}
          >
            {/* Breathing glow animation */}
            {selectedMode && selectedMatchType && (
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 pointer-events-none rounded-full"
                style={{ boxShadow: '0 0 30px rgba(34,211,238,0.3)' }}
              />
            )}
            <Swords className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Queue Simulation</span>
          </button>
        </div>
      </div>
    </div>
  );
}