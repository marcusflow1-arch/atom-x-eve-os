import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Shield } from 'lucide-react';

export default function LimitedEditionDisplay() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Default equipped state as requested
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
      <div className="w-80 rounded-2xl bg-slate-900/30 backdrop-blur-xl border border-white/10 overflow-hidden flex flex-col shadow-2xl mt-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="text-xs font-bold tracking-[0.2em] text-white/50 uppercase">Limited Edition Display</h3>
          <p className="text-[10px] text-white/30 mt-1">Showcase a featured prop</p>
        </div>

        {/* Display Slot */}
        <div className="p-6 flex justify-center">
          {equippedProp ? (
            <motion.div 
              whileHover={{ scale: 1.02, rotateX: 5, rotateY: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={() => setIsModalOpen(true)}
              className="relative w-full aspect-[3/4] rounded-xl cursor-pointer group perspective-1000"
            >
              {/* Glass Frame */}
              <div className="absolute inset-0 rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm z-20 pointer-events-none shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] group-hover:border-white/40 transition-colors" />
              
              {/* Shine Effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 z-30 transition-opacity duration-500 pointer-events-none" />

              {/* Image */}
              <div className="absolute inset-2 rounded-lg overflow-hidden bg-black/50 z-10">
                <img 
                  src={equippedProp.image} 
                  alt={equippedProp.name} 
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
              </div>
              
              {/* Reflection/Depth Hint */}
              <div className="absolute inset-0 rounded-xl shadow-2xl z-0" />
            </motion.div>
          ) : (
            <div className="w-full aspect-[3/4] rounded-xl border border-white/10 border-dashed flex flex-col items-center justify-center text-white/20 bg-white/[0.02]">
              <Shield className="w-8 h-8 mb-2 opacity-50" />
              <span className="text-xs font-medium">No prop selected</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal Viewer */}
      <AnimatePresence>
        {isModalOpen && equippedProp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-1"
            >
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-black/50">
                <img 
                  src={equippedProp.image} 
                  alt={equippedProp.name} 
                  className="w-full h-full object-contain"
                />
                
                {/* Close Button */}
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/70 hover:text-white backdrop-blur-md transition-colors border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h2 className="text-xl font-bold text-white">{equippedProp.name}</h2>
                    <p className="text-sm text-cyan-400 font-medium tracking-wide">{equippedProp.status}</p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-white/70">
                    {equippedProp.type}
                  </div>
                </div>
                
                <p className="text-white/50 text-sm leading-relaxed mb-6">
                  {equippedProp.description}
                </p>

                <button 
                  className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-medium transition-all"
                  onClick={() => setIsModalOpen(false)} // Placeholder for "Change Display"
                >
                  Change Display
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}