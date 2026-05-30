import React, { useState } from 'react';
import { Minus, Plus, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { WEAPONS, getWeaponName } from '../weaponSynergyData';
import { applyDiminishingReturns } from './attributeSpecializationConfig';

export default function AttributeRow({
  label, value, synergy, canSpend, onAlloc, onRefund,
  attrConfig, specialization, onSpecChange,
}) {
  const [expanded, setExpanded] = useState(false);
  const [synergyHover, setSynergyHover] = useState(false);

  const tiers = (synergy || []).reduce((acc, s) => {
    (acc[s.tier] = acc[s.tier] || []).push(s.weaponId);
    return acc;
  }, {});

  const color = attrConfig?.color || '#ffffff';
  const effectivePoints = Math.round(applyDiminishingReturns(value));

  return (
    <div className="border-b border-white/5">
      {/* Main row */}
      <div className="flex items-center gap-3 py-3">
        {/* -/+ controls */}
        <button
          onClick={onRefund}
          className="w-8 h-8 rounded-sm bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.08] transition flex-shrink-0"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <div className="w-10 text-center text-2xl font-semibold tracking-tight text-white tabular-nums flex-shrink-0">
          {value}
        </div>
        <button
          onClick={onAlloc}
          disabled={!canSpend}
          className="w-8 h-8 rounded-sm bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        {/* Icon + Label */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition"
        >
          {attrConfig?.icon && (
            <span className="text-base leading-none">{attrConfig.icon}</span>
          )}
          <div className="text-left">
            <div className="text-[12px] tracking-[0.22em] font-semibold uppercase" style={{ color }}>
              {label}
            </div>
            {attrConfig && (
              <div className="text-[9px] text-white/35 tracking-wide">{attrConfig.abbr}</div>
            )}
          </div>
          {attrConfig && (
            expanded
              ? <ChevronUp className="w-3.5 h-3.5 text-white/40 ml-1" />
              : <ChevronDown className="w-3.5 h-3.5 text-white/40 ml-1" />
          )}
        </button>

        {/* Active specialization badge */}
        {specialization && attrConfig && (
          <div
            className="ml-1 px-2 py-0.5 rounded text-[9px] tracking-wide font-medium flex-shrink-0"
            style={{ background: `${color}18`, border: `1px solid ${color}35`, color }}
          >
            {attrConfig.specializations.find(s => s.id === specialization)?.label || specialization}
          </div>
        )}

        {/* Weapon synergy strip */}
        <div
          className="flex-1 relative flex items-center gap-1.5 justify-end flex-wrap min-h-[28px]"
          onMouseEnter={() => setSynergyHover(true)}
          onMouseLeave={() => setSynergyHover(false)}
        >
          {(synergy || []).slice(0, 6).map((s) => {
            const w = WEAPONS.find((x) => x.id === s.weaponId);
            return (
              <span
                key={s.weaponId}
                className="w-5 h-5 rounded-sm flex items-center justify-center text-xs grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition"
                title={`${w?.name} — ${s.tier} Tier`}
              >
                {w?.icon}
              </span>
            );
          })}
          {(synergy || []).length > 0 && <span className="text-amber-400/60 text-[10px]">⓵</span>}

          {synergyHover && (synergy || []).length > 0 && (
            <div
              className="absolute right-0 top-full mt-2 z-20 w-52 p-3 rounded-lg text-xs space-y-2"
              style={{
                background: 'rgba(8,12,18,0.96)',
                border: '1px solid rgba(255,216,107,0.2)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
              }}
            >
              {['S','A','B','C','D','E'].map(tier =>
                tiers[tier] ? (
                  <div key={tier}>
                    <div className="text-amber-300 font-semibold">{tier} Tier:</div>
                    <div className="text-white/65">{tiers[tier].map(getWeaponName).join(', ')}</div>
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded specialization panel */}
      {expanded && attrConfig && (
        <div
          className="mx-2 mb-3 rounded-lg overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${color}25`,
          }}
        >
          {/* Base effects header */}
          <div className="px-4 pt-3 pb-2 border-b border-white/[0.06]">
            <div className="text-[9px] tracking-[0.35em] uppercase mb-2" style={{ color: `${color}aa` }}>
              Base Bonuses per Point
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {attrConfig.baseEffects.map((eff) => (
                <div key={eff.label} className="text-[10px] text-white/60 flex items-center gap-1">
                  <span style={{ color }}>+{eff.perPoint}</span>
                  <span>{eff.label}</span>
                  {value > 20 && (
                    <span className="text-white/30 text-[8px]">(DR active)</span>
                  )}
                </div>
              ))}
            </div>
            {value > 0 && (
              <div className="mt-1.5 text-[9px] text-white/30">
                Effective points: <span className="text-white/55">{effectivePoints}</span>
                {value > 20 && <span className="text-amber-400/60 ml-1">(diminishing returns above 20)</span>}
              </div>
            )}
          </div>

          {/* Specialization choices */}
          <div className="px-4 pt-2 pb-3">
            <div className="text-[9px] tracking-[0.35em] uppercase mb-2 text-white/40">
              Specialization Focus
            </div>
            <div className="space-y-1.5">
              {attrConfig.specializations.map((spec) => {
                const isActive = specialization === spec.id;
                return (
                  <button
                    key={spec.id}
                    onClick={() => onSpecChange(spec.id)}
                    className="w-full text-left flex items-start gap-3 px-3 py-2 rounded transition-all"
                    style={{
                      background: isActive ? `${color}14` : 'rgba(255,255,255,0.02)',
                      border: isActive ? `1px solid ${color}45` : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div
                      className="mt-0.5 w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center"
                      style={{
                        borderColor: isActive ? color : 'rgba(255,255,255,0.2)',
                        background: isActive ? `${color}22` : 'transparent',
                      }}
                    >
                      {isActive && <Check className="w-2.5 h-2.5" style={{ color }} />}
                    </div>
                    <div className="min-w-0">
                      <div
                        className="text-[11px] font-semibold"
                        style={{ color: isActive ? color : 'rgba(255,255,255,0.75)' }}
                      >
                        {spec.label}
                        {spec.isHybrid && (
                          <span className="ml-1.5 text-[9px] font-normal text-white/35">(65% efficiency)</span>
                        )}
                      </div>
                      <div className="text-[9px] text-white/40 mt-0.5">{spec.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}