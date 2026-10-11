import { useMemo, useState } from 'react';
import { Check, Lock, Package, Search, Shield, Swords, Wrench } from 'lucide-react';
import useOwnedEquipment from '@/components/luna/hooks/useOwnedEquipment';
import InventoryGrid from './InventoryGrid';
import { EQUIPMENT_SLOT_DEFINITIONS, getEquipmentSlotLabel, itemFitsSlot } from './equipmentSlotRules';

// Only physical equipment slots belong in the Inventory workspace.
// Abilities, skills, aspects, and genre cards are handled elsewhere.
const GEAR_SLOTS = EQUIPMENT_SLOT_DEFINITIONS.filter(
  (slot) => ['armor', 'weapon', 'artifact'].includes(slot.group),
);
const GEAR_SLOT_IDS = new Set(GEAR_SLOTS.map((slot) => slot.id));
const FILTERS = [
  ['all', 'All Gear'],
  ['armor', 'Armor'],
  ['weapons', 'Weapons'],
  ['accessories', 'Accessories'],
  ['artifacts', 'Artifacts'],
];
const itemId = (item) => String(item?.user_card_id || item?.id || '');
const slotKind = (item) => {
  const semantic = String(item?.equip_slot || '').trim().toLowerCase();
  const name = String(item?.name || '').toLowerCase();
  if (/^weapon/.test(semantic) || /sword|blade|bow|rifle|pistol|staff|axe|spear|gun|dagger|mace/.test(name)) return 'weapons';
  if (semantic === 'artifact' || /artifact|relic/.test(name)) return 'artifacts';
  if (/ring|earring|jewel/.test(semantic) || /ring|earring|jewel/.test(name)) return 'accessories';
  return 'armor';
};
const itemIcon = (item) => item?.icon_url || item?.image || item?.image_url || '';
const labelStat = (key) => String(key).replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const firstCompatible = (item) => GEAR_SLOTS.find((slot) => itemFitsSlot(item, slot.id))?.id || null;

