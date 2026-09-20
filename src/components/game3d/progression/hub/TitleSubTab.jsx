import React, { useEffect, useState } from 'react';
import {
  advanceTitleStage,
  subscribeTitles,
  equipTitle,
  unequipTitle,
  setTitleDisplayHidden,
  setTitleLevel,
} from '../titleStore';
import { MAX_TITLE_LEVEL } from '../titleData';
import MaxOutButton from './devMaxOut';

export default function TitleSubTab() {
  const [titles, setTitles] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [lastResult, setLastResult] = useState(null);

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
      <div className="w-72 border-r border-white/5 px-4 pt-6 overflow-y-auto">
        <div className="text-[10px] tracking-[0.3em] uppercase text-white/40 px-2 mb-3">
          Title Specializations
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
                    Stage {p.level} / {MAX_TITLE_LEVEL} · {p.rarity.rarity}
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

      <div className="flex-1 min-w-0 px-10 pt-8 overflow-y-auto">
        <div className="flex items-start gap-4">
          <div
            className="w-20 h-20 rounded-md flex items-center justify-center text-4xl"
            style={{ background: path.rarity.glow, border: `1px solid ${path.rarity.color}55` }}
          >
            {path.icon}
          </div>
          <div className="flex-1">
            <div className="text-xl font-semibold text-white tracking-wide">{path.name}</div>
            <div className="text-[10px] tracking-[0.3em] uppercase mt-1" style={{ color: path.rarity.color }}>
              {path.rarity.rarity} · Stage {path.level} / {MAX_TITLE_LEVEL}
            </div>
            <div className="text-xs text-white/60 mt-3 max-w-lg">{path.description}</div>
          </div>
          <div className="flex flex-col gap-2">
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
            <button
              onClick={() => setTitleDisplayHidden(!titles.displayHidden)}
              className="px-4 py-2 rounded-sm border border-white/10 bg-white/[0.04] text-[10px] uppercase tracking-widest text-white/55"
            >
              {titles.displayHidden ? 'Show Name Title' : 'Hide Name Title'}
            </button>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-3 gap-4">
          <Stat label="Contribution Points" value={titles.contributionPoints.toLocaleString()} />
          <Stat label="Next Stage Cost" value={path.isMaxLevel ? 'MAX' : path.nextStageCost.toLocaleString()} />
          <Stat label="Tracked Progress" value={path.totalProgressPoints.toLocaleString()} />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => {
              const result = advanceTitleStage(path.id);
              setLastResult(result);
            }}
            disabled={!path.canAdvance || path.isMaxLevel}
            className="rounded-sm border border-amber-300/30 bg-amber-300/[0.08] px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-100 disabled:opacity-30"
          >
            {path.isMaxLevel ? 'Title Mastered' : 'Advance Stage'}
          </button>
          <MaxOutButton
            accent={path.rarity.color}
            label={`Max ${path.name}`}
            onClick={() => {
              setTitleLevel(selectedId, MAX_TITLE_LEVEL);
              if (!isEquipped) equipTitle(path.id);
            }}
            title="Editor only — max out this title path + equip it"
          />
          {lastResult && (
            <span className="text-xs text-white/50">
              {lastResult.ok ? `Advanced to Stage ${lastResult.level}` : lastResult.reason}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6 mt-8">
          <BonusBlock
            title="Current Bonuses"
            attr={path.attributeBonuses}
            flat={path.bonuses}
            accent={path.rarity.color}
          />
          {!path.isMaxLevel && (
            <BonusBlock
              title={`At Stage ${path.level + 1}`}
              attr={path.nextLevelAttributeBonuses}
              flat={path.nextLevelBonuses}
              accent="#6ec3ff"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function BonusBlock({ title, attr, flat, accent }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: accent }}>{title}</div>
      <div className="space-y-1.5 text-xs text-white/75">
        <Row k="Strength" v={`+${attr?.strength || 0}`} />
        <Row k="Vitality" v={`+${attr?.constitution || 0}`} />
        <Row k="Dexterity" v={`+${attr?.dexterity || 0}`} />
        <Row k="Spirit" v={`+${attr?.focus || 0}`} />
        <Row k="Max HP" v={`+${(flat?.hp || 0).toLocaleString()}`} />
        <Row k="Chi" v={`+${(flat?.chi || 0).toLocaleString()}`} />
        <Row k="Damage" v={`+${(flat?.damage || 0).toLocaleString()}`} />
        <Row k="Defense" v={`+${(flat?.defense || 0).toLocaleString()}`} />
        <Row k="Crit Chance" v={`+${(flat?.critChance || 0).toFixed(1)}%`} />
      </div>
    </div>
  );
}

const Stat = ({ label, value }) => (
  <div className="rounded-sm border border-white/5 bg-white/[0.03] px-4 py-3">
    <div className="text-[9px] uppercase tracking-[0.25em] text-white/40">{label}</div>
    <div className="mt-1 text-xl font-light tabular-nums text-white">{value}</div>
  </div>
);

const Row = ({ k, v }) => (
  <div className="flex justify-between border-b border-white/5 py-1.5">
    <span>{k}</span>
    <span className="text-white tabular-nums">{v}</span>
  </div>
);
