import React from 'react';

// Platinum / liquid-glass top navigation used by the full-screen C Character Hub.
export default function CharacterHubTabs({ tabs, activeId, onChange }) {
  return (
    <div className="flex items-center justify-center gap-8 px-6 pb-3 pt-2">
      {tabs.map((t) => {
        const isActive = t.id === activeId;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="group relative flex min-w-[132px] flex-col items-center px-3 py-1.5"
          >
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.32em] transition-all"
              style={{
                color: isActive ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.42)',
                textShadow: isActive ? '0 0 18px rgba(255,255,255,0.32)' : 'none',
              }}
            >
              {t.label}
            </span>

            <span
              className="absolute -bottom-[7px] left-1/2 h-px -translate-x-1/2 transition-all"
              style={{
                width: isActive ? '82%' : '0%',
                background:
                  'linear-gradient(90deg, transparent, rgba(255,255,255,0.75), transparent)',
                boxShadow: isActive ? '0 0 12px rgba(255,255,255,0.28)' : 'none',
              }}
            />

            {isActive && (
              <span
                className="absolute -bottom-[11px] h-2.5 w-2.5 rotate-45 border border-white/35 bg-white/15"
                style={{
                  boxShadow:
                    '0 0 14px rgba(255,255,255,0.26), inset 0 1px 0 rgba(255,255,255,0.32)',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
