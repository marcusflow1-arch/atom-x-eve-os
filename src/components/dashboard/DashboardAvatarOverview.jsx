import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Activity, Heart, Zap, Trophy, Gamepad2, Star, Shield,
  ChevronRight, BarChart3, Gauge, Target, Sparkles
} from 'lucide-react';
import DashboardAvatarScene from './DashboardAvatarScene';
import { useAuth } from '../auth/AuthContext';

const FALLBACK_GENRES = ['Action', 'RPG', 'Strategy', 'Adventure', 'Shooter', 'Sci-Fi', 'Horror', 'Sports', 'Racing', 'Simulation', 'Puzzle'];

function GlassSlot({ icon: Icon, label }) {
  return (
    <div
      aria-label={label}
      className="relative h-[58px] w-[58px] flex-shrink-0 rounded-xl border border-white/[0.16] bg-white/[0.055] backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_8px_24px_rgba(0,0,0,0.18)]"
    >
      <div className="absolute inset-0 rounded-xl border border-cyan-300/[0.04]" />
      {Icon && <Icon className="absolute left-1/2 top-[15px] -translate-x-1/2 w-4 h-4 text-white/55" />}
      <span className="absolute bottom-[6px] left-0 right-0 text-center text-[7px] uppercase tracking-wider text-white/45">{label}</span>
    </div>
  );
}

function StatRow({ icon, label, value, accent = 'text-cyan-300' }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.06] last:border-b-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className={accent}>{icon}</span>
        <span className="text-white/55 text-[10px] uppercase tracking-wider truncate">{label}</span>
      </div>
      <span className="text-white text-[11px] font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
      <div className="h-full rounded-full bg-cyan-300/65 transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

