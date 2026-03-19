import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPortal } from 'react-dom';

export default function QuickChangeEnvDrawer({ open, onClose, currentEnvId, onSelectEnv }) {
  const [envs, setEnvs] = useState([]);

  useEffect(() => {
    if (!open) return;
    const fetchEnvs = async () => {
      try {
        const allModels = await base44.entities.Model3D.list();
        const rooms = allModels.filter(m => m.name && m.name.toLowerCase().includes('room'));
        setEnvs(rooms);
      } catch (e) {
        console.error("Failed to fetch environments for quick change", e);
      }
    };
    fetchEnvs();
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={onClose}
            style={{ pointerEvents: 'all' }}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-[15vw] min-w-[200px] z-[9999] flex flex-col border-l border-white/10"
            style={{
              background: 'rgba(10, 14, 20, 0.95)',
              backdropFilter: 'blur(30px) saturate(150%)',
              pointerEvents: 'all'
            }}
          >
            <div className="p-4 flex items-center justify-between border-b border-white/10 mt-[64px]">
              <h2 className="text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                Quick Change
              </h2>
              <button onClick={onClose} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <X className="w-3 h-3 text-white/60" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {envs.map(env => (
                <button
                  key={env.id}
                  onClick={() => {
                    if (onSelectEnv) {
                      onSelectEnv({
                        id: env.id,
                        name: env.name,
                        modelUrl: env.file_url,
                        isSkybox: false
                      });
                    }
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${currentEnvId === env.id ? 'bg-cyan-500/20 border border-cyan-500/30' : 'hover:bg-white/10 border border-transparent'}`}
                >
                  <div className="w-8 h-8 rounded bg-black/50 overflow-hidden flex-shrink-0">
                    {env.thumbnail_url ? (
                      <img src={env.thumbnail_url} alt={env.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center border border-white/10">
                        <Globe className="w-4 h-4 text-white/20" />
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-semibold truncate ${currentEnvId === env.id ? 'text-cyan-400' : 'text-white/80'}`}>{env.name}</span>
                </button>
              ))}
              {envs.length === 0 && (
                <div className="p-4 text-center text-xs text-white/40">Loading environments...</div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}