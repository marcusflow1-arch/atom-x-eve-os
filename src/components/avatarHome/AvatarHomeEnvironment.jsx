import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

export default function AvatarHomeEnvironment({ theme = 'default', interactiveObjects = [] }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [ -30, 30 ], [ -1.5, 1.5 ]);

  const handleMouseMove = (e) => {
    const { clientX, clientY, currentTarget } = e;
    const rect = currentTarget.getBoundingClientRect();
    const dx = ((clientX - rect.left) / rect.width - 0.5) * 60;
    const dy = ((clientY - rect.top) / rect.height - 0.5) * 40;
    x.set(dx);
    y.set(dy);
  };

  return (
    <motion.div
      className="relative w-full h-64 rounded-2xl border border-white/10 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.12))' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      animate={{}}
    >
      <motion.div className="absolute inset-0" style={{ rotateY: rotate }} />

      {/* Hotspots */}
      <div className="absolute inset-0 p-4 grid grid-cols-3 gap-4">
        {interactiveObjects.map(obj => (
          <button
            key={obj.id}
            onClick={obj.onInteract}
            className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left p-3"
            title={obj.label}
          >
            <div className="text-white/70 text-sm">{obj.label}</div>
            <div className="text-white/30 text-xs">{obj.type.replace('_', ' ')}</div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}