import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, BarChart2, Backpack, Shield, Sword, Sparkles, Gem } from "lucide-react";
import { useEquipment } from "../luna/hooks/useEquipment";
import AvatarCombatStatsPanel from './AvatarCombatStatsPanel';

export default function AvatarProgressionBox() {
  const [activeTab,setActiveTab]=useState('stats');
  const {equippedItems}=useEquipment();

  const handleBoxClick = (slotId) => {
    // Dispatch event for parent InventoryPanel to catch
    window.dispatchEvent(new CustomEvent('openInventoryPanel', { detail: { slotId } }));
  };

  // Helper to render inventory slots with proper icons/placeholders
  const renderSlot = (slotId, typeIcon, label) => {
    const equippedItem = equippedItems[slotId];
    const isRound = slotId.includes('aspect'); // Aspects are circular
    
    return (
      <div className="flex flex-col items-center gap-1">
          <div 
            key={slotId} 
            onClick={() => handleBoxClick(slotId)}
            className={`
                w-12 h-12 ${isRound ? 'rounded-full' : 'rounded-xl'} 
                border border-white/10 cursor-pointer flex items-center justify-center 
                relative group transition-all duration-300
                ${equippedItem ? 'bg-slate-800 border-blue-500/30' : 'bg-black/40 hover:bg-white/5 hover:border-white/20'}
            `}
            style={{ 
              boxShadow: equippedItem ? '0 0 15px rgba(59, 130, 246, 0.15)' : 'inset 0 1px 4px rgba(0,0,0,0.5)'
            }}
          >
            {equippedItem ? (
              <img 
                src={equippedItem.icon_url || equippedItem.icon} 
                alt={equippedItem.name} 
                className="w-full h-full object-contain p-2 relative z-10 drop-shadow-md" 
              />
            ) : (
                <div className="opacity-20 text-white group-hover:opacity-40 transition-opacity">
                    {typeIcon}
                </div>
            )}
            
            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-inherit pointer-events-none" />
          </div>
          {label && <span className="text-[9px] text-white/30 uppercase tracking-wider">{label}</span>}
      </div>
    );
  };

  return (
    <div className="space-y-6 select-none rounded-2xl border border-white/10 p-6" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(18px) saturate(140%)', WebkitBackdropFilter: 'blur(18px) saturate(140%)', boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Progression & Gear</h2>
          <p className="text-white/50 text-xs">Manage stats, genre proficiency, and equipment loadout.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-black/20 p-1.5 rounded-xl border border-white/5">
           {/* Tab Switcher */}
            <button
              onClick={() => setActiveTab("stats")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "stats" 
                  ? "bg-slate-700 text-white shadow-lg shadow-black/20" 
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Stats
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "inventory" 
                  ? "bg-slate-700 text-white shadow-lg shadow-black/20" 
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <Backpack className="w-3.5 h-3.5" />
              Loadout
            </button>
        </div>
      </div>

      {activeTab === "stats" ? (
        <AvatarCombatStatsPanel />
      ) : (
        /* INVENTORY TAB */
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-8 min-h-[400px] flex items-center justify-center">
          <div className="flex flex-col gap-10 w-full max-w-4xl">
            
            {/* Row 1: Gear & Weapons */}
            <div className="flex flex-wrap justify-center gap-16">
                 {/* Armor Grid (3x3) */}
                 <div className="flex flex-col items-center gap-3">
                    <h3 className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">Body Armor</h3>
                    <div className="grid grid-cols-3 gap-2 p-3 bg-black/20 rounded-2xl border border-white/5">
                        {['helmet','armor','pants','boots','gloves','ring-left','ring-right','earring-left','earring-right'].map((id) => renderSlot(id, <Shield className="w-4 h-4"/>,id))}
                    </div>
                 </div>

                 {/* Weapons Row */}
                 <div className="flex flex-col items-center gap-3">
                    <h3 className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">Weapons</h3>
                    <div className="flex gap-2 p-3 bg-black/20 rounded-2xl border border-white/5 h-full items-center">
                        {[1, 2, 3].map((i) => renderSlot(`weapon-${i}`, <Sword className="w-4 h-4"/>, `Slot ${i}`))}
                    </div>
                 </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full" />

            {/* Row 2: Aspects & Artifacts */}
            <div className="flex flex-wrap justify-center gap-16">
                 {/* Aspects (Round) */}
                 <div className="flex flex-col items-center gap-3">
                    <h3 className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">Aspects</h3>
                    <div className="flex gap-4 p-3 px-6 bg-black/20 rounded-full border border-white/5">
                        {[1, 2, 3].map((i) => renderSlot(`aspect-${i}`, <Sparkles className="w-4 h-4"/>))}
                    </div>
                 </div>

                 {/* Artifacts */}
                 <div className="flex flex-col items-center gap-3">
                    <h3 className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">Artifacts</h3>
                    <div className="flex gap-2 p-3 bg-black/20 rounded-2xl border border-white/5">
                        {[1, 2, 3, 4, 5].map((i) => renderSlot(`artifact-${i}`, <Gem className="w-4 h-4"/>))}
                    </div>
                 </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

