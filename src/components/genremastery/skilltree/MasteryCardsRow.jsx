import React from 'react';

const RARITY = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];
const RARITY_COLOR = {
  Common: '#94a3b8',
  Rare: '#60a5fa',
  Epic: '#c084fc',
  Legendary: '#fbbf24',
  Mythic: '#f472b6',
};

export default function MasteryCardsRow({ genre }) {
  const cards = Array.from({ length: 20 }, (_, i) => {
    const rarity = RARITY[i % RARITY.length];
    return {
      id: i + 1,
      name: `${genre?.name || 'Genre'} Mastery Card ${i + 1}`,
      rarity,
      level: (i + 1) * 1,
      desc: `Exclusive reward for reaching level ${i + 1} of ${genre?.name || 'this genre'} mastery.`,
    };
  });

  return (
    <div className="mb-8">
      <div className="flex items-center gap-4 overflow-x-auto pb-2">
        {cards.map((card) => {
          const color = RARITY_COLOR[card.rarity];
          return (
            <div
              key={card.id}
              className="flex-shrink-0 w-44 rounded-xl overflow-hidden transition-all hover:-translate-y-1"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <div className="h-28 w-full bg-gradient-to-br from-slate-800/80 to-slate-950 flex items-end p-2">
                <span className="text-[9px] text-white/30 uppercase tracking-widest">{card.name}</span>
              </div>
              <div className="p-2.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span
                    className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                    style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
                  >
                    {card.rarity}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-white/5 text-white/50 border border-white/10">
                    Lvl {card.level}
                  </span>
                </div>
                <p className="text-white text-[11px] font-semibold leading-tight">{card.name}</p>
                <p className="text-white/35 text-[9px] mt-1 leading-snug">{card.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}