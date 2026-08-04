import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Check } from 'lucide-react';
import GlassPanel from './GlassPanel';

/**
 * One ability path: a root node feeding a zig-zag spine of six upgrade nodes.
 */
export default function AbilityPathColumn({ path, unlocked, selectedId, onSelect }) {
  const rootId = `${path.id}-root`;
  const isRootOn = unlocked.includes(rootId) || path.root.unlocked;

  return (
    <GlassPanel padded={false} className="flex flex-col min-h-0">
      {/* Path header */}
      <div className="px-4 py-3.5 border-b border-white/[0.07] text-center">
        <h4 className="font-black text-sm uppercase tracking-[0.18em]" style={{ color: path.accent }}>{path.name}</h4>
        <p className="text-white/30 text-[10px] mt-0.5">{path.tagline}</p>
      </div>

      <div className="relative flex-1 overflow-y-auto custom-scrollbar px-4 py-6">
        {/* Spine */}
        <div className="absolute left-1/2 top-6 bottom-6 w-px -translate-x-1/2 pointer-events-none"
          style={{ background: `linear-gradient(180deg, ${path.accent}55, ${path.accent}10 60%, transparent)` }} />

        {/* Root */}
        <div className="relative flex justify-center mb-8">
          <motion.button whileHover={{ scale: 1.06 }} onClick={() => onSelect({ ...path.root, id: rootId, pathId: path.id, accent: path.accent, cost: 0, unlocked: isRootOn })}
            className="relative w-16 h-16 rounded-2xl flex items-center justify-center border transition-colors"
            style={{
              background: isRootOn ? `${path.accent}26` : 'rgba(255,255,255,0.04)',
              borderColor: isRootOn ? `${path.accent}88` : 'rgba(255,255,255,0.12)',
              boxShadow: isRootOn ? `0 0 26px ${path.accent}55` : 'none',
              outline: selectedId === rootId ? '2px solid rgba(255,255,255,0.7)' : 'none',
              outlineOffset: 3,
            }}>
            {React.createElement(path.root.icon, { className: 'w-7 h-7', style: { color: isRootOn ? '#fff' : 'rgba(255,255,255,0.35)' } })}
            {isRootOn && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 border border-white/30 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </span>
            )}
          </motion.button>
        </div>
        <p className="text-center text-white text-xs font-bold -mt-6 mb-7">
          {path.root.name}
          <span className="block text-white/35 text-[10px] font-medium">{path.root.kind}</span>
        </p>

        {/* Zig-zag nodes */}
        <div className="relative space-y-5">
          {path.nodes.map((node, i) => {
            const id = `${path.id}-${i}`;
            const on = unlocked.includes(id);
            const reachable = isRootOn && (i === 0 || unlocked.includes(`${path.id}-${i - 1}`));
            const left = i % 2 === 0;
            return (
              <div key={id} className={`flex ${left ? 'justify-start pr-8' : 'justify-end pl-8'}`}>
                <motion.button whileHover={{ scale: 1.05, y: -2 }} onClick={() => onSelect({ ...node, id, pathId: path.id, accent: path.accent, unlocked: on, reachable })}
                  className="group flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors hover:bg-white/[0.06]"
                  style={{ outline: selectedId === id ? '2px solid rgba(255,255,255,0.6)' : 'none', outlineOffset: 2 }}>
                  <span className="relative w-11 h-11 rounded-xl flex items-center justify-center border flex-shrink-0"
                    style={{
                      background: on ? `${path.accent}22` : 'rgba(0,0,0,0.35)',
                      borderColor: on ? `${path.accent}77` : reachable ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)',
                      boxShadow: on ? `0 0 16px ${path.accent}44` : 'none',
                    }}>
                    {React.createElement(node.icon, { className: 'w-4 h-4', style: { color: on ? '#fff' : reachable ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.25)' } })}
                    {!on && !reachable && (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 border border-white/15 flex items-center justify-center">
                        <Lock className="w-2 h-2 text-white/40" />
                      </span>
                    )}
                  </span>
                  <span className="text-left">
                    <span className={`block text-[11px] font-bold leading-tight ${on ? 'text-white' : reachable ? 'text-white/75' : 'text-white/35'}`}>{node.name}</span>
                    <span className="block text-[9px] font-mono mt-0.5" style={{ color: on ? path.accent : 'rgba(255,255,255,0.3)' }}>
                      {on ? 'ACTIVE' : `${node.cost} SP`}
                    </span>
                  </span>
                </motion.button>
              </div>
            );
          })}
        </div>
      </div>
    </GlassPanel>
  );
}