import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CompanionsGrid() {
  const [companions, setCompanions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const allModels = await base44.entities.Model3D.list();
        const matched = allModels.filter(m => m.name && m.name.toLowerCase().includes('companion'));
        setCompanions(matched);
      } catch (e) {
        console.error('Failed to load companions:', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 text-cyan-400/50 animate-spin" />
      </div>
    );
  }

  if (companions.length === 0) {
    return (
      <div className="text-center py-12">
        <Bot className="w-8 h-8 mx-auto mb-2 text-white/10" />
        <p className="text-white/30 text-xs font-medium">No companions found</p>
        <p className="text-white/15 text-[10px] mt-1">Add 3D models with "Companion" in their name from the Admin page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {companions.map(c => {
          const isSelected = selected?.id === c.id;
          return (
            <motion.button
              key={c.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelected(isSelected ? null : c)}
              className={`relative group rounded-lg overflow-hidden border transition-all text-left ${
                isSelected
                  ? 'border-purple-400/40 bg-white/10 ring-1 ring-purple-400/20'
                  : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20'
              }`}
            >
              <div className="aspect-square w-full bg-black/30 overflow-hidden flex items-center justify-center">
                {c.thumbnail_url ? (
                  <img src={c.thumbnail_url} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <Bot className="w-6 h-6 text-white/10" />
                )}
              </div>
              <div className="p-1.5">
                <h4 className="text-[10px] font-bold text-white truncate">{c.name}</h4>
                {c.file_type && (
                  <span className="text-[8px] px-1 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/20 font-semibold uppercase">{c.file_type}</span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Selected Companion Detail */}
      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-white/[0.06] border border-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-black/30 overflow-hidden flex items-center justify-center flex-shrink-0">
              {selected.thumbnail_url ? (
                <img src={selected.thumbnail_url} alt={selected.name} className="w-full h-full object-cover" />
              ) : (
                <Bot className="w-5 h-5 text-white/20" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white truncate">{selected.name}</h4>
              {selected.description && (
                <p className="text-[10px] text-white/40 truncate mt-0.5">{selected.description}</p>
              )}
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[8px] px-1 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/20 font-semibold">Companion</span>
                {selected.file_type && (
                  <span className="text-[8px] px-1 py-0.5 rounded bg-white/5 text-white/30 border border-white/10 uppercase font-mono">{selected.file_type}</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}