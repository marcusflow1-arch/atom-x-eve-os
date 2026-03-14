import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Check, Home, X } from 'lucide-react';



export default function MemoriesDrawer({ references = [], activeReference, onSelectReference, onHomeClick, onClose, isExpanded }) {
  const [activeTab, setActiveTab] = useState('screenshots');

  const screenshots = references.filter(r => !r.isVideo);
  const videos = references.filter(r => r.isVideo);

  const tabs = [
    { id: 'screenshots', label: 'Screenshots', icon: '🖼️', items: screenshots },
    { id: 'videos', label: 'Video', icon: '🎬', items: videos },
  ];

  const currentItems = tabs.find(t => t.id === activeTab)?.items || [];

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex gap-1 pb-3 border-b border-white/10 flex-shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-white/10 text-white border border-white/15'
                : 'text-white/40 hover:text-white/70 border border-transparent'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Reset to Default */}
      <button
        onClick={() => { onHomeClick(); onClose(); }}
        className="mt-3 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white/50 hover:text-white transition-all text-xs flex-shrink-0"
      >
        <Home className="w-3.5 h-3.5" />
        Reset to Default Background
      </button>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 gap-2"
          >
            {currentItems.length === 0 && (
              <div className="col-span-2 flex flex-col items-center justify-center py-12 text-white/20">
                <span className="text-3xl mb-3">{tabs.find(t => t.id === activeTab)?.icon}</span>
                <p className="text-xs">No {activeTab} yet</p>
              </div>
            )}
            {currentItems.map((item) => {
              const isActive = activeReference?.id === item.id;
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { onSelectReference(item); onClose(); }}
                  className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                    isActive ? 'border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.4)]' : 'border-white/10 hover:border-white/25'
                  }`}
                >
                  {item.isVideo ? (
                    <div className="w-full h-full bg-black/60 flex items-center justify-center">
                      <Play className="w-6 h-6 text-white/60" />
                    </div>
                  ) : (
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  {isActive && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-black" />
                    </div>
                  )}
                  <div className="absolute bottom-1.5 left-2 right-2">
                    <p className="text-white text-[9px] font-semibold truncate">{item.title}</p>
                    {item.game && <p className="text-white/40 text-[8px] truncate">{item.game}</p>}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}