import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Check } from 'lucide-react';

export default function AIAttributesBox() {
  const { data: user, isLoading: loadingUser } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: progression } = useQuery({
    queryKey: ['avatar-progression', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const recs = await base44.entities.AvatarProgression.filter({ user_id: user.id });
      return recs?.[0] || null;
    },
  });

  const stats = progression?.stats || {};
  const topGenres = Array.isArray(progression?.genres)
    ? progression.genres.slice().sort((a, b) => (b.level ?? 1) - (a.level ?? 1)).slice(0, 2)
    : [];

  const rows = [
    { label: 'Global Level', value: progression?.global_level },
    { label: 'Global XP', value: progression?.global_xp },
    { label: 'Available Points', value: progression?.available_stat_points },
    { label: 'HP', value: stats.hp },
    { label: 'Strength', value: stats.strength },
    { label: 'Intelligence', value: stats.intelligence },
    { label: 'Willpower', value: stats.will },
    { label: 'Tenacity', value: stats.tenacity },
  ];

  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <p className="text-[11px] font-semibold text-white/80 tracking-wider uppercase">AI Attribute Box</p>
        </div>
        <Check className="w-3.5 h-3.5 text-white/40" />
      </div>
      <div className="divide-y divide-white/5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between px-4 py-2.5">
            <span className="text-white/70 text-sm">{r.label}</span>
            <span className="text-white font-semibold text-sm">{r.value ?? '—'}</span>
          </div>
        ))}
      </div>

      {topGenres.length > 0 && (
        <div className="px-4 py-3 border-t border-white/10">
          <div className="text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-2">Top Genres</div>
          <div className="space-y-1">
            {topGenres.map((g) => (
              <div key={g.name} className="flex items-center justify-between">
                <span className="text-white/70 text-sm">{g.name}</span>
                <span className="text-white font-semibold text-sm">Lv {g.level ?? 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}