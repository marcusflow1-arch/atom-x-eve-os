import { useEffect, useMemo, useState } from 'react';
import { SKILL_SLOT_COUNT } from '@/components/luna/skillSlots';

function useCooldownClock(skills, serverOffsetMs) {
  const [now, setNow] = useState(() => Date.now() + Number(serverOffsetMs || 0));
  useEffect(() => {
    let timer = null;
    const tick = () => {
      const serverNow = Date.now() + Number(serverOffsetMs || 0);
      setNow(serverNow);
      const active = (skills || []).some((skill) => Date.parse(skill?.cooldownEndsAt || 0) > serverNow);
      timer = window.setTimeout(tick, active ? 100 : 500);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, [skills, serverOffsetMs]);
  return now;
}

export default function OverheadFighterBar({ name, hp = 0, maxHp = 1000, atb = 0, skills = [], local = false, serverOffsetMs = 0, lastCastSlot = null, onSkill }) {
  const now = useCooldownClock(skills, serverOffsetMs);
  const bySlot = useMemo(() => new Map((skills || []).map((skill) => [Number(skill.slot), skill])), [skills]);
  const hpPct = Math.max(0, Math.min(100, Number(maxHp) > 0 ? Number(hp) / Number(maxHp) * 100 : 0));
  const atbPct = Math.max(0, Math.min(100, Number(atb || 0)));
  const costs = [...new Set((skills || []).map((s) => Number(s.atbCost || s.atb_cost || 0)).filter((n) => n > 0 && n < 100))];

  return (
    <div className="pointer-events-auto select-none text-white drop-shadow-[0_2px_7px_rgba(0,0,0,.95)]" style={{ width: 210 }}>
      <div className="mb-1 text-center text-[12px] font-black tracking-wide">{name || 'Player'}</div>
      <div className="mx-auto w-[120px]">
        <div className="h-2 overflow-hidden rounded-full bg-black/70 ring-1 ring-white/20"><div className={`h-full ${local ? 'bg-cyan-300' : 'bg-red-400'}`} style={{ width: `${hpPct}%` }} /></div>
        <div className="mt-0.5 text-center text-[10px] font-bold tabular-nums">{Math.round(hp)} / {Math.round(maxHp)}</div>
        <div className="relative mt-1 h-1 overflow-visible rounded-full bg-black/70 ring-1 ring-white/15">
          <div className="h-full rounded-full bg-amber-300" style={{ width: `${atbPct}%` }} />
          {costs.map((cost) => <span key={cost} className="absolute top-[-2px] h-2 w-px bg-white/70" style={{ left: `${cost}%` }} />)}
        </div>
      </div>
      <div className="mt-2 flex justify-center gap-1">
        {Array.from({ length: SKILL_SLOT_COUNT }, (_, slot) => {
          const skill = bySlot.get(slot);
          const endsAt = Date.parse(skill?.cooldownEndsAt || 0);
          const remainingMs = Math.max(0, endsAt - now);
          const duration = Math.max(1, Number(skill?.cooldownMs || skill?.cooldown_ms || 1));
          const fraction = Math.max(0, Math.min(1, remainingMs / duration));
          const cost = Number(skill?.atbCost || skill?.atb_cost || 0);
          const disabled = !skill || remainingMs > 0 || atbPct < cost;
          return (
            <button key={slot} type="button" disabled={!local || disabled} onClick={() => onSkill?.(slot)}
              className={`relative h-11 w-11 overflow-hidden rounded border ${lastCastSlot === slot ? 'border-white shadow-[0_0_12px_rgba(255,255,255,.8)]' : 'border-white/20'} bg-slate-950/75 ${disabled ? 'opacity-45' : ''}`}>
              {skill?.image ? <img src={skill.image} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-white/[0.03]" />}
              {remainingMs > 0 && <span className="absolute inset-0 grid place-items-center bg-[conic-gradient(rgba(0,0,0,.82)_0deg,rgba(0,0,0,.82)_var(--sweep),transparent_var(--sweep),transparent_360deg)] text-[11px] font-black" style={{ '--sweep': `${fraction * 360}deg` }}>{Math.ceil(remainingMs / 1000)}</span>}
              {local && <span className="absolute bottom-0 right-0 rounded-tl bg-black/80 px-1 text-[9px] font-black">{slot + 1}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
