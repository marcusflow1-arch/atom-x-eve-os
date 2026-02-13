import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { base44 } from '@/api/base44Client';
import { Shield, Zap, Trophy, Swords, Star, Heart, Brain, Flame } from 'lucide-react';

function StatLine({ icon, label, value, color = 'text-white/70' }) {
  return (
    <div className="flex items-center justify-between py-1">
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

  const stats = progression?.stats || { hp: 100, strength: 10, intelligence: 10, will: 10, tenacity: 10 };

  // Top genre
  const topGenre = progression?.genres
    ?.slice()
    .sort((a, b) => (b.level || 1) - (a.level || 1))[0];

  return (
    <div
      className="rounded-2xl overflow-hidden w-[210px] flex-shrink-0"
      style={{
        background: 'rgba(22, 27, 38, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
      }}
    >
      {/* Name & Rank Header */}
      <div className="px-3.5 pt-3 pb-2 border-b border-white/6">
        <p className="text-white font-bold text-sm truncate leading-tight">{displayName}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-cyan-400 text-[10px] font-semibold">{rank}</span>
          <span className="text-white/20 text-[10px]">·</span>
          <span className="text-white/40 text-[10px]">Lvl {globalLevel}</span>
          <span className="text-white/20 text-[10px]">·</span>
          <span className="text-white/40 text-[10px] capitalize">{gender}</span>
        </div>
      </div>

      {/* Core Stats */}
      <div className="px-3.5 py-2 border-b border-white/6">
        <p className="text-white/25 text-[9px] font-bold uppercase tracking-widest mb-1">Attributes</p>
        <StatLine icon={<Heart className="w-3 h-3" />} label="HP" value={stats.hp} color="text-red-400" />
        <StatLine icon={<Swords className="w-3 h-3" />} label="Strength" value={stats.strength} color="text-orange-400" />
        <StatLine icon={<Brain className="w-3 h-3" />} label="Intelligence" value={stats.intelligence} color="text-blue-400" />
        <StatLine icon={<Shield className="w-3 h-3" />} label="Will" value={stats.will} color="text-purple-400" />
        <StatLine icon={<Flame className="w-3 h-3" />} label="Tenacity" value={stats.tenacity} color="text-yellow-400" />
      </div>

      {/* Scores */}
      <div className="px-3.5 py-2 border-b border-white/6">
        <p className="text-white/25 text-[9px] font-bold uppercase tracking-widest mb-1">Scores</p>
        <StatLine icon={<Trophy className="w-3 h-3" />} label="Gamer Score" value={gamerScore.toLocaleString()} color="text-amber-400" />
        <StatLine icon={<Zap className="w-3 h-3" />} label="AI Points" value={aiPoints.toLocaleString()} color="text-cyan-400" />
        <StatLine icon={<Star className="w-3 h-3" />} label="Influence" value={socialInfluence.toLocaleString()} color="text-pink-400" />
      </div>

      {/* Top Genre */}
      {topGenre && (
        <div className="px-3.5 py-2">
          <p className="text-white/25 text-[9px] font-bold uppercase tracking-widest mb-1">Top Genre</p>
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-[11px]">{topGenre.name}</span>
            <span className="text-cyan-300 text-[11px] font-bold">Lv. {topGenre.level || 1}</span>
          </div>
        </div>
      )}
    </div>
  );
}