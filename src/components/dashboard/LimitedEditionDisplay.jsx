import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield } from 'lucide-react';

export default function LimitedEditionDisplay() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [equippedProp, setEquippedProp] = useState({
    id: 'atom-x-eve-limited',
    type: 'Display Card',
    name: 'Atom X Eve - Limited Edition',
    image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/3dda0fd3e_ChatGPTImageDec28202507_23_25AM.png',
    status: 'Limited Edition',
    description: 'A symbol of flawless creativity. Commemorating the genesis of Atom X Eve.'
  });

  return (
    <>
      <div className="w-full mt-2">
        {/* Header - Minimal */}
        <div className="flex items-center justify-between px-1 mb-2">
          <h3 className="text-[9px] font-bold tracking-[0.2em] text-white/40 uppercase">Showcase</h3>
          {equippedProp && <span className="text-[8px] text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 shadow-[0_0_10px_rgba(34,211,238,0.2)]">Limited</span>}
        </div>

        {/* Clear Glass Case */}
        <div 
          className="relative w-full aspect-[3/4] rounded-xl overflow-hidden cursor-pointer group perspective-1000" 
          onClick={() => setIsModalOpen(true)}
        >
          {/* Glass Container - Ultra clear */}
          <div className="absolute inset-0 rounded-xl border border-white/20 bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur-[1px] transition-all duration-500 group-hover:border-white/40 group-hover:bg-white/[0.08]" />
          
          {/* Content */}
          <div className="absolute inset-3 z-10 flex items-center justify-center">
            {equippedProp ? (
              <motion.div 
                className="w-full h-full relative transform-gpu"
                whileHover={{ scale: 1.05, rotateY: 5, z: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <img 
                  src={equippedProp.image} 
                  alt={equippedProp.name} 
                  className="w-full h-full object-cover rounded-lg shadow-2xl opacity-100"
                />
                {/* Card Gloss */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-50 pointer-events-none" />
                {/* Inner Border */}
                <div className="absolute inset-0 rounded-lg border border-white/10" />
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center text-white/20">
                <Shield className="w-6 h-6 mb-1 opacity-50" />
                <span className="text-[9px]">Empty</span>
              </div>
            )}
          </div>

          {/* Glass Reflections */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top Shine */}
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/[0.05] to-transparent" />
            {/* Diagonal Reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent transform -skew-x-12" />
          </div>
        </div>
      </div>

      {/* Modal Viewer */}
      <AnimatePresence>
        {isModalOpen && equippedProp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="relative aspect-[3/4] bg-black/50">
                <img src={equippedProp.image} alt={equippedProp.name} className="w-full h-full object-contain" />
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 hover:bg-white/20 text-white/70 hover:text-white backdrop-blur-md flex items-center justify-center transition-colors border border-white/10"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 bg-slate-900/50 backdrop-blur-md">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-white">{equippedProp.name}</h2>
                  <span className="text-[10px] font-bold px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 uppercase tracking-wider">
                    {equippedProp.status}
                  </span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">
                  {equippedProp.description}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}