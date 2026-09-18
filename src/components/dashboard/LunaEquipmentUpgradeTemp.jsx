import { ArrowLeft, Hammer, Package, Sparkles } from 'lucide-react';

export default function LunaEquipmentUpgradeTemp({ item, onBack }) {
  if (!item) return null;

  const level = item.level || item.levelRequirement || 1;
  const materials = [
    { name: 'Upgrade Material', have: 0, need: 5 },
    { name: 'Essence', have: 0, need: 2 },
    { name: 'Credits', have: 0, need: 500 },
  ];

  return (
    <div className="h-full w-full overflow-y-auto p-5">
      <div
        className="relative min-h-full overflow-hidden rounded-[26px] border border-white/[0.09] p-5"
        style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,.06), rgba(98,75,140,.04) 48%, rgba(255,255,255,.02))',
          backdropFilter: 'blur(32px) saturate(150%)',
          WebkitBackdropFilter: 'blur(32px) saturate(150%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.07), 0 20px 60px rgba(0,0,0,.2)',
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 text-[8px] font-bold uppercase tracking-[.12em] text-white/45 hover:bg-white/[0.05] hover:text-white/70"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Loadout
        </button>

        <div className="mt-5 flex items-center gap-4 border-b border-white/[0.055] pb-5">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-white/[0.07] bg-black/15">
            {item.icon_url || item.icon ? (
              <img src={item.icon_url || item.icon} alt={item.name} className="h-20 w-20 object-contain" />
            ) : (
              <Package className="h-8 w-8 text-white/20" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[7px] font-black uppercase tracking-[.2em] text-violet-100/40">
              <Hammer className="h-3 w-3" /> Equipment Upgrade
            </div>
            <h2 className="mt-1 truncate text-lg font-semibold text-white/88">{item.name}</h2>
            <p className="mt-1 text-[9px] text-white/30">{item.game || 'Game item'} · {item.rarity || 'Common'}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/[0.055] bg-black/12 p-4">
            <p className="text-[7px] font-black uppercase tracking-[.18em] text-white/24">Current Level</p>
            <p className="mt-2 text-3xl font-light text-white/80">{level}</p>
          </div>
          <div className="rounded-2xl border border-violet-200/[0.08] bg-violet-200/[0.025] p-4">
            <p className="text-[7px] font-black uppercase tracking-[.18em] text-violet-100/30">Next Level</p>
            <p className="mt-2 text-3xl font-light text-violet-100/75">{level + 1}</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-100/45" />
            <h3 className="text-[9px] font-black uppercase tracking-[.18em] text-white/45">Required Materials</h3>
          </div>
          <div className="mt-3 space-y-2">
            {materials.map((material) => (
              <div key={material.name} className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-black/10 px-3 py-2.5">
                <span className="text-[9px] text-white/55">{material.name}</span>
                <span className="text-[8px] font-mono text-white/28">{material.have} / {material.need}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-dashed border-white/[0.07] bg-white/[0.015] p-4 text-center">
          <p className="text-[8px] font-bold uppercase tracking-[.16em] text-white/28">Temporary Upgrade UI</p>
          <p className="mx-auto mt-2 max-w-sm text-[9px] leading-4 text-white/24">
            This panel is the placeholder for the equipment upgrade design. The inventory stays visible on the right while this side switches from loadout slots to upgrade controls.
          </p>
        </div>

        <button
          type="button"
          disabled
          className="mt-5 h-11 w-full rounded-xl border border-white/[0.055] bg-white/[0.025] text-[9px] font-black uppercase tracking-[.14em] text-white/20"
        >
          Upgrade — Design Pending
        </button>
      </div>
    </div>
  );
}
