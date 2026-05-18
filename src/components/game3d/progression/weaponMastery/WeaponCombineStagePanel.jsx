// ─── WeaponCombineStagePanel ──────────────────────────────────────────────
// Stage-merge UI shown beneath the Enchantment ring once the weapon is at
// (or near) MAX_LEVEL. Player sacrifices a duplicate copy of the same
// max-level weapon to advance Combine Stage 1..5. Each stage:
//   • adds a flat ATK floor
//   • multiplies post-enchant ATK
//   • boosts elemental damage
//   • lights up another stage pip on the row
//
// All math + persistence lives in enchantmentStore.

import React from 'react';
import { Star, GitMerge } from 'lucide-react';
import {
  MAX_COMBINE_STAGE,
  getCombineCost,
  getDerivedStats,
  attemptCombineStage,
} from './enchantmentStore';

export default function WeaponCombineStagePanel({ weaponId, weaponName, entry, accent, stash }) {
  const stage = entry.combineStage || 0;
  const atMaxStage = stage >= MAX_COMBINE_STAGE;

  const cost = atMaxStage ? null : getCombineCost(stage);
  const nextStats = getDerivedStats(entry.level, stage + 1);
  const curStats = getDerivedStats(entry.level, stage);

  const hasCopies = (stash.duplicates?.[weaponId] || 0) >= (cost?.copies || 1);
  const hasGold = stash.gold >= (cost?.gold || 0);
  const hasCatalyst = (stash[cost?.catalyst.key] || 0) >= (cost?.catalyst.count || 0);

  const canCombine = !atMaxStage && hasCopies && hasGold && hasCatalyst;

  const onCombine = () => {
    if (!canCombine) return;
    attemptCombineStage(weaponId);
  };

  return (
    <div
      className="mt-4 px-4 py-3 rounded-sm"
      style={{
        background: 'linear-gradient(90deg, rgba(30,20,42,0.7) 0%, rgba(10,8,18,0.85) 100%)',
        border: `1px solid ${accent}55`,
        boxShadow: `0 0 18px ${accent}22, inset 0 0 18px rgba(0,0,0,0.5)`,
      }}
    >
      {/* Header row — title + stage pips */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <GitMerge className="w-3.5 h-3.5" style={{ color: accent }} />
          <span className="text-[10px] tracking-[0.35em] uppercase font-semibold text-white">
            Combine Stage
          </span>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: MAX_COMBINE_STAGE }).map((_, i) => {
            const lit = i < stage;
            return (
              <Star
                key={i}
                className="w-3.5 h-3.5"
                style={{
                  color: lit ? '#fde047' : 'rgba(255,255,255,0.18)',
                  fill: lit ? '#fde047' : 'transparent',
                  filter: lit ? 'drop-shadow(0 0 4px #fde04788)' : 'none',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Body — preview of stage bonus, OR maxed message */}
      {atMaxStage ? (
        <div className="text-[11px] text-amber-200/90 py-1.5 tracking-[0.15em] uppercase">
          Maximum Combine Stage Reached · Apex Form
        </div>
      ) : (
        <>
          {/* Stage delta — current → next stage stats */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] mb-3">
            <div className="flex items-center justify-between">
              <span className="text-white/55 tracking-[0.15em] uppercase text-[9px]">ATK</span>
              <div className="tabular-nums">
                <span className="text-white/75">{curStats.atk}</span>
                <span className="text-white/30 mx-1">›</span>
                <span className="font-semibold" style={{ color: accent }}>{nextStats.atk}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/55 tracking-[0.15em] uppercase text-[9px]">Element</span>
              <div className="tabular-nums">
                <span className="text-white/75">{curStats.elementDmg}</span>
                <span className="text-white/30 mx-1">›</span>
                <span className="font-semibold" style={{ color: accent }}>{nextStats.elementDmg}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/55 tracking-[0.15em] uppercase text-[9px]">Crit Rate</span>
              <div className="tabular-nums">
                <span className="text-white/75">{curStats.critRatePct}%</span>
                <span className="text-white/30 mx-1">›</span>
                <span className="font-semibold" style={{ color: accent }}>{nextStats.critRatePct}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/55 tracking-[0.15em] uppercase text-[9px]">Crit Dmg</span>
              <div className="tabular-nums">
                <span className="text-white/75">{curStats.critDmgPct}%</span>
                <span className="text-white/30 mx-1">›</span>
                <span className="font-semibold" style={{ color: accent }}>{nextStats.critDmgPct}%</span>
              </div>
            </div>
          </div>

          {/* Cost row — sacrifice copy + catalyst + gold + button */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[10px] tracking-[0.15em] uppercase">
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-sm"
                style={{
                  background: hasCopies ? 'rgba(45,212,191,0.10)' : 'rgba(244,63,94,0.10)',
                  border: hasCopies ? '1px solid rgba(45,212,191,0.40)' : '1px solid rgba(244,63,94,0.40)',
                  color: hasCopies ? '#a7f3d0' : '#fda4af',
                }}
              >
                <GitMerge className="w-3 h-3" />
                {stash.duplicates?.[weaponId] || 0}/{cost.copies} · {weaponName}
              </div>
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-sm tabular-nums"
                style={{
                  background: hasCatalyst ? 'rgba(168,85,247,0.10)' : 'rgba(244,63,94,0.10)',
                  border: hasCatalyst ? '1px solid rgba(168,85,247,0.40)' : '1px solid rgba(244,63,94,0.40)',
                  color: hasCatalyst ? '#e9d5ff' : '#fda4af',
                }}
              >
                💠 {stash[cost.catalyst.key] || 0}/{cost.catalyst.count}
              </div>
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-sm tabular-nums"
                style={{
                  background: hasGold ? 'rgba(245,210,122,0.10)' : 'rgba(244,63,94,0.10)',
                  border: hasGold ? '1px solid rgba(245,210,122,0.40)' : '1px solid rgba(244,63,94,0.40)',
                  color: hasGold ? '#fde68a' : '#fda4af',
                }}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-amber-200 to-amber-500" />
                {cost.gold.toLocaleString()}
              </div>
            </div>

            <button
              onClick={onCombine}
              disabled={!canCombine}
              className="px-5 py-2 text-[11px] tracking-[0.4em] uppercase font-semibold transition-all"
              style={{
                background: canCombine
                  ? 'linear-gradient(180deg, rgba(168,85,247,0.85) 0%, rgba(124,58,237,0.85) 100%)'
                  : 'rgba(40,40,46,0.85)',
                color: canCombine ? '#fff' : 'rgba(255,255,255,0.35)',
                border: canCombine ? '1px solid rgba(168,85,247,0.7)' : '1px solid rgba(255,255,255,0.10)',
                boxShadow: canCombine
                  ? '0 0 18px rgba(168,85,247,0.35), inset 0 1px 0 rgba(255,255,255,0.15)'
                  : 'inset 0 0 12px rgba(0,0,0,0.6)',
                cursor: canCombine ? 'pointer' : 'not-allowed',
              }}
            >
              Combine → Stage {stage + 1}
            </button>
          </div>
        </>
      )}
    </div>
  );
}