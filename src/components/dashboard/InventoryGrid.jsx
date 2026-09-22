import { motion } from 'framer-motion';
import { CircleDot, Footprints, Gem, Hand, HardHat, Layers3, Shirt, Shield, Sparkles, Swords } from 'lucide-react';
import { EQUIPMENT_SLOT_DEFINITIONS, getEquipmentSlotDefinition } from './equipmentSlotRules';

export default function InventoryGrid({ equippedItems = {}, handleBoxClick, compact = false, selectedSlotId = null }) {
  const SLOT_ICONS = {
    helmet: HardHat,
    armor: Shirt,
    pants: Shield,
    boots: Footprints,
    gloves: Hand,
    'ring-left': CircleDot,
    'ring-right': CircleDot,
    'earring-left': Gem,
    'earring-right': Gem,
    'weapon-1': Swords,
    'weapon-2': Swords,
    'weapon-3': Swords,
    'aspect-1': Sparkles,
    'aspect-2': Sparkles,
    'aspect-3': Sparkles,
    'genre-1': Layers3,
    'genre-2': Layers3,
    'genre-3': Layers3,
    'genre-4': Layers3,
    'artifact-1': Gem,
    'artifact-2': Gem,
    'artifact-3': Gem,
    'artifact-4': Gem,
    'artifact-5': Gem,
  };

  const compactSlot = (slotId, round = false) => {
    const equippedItem = equippedItems[slotId];
    const selected = selectedSlotId === slotId;
    const definition = getEquipmentSlotDefinition(slotId);
    const Icon = SLOT_ICONS[slotId] || Layers3;
    const label = definition?.label || slotId;
    const sideMarker = slotId.endsWith('-left') ? 'L' : slotId.endsWith('-right') ? 'R' : null;

    return (
      <button
        key={slotId}
        type="button"
        title={label}
        onClick={() => handleBoxClick(slotId)}
        className={`group relative flex h-[60px] w-[60px] cursor-pointer items-center justify-center overflow-hidden border transition-all duration-300 ${round ? 'rounded-full' : 'rounded-xl'} ${selected ? 'scale-[1.04]' : 'hover:scale-[1.03]'}`}
        style={{
          background: selected ? 'rgba(8, 29, 39, 0.92)' : 'rgba(11, 11, 11, 0.85)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderColor: selected ? 'rgba(103, 232, 249, 0.72)' : 'rgba(255, 255, 255, 0.12)',
          boxShadow: selected
            ? 'inset 0 1px 2px rgba(255,255,255,.12), 0 0 18px rgba(34,211,238,.2)'
            : 'inset 0 1px 2px rgba(255,255,255,.08), 0 2px 8px rgba(0,0,0,.4)',
        }}
        aria-label={`Select ${label}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {sideMarker && <span className="absolute right-1 top-1 z-20 text-[6px] font-black text-white/70">{sideMarker}</span>}
        {!equippedItem && <Icon className="relative z-10 h-5 w-5 text-white/55 transition-colors group-hover:text-white" strokeWidth={1.35} />}
        {equippedItem && (
          <>
            <img src={equippedItem.icon_url || equippedItem.icon} alt={equippedItem.name} className="relative z-10 h-full w-full object-contain p-2" />
            <div className="absolute left-1 top-1 z-20 flex h-4 w-4 items-center justify-center border border-white/[0.08] bg-black/45">
              <Icon className="h-2.5 w-2.5 text-white/75" strokeWidth={1.5} />
            </div>
          </>
        )}
        <span className="pointer-events-none absolute inset-x-1 bottom-1 z-20 truncate text-center text-[5px] font-bold uppercase tracking-[0.08em] text-white/80 opacity-0 transition-opacity group-hover:opacity-100">
          {label}
        </span>
      </button>
    );
  };

  const CompactHeader = ({ children, width = 'w-40' }) => (
    <div className="flex flex-col items-center gap-2">
      <h2 className="text-[9px] font-semibold uppercase tracking-[0.3em] text-white/85">{children}</h2>
      <div className={`relative h-3 ${width}`}>
        <div className="absolute left-0 right-0 top-1.5 h-px bg-white/10" />
        <div className="absolute left-1/2 top-0.5 h-px w-12 -translate-x-1/2 bg-white/10" />
        <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/60" />
      </div>
    </div>
  );

  if (compact) {
    return (
      <motion.div
        key="boxes-compact"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="h-full w-full overflow-y-auto overflow-x-hidden"
      >
        <div className="mx-auto min-h-full w-full max-w-[640px] px-5 py-5">
          <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.22em] text-white">Loadout</p>
              <p className="mt-1 text-[10px] text-white/70">Choose a slot, then equip from the inventory.</p>
            </div>
            {selectedSlotId && <span className="rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[8px] uppercase tracking-[0.12em] text-white">{selectedSlotId}</span>}
          </div>

          {/* Narrow 30% loadout rail. Keep each slot family intact and stack
              the families vertically so the grid stays readable at smaller widths. */}
          <div className="flex flex-col items-center gap-5">
            <section className="flex w-full flex-col items-center gap-3">
              <CompactHeader width="w-52">Weapons</CompactHeader>
              <div className="flex gap-3">
                {[1,2,3].map((i) => compactSlot(`weapon-${i}`))}
              </div>
            </section>

            <section className="flex w-full flex-col items-center gap-3 border-t border-white/[0.05] pt-4">
              <CompactHeader width="w-48">Equipment</CompactHeader>
              <div className="grid grid-cols-3 gap-3">
                {EQUIPMENT_SLOT_DEFINITIONS.filter((slot) => slot.group === 'armor').map((slot) => compactSlot(slot.id))}
              </div>
            </section>

            <section className="flex w-full flex-col items-center gap-3 border-t border-white/[0.05] pt-4">
              <CompactHeader width="w-52">Artifacts</CompactHeader>
              <div className="flex gap-3">
                {[1,2,3,4,5].map((i) => compactSlot(`artifact-${i}`))}
              </div>
            </section>

            <div className="grid w-full grid-cols-2 items-start gap-4 border-t border-white/[0.05] pt-4">
              <section className="flex min-w-0 flex-col items-center gap-3">
                <CompactHeader width="w-32">Genre</CompactHeader>
                <div className="grid grid-cols-2 gap-3">
                  {[1,2,3,4].map((i) => compactSlot(`genre-${i}`))}
                </div>
              </section>

              <section className="flex min-w-0 flex-col items-center gap-3">
                <CompactHeader width="w-32">Aspects</CompactHeader>
                <div className="grid grid-cols-2 gap-3">
                  {[1,2,3].map((i) => compactSlot(`aspect-${i}`, true))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="boxes"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex h-full relative"
    >
      {/* Left: Spacer for floating 3D Viewer Box from LunaTemplate */}
      <div className="w-[420px] flex-shrink-0 mt-20 pl-8 pointer-events-none">
        {/* Removed duplicate Mini3DViewerBox */}
      </div>

      {/* Middle: All Equipment Sections - positioned below header */}
      <div className="flex flex-col gap-8 flex-shrink-0 ml-8 relative z-30 items-center mt-20">
        {/* Top Row: Armor and Weapons with Genre */}
        <div className="flex gap-12 items-start">
          {/* Armor - 3x3 Grid */}
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Armor</h2>
            <div className="relative w-48 h-4 mb-2">
              <div className="absolute top-2 left-0 right-0 h-[1px] bg-white/10"></div>
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-[1px] bg-white/10"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/15 bg-black/60"></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
                const slotId = `armor-${i}`;
                const equippedItem = equippedItems[slotId];
                return (
                  <div key={slotId} onClick={() => handleBoxClick(slotId)} className="w-[60px] h-[60px] rounded-xl border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700" style={{ background: 'rgba(11, 11, 11, 0.85)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderColor: 'rgba(255, 255, 255, 0.12)', boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    {equippedItem && <img src={equippedItem.icon_url || equippedItem.icon} alt={equippedItem.name} className="w-full h-full object-contain p-2 relative z-10" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weapons with Genre to the right */}
          <div className="flex gap-8 items-start">
            {/* Weapons */}
            <div className="flex flex-col items-center">
              <h2 className="text-[10px] font-light tracking-[0.35em] uppercase mb-4 text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Weapons</h2>
              <div className="relative w-64 h-4 mb-4">
                <div className="absolute top-2 left-0 right-0 h-[1px] bg-white/10"></div>
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-20 h-[1px] bg-white/10"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/15 bg-black/60"></div>
              </div>
              <div className="flex gap-3">
                {[1, 2, 3].map((i) => {
                  const slotId = `weapon-${i}`;
                  const equippedItem = equippedItems[slotId];
                  return (
                    <div key={slotId} onClick={() => handleBoxClick(slotId)} className="w-[60px] h-[60px] rounded-xl border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700" style={{ background: 'rgba(11, 11, 11, 0.85)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderColor: 'rgba(255, 255, 255, 0.12)', boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' }}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      {equippedItem && <img src={equippedItem.icon_url || equippedItem.icon} alt={equippedItem.name} className="w-full h-full object-contain p-2 relative z-10" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Genre (right of Weapons) */}
            <div className="flex flex-col items-center gap-4">
              <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Genre</h2>
              <div className="relative w-40 h-4">
                <div className="absolute top-2 left-0 right-0 h-[1px] bg-white/10"></div>
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-[1px] bg-white/10"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/15 bg-black/60"></div>
              </div>
              <div className="flex gap-3">
                {[1, 2].map((i) => {
                  const slotId = `genre-${i}`;
                  const equippedItem = equippedItems[slotId];
                  return (
                    <div key={slotId} onClick={() => handleBoxClick(slotId)} className="w-[60px] h-[60px] rounded-xl border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700" style={{ background: 'rgba(11, 11, 11, 0.85)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderColor: 'rgba(255, 255, 255, 0.12)', boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' }}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      {equippedItem && <img src={equippedItem.icon_url || equippedItem.icon} alt={equippedItem.name} className="w-full h-full object-contain p-2 relative z-10" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Artifacts, Genre (pushed to very bottom) */}
        <div className="flex gap-8 mt-32">
          {/* Artifacts */}
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Artifacts</h2>
            <div className="relative w-52 h-4">
              <div className="absolute top-2 left-0 right-0 h-[1px] bg-white/10"></div>
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-[1px] bg-white/10"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/15 bg-black/60"></div>
            </div>
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((i) => {
                const slotId = `artifact-${i}`;
                const equippedItem = equippedItems[slotId];
                return (
                  <div key={slotId} onClick={() => handleBoxClick(slotId)} className="w-[60px] h-[60px] rounded-xl border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700" style={{ background: 'rgba(11, 11, 11, 0.85)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderColor: 'rgba(255, 255, 255, 0.12)', boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    {equippedItem && <img src={equippedItem.icon_url || equippedItem.icon} alt={equippedItem.name} className="w-full h-full object-contain p-2 relative z-10" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Genre (bottom row) */}
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Genre</h2>
            <div className="relative w-40 h-4">
              <div className="absolute top-2 left-0 right-0 h-[1px] bg-white/10"></div>
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-[1px] bg-white/10"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/15 bg-black/60"></div>
            </div>
            <div className="flex gap-3">
              {[3, 4].map((i) => {
                const slotId = `genre-${i}`;
                const equippedItem = equippedItems[slotId];
                return (
                  <div key={slotId} onClick={() => handleBoxClick(slotId)} className="w-[60px] h-[60px] rounded-xl border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700" style={{ background: 'rgba(11, 11, 11, 0.85)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderColor: 'rgba(255, 255, 255, 0.12)', boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    {equippedItem && <img src={equippedItem.icon_url || equippedItem.icon} alt={equippedItem.name} className="w-full h-full object-contain p-2 relative z-10" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Aspects (AI Attribute) */}
      <div className="flex flex-col gap-8 flex-shrink-0 ml-8 relative z-30 items-center mt-20">
        {/* Aspects */}
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Aspects</h2>
          <div className="relative w-40 h-4">
            <div className="absolute top-2 left-0 right-0 h-[1px] bg-white/10"></div>
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-[1px] bg-white/10"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/15 bg-black/60"></div>
          </div>
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => {
              const slotId = `aspect-${i}`;
              const equippedItem = equippedItems[slotId];
              return (
                <div key={slotId} onClick={() => handleBoxClick(slotId)} className="w-[60px] h-[60px] rounded-full border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700" style={{ background: 'rgba(11, 11, 11, 0.85)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', borderColor: 'rgba(255, 255, 255, 0.12)', boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  {equippedItem && <img src={equippedItem.icon_url || equippedItem.icon} alt={equippedItem.name} className="w-full h-full object-contain p-2 relative z-10" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}