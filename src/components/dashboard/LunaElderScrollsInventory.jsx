import { useMemo, useState } from 'react';
import {
  Check, CircleDot, Footprints, Gem, Hand, HardHat, Layers3, Lock,
  Package, Search, Shield, Shirt, Sparkles, Swords, UserRound, Wrench,
} from 'lucide-react';
import useCardCollection from '@/components/cards/useCardCollection';
import { EQUIPMENT_SLOT_DEFINITIONS, getEquipmentSlotLabel, itemFitsSlot } from './equipmentSlotRules';

// Original dark fantasy-inspired layout; uses Atom XE's own items and loadout service.
// The two halves stay equal, with independent scrolling for short dashboard windows.
const ICONS = {
  helmet: HardHat, armor: Shirt, pants: Shield, boots: Footprints, gloves: Hand,
  'ring-left': CircleDot, 'ring-right': CircleDot,
  'earring-left': Gem, 'earring-right': Gem,
};
const iconForSlot = (id) =>
  ICONS[id] || (id.startsWith('weapon-') ? Swords : id.startsWith('artifact-') ? Gem : id.startsWith('aspect-') ? Sparkles : Layers3);
const identity = (item) => String(item?.user_card_id || item?.id || item?.itemId || '');
const itemCategory = (item) => {
  const type = String([item?.card_type, item?.itemType, item?.type, item?.equip_slot].filter(Boolean).join(' ')).toLowerCase();
  if (/weapon|saber|sword|pistol|rifle|bow|blade|staff/.test(type)) return 'weapons';
  if (/armor|equipment|helmet|boots|gloves|pants|gear|ring|earring/.test(type)) return 'gear';
  if (/artifact|relic|trinket/.test(type)) return 'artifacts';
  if (/aspect|ability|skill|spell|companion|genre/.test(type)) return 'powers';
  return 'other';
};
const FILTERS = [
  ['all', 'All'],
  ['gear', 'Armor'],
  ['weapons', 'Weapons'],
  ['artifacts', 'Artifacts'],
  ['powers', 'Abilities'],
  ['other', 'Other'],
];

