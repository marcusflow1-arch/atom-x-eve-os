import { Check, Lock, Package, Sparkles, Wrench, X } from 'lucide-react';
import { getEquipmentSlotLabel, itemFitsSlot } from './equipmentSlotRules';

export default function LunaInventoryItemPreview({
  item,
  selectedSlotId,
  onEquip,
  onUpgrade,
  showUpgrade = true,
  onClose,
}) {
  if (!item) return null;

  const canEquip = Boolean(selectedSlotId && itemFitsSlot(item, selectedSlotId));
  const targetLabel = selectedSlotId ? getEquipmentSlotLabel(selectedSlotId) : 'No slot selected';
  const compatibility = item.genreCompatibility || item.compatibility || [];
  const description = item.description || item.details || item.flavor_text || 'No extended description is available for this item yet.';

  return (
    <div className="absolute inset-0 z-40 p-4">
      <div
        className="relative h-full overflow-hidden border border-white/[0.07]"
        style={{
          background: 'linear-gradient(135deg, rgba(10,16,26,.58), rgba(14,23,34,.38) 48%, rgba(9,14,22,.54))',
          backdropFilter: 'blur(22px) saturate(135%)',
          WebkitBackdropFilter: 'blur(22px) saturate(135%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06), inset 0 -1px 0 rgba(255,255,255,.025), 0 18px 48px rgba(0,0,0,.18)',
        }}
      >
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/18 to-transparent" />
        <div className="pointer-events-none absolute inset-y-8 left-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        <div className="pointer-events-none absolute inset-y-8 right-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close item details"
          className="absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center border border-white/[0.06] bg-black/10 text-white/28 transition-colors hover:bg-white/[0.04] hover:text-white/60"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="flex h-full flex-col p-5">
          <div className="flex items-start gap-4 border-b border-white/[0.055] pb-4">
            <div className="relative flex h-24 w-20 shrink-0 items-center justify-center border border-white/[0.07] bg-black/15">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(103,232,249,.08),transparent_62%)]" />
              {item.icon_url || item.icon ? (
                <img src={item.icon_url || item.icon} alt={item.name} className="relative z-10 h-16 w-16 object-contain" />
              ) : (
                <Package className="relative z-10 h-7 w-7 text-white/20" />
              )}
            </div>

            <div className="min-w-0 flex-1 pr-8">
              <div className="flex items-center gap-1.5 text-[7px] font-black uppercase tracking-[.18em] text-cyan-100/35">
                <Sparkles className="h-3 w-3" />
                Item Detail
              </div>
              <h2 className="mt-1 truncate text-[17px] font-semibold text-white/88">{item.name}</h2>
              <p className="mt-1 truncate text-[8px] uppercase tracking-[.13em] text-white/25">
                {item.inventoryCategory === 'asc' ? 'A.S.C.' : item.inventoryCategory || item.type || 'Item'}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-[7px] text-white/42">{item.rarity || 'Common'}</span>
                <span className="border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-[7px] text-white/42">Lv {item.level || item.levelRequirement || 1}</span>
                {item.quantity != null && <span className="border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-[7px] text-white/42">Qty {item.quantity}</span>}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto py-4 pr-1">
            <div className="grid grid-cols-2 gap-x-5 gap-y-3">
              <div>
                <p className="text-[6px] font-black uppercase tracking-[.16em] text-white/18">Game</p>
                <p className="mt-1 text-[9px] text-white/52">{item.game || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-[6px] font-black uppercase tracking-[.16em] text-white/18">Slot Target</p>
                <p className="mt-1 text-[9px] text-white/52">{targetLabel}</p>
              </div>
              <div>
                <p className="text-[6px] font-black uppercase tracking-[.16em] text-white/18">Subtype</p>
                <p className="mt-1 text-[9px] text-white/52">{item.subtype || item.type || '—'}</p>
              </div>
              <div>
                <p className="text-[6px] font-black uppercase tracking-[.16em] text-white/18">Status</p>
                <p className={`mt-1 text-[9px] ${selectedSlotId ? (canEquip ? 'text-cyan-100/60' : 'text-amber-100/52') : 'text-white/38'}`}>
                  {!selectedSlotId ? 'Select a slot' : canEquip ? 'Compatible' : 'Wrong slot'}
                </p>
              </div>
            </div>

            <div className="mt-4 border-t border-white/[0.05] pt-4">
              <p className="text-[6px] font-black uppercase tracking-[.16em] text-white/18">Description</p>
              <p className="mt-2 max-w-xl text-[9px] leading-4 text-white/38">{description}</p>
            </div>

            {compatibility.length > 0 && (
              <div className="mt-4 border-t border-white/[0.05] pt-4">
                <p className="text-[6px] font-black uppercase tracking-[.16em] text-white/18">Compatibility</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {compatibility.map((entry) => (
                    <span key={entry} className="border border-white/[0.05] bg-white/[0.018] px-2 py-1 text-[7px] text-white/34">{entry}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 border-t border-white/[0.055] pt-3">
            {showUpgrade && item.inventoryCategory === 'equipment' && (
              <button
                type="button"
                onClick={() => onUpgrade?.(item)}
                className="flex h-9 flex-1 items-center justify-center gap-1.5 border border-violet-200/10 bg-violet-200/[0.04] text-[8px] font-black uppercase tracking-[.12em] text-violet-100/60 transition-colors hover:bg-violet-200/[0.08]"
              >
                <Wrench className="h-3 w-3" /> Enhance
              </button>
            )}
            <button
              type="button"
              disabled={!canEquip}
              onClick={() => canEquip && onEquip?.(item)}
              className="flex h-9 flex-1 items-center justify-center gap-1.5 border border-cyan-200/10 bg-cyan-200/[0.045] text-[8px] font-black uppercase tracking-[.12em] text-cyan-100/62 transition-colors hover:bg-cyan-200/[0.08] disabled:cursor-not-allowed disabled:border-white/[0.04] disabled:bg-white/[0.015] disabled:text-white/20"
            >
              {selectedSlotId && !canEquip ? <Lock className="h-3 w-3" /> : <Check className="h-3 w-3" />}
              {!selectedSlotId ? 'Select Slot' : canEquip ? 'Equip' : 'Wrong Slot'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
