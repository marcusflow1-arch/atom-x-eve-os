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
    <div className="relative group" style={{ margin: '14px' }}>

      {/* ========= LAYER 1: OUTERMOST DROP SHADOW HALO ========= */}
      <div
        className="absolute -inset-[12px] rounded-[26px] pointer-events-none z-0"
        style={{
          background: 'transparent',
          boxShadow: `
            0 0 40px rgba(80, 140, 255, 0.06),
            0 0 80px rgba(80, 140, 255, 0.03),
            0 8px 32px rgba(0, 0, 0, 0.5)
          `,
        }}
      />

      {/* ========= LAYER 2: OUTER RIDGE — the wide console bezel ========= */}
      <div
        className="absolute -inset-[10px] rounded-[24px] pointer-events-none z-[1]"
        style={{
          background: `
            linear-gradient(170deg, 
              rgba(255,255,255,0.14) 0%, 
              rgba(140,160,200,0.08) 15%,
              rgba(20,25,35,0.7) 40%, 
              rgba(10,14,20,0.85) 60%,
              rgba(140,160,200,0.06) 85%,
              rgba(255,255,255,0.10) 100%
            )
          `,
          boxShadow: `
            inset 0 2px 0 rgba(255,255,255,0.12),
            inset 0 -2px 0 rgba(0,0,0,0.4),
            inset 2px 0 0 rgba(255,255,255,0.06),
            inset -2px 0 0 rgba(255,255,255,0.06),
            0 0 0 1px rgba(255,255,255,0.05)
          `,
        }}
      />

      {/* ========= LAYER 3: ENGRAVED CHANNEL — inset groove between outer & inner ========= */}
      <div
        className="absolute -inset-[7px] rounded-[21px] pointer-events-none z-[2]"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(10,14,22,0.5) 50%, rgba(0,0,0,0.2) 100%)',
          boxShadow: `
            inset 0 1px 3px rgba(0,0,0,0.6),
            inset 0 -1px 2px rgba(255,255,255,0.06),
            0 0 0 1px rgba(255,255,255,0.04)
          `,
        }}
      />

      {/* ========= LAYER 4: INNER BEVEL — raised lip before content ========= */}
      <div
        className="absolute -inset-[4px] rounded-[18px] pointer-events-none z-[3]"
        style={{
          background: `
            linear-gradient(170deg,
              rgba(255,255,255,0.10) 0%,
              rgba(60,80,120,0.08) 20%,
              rgba(15,20,30,0.5) 50%,
              rgba(60,80,120,0.06) 80%,
              rgba(255,255,255,0.07) 100%
            )
          `,
          boxShadow: `
            inset 0 1px 0 rgba(255,255,255,0.14),
            inset 0 -1px 0 rgba(0,0,0,0.3),
            inset 1px 0 0 rgba(255,255,255,0.08),
            inset -1px 0 0 rgba(255,255,255,0.08)
          `,
        }}
      />

      {/* ========= CORNER BRACKETS — L-shaped decorative corners ========= */}
      {[
        { top: '-12px', left: '-12px', borderW: '2px 0 0 2px', radius: '6px 0 0 0' },
        { top: '-12px', right: '-12px', borderW: '2px 2px 0 0', radius: '0 6px 0 0' },
        { bottom: '-12px', left: '-12px', borderW: '0 0 2px 2px', radius: '0 0 0 6px' },
        { bottom: '-12px', right: '-12px', borderW: '0 2px 2px 0', radius: '0 0 6px 0' },
      ].map((corner, i) => (
        <div
          key={`bracket-${i}`}
          className="absolute w-[18px] h-[18px] pointer-events-none z-[5]"
          style={{
            ...corner,
            borderWidth: corner.borderW,
            borderStyle: 'solid',
            borderColor: 'rgba(120, 170, 255, 0.25)',
            borderRadius: corner.radius,
            filter: 'drop-shadow(0 0 3px rgba(100, 160, 255, 0.15))',
          }}
        />
      ))}

      {/* ========= CORNER DOTS — jewel rivets at each bracket ========= */}
      {[
        'top-[-14px] left-[-14px]',
        'top-[-14px] right-[-14px]',
        'bottom-[-14px] left-[-14px]',
        'bottom-[-14px] right-[-14px]',
      ].map((pos, i) => (
        <div
          key={`rivet-${i}`}
          className={`absolute ${pos} w-[6px] h-[6px] rounded-full z-[6] pointer-events-none`}
          style={{
            background: 'radial-gradient(circle, rgba(130,180,255,0.5) 0%, rgba(130,180,255,0.15) 50%, transparent 100%)',
            boxShadow: '0 0 6px rgba(100,160,255,0.3), inset 0 0.5px 1px rgba(255,255,255,0.3)',
          }}
        />
      ))}

      {/* ========= SIDE NOTCHES — horizontal accent cuts on left & right ========= */}
      {['left', 'right'].map((side) => (
        <React.Fragment key={side}>
          {[30, 55, 80].map((pct) => (
            <div
              key={`${side}-notch-${pct}`}
              className="absolute pointer-events-none z-[4]"
              style={{
                top: `${pct}%`,
                [side]: '-11px',
                width: '5px',
                height: '1px',
                background: 'linear-gradient(90deg, rgba(120,170,255,0.0), rgba(120,170,255,0.2), rgba(120,170,255,0.0))',
              }}
            />
          ))}
        </React.Fragment>
      ))}

      {/* ========= TOP TRIM — glowing engraved line ========= */}
      <div
        className="absolute -top-[10px] left-[28px] right-[28px] h-[1px] z-[4] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(100,160,255,0.08) 15%, rgba(100,170,255,0.3) 50%, rgba(100,160,255,0.08) 85%, transparent 100%)',
          boxShadow: '0 0 6px rgba(100,160,255,0.12)',
        }}
      />
      {/* Top secondary accent */}
      <div
        className="absolute -top-[8px] left-[40px] right-[40px] h-[1px] z-[4] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), rgba(255,255,255,0.12), rgba(255,255,255,0.06), transparent)',
        }}
      />

      {/* ========= BOTTOM TRIM — dual glow lines ========= */}
      <div
        className="absolute -bottom-[10px] left-[28px] right-[28px] h-[1px] z-[4] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(100,160,255,0.06) 15%, rgba(100,170,255,0.22) 50%, rgba(100,160,255,0.06) 85%, transparent 100%)',
          boxShadow: '0 0 4px rgba(100,160,255,0.08)',
        }}
      />
      <div
        className="absolute -bottom-[8px] left-[40px] right-[40px] h-[1px] z-[4] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), rgba(255,255,255,0.09), rgba(255,255,255,0.04), transparent)',
        }}
      />

      {/* ========= TOP CENTER BADGE — small decorative diamond ========= */}
      <div
        className="absolute -top-[14px] left-1/2 -translate-x-1/2 z-[6] pointer-events-none"
        style={{
          width: '8px',
          height: '8px',
          transform: 'translateX(-50%) rotate(45deg)',
          background: 'linear-gradient(135deg, rgba(130,180,255,0.35), rgba(80,120,200,0.15))',
          border: '1px solid rgba(130,180,255,0.25)',
          boxShadow: '0 0 8px rgba(100,160,255,0.2), inset 0 0.5px 1px rgba(255,255,255,0.2)',
        }}
      />

      {/* ========= MAIN CARD CONTENT ========= */}
      <div className="relative z-[5] rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)' }}>
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