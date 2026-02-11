import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Crosshair, Zap, Crown, Globe, ChevronDown, ChevronUp, Users, Shield, Star, Clock } from 'lucide-react';

// ── Genre Data ──
const GENRES = [
  {
    id: 'fighting',
    name: 'Fighting',
    icon: Swords,
    accent: 'text-red-400',
    accentBg: 'bg-red-500',
    accentBorder: 'border-red-500/30',
    accentGlow: 'rgba(239,68,68,0.15)',
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
    icon: Crosshair,
    accent: 'text-emerald-400',
    accentBg: 'bg-emerald-500',
    accentBorder: 'border-emerald-500/30',
    accentGlow: 'rgba(16,185,129,0.15)',
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
    icon: Zap,
    accent: 'text-yellow-400',
    accentBg: 'bg-yellow-500',
    accentBorder: 'border-yellow-500/30',
    accentGlow: 'rgba(234,179,8,0.15)',
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
    icon: Crown,
    accent: 'text-purple-400',
    accentBg: 'bg-purple-500',
    accentBorder: 'border-purple-500/30',
    accentGlow: 'rgba(168,85,247,0.15)',
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
    icon: Globe,
    accent: 'text-blue-400',
    accentBg: 'bg-blue-500',
    accentBorder: 'border-blue-500/30',
    accentGlow: 'rgba(59,130,246,0.15)',
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

// ── Collapsible Section ──
function CollapsibleSection({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/6 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
      >
        <span className="text-white/70 text-xs font-semibold tracking-widest uppercase">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-5 pt-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Genre Rail (left) ──
function GenreRail({ genres, selected, onSelect }) {
  return (
    <div className="flex flex-col gap-1.5">
      {genres.map((g) => {
        const isActive = selected?.id === g.id;
        return (
          <button
            key={g.id}
            onClick={() => onSelect(g)}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200 border ${
              isActive
                ? `bg-white/[0.08] ${g.accentBorder} shadow-[0_0_15px_${g.accentGlow}]`
                : 'bg-transparent border-transparent hover:bg-white/[0.04] hover:border-white/6'
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              isActive ? `${g.accentBg}/20 border ${g.accentBorder}` : 'bg-white/[0.03] border border-white/6'
            }`}
              style={isActive ? { background: g.accentGlow } : {}}
            >
              <g.icon className={`w-4 h-4 transition-colors ${isActive ? g.accent : 'text-white/35'}`} />
            </div>
            <span className={`text-sm font-medium tracking-wide transition-colors ${isActive ? 'text-white' : 'text-white/50'}`}>
              {g.name}
            </span>
          </button>
        );
      })}
    </div>
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

  // Reset config when genre changes
  useEffect(() => {
    setSelectedMode(null);
    setSelectedMatchType(null);
    setSelectedMap(null);
    setGenreShift(false);
  }, [selectedGenre]);

  // Queue animation
  if (inQueue) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-28 h-28 relative mb-10">
          <div className="absolute inset-0 rounded-full border border-white/10 animate-ping opacity-20" />
          <div className="absolute inset-0 rounded-full border border-white/20 animate-spin opacity-40" style={{ borderTopColor: 'transparent', borderLeftColor: 'transparent' }} />
          <div className="absolute inset-4 rounded-full border opacity-50" style={{ borderColor: selectedGenre.accentGlow, borderTopColor: 'transparent', borderRightColor: 'transparent', animation: 'spin 2s linear infinite reverse' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <selectedGenre.icon className={`w-7 h-7 ${selectedGenre.accent} animate-pulse`} />
          </div>
        </div>
        <h2 className="text-2xl font-light text-white mb-2 tracking-wider uppercase">Searching for Opponent</h2>
        <div className="h-px w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent mb-5" />
        <p className="text-white/40 text-sm mb-1">
          Genre: <span className={selectedGenre.accent}>{selectedGenre.name}</span>
        </p>
        {selectedMode && <p className="text-white/25 text-xs mb-1">Mode: {selectedMode.name}</p>}
        {selectedMatchType && <p className="text-white/20 text-xs mb-8">Match: {selectedMatchType}</p>}
        <button
          onClick={() => setInQueue(false)}
          className="px-10 py-3 bg-white/[0.03] hover:bg-white/[0.08] text-white/60 hover:text-white border border-white/10 hover:border-red-500/30 rounded-full transition-all text-xs tracking-widest uppercase"
        >
          Cancel Queue
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">

      {/* ── Top: PvP Identity Bar ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/6"
        style={{ background: 'rgba(8,12,18,0.6)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-yellow-400" />
            <span className="text-white font-semibold text-sm">{RANK_DATA.rank}</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span>MMR <span className="text-white/70 font-medium">{RANK_DATA.mmr}</span></span>
            <span>W/L <span className="text-emerald-400 font-medium">{RANK_DATA.wins}</span>/<span className="text-red-400 font-medium">{RANK_DATA.losses}</span></span>
            <span>WR <span className="text-white/70 font-medium">{RANK_DATA.winRate}</span></span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Star className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-white/50 text-xs tracking-wider">{RANK_DATA.season}</span>
        </div>
      </div>

      {/* ── Main: Genre Rail + Config Panel ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* Left: Genre Rail */}
        <div className="w-56 flex-shrink-0 border-r border-white/6 overflow-y-auto p-4"
          style={{ background: 'rgba(10,14,20,0.5)' }}
        >
          <p className="text-white/20 text-[10px] font-bold tracking-[0.2em] uppercase mb-4 px-2">Genre</p>
          <GenreRail genres={GENRES} selected={selectedGenre} onSelect={setSelectedGenre} />
        </div>

        {/* Center: Config Panel */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedGenre.id}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className="max-w-3xl mx-auto space-y-4"
            >
              {/* Genre header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: selectedGenre.accentGlow, border: `1px solid ${selectedGenre.accentGlow}` }}>
                  <selectedGenre.icon className={`w-6 h-6 ${selectedGenre.accent}`} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white tracking-wide">{selectedGenre.name}</h2>
                  <p className="text-white/30 text-xs">Configure your match settings</p>
                </div>
              </div>

              {/* ▶ Mode Type (always visible) */}
              <CollapsibleSection title="Mode Type" defaultOpen={true}>
                <div className="grid grid-cols-2 gap-2.5">
                  {selectedGenre.modes.map((mode) => {
                    const isSelected = selectedMode?.name === mode.name;
                    return (
                      <button
                        key={mode.name}
                        onClick={() => setSelectedMode(isSelected ? null : mode)}
                        className={`text-left p-4 rounded-xl border transition-all duration-200 ${
                          isSelected
                            ? `bg-white/[0.08] ${selectedGenre.accentBorder}`
                            : 'bg-white/[0.02] border-white/6 hover:bg-white/[0.05] hover:border-white/12'
                        }`}
                      >
                        <h4 className={`text-sm font-medium mb-1 transition-colors ${isSelected ? 'text-white' : 'text-white/70'}`}>{mode.name}</h4>
                        <p className="text-white/30 text-[11px] leading-relaxed mb-1.5">{mode.desc}</p>
                        <span className={`text-[9px] tracking-widest uppercase ${isSelected ? selectedGenre.accent : 'text-white/15'}`}>
                          {mode.origin}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CollapsibleSection>

              {/* ▶ Match Type (always visible) */}
              <CollapsibleSection title="Match Type" defaultOpen={true}>
                <div className="flex gap-2.5">
                  {selectedGenre.matchTypes.map((mt) => {
                    const isSelected = selectedMatchType === mt;
                    return (
                      <button
                        key={mt}
                        onClick={() => setSelectedMatchType(isSelected ? null : mt)}
                        className={`flex-1 py-3 rounded-xl border text-xs font-medium tracking-wider uppercase transition-all ${
                          isSelected
                            ? `bg-white/[0.08] ${selectedGenre.accentBorder} text-white`
                            : 'bg-white/[0.02] border-white/6 text-white/50 hover:bg-white/[0.05] hover:text-white/70'
                        }`}
                      >
                        {mt}
                      </button>
                    );
                  })}
                </div>
              </CollapsibleSection>

              {/* ▼ Advanced Settings (collapsed by default) */}
              <CollapsibleSection title="Advanced Settings">
                {/* Genre Shift */}
                <div className="mb-5">
                  <p className="text-white/40 text-xs mb-3 tracking-wide">Genre Shift</p>
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => setGenreShift(false)}
                      className={`flex-1 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                        !genreShift ? 'bg-white/[0.08] border-white/20 text-white' : 'bg-white/[0.02] border-white/6 text-white/40 hover:bg-white/[0.04]'
                      }`}
                    >
                      Disabled
                    </button>
                    <button
                      onClick={() => setGenreShift(true)}
                      className={`flex-1 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                        genreShift ? 'bg-white/[0.08] border-white/20 text-white' : 'bg-white/[0.02] border-white/6 text-white/40 hover:bg-white/[0.04]'
                      }`}
                    >
                      Enabled
                    </button>
                  </div>
                </div>

                {/* Map Selection */}
                <div>
                  <p className="text-white/40 text-xs mb-3 tracking-wide">Map Selection</p>
                  <div className="flex gap-2.5">
                    {selectedGenre.maps.map((m) => {
                      const isSelected = selectedMap === m;
                      return (
                        <button
                          key={m}
                          onClick={() => setSelectedMap(isSelected ? null : m)}
                          className={`flex-1 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                            isSelected ? 'bg-white/[0.08] border-white/20 text-white' : 'bg-white/[0.02] border-white/6 text-white/40 hover:bg-white/[0.04]'
                          }`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CollapsibleSection>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Bottom: Queue Panel (sticky) ── */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-white/6 flex items-center justify-between"
        style={{ background: 'rgba(8,12,18,0.7)', backdropFilter: 'blur(20px)' }}
      >
        {/* Summary */}
        <div className="flex items-center gap-5 text-xs text-white/40">
          <div className="flex items-center gap-2">
            <selectedGenre.icon className={`w-3.5 h-3.5 ${selectedGenre.accent}`} />
            <span className="text-white/60">{selectedGenre.name}</span>
          </div>
          {selectedMode && (
            <>
              <div className="w-px h-4 bg-white/10" />
              <span>{selectedMode.name}</span>
            </>
          )}
          {selectedMatchType && (
            <>
              <div className="w-px h-4 bg-white/10" />
              <span>{selectedMatchType}</span>
            </>
          )}
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Users className="w-3 h-3" />
            <span>Solo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>~2:30 est.</span>
          </div>
        </div>

        {/* Queue button */}
        <button
          onClick={() => {
            if (selectedMode && selectedMatchType) setInQueue(true);
          }}
          disabled={!selectedMode || !selectedMatchType}
          className={`px-10 py-3 rounded-full text-xs font-semibold tracking-widest uppercase transition-all flex items-center gap-3 ${
            selectedMode && selectedMatchType
              ? 'bg-white text-black hover:bg-gray-200 shadow-lg'
              : 'bg-white/[0.04] text-white/20 border border-white/6 cursor-not-allowed'
          }`}
        >
          <Swords className="w-4 h-4" />
          Queue Match
        </button>
      </div>
    </div>
  );
}