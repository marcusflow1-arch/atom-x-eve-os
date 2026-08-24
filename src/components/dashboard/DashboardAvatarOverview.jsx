import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Activity, Heart, Zap, Trophy, Gamepad2, Star, Shield } from 'lucide-react';
import DashboardAvatarScene from './DashboardAvatarScene';
import { useAuth } from '../auth/AuthContext';

const FALLBACK_GENRES = ['Action', 'RPG', 'Strategy', 'Adventure', 'Shooter', 'Sci-Fi', 'Horror', 'Sports', 'Racing', 'Simulation', 'Puzzle'];

function Stat({ icon, label, value, accent = 'text-cyan-300' }) {
  return (
    <div className="flex items-center justify-between py-[3px]">
      <div className="flex items-center gap-2">
        <span className={accent}>{icon}</span>
        <span className="text-white/50 text-[11px]">{label}</span>
      </div>
      <span className="text-white font-semibold text-[11px] tabular-nums">{value}</span>
    </div>
  );
}

function GenreXP({ genres }) {
  const list = genres && genres.length
    ? genres
    : FALLBACK_GENRES.map((name, i) => ({ name, level: 1 + i }));
  return (
    <div className="mt-3 pt-3 border-t border-white/10">
      <p className="text-white/50 text-[9px] uppercase tracking-wider mb-2">Genre Mastery</p>
      <div className="space-y-1.5">
        {list.slice(0, 6).map((g) => (
          <div key={g.name}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-white/60 text-[10px]">{g.name}</span>
              <span className="text-cyan-300 text-[9px] tabular-nums">Lv. {g.level || 1}</span>
            </div>
            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full bg-cyan-400/50 rounded-full"
                style={{ width: `${Math.min(100, ((g.level || 1) / 10) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardAvatarOverview({ hostName = 'My' }) {
  const { user } = useAuth();
  const [progression, setProgression] = useState(null);
  const [gameActive, setGameActive] = useState(false);

  useEffect(() => {
    const handler = () => setGameActive(true);
    const clear = () => setGameActive(false);
    window.addEventListener('dashboardGameLaunched', handler);
    window.addEventListener('dashboardGameClosed', clear);
    return () => {
      window.removeEventListener('dashboardGameLaunched', handler);
      window.removeEventListener('dashboardGameClosed', clear);
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const items = await base44.entities.AvatarProgression.filter({ user_id: user.id });
        if (items.length > 0) setProgression(items[0]);
      } catch (e) {
        console.error('Failed to load avatar progression:', e);
      }
    })();
  }, [user?.id]);

  const stats = useMemo(() => ({
    power: progression?.power || 0,
    hp: progression?.hp || 100,
    rank: user?.rank || 'Recruit',
    level: progression?.global_level || user?.level || 1,
    gamerScore: user?.gamer_score || 0,
    aiPoints: user?.ai_achievement_points || 0,
    gamesPlayed: user?.games_played || 0,
    currentXP: progression?.current_xp || 0,
    nextXP: progression?.next_xp || 1000,
  }), [progression, user]);

  const levelProgress = stats.nextXP > 0
    ? Math.min(100, (stats.currentXP / stats.nextXP) * 100)
    : 0;

  return (
    <div
      className="fixed left-[360px] right-0 top-[150px] bottom-[104px] z-[25] pointer-events-none flex flex-col gap-3 overflow-hidden"
      aria-label="AI avatar dashboard area"
    >
      {/* Seven decorative liquid-glass slots. They begin on the same left edge
          as the Environment Hub and stay completely clear of the Library/profile UI. */}
      <div className="pointer-events-none flex items-center justify-between gap-3 h-11 w-[700px] flex-shrink-0">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            aria-hidden="true"
            className="h-11 w-11 flex-shrink-0 rounded-xl border border-white/10 bg-white/[0.045] backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_4px_18px_rgba(0,0,0,0.12)]"
          />
        ))}
      </div>

      {/* Invisible viewer + far-right information column. The grid reserves the
          full available dashboard width so the stats never sit against the avatar. */}
      <div className="grid grid-cols-[minmax(0,70%)_minmax(0,30%)] gap-4 flex-1 min-h-0 w-full pointer-events-none">
        <div
          className="relative min-w-0 h-full overflow-hidden pointer-events-auto transition-all duration-300"
          style={gameActive ? { filter: 'blur(9px)', opacity: 0.72, transform: 'scale(0.995)' } : undefined}
          aria-label="AI avatar 3D viewer"
        >
          <DashboardAvatarScene />
        </div>

        {!gameActive && (
          <aside
            className="min-w-0 h-full overflow-y-auto rounded-2xl bg-white/[0.025] border border-white/8 backdrop-blur-sm pointer-events-auto px-4 py-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
            aria-label="AI avatar general information"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-white/35 text-[8px] uppercase tracking-[0.2em]">AI Avatar</p>
                <h3 className="text-white font-bold text-sm leading-tight">General Information</h3>
              </div>
              <Activity className="w-4 h-4 text-cyan-300/70" />
            </div>

            <div className="space-y-0.5">
              <Stat icon={<Zap className="w-3 h-3" />} label="Power" value={stats.power} accent="text-yellow-300" />
              <Stat icon={<Heart className="w-3 h-3" />} label="HP" value={stats.hp} accent="text-red-300" />
              <Stat icon={<Shield className="w-3 h-3" />} label="Rank" value={stats.rank} accent="text-blue-300" />
              <Stat icon={<Star className="w-3 h-3" />} label="Level" value={stats.level} accent="text-cyan-300" />
              <Stat icon={<Trophy className="w-3 h-3" />} label="Gamer Score" value={stats.gamerScore.toLocaleString()} accent="text-amber-300" />
              <Stat icon={<Zap className="w-3 h-3" />} label="AI Points" value={stats.aiPoints.toLocaleString()} accent="text-purple-300" />
              <Stat icon={<Gamepad2 className="w-3 h-3" />} label="Games Played" value={stats.gamesPlayed} accent="text-green-300" />
            </div>

            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white/50 text-[9px] uppercase tracking-wider">Current Level XP</span>
                <span className="text-cyan-300 text-[9px] tabular-nums">{stats.currentXP.toLocaleString()} / {stats.nextXP.toLocaleString()}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full bg-cyan-400/60 rounded-full" style={{ width: `${levelProgress}%` }} />
              </div>
            </div>

            <GenreXP genres={progression?.genres} />
          </aside>
        )}
      </div>
    </div>
  );
}