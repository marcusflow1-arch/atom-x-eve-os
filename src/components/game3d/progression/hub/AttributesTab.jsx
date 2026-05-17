import React from 'react';
import { allocateStat, getPlayerHUD, setPlayerHUD } from '../../playerHUDStore';
import { computeDerivedStats } from '../../statsSystem';
import { getHaloBonuses } from '../haloStore';
import { getEquippedTitleBonuses } from '../titleStore';
import { STAT_SYNERGY } from '../weaponSynergyData';
import AttributeRow from './AttributeRow';

// New-World-style Attributes panel.
// Left: big "POINTS AVAILABLE" disc. Right: 5-row attribute allocation.
// Bottom strip: live offensive / defensive summary.
const ATTRIBUTES = [
  { key: 'strength',     label: 'Strength' },
  { key: 'dexterity',    label: 'Dexterity' },
  { key: 'intelligence', label: 'Intelligence' },
  { key: 'focus',        label: 'Focus' },
  { key: 'constitution', label: 'Constitution' },
];

// Manual refund — reduce a stat by 1 and return the point. Wraps the existing
// store directly because there's no refund API yet; safe-guards against going
// below 1 (default invested values).
function refundStat(statKey) {
  const hud = getPlayerHUD();
  const current = hud.baseStats?.[statKey] ?? 0;
  if (current <= 1) return false;
  const newBase = { ...hud.baseStats, [statKey]: current - 1 };
  // Pass halo (virtual attribute points) + title (flat final stats) through
  // the recompute so the Defense/Damage panels stay accurate after refund.
  const newDerived = computeDerivedStats(newBase, [], getHaloBonuses(), getEquippedTitleBonuses());
  setPlayerHUD({
    baseStats: newBase,
    unspentPoints: hud.unspentPoints + 1,
    derived: newDerived,
    maxHP: newDerived.maxHP,
    hp: Math.min(hud.hp, newDerived.maxHP),
  });
  return true;
}

export default function AttributesTab({ hud }) {
  const d = hud.derived || {};
  const canSpend = hud.unspentPoints > 0;

  return (
    <div className="flex h-full">
      {/* LEFT — points disc */}
      <div className="w-72 flex flex-col items-center pt-12 px-6 border-r border-white/5">
        <div
          className="relative w-48 h-48 rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle, rgba(255,216,107,0.10) 0%, transparent 70%)',
            border: '1px solid rgba(255,216,107,0.25)',
          }}
        >
          <div className="absolute inset-2 rounded-full border border-yellow-500/15" />
          <div className="text-center">
            <div className="text-6xl font-light text-amber-200 tabular-nums tracking-tight">
              {hud.unspentPoints}
            </div>
            <div className="mt-2 text-[10px] tracking-[0.35em] uppercase text-white/60">
              Points<br/>Available
            </div>
          </div>
        </div>

        <div className="mt-10 w-full space-y-2 text-[11px] text-white/65">
          <div className="flex justify-between"><span>Level</span><span className="text-white">{hud.level}</span></div>
          <div className="flex justify-between"><span>XP</span><span className="text-white">{hud.xp}/{hud.xpForNext}</span></div>
          <div className="flex justify-between"><span>Max HP</span><span className="text-white">{d.maxHP || 0}</span></div>
          <div className="flex justify-between"><span>Crit Chance</span><span className="text-white">{(d.critChance||0).toFixed(1)}%</span></div>
          <div className="flex justify-between"><span>Crit Defense</span><span className="text-white">{Math.round((d.criticalDefense||0)*100)}%</span></div>
        </div>
      </div>

      {/* RIGHT — allocation rows */}
      <div className="flex-1 min-w-0 px-8 pt-8 overflow-y-auto">
        {ATTRIBUTES.map((attr) => (
          <AttributeRow
            key={attr.key}
            label={attr.label}
            value={hud.baseStats?.[attr.key] ?? 0}
            synergy={STAT_SYNERGY[attr.key] || []}
            canSpend={canSpend}
            onAlloc={() => allocateStat(attr.key)}
            onRefund={() => refundStat(attr.key)}
          />
        ))}

        {/* Offensive / Defensive summary */}
        <div className="grid grid-cols-2 gap-6 mt-10 pt-6 border-t border-white/10">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-amber-300/80 mb-3">Offensive</div>
            <div className="space-y-1.5 text-xs text-white/75">
              <div className="flex justify-between border-b border-white/10 pb-1.5 mb-0.5">
                <span className="text-white/90 font-semibold">Total Damage</span>
                <span className="text-amber-200 font-semibold tabular-nums">{(d.totalDamage || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between"><span>Physical Damage</span><span className="text-white tabular-nums">{(d.physicalDamage || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Elemental Damage</span><span className="text-white tabular-nums">{(d.elementalDamage || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Crit Chance</span><span className="text-white">{(d.critChance||0).toFixed(1)}%</span></div>
              <div className="flex justify-between"><span>Crit Damage</span><span className="text-white">+{Math.round((d.criticalDamage||0)*100)}%</span></div>
              <div className="flex justify-between"><span>Attack Speed</span><span className="text-white">+{(d.attackSpeedPct||0).toFixed(1)}%</span></div>
              <div className="flex justify-between"><span>Skill Power</span><span className="text-white">+{(d.skillPowerPct||0).toFixed(1)}%</span></div>
              <div className="flex justify-between"><span>DoT / Elemental</span><span className="text-white">+{(d.dotDamagePct||0).toFixed(1)}%</span></div>
            </div>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-sky-300/80 mb-3">Defensive</div>
            <div className="space-y-1.5 text-xs text-white/75">
              <div className="flex justify-between border-b border-white/10 pb-1.5 mb-0.5">
                <span className="text-white/90 font-semibold">Max HP</span>
                <span className="text-sky-200 font-semibold tabular-nums">{(d.maxHP || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between"><span>Defense</span><span className="text-white tabular-nums">{Math.round(d.defense || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Crit Defense</span><span className="text-white">{Math.round((d.criticalDefense||0)*100)}%</span></div>
              <div className="flex justify-between"><span>HP Regen</span><span className="text-white">{(d.hpRegen||0).toFixed(1)}/s</span></div>
              <div className="flex justify-between"><span>Evasion</span><span className="text-white">{(d.evasionPct||0).toFixed(1)}%</span></div>
              <div className="flex justify-between"><span>Mana Regen</span><span className="text-white">{(d.manaRegen||0).toFixed(1)}/s</span></div>
              <div className="flex justify-between"><span>Cooldown Reduction</span><span className="text-white">{(d.cooldownReductionPct||0).toFixed(1)}%</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}