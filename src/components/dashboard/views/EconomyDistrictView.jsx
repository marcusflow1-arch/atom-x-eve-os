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
      {/* Section Selector */}
      <div className="flex gap-2 mb-4 bg-slate-900/50 p-2 rounded-xl border border-slate-700/50">
        {economySections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
                activeSection === section.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <Icon className={`w-5 h-5 ${activeSection === section.id ? 'text-white' : section.color}`} />
              <span>{section.label}</span>
            </button>
          );
        })}
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