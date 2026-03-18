import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, BarChart2, Backpack, Shield, Sword, Sparkles, Gem } from "lucide-react";
import { useEquipment } from "../luna/hooks/useEquipment";

const GENRES = ["RPG","FPS","Strategy","Action","MMO","Puzzle","Simulation","Sports"];
const BASE_XP = 100;
const XP_EXPONENT = 1.35;
const GENRE_TO_GLOBAL_RATIO = 0.3; // 30%

// Calculates XP needed for next level: 100 * (Level ^ 1.35)
function xpToNextLevel(level) {
  return Math.round(BASE_XP * Math.pow(Math.max(1, level || 1), XP_EXPONENT));
}

export default function AvatarProgressionBox() {
  const [user, setUser] = useState(null);
  const [record, setRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("stats");
  
  // Custom hook to fetch currently equipped items map
  const { equippedItems } = useEquipment();

  // Ensure DB record has all defined genres
  const ensureGenres = (rec) => {
    if (!rec.genres || !Array.isArray(rec.genres)) {
      rec.genres = GENRES.map((g) => ({ name: g, level: 1, xp: 0 }));
    } else {
      const names = new Set(rec.genres.map((g) => g.name));
      GENRES.forEach((g) => {
        if (!names.has(g)) rec.genres.push({ name: g, level: 1, xp: 0 });
      });
    }
    return rec;
  };

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const rows = await base44.entities.AvatarProgression.filter({ user_id: me.id });
        
        if (rows.length === 0) {
          const newRec = await base44.entities.AvatarProgression.create({
            user_id: me.id,
            global_level: 1,
            global_xp: 0,
            available_stat_points: 0,
            stats: { hp: 100, strength: 10, intelligence: 10, will: 10, tenacity: 10 },
            genres: GENRES.map((g) => ({ name: g, level: 1, xp: 0 }))
          });
          setRecord(newRec);
        } else {
          setRecord(ensureGenres(rows[0]));
        }
      } catch (err) {
        console.error("Failed to load progression:", err);
      }
    })();
  }, []);

  const saveRecord = async (next) => {
    setSaving(true);
    try {
        const updated = await base44.entities.AvatarProgression.update(next.id, next);
        setRecord(updated);
        window.dispatchEvent(new CustomEvent('syncPlayerStats'));
    } catch (e) {
        console.error("Save failed", e);
    } finally {
        setSaving(false);
    }
  };

  const handleAllocate = async (stat) => {
    if (!record || record.available_stat_points <= 0) return;
    
    // Optimistic update
    const next = { ...record, stats: { ...record.stats }, available_stat_points: record.available_stat_points - 1 };
    if (stat === 'hp') next.stats.hp += 10; 
    else next.stats[stat] = (next.stats[stat] || 0) + 1;
    
    await saveRecord(next);
  };

  const levelGlobalIfNeeded = (rec) => {
    let changed = false;
    // Safety break to prevent infinite loops
    let loops = 0;
    let threshold = xpToNextLevel(rec.global_level || 1);
    
    while ((rec.global_xp || 0) >= threshold && loops < 100) {
      rec.global_xp -= threshold;
      rec.global_level = (rec.global_level || 1) + 1;
      threshold = xpToNextLevel(rec.global_level);
      changed = true;
      loops++;
    }
    return changed;
  };

  const addGenreXP = async (genreName, amount) => {
    if (!record) return;
    const next = { ...record, genres: record.genres.map(g => ({ ...g })) };
    const g = next.genres.find((x) => x.name === genreName);
    if (!g) return;
    
    // Add XP
    g.xp = (g.xp || 0) + amount;
    next.global_xp = (next.global_xp || 0) + (amount * GENRE_TO_GLOBAL_RATIO);

    // Level up Genre
    let awarded = 0;
    let loopSafety = 0;
    while (g.xp >= xpToNextLevel(g.level || 1) && loopSafety < 50) {
      g.xp -= xpToNextLevel(g.level || 1);
      g.level = (g.level || 1) + 1;
      awarded += 1;
      if ((g.level % 5) === 0) awarded += 1; // Bonus point every 5 levels
      loopSafety++;
    }
    next.available_stat_points = (next.available_stat_points || 0) + awarded;

    // Check Global Level
    levelGlobalIfNeeded(next);

    await saveRecord(next);
  };

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

  if (!user || !record) {
    return (
      <div className="p-12 rounded-2xl bg-slate-900/50 border border-white/5 text-white/50 flex flex-col items-center justify-center gap-2">
        <div className="w-6 h-6 border-2 border-t-transparent border-white/30 rounded-full animate-spin"/>
        <span>Syncing Avatar Data...</span>
      </div>
    );
  }

  const globalThreshold = xpToNextLevel(record.global_level || 1);
  const globalPct = Math.min(100, Math.round(((record.global_xp || 0) / globalThreshold) * 100));

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

      {/* Global Level Bar */}
      <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5 flex items-center gap-4">
          <div className="flex flex-col items-center justify-center w-12 h-12 bg-blue-600 rounded-lg shadow-lg shadow-blue-900/20 shrink-0">
             <span className="text-[10px] text-blue-200 font-bold uppercase">Lvl</span>
             <span className="text-xl font-black text-white leading-none">{record.global_level || 1}</span>
          </div>
          <div className="flex-1 space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-400">
                  <span>Global Experience</span>
                  <span>{Math.round(record.global_xp || 0)} / {globalThreshold} XP</span>
              </div>
              <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500"
                    style={{ width: `${globalPct}%` }}
                  />
              </div>
          </div>
      </div>

      {/* TABS CONTENT */}
      {activeTab === "stats" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: Core Stats */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/50 border border-white/10 h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider">Core Attributes</h3>
                {record.available_stat_points > 0 && (
                    <Badge className="bg-purple-500 text-white hover:bg-purple-600 animate-pulse">
                        {record.available_stat_points} Points Available
                    </Badge>
                )}
              </div>
              
              <div className="space-y-1">
                <StatRow label="HP" value={record.stats?.hp ?? 0} onAdd={() => handleAllocate('hp')} canAdd={record.available_stat_points > 0} icon={<div className="w-1.5 h-1.5 rounded-full bg-red-500"/>}/>
                <StatRow label="Strength" value={record.stats?.strength ?? 0} onAdd={() => handleAllocate('strength')} canAdd={record.available_stat_points > 0} icon={<div className="w-1.5 h-1.5 rounded-full bg-orange-500"/>}/>
                <StatRow label="Intelligence" value={record.stats?.intelligence ?? 0} onAdd={() => handleAllocate('intelligence')} canAdd={record.available_stat_points > 0} icon={<div className="w-1.5 h-1.5 rounded-full bg-blue-500"/>}/>
                <StatRow label="Will" value={record.stats?.will ?? 0} onAdd={() => handleAllocate('will')} canAdd={record.available_stat_points > 0} icon={<div className="w-1.5 h-1.5 rounded-full bg-purple-500"/>}/>
                <StatRow label="Tenacity" value={record.stats?.tenacity ?? 0} onAdd={() => handleAllocate('tenacity')} canAdd={record.available_stat_points > 0} icon={<div className="w-1.5 h-1.5 rounded-full bg-yellow-500"/>}/>
              </div>
            </div>
          </div>

          {/* RIGHT: Genre Levels */}
          <div className="lg:col-span-8 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/50 border border-white/10 h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider">Genre Proficiency</h3>
                <span className="text-white/30 text-[10px] uppercase font-medium">Earn XP by playing games in these genres</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {record.genres
                  .slice()
                  .sort((a,b) => b.level - a.level) // Sort by highest level first
                  .map((g) => (
                    <GenreRow 
                        key={g.name} 
                        g={g} 
                        onDebugAdd={(amt) => addGenreXP(g.name, amt)} 
                    />
                  ))}
              </div>
            </div>
          </div>
        </div>
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
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => renderSlot(`armor-${i}`, <Shield className="w-4 h-4"/>))}
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

