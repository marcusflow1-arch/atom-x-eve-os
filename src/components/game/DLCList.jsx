import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Download } from 'lucide-react';

const DLC_DATA = [
  {
    id: 'standard',
    name: 'Standard Edition',
    description: 'The base game experience with all core features and content.',
    offers: ['Base Game Content', 'Core Story Campaign', 'Standard Abilities', 'Base Card Collection'],
    stats: {},
    achievements: [],
    abilities: []
  },
  {
    id: 'dlc_1',
    name: 'Neural Expansion Pack',
    description: 'Unlock advanced neural abilities and new storyline chapters set in the cybernetic underworld.',
    offers: ['5 New Abilities', '+20% XP Boost', '3 Legendary Cards', '10 Story Missions'],
    stats: { abilities: 5, xpBoost: 20, cards: 3, missions: 10 },
    achievements: ['Neural Master', 'Cyber Overlord', 'Data Stream Complete'],
    abilities: ['Neural Shock', 'Mind Control', 'Synaptic Burst']
  },
  {
    id: 'dlc_2',
    name: 'Void Walker Arsenal',
    description: 'Gain access to stealth-focused equipment and void manipulation powers.',
    offers: ['7 New Equipment Sets', '+15% Stealth Rating', '2 Epic Traits', '5 New Weapons'],
    stats: { equipment: 7, stealthBoost: 15, traits: 2, weapons: 5 },
    achievements: ['Shadow Master', 'Void Walker'],
    abilities: ['Phase Shift', 'Shadow Clone', 'Void Manipulation']
  },
  {
    id: 'dlc_3',
    name: 'Season Pass: Year One',
    description: 'All future DLC releases for the first year, plus exclusive seasonal rewards.',
    offers: ['All DLC Access', '+50% Genre XP', 'Exclusive Avatar Skin', 'Priority Updates'],
    stats: { dlcAccess: 'unlimited', genreXP: 50 },
    achievements: ['Season Champion', 'Year One Veteran', 'Ultimate Collector'],
    abilities: ['All DLC Abilities']
  }
];

/**
 * DLC list component with expandable details
 * @param {Object} props
 * @param {Function} props.onSelectDLC - Callback when DLC is selected
 */
export default function DLCList({ onSelectDLC }) {
  const [selectedDLC, setSelectedDLC] = useState(null);

  const handleToggle = (dlc) => {
    const newSelection = selectedDLC?.id === dlc.id ? null : dlc;
    setSelectedDLC(newSelection);
    if (onSelectDLC) onSelectDLC(newSelection);
  };

  return (
    <div className="space-y-2">
      <h3 className="text-base font-bold text-white flex items-center gap-2">
        <Download className="w-4 h-4 text-purple-400" />
        DLC Content
      </h3>
      
      {DLC_DATA.filter(dlc => dlc.id !== 'standard').map((dlc) => {
        const isExpanded = selectedDLC?.id === dlc.id;
        
        return (
          <div key={dlc.id} className="overflow-hidden">
            <button
              onClick={() => handleToggle(dlc)}
              className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-all rounded-lg"
            >
              <div className="text-left">
                <p className="font-bold text-white text-sm">{dlc.name}</p>
                <p className="text-white/50 text-xs">{dlc.description}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-4 space-y-3"
                >
                  <div>
                    <h4 className="text-white/70 text-xs font-semibold uppercase mb-2">Includes:</h4>
                    <div className="space-y-1">
                      {dlc.offers.map((offer, i) => (
                        <div key={i} className="flex items-center gap-2 text-white/70 text-xs">
                          <Check className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                          <span>{offer}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {dlc.achievements?.length > 0 && (
                    <div>
                      <h4 className="text-white/70 text-xs font-semibold uppercase mb-2">Achievements:</h4>
                      <div className="flex flex-wrap gap-1">
                        {dlc.achievements.map((achievement, i) => (
                          <span key={i} className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-300 text-[10px]">
                            {achievement}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export { DLC_DATA };