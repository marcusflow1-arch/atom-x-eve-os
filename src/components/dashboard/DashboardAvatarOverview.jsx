import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Activity, Heart, Zap, Trophy, Gamepad2, Star, Shield,
  ChevronRight, BarChart3, Gauge, Target, Sparkles, Users, Radio, Crown
} from 'lucide-react';
import DashboardAvatarScene from './DashboardAvatarScene';
import { useAuth } from '../auth/AuthContext';

const FALLBACK_GENRES = ['Action', 'RPG', 'Strategy', 'Adventure', 'Shooter', 'Sci-Fi', 'Horror', 'Sports', 'Racing', 'Simulation', 'Puzzle'];

function GlassSlot({ icon: Icon, label }) {
  return (
    <div aria-label={label} className="relative h-[54px] w-[54px] flex-shrink-0 rounded-xl border border-white/[0.16] bg-white/[0.055] backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_8px_24px_rgba(0,0,0,0.18)]">
      <div className="absolute inset-0 rounded-xl border border-cyan-300/[0.04]" />
      {Icon && <Icon className="absolute left-1/2 top-[12px] -translate-x-1/2 w-4 h-4 text-white/55" />}
      <span className="absolute bottom-[5px] left-0 right-0 text-center text-[6px] uppercase tracking-wider text-white/45">{label}</span>
    </div>
  );
}

