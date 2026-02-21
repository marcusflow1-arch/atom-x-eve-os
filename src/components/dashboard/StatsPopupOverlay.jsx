import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Layers, Backpack, ChevronDown } from 'lucide-react';
import AvatarProgressionBox from '@/components/avatar/AvatarProgressionBox';
import InventoryEquipOverlay from '@/components/profile/InventoryEquipOverlay';
import InventoryPanel from '@/components/profile/InventoryPanel';

const TABS = [
  { id: 'stats', label: 'Skill Tree', icon: Layers },
  { id: 'inventory', label: 'Inventory', icon: Backpack },
];

export default function StatsPopupOverlay({ activeTab = 'stats', onTabChange, onClose }) {
  const currentTab = activeTab;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, marginTop: 0 }}
      animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
      exit={{ opacity: 0, height: 0, marginTop: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full overflow-hidden rounded-2xl pointer-events-auto"
      style={{
        background: 'rgba(10, 14, 22, 0.90)',
        backdropFilter: 'blur(40px) saturate(150%)',
        WebkitBackdropFilter: 'blur(40px) saturate(150%)',
        border: '1px solid rgba(255, 255, 255, 0.10)',
        boxShadow: '0 12px 48px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 flex-shrink-0">
        <div className="flex items-center gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white/10 text-white border border-white/15'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto p-5" style={{ scrollbarWidth: 'none', maxHeight: '60vh' }}>
        {currentTab === 'stats' && <AvatarProgressionBox />}
        {currentTab === 'inventory' && (
          <div className="text-white">
            <InventoryEquipOverlay embedded />
          </div>
        )}
      </div>
    </motion.div>
  );
}