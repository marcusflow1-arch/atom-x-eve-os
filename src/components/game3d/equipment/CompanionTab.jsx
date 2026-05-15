import React, { useEffect, useState } from 'react';
import { COMPANION_DEFINITIONS, COMPANION_GEAR, getCompanionById } from '../companionData';
import {
  subscribeCompanion,
  getCompanionState,
  setActiveCompanion,
  equipCompanionGear,
  unequipCompanionGear,
  getEffectiveSpeedMultiplier,
} from '../companionStore';
import { Check, Zap, Shield, Sparkles } from 'lucide-react';

const RARITY_COLORS = {
  common:   { text: 'text-slate-300',  border: 'border-slate-400/40',  bg: 'bg-slate-500/10' },
  rare:     { text: 'text-blue-300',   border: 'border-blue-400/50',   bg: 'bg-blue-500/15' },
  epic:     { text: 'text-purple-300', border: 'border-purple-400/50', bg: 'bg-purple-500/15' },
  legendary:{ text: 'text-amber-300',  border: 'border-amber-400/50',  bg: 'bg-amber-500/15' },
};

const SLOT_ICONS = {
  saddle: Zap,
  armor: Shield,
  charm: Sparkles,
};

export default function CompanionTab() {
  const [state, setState] = useState(getCompanionState());
  useEffect(() => subscribeCompanion(setState), []);

  const active = getCompanionById(state.activeCompanionId) || COMPANION_DEFINITIONS[0];
  const equippedGear = state.gear[active?.id] || {};
  const speedMult = getEffectiveSpeedMultiplier();

  if (!active) return null;

  return (
    <>
      {/* LEFT — Companion roster */}
      <div className="absolute left-6 top-24 bottom-20 w-[380px] pointer-events-auto overflow-y-auto">
        <div className="text-amber-400 text-xs tracking-[0.3em] uppercase mb-3 font-semibold">
          Companions
        </div>
        <div className="space-y-2">
          {COMPANION_DEFINITIONS.map((comp) => {
            const isActive = comp.id === active.id;
            const rc = RARITY_COLORS[comp.rarity] || RARITY_COLORS.common;
            return (
              <button
                key={comp.id}
                onClick={() => setActiveCompanion(comp.id)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3 ${
                  isActive
                    ? 'bg-amber-500/15 border-amber-400/50 shadow-[0_0_18px_rgba(251,191,36,0.2)]'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/25 hover:bg-white/[0.06]'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-md flex items-center justify-center ${rc.bg} ${rc.border} border`}
                >
                  <span className="text-2xl">🐎</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${rc.text}`}>{comp.name}</div>
                  <div className="text-[10px] text-white/50 uppercase tracking-wider">
                    {comp.rarity} · +{Math.round((comp.speedMultiplier - 1) * 100)}% speed
                  </div>
                </div>
                {isActive && <Check className="w-4 h-4 text-amber-400" />}
              </button>
            );
          })}
        </div>

        {/* Active companion stats */}
        <div className="mt-6 px-4 py-3 rounded-lg bg-black/30 border border-white/10">
          <div className="text-[10px] tracking-[0.2em] uppercase text-white/50 mb-2">
            Active Stats
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/70">Speed Multiplier</span>
            <span className="text-amber-300 font-mono font-semibold">
              ×{speedMult.toFixed(2)}
            </span>
          </div>
          <div className="mt-1.5 text-[11px] text-white/50 leading-relaxed">
            {active.description}
          </div>
        </div>
      </div>

      {/* CENTER — Gear slots for active companion */}
      <div
        className="absolute top-24 bottom-32 pointer-events-auto px-5 py-4 overflow-y-auto"
        style={{
          left: 410,
          width: 360,
          background:
            'linear-gradient(90deg, rgba(15,17,22,0.78) 0%, rgba(15,17,22,0.55) 70%, rgba(15,17,22,0) 100%)',
        }}
      >
        <div className="text-amber-400 text-xs tracking-[0.3em] uppercase mb-4 font-semibold">
          {active.name} — Equipment
        </div>

        {(active.gearSlots || []).map((slotId) => {
          const Icon = SLOT_ICONS[slotId] || Sparkles;
          const equippedId = equippedGear[slotId];
          const items = COMPANION_GEAR[slotId] || [];
          const equipped = items.find((it) => it.id === equippedId);

          return (
            <div key={slotId} className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-3.5 h-3.5 text-amber-400/80" />
                <span className="text-xs uppercase tracking-widest text-white/70 font-semibold">
                  {slotId}
                </span>
                {equipped && (
                  <span className={`ml-auto text-[10px] ${RARITY_COLORS[equipped.rarity]?.text || 'text-white/60'}`}>
                    {equipped.name}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {items.map((item) => {
                  const isEq = equippedId === item.id;
                  const rc = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
                  return (
                    <button
                      key={item.id}
                      onClick={() =>
                        isEq
                          ? unequipCompanionGear(active.id, slotId)
                          : equipCompanionGear(active.id, slotId, item.id)
                      }
                      className={`px-2 py-2 rounded-md text-left border text-[11px] transition-all ${
                        isEq
                          ? `${rc.bg} ${rc.border} ring-1 ring-amber-400/40`
                          : `bg-white/[0.03] ${rc.border} opacity-70 hover:opacity-100`
                      }`}
                      title={item.description}
                    >
                      <div className={`font-semibold ${rc.text} truncate`}>{item.name}</div>
                      <div className="text-[9px] text-white/50 uppercase tracking-wider mt-0.5">
                        {item.speedBonus ? `+${Math.round(item.speedBonus * 100)}% spd` :
                         item.defense ? `+${item.defense} def` : item.rarity}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="mt-6 px-3 py-2 rounded bg-amber-500/10 border border-amber-400/30 text-[11px] text-amber-200/90 leading-relaxed">
          Approach your companion in the world and press <span className="font-mono font-bold">F</span> to mount.
          Press <span className="font-mono font-bold">F</span> again to dismount.
        </div>
      </div>
    </>
  );
}