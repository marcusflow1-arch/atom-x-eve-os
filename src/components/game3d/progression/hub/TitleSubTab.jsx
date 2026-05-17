import React, { useEffect, useState } from 'react';
import { subscribeTitles, equipTitle, unequipTitle } from '../titleStore';
import { MAX_TITLE_LEVEL } from '../titleData';

export default function TitleSubTab() {
  const [titles, setTitles] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => subscribeTitles((s) => {
    setTitles(s);
    if (!selectedId && s.equippedPathId) setSelectedId(s.equippedPathId);
    else if (!selectedId) setSelectedId(Object.keys(s.paths)[0]);
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!titles || !selectedId) return null;
  const path = titles.paths[selectedId];
  const isEquipped = titles.equippedPathId === selectedId;

  return (
    <div className="flex h-full">
      {/* LEFT — path list */}
      <div className="w-72 border-r border-white/5 px-4 pt-6 overflow-y-auto">
        <div className="text-[10px] tracking-[0.3em] uppercase text-white/40 px-2 mb-3">
          Title Paths
        </div>
        {Object.values(titles.paths).map((p) => {
          const active = p.id === selectedId;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className="w-full text-left p-3 mb-2 rounded-md border transition-all"
              style={{
                background: active ? 'rgba(255,216,107,0.06)' : 'rgba(255,255,255,0.02)',
                borderColor: active ? 'rgba(255,216,107,0.35)' : 'rgba(255,255,255,0.05)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{p.name}</div>
                  <div className="text-[10px] tracking-[0.2em] uppercase text-white/50 mt-0.5">
                    Lv {p.level} · {p.rarity.rarity}
                  </div>
                </div>
                {titles.equippedPathId === p.id && (
                  <span className="text-[9px] tracking-[0.2em] text-amber-300 uppercase">Eq</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* RIGHT — detail */}
      <div className="flex-1 min-w-0 px-10 pt-8 overflow-y-auto">
        <div className="flex items-start gap-4">
          <div
            className="w-20 h-20 rounded-md flex items-center justify-center text-4xl"
            style={{
              background: `${path.rarity.glow}`,
              border: `1px solid ${path.rarity.color}55`,
            }}
          >
            {path.icon}
          </div>
          <div className="flex-1">
            <div className="text-xl font-semibold text-white tracking-wide">{path.name}</div>
            <div
              className="text-[10px] tracking-[0.3em] uppercase mt-1"
              style={{ color: path.rarity.color }}
            >
              {path.rarity.rarity} · Level {path.level} / {MAX_TITLE_LEVEL}
            </div>
            <div className="text-xs text-white/60 mt-3 max-w-lg">{path.description}</div>
          </div>
          <button
            onClick={() => (isEquipped ? unequipTitle() : equipTitle(path.id))}
            className="px-4 py-2 rounded-sm text-[11px] tracking-[0.3em] uppercase font-semibold"
            style={{
              background: isEquipped ? 'rgba(251,113,133,0.10)' : 'rgba(255,216,107,0.10)',
              border: `1px solid ${isEquipped ? 'rgba(251,113,133,0.4)' : 'rgba(255,216,107,0.45)'}`,
              color: isEquipped ? '#fb7185' : '#ffd86b',
            }}
          >
            {isEquipped ? 'Unequip' : 'Equip Title'}
          </button>
        </div>

        {/* Progress to next level */}
        <div className="mt-8">
          <div className="flex justify-between text-[10px] tracking-[0.25em] uppercase text-white/50 mb-2">
            <span>{path.isMaxLevel ? 'Mastered' : `Progress to Lv ${path.level + 1}`}</span>
            <span>{path.isMaxLevel ? '—' : `${path.killsIntoLevel.toLocaleString()} / ${path.killsForNextLevel.toLocaleString()}`}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full"
              style={{
                width: `${path.isMaxLevel ? 100 : Math.min(100, (path.killsIntoLevel / Math.max(1, path.killsForNextLevel)) * 100)}%`,
                background: `linear-gradient(90deg, ${path.rarity.color}, #ffd86b)`,
              }}
            />
          </div>
          <div className="text-[10px] text-white/40 mt-1">
            Total kills tracked: {path.totalKills.toLocaleString()}
          </div>
        </div>

        {/* Current vs next bonuses */}
        <div className="grid grid-cols-2 gap-6 mt-8">
          <BonusBlock title="Current Bonuses" bonuses={path.bonuses} accent={path.rarity.color} />
          {!path.isMaxLevel && (
            <BonusBlock title={`At Level ${path.level + 1}`} bonuses={path.nextLevelBonuses} accent="#6ec3ff" />
          )}
        </div>
      </div>
    </div>
  );
}

function BonusBlock({ title, bonuses, accent }) {
  if (!bonuses) return null;
  return (
    <div>
      <div className="text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: accent }}>
        {title}
      </div>
      <div className="space-y-1.5 text-xs text-white/75">
        <Row k="Max HP"       v={`+${(bonuses.hp || 0).toLocaleString()}`} />
        <Row k="Damage"       v={`+${(bonuses.damage || 0).toLocaleString()}`} />
        <Row k="Defense"      v={`+${(bonuses.defense || 0).toLocaleString()}`} />
        <Row k="Crit Chance"  v={`+${(bonuses.critChance || 0).toFixed(1)}%`} />
        <Row k="Crit Damage"  v={`+${Math.round((bonuses.critDamage || 0) * 100)}%`} />
        <Row k="Crit Defense" v={`+${Math.round((bonuses.criticalDefense || 0) * 100)}%`} />
      </div>
      <div className="text-[9px] tracking-[0.25em] uppercase text-white/30 mt-3">
        Flat final stats · not attribute-scaled
      </div>
    </div>
  );
}

const Row = ({ k, v }) => (
  <div className="flex justify-between border-b border-white/5 py-1.5">
    <span>{k}</span>
    <span className="text-white tabular-nums">{v}</span>
  </div>
);