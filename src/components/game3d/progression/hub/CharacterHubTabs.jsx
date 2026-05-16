import React from 'react';

// Top-level tab bar — matches the engraved-gold MMORPG header look.
export default function CharacterHubTabs({ tabs, activeId, onChange }) {
  return (
    <div className="flex items-center justify-center gap-10 px-6 pt-2 pb-3 border-b border-yellow-500/15">
      {tabs.map((t) => {
        const isActive = t.id === activeId;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="relative group flex flex-col items-center"
          >
            <span
              className="text-[11px] tracking-[0.35em] font-semibold uppercase transition-colors"
              style={{
                color: isActive ? '#ffd86b' : 'rgba(255,255,255,0.45)',
                textShadow: isActive ? '0 0 12px rgba(255,216,107,0.55)' : 'none',
              }}
            >
              {t.label}
            </span>
            {isActive && (
              <span
                className="absolute -bottom-[14px] w-2 h-2 rotate-45"
                style={{
                  background: '#ffd86b',
                  boxShadow: '0 0 12px rgba(255,216,107,0.85)',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}