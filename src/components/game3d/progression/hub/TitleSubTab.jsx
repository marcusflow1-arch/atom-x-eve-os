import React, { useEffect, useMemo, useState } from 'react';
import { Check, Coins, RotateCcw, Sparkles } from 'lucide-react';
import {
  subscribeTitles,
  selectTitleType,
  upgradeTitle,
  resetTitle,
  unequipTitle,
  equipTitle,
  setTitleLevel,
} from '../titleStore';
import { subscribeContribution } from '../contributionStore';
import { MAX_TITLE_LEVEL } from '../titleData';
import MaxOutButton from './devMaxOut';

const Glass = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl ${className}`}>{children}</div>
);

export default function TitleSubTab() {
  const [title, setTitle] = useState(null);
  const [cp, setCp] = useState(0);
  const [notice, setNotice] = useState('');

  useEffect(() => subscribeTitles(setTitle), []);
  useEffect(() => subscribeContribution((s) => setCp(s.cp)), []);

  const current = title?.bonuses;
  const next = title?.nextBonuses;
  const canUpgrade = title && !title.isMaxLevel && cp >= title.nextCost;
  const stageCells = useMemo(() => Array.from({ length: MAX_TITLE_LEVEL }, (_, i) => i + 1), []);

  if (!title) return null;

  const flash = (text) => {
    setNotice(text);
    window.setTimeout(() => setNotice(''), 1600);
  };

  const handleUpgrade = () => {
    const result = upgradeTitle();
    flash(result.ok ? `Title advanced to Rank ${result.stage}` : result.reason);
  };

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-[10px] tracking-[0.34em] uppercase text-cyan-100/45">Contribution Title</div>
            <div className="mt-1 text-2xl font-semibold text-white">{title.type.name} · Rank {title.stage}</div>
            <p className="mt-1 text-xs text-white/45 max-w-2xl">
              Choose a title path once, then spend CP to advance it. The original palace trip is removed; the rules stay intact.
            </p>
          </div>
          <Glass className="px-4 py-3 flex items-center gap-3 shrink-0">
            <Coins className="w-4 h-4 text-amber-300" />
            <div>
              <div className="text-[9px] tracking-[0.25em] uppercase text-white/35">Contribution</div>
              <div className="text-lg font-semibold tabular-nums text-white">{cp.toLocaleString()} CP</div>
            </div>
          </Glass>
        </div>

        <Glass className="p-3">
          <div className="grid grid-cols-5 gap-2">
            {title.types.map((type) => {
              const active = type.id === title.typeId;
              const locked = title.stage > 0 && !active;
              return (
                <button
                  key={type.id}
                  disabled={locked}
                  onClick={() => {
                    const result = selectTitleType(type.id);
                    if (!result.ok) flash(result.reason);
                  }}
                  className={`rounded-xl border px-3 py-3 text-left transition-all ${
                    active
                      ? 'border-cyan-200/35 bg-cyan-200/10'
                      : 'border-white/5 bg-white/[0.025] hover:bg-white/5 disabled:opacity-25 disabled:hover:bg-white/[0.025]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg" style={{ color: type.color }}>{type.icon}</span>
                    {active && <Check className="w-3.5 h-3.5 text-cyan-200" />}
                  </div>
                  <div className="mt-2 text-xs font-semibold text-white">{type.name}</div>
                  <div className="mt-1 text-[10px] leading-relaxed text-white/35">{type.description}</div>
                </button>
              );
            })}
          </div>
        </Glass>

        <Glass className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-white/35">Ranks 1–12</div>
              <div className="text-xs text-white/50 mt-1">Each completed rank also grants +1% Attribution ATK and +1% Attribution DEF.</div>
            </div>
            <div className="text-right text-[10px] text-white/35">Spent {title.totalCpSpent.toLocaleString()} CP</div>
          </div>

          <div className="grid grid-cols-12 gap-1.5 mt-4">
            {stageCells.map((stage) => {
              const complete = stage <= title.stage;
              const currentStage = stage === title.stage;
              return (
                <div
                  key={stage}
                  className={`h-11 rounded-lg border flex items-center justify-center text-xs font-semibold tabular-nums ${
                    complete ? 'border-cyan-200/25 bg-cyan-200/10 text-cyan-50' : 'border-white/5 bg-white/[0.025] text-white/25'
                  } ${currentStage ? 'ring-1 ring-cyan-200/50' : ''}`}
                >
                  {stage}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-5">
            <StatPanel title="Current" bonuses={current} stage={title.stage} />
            <StatPanel title={title.isMaxLevel ? 'Maximum Reached' : `Next · Rank ${title.stage + 1}`} bonuses={next || current} stage={title.isMaxLevel ? title.stage : title.stage + 1} muted={title.isMaxLevel} />
          </div>

          <div className="mt-5 flex items-center gap-2">
            <button
              onClick={handleUpgrade}
              disabled={title.isMaxLevel}
              className="px-4 py-2.5 rounded-xl border border-cyan-200/25 bg-cyan-200/10 text-cyan-50 text-xs font-semibold hover:bg-cyan-200/15 disabled:opacity-30 transition"
            >
              {title.isMaxLevel ? 'Rank 12 Complete' : `Advance · ${title.nextCost.toLocaleString()} CP`}
            </button>
            {!title.isMaxLevel && !canUpgrade && <span className="text-[10px] text-amber-200/55">Need {(title.nextCost - cp).toLocaleString()} more CP</span>}
            <button
              onClick={() => (title.enabled ? unequipTitle() : equipTitle())}
              className="ml-auto px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.035] text-white/55 text-xs hover:text-white transition"
            >
              {title.enabled ? 'Disable Bonus' : 'Enable Bonus'}
            </button>
          </div>
        </Glass>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => {
              const result = resetTitle(0.7);
              flash(`Title reset · ${result.refund.toLocaleString()} CP returned`);
            }}
            className="flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase text-white/35 hover:text-white/70 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset title · 70% CP recovery
          </button>
          <MaxOutButton
            accent="#67e8f9"
            label="Max Title"
            onClick={() => setTitleLevel(title.typeId, MAX_TITLE_LEVEL)}
            title="Editor only — set selected title to Rank 12"
          />
        </div>

        {notice && (
          <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[120] px-4 py-2 rounded-full border border-white/10 bg-black/70 backdrop-blur-xl text-xs text-white shadow-2xl">
            {notice}
          </div>
        )}
      </div>
    </div>
  );
}

function StatPanel({ title, bonuses, stage, muted = false }) {
  if (!bonuses) return null;
  return (
    <div className={`rounded-xl border border-white/7 bg-white/[0.025] p-4 ${muted ? 'opacity-45' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="text-[10px] tracking-[0.24em] uppercase text-white/35">{title}</div>
        <Sparkles className="w-3.5 h-3.5 text-cyan-200/50" />
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-2 mt-3 text-xs">
        <Row label="Strength" value={bonuses.strength} />
        <Row label="Agility" value={bonuses.agility} />
        <Row label="Vitality" value={bonuses.vitality} />
        <Row label="Spirit" value={bonuses.spirit} />
        <Row label="Attribute ATK" value={`${stage}%`} />
        <Row label="Attribute DEF" value={`${stage}%`} />
      </div>
    </div>
  );
}

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
    <span className="text-white/40">{label}</span>
    <span className="text-white tabular-nums">+{value}</span>
  </div>
);