// --- Sub-components ---

const StatRow = ({ label, value, onAdd, canAdd, icon }) => (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors group">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-slate-300 font-medium text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-white font-bold">{value}</span>
        <button 
            disabled={!canAdd}
            onClick={onAdd}
            className={`
                w-6 h-6 rounded flex items-center justify-center transition-all
                ${canAdd 
                    ? 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-110' 
                    : 'bg-white/5 text-white/10 cursor-not-allowed'}
            `}
        >
            <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
);

const GenreRow = ({ g, onDebugAdd }) => {
    const nextLevelXP = xpToNextLevel(g.level || 1);
    const pct = Math.min(100, Math.round(((g.xp || 0) / nextLevelXP) * 100));
    
    return (
      <div className="p-3 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-bold text-sm">{g.name}</span>
          <Badge variant="outline" className="border-blue-500/30 text-blue-300 text-[10px] h-5">
             Lv. {g.level || 1}
          </Badge>
        </div>
        
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-1.5">
            <div 
                className="h-full bg-blue-500/80 rounded-full" 
                style={{ width: `${pct}%` }} 
            />
        </div>
        
        <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-500">{Math.round(g.xp || 0)} / {nextLevelXP} XP</span>
            
            {/* Hidden Debug Controls (visible on hover group) */}
            <div className="opacity-0 hover:opacity-100 transition-opacity flex gap-1">
                <button onClick={() => onDebugAdd(50)} className="text-[9px] text-white/20 hover:text-white border border-white/10 px-1 rounded">
                    +XP
                </button>
            </div>
        </div>
      </div>
    );
};