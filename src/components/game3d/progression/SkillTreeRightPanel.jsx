import React, { useState } from 'react';
import { Lock, Check, Zap, Target, Wind, Eye, Crosshair, Flame, Star, Skull } from 'lucide-react';

// Skill tree branches. Layout: 3 columns (paths) × 4 tiers.
const SKILL_TREE = [
  {
    id: 'precision',
    label: 'Precision',
    color: '#3a9ee6',
    nodes: [
      { id: 'quick_shot',  name: 'Quick Shot',  desc: 'Increase fire rate by 15%.',    unlockLvl: 1,  icon: Target },
      { id: 'eagle_eye',   name: 'Eagle Eye',   desc: 'Crit chance +10%.',             unlockLvl: 5,  icon: Eye },
      { id: 'piercing',    name: 'Piercing',    desc: 'Arrows pierce one enemy.',      unlockLvl: 9,  icon: Crosshair },
      { id: 'star_arrow',  name: 'Star Arrow',  desc: 'Guided arrow seeks target.',    unlockLvl: 20, icon: Star },
    ],
  },
  {
    id: 'power',
    label: 'Power',
    color: '#e25555',
    nodes: [
      { id: 'power_draw',  name: 'Power Draw',  desc: 'Charged shots deal +30% dmg.',  unlockLvl: 3,  icon: Zap },
      { id: 'multi_shot',  name: 'Multi-Shot',  desc: 'Fire 3 arrows in a spread.',    unlockLvl: 7,  icon: Wind },
      { id: 'firestorm',   name: 'Firestorm',   desc: 'Volley ignites the ground.',    unlockLvl: 12, icon: Flame },
      { id: 'doom_arrow',  name: 'Doom Arrow',  desc: 'Massive single-shot finisher.', unlockLvl: 25, icon: Skull },
    ],
  },
  {
    id: 'agility',
    label: 'Agility',
    color: '#b755e2',
    nodes: [
      { id: 'evade',         name: 'Evade',         desc: 'Quick dodge with i-frames.',    unlockLvl: 2,  icon: Wind },
      { id: 'phantom_step',  name: 'Phantom Step',  desc: 'Short-range teleport dash.',    unlockLvl: 8,  icon: Wind },
      { id: 'storm_volley',  name: 'Storm Volley',  desc: 'Rain of arrows on movement.',   unlockLvl: 15, icon: Wind },
      { id: 'wind_walker',   name: 'Wind Walker',   desc: 'Move silently and faster.',     unlockLvl: 22, icon: Wind },
    ],
  },
];

export default function SkillTreeRightPanel({ hud }) {
  const { level, unspentPoints } = hud;
  const [hoveredNode, setHoveredNode] = useState(null);

  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[10px] text-cyan-300/80 font-bold tracking-[0.3em] uppercase mb-1">Skill Tree System</div>
          <div className="text-3xl font-bold text-white">Path of the Archer</div>
          <div className="text-sm text-white/50 mt-1">Unlock abilities as you level up</div>
        </div>
        <div
          className="px-3 py-2 rounded-lg text-right"
          style={{ background: 'rgba(58,158,230,0.12)', border: '1px solid rgba(58,158,230,0.4)' }}
        >
          <div className="text-[9px] tracking-[0.2em] uppercase text-cyan-300/70 font-bold">Skill Points</div>
          <div className="text-xl font-bold text-cyan-300 tabular-nums">{unspentPoints}</div>
        </div>
      </div>

      {/* Tree grid */}
      <div className="grid grid-cols-3 gap-4 flex-1">
        {SKILL_TREE.map((branch) => (
          <div key={branch.id} className="flex flex-col">
            {/* Branch header */}
            <div
              className="text-center py-2 mb-3 rounded-md"
              style={{
                background: `${branch.color}1a`,
                border: `1px solid ${branch.color}55`,
              }}
            >
              <div className="text-[10px] tracking-[0.25em] uppercase font-bold" style={{ color: branch.color }}>
                {branch.label}
              </div>
            </div>

            {/* Nodes — vertical chain */}
            <div className="flex flex-col items-center gap-3 relative">
              {branch.nodes.map((node, idx) => {
                const Icon = node.icon;
                const unlocked = level >= node.unlockLvl;
                const isLast = idx === branch.nodes.length - 1;
                return (
                  <React.Fragment key={node.id}>
                    <button
                      onMouseEnter={() => setHoveredNode(node)}
                      onMouseLeave={() => setHoveredNode(null)}
                      className="w-16 h-16 rounded-xl flex items-center justify-center transition-all relative group"
                      style={{
                        background: unlocked ? `${branch.color}22` : 'rgba(255,255,255,0.03)',
                        border: `2px solid ${unlocked ? branch.color : 'rgba(255,255,255,0.12)'}`,
                        boxShadow: unlocked ? `0 0 16px ${branch.color}40` : 'none',
                        opacity: unlocked ? 1 : 0.55,
                      }}
                    >
                      <Icon className="w-7 h-7" style={{ color: unlocked ? branch.color : 'rgba(255,255,255,0.4)' }} />
                      {unlocked ? (
                        <span
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: branch.color, border: '2px solid rgba(15,20,30,1)' }}
                        >
                          <Check className="w-3 h-3 text-white" />
                        </span>
                      ) : (
                        <span
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: 'rgba(0,0,0,0.7)', border: '2px solid rgba(255,255,255,0.2)' }}
                        >
                          <Lock className="w-2.5 h-2.5 text-white/60" />
                        </span>
                      )}
                    </button>
                    {!isLast && (
                      <div
                        className="w-0.5 h-4"
                        style={{
                          background: unlocked && level >= branch.nodes[idx + 1].unlockLvl
                            ? branch.color
                            : 'rgba(255,255,255,0.12)',
                        }}
                      />
                    )}
                    <div className="text-[10px] text-center -mt-1.5">
                      <div className="font-bold text-white/85 leading-tight">{node.name}</div>
                      <div className="text-white/40 text-[9px] mt-0.5">
                        {unlocked ? 'Unlocked' : `Lvl ${node.unlockLvl}`}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Hover detail */}
      <div
        className="mt-4 p-3 rounded-lg min-h-[64px]"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {hoveredNode ? (
          <>
            <div className="text-sm font-bold text-white">{hoveredNode.name}</div>
            <div className="text-xs text-white/60 mt-0.5">{hoveredNode.desc}</div>
            <div className="text-[10px] text-cyan-300/70 mt-1">Required Level: {hoveredNode.unlockLvl}</div>
          </>
        ) : (
          <div className="text-xs text-white/35 italic">Hover a skill to see details.</div>
        )}
      </div>
    </div>
  );
}