import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { INVENTORY } from '../../equipment/inventoryData';
import {
  subscribeEnchantments,
  getItemEnchantments,
  getCostForNextLevel,
  enchantSlot,
  MAX_ENCH_LEVEL,
  ENCH_SLOTS,
  MATERIALS,
  PER_LEVEL_BONUS,
} from '../../equipment/enchantmentStore';

const CHANNELS = ['I', 'II', 'III', 'IV'];

export default function SpiritForgeSubTab() {
  const allGear = useMemo(() => Object.entries(INVENTORY).flatMap(([category, items]) =>
    items.map((item) => ({ ...item, category }))), []);
  const [selectedId, setSelectedId] = useState(allGear[0]?.id || null);
  const [ench, setEnch] = useState({ enchantments: {}, materials: {} });

  useEffect(() => subscribeEnchantments(setEnch), []);

  const selected = allGear.find((item) => item.id === selectedId) || allGear[0];
  const levels = selected ? getItemEnchantments(selected.id) : new Array(ENCH_SLOTS).fill(0);
  const total = levels.reduce((sum, value) => sum + value, 0);

  const upgrade = (slot) => {
    if (!selected) return;
    const result = enchantSlot(selected.id, slot);
    if (!result.ok) {
      const text = result.reason === 'insufficient_materials'
        ? 'Not enough forge materials.'
        : result.reason === 'max_level'
          ? 'This channel is already maxed.'
          : 'Upgrade failed.';
      return toast.error(text);
    }
    toast.success(`${selected.name} · Channel ${CHANNELS[slot]} upgraded`, { icon: '⚒️' });
  };

  return (
    <div className="h-full overflow-hidden px-8 py-7 flex flex-col">
      <div className="flex items-start justify-between gap-8 shrink-0">
        <div className="max-w-3xl">
          <div className="text-[10px] tracking-[0.35em] uppercase text-orange-200/70">Remote Equipment Service</div>
          <h2 className="text-2xl text-white font-semibold mt-1">Spirit Forge</h2>
          <p className="text-xs text-white/55 mt-2 leading-relaxed">
            Your spirit carries upgrade materials and performs routine reinforcement wherever you are. The blacksmith can remain in towns for atmosphere, tutorials and special recipes, but normal gear improvement no longer breaks the combat loop.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 min-w-[360px]">
          {MATERIALS.map((mat) => (
            <div key={mat.id} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-center">
              <div className="text-lg tabular-nums" style={{ color: mat.color }}>{ench.materials?.[mat.id] || 0}</div>
              <div className="text-[8px] uppercase tracking-wider text-white/35 mt-0.5">{mat.name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-4 mt-6">
        <div className="w-72 shrink-0 rounded-xl border border-white/10 bg-black/15 p-2 overflow-y-auto">
          <div className="text-[9px] uppercase tracking-[0.22em] text-white/35 px-2 py-2">Equipment</div>
          {allGear.map((item) => {
            const active = item.id === selected?.id;
            const itemLevels = getItemEnchantments(item.id);
            const itemTotal = itemLevels.reduce((sum, value) => sum + value, 0);
            return (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 mb-1 text-left border transition-all ${
                  active ? 'border-orange-300/30 bg-orange-300/[0.07]' : 'border-transparent hover:border-white/10 hover:bg-white/[0.03]'
                }`}
              >
                <div className="w-8 h-8 rounded-md bg-white/[0.05] border border-white/10 flex items-center justify-center text-[10px] text-white/45 uppercase">
                  {item.category.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-white truncate">{item.name}</div>
                  <div className="text-[9px] text-white/35 mt-0.5">Forge +{itemTotal}{item.equipped ? ' · Equipped' : ''}</div>
                </div>
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="flex-1 min-w-0 overflow-y-auto rounded-xl border border-white/10 bg-black/15 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xl text-white font-semibold">{selected.name}</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/35 mt-1">{selected.type} · Total Forge +{total}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] uppercase tracking-widest text-white/35">Current Total Bonus</div>
                <div className="text-[11px] text-orange-100 mt-1">+{total * PER_LEVEL_BONUS.minAtk}–{total * PER_LEVEL_BONUS.maxAtk} ATK · +{total * PER_LEVEL_BONUS.crit}% Crit</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              {levels.map((level, index) => {
                const maxed = level >= MAX_ENCH_LEVEL;
                const cost = getCostForNextLevel(level);
                const affordable = Object.entries(cost).every(([key, value]) => (ench.materials?.[key] || 0) >= value);
                return (
                  <div key={index} className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[9px] uppercase tracking-[0.25em] text-orange-200/50">Forge Channel {CHANNELS[index]}</div>
                        <div className="text-2xl text-white font-light mt-1">+{level}</div>
                      </div>
                      <div className="text-[10px] text-white/35">Max +{MAX_ENCH_LEVEL}</div>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden mt-3">
                      <div className="h-full bg-orange-300/70" style={{ width: `${(level / MAX_ENCH_LEVEL) * 100}%` }} />
                    </div>
                    {!maxed && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-[9px] text-white/45">
                        {MATERIALS.map((mat) => (
                          <span key={mat.id}><span style={{ color: mat.color }}>●</span> {cost[mat.id] || 0}</span>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => upgrade(index)}
                      disabled={maxed || !affordable}
                      className="w-full mt-3 py-2 rounded-md border border-orange-300/25 bg-orange-300/[0.07] text-[9px] font-bold uppercase tracking-[0.16em] text-orange-100 disabled:opacity-25 disabled:cursor-not-allowed"
                    >
                      {maxed ? 'Maxed' : affordable ? 'Upgrade' : 'Need Materials'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-lg border border-sky-300/10 bg-sky-300/[0.03] px-4 py-3 text-[10px] text-white/45 leading-relaxed">
              This panel uses the game’s existing persistent enchant backend. TwelveSky2’s separate Refine system reached Stage 25; that historical mechanic can remain a distinct endgame layer rather than being falsely merged into these current enchant channels.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
