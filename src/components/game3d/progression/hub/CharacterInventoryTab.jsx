import React, { useEffect, useMemo, useState } from 'react';
import {
  Backpack,
  Check,
  Lock,
  Shield,
  Sparkles,
  Swords,
  Unlock,
} from 'lucide-react';
import {
  equipAXEInventoryItem,
  getActiveEquippedAXEWeapon,
  getAllAXEEquipmentItems,
  setActiveAXEWeapon,
  setAXEInventoryItemLocked,
  subscribeAXEEquipmentInventory,
  unequipAXEInventoryItem,
} from '../../axe/equipment/AXEEquipmentInventoryStore';
import {
  getItemEnchantments,
  getItemOverEnchant,
  getItemReinforcement,
  subscribeEnchantments,
} from '../../equipment/enchantmentStore';
import {
  getAXEAdvancementState,
  subscribeAXEItemAdvancement,
} from '../../axe/equipment/AXEItemAdvancementStore';
import {
  getAXESocketState,
  subscribeAXESockets,
} from '../../axe/equipment/AXESocketGemStore';
import {
  getAXEItemAura,
  subscribeAXEAura,
} from '../../axe/equipment/AXEEquipmentAuraStore';

const FILTERS = [
  { id: 'all', label: 'All Gear' },
  { id: 'weapon', label: 'Weapons' },
  { id: 'armor', label: 'Armor' },
  { id: 'jewelry', label: 'Jewelry' },
  { id: 'prestige', label: 'Prestige' },
  { id: 'auxiliary', label: 'Auxiliary' },
];

const ARMOR = new Set(['helm', 'chest', 'gloves', 'legs', 'boots']);
const JEWELRY = new Set(['ring', 'necklace', 'accessory', 'trinket']);
const PRESTIGE = new Set(['cape', 'wings', 'costume']);

function matches(item, filter) {
  const slot = item.slot || item.category;
  if (filter === 'all') return true;
  if (filter === 'weapon') return slot === 'weapon';
  if (filter === 'armor') return ARMOR.has(slot);
  if (filter === 'jewelry') return JEWELRY.has(slot);
  if (filter === 'prestige') return PRESTIGE.has(slot);
  if (filter === 'auxiliary') return slot === 'auxiliary';
  return true;
}

function statsText(item) {
  const stats = { ...(item.baseStats || {}), ...(item.rolledStats || {}) };
  const parts = Object.entries(stats)
    .filter(([, value]) => Number(value))
    .slice(0, 5)
    .map(([key, value]) => `${key.replaceAll('_', ' ')} +${value}`);
  return parts.length ? parts.join(' · ') : 'No base stat metadata';
}

