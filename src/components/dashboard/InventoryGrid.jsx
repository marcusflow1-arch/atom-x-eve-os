import React from 'react';
import { motion } from 'framer-motion';
import AIAttributesBox from './AIAttributesBox';

export default function InventoryGrid({ equippedItems = {}, handleBoxClick = () => {} }) {
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