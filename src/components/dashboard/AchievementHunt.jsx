
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, BrainCircuit, Heart, Shield, Star, X } from 'lucide-react';

// Enhanced pinned data with descriptions and additional rarities for demonstration
const pinnedData = {
  ability: [
    { 
      id: 'ab1', 
      name: 'Dragon Shout', 
      game: 'Elder Scrolls: Reborn', 
      icon: '🐉', 
      rarity: 'Legendary', 
      description: 'Unleash a powerful roar that can stagger foes and even change the weather. Mastered by Dragonborns across Tamriel, this ability is devastating.' 
    },
    { 
      id: 'ab2', 
      name: 'Neural Quickhack', 
      game: 'Cyberpunk 2088', 
      icon: '🧠', 
      rarity: 'Epic', 
      description: 'Infiltrate enemy systems and incapacitate targets with a single thought. Requires high intelligence and a reliable cyberdeck for optimal performance.' 
    },
    {
      id: 'ab3',
      name: 'Shadow Step',
      game: 'Assassin\'s Creed: Phantom',
      icon: '👻',
      rarity: 'Rare',
      description: 'Teleport short distances, blending into shadows. Perfect for stealthy approaches and quick escapes from dangerous situations.'
    }
  ],
  equipment: [
    { 
      id: 'eq1', 
      name: 'Dragonscale Armor', 
      game: 'Elder Scrolls: Reborn', 
      icon: '🛡️', 
      rarity: 'Legendary', 
      description: 'Crafted from the scales of ancient dragons, offering unparalleled protection and a majestic, intimidating appearance on the battlefield.' 
    },
    {
      id: 'eq2',
      name: 'Cybernetic Arm',
      game: 'Cyberpunk 2088',
      icon: '🦾',
      rarity: 'Epic',
      description: 'A high-tech prosthetic arm that significantly enhances strength, dexterity, and can integrate various tools and weapons, making you a formidable opponent.'
    }
  ],
  companion: [
     { 
       id: 'co1', 
       name: 'Shadowmere', 
       game: 'Elder Scrolls: Reborn', 
       icon: '🐴', 
       rarity: 'Legendary', 
       description: 'A loyal, immortal horse with a dark aura, appearing from the shadows to serve its master. Known for its steadfastness and resilience in combat.' 
     },
     {
       id: 'co2',
       name: 'K-9 Unit "Sparky"',
       game: 'Cyberpunk 2088',
       icon: '🐕',
       rarity: 'Rare',
       description: 'A highly trained, cybernetically enhanced canine companion, perfect for sniffing out trouble and assisting in combat with surprising ferocity.'
     }
  ],
  teacher: [
      { 
        id: 'te1', 
        name: 'Master Kai', 
        game: 'Street Fighter', 
        icon: '🥋', 
        rarity: 'Legendary', 
        description: 'A legendary martial arts master known for his devastating techniques and unwavering discipline. Learning from him guarantees mastery of any fighting style.' 
      },
      {
        id: 'te2',
        name: 'Professor Eldrin',
        game: 'Arcane Academy',
        icon: '🧙‍♂️',
        rarity: 'Epic',
        description: 'A renowned archmage specializing in elemental magic and ancient runic inscriptions. His teachings unlock the deepest secrets of arcane power.'
      }
  ],
};

const rarityStyles = {
  Legendary: 'border-orange-500/80 text-orange-400 bg-orange-900/20',
  Epic: 'border-purple-500/80 text-purple-400 bg-purple-900/20',
  Rare: 'border-blue-500/80 text-blue-400 bg-blue-900/20',
};

