import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Minus, Sparkles, ChevronRight } from "lucide-react";

const GENRES = ["RPG","FPS","Strategy","Action","MMO","Puzzle","Simulation","Sports"];
const BASE_XP = 100;
const XP_EXPONENT = 1.35;
const GENRE_TO_GLOBAL_RATIO = 0.3; // 30%

function xpToNextLevel(level) {
  return Math.round(BASE_XP * Math.pow(level || 1, XP_EXPONENT));
}

export default function AvatarProgression() {
  const [user, setUser] = useState(null);
  const [record, setRecord] = useState(null);
  const [saving, setSaving] = useState(false);

  // Ensure genres exist in record
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

    // Global XP contribution
    next.global_xp = (next.global_xp || 0) + amount * GENRE_TO_GLOBAL_RATIO;

    // Level up loop for genre
    let awarded = 0;
    while (g.xp >= xpToNextLevel(g.level || 1)) {
      g.xp -= xpToNextLevel(g.level || 1);
      g.level = (g.level || 1) + 1;
      awarded += 1;
      if ((g.level % 5) === 0) awarded += 1; // bonus every 5 levels
    }
    next.available_stat_points = (next.available_stat_points || 0) + awarded;

    // Check global level ups
    levelGlobalIfNeeded(next);

    await saveRecord(next);
  };

  if (!user || !record) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/70">Loading avatar progression...</div>
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
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">AI Avatar Progression</h1>
            <p className="text-white/60 text-sm">Track genre levels, allocate stat points, and grow your avatar.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-600 text-white border-none">Global Lv. {record.global_level || 1}</Badge>
            <div className="w-56">
              <Progress value={globalPct} className="h-2" />
              <div className="text-[11px] text-white/60 mt-1">{Math.round(record.global_xp || 0)} / {globalThreshold} XP</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Stats */}
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

          {/* Right: Genres */}
          <div className="md:col-span-2 space-y-3">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">Genre Levels</h3>
                <span className="text-white/50 text-xs">30% of genre XP contributes to global level</span>
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

        <div className="text-white/40 text-xs">Tip: On the Luna dashboard, press the I key to open this panel.</div>
      </div>
    </div>
  );
}