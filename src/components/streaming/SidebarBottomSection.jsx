import { Play, Users, Library, Trophy, Tv } from 'lucide-react';

// Shared bottom section used by every sidebar variant. In the narrow rail the
// visible Launch button is relocated to the midpoint, but its original 40px
// slot is deliberately preserved so Friends/Library/Rewards/Entertainment keep
// their exact established vertical positions.

const ACTIVE_PANEL_STYLE = 'border-slate-300/20 bg-slate-300/[0.12] text-slate-200/90 shadow-[inset_0_1px_0_rgba(255,255,255,.05),0_6px_18px_rgba(0,0,0,.16)]';

const PANELS = [
  { key: 'friends', label: 'Friends', Icon: Users, active: ACTIVE_PANEL_STYLE, idle: 'border-white/10 bg-white/5 text-white/60 hover:text-green-400 hover:border-green-400/40 hover:bg-green-500/10' },
  { key: 'library', label: 'Library', Icon: Library, active: ACTIVE_PANEL_STYLE, idle: 'border-white/10 bg-white/5 text-white/60 hover:text-cyan-400 hover:border-cyan-400/40 hover:bg-cyan-500/10' },
  { key: 'rewards', label: 'Rewards', Icon: Trophy, active: ACTIVE_PANEL_STYLE, idle: 'border-white/10 bg-white/5 text-white/60 hover:text-amber-400 hover:border-amber-400/40 hover:bg-amber-500/10' },
  { key: 'entertainment', label: 'Entertain', Icon: Tv, active: ACTIVE_PANEL_STYLE, idle: 'border-white/10 bg-white/5 text-white/60 hover:text-indigo-400 hover:border-indigo-400/40 hover:bg-indigo-500/10' },
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
        {/* Invisible but in-flow action bridge. Programmatic clicks from the
            midpoint Play button still use the original launch handler. */}
        <button
          type="button"
          onClick={onLaunch}
          className="invisible h-10 w-full shrink-0 text-cyan-300"
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
