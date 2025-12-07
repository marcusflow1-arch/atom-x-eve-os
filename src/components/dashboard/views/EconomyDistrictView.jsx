import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Gavel, ArrowLeftRight, Hammer } from 'lucide-react';
import Store from '../../../pages/Store';
import Marketplace from '../../../pages/Marketplace';
import TradingPost from '../../../pages/TradingPost';
import Blacksmith from '../../../pages/Blacksmith';

const economySections = [
  { id: 'store', label: 'Store', icon: ShoppingBag, color: 'text-blue-400' },
  { id: 'marketplace', label: 'Black Market', icon: Gavel, color: 'text-green-400' },
  { id: 'trading', label: 'Trading Post', icon: ArrowLeftRight, color: 'text-purple-400' },
  { id: 'blacksmith', label: 'Blacksmith', icon: Hammer, color: 'text-orange-400' }
];

export default function EconomyDistrictView() {
  const [activeSection, setActiveSection] = useState('store');

  return (
    <div className="h-full flex flex-col">
      {/* Header with Section Selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white">Economy District</h2>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex gap-1.5 bg-slate-900/50 p-1 rounded-lg border border-slate-700/50">
            {economySections.map((section, index) => {
              const Icon = section.icon;
              return (
                <motion.button
                  key={section.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium text-xs transition-all ${
                    activeSection === section.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${activeSection === section.id ? 'text-white' : section.color}`} />
                  <span>{section.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden bg-slate-800/20 rounded-xl border border-slate-700/30">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="h-full overflow-y-auto"
        >
          {activeSection === 'store' && <Store />}
          {activeSection === 'marketplace' && <Marketplace />}
          {activeSection === 'trading' && <TradingPost />}
          {activeSection === 'blacksmith' && <Blacksmith />}
        </motion.div>
      </div>
    </div>
  );
}