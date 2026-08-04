import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import SkillPathColumn from './SkillPathColumn';
import { buildSkillPaths, countUnlocked, countTotal } from './skillPathData';

export default function SkillPathTree({ genre }) {
  const paths = useMemo(() => buildSkillPaths(genre), [genre]);
  const [selected, setSelected] = useState(null);

  const unlocked = countUnlocked(paths);
  const total = countTotal(paths);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2 text-white">
          <Sparkles className="w-4 h-4 text-cyan-300" />
          Progression Paths
        </h2>
        <span className="text-xs text-white/40 font-semibold">{unlocked}/{total} nodes unlocked</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {paths.map(path => (
          <SkillPathColumn key={path.id} path={path} onNodeClick={setSelected} />
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center p-8 bg-black/50 backdrop-blur-md"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.94 }} animate={{ scale: 1 }} exit={{ scale: 0.94 }}
              onClick={e => e.stopPropagation()}
              className="max-w-sm w-full p-6 rounded-3xl"
              style={{
                background: 'rgba(100,120,140,0.15)',
                backdropFilter: 'blur(30px)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-bold text-lg">{selected.name}</h3>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5">
                    Tier {selected.tier} · {selected.unlocked ? 'Unlocked' : `Requires level ${selected.requiredLevel}`}
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white/50" />
                </button>
              </div>
              <p className="text-white/60 text-sm">{selected.description}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}