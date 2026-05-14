import React from 'react';

const SKILLS = [
  { key: 'Q', color: '#4a90e2' },
  { key: 'E', color: '#7ed321' },
  { key: 'R', color: '#d0021b' },
  { key: 'F', color: '#9013fe' },
];

/**
 * Bottom-left HUD: "SKILL SLOTS" label with a clean row of 4 ability slots.
 */
export default function HUDSkillSlots() {
  return (
    <div className="absolute bottom-6 left-6 z-20 pointer-events-auto">
      <div className="text-[10px] font-bold tracking-[0.25em] uppercase text-amber-200/80 mb-1.5">
        Skill Slots
      </div>
      <div className="flex gap-2">
        {SKILLS.map((s) => (
          <SkillSlot key={s.key} skill={s} />
        ))}
      </div>
    </div>
  );
}

function SkillSlot({ skill }) {
  return (
    <button
      className="relative w-[58px] h-[58px] rounded-sm transition-transform hover:scale-105"
      style={{
        background: `linear-gradient(135deg, ${skill.color}55 0%, ${skill.color}22 100%)`,
        border: '1.5px solid rgba(180,140,80,0.55)',
        boxShadow: '0 3px 10px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      {/* Empty inner placeholder — info text intentionally blank */}
      <div className="absolute inset-1 rounded-[2px] bg-black/35" />
      <div
        className="absolute bottom-0 right-0 px-1.5 py-0.5 text-[10px] font-bold text-white"
        style={{ background: 'rgba(0,0,0,0.75)', borderTopLeftRadius: 3 }}
      >
        {skill.key}
      </div>
    </button>
  );
}