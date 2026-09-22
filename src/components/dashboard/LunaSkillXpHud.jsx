import { useMemo } from 'react';
import { Sparkles, Zap } from 'lucide-react';
import useLunaStore from '@/components/luna/useLunaStore';
import { useSkills } from '@/components/luna/hooks/useSkills';

const slotPosition = [
  { left: 38, top: 3, key: '1' },
  { left: 73, top: 38, key: '2' },
  { left: 38, top: 73, key: '3' },
  { left: 3, top: 38, key: '4' },
];

function DiamondSkill({ index, active, onTrigger }) {
  const assigned = useLunaStore((state) => state.hotbar[index]);
  const image = assigned?.image || assigned?.card_image || assigned?.icon_url || assigned?.icon || '';
  const title = assigned?.title || assigned?.name || assigned?.card_name || `Skill ${index + 1}`;
  const pos = slotPosition[index];

  return (
    <button
      type="button"
      onClick={() => onTrigger(index)}
      aria-label={assigned ? `Use ${title}` : `Skill slot ${index + 1}`}
      title={assigned ? title : `Skill slot ${index + 1}`}
      className={`absolute h-[38px] w-[38px] rotate-45 overflow-hidden border transition-all duration-200 ${active
        ? 'border-cyan-100/70 bg-cyan-200/[0.18] shadow-[0_0_18px_rgba(103,232,249,.28)]'
        : assigned
          ? 'border-white/[0.18] bg-slate-900/70 hover:border-cyan-100/35 hover:bg-cyan-100/[0.08]'
          : 'border-white/[0.10] bg-slate-950/55 hover:border-white/[0.18]'}`}
      style={{ left: pos.left, top: pos.top }}
    >
      <span className="absolute inset-[-8px] -rotate-45">
        {image ? (
          <img src={image} alt="" className="h-full w-full object-cover opacity-80" />
        ) : (
          <span className="grid h-full w-full place-items-center text-white/25">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
        )}
      </span>
      <span className="absolute bottom-[-6px] right-[-6px] grid h-[18px] w-[18px] -rotate-45 place-items-center bg-black/70 text-[6px] font-black text-white/65">
        {pos.key}
      </span>
    </button>
  );
}

export default function LunaSkillXpHud({
  currentXp = 0,
  nextXp = 1000,
  level = 1,
}) {
  const { activeSkills, triggerSkill } = useSkills();
  const progress = useMemo(
    () => Math.max(0, Math.min(100, (Number(currentXp || 0) / Math.max(1, Number(nextXp || 1))) * 100)),
    [currentXp, nextXp]
  );

  return (
    <div
      data-luna-skill-xp-hud
      className="absolute bottom-[10px] left-[34px] right-[338px] z-[44] h-[122px] pointer-events-none"
    >
      <div className="absolute left-0 bottom-0 h-[118px] w-[118px] pointer-events-auto">
        <div
          className="absolute left-[10px] top-[10px] h-[98px] w-[98px] rotate-45 border border-white/[0.12] bg-slate-950/28 backdrop-blur-md"
          style={{ boxShadow: 'inset 0 0 28px rgba(103,232,249,.035), 0 12px 30px rgba(0,0,0,.18)' }}
        />
        <div className="absolute left-[49px] top-[49px] z-20 h-[20px] w-[20px]">
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 rotate-45 bg-cyan-100/32" />
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 -rotate-45 bg-cyan-100/32" />
        </div>
        {slotPosition.map((_, index) => (
          <DiamondSkill
            key={index}
            index={index}
            active={Boolean(activeSkills[index])}
            onTrigger={triggerSkill}
          />
        ))}
      </div>

      <div className="absolute left-[128px] right-0 top-[14px] h-[82px]">
        <svg
          viewBox="0 0 1000 82"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          aria-hidden="true"
        >
          <path
            d="M 0 6 L 24 6 L 56 38 L 56 56 L 1000 56"
            fill="none"
            stroke="rgba(226,232,240,.20)"
            strokeWidth="1.2"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M 0 10 L 20 10 L 51 41 L 51 61 L 1000 61"
            fill="none"
            stroke="rgba(103,232,249,.08)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <div className="absolute left-[58px] right-0 top-[63px]">
          <div className="mb-1.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-cyan-100/60" />
              <span className="text-[7px] font-black uppercase tracking-[0.14em] text-white/40">Experience</span>
              <span className="text-[7px] font-semibold text-white/72">Lv {level}</span>
            </div>
            <span className="text-[7px] font-mono text-white/38">
              {Number(currentXp || 0).toLocaleString()} / {Number(nextXp || 0).toLocaleString()} XP
            </span>
          </div>

          <div className="relative h-[5px] overflow-hidden bg-white/[0.065]">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-300/55 via-sky-200/68 to-white/72 transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/[0.12]" />
          </div>
        </div>
      </div>
    </div>
  );
}
