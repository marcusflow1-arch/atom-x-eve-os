import React, { useEffect, useState } from 'react';
import { TWELVESKY_SKILL_ROLES } from '../../twelvesky/modernizationData';
import { getBurstCharge, subscribeBurstCharge } from '../../twelvesky/burstChargeStore';

const ROLE_STYLE = {
  single: { label: 'SINGLE', color: '#fca5a5', bg: 'rgba(248,113,113,0.08)' },
  multi:  { label: 'MULTI',  color: '#93c5fd', bg: 'rgba(96,165,250,0.08)' },
  aoe:    { label: 'AOE',    color: '#c4b5fd', bg: 'rgba(167,139,250,0.08)' },
};

export default function CombatDoctrineSubTab() {
  const [charge, setCharge] = useState(() => getBurstCharge());
  useEffect(() => subscribeBurstCharge(setCharge), []);

  return (
    <div className="h-full overflow-y-auto px-8 py-7">
      <div className="flex items-start justify-between gap-8">
        <div className="max-w-3xl">
          <div className="text-[10px] tracking-[0.35em] uppercase text-rose-200/70">Classic Rhythm · Modern Input</div>
          <h2 className="text-2xl text-white font-semibold mt-1">Ten-Skill Combat Doctrine</h2>
          <p className="text-xs text-white/55 mt-2 leading-relaxed">
            Single-hit skills are burst finishers, multi-hit skills pressure one target, and area skills farm packs. Focus acts as the modern charge setup: cast it, then land a single-hit skill inside the charge window for a critical-style spike.
          </p>
        </div>
        <div className={`min-w-[210px] rounded-lg border px-4 py-3 ${charge.active ? 'border-amber-300/40 bg-amber-300/[0.08]' : 'border-white/10 bg-black/20'}`}>
          <div className="text-[9px] tracking-[0.25em] uppercase text-white/40">Burst Charge</div>
          <div className={`text-lg font-semibold mt-1 ${charge.active ? 'text-amber-200' : 'text-white/45'}`}>
            {charge.active ? 'PRIMED' : 'Not Primed'}
          </div>
          <div className="text-[10px] text-white/45 mt-1">
            {charge.active ? `${charge.multiplier}× next single-hit · ${(charge.remainingMs / 1000).toFixed(1)}s window` : 'Cast Focus to prime'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 mt-7">
        {TWELVESKY_SKILL_ROLES.map((skill) => {
          const style = ROLE_STYLE[skill.role];
          return (
            <div key={skill.slot} className="rounded-lg border border-white/10 p-3" style={{ background: style.bg }}>
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-md bg-black/30 border border-white/10 flex items-center justify-center text-white font-bold text-xs">
                  {skill.slot}
                </div>
                <span className="text-[8px] tracking-[0.2em] font-bold" style={{ color: style.color }}>{style.label}</span>
              </div>
              <div className="text-[11px] text-white/75 mt-3 leading-snug">{skill.intent}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-3 mt-6">
        <Rule title="Burst" text="Charge → Single = critical-style finisher. Charge is not consumed by Multi/AoE." />
        <Rule title="Pressure" text="Multi-hit skills trade burst for sustained target pressure and combo reliability." />
        <Rule title="Farm" text="AoE skills are the core leveling loop: gather monsters, clear the pack, keep moving." />
      </div>
    </div>
  );
}

function Rule({ title, text }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3">
      <div className="text-[9px] tracking-[0.2em] uppercase text-cyan-200/60">{title}</div>
      <div className="text-[11px] text-white/60 mt-1.5 leading-relaxed">{text}</div>
    </div>
  );
}
