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
  const sortedGenres = Array.isArray(progression?.genres)
    ? progression.genres.slice().sort((a, b) => (b.level ?? 1) - (a.level ?? 1))
    : [];
  const topGenres = sortedGenres.slice(0, 2);
  const otherGenres = sortedGenres.slice(2);

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
    <div className="relative group">
      {/* === OUTER FRAME — beveled console picture-frame === */}
      <div
        className="absolute -inset-[6px] rounded-[20px] pointer-events-none z-0"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 30%, rgba(0,0,0,0.15) 70%, rgba(255,255,255,0.08) 100%)',
          boxShadow: `
            inset 0 1px 0 rgba(255,255,255,0.15),
            inset 0 -1px 0 rgba(0,0,0,0.3),
            0 0 0 1px rgba(255,255,255,0.06),
            0 4px 20px rgba(0,0,0,0.4)
          `,
        }}
      />

      {/* === INNER BEVEL — the step-in ledge === */}
      <div
        className="absolute -inset-[3px] rounded-[17px] pointer-events-none z-[1]"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(15,20,25,0.6) 50%, rgba(255,255,255,0.04) 100%)',
          boxShadow: `
            inset 0 1px 0 rgba(255,255,255,0.10),
            inset 0 -1px 0 rgba(255,255,255,0.05),
            inset 1px 0 0 rgba(255,255,255,0.06),
            inset -1px 0 0 rgba(255,255,255,0.06)
          `,
        }}
      />

      {/* === CORNER ACCENTS — console rivets === */}
      {[
        'top-[-8px] left-[-8px]',
        'top-[-8px] right-[-8px]',
        'bottom-[-8px] left-[-8px]',
        'bottom-[-8px] right-[-8px]',
      ].map((pos, i) => (
        <div
          key={i}
          className={`absolute ${pos} w-[10px] h-[10px] rounded-full z-[3] pointer-events-none`}
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.04) 60%, transparent 100%)',
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.12), 0 1px 3px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        />
      ))}

      {/* === EDGE ACCENT LINES — top & bottom trim === */}
      <div
        className="absolute -top-[6px] left-[20px] right-[20px] h-[1px] z-[2] pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(120,180,255,0.15), rgba(120,180,255,0.25), rgba(120,180,255,0.15), transparent)' }}
      />
      <div
        className="absolute -bottom-[6px] left-[20px] right-[20px] h-[1px] z-[2] pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(120,180,255,0.10), rgba(120,180,255,0.18), rgba(120,180,255,0.10), transparent)' }}
      />

      {/* === MAIN CARD CONTENT === */}
      <div className="relative z-[2] rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)' }}>
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

        {otherGenres.length > 0 && (
          <div className="px-4 py-3 border-t border-white/10">
            <div className="text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-2">Other Genres</div>
            <div className="grid grid-cols-2 gap-y-1 gap-x-3">
              {otherGenres.map((g) => (
                <div key={g.name} className="flex items-center justify-between">
                  <span className="text-white/60 text-sm truncate">{g.name}</span>
                  <span className="text-white/90 font-semibold text-sm">Lv {g.level ?? 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}