function GenreRows({ genres }) {
  const list = (genres?.length ? genres : FALLBACK_GENRES.map(name => ({ name, level: 1, current_xp: 0, xp_to_next_level: 100 }))).slice(0, 11);
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
      {list.map((g, i) => {
        const name = g.name || g.genre || FALLBACK_GENRES[i];
        const level = Number(g.level || 1);
        const xp = Number(g.current_xp ?? g.xp ?? 0);
        const next = Math.max(1, Number(g.xp_to_next_level ?? g.next_xp ?? 100));
        return (
          <div key={`${name}-${i}`}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-white/55 text-[8px] truncate">{name}</span>
              <span className="text-cyan-300/80 text-[8px]">Lv {level}</span>
            </div>
            <ProgressBar value={(xp / next) * 100} />
            <div className="text-right text-[7px] text-white/25 mt-0.5">{xp.toLocaleString()} XP</div>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardAvatarOverview() {
  const { user } = useAuth();
  const [progression, setProgression] = useState(null);
  const [surface, setSurface] = useState('dashboard');
  const [attributeView, setAttributeView] = useState('overview');
  const [attributeMenuOpen, setAttributeMenuOpen] = useState(false);

  useEffect(() => {
    const stateHandler = (event) => setSurface(event.detail?.mode || 'dashboard');
    const gameHandler = () => setSurface('game');
    const closeHandler = () => setSurface('dashboard');

    window.addEventListener('lunaDashboardOverlayState', stateHandler);
    window.addEventListener('dashboardGameLaunched', gameHandler);
    window.addEventListener('dashboardGameClosed', closeHandler);

    return () => {
      window.removeEventListener('lunaDashboardOverlayState', stateHandler);
      window.removeEventListener('dashboardGameLaunched', gameHandler);
      window.removeEventListener('dashboardGameClosed', closeHandler);
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const items = await base44.entities.AvatarProgression.filter({ user_id: user.id });
        if (!cancelled) setProgression(items?.[0] || null);
      } catch (error) {
        console.error('Failed to load avatar progression:', error);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const stats = useMemo(() => ({
    power: Number(progression?.power || 0),
    hp: Number(progression?.hp || 100),
    rank: user?.rank || 'Recruit',
    level: Number(progression?.global_level || user?.level || 1),
    gamerScore: Number(user?.gamer_score || 0),
    aiPoints: Number(user?.ai_achievement_points || 0),
    gamesPlayed: Number(user?.games_played || 0),
    currentXP: Number(progression?.current_xp || 0),
    nextXP: Math.max(1, Number(progression?.next_xp || progression?.xp_to_next_level || 1000)),
    availablePoints: Number(progression?.available_points || progression?.unspent_points || 0),
    strength: Number(progression?.strength || 10),
    intelligence: Number(progression?.intelligence || 10),
    willpower: Number(progression?.willpower || 10),
    tenacity: Number(progression?.tenacity || 10),
  }), [progression, user]);

  const levelProgress = Math.min(100, (stats.currentXP / stats.nextXP) * 100);
  const gameActive = surface === 'game';
  const dimViewer = surface === 'library' || surface === 'game' || surface === 'section';
  const hideCards = surface !== 'dashboard';

  const slotItems = [
    { icon: BarChart3, label: 'Stats' },
    { icon: Target, label: 'Quests' },
    { icon: Gamepad2, label: 'Games' },
    { icon: Trophy, label: 'Cards' },
    { icon: Sparkles, label: 'AI Story' },
    { icon: Shield, label: 'Battle' },
    { icon: Star, label: 'Season' },
  ];

  return (
    <div
      className="fixed left-[330px] right-0 top-[250px] bottom-[48px] z-[25] pointer-events-none overflow-visible"
      aria-label="AI avatar dashboard area"
    >
      {/* The seven boxes live below the existing Environment Hub / presence row.
          They are intentionally separate from the left profile and skill-tree UI. */}
      <div className={`flex items-center gap-3 h-[58px] w-fit transition-all duration-500 ${hideCards ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
        {slotItems.map((item) => <GlassSlot key={item.label} icon={item.icon} label={item.label} />)}
      </div>

      {/* Transparent 3D stage. The page background/screen-saver remains visible. */}
      <div
        className={`absolute left-0 right-0 top-[72px] bottom-0 pointer-events-auto transition-all duration-500 ${gameActive ? 'blur-[8px] opacity-35 scale-[0.995]' : surface === 'library' ? 'opacity-20' : surface === 'section' ? 'opacity-25' : 'opacity-100'}`}
        aria-label="AI avatar 3D viewer"
      >
        <DashboardAvatarScene />
      </div>

      {/* Far-right AI Attribute Box. It disappears on Library/Game/other surfaces
          while the avatar stage remains as the visual background. */}
      <aside
        className={`absolute right-0 top-0 w-[304px] max-w-[28vw] max-h-[calc(100%-12px)] overflow-visible transition-all duration-500 ${hideCards ? 'opacity-0 translate-x-5 pointer-events-none' : 'opacity-100 translate-x-0 pointer-events-auto'}`}
        aria-label="AI Attribute Box"
      >
        <div className="relative rounded-2xl border-2 border-white/[0.22] bg-slate-950/[0.48] backdrop-blur-2xl shadow-[0_14px_45px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.16)] overflow-visible">
          <div className="absolute inset-[1px] rounded-[14px] border border-cyan-300/[0.08] pointer-events-none" />

          <div className="relative px-4 pt-3 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2 pr-7">
              <span className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.7)]" />
              <div>
                <div className="text-white/45 text-[8px] uppercase tracking-[0.2em]">AI Attribute Box</div>
                <div className="text-white font-bold text-sm">AI Avatar</div>
              </div>
            </div>

            {/* Repurposed right-edge arrow. It expands the information modes. */}
            <button
              onClick={() => setAttributeMenuOpen(v => !v)}
              aria-label="Change AI attribute view"
              className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-16 rounded-r-xl border border-white/[0.22] border-l-0 bg-white/[0.08] backdrop-blur-xl flex items-center justify-center text-white/65 hover:text-cyan-200 hover:bg-cyan-300/[0.10] transition-all z-20"
            >
              <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${attributeMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {attributeMenuOpen && (
              <div className="absolute right-[-54px] top-[58px] z-40 flex flex-col gap-1.5">
                {[
                  ['overview', Activity],
                  ['attributes', Gauge],
                  ['progress', BarChart3],
                  ['genres', Trophy],
                ].map(([key, Icon]) => (
                  <button
                    key={key}
                    onClick={() => { setAttributeView(key); setAttributeMenuOpen(false); }}
                    className={`w-12 h-10 rounded-lg border backdrop-blur-xl flex items-center justify-center transition-all ${attributeView === key ? 'border-cyan-300/40 bg-cyan-300/15 text-cyan-200' : 'border-white/10 bg-white/10 text-white/55 hover:text-white'}`}
                    title={key}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative px-4 py-2 max-h-[calc(100vh-390px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {attributeView === 'overview' && (
              <>
                <StatRow icon={<Zap className="w-3.5 h-3.5" />} label="Power" value={stats.power} accent="text-yellow-300" />
                <StatRow icon={<Heart className="w-3.5 h-3.5" />} label="HP" value={stats.hp} accent="text-red-300" />
                <StatRow icon={<Shield className="w-3.5 h-3.5" />} label="Rank" value={stats.rank} accent="text-blue-300" />
                <StatRow icon={<Star className="w-3.5 h-3.5" />} label="Global Level" value={stats.level} />
                <StatRow icon={<Trophy className="w-3.5 h-3.5" />} label="Gamer Score" value={stats.gamerScore.toLocaleString()} accent="text-amber-300" />
                <StatRow icon={<Gamepad2 className="w-3.5 h-3.5" />} label="Games Played" value={stats.gamesPlayed} accent="text-green-300" />
              </>
            )}

            {attributeView === 'attributes' && (
              <>
                <StatRow icon={<Zap className="w-3.5 h-3.5" />} label="Available Points" value={stats.availablePoints} accent="text-yellow-300" />
                <StatRow icon={<Shield className="w-3.5 h-3.5" />} label="Strength" value={stats.strength} accent="text-red-300" />
                <StatRow icon={<Star className="w-3.5 h-3.5" />} label="Intelligence" value={stats.intelligence} accent="text-cyan-300" />
                <StatRow icon={<Activity className="w-3.5 h-3.5" />} label="Willpower" value={stats.willpower} accent="text-purple-300" />
                <StatRow icon={<Heart className="w-3.5 h-3.5" />} label="Tenacity" value={stats.tenacity} accent="text-green-300" />
              </>
            )}

            {attributeView === 'progress' && (
              <div className="py-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-white/50 text-[9px] uppercase tracking-wider">Overall Progress</span>
                  <span className="text-cyan-300 text-[9px]">{stats.currentXP.toLocaleString()} / {stats.nextXP.toLocaleString()} XP</span>
                </div>
                <ProgressBar value={levelProgress} />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    ['Level', stats.level],
                    ['Rank', stats.rank],
                    ['AI Points', stats.aiPoints.toLocaleString()],
                    ['Available', stats.availablePoints],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-white/10 bg-white/[0.035] px-2 py-2">
                      <div className="text-white/35 text-[8px] uppercase">{label}</div>
                      <div className="text-white text-[11px] font-semibold mt-0.5">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {attributeView === 'genres' && (
              <div className="py-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/60 text-[9px] uppercase tracking-wider">Genre Experience</span>
                  <span className="text-white/30 text-[8px]">XP / Level</span>
                </div>
                <GenreRows genres={progression?.genres} />
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white/40 text-[8px] uppercase tracking-wider">Current Level XP</span>
                <span className="text-cyan-300/80 text-[8px]">{stats.currentXP.toLocaleString()} / {stats.nextXP.toLocaleString()}</span>
              </div>
              <ProgressBar value={levelProgress} />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}