import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { base44 } from '@/api/base44Client';
import { Zap, Trophy, Star, Gamepad2, Users, TrendingUp, Network } from 'lucide-react';

function StatLine({ icon, label, value, color = 'text-white/70' }) {
  return (
    <div className="flex items-center justify-between py-[3px]">
      <div className="flex items-center gap-2">
        <span className={color}>{icon}</span>
        <span className="text-white/50 text-[11px]">{label}</span>
      </div>
      <span className="text-white font-semibold text-[11px] tabular-nums">{value}</span>
    </div>
  );
}

export default function AvatarStatCard() {
  const { user } = useAuth();
  const [avatar, setAvatar] = useState(null);
  const [progression, setProgression] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const [avatars, progressions] = await Promise.all([
          base44.entities.Avatar.filter({ user_id: user.id }),
          base44.entities.AvatarProgression.filter({ user_id: user.id }),
        ]);
        if (avatars.length > 0) setAvatar(avatars[0]);
        if (progressions.length > 0) setProgression(progressions[0]);
      } catch (e) {
        console.error('Failed to load avatar stats:', e);
      }
    })();
  }, [user?.id]);

  const displayName = avatar?.name || user?.username || user?.full_name || 'Unknown';
  const gender = avatar?.gender || '—';
  const globalLevel = progression?.global_level || user?.level || 1;
  const rank = user?.rank || 'Recruit';
  const gamerScore = user?.gamer_score || 0;
  const aiPoints = user?.ai_achievement_points || 0;
  const socialInfluence = avatar?.social_influence || 0;
  const gamesPlayed = user?.games_played || 0;
  const achievementsCount = user?.achievements_count || 0;

  // Top genre
  const topGenre = progression?.genres
    ?.slice()
    .sort((a, b) => (b.level || 1) - (a.level || 1))[0];

  return (
    <div
      className="rounded-xl overflow-hidden flex-shrink-0 flex flex-col relative"
      style={{
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.20)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(255,255,255,0.06), 0 6px 24px rgba(0,0,0,0.28)',
        height: '240px',
        width: '150px',
      }}
    >
      {/* Name & Rank Header */}
      <div className="px-3 pt-3 pb-2 border-b border-white/6 flex justify-between items-start">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-white font-bold text-[13px] truncate leading-tight">{displayName}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-cyan-400 text-[10px] font-semibold">{rank}</span>
            <span className="text-white/20 text-[10px]">·</span>
            <span className="text-white/40 text-[10px]">Lvl {globalLevel}</span>
            <span className="text-white/20 text-[10px]">·</span>
            <span className="text-white/40 text-[10px] capitalize">{gender}</span>
          </div>
        </div>

        {/* Skill Tree Button */}
        <div className="flex flex-col items-center group cursor-pointer" onClick={(e) => {
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('toggleSkillTree'));
        }}>
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-cyan-400/50 flex items-center justify-center transition-all">
            <Network className="w-4 h-4 text-white/70 group-hover:text-cyan-400" />
          </div>
          <span className="text-[8px] font-bold text-white/60 mt-1 uppercase tracking-wider group-hover:text-cyan-400 transition-colors">Skill Tree</span>
        </div>
      </div>

      {/* Scores & Profile Info */}
      <div className="px-3 py-2 flex-1 flex flex-col justify-between">
        <div>
          <StatLine icon={<Trophy className="w-3 h-3" />} label="Gamer Score" value={gamerScore.toLocaleString()} color="text-amber-400" />
          <StatLine icon={<Zap className="w-3 h-3" />} label="AI Points" value={aiPoints.toLocaleString()} color="text-cyan-400" />
          <StatLine icon={<Star className="w-3 h-3" />} label="Influence" value={socialInfluence.toLocaleString()} color="text-pink-400" />
          <StatLine icon={<Gamepad2 className="w-3 h-3" />} label="Games Played" value={gamesPlayed} color="text-green-400" />
          <StatLine icon={<TrendingUp className="w-3 h-3" />} label="Achievements" value={achievementsCount} color="text-purple-400" />
        </div>

        {/* Top Genre Footer */}
        {topGenre && (
          <div className="pt-2 mt-auto border-t border-white/6">
            <div className="flex items-center justify-between">
              <span className="text-white/30 text-[9px] uppercase tracking-wider font-bold">Top Genre</span>
              <span className="text-cyan-300 text-[10px] font-bold">Lv. {topGenre.level || 1}</span>
            </div>
            <p className="text-white/60 text-[11px] font-medium">{topGenre.name}</p>
          </div>
        )}
      </div>
    </div>
  );
}