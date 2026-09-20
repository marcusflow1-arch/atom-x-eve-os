import React, { useEffect, useState } from 'react';
import {
  equipAXECostume,
  getAXECostumeState,
  setAXECostumeHidden,
  subscribeAXECostumes,
  toggleAXECostumeFavorite,
  unequipAXECostume,
} from '../../axe/progression/AXECostumeStore';
import {
  AXE_COSTUME_DEFINITIONS,
  getAXECostumeBonuses,
} from '../../axe/progression/AXECostumeSystem';

const bonusText = (id) => {
  const entries = Object.entries(getAXECostumeBonuses(id));
  return entries.length
    ? entries.map(([k, v]) => `${k} +${v}`).join(' · ')
    : 'Cosmetic only';
};

export default function CostumeSubTab() {
  const [state, setState] = useState(getAXECostumeState());
  useEffect(() => subscribeAXECostumes(setState), []);

  return (
    <div className="h-full overflow-y-auto px-8 py-6 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-end justify-between border-b border-white/10 pb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-fuchsia-200/70">Wardrobe</div>
            <h2 className="mt-1 text-2xl font-semibold">Costume Overlay</h2>
            <p className="mt-1 text-sm text-white/45">Appearance stays separate from combat gear. Stat-bearing costumes show their bonuses explicitly.</p>
          </div>
          <button
            onClick={() => setAXECostumeHidden(!state.hidden)}
            className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-white/70"
          >
            {state.hidden ? 'Show Costume' : 'Hide Costume'}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          {state.owned.map((id) => {
            const def = AXE_COSTUME_DEFINITIONS[id];
            if (!def) return null;
            const equipped = state.equippedCostumeId === id;
            const favorite = state.favorites.includes(id);
            return (
              <div key={id} className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 backdrop-blur-md">
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-white/35">{def.rarity} · {def.source}</div>
                    <div className="mt-1 text-lg font-semibold">{def.name}</div>
                    <div className="mt-2 text-xs text-emerald-200/75">{bonusText(id)}</div>
                  </div>
                  <button
                    onClick={() => toggleAXECostumeFavorite(id)}
                    className="h-8 rounded-lg bg-white/[0.06] px-2 text-xs text-amber-200/80"
                  >
                    {favorite ? '★' : '☆'}
                  </button>
                </div>
                <button
                  onClick={() => equipped ? unequipAXECostume() : equipAXECostume(id)}
                  className={`mt-4 w-full rounded-lg px-3 py-2 text-xs font-semibold ${
                    equipped ? 'bg-fuchsia-300/20 text-fuchsia-100' : 'bg-white/10 text-white/70'
                  }`}
                >
                  {equipped ? 'Equipped — Remove' : 'Equip Costume'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
