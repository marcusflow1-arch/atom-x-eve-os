import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Sparkles, Gamepad2, ChevronRight, LayoutGrid, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ShinyCard from '@/components/shared/ShinyCard';

// Developer data
const DEVELOPERS = [
  {
    id: 'ubisoft',
    name: 'Ubisoft',
    logo: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=64&h=64&fit=crop', // Placeholder
    games: [
      {
        id: 'ac-shadows',
        title: "Assassin's Creed Shadows",
        cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop',
        limitedCards: [
          { id: 1, name: 'Shadow Strike', type: 'Ability', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop', tag: 'Dev Limited' },
          { id: 2, name: 'Samurai Armor', type: 'Equipment', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop', tag: 'Dev Limited' },
        ]
      },
      {
        id: 'fc7',
        title: 'Far Cry 7',
        cover: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop',
        limitedCards: [
          { id: 4, name: 'Guerrilla Tactics', type: 'Ability', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=600&fit=crop', tag: 'Dev Limited' },
        ]
      }
    ]
  },
  {
    id: 'cdpr',
    name: 'CD Projekt Red',
    logo: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=64&h=64&fit=crop',
    games: [
      {
        id: 'cyberpunk-2',
        title: 'Cyberpunk 2088',
        cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop',
        limitedCards: [
          { id: 7, name: 'Neural Hack', type: 'Ability', rarity: 'Mythic', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop', tag: 'Dev Limited' },
          { id: 8, name: 'Chrome Arms', type: 'Equipment', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop', tag: 'Dev Limited' },
        ]
      },
      {
        id: 'witcher4',
        title: 'The Witcher 4',
        cover: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
        limitedCards: [
          { id: 10, name: 'Igni Mastery', type: 'Ability', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop', tag: 'Dev Limited' },
        ]
      }
    ]
  },
  {
    id: 'bethesda',
    name: 'Bethesda',
    logo: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=64&h=64&fit=crop',
    games: [
      {
        id: 'tes6',
        title: 'Elder Scrolls VI',
        cover: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
        limitedCards: [
          { id: 12, name: 'Dragonborn Shout', type: 'Ability', rarity: 'Mythic', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop', tag: 'Dev Limited' },
        ]
      }
    ]
  },
  {
    id: 'fromsoft',
    name: 'FromSoftware',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=64&h=64&fit=crop',
    games: [
      {
        id: 'elden-ring-dlc',
        title: 'Elden Ring: Nightreign',
        cover: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
        limitedCards: [
          { id: 17, name: 'Voidtech Slayer', type: 'Ability', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop', tag: 'Dev Limited' },
        ]
      }
    ]
  }
];

const rarityColors = {
  Mythic: { bg: 'bg-red-900/50', border: 'border-red-500', text: 'text-red-300' },
  Legendary: { bg: 'bg-yellow-900/50', border: 'border-yellow-500', text: 'text-yellow-300' },
  Epic: { bg: 'bg-purple-900/50', border: 'border-purple-500', text: 'text-purple-300' },
  Rare: { bg: 'bg-blue-900/50', border: 'border-blue-500', text: 'text-blue-300' },
  Common: { bg: 'bg-slate-700/50', border: 'border-slate-500', text: 'text-slate-300' }
};

export default function DeveloperLimitedEdition() {
  const [activeTab, setActiveTab] = useState(DEVELOPERS[0].id);
  const activeDeveloper = DEVELOPERS.find(d => d.id === activeTab) || DEVELOPERS[0];

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          Developer Limited Editions
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-white/10 text-white/50 text-[10px]">Official Partners</Badge>
        </div>
      </div>

      {/* Developer Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
        {DEVELOPERS.map(dev => (
          <button
            key={dev.id}
            onClick={() => setActiveTab(dev.id)}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all border min-w-[160px]
              ${activeTab === dev.id 
                ? 'bg-white/10 border-amber-500/50 text-white shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:text-white'}
            `}
          >
            <div className="w-8 h-8 rounded-lg bg-black/40 overflow-hidden flex-shrink-0">
              <img src={dev.logo} alt={dev.name} className="w-full h-full object-cover opacity-80" />
            </div>
            <span className="font-bold text-sm truncate">{dev.name}</span>
          </button>
        ))}
        <button className="flex items-center justify-center px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-white/40 hover:bg-white/10 transition-all">
          <LayoutGrid className="w-5 h-5" />
          <span className="ml-2 text-sm">View All</span>
        </button>
      </div>

      {/* Content Area for Active Developer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 rounded-2xl p-6 border border-white/5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeDeveloper.games.map(game => (
              <div key={game.id} className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <img src={game.cover} alt={game.title} className="w-10 h-10 rounded-lg object-cover" />
                  <div>
                    <h3 className="text-white font-bold text-sm">{game.title}</h3>
                    <p className="text-white/40 text-[10px]">{game.limitedCards.length} Limited Items</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {game.limitedCards.map(card => {
                    const rarity = rarityColors[card.rarity] || rarityColors.Common;
                    return (
                      <div key={card.id} className="group cursor-pointer">
                        <ShinyCard className="rounded-lg overflow-hidden relative aspect-[3/1] flex">
                          <div className="w-1/3 relative">
                            <img src={card.image} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900/90" />
                          </div>
                          <div className="w-2/3 p-3 flex flex-col justify-center bg-slate-900/40 backdrop-blur-sm">
                            <div className="flex justify-between items-start mb-1">
                              <Badge className={`text-[8px] px-1.5 py-0 border-none ${rarity.bg} ${rarity.text}`}>
                                {card.rarity}
                              </Badge>
                              <Badge variant="outline" className="text-[8px] border-white/10 text-white/40">{card.type}</Badge>
                            </div>
                            <h4 className="text-white font-bold text-sm leading-tight group-hover:text-amber-400 transition-colors">
                              {card.name}
                            </h4>
                            <p className="text-[9px] text-white/30 mt-1 truncate">{card.tag}</p>
                          </div>
                        </ShinyCard>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}