import React from 'react';
import { Play, Users, Library, Trophy, Tv } from 'lucide-react';

// Shared bottom section used by every sidebar variant. In the narrow rail this
// area is reserved for the four persistent utility icons only. The Play/Launch
// action now lives in the rail's 50/50 midpoint control stack so Recent Games
// above and Friends/Library/Rewards/Entertainment below never move.

const PANELS = [
  { key: 'friends', label: 'Friends', Icon: Users, active: 'border-green-400/50 bg-green-500/20 text-green-400', idle: 'border-white/10 bg-white/5 text-white/60 hover:text-green-400 hover:border-green-400/40 hover:bg-green-500/10' },
  { key: 'library', label: 'Library', Icon: Library, active: 'border-cyan-400/50 bg-cyan-500/20 text-cyan-400', idle: 'border-white/10 bg-white/5 text-white/60 hover:text-cyan-400 hover:border-cyan-400/40 hover:bg-cyan-500/10' },
  { key: 'rewards', label: 'Rewards', Icon: Trophy, active: 'border-amber-400/50 bg-amber-500/20 text-amber-400', idle: 'border-white/10 bg-white/5 text-white/60 hover:text-amber-400 hover:border-amber-400/40 hover:bg-amber-500/10' },
  { key: 'entertainment', label: 'Entertain', Icon: Tv, active: 'border-indigo-400/50 bg-indigo-500/20 text-indigo-400', idle: 'border-white/10 bg-white/5 text-white/60 hover:text-indigo-400 hover:border-indigo-400/40 hover:bg-indigo-500/10' },
];

export default function SidebarBottomSection({
  narrow = true,
  expandedPanel,
  onPanel,
  onLaunch,
}) {
  const launch = (
    <button
      onClick={onLaunch}
      className="w-full h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/15 backdrop-blur-lg shadow-lg hover:scale-105 transition-all duration-300"
      title="Launch environment"
    >
      <Play className="w-4 h-4" />
      {!narrow && <span className="text-[7px] font-bold uppercase tracking-wider">Launch</span>}
    </button>
  );

  const panelBtn = (p) => {
    const isActive = expandedPanel === p.key;
    return (
      <button
        onClick={() => onPanel && onPanel(p.key)}
        className={`w-full h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 border backdrop-blur-lg shadow-lg transition-all hover:scale-105 ${isActive ? p.active : p.idle}`}
        title={p.label}
      >
        <p.Icon className="w-4 h-4" />
        {!narrow && <span className="text-[7px] font-bold uppercase tracking-wider">{p.label}</span>}
      </button>
    );
  };

  if (narrow) {
    return (
      <div className="flex flex-col items-center gap-2 w-full min-w-0">
        {/* Invisible action bridge: the midpoint Play control reuses the exact
            launch handler that used to live here, while this bottom area stays
            visually limited to the four utility icons. */}
        <button
          type="button"
          onClick={onLaunch}
          className="hidden text-cyan-300"
          data-sidebar-launch-proxy="true"
          aria-hidden="true"
          tabIndex={-1}
        >
          Play
        </button>
        {PANELS.map((p) => (
          <div key={p.key} className="w-full min-w-0">{panelBtn(p)}</div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 w-full max-w-full">
      <div className="col-span-2">{launch}</div>
      {PANELS.map((p) => (
        <div key={p.key} className="min-w-0">{panelBtn(p)}</div>
      ))}
    </div>
  );
}
