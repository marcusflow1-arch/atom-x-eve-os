import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, BarChart2, Backpack } from "lucide-react";
import { useEquipment } from "../luna/hooks/useEquipment";

const GENRES = ["RPG","FPS","Strategy","Action","MMO","Puzzle","Simulation","Sports"];
const BASE_XP = 100;
const XP_EXPONENT = 1.35;
const GENRE_TO_GLOBAL_RATIO = 0.3; // 30%

function xpToNextLevel(level) {
  return Math.round(BASE_XP * Math.pow(level || 1, XP_EXPONENT));
}

export default function AvatarProgressionBox() {
  const [user, setUser] = useState(null);
  const [record, setRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("stats");
  const { equippedItems } = useEquipment();

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
    })();
  }, []);

  const saveRecord = async (next) => {
    setSaving(true);
    const updated = await base44.entities.AvatarProgression.update(next.id, next);
    setRecord(updated);
    setSaving(false);
  };

  const handleAllocate = async (stat) => {
    if (!record || record.available_stat_points <= 0) return;
    const confirmed = window.confirm(`Allocate 1 point to ${stat}?`);
    if (!confirmed) return;
    const next = { ...record, stats: { ...record.stats }, available_stat_points: record.available_stat_points - 1 };
    if (stat === 'hp') next.stats.hp += 10; else next.stats[stat] = (next.stats[stat] || 0) + 1;
    await saveRecord(next);
  };

  const levelGlobalIfNeeded = (rec) => {
    let changed = false;
    let threshold = xpToNextLevel(rec.global_level || 1);
    while ((rec.global_xp || 0) >= threshold) {
      rec.global_xp -= threshold;
      rec.global_level = (rec.global_level || 1) + 1;
      threshold = xpToNextLevel(rec.global_level);
      changed = true;
    }
    return changed;
  };

  const addGenreXP = async (genreName, amount) => {
    if (!record) return;
    const next = { ...record, genres: record.genres.map(g => ({ ...g })) };
    const g = next.genres.find((x) => x.name === genreName);
    if (!g) return;
    g.xp = (g.xp || 0) + amount;

    next.global_xp = (next.global_xp || 0) + amount * GENRE_TO_GLOBAL_RATIO;

    let awarded = 0;
    while (g.xp >= xpToNextLevel(g.level || 1)) {
      g.xp -= xpToNextLevel(g.level || 1);
      g.level = (g.level || 1) + 1;
      awarded += 1;
      if ((g.level % 5) === 0) awarded += 1;
    }
    next.available_stat_points = (next.available_stat_points || 0) + awarded;

    levelGlobalIfNeeded(next);

    await saveRecord(next);
  };

  const handleBoxClick = (slotId) => {
    window.dispatchEvent(new CustomEvent('openInventoryPanel', { detail: { slotId } }));
  };

  const renderSlot = (slotId, shape = "rounded-xl") => {
    const equippedItem = equippedItems[slotId];
    return (
      <div 
        key={slotId} 
        onClick={() => handleBoxClick(slotId)}
        className={`w-[50px] h-[50px] ${shape} border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700`} 
        style={{ 
          background: 'rgba(11, 11, 11, 0.85)', 
          backdropFilter: 'blur(35px)', 
          WebkitBackdropFilter: 'blur(35px)', 
          borderColor: 'rgba(255, 255, 255, 0.12)', 
          boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' 
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        {equippedItem && (
          <img 
            src={equippedItem.icon_url || equippedItem.icon} 
            alt={equippedItem.name} 
            className="w-full h-full object-contain p-1.5 relative z-10" 
          />
        )}
      </div>
    );
  };

  if (!user || !record) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-white/70">Loading avatar progression...</div>
    );
  }

  const globalThreshold = xpToNextLevel(record.global_level || 1);
  const globalPct = Math.min(100, Math.round(((record.global_xp || 0) / globalThreshold) * 100));

  const StatRow = ({ label, value, onAdd }) => (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5 border border-white/10">
      <div className="text-white/80 font-medium">{label}</div>
      <div className="flex items-center gap-2">
        <Badge className="bg-black/40 border-white/10 text-white">{value}</Badge>
        {record.available_stat_points > 0 && (
          <Button size="sm" onClick={onAdd} className="bg-cyan-600 hover:bg-cyan-700 h-8 px-2">
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );

  const GenreRow = ({ g }) => {
    const pct = Math.min(100, Math.round(((g.xp || 0) / xpToNextLevel(g.level || 1)) * 100));
    return (
      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold">{g.name}</span>
            <Badge className="bg-blue-600 text-white border-none">Lv. {g.level || 1}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => addGenreXP(g.name, 25)}>+25 XP</Button>
            <Button size="sm" variant="outline" onClick={() => addGenreXP(g.name, 100)}>+100 XP</Button>
          </div>
        </div>
        <Progress value={pct} className="h-2" />
        <div className="text-xs text-white/60 mt-1">{Math.round(g.xp || 0)} / {xpToNextLevel(g.level || 1)} XP</div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">AI Avatar Progression</h2>
          <p className="text-white/60 text-sm">Genre levels, stat points, and growth.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
            <button
              onClick={() => setActiveTab("stats")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === "stats" 
                  ? "bg-white/10 text-white shadow-sm" 
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              AI Stats
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === "inventory" 
                  ? "bg-white/10 text-white shadow-sm" 
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              <Backpack className="w-4 h-4" />
              Inventory
            </button>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-600 text-white border-none">Global Lv. {record.global_level || 1}</Badge>
            <div className="w-56">
              <Progress value={globalPct} className="h-2" />
              <div className="text-[11px] text-white/60 mt-1">{Math.round(record.global_xp || 0)} / {globalThreshold} XP</div>
            </div>
          </div>
        </div>
      </div>

      {activeTab === "stats" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-3">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">Core Stats</h3>
                <Badge className="bg-purple-600 text-white border-none">Points: {record.available_stat_points || 0}</Badge>
              </div>
              <div className="space-y-2">
                <StatRow label="HP" value={record.stats?.hp ?? 0} onAdd={() => handleAllocate('hp')} />
                <StatRow label="Strength" value={record.stats?.strength ?? 0} onAdd={() => handleAllocate('strength')} />
                <StatRow label="Intelligence" value={record.stats?.intelligence ?? 0} onAdd={() => handleAllocate('intelligence')} />
                <StatRow label="Will" value={record.stats?.will ?? 0} onAdd={() => handleAllocate('will')} />
                <StatRow label="Tenacity" value={record.stats?.tenacity ?? 0} onAdd={() => handleAllocate('tenacity')} />
              </div>
              {saving && <div className="text-xs text-white/50 mt-3">Saving...</div>}
            </div>
          </div>

          <div className="md:col-span-2 space-y-3">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">Genre Levels</h3>
                <span className="text-white/50 text-xs">30% of genre XP adds to global</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {record.genres
                  .slice()
                  .sort((a,b) => GENRES.indexOf(a.name) - GENRES.indexOf(b.name))
                  .map((g) => (
                    <GenreRow key={g.name} g={g} />
                  ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="flex flex-col gap-8 items-center">
            {/* Top Row: Armor, Weapons, Genre */}
            <div className="flex flex-wrap gap-12 justify-center items-start">
              {/* Armor - 3x3 Grid */}
              <div className="flex flex-col items-center gap-4">
                <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Armor</h2>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => renderSlot(`armor-${i}`))}
                </div>
              </div>

              {/* Weapons & Genre Group */}
              <div className="flex gap-8 items-start">
                {/* Weapons */}
                <div className="flex flex-col items-center gap-4">
                  <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Weapons</h2>
                  <div className="flex gap-3">
                    {[1, 2, 3].map((i) => renderSlot(`weapon-${i}`))}
                  </div>
                </div>

                {/* Genre */}
                <div className="flex flex-col items-center gap-4">
                  <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Genre</h2>
                  <div className="flex gap-3">
                    {[1, 2].map((i) => renderSlot(`genre-${i}`))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Aspects, Artifacts, More Genre */}
            <div className="flex flex-wrap gap-12 justify-center items-start">
              {/* Aspects */}
              <div className="flex flex-col items-center gap-4">
                <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Aspects</h2>
                <div className="flex gap-3">
                  {[1, 2, 3].map((i) => renderSlot(`aspect-${i}`, "rounded-full"))}
                </div>
              </div>

              {/* Artifacts */}
              <div className="flex flex-col items-center gap-4">
                <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Artifacts</h2>
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((i) => renderSlot(`artifact-${i}`))}
                </div>
              </div>

              {/* Extra Genre Slots */}
              <div className="flex flex-col items-center gap-4">
                <h2 className="text-[10px] font-light tracking-[0.35em] uppercase text-[#9A9A9A]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Genre</h2>
                <div className="flex gap-3">
                  {[3, 4].map((i) => renderSlot(`genre-${i}`))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}