import React from 'react';
import SkillNode from './SkillNode';

export default function SkillPathColumn({ path, onNodeClick }) {
  const unlockedCount = path.nodes.filter(n => n.unlocked).length;
  const nextIndex = path.nodes.findIndex(n => !n.unlocked);

  return (
    <div
      className="relative rounded-3xl p-4"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: path.accent }}>
          {path.name}
        </h3>
        <span className="text-[10px] text-white/35 font-semibold">
          {unlockedCount}/{path.nodes.length}
        </span>
      </div>

      {/* Path spine */}
      <div className="relative pl-1">
        <div
          className="absolute left-[26px] top-3 bottom-3 w-[2px] rounded-full"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        />
        <div
          className="absolute left-[26px] top-3 w-[2px] rounded-full transition-all"
          style={{
            height: `calc(${(unlockedCount / path.nodes.length) * 100}% - 12px)`,
            background: `linear-gradient(180deg, ${path.accent}, ${path.accent}55)`,
            boxShadow: `0 0 12px ${path.accent}88`,
          }}
        />
        <div className="relative space-y-2.5">
          {path.nodes.map((node, i) => (
            <SkillNode
              key={node.id}
              node={node}
              accent={path.accent}
              isNext={i === nextIndex}
              onClick={onNodeClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}