function StatRow({ icon, label, value, accent = 'text-cyan-300' }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 border-b border-white/[0.06] last:border-b-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className={accent}>{icon}</span>
        <span className="text-white/55 text-[9px] uppercase tracking-wider truncate">{label}</span>
      </div>
      <span className="text-white text-[10px] font-semibold tabular-nums">{value}</span>
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
    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
      {list.map((g, i) => {
        const name = g.name || g.genre || FALLBACK_GENRES[i];
        const level = Number(g.level || 1);
        const xp = Number(g.current_xp ?? g.xp ?? 0);
        const next = Math.max(1, Number(g.xp_to_next_level ?? g.next_xp ?? 100));
        return (
          <div key={`${name}-${i}`}>
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="text-white/55 text-[7px] truncate">{name}</span>
              <span className="text-cyan-300/80 text-[7px]">Lv {level}</span>
            </div>
            <ProgressBar value={(xp / next) * 100} />
            <div className="text-right text-[6px] text-white/25 mt-0.5">{xp.toLocaleString()} XP</div>
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
    defense: Number(progression?.defense || progression?.armor || 0),
    agility: Number(progression?.agility || 10),
    endurance: Number(progression?.endurance || 10),
    luck: Number(progression?.luck || 10),
    totalGenreXP: Number(progression?.total_genre_xp || progression?.genre_xp || 0),
  }), [progression, user]);

  const levelProgress = Math.min(100, (stats.currentXP / stats.nextXP) * 100);
  const gameActive = surface === 'game';
  const hideCards = surface !== 'dashboard';

  const slotItems = [
    { icon: BarChart3, label: 'Stats' }, { icon: Users, label: 'Friends' }, { icon: Radio, label: 'Live' },
    { icon: Trophy, label: 'Cards' }, { icon: Sparkles, label: 'AI Story' }, { icon: Shield, label: 'AI Battle' }, { icon: Crown, label: 'Season' },
  ];
  const circleOptions = [
    { id: 'blank-1', label: 'View 1', icon: Activity }, { id: 'blank-2', label: 'View 2', icon: Gauge },
    { id: 'blank-3', label: 'View 3', icon: BarChart3 }, { id: 'blank-4', label: 'View 4', icon: Target }, { id: 'blank-5', label: 'View 5', icon: Sparkles },
  ];

  return (
    <div className="fixed left-[390px] right-0 top-[191px] bottom-[48px] z-[25] pointer-events-none overflow-visible" aria-label="AI avatar dashboard area">
      {/* One stat-bar-sized position higher: directly beneath Environment Hub. */}
      <div className={`relative z-40 flex items-center gap-[4px] h-[54px] w-fit transition-all duration-500 ${hideCards ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
        {slotItems.map((item) => <GlassSlot key={item.label} icon={item.icon} label={item.label} />)}
      </div>

      <div className={`absolute left-0 right-0 top-[72px] bottom-0 pointer-events-auto transition-all duration-500 ${gameActive ? 'blur-[10px] opacity-25 scale-[0.995]' : surface === 'library' ? 'opacity-15' : surface === 'section' ? 'opacity-20' : 'opacity-100'}`} aria-label="AI avatar 3D viewer">
        <DashboardAvatarScene />
      </div>

      {/* Taller compact attribute panel: positioned high enough to keep the complete overview visible. */}
      <aside className={`absolute ${attributeMenuOpen ? 'right-[58px]' : 'right-0'} top-[-10px] w-[338px] max-w-[30vw] min-h-[600px] max-h-[calc(100vh-215px)] overflow-visible transition-all duration-300 ${hideCards ? 'opacity-0 translate-x-5 pointer-events-none' : 'opacity-100 translate-x-0 pointer-events-auto'}`} aria-label="AI Attribute Box">
        <div className="relative h-full min-h-[600px] rounded-2xl border-2 border-white/[0.22] bg-slate-950/[0.48] backdrop-blur-2xl shadow-[0_14px_45px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.16)] overflow-visible">
          <div className="absolute inset-[1px] rounded-[14px] border border-cyan-300/[0.08] pointer-events-none" />
          <div className="relative px-5 pt-3 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2 pr-7">
              <span className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.7)]" />
              <div><div className="text-white/45 text-[8px] uppercase tracking-[0.2em]">AI Attribute Box</div><div className="text-white font-bold text-base">AI Avatar</div></div>
            </div>
            <button onClick={() => setAttributeMenuOpen(v => !v)} aria-label="Open AI attribute options" className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-16 rounded-r-xl border border-white/[0.22] border-l-0 bg-white/[0.08] backdrop-blur-xl flex items-center justify-center text-white/65 hover:text-cyan-200 hover:bg-cyan-300/[0.10] transition-all z-30">
              <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${attributeMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {attributeMenuOpen && <div className="absolute right-[-54px] top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2">
              {circleOptions.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setAttributeView(id)} aria-label={label} title={label} className="w-10 h-10 rounded-full border border-white/[0.18] bg-white/[0.08] backdrop-blur-xl flex items-center justify-center text-white/55 hover:text-cyan-200 hover:border-cyan-300/35 hover:bg-cyan-300/10 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"><Icon className="w-4 h-4" /></button>)}
            </div>}
          </div>

          <div className="relative px-5 py-2 h-[calc(100%-65px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {attributeView === 'overview' && <>
              <StatRow icon={<Zap className="w-3 h-3" />} label="Power" value={stats.power} accent="text-yellow-300" />
              <StatRow icon={<Heart className="w-3 h-3" />} label="HP" value={stats.hp} accent="text-red-300" />
              <StatRow icon={<Shield className="w-3 h-3" />} label="Rank" value={stats.rank} accent="text-blue-300" />
              <StatRow icon={<Star className="w-3 h-3" />} label="Global Level" value={stats.level} />
              <StatRow icon={<BarChart3 className="w-3 h-3" />} label="Global XP" value={`${stats.currentXP.toLocaleString()} / ${stats.nextXP.toLocaleString()}`} />
              <StatRow icon={<Trophy className="w-3 h-3" />} label="Gamer Score" value={stats.gamerScore.toLocaleString()} accent="text-amber-300" />
              <StatRow icon={<Zap className="w-3 h-3" />} label="AI Points" value={stats.aiPoints.toLocaleString()} accent="text-purple-300" />
              <StatRow icon={<Gamepad2 className="w-3 h-3" />} label="Games Played" value={stats.gamesPlayed} accent="text-green-300" />
              <StatRow icon={<Target className="w-3 h-3" />} label="Available Points" value={stats.availablePoints} accent="text-yellow-300" />
              <StatRow icon={<Shield className="w-3 h-3" />} label="Defense" value={stats.defense} accent="text-blue-300" />
              <StatRow icon={<Activity className="w-3 h-3" />} label="Agility" value={stats.agility} accent="text-cyan-300" />
              <StatRow icon={<Heart className="w-3 h-3" />} label="Endurance" value={stats.endurance} accent="text-green-300" />
              <StatRow icon={<Star className="w-3 h-3" />} label="Luck" value={stats.luck} accent="text-purple-300" />
            </>}
            {attributeView.startsWith('blank-') && <div className="min-h-[460px]" />}

            <div className="mt-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between mb-1"><span className="text-white/40 text-[8px] uppercase tracking-wider">Overall Level Progress</span><span className="text-cyan-300/80 text-[8px]">{Math.round(levelProgress)}%</span></div>
              <ProgressBar value={levelProgress} />
              <div className="flex items-center justify-between mt-0.5 text-[6px] text-white/25"><span>{stats.currentXP.toLocaleString()} XP</span><span>Next: {stats.nextXP.toLocaleString()} XP</span></div>
            </div>

            <div className="mt-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between mb-1"><span className="text-white/60 text-[8px] uppercase tracking-wider">Top Genres / Current Levels</span><span className="text-white/30 text-[7px]">XP / Level</span></div>
              <GenreRows genres={progression?.genres} />
            </div>

            <div className="mt-2 pt-2 border-t border-white/10 grid grid-cols-4 gap-1.5">
              {[['STR', stats.strength], ['INT', stats.intelligence], ['WIL', stats.willpower], ['TEN', stats.tenacity]].map(([label, value]) => <div key={label} className="rounded-lg border border-white/10 bg-white/[0.035] px-2 py-1.5"><div className="text-white/35 text-[7px] uppercase">{label}</div><div className="text-white text-[11px] font-semibold mt-0.5">{value}</div></div>)}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
