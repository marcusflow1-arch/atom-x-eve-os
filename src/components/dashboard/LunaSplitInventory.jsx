import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Gem, Layers3, Package, Search, Shield, Sparkles, Sword } from 'lucide-react';

const FILTERS = [
  { id: 'all', label: 'All', icon: Package },
  { id: 'weapon', label: 'Weapons', icon: Sword },
  { id: 'armor', label: 'Armor', icon: Shield },
  { id: 'artifact', label: 'Artifacts', icon: Gem },
  { id: 'aspect', label: 'Aspects', icon: Sparkles },
];

const rarityClass = {
  Mythic: 'border-red-300/25 text-red-200/80',
  Mythical: 'border-red-300/25 text-red-200/80',
  Legendary: 'border-amber-300/25 text-amber-100/80',
  Epic: 'border-violet-300/25 text-violet-100/80',
  Rare: 'border-cyan-300/25 text-cyan-100/80',
  Uncommon: 'border-emerald-300/20 text-emerald-100/75',
  Common: 'border-white/10 text-white/45',
};

const typeOf = (item) => String(item?.type || '').toLowerCase();
const itemIdOf = (item) => item?.id || item?.itemId || item?.name;

export default function LunaSplitInventory({ inventory = [], selectedSlotId = null, onEquip }) {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState(null);

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (inventory || []).filter((item) => {
      const type = typeOf(item);
      if (filter !== 'all' && type !== filter) return false;
      if (!needle) return true;
      return [
        item?.name,
        item?.game,
        item?.genre,
        item?.rarity,
        item?.subtype,
        ...(item?.genreCompatibility || []),
      ].filter(Boolean).join(' ').toLowerCase().includes(needle);
    });
  }, [inventory, filter, query]);

  useEffect(() => {
    if (!filteredItems.length) {
      setSelectedItemId(null);
      return;
    }
    if (!filteredItems.some((item) => itemIdOf(item) === selectedItemId)) {
      setSelectedItemId(itemIdOf(filteredItems[0]));
    }
  }, [filteredItems, selectedItemId]);

  const selectedItem = filteredItems.find((item) => itemIdOf(item) === selectedItemId) || null;

  const equippedTargetLabel = selectedSlotId
    ? selectedSlotId.replace('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
    : 'Choose a loadout slot';

  return (
    <div className="h-full w-full overflow-hidden p-5">
      <div
        className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[26px] border border-white/[0.09]"
        style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.072), rgba(86,116,145,0.045) 44%, rgba(255,255,255,0.025))',
          backdropFilter: 'blur(34px) saturate(155%)',
          WebkitBackdropFilter: 'blur(34px) saturate(155%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08), inset 0 -1px 0 rgba(255,255,255,.025), 0 22px 70px rgba(0,0,0,.24)',
        }}
      >
        <div className="pointer-events-none absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        <div className="pointer-events-none absolute -left-16 top-8 h-40 w-40 rounded-full bg-cyan-200/[0.035] blur-3xl" />
        <div className="pointer-events-none absolute -right-12 bottom-8 h-48 w-48 rounded-full bg-blue-300/[0.03] blur-3xl" />

        <header className="relative z-10 flex items-start justify-between gap-4 border-b border-white/[0.055] px-5 pb-4 pt-5">
          <div>
            <div className="flex items-center gap-2">
              <Layers3 className="h-3.5 w-3.5 text-cyan-100/55" />
              <span className="text-[8px] font-black uppercase tracking-[0.24em] text-cyan-100/38">Inventory</span>
            </div>
            <h2 className="mt-1 text-[17px] font-semibold tracking-tight text-white/90">Collection</h2>
            <p className="mt-1 text-[10px] text-white/28">{inventory.length} owned items · select a slot on the left, then equip here</p>
          </div>

          <div className="rounded-full border border-white/[0.08] bg-black/20 px-3 py-1.5 text-right">
            <p className="text-[7px] font-black uppercase tracking-[0.18em] text-white/25">Target Slot</p>
            <p className={`mt-0.5 max-w-32 truncate text-[9px] font-semibold ${selectedSlotId ? 'text-cyan-100/75' : 'text-white/35'}`}>{equippedTargetLabel}</p>
          </div>
        </header>

        <div className="relative z-10 flex items-center gap-2 px-5 py-3">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search inventory"
              className="h-9 w-full rounded-xl border border-white/[0.07] bg-black/15 pl-9 pr-3 text-[10px] text-white/80 outline-none placeholder:text-white/22 focus:border-cyan-200/20 focus:bg-black/20"
            />
          </div>
          <div className="flex gap-1">
            {FILTERS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                title={label}
                onClick={() => setFilter(id)}
                className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${filter === id
                  ? 'border-cyan-200/20 bg-cyan-200/[0.09] text-cyan-100/80'
                  : 'border-white/[0.055] bg-white/[0.025] text-white/30 hover:bg-white/[0.055] hover:text-white/55'}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>

        <div className="relative z-10 grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_176px] gap-3 px-5 pb-5">
          <div className="min-h-0 overflow-y-auto pr-1">
            {filteredItems.length ? (
              <div className="grid grid-cols-3 gap-2.5">
                {filteredItems.map((item) => {
                  const id = itemIdOf(item);
                  const selected = id === selectedItemId;
                  const rarity = rarityClass[item.rarity] || rarityClass.Common;
                  return (
                    <motion.button
                      key={id}
                      type="button"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => setSelectedItemId(id)}
                      className={`group relative aspect-[1/1.08] overflow-hidden rounded-2xl border p-2.5 text-left transition-all ${selected
                        ? 'border-cyan-200/30 bg-cyan-200/[0.075] shadow-[0_0_24px_rgba(103,232,249,.07)]'
                        : 'border-white/[0.065] bg-black/15 hover:border-white/[0.12] hover:bg-white/[0.035]'}`}
                    >
                      <div className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      <div className="flex h-[62%] items-center justify-center rounded-xl border border-white/[0.04] bg-black/15">
                        {item.icon_url || item.icon ? (
                          <img src={item.icon_url || item.icon} alt={item.name} className="h-[72%] w-[72%] object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,.35)]" />
                        ) : (
                          <Package className="h-7 w-7 text-white/20" />
                        )}
                      </div>
                      <div className="mt-2 min-w-0">
                        <p className="truncate text-[9px] font-semibold text-white/78">{item.name}</p>
                        <div className="mt-1 flex items-center justify-between gap-1">
                          <span className={`truncate rounded-full border px-1.5 py-0.5 text-[6px] font-black uppercase tracking-[.12em] ${rarity}`}>{item.rarity || 'Common'}</span>
                          <span className="text-[7px] uppercase text-white/22">{typeOf(item) || 'item'}</span>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.07] text-center">
                <Package className="h-7 w-7 text-white/16" />
                <p className="mt-3 text-[10px] font-semibold text-white/38">No matching items</p>
                <p className="mt-1 text-[8px] text-white/20">Change the filter or search.</p>
              </div>
            )}
          </div>

          <aside
            className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/[0.07] p-3"
            style={{
              background: 'linear-gradient(155deg, rgba(255,255,255,.052), rgba(255,255,255,.018))',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,.055)',
            }}
          >
            {selectedItem ? (
              <>
                <div className="flex h-28 items-center justify-center rounded-xl border border-white/[0.055] bg-black/15">
                  {selectedItem.icon_url || selectedItem.icon ? (
                    <img src={selectedItem.icon_url || selectedItem.icon} alt={selectedItem.name} className="h-20 w-20 object-contain" />
                  ) : (
                    <Package className="h-8 w-8 text-white/20" />
                  )}
                </div>
                <div className="mt-3">
                  <p className="text-[11px] font-semibold leading-4 text-white/85">{selectedItem.name}</p>
                  <p className="mt-1 text-[8px] uppercase tracking-[.14em] text-white/28">{selectedItem.subtype || selectedItem.type || 'Item'}</p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-1.5">
                  <div className="rounded-lg border border-white/[0.05] bg-black/10 p-2">
                    <p className="text-[6px] uppercase tracking-[.15em] text-white/20">Rarity</p>
                    <p className="mt-1 truncate text-[8px] font-semibold text-white/60">{selectedItem.rarity || 'Common'}</p>
                  </div>
                  <div className="rounded-lg border border-white/[0.05] bg-black/10 p-2">
                    <p className="text-[6px] uppercase tracking-[.15em] text-white/20">Level</p>
                    <p className="mt-1 text-[8px] font-semibold text-white/60">{selectedItem.level || selectedItem.levelRequirement || 1}</p>
                  </div>
                </div>

                <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
                  <p className="text-[7px] font-black uppercase tracking-[.18em] text-white/22">Compatibility</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(selectedItem.genreCompatibility || [selectedItem.genre || 'Universal']).filter(Boolean).map((genre) => (
                      <span key={genre} className="rounded-full border border-white/[0.055] bg-white/[0.025] px-2 py-1 text-[7px] text-white/38">{genre}</span>
                    ))}
                  </div>
                  {selectedItem.game && <p className="mt-3 text-[8px] leading-3 text-white/28">Origin: <span className="text-white/50">{selectedItem.game}</span></p>}
                </div>

                <button
                  type="button"
                  disabled={!selectedSlotId}
                  onClick={() => selectedSlotId && onEquip?.(selectedItem)}
                  className="mt-3 flex h-10 items-center justify-center gap-2 rounded-xl border border-cyan-200/15 bg-cyan-200/[0.085] text-[9px] font-black uppercase tracking-[.13em] text-cyan-100/75 transition-all hover:bg-cyan-200/[0.13] disabled:cursor-not-allowed disabled:border-white/[0.05] disabled:bg-white/[0.025] disabled:text-white/22"
                >
                  <Check className="h-3.5 w-3.5" />
                  {selectedSlotId ? 'Equip Item' : 'Select Slot'}
                </button>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Package className="h-7 w-7 text-white/15" />
                <p className="mt-3 text-[9px] text-white/28">Select an inventory item.</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