function SlotButton({ id, equipped, selected, onSelect, condensed = false }) {
  const Icon = iconForSlot(id);
  const label = getEquipmentSlotLabel(id);
  const image = equipped?.icon_url || equipped?.image_url || equipped?.image || equipped?.icon;
  return (
    <button
      type="button"
      aria-label={label + (equipped?.name ? ': ' + equipped.name : ': Empty')}
      aria-pressed={selected}
      title={equipped?.name ? label + ' — ' + equipped.name : label + ' — empty'}
      onClick={() => onSelect(id)}
      className={`group flex min-w-0 items-center gap-2 border px-2 transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-amber-200/80
        ${condensed ? 'min-h-11 py-1.5' : 'min-h-14 py-2'}
        ${selected ? 'border-amber-200/60 bg-amber-200/[0.10]' : 'border-white/[0.10] bg-black/30 hover:border-white/25 hover:bg-white/[0.06]'}`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-white/[0.10] bg-[#080a0e]/85">
        {image ? <img src={image} alt="" className="h-7 w-7 object-contain" /> : <Icon className={`h-4 w-4 ${selected ? 'text-amber-100' : 'text-white/40'}`} strokeWidth={1.5} />}
      </div>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[9px] font-semibold text-white/85">{label}</span>
        <span className="block truncate text-[8px] text-white/40">{equipped?.name || 'Empty slot'}</span>
      </span>
    </button>
  );
}

export default function LunaElderScrollsInventory({
  equippedItems = {},
  selectedSlotId = null,
  onSelectSlot,
  onEquipItem,
  onUnequipSlot,
  onUpgradeItem,
  isSaving = false,
}) {
  const collection = useCardCollection();
  const items = useMemo(() => (collection.owned || [])
    .filter((card) => card.user_card_id)
    .map((card) => ({
      ...card,
      id: card.user_card_id,
      user_card_id: card.user_card_id,
      name: card.name || card.title || 'Unnamed item',
      type: card.card_type || card.type || 'item',
      itemType: card.card_type || card.itemType || card.type || 'item',
      image: card.image || card.image_url || card.icon_url || '',
      icon_url: card.image || card.image_url || card.icon_url || '',
      game: card.game_title || card.game || 'Atom XE',
      level: card.progression?.level || card.level || 1,
    })), [collection.owned]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedItemKey, setSelectedItemKey] = useState(null);
  const [showExtendedSlots, setShowExtendedSlots] = useState(false);
  const equippedIds = useMemo(() => new Set(
    Object.values(equippedItems || {}).map(identity).filter(Boolean),
  ), [equippedItems]);
  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => (filter === 'all' || itemCategory(item) === filter)
      && (!q || [item.name, item.game, item.rarity, item.type, item.equip_slot]
        .filter(Boolean).join(' ').toLowerCase().includes(q)));
  }, [items, search, filter]);
  const selectedItem = items.find((item) => identity(item) === selectedItemKey) || null;
  const targetItem = selectedSlotId ? equippedItems[selectedSlotId] : null;
  const suggestedSlot = selectedItem
    ? EQUIPMENT_SLOT_DEFINITIONS.find((slot) => itemFitsSlot(selectedItem, slot.id))?.id
    : null;
  const equipTarget = selectedSlotId || suggestedSlot;
  const compatible = Boolean(selectedItem && equipTarget && itemFitsSlot(selectedItem, equipTarget));
  const alreadyEquipped = Boolean(selectedItem && identity(targetItem) === identity(selectedItem));
  const canEquip = compatible && !alreadyEquipped && !isSaving && Boolean(selectedItem?.user_card_id);

  const chooseSlot = (slotId) => {
    onSelectSlot?.(slotId);
    const current = equippedItems[slotId];
    if (current) {
      const match = items.find((item) => identity(item) === identity(current));
      if (match) setSelectedItemKey(identity(match));
    }
  };
  const renderSlot = (id, condensed = false) => (
    <SlotButton
      key={id}
      id={id}
      condensed={condensed}
      equipped={equippedItems[id]}
      selected={selectedSlotId === id}
      onSelect={chooseSlot}
    />
  );
  const armorA = ['helmet', 'armor', 'gloves', 'ring-left', 'earring-left'];
  const armorB = ['pants', 'boots', 'ring-right', 'earring-right'];
  const additional = [
    ['Weapons', EQUIPMENT_SLOT_DEFINITIONS.filter((s) => s.group === 'weapon')],
    ['Artifacts', EQUIPMENT_SLOT_DEFINITIONS.filter((s) => s.group === 'artifact')],
    ['Aspects', EQUIPMENT_SLOT_DEFINITIONS.filter((s) => s.group === 'aspect')],
    ['Genre', EQUIPMENT_SLOT_DEFINITIONS.filter((s) => s.group === 'genre')],
  ];

  return (
    <div
      data-luna-elder-inventory
      className="flex h-full min-h-0 w-full min-w-0 overflow-hidden text-white"
      style={{ background: 'linear-gradient(125deg, rgba(6,7,10,.96), rgba(23,24,29,.90) 52%, rgba(7,8,12,.96))' }}
    >
      <section aria-label="Equipped loadout" className="flex h-full w-1/2 min-w-0 flex-col border-r border-white/[0.12]">
        <header className="shrink-0 border-b border-white/[0.10] px-4 py-4">
          <p className="text-[9px] uppercase tracking-[.25em] text-amber-100/65">Character</p>
          <h2 className="mt-1 text-xl font-medium tracking-wide text-white/95">Equipment</h2>
          <p className="mt-1 text-[11px] text-white/45">Choose a slot to inspect or replace its gear</p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <div className="relative mx-auto mb-3 grid max-w-[510px] grid-cols-[minmax(0,1fr)_58px_minmax(0,1fr)] items-center gap-1.5 sm:gap-2">
            <div className="relative z-10 flex flex-col gap-2">{armorA.map((id) => renderSlot(id, true))}</div>
            <div aria-hidden="true" className="relative flex h-full flex-col items-center justify-center gap-2">
              <div className="absolute inset-y-3 -inset-x-6 rounded-full bg-amber-100/[0.035] blur-2xl" />
              <UserRound className="relative h-16 w-16 text-white/[0.18]" strokeWidth={0.65} />
              <span className="relative [writing-mode:vertical-rl] text-[8px] uppercase tracking-[.22em] text-white/25">Loadout</span>
            </div>
            <div className="relative z-10 flex flex-col gap-2">{armorB.map((id) => renderSlot(id, true))}</div>
          </div>

          <div className="mx-auto max-w-[510px] border-t border-white/[0.10] pt-3">
            <button type="button" aria-expanded={showExtendedSlots} onClick={() => setShowExtendedSlots((v) => !v)}
              className="flex w-full items-center justify-between py-2 text-left text-[10px] font-semibold uppercase tracking-[.14em] text-amber-100/75 hover:text-amber-100">
              <span>Weapons, artifacts &amp; attunements</span>
              <span className="text-sm">{showExtendedSlots ? '−' : '+'}</span>
            </button>
            {showExtendedSlots && (
              <div className="space-y-4 pb-3">
                {additional.map(([label, slots]) => (
                  <div key={label}>
                    <p className="mb-2 text-[9px] uppercase tracking-widest text-white/45">{label}</p>
                    <div className="grid grid-cols-2 gap-2">{slots.map((slot) => renderSlot(slot.id, true))}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <footer className="shrink-0 border-t border-white/[0.10] bg-black/20 px-4 py-3">
          <p className="truncate text-xs text-amber-100/75">{selectedSlotId ? getEquipmentSlotLabel(selectedSlotId) : 'Select an equipment slot'}</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="truncate text-[11px] text-white/55">{targetItem?.name || 'No item equipped'}</span>
            <button type="button" disabled={!targetItem || isSaving} onClick={() => onUnequipSlot?.(selectedSlotId)}
              className="shrink-0 border border-white/15 px-3 py-1.5 text-[10px] text-white/70 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30">
              Unequip
            </button>
          </div>
        </footer>
      </section>

      <section aria-label="Owned inventory" className="flex h-full w-1/2 min-w-0 flex-col">
        <header className="shrink-0 border-b border-white/[0.10] px-4 py-4">
          <p className="text-[9px] uppercase tracking-[.25em] text-amber-100/65">Satchel</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <h2 className="text-xl font-medium tracking-wide">Inventory</h2>
            <span className="text-[10px] text-white/45">{items.length} owned</span>
          </div>
          <label className="mt-3 flex h-9 items-center gap-2 border border-white/[0.15] bg-black/30 px-3">
            <Search className="h-4 w-4 text-white/45" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search inventory…"
              className="w-full min-w-0 bg-transparent text-xs text-white outline-none placeholder:text-white/35" />
          </label>
          <div className="mt-3 flex gap-1 overflow-x-auto pb-1" aria-label="Item categories">
            {FILTERS.map(([key, label]) => (
              <button type="button" key={key} onClick={() => setFilter(key)} aria-pressed={filter === key}
                className={`shrink-0 border px-2 py-1.5 text-[9px] transition-colors ${filter === key
                  ? 'border-amber-100/50 bg-amber-100/[0.10] text-amber-100'
                  : 'border-white/[0.10] text-white/50 hover:text-white/90'}`}>
                {label}
              </button>
            ))}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {collection.isLoading && <p className="p-5 text-center text-xs text-white/55">Loading owned items…</p>}
          {collection.isError && <p className="p-5 text-center text-xs text-rose-300">Could not load inventory. Please try again.</p>}
          {!collection.isLoading && !collection.isError && visibleItems.length === 0 && (
            <div className="flex h-full min-h-32 flex-col items-center justify-center gap-2 text-white/45">
              <Package className="h-7 w-7" strokeWidth={1.2} />
              <p className="text-center text-xs">{search || filter !== 'all' ? 'No matching items' : 'No owned inventory items yet'}</p>
            </div>
          )}
          <div className="space-y-1.5">
            {visibleItems.map((item) => {
              const id = identity(item);
              const active = id === selectedItemKey;
              const worn = equippedIds.has(id);
              const image = item.icon_url;
              return (
                <button key={id} type="button" aria-pressed={active} onClick={() => setSelectedItemKey(id)}
                  className={`group flex w-full items-center gap-3 border px-2.5 py-2 text-left transition-colors ${active
                    ? 'border-amber-100/45 bg-amber-100/[0.085]'
                    : 'border-white/[0.07] bg-black/25 hover:bg-white/[0.055]'}`}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/[0.08] bg-black/45">
                    {image ? <img src={image} alt="" className="h-10 w-10 object-contain" /> : <Package className="h-5 w-5 text-white/35" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium text-white/90">{item.name}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-white/45">{item.rarity || 'Common'} · {item.game}</span>
                  </span>
                  {worn && <Check className="h-4 w-4 shrink-0 text-amber-100/80" aria-label="Equipped" />}
                </button>
              );
            })}
          </div>
        </div>

        <footer className="min-h-[142px] shrink-0 border-t border-white/[0.12] bg-black/25 px-4 py-3">
          {selectedItem ? (
            <>
              <div className="flex min-w-0 items-center justify-between gap-2">
                <h3 className="truncate text-[13px] font-semibold text-white">{selectedItem.name}</h3>
                <span className="shrink-0 text-[10px] text-amber-100/75">{selectedItem.rarity || 'Common'}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-white/50">
                {selectedItem.description || selectedItem.details || 'An item earned for your Atom XE collection.'}
              </p>
              <p className="mt-1 truncate text-[10px] text-white/40">
                Level {selectedItem.level || 1} · {equipTarget ? 'Target: ' + getEquipmentSlotLabel(equipTarget) : 'Not an equippable item'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" disabled={!canEquip}
                  onClick={() => { if (canEquip) onEquipItem?.(selectedItem, equipTarget); }}
                  className="flex min-h-8 flex-1 items-center justify-center gap-1.5 border border-amber-100/35 bg-amber-100/[0.12] px-3 text-[10px] font-semibold uppercase tracking-widest text-amber-100 hover:bg-amber-100/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.03] disabled:text-white/30">
                  {compatible ? <Check className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                  {alreadyEquipped ? 'Equipped' : isSaving ? 'Saving…' : compatible ? 'Equip' : 'No compatible slot'}
                </button>
                {onUpgradeItem && itemCategory(selectedItem) === 'gear' && (
                  <button type="button" onClick={() => onUpgradeItem(selectedItem)}
                    className="flex min-h-8 items-center gap-1 border border-white/15 px-3 text-[10px] text-white/70 hover:bg-white/10">
                    <Wrench className="h-3 w-3" /> Upgrade
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex h-full items-center gap-3 text-white/40">
              <Sparkles className="h-5 w-5 shrink-0" />
              <p className="text-xs leading-relaxed">Choose an item to inspect its stats, compatibility, and equipment actions.</p>
            </div>
          )}
        </footer>
      </section>
    </div>
  );
}
