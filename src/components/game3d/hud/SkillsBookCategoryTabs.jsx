import React from 'react';

// ─── Top-row category tabs for the Skills Book ────────────────────────────
// Five boxes laid out horizontally. Each has the category name above and
// an icon inside. Clicking selects the active category whose skills are
// displayed in the panel below.
export default function SkillsBookCategoryTabs({ categories, activeId, onSelect, countsById }) {
  return (
    <div className="flex items-stretch justify-center gap-3 px-4 pt-4 pb-3">
      {categories.map((cat) => {
        const isActive = activeId === cat.id;
        const count = countsById?.[cat.id] ?? 0;
        return (
          <div key={cat.id} className="flex flex-col items-center" style={{ width: 110 }}>
            {/* Label above box */}
            <div
              className="text-[9px] font-semibold tracking-[0.25em] uppercase mb-1.5 text-center"
              style={{ color: isActive ? cat.color : 'rgba(255,255,255,0.55)' }}
            >
              {cat.title}
            </div>

            {/* The box */}
            <button
              onClick={() => onSelect(cat.id)}
              className="relative w-full h-[72px] flex items-center justify-center transition-all hover:brightness-125 active:scale-95"
              style={{
                background: isActive
                  ? `linear-gradient(180deg, ${cat.color}28 0%, ${cat.color}12 100%)`
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isActive ? cat.color : 'rgba(255,216,107,0.20)'}`,
                borderRadius: 3,
                boxShadow: isActive
                  ? `0 0 14px ${cat.color}55, inset 0 0 14px ${cat.color}22`
                  : 'inset 0 0 12px rgba(0,0,0,0.35)',
              }}
            >
              {/* Engraved corner ticks */}
              {[
                { top: 2, left: 2, borderTop: `1px solid ${isActive ? cat.color : 'rgba(255,216,107,0.45)'}`, borderLeft: `1px solid ${isActive ? cat.color : 'rgba(255,216,107,0.45)'}` },
                { top: 2, right: 2, borderTop: `1px solid ${isActive ? cat.color : 'rgba(255,216,107,0.45)'}`, borderRight: `1px solid ${isActive ? cat.color : 'rgba(255,216,107,0.45)'}` },
                { bottom: 2, left: 2, borderBottom: `1px solid ${isActive ? cat.color : 'rgba(255,216,107,0.45)'}`, borderLeft: `1px solid ${isActive ? cat.color : 'rgba(255,216,107,0.45)'}` },
                { bottom: 2, right: 2, borderBottom: `1px solid ${isActive ? cat.color : 'rgba(255,216,107,0.45)'}`, borderRight: `1px solid ${isActive ? cat.color : 'rgba(255,216,107,0.45)'}` },
              ].map((s, i) => (
                <div key={i} className="absolute w-2 h-2 pointer-events-none" style={s} />
              ))}

              {/* Icon */}
              <span
                className="text-3xl"
                style={{
                  filter: isActive
                    ? `drop-shadow(0 0 8px ${cat.color})`
                    : 'drop-shadow(0 0 4px rgba(0,0,0,0.6))',
                  opacity: isActive ? 1 : 0.75,
                }}
              >
                {cat.emoji}
              </span>

              {/* Count badge */}
              {count > 0 && (
                <span
                  className="absolute top-1 right-1 text-[8px] font-semibold tabular-nums px-1.5 py-[1px]"
                  style={{
                    color: cat.color,
                    background: 'rgba(0,0,0,0.55)',
                    border: `1px solid ${cat.color}80`,
                    borderRadius: 2,
                    minWidth: 16,
                    textAlign: 'center',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}