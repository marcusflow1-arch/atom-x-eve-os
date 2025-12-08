import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Circle, X } from 'lucide-react';

export default function LunaTemplate() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div 
      className="min-h-screen text-white p-8 overflow-hidden relative"
      style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3548 25%, #3d4a5c 50%, #2d3548 75%, #1a1f2e 100%)' }}
    >
      {/* Circle Icon Button */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed top-24 left-8 z-40 w-11 h-11 rounded-full bg-white/[0.05] backdrop-blur-2xl hover:bg-white/[0.1] flex items-center justify-center transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-white/10"
        style={{ WebkitBackdropFilter: 'blur(40px) saturate(200%)' }}
      >
        <Circle className="w-5 h-5 text-white/80" />
      </button>

      {/* Blank Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-white/[0.03] backdrop-blur-3xl z-50 shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col rounded-r-3xl border-r border-white/10"
              style={{ WebkitBackdropFilter: 'blur(50px) saturate(200%)' }}
            >
              <div className="p-6 flex justify-end">
                  <button 
                    onClick={() => setDrawerOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-all"
                  >
                    <X className="w-4 h-4 text-white/60" />
                  </button>
              </div>
              {/* Blank Content Area */}
              <div className="flex-1"></div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}