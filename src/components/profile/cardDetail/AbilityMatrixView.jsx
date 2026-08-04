import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Zap, Unlock, Check, Lock, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlassPanel from './GlassPanel';
import AbilityPathColumn from './AbilityPathColumn';
import { ABILITY_PATHS } from './abilityMatrixData';

export default function AbilityMatrixView() {
  const [unlocked, setUnlocked] = useState(['power-root']);
  const [sp, setSp] = useState(2450);
  const [selected, setSelected] = useState(null);

  const totalNodes = ABILITY_PATHS.length * 7;
  const canUnlock = selected && !selected.unlocked && selected.reachable && sp >= selected.cost;

  const handleUnlock = () => {
    if (!canUnlock) return;
    setUnlocked((prev) => [...prev, selected.id]);
    setSp((prev) => prev - selected.cost);
    setSelected((prev) => ({ ...prev, unlocked: true }));
  };

  const reset = () => { setUnlocked(['power-root']); setSp(2450); setSelected(null); };

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-5 flex-shrink-0 flex-wrap">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center shadow-[0_0_24px_rgba(168,85,247,0.25)]">
            <Layers className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h3 className="text-white font-black text-2xl tracking-tight leading-none">Ability Matrix</h3>
            <p className="text-white/45 text-sm mt-0.5">{unlocked.length} / {totalNodes} nodes online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 h-9 px-4 rounded-full bg-purple-500/10 border border-purple-400/25 backdrop-blur-md">
            <Zap className="w-3.5 h-3.5 text-purple-300" />
            <span className="text-white font-bold text-sm tabular-nums">{sp.toLocaleString()}</span>
            <span className="text-purple-300/70 text-[10px] font-black tracking-widest">SP</span>
          </div>
          <button onClick={reset} title="Reset matrix"
            className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Paths + inspector */}
      <div className="flex-1 flex gap-5 min-h-0">
        <div className="flex-1 grid grid-cols-3 gap-5 min-h-0">
          {ABILITY_PATHS.map((path) => (
            <AbilityPathColumn key={path.id} path={path} unlocked={unlocked} selectedId={selected?.id} onSelect={setSelected} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {selected && (
            <motion.div key={selected.id} initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 24, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }} className="w-[290px] flex-shrink-0">
              <GlassPanel className="h-full flex flex-col">
                <div className="flex items-start justify-between mb-5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center border"
                    style={{ background: `${selected.accent}22`, borderColor: `${selected.accent}66` }}>
                    {React.createElement(selected.icon, { className: 'w-7 h-7', style: { color: selected.accent } })}
                  </div>
                  <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-full bg-white/10 text-white/70">
                    {selected.kind || 'Upgrade'}
                  </span>
                  {selected.unlocked && (
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300">Active</span>
                  )}
                </div>

                <h4 className="text-white font-black text-xl leading-tight mb-4">{selected.name}</h4>

                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-3">
                  <div className="p-3.5 rounded-xl bg-white/[0.05] border border-white/[0.07]">
                    <h5 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5">Effect</h5>
                    <p className="text-white/85 text-sm leading-relaxed">{selected.desc}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.05] border border-white/[0.07]">
                    <h5 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.18em] mb-2">Cost</h5>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">Skill Points</span>
                      <span className="text-white font-black tabular-nums">{selected.cost || 0} SP</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-white/[0.08]">
                  {selected.unlocked ? (
                    <div className="h-12 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center gap-2 text-white/50 font-bold uppercase tracking-widest text-xs">
                      <Check className="w-4 h-4" /> Online
                    </div>
                  ) : (
                    <Button onClick={handleUnlock} disabled={!canUnlock}
                      className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs text-black disabled:bg-white/10 disabled:text-white/30"
                      style={canUnlock ? { background: selected.accent } : undefined}>
                      {!selected.reachable ? <><Lock className="w-4 h-4 mr-2" /> Locked</>
                        : sp < selected.cost ? <>Insufficient SP</>
                        : <><Unlock className="w-4 h-4 mr-2" /> Unlock · {selected.cost} SP</>}
                    </Button>
                  )}
                </div>
              </GlassPanel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}