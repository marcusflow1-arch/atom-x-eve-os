import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { subscribeContribution, spendContributionPoints } from '../contributionStore';
import { grantElixir } from '../elixirStore';
import { addLootToInventory } from '../../lootStore';

// Atom X Eve prices are intentionally centralized here as balance values.
// The product types mirror the old CP use case: tickets, materials, elixirs,
// and rare progression items, but no town NPC is required.
const CP_ITEMS = [
  { id: 'refining_stone', name: 'Refining Stone', icon: '💠', cost: 25, rarity: 'rare', desc: 'Core Spirit Forge material.', kind: 'loot' },
  { id: 'fortress_ticket_s', name: 'Fortress Pass (S)', icon: '🎟️', cost: 40, rarity: 'epic', desc: 'Short-duration fortress access ticket.', kind: 'loot' },
  { id: 'fortress_ticket_l', name: 'Fortress Pass (L)', icon: '🎫', cost: 90, rarity: 'epic', desc: 'Long-duration fortress access ticket.', kind: 'loot' },
  { id: 'rare_equipment_cache', name: 'Rare Equipment Cache', icon: '📦', cost: 150, rarity: 'legendary', desc: 'Drops a rare-equipment reward token into inventory.', kind: 'loot' },
  { id: 'vit_elixir_bundle', name: 'VIT Elixir ×10', icon: '❤️', cost: 75, rarity: 'rare', desc: 'Banks 10 permanent VIT elixirs.', kind: 'elixir', elixirType: 'vit', amount: 10 },
  { id: 'str_elixir_bundle', name: 'STR Elixir ×10', icon: '⚔️', cost: 75, rarity: 'rare', desc: 'Banks 10 permanent STR elixirs.', kind: 'elixir', elixirType: 'str', amount: 10 },
];

export default function ContributionShopSubTab() {
  const [cp, setCp] = useState({ cp: 0, lifetimeEarned: 0, lifetimeSpent: 0 });
  useEffect(() => subscribeContribution(setCp), []);

  const buy = (item) => {
    const paid = spendContributionPoints(item.cost, `cp_shop:${item.id}`);
    if (!paid.ok) {
      toast.error(paid.reason);
      return;
    }

    if (item.kind === 'elixir') {
      grantElixir(item.elixirType, item.amount);
    } else {
      addLootToInventory({
        id: item.id,
        name: item.name,
        category: 'material',
        rarity: item.rarity,
        icon: item.icon,
        dropId: `cp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      });
    }
    toast.success(`${item.name} acquired`, { icon: item.icon });
  };

  return (
    <div className="h-full overflow-y-auto px-8 py-7">
      <div className="flex items-start justify-between gap-6">
        <div className="max-w-2xl">
          <div className="text-[10px] tracking-[0.35em] uppercase text-amber-200/70">Contribution Exchange</div>
          <h2 className="text-2xl text-white font-semibold mt-1">Spirit CP Shop</h2>
          <p className="text-xs text-white/55 mt-2 leading-relaxed">
            Tickets, materials, elixirs and rare reward tokens are exchanged through your bound spirit. This preserves CP as a meaningful combat currency while removing the trip back to a contribution NPC.
          </p>
        </div>
        <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.05] px-5 py-3 min-w-[210px]">
          <div className="text-[9px] tracking-[0.25em] uppercase text-white/40">Available</div>
          <div className="text-3xl text-amber-200 font-light tabular-nums mt-1">{cp.cp.toLocaleString()} <span className="text-sm">CP</span></div>
          <div className="text-[9px] text-white/35 mt-1">Earned {cp.lifetimeEarned.toLocaleString()} · Spent {cp.lifetimeSpent.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 mt-7">
        {CP_ITEMS.map((item) => {
          const affordable = cp.cp >= item.cost;
          return (
            <div key={item.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg border border-white/10 bg-white/[0.04] flex items-center justify-center text-2xl">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-semibold">{item.name}</div>
                  <div className="text-[10px] text-white/45 mt-1 leading-relaxed">{item.desc}</div>
                </div>
              </div>
              <button
                onClick={() => buy(item)}
                disabled={!affordable}
                className="w-full mt-4 py-2.5 rounded-md border border-amber-300/25 bg-amber-300/[0.07] text-[10px] font-bold tracking-[0.2em] uppercase text-amber-100 disabled:opacity-25 disabled:cursor-not-allowed hover:bg-amber-300/[0.12] transition-all"
              >
                Exchange · {item.cost} CP
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-5 text-[10px] text-white/35">
        CP prices are Atom X Eve balance values and can be tuned independently from the historical reference systems.
      </div>
    </div>
  );
}
