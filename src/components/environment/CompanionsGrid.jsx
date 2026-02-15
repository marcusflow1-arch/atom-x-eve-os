import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Loader2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CompanionsGrid() {
  const [companions, setCompanions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [activeCompanion, setActiveCompanion] = useState(null);

  useEffect(() => {
    const fetchCompanions = async () => {
      try {
        const allModels = await base44.entities.Model3D.list();
        const matched = allModels.filter(m => m.name && (m.name.toLowerCase().includes('companion') || m.name.toLowerCase().includes('conpanion')));
        setCompanions(matched);
      } catch (e) {
        console.error('Failed to load companions:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanions();
  }, []);

  const handleSelect = (c) => {
    const isAlreadySelected = selected?.id === c.id;
    setSelected(isAlreadySelected ? null : c);
  };

  const handleSummon = (c) => {
    if (activeCompanion?.id === c.id) {
      // Dismiss
      setActiveCompanion(null);
      window.dispatchEvent(new CustomEvent('companionDismiss'));
    } else {
      setActiveCompanion(c);
      // Dispatch event with companion model data for the 3D viewer
      window.dispatchEvent(new CustomEvent('companionSummon', {
        detail: {
          id: c.id,
          name: c.name,
          fileUrl: c.file_url,
          fileType: c.file_type,
          isBundle: c.is_bundle,
          bundleManifest: c.bundle_manifest,
          entryFile: c.entry_file,
        }
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-4 h-4 text-cyan-400/50 animate-spin" />
      </div>
    );
  }

  if (companions.length === 0) {
    return (
      <div className="text-center py-8">
        <Bot className="w-6 h-6 mx-auto mb-2 text-white/10" />
        <p className="text-white/30 text-[10px] font-medium">No companions found</p>
        <p className="text-white/15 text-[9px] mt-1">Add 3D models with "Companion" in their name from Admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Active companion indicator */}
      <AnimatePresence>
        {activeCompanion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-[9px] text-purple-300 font-medium flex-1 truncate">{activeCompanion.name} active in scene</span>
            <button onClick={() => handleSummon(activeCompanion)} className="p-0.5 hover:bg-white/10 rounded">
              <X className="w-3 h-3 text-purple-300" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact grid — 4 columns, small cards */}
      <div className="grid grid-cols-4 gap-1.5">
        {companions.map(c => {
          const isSelected = selected?.id === c.id;
          const isActive = activeCompanion?.id === c.id;
          return (
            <motion.button
              key={c.id}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => { handleSelect(c); handleSummon(c); }}
              className={`relative group rounded-lg overflow-hidden border transition-all text-left ${
                isActive
                  ? 'border-purple-400/50 bg-purple-500/10 ring-1 ring-purple-400/20'
                  : isSelected
                    ? 'border-white/30 bg-white/10'
                    : 'border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15'
              }`}
            >
              <div className="aspect-square w-full bg-black/30 overflow-hidden flex items-center justify-center">
                {c.thumbnail_url ? (
                  <img src={c.thumbnail_url} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <Bot className="w-4 h-4 text-white/10" />
                )}
              </div>
              <div className="p-1">
                <h4 className="text-[8px] font-bold text-white truncate">{c.name}</h4>
              </div>
              {isActive && (
                <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selected detail + summon button */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="p-2 rounded-lg bg-white/[0.05] border border-white/[0.08]"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-black/30 overflow-hidden flex items-center justify-center flex-shrink-0">
                {selected.thumbnail_url ? (
                  <img src={selected.thumbnail_url} alt={selected.name} className="w-full h-full object-cover" />
                ) : (
                  <Bot className="w-4 h-4 text-white/20" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[10px] font-bold text-white truncate">{selected.name}</h4>
                <div className="flex items-center gap-1 mt-0.5">
                  {selected.file_type && (
                    <span className="text-[7px] px-1 py-0.5 rounded bg-white/5 text-white/30 border border-white/10 uppercase font-mono">{selected.file_type}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleSummon(selected)}
                className={`px-2.5 py-1 rounded-md text-[9px] font-bold transition-all flex-shrink-0 ${
                  activeCompanion?.id === selected.id
                    ? 'bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30'
                    : 'bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30'
                }`}
              >
                {activeCompanion?.id === selected.id ? 'Dismiss' : 'Summon'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}