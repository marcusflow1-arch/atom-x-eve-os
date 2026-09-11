import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, Zap } from 'lucide-react';
import { subscribePlayerHUD, getPlayerHUD } from './playerHUDStore';
import { subscribeShop } from './shop/shopStore';
import { subscribeLoadout, getLoadout, startCooldown } from './skills/loadoutStore';
import { getSkillById } from './skills/skillRegistry';
import { castSkill } from './skills/skillExecutor';
import { getTwelveSkySkillRole } from './twelvesky/modernizationData';
import { subscribeBurstCharge } from './twelvesky/burstChargeStore';

/**
 * Compact modern combat HUD.
 * - Live HP / Force / XP
 * - Ten classic combat positions: keys 1–9 and 0 for slot 10
 * - Real equipped skill names/icons/cooldowns
 * - Single / Multi / AoE role marker from the TwelveSky-inspired doctrine
 * - Burst-charge indicator for charge → single-hit finishing
 */
export default function SkillSlotHUD({
  characterName = 'Player',
  mana = 296,
  maxMana = 296,
  gold: goldProp,
  onAbility,
}) {
  const [hud, setHud] = useState({ level: 1, xp: 0, xpForNext: 5, hp: 100, maxHP: 100, unspentPoints: 0, derived: { chi: 0 } });
  const [loadout, setLoadout] = useState(() => getLoadout());
  const [shop, setShop] = useState({ gold: goldProp ?? 0 });
  const [charge, setCharge] = useState({ active: false, remainingMs: 0, multiplier: 1 });

  useEffect(() => subscribePlayerHUD(setHud), []);
  useEffect(() => subscribeLoadout(setLoadout), []);
  useEffect(() => subscribeShop(setShop), []);
  useEffect(() => subscribeBurstCharge(setCharge), []);

  const hp = hud.hp ?? 0;
  const maxHp = hud.maxHP ?? 1;
  const liveMana = hud.derived?.chi ?? mana;
  const liveMaxMana = Math.max(1, hud.derived?.chi ?? maxMana);
  const gold = goldProp ?? shop.gold ?? 0;

  const slots = useMemo(() => Array.from({ length: 10 }, (_, index) => {
    const skillId = loadout.activeSlots?.[index] || null;
    return {
      index,
      keyLabel: index === 9 ? '0' : String(index + 1),
      skill: skillId ? getSkillById(skillId) : null,
      cooldown: loadout.cooldowns?.[index] || 0,
      role: getTwelveSkySkillRole(index + 1),
    };
  }), [loadout]);

  const activate = (slot) => {
    if (!slot.skill || slot.cooldown > 0) return;
    if (onAbility) {
      onAbility(slot.keyLabel);
      return;
    }
    const live = getPlayerHUD();
    const result = castSkill(slot.skill.skill_id, { level: live.level || 1, maxHP: live.maxHP || 1 });
    if (result.ok) startCooldown(slot.index);
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none select-none">
      <div className="flex justify-center pb-3 px-4">
        <div
          className="pointer-events-auto flex items-end gap-3 rounded-2xl px-3 py-2.5"
          style={{
            background: 'linear-gradient(180deg, rgba(8,13,20,0.78) 0%, rgba(5,8,13,0.9) 100%)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <HeroPortrait name={characterName} level={hud.level} unspentPoints={hud.unspentPoints} />

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-[520px] flex flex-col gap-1">
                <XPBar level={hud.level} xp={hud.xp} xpForNext={hud.xpForNext} />
                <ResourceBar value={hp} max={maxHp} color="#4ade80" label="HP" />
                <ResourceBar value={liveMana} max={liveMaxMana} color="#38bdf8" label="FORCE" />
              </div>

              <div className="h-[50px] min-w-[106px] rounded-lg border border-white/10 bg-black/25 px-3 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 text-amber-200">
                  <Coins className="w-3.5 h-3.5" />
                  <span className="text-sm font-semibold tabular-nums">{gold.toLocaleString()}</span>
                </div>
                <div className={`mt-1 flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] ${charge.active ? 'text-amber-200' : 'text-white/30'}`}>
                  <Zap className="w-3 h-3" />
                  {charge.active ? `${charge.multiplier}× Burst ${(charge.remainingMs / 1000).toFixed(1)}s` : 'Burst idle'}
                </div>
              </div>
            </div>

            <div className="flex gap-1.5">
              {slots.map((slot) => (
                <SkillSlot key={slot.index} slot={slot} onClick={() => activate(slot)} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkillSlot({ slot, onClick }) {
  const skill = slot.skill;
  const role = slot.role?.role || 'single';
  const roleColor = role === 'aoe' ? '#c4b5fd' : role === 'multi' ? '#93c5fd' : '#fca5a5';
  const cd = Math.max(0, slot.cooldown || 0);
  const cooldownMax = Math.max(0.001, skill?.cooldown || 1);
  const cdPct = Math.min(100, (cd / cooldownMax) * 100);

  return (
    <button
      onClick={onClick}
      disabled={!skill || cd > 0}
      className="relative w-[50px] h-[50px] rounded-lg overflow-hidden border border-white/10 bg-white/[0.035] transition-all hover:-translate-y-0.5 hover:border-white/25 disabled:hover:translate-y-0"
      title={skill ? `${slot.keyLabel}: ${skill.skill_name} · ${slot.role?.label || ''}` : `Empty skill slot ${slot.index + 1}`}
    >
      {skill ? (
        <>
          <div className="absolute inset-0 flex items-center justify-center text-xl">{skill.icon || '✦'}</div>
          <div className="absolute top-1 left-1 text-[7px] font-bold tracking-wider px-1 rounded bg-black/55" style={{ color: roleColor }}>
            {slot.role?.label?.toUpperCase() || 'SKILL'}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-black/65 flex items-center justify-center text-[9px] font-black text-white">
            {slot.keyLabel}
          </div>
          {cd > 0 && (
            <>
              <div className="absolute inset-x-0 bottom-0 bg-black/70 pointer-events-none" style={{ height: `${cdPct}%` }} />
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white tabular-nums">{cd.toFixed(cd < 10 ? 1 : 0)}</div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="absolute inset-0 flex items-center justify-center text-white/15 text-lg">+</div>
          <div className="absolute top-1 left-1 text-[7px] font-bold tracking-wider" style={{ color: `${roleColor}88` }}>{slot.role?.label?.toUpperCase()}</div>
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-black/45 flex items-center justify-center text-[9px] font-black text-white/45">{slot.keyLabel}</div>
        </>
      )}
    </button>
  );
}

function HeroPortrait({ name, level = 1, unspentPoints = 0 }) {
  return (
    <div className="relative w-[66px] h-[66px] rounded-xl border border-white/10 bg-gradient-to-br from-slate-700/80 to-slate-950/90 flex items-center justify-center shrink-0">
      <div className="text-center">
        <div className="text-[9px] uppercase tracking-[0.16em] text-white/35 max-w-[54px] truncate">{name}</div>
        <div className="text-2xl font-light text-white mt-0.5">{level}</div>
        <div className="text-[8px] text-white/30 uppercase tracking-widest">Level</div>
      </div>
      {unspentPoints > 0 && (
        <div className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-amber-300 text-slate-950 text-[9px] font-black flex items-center justify-center shadow-lg animate-pulse">+{unspentPoints}</div>
      )}
    </div>
  );
}

function ResourceBar({ value, max, color, label }) {
  const safeMax = Math.max(1, Number(max) || 1);
  const safeValue = Math.max(0, Math.min(safeMax, Number(value) || 0));
  const pct = Math.max(0, Math.min(100, (safeValue / safeMax) * 100));
  return (
    <div className="relative h-3 rounded-full overflow-hidden bg-black/55 border border-white/[0.07]">
      <motion.div
        className="absolute inset-y-0 left-0"
        style={{ background: color, boxShadow: `0 0 8px ${color}55` }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.22 }}
      />
      <div className="absolute inset-0 flex items-center justify-between px-2 text-[8px] font-bold text-white/90 tabular-nums">
        <span className="tracking-wider">{label}</span><span>{Math.round(safeValue)} / {Math.round(safeMax)}</span>
      </div>
    </div>
  );
}

function XPBar({ level, xp, xpForNext }) {
  const next = Math.max(1, Number(xpForNext) || 1);
  const pct = Math.max(0, Math.min(100, ((Number(xp) || 0) / next) * 100));
  return (
    <div className="relative h-2 rounded-full overflow-hidden bg-black/55 border border-amber-300/10">
      <motion.div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-yellow-300"
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.22 }}
      />
      <div className="absolute -top-3 right-0 text-[7px] text-white/25 tracking-wider">LV {level} · {xp}/{xpForNext}</div>
    </div>
  );
}