// New component for the detail modal to display item information
const ItemDetailModal = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose} // Close on backdrop click
    >
      <motion.div
        className="glass-panel p-6 rounded-lg border border-slate-700 w-full max-w-md relative shadow-2xl"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors p-1 rounded-full bg-slate-700/50 hover:bg-slate-700"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="text-6xl mb-4 transform scale-125">{item.icon}</div>
          <h2 className="text-3xl font-bold text-white text-center mb-2">{item.name}</h2>
          <p className="text-md text-slate-300 mb-3">{item.game}</p>
          <div className={`text-sm font-bold px-3 py-1 border rounded-full ${rarityStyles[item.rarity] || 'border-slate-600 bg-slate-700/30'}`}>
            {item.rarity}
          </div>
        </div>
        
        {item.description && (
          <p className="text-sm text-slate-400 text-center mb-6 leading-relaxed">
            {item.description}
          </p>
        )}

        <button 
          onClick={onClose} 
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors"
        >
          Got It!
        </button>
      </motion.div>
    </motion.div>
  );
};

// Renamed component from AchievementHunt to PinnedItemsHub to reflect new purpose
export default function PinnedItemsHub() {
  const [activeTab, setActiveTab] = useState('ability');
  const [detailItem, setDetailItem] = useState(null);

  const tabs = [
    { id: 'ability', icon: BrainCircuit, label: 'Abilities' },
    { id: 'equipment', icon: Shield, label: 'Equipment' },
    { id: 'companion', icon: Heart, label: 'Companions' },
    { id: 'teacher', icon: Award, label: 'Teachers' },
  ];

  const PinnedItem = ({ item, onClick }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      whileHover={{ scale: 1.02, boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)' }} // subtle hover effect
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={`relative flex items-center p-3 rounded-xl bg-slate-800/60 border border-transparent hover:border-blue-500/50 cursor-pointer overflow-hidden group`}
      onClick={() => onClick(item)}
    >
      {/* Background overlay for visual effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/0 to-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className="relative flex items-center gap-4 z-10"> {/* z-10 to keep content above overlay */}
        <div className="text-4xl leading-none">{item.icon}</div> {/* Larger icon */}
        <div>
          <p className="font-bold text-lg text-white mb-0.5">{item.name}</p> {/* Larger, bolder name */}
          <p className="text-sm text-slate-400">{item.game}</p>
        </div>
      </div>
      <div className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${rarityStyles[item.rarity] || 'border-slate-600 bg-slate-700/30'} z-10`}>
        {item.rarity}
      </div>
    </motion.div>
  );

  return (
    <div className="glass-panel p-6 flex flex-col h-[600px] w-full max-w-md mx-auto rounded-2xl shadow-xl"> {/* Increased height, max-width, more rounded corners */}
      <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3"> {/* Larger title, more gap */}
        <Star className="w-6 h-6 text-yellow-400" />
        My Pinned Items {/* Changed title to reflect a "hub" of items */}
      </h3>

      <div className="flex border-b border-slate-700 mb-4 bg-slate-800/30 rounded-t-lg"> {/* Slightly more styled tab container */}
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 p-3 text-xs md:text-sm font-semibold transition-all duration-300 flex flex-col items-center group
                        ${activeTab === tab.id ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-700/40' : 'text-slate-400 hover:text-white hover:bg-slate-700/20'}`}
          >
            <tab.icon className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" /> {/* Larger icon in tabs, hover scale */}
            <span className="mt-1">{tab.label}</span> {/* Ensure label is separate for spacing */}
          </button>
        ))}
      </div>

      <div className="flex-grow overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-slate-800"> {/* Added custom scrollbar styling */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col space-y-3" // Ensure items stack nicely
          >
            {pinnedData[activeTab]?.length > 0 ? (
              pinnedData[activeTab].map(item => <PinnedItem key={item.id} item={item} onClick={setDetailItem} />)
            ) : (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-center text-sm text-slate-500 pt-8"
              >
                No {activeTab} items pinned. Explore to find new ones!
              </motion.p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

       <AnimatePresence>
        {detailItem && (
          <ItemDetailModal item={detailItem} onClose={() => setDetailItem(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
