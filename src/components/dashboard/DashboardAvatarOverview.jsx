import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Activity, Heart, Zap, Trophy, Gamepad2, Star, Shield } from 'lucide-react';
import DashboardAvatarScene from './DashboardAvatarScene';
import { useAuth } from '../auth/AuthContext';

const FALLBACK_GENRES = ['Action', 'RPG', 'Strategy', 'Adventure', 'Shooter', 'Sci-Fi', 'Horror', 'Sports', 'Racing', 'Simulation', 'Puzzle'];

function Stat({ icon, label, value, accent = 'text-cyan-300' }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex items-center gap-2 min-w-0">
        <span className={accent}>{icon}</span>
        <span className="text-white/50 text-[10px] uppercase tracking-wider truncate">{label}</span>
      </div>
      <span className="text-white text-[11px] font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function GenreXP({ genres }) {
  const rows = (genres?.length
    ? genres
    : FALLBACK_GENRES.map(name => ({ name, level: 1, xp: 0, current_xp: 0, xp_to_next_level: 100 }))
  ).slice(0, 11);

  return (
    <div className="mt-3 pt-3 border-t border-white/10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/70 text-[10px] font-bold uppercase tracking-[0.16em]">Genre Experience</span>
        <span className="text-white/30 text-[9px]">XP / Level</span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {rows.map((genre, index) => {
          const name = genre.name || genre.genre || FALLBACK_GENRES[index];
          const level = Number(genre.level || genre.lvl || 1);
          const xp = Number(genre.current_xp ?? genre.xp ?? genre.experience ?? 0);
          const next = Math.max(1, Number(genre.xp_to_next_level ?? genre.next_level_xp ?? 100));
          const progress = Math.max(0, Math.min(100, (xp / next) * 100));
          return (
            <div key={`${name}-${index}`} className="min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-white/55 text-[8px] truncate">{name}</span>
                <span className="text-cyan-300/70 text-[8px] tabular-nums">Lv {level}</span>
              </div>
              <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full bg-cyan-400/60 rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <div className="text-right text-[7px] text-white/25 mt-0.5 tabular-nums">{xp.toLocaleString()} XP</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardAvatarOverview({ hostName }) {
  const { user } = useAuth();
  const [avatar, setAvatar] = useState(null);
  const [progression, setProgression] = useState(null);
  const [dashboardMode, setDashboardMode] = useState('dashboard');
  const [activeGame, setActiveGame] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const [avatars, progressions] = await Promise.all([
          base44.entities.Avatar.filter({ user_id: user.id }),
          base44.entities.AvatarProgression.filter({ user_id: user.id }),
        ]);
        if (!cancelled) {
          setAvatar(avatars?.[0] || null);
          setProgression(progressions?.[0] || null);
        }
      } catch (error) {
        console.error('Failed to load dashboard avatar overview:', error);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    const handleDashboardMode = (event) => {
      const mode = event.detail?.mode || 'dashboard';
      setDashboardMode(mode);
      setActiveGame(event.detail?.game || null);
    };
    window.addEventListener('lunaDashboardOverlayState', handleDashboardMode);
    return () => window.removeEventListener('lunaDashboardOverlayState', handleDashboardMode);
  }, []);

  const stats = useMemo(() => {
    const globalLevel = Number(progression?.global_level || user?.level || 1);
    const currentXP = Number(progression?.current_xp ?? progression?.xp ?? user?.experience ?? 0);
    const nextXP = Math.max(1, Number(progression?.xp_to_next_level ?? progression?.next_level_xp ?? 1000));
    return {
      power: avatar?.power ?? progression?.power ?? user?.power ?? 0,
      hp: avatar?.hp ?? avatar?.health ?? progression?.hp ?? 100,
      level: globalLevel,
      currentXP,
      nextXP,
      rank: user?.rank || 'Recruit',
      gamerScore: Number(user?.gamer_score || 0),
      aiPoints: Number(user?.ai_achievement_points || 0),
      gamesPlayed: Number(user?.games_played || 0),
    };
  }, [avatar, progression, user]);

  const levelProgress = Math.max(0, Math.min(100, (stats.currentXP / stats.nextXP) * 100));

  // This overlay is dashboard-only. Full Library and other dashboard sections own their space.
  if (dashboardMode === 'library' || dashboardMode === 'section') {
    return null;
  }

  const gameActive = dashboardMode === 'game' && !!activeGame;

  return (
    <div className="fixed left-[330px] right-[16px] top-[150px] bottom-[104px] z-[25] pointer-events-none flex flex-col gap-3 overflow-hidden">
      {/* Seven empty liquid-glass quick slots aligned under the Environment Hub / top option row. */}
      <div className="pointer-events-none flex items-center justify-between gap-3 h-11 w-[680px] max-w-full flex-shrink-0">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            aria-hidden="true"
            className="h-11 w-11 flex-shrink-0 rounded-xl border border-white/10 bg-white/[0.045] backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_4px_18px_rgba(0,0,0,0.12)]"
          />
        ))}
      </div>

      {/* Invisible 70/30 dashboard composition. */}
      <div className="flex-1 min-h-0 w-full flex gap-3 pointer-events-none">
        <div
          className="relative basis-[70%] min-w-0 h-full overflow-hidden pointer-events-auto transition-all duration-300"
          style={gameActive ? { filter: 'blur(9px)', opacity: 0.72, transform: 'scale(0.995)' } : undefined}
          aria-label="AI avatar 3D viewer"
        >
          <DashboardAvatarScene />
        </div>

        {!gameActive && (
          <aside className="basis-[30%] min-w-0 h-full overflow-y-auto rounded-2xl bg-white/[0.025] border border-white/8 backdrop-blur-sm pointer-events-auto px-4 py-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
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