export default function CharacterInventoryTab({ onOpenService }) {
  const [snapshot, setSnapshot] = useState(() => ({
    items: getAllAXEEquipmentItems(),
    activeWeaponInstanceId: getActiveEquippedAXEWeapon()?.instanceId || null,
  }));
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(
    () => getActiveEquippedAXEWeapon()?.instanceId || getAllAXEEquipmentItems()[0]?.instanceId || null,
  );
  const [lastResult, setLastResult] = useState(null);
  const [, setVersion] = useState(0);

  useEffect(() => subscribeAXEEquipmentInventory(setSnapshot), []);
  useEffect(() => subscribeEnchantments(() => setVersion((v) => v + 1)), []);
  useEffect(() => subscribeAXEItemAdvancement(() => setVersion((v) => v + 1)), []);
  useEffect(() => subscribeAXESockets(() => setVersion((v) => v + 1)), []);
  useEffect(() => subscribeAXEAura(() => setVersion((v) => v + 1)), []);

  const items = snapshot.items || [];
  const filtered = useMemo(() => items.filter((item) => matches(item, filter)), [items, filter]);

  useEffect(() => {
    if (!items.length) {
      setSelectedId(null);
      return;
    }
    if (!items.some((item) => item.instanceId === selectedId)) {
      setSelectedId(items[0].instanceId);
    }
  }, [items, selectedId]);

  const selected = items.find((item) => item.instanceId === selectedId) || items[0] || null;
  const activeWeapon = getActiveEquippedAXEWeapon();

  if (!selected) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-white/40">
        No equipment owned yet.
      </div>
    );
  }

  const reinforcement = getItemReinforcement(selected.instanceId);
  const enchantments = getItemEnchantments(selected.instanceId);
  const overEnchant = getItemOverEnchant(selected.instanceId);
  const advancement = getAXEAdvancementState(selected.instanceId);
  const sockets = getAXESocketState(selected.instanceId);
  const aura = getAXEItemAura(selected.instanceId);

  const run = (fn) => {
    const result = fn();
    setLastResult(result);
    return result;
  };

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(300px,36%)_1fr] overflow-hidden">
      <aside className="min-h-0 overflow-y-auto border-r border-white/10 bg-black/[0.08] p-5">
        <div className="flex items-center gap-3">
          <Backpack className="h-5 w-5 text-white/55" />
          <div>
            <div className="text-[9px] uppercase tracking-[0.34em] text-white/35">Character Inventory</div>
            <div className="text-lg font-semibold text-white/85">{items.length} Owned Items</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {FILTERS.map((entry) => (
            <button
              key={entry.id}
              onClick={() => setFilter(entry.id)}
              className={`rounded-lg border px-2.5 py-1.5 text-[9px] uppercase tracking-wider ${
                filter === entry.id
                  ? 'border-white/25 bg-white/[0.10] text-white'
                  : 'border-white/8 bg-white/[0.025] text-white/35 hover:text-white/60'
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {filtered.map((item) => {
            const isActiveWeapon = item.slot === 'weapon' && activeWeapon?.instanceId === item.instanceId;
            return (
              <button
                key={item.instanceId}
                onClick={() => setSelectedId(item.instanceId)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  selected.instanceId === item.instanceId
                    ? 'border-white/30 bg-white/[0.11]'
                    : 'border-white/8 bg-black/[0.08] hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                    {item.slot === 'weapon'
                      ? <Swords className="h-4 w-4 text-white/55" />
                      : <Shield className="h-4 w-4 text-white/55" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-white/85">{item.name}</div>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-[8px] uppercase tracking-wider">
                      <span className="text-white/35">{item.slot || item.category}</span>
                      <span className="text-white/20">·</span>
                      <span className="text-white/50">{item.rarity || 'common'}</span>
                      {item.equipped && <span className="text-emerald-200/70">Equipped</span>}
                      {isActiveWeapon && <span className="text-sky-200/80">Active</span>}
                      {item.locked && <span className="text-amber-200/70">Locked</span>}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="min-h-0 overflow-y-auto p-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-[9px] uppercase tracking-[0.34em] text-white/35">Selected Equipment</div>
              <h2 className="mt-1 text-2xl font-semibold text-white/90">{selected.name}</h2>
              <div className="mt-1 text-xs capitalize text-white/40">
                {selected.rarity || 'common'} · {selected.slot || selected.category} · Item Lv {selected.itemLevel || 1}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => run(() => selected.equipped
                  ? unequipAXEInventoryItem(selected.instanceId)
                  : equipAXEInventoryItem(selected.instanceId))}
                className="rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-white/75 hover:bg-white/[0.10]"
              >
                {selected.equipped ? 'Unequip' : 'Equip'}
              </button>
              {selected.slot === 'weapon' && selected.equipped && activeWeapon?.instanceId !== selected.instanceId && (
                <button
                  onClick={() => run(() => setActiveAXEWeapon(selected.instanceId))}
                  className="rounded-xl border border-sky-200/20 bg-sky-200/[0.07] px-4 py-2 text-xs font-semibold text-sky-100"
                >
                  Make Active Weapon
                </button>
              )}
              <button
                onClick={() => run(() => setAXEInventoryItemLocked(selected.instanceId, !selected.locked))}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/[0.10] px-4 py-2 text-xs text-white/55"
              >
                {selected.locked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                {selected.locked ? 'Unlock' : 'Lock'}
              </button>
            </div>
          </div>

          {lastResult && (
            <div className={`mt-4 rounded-xl border px-4 py-3 text-xs ${
              lastResult.ok
                ? 'border-emerald-300/15 bg-emerald-300/[0.04] text-emerald-100/75'
                : 'border-rose-300/15 bg-rose-300/[0.04] text-rose-100/75'
            }`}>
              {lastResult.ok ? 'Equipment state updated.' : String(lastResult.reason || 'Action failed').replaceAll('_', ' ')}
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <div className="text-[9px] uppercase tracking-[0.26em] text-white/30">Base + Rolled Stats</div>
            <div className="mt-2 text-sm leading-6 text-white/65">{statsText(selected)}</div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
            <Info label="Reinforcement" value={`${reinforcement.percent || 0}%`} />
            <Info label="Enchant" value={`+${enchantments.reduce((sum, v) => sum + Number(v || 0), 0)}`} />
            <Info label="Over-Enchant" value={`+${overEnchant.level || 0}`} />
            <Info label="Stage" value={advancement.stage?.label || 'Base'} />
            <Info label="Refine" value={`+${advancement.refine?.level || 0}`} />
            <Info label="Ultimate" value={`+${advancement.ultimate?.level || 0}`} />
            <Info label="Sockets" value={`${sockets.sockets?.length || 0}/${sockets.maxSockets || 0}`} />
            <Info label="Aura" value={aura ? `Tier ${aura.tierRank || 1}` : 'None'} />
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-white/50" />
              <div>
                <div className="text-[9px] uppercase tracking-[0.30em] text-white/35">Improve This Exact Item</div>
                <div className="text-sm font-semibold text-white/80">Open Services with this item selected</div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
              {[
                ['reinforcement', 'Reinforce'],
                ['enchant', 'Enchant'],
                ['over_enchant', 'Over-Enchant'],
                ['combine', 'Combine'],
                ['stage', 'Stage'],
                ['refine', 'Refine'],
                ['ultimate', 'Ultimate'],
                ['sockets', 'Sockets / Gems'],
                ['equipment_aura', 'Equipment Aura'],
              ].map(([serviceId, label]) => (
                <button
                  key={serviceId}
                  onClick={() => onOpenService?.(serviceId, selected.instanceId)}
                  className="rounded-xl border border-white/12 bg-white/[0.04] px-3 py-3 text-left text-xs font-semibold text-white/65 transition hover:bg-white/[0.09] hover:text-white"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-white/8 bg-black/[0.10] p-4 text-xs leading-5 text-white/35">
            Inventory is the ownership source. Equip state drives combat stats; the active weapon drives Weapon Mastery, skill compatibility and Advanced Classes; Services mutate this same item instance.
          </div>
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-[8px] uppercase tracking-widest text-white/30">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white/80">{value}</div>
    </div>
  );
}
