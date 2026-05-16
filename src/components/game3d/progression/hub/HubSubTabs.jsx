import React from 'react';

// Secondary tab strip under the main tabs (e.g. Halo / Title under Mastery).
export default function HubSubTabs({ tabs, activeId, onChange }) {
  return (
    <div className="flex items-center gap-6 px-6 py-3 border-b border-white/5">
      {tabs.map((t) => {
        const isActive = t.id === activeId;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="relative pb-1 transition-colors"
          >
            <span
              className="text-[10px] tracking-[0.3em] font-semibold uppercase"
              style={{ color: isActive ? '#e6e7eb' : 'rgba(255,255,255,0.4)' }}
            >
              {t.label}
            </span>
            {isActive && (
              <span
                className="absolute left-0 right-0 -bottom-px h-[2px]"
                style={{ background: 'linear-gradient(90deg, transparent, #6ec3ff, transparent)' }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}