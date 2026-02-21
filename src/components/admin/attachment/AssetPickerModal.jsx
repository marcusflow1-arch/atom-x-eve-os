import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Box, Sparkles, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

/**
 * Modal to pick from existing Model3D or ReactorFX assets.
 * type: 'object' | 'effect'
 */
export default function AssetPickerModal({ type, models3d = [], reactorFx = [], animations = [], onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(type === 'effect' ? 'fx' : 'models');

  const q = search.toLowerCase();

  const filteredModels = models3d.filter(m =>
    (m.name || '').toLowerCase().includes(q) ||
    (m.category || '').toLowerCase().includes(q) ||
    (m.tags || []).some(t => t.toLowerCase().includes(q))
  );

  const filteredFx = reactorFx.filter(f =>
    (f.name || '').toLowerCase().includes(q) ||
    (f.effect_type || '').toLowerCase().includes(q)
  );

  const filteredAnims = animations.filter(a =>
    (a.name || '').toLowerCase().includes(q) ||
    (a.animation_type || '').toLowerCase().includes(q)
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-[600px] max-h-[70vh] bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <h3 className="text-white font-bold text-sm">
            {type === 'effect' ? 'Pick Effect / Animation' : 'Pick 3D Object'}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3">
          {type !== 'effect' && (
            <button
              onClick={() => setTab('models')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${tab === 'models' ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30' : 'text-slate-500 border border-transparent hover:text-white'}`}
            >
              <Box className="w-3 h-3 inline mr-1" /> 3D Models ({filteredModels.length})
            </button>
          )}
          <button
            onClick={() => setTab('fx')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${tab === 'fx' ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/30' : 'text-slate-500 border border-transparent hover:text-white'}`}
          >
            <Sparkles className="w-3 h-3 inline mr-1" /> Effects ({filteredFx.length})
          </button>
          <button
            onClick={() => setTab('anims')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${tab === 'anims' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30' : 'text-slate-500 border border-transparent hover:text-white'}`}
          >
            <FileText className="w-3 h-3 inline mr-1" /> Animations ({filteredAnims.length})
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets..."
              className="bg-slate-950 border-slate-700 h-8 text-[11px] pl-8"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1" style={{ scrollbarWidth: 'thin' }}>
          {tab === 'models' && filteredModels.map(m => (
            <button
              key={m.id}
              onClick={() => onSelect({ type: 'object', name: m.name, url: m.file_url, sourceId: m.id, sourceType: 'Model3D' })}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-transparent hover:bg-white/[0.06] hover:border-blue-500/20 transition-all text-left"
            >
              {m.thumbnail_url ? (
                <img src={m.thumbnail_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-700" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <Box className="w-5 h-5 text-slate-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="text-white text-[11px] font-medium truncate block">{m.name}</span>
                <span className="text-slate-600 text-[9px] truncate block">{m.file_type} • {m.category || 'uncategorized'}</span>
              </div>
              <Badge variant="outline" className="text-[8px] text-blue-400 border-blue-500/30">3D</Badge>
            </button>
          ))}

          {tab === 'fx' && filteredFx.map(f => (
            <button
              key={f.id}
              onClick={() => onSelect({ type: 'effect', name: f.name, url: f.file_url || '', sourceId: f.id, sourceType: 'ReactorFX', color: f.color, effectType: f.effect_type })}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-transparent hover:bg-white/[0.06] hover:border-cyan-500/20 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg border border-slate-700 flex items-center justify-center" style={{ backgroundColor: (f.color || '#ffffff') + '20' }}>
                <Sparkles className="w-5 h-5" style={{ color: f.color || '#ffffff' }} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-white text-[11px] font-medium truncate block">{f.name}</span>
                <span className="text-slate-600 text-[9px] truncate block">{f.effect_type} • {f.is_looping ? 'looping' : 'one-shot'}</span>
              </div>
              <Badge variant="outline" className="text-[8px] text-cyan-400 border-cyan-500/30">FX</Badge>
            </button>
          ))}

          {tab === 'anims' && filteredAnims.map(a => (
            <button
              key={a.id}
              onClick={() => onSelect({ type: 'effect', name: a.name, url: a.file_url, sourceId: a.id, sourceType: 'AnimationFBX', animationType: a.animation_type })}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-transparent hover:bg-white/[0.06] hover:border-purple-500/20 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-slate-700 flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-white text-[11px] font-medium truncate block">{a.name}</span>
                <span className="text-slate-600 text-[9px] truncate block">{a.animation_type} • {a.is_loopable ? 'loop' : 'once'}</span>
              </div>
              <Badge variant="outline" className="text-[8px] text-purple-400 border-purple-500/30">Anim</Badge>
            </button>
          ))}

          {((tab === 'models' && filteredModels.length === 0) ||
            (tab === 'fx' && filteredFx.length === 0) ||
            (tab === 'anims' && filteredAnims.length === 0)) && (
            <div className="text-center py-8 text-slate-600 text-[11px]">No assets found</div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}