export default function LunaElderScrollsInventory({
  equippedItems = {},
  selectedSlotId = null,
  onSelectSlot,
  onEquipItem,
  onUnequipSlot,
  onUpgradeItem,
  isSaving = false,
}) {
  // The existing owned-equipment hook is backed by the equipment-only card
  // collection. Do not present abilities, skills, companions or demo items.
  const collection = useOwnedEquipment();
  const items = collection.items || [];
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedItemId, setSelectedItemId] = useState(null);
  const selectedItem = items.find((item) => itemId(item) === selectedItemId) || null;
  const equippedIds = useMemo(
    () => new Set(Object.values(equippedItems || {}).map(itemId).filter(Boolean)),
    [equippedItems],
  );

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) =>
      (filter === 'all' || slotKind(item) === filter) &&
      (!q || [item.name, item.game, item.rarity, item.equip_slot]
        .filter(Boolean).join(' ').toLowerCase().includes(q)),
    );
  }, [items, search, filter]);

  const isGearSlot = GEAR_SLOT_IDS.has(selectedSlotId);
  const chosenSlot = isGearSlot ? selectedSlotId : null;
  const compatibleSlot = selectedItem ? firstCompatible(selectedItem) : null;
  // When the player chooses an equipment box, that target always takes priority.
  // Otherwise provide a compatible gear target so selection -> Equip still works.
  const equipTarget = chosenSlot || compatibleSlot;
  const compatible = Boolean(selectedItem && equipTarget && itemFitsSlot(selectedItem, equipTarget));
  const targetItem = chosenSlot ? equippedItems[chosenSlot] : null;
  const alreadyEquippedHere = Boolean(
    selectedItem && targetItem && itemId(selectedItem) === itemId(targetItem),
  );
  const canEquip = Boolean(compatible && selectedItem?.user_card_id && !alreadyEquippedHere && !isSaving);
  const displayedStats = selectedItem
    ? Object.entries(selectedItem.stats || {})
      .filter(([key, value]) => typeof value === 'number' && Number.isFinite(value))
      .slice(0, 3)
    : [];
  const fillerCount = Math.max(0, 30 - visibleItems.length);

  const handleSlotSelect = (slotId) => {
    if (!GEAR_SLOT_IDS.has(slotId)) return;
    onSelectSlot?.(slotId);
    const equipped = equippedItems[slotId];
    if (equipped) {
      const existing = items.find((item) => itemId(item) === itemId(equipped));
      if (existing) setSelectedItemId(itemId(existing));
    }
  };

  return (
    <div
      data-luna-elder-inventory
      className="flex h-full w-full min-h-0 min-w-0 overflow-hidden text-white"
      style={{ background: 'linear-gradient(135deg, rgba(6,8,12,0.93), rgba(20,23,28,0.90) 55%, rgba(7,9,13,0.94))' }}
    >
      <section aria-label="Equipment slots" className="flex h-full w-1/2 min-w-0 flex-col border-r border-white/[0.12]">
        {/* The actual pre-existing slot design, not the character silhouette redesign. */}
        <div className="min-h-0 flex-1">
          <InventoryGrid
            equippedItems={equippedItems}
            handleBoxClick={handleSlotSelect}
            compact
            gearOnly
            selectedSlotId={chosenSlot}
          />
        </div>
        <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-white/[0.08] bg-black/25 px-4 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-[9px] font-semibold text-white/85">
              {chosenSlot ? getEquipmentSlotLabel(chosenSlot) : 'Select an equipment slot'}
            </p>
            <p className="truncate text-[9px] text-white/45">{targetItem?.name || 'No gear selected'}</p>
          </div>
          <button
            type="button"
            onClick={() => onUnequipSlot?.(chosenSlot)}
            disabled={!chosenSlot || !targetItem || isSaving}
            className="shrink-0 border border-white/15 bg-white/[0.04] px-2.5 py-1.5 text-[9px] text-white/80 transition-colors hover:bg-white/[0.10] disabled:cursor-not-allowed disabled:opacity-30"
          >
            Unequip
          </button>
        </footer>
      </section>

      <section aria-label="Equipment inventory" className="flex h-full w-1/2 min-w-0 flex-col">
        <header className="shrink-0 border-b border-white/[0.09] px-3 py-3.5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/40">Equipment Collection</p>
              <h2 className="mt-0.5 text-[17px] font-semibold text-white/90">Inventory</h2>
            </div>
            <span className="text-[10px] text-white/45">{items.length} owned</span>
          </div>
          <label className="mt-3 flex h-8 items-center gap-2 border border-white/[0.09] bg-black/25 px-2">
            <Search className="h-3.5 w-3.5 text-white/40" />
            <input
              aria-label="Search equipment"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search gear and weapons"
              className="w-full min-w-0 bg-transparent text-[11px] text-white outline-none placeholder:text-white/30"
            />
          </label>
          <div className="mt-2.5 flex gap-1 overflow-x-auto pb-1" role="group" aria-label="Equipment categories">
            {FILTERS.map(([id, label]) => (
              <button
                type="button"
                key={id}
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
                className={`shrink-0 border px-2 py-1.5 text-[9px] transition-colors ${filter === id
                  ? 'border-white/30 bg-white/[0.12] text-white'
                  : 'border-white/[0.07] bg-black/10 text-white/50 hover:text-white/90'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        <div className="relative min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {collection.isLoading && (
            <p className="mb-3 text-center text-[11px] text-white/50">Loading owned gear…</p>
          )}
          {collection.isError && (
            <p className="mb-3 text-center text-[11px] text-rose-300">Unable to load equipment.</p>
          )}
          {/* Classic compact slot inventory. Empty boxes preserve its grid appearance. */}
          <div
            className="grid content-start justify-start gap-1.5"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))' }}
            role="group"
            aria-label="Equipment item grid"
          >
            {visibleItems.map((item) => {
              const id = itemId(item);
              const selected = id === selectedItemId;
              const worn = equippedIds.has(id);
              const image = itemIcon(item);
              return (
                <button
                  type="button"
                  key={id}
                  title={`${item.name} — ${item.rarity || 'Common'}`}
                  aria-label={`${item.name}, ${item.rarity || 'Common'}${worn ? ', equipped' : ''}`}
                  aria-pressed={selected}
                  onClick={() => setSelectedItemId(id)}
                  className={`group relative aspect-square min-w-0 overflow-hidden rounded-[5px] border transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-cyan-200
                    ${selected ? 'border-cyan-200/70 bg-cyan-100/[0.12] shadow-[inset_0_0_14px_rgba(103,232,249,0.09)]'
                      : 'border-white/[0.13] bg-black/40 hover:border-white/35 hover:bg-white/[0.07]'}`}
                >
                  {image
                    ? <img src={image} alt="" className="h-full w-full object-contain p-1.5" loading="lazy" />
                    : <Package className="absolute inset-0 m-auto h-5 w-5 text-white/35" />}
                  {Number(item.quantity) > 1 && (
                    <span className="absolute bottom-0.5 right-1 rounded bg-black/70 px-0.5 text-[8px] text-white">
                      {item.quantity}
                    </span>
                  )}
                  {worn && (
                    <span className="absolute right-0.5 top-0.5 rounded-sm bg-cyan-400/90 p-px text-slate-950" title="Equipped">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  )}
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/[0.06]" />
                </button>
              );
            })}
            {Array.from({ length: fillerCount }, (_, i) => (
              <div
                key={`empty-${i}`}
                aria-hidden="true"
                className="aspect-square min-w-0 rounded-[5px] border border-white/[0.045] bg-black/[0.19]"
              />
            ))}
          </div>
          {!collection.isLoading && !collection.isError && visibleItems.length === 0 && (
            <p className="pointer-events-none absolute inset-x-5 top-1/3 text-center text-[11px] text-white/50">
              {search.trim() || filter !== 'all' ? 'No equipment matches your filter' : 'No equipment in your collection yet'}
            </p>
          )}
        </div>

        <footer className="min-h-[132px] shrink-0 border-t border-white/[0.09] bg-black/25 px-3 py-3">
          {selectedItem ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-xs font-semibold text-white">{selectedItem.name}</h3>
                  <p className="mt-0.5 truncate text-[9px] text-white/45">
                    {selectedItem.rarity || 'Common'} · Lv {selectedItem.level || 1} · {selectedItem.game || 'Unknown game'}
                  </p>
                </div>
                <span className="shrink-0 text-[8px] uppercase text-white/45">{slotKind(selectedItem)}</span>
              </div>
              <div className="mt-1.5 flex min-h-[15px] flex-wrap gap-x-3 gap-y-1">
                {displayedStats.map(([key, value]) => (
                  <span key={key} className="text-[9px] text-white/60">{labelStat(key)}: {value}</span>
                ))}
                {displayedStats.length === 0 && (
                  <span className="truncate text-[9px] text-white/40">
                    {selectedItem.description || 'No additional equipment stats listed'}
                  </span>
                )}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!canEquip}
                  onClick={() => { if (canEquip) onEquipItem?.(selectedItem, equipTarget); }}
                  className="flex min-h-8 flex-1 items-center justify-center gap-1.5 border border-cyan-200/25 bg-cyan-200/[0.09] px-3 text-[10px] font-semibold text-cyan-50 transition-colors hover:bg-cyan-200/[0.16] disabled:cursor-not-allowed disabled:border-white/[0.06] disabled:bg-white/[0.02] disabled:text-white/30"
                >
                  {compatible ? <Check className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                  {alreadyEquippedHere ? 'Equipped' : isSaving ? 'Saving…' : compatible ? 'Equip' : chosenSlot ? 'Wrong slot' : 'No valid slot'}
                </button>
                {onUpgradeItem && (
                  <button
                    type="button"
                    onClick={() => onUpgradeItem(selectedItem)}
                    className="flex min-h-8 items-center gap-1.5 border border-white/15 px-2.5 text-[10px] text-white/70 hover:bg-white/[0.08]"
                  >
                    <Wrench className="h-3 w-3" /> Upgrade
                  </button>
                )}
              </div>
              {compatible && (
                <p className="mt-1.5 truncate text-[9px] text-white/35">
                  {getEquipmentSlotLabel(equipTarget)}
                </p>
              )}
            </>
          ) : (
            <div className="flex h-full items-center gap-3 text-white/45">
              <Shield className="h-5 w-5 shrink-0" />
              <p className="text-[11px]">Select a gear square to view details and equip it into a slot on the left.</p>
            </div>
          )}
        </footer>
      </section>
    </div>
  );
}
