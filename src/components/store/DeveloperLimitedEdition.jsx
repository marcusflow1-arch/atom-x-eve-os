import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, ShoppingCart, Check, Gamepad2, Zap, 
  TrendingUp, Shield, Hexagon, Network, X, Star,
  Database, Radio, ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCart } from '../CartContext';

// Developer Data
const DEVELOPERS = [
  {
    id: 'ubisoft', name: 'Ubisoft', logo: 'UBI',
    games: [
      { id: 'ac-shadows', title: "Assassin's Creed Shadows", cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop', genre: 'Action RPG', year: 2024,
        limitedCards: [
          { id: 1, name: 'Shadow Strike', type: 'Ability', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
          { id: 2, name: 'Samurai Armor', type: 'Equipment', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
          { id: 3, name: 'Spirit Hawk', type: 'Companion', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop', tag: 'Store Limited Edition' },
        ]
      },
      { id: 'fc7', title: 'Far Cry 7', cover: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop', genre: 'FPS', year: 2025,
        limitedCards: [
          { id: 4, name: 'Guerrilla Tactics', type: 'Ability', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
          { id: 5, name: 'Tactical Vest', type: 'Equipment', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=600&fit=crop', tag: 'Store Limited Edition' },
        ]
      },
      { id: 'division3', title: 'The Division 3', cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop', genre: 'Looter Shooter', year: 2025,
        limitedCards: [
          { id: 6, name: 'Pulse Scanner', type: 'Ability', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
        ]
      },
    ]
  },
  {
    id: 'cdpr', name: 'CD Projekt Red', logo: 'CDPR',
    games: [
      { id: 'cyberpunk-2', title: 'Cyberpunk 2088', cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop', genre: 'Action RPG', year: 2088,
        limitedCards: [
          { id: 7, name: 'Neural Hack', type: 'Ability', rarity: 'Mythic', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
          { id: 8, name: 'Chrome Arms', type: 'Equipment', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
          { id: 9, name: 'Drone Companion', type: 'Companion', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop', tag: 'Store Limited Edition' },
        ]
      },
      { id: 'witcher4', title: 'The Witcher 4', cover: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop', genre: 'Action RPG', year: 2026,
        limitedCards: [
          { id: 10, name: 'Igni Mastery', type: 'Ability', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
          { id: 11, name: 'Silver Sword', type: 'Equipment', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
        ]
      },
    ]
  },
  {
    id: 'bethesda', name: 'Bethesda', logo: 'BETH',
    games: [
      { id: 'tes6', title: 'Elder Scrolls VI', cover: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop', genre: 'Open World RPG', year: 2027,
        limitedCards: [
          { id: 12, name: 'Dragonborn Shout', type: 'Ability', rarity: 'Mythic', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
          { id: 13, name: 'Daedric Armor', type: 'Equipment', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop', tag: 'Store Limited Edition' },
        ]
      },
      { id: 'starfield2', title: 'Starfield: Shattered Space', cover: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop', genre: 'Space RPG', year: 2025,
        limitedCards: [
          { id: 14, name: 'Gravity Well', type: 'Ability', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
        ]
      },
    ]
  },
  {
    id: 'rockstar', name: 'Rockstar Games', logo: 'R*',
    games: [
      { id: 'gta6', title: 'GTA VI', cover: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop', genre: 'Action Adventure', year: 2025,
        limitedCards: [
          { id: 15, name: 'Heist Master', type: 'Ability', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
          { id: 16, name: 'Supercar Keys', type: 'Equipment', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=600&fit=crop', tag: 'Store Limited Edition' },
        ]
      },
    ]
  },
  {
    id: 'fromsoft', name: 'FromSoftware', logo: 'FS',
    games: [
      { id: 'elden-ring-dlc', title: 'Elden Ring: Nightreign', cover: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop', genre: 'Action RPG', year: 2025,
        limitedCards: [
          { id: 17, name: 'Voidtech Slayer', type: 'Ability', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
          { id: 18, name: "Miquella's Blessing", type: 'Ability', rarity: 'Mythic', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
          { id: 19, name: 'Nightreign Armor', type: 'Equipment', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop', tag: 'Store Limited Edition' },
        ]
      },
      { id: 'armored-core', title: 'Armored Core VI', cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop', genre: 'Mech Action', year: 2023,
        limitedCards: [
          { id: 20, name: 'Core Overload', type: 'Ability', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
        ]
      },
    ]
  },
  {
    id: 'ea', name: 'Electronic Arts', logo: 'EA',
    games: [
      { id: 'mass-effect', title: 'Mass Effect 5', cover: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800&h=600&fit=crop', genre: 'Sci-Fi RPG', year: 2027,
        limitedCards: [
          { id: 21, name: 'Biotic Charge', type: 'Ability', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
        ]
      },
    ]
  },
  {
    id: 'square', name: 'Square Enix', logo: 'SQEX',
    games: [
      { id: 'ff17', title: 'Final Fantasy XVII', cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop', genre: 'JRPG', year: 2028,
        limitedCards: [
          { id: 22, name: 'Ultima Magic', type: 'Ability', rarity: 'Mythic', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
          { id: 23, name: 'Chocobo Mount', type: 'Companion', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop', tag: 'Store Limited Edition' },
        ]
      },
    ]
  },
  {
    id: 'capcom', name: 'Capcom', logo: 'CAP',
    games: [
      { id: 're10', title: 'Resident Evil 10', cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop', genre: 'Survival Horror', year: 2026,
        limitedCards: [
          { id: 24, name: 'Last Stand', type: 'Ability', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
        ]
      },
    ]
  },
  {
    id: 'konami', name: 'Konami', logo: 'KON',
    games: [
      { id: 'mgs-delta', title: 'Metal Gear Solid Δ', cover: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop', genre: 'Stealth Action', year: 2025,
        limitedCards: [
          { id: 25, name: 'CQC Master', type: 'Ability', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
        ]
      },
    ]
  },
  {
    id: 'sony', name: 'Sony Interactive', logo: 'SONY',
    games: [
      { id: 'gow-ragnarok2', title: 'God of War: Ragnarok II', cover: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop', genre: 'Action Adventure', year: 2027,
        limitedCards: [
          { id: 26, name: 'Spartan Rage', type: 'Ability', rarity: 'Mythic', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
          { id: 27, name: 'Leviathan Axe', type: 'Equipment', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=600&fit=crop', tag: 'Developer Limited Edition' },
        ]
      },
    ]
  },
];

const rarityColors = {
  Mythic: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-300', glow: 'rgba(239,68,68,0.3)' },
  Legendary: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-300', glow: 'rgba(234,179,8,0.3)' },
  Epic: { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-300', glow: 'rgba(168,85,247,0.3)' },
  Rare: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-300', glow: 'rgba(59,130,246,0.3)' },
  Common: { bg: 'bg-slate-500/20', border: 'border-slate-500/50', text: 'text-slate-300', glow: 'rgba(100,116,139,0.3)' }
};

// Flatten all games across all developers for the game grid
function getAllGames() {
  const games = [];
  DEVELOPERS.forEach(dev => {
    dev.games.forEach(game => {
      games.push({ ...game, developer: dev.name, devLogo: dev.logo });
    });
  });
  return games;
}

export default function DeveloperLimitedEdition() {
  const { addToCart, isPurchased } = useCart();
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [detailCard, setDetailCard] = useState(null);
  const [justAdded, setJustAdded] = useState(false);

  const allGames = getAllGames();

  const handleGameClick = (game) => {
    if (selectedGame?.id === game.id) {
      setSelectedGame(null);
      setSelectedCard(null);
    } else {
      setSelectedGame(game);
      setSelectedCard(null);
    }
  };

  const handleCardClick = (card) => {
    if (selectedCard?.id === card.id) {
      // Second click -> open detail popup
      setDetailCard(card);
    } else {
      setSelectedCard(card);
    }
  };

  const handleBuy = (card) => {
    if (!card) return;
    const priceMap = { 'Mythic': 95, 'Legendary': 75, 'Epic': 45, 'Rare': 25, 'Common': 10 };
    const price = priceMap[card.rarity] || 25;
    addToCart({
      id: `dev_card_${card.id}`,
      title: card.name,
      price,
      image: card.image,
      type: 'limited_card',
      rarity: card.rarity,
      game: selectedGame?.title,
      cardType: card.type
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const priceMap = { 'Mythic': '95k', 'Legendary': '75k', 'Epic': '45k', 'Rare': '25k', 'Common': '10k' };

  return (
    <div className="w-full mb-12">
      {/* Main Split Layout */}
      <div className="flex gap-0 min-h-[480px]">

        {/* LEFT: Game Grid */}
        <motion.div
          animate={{ 
            width: selectedGame ? '35%' : '100%',
            minWidth: selectedGame ? '280px' : 'auto'
          }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="flex-shrink-0 overflow-hidden"
        >
          <div className="pr-4 h-full">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Developer Limited Editions</h3>
            </div>

            <div className={`grid gap-2 ${selectedGame ? 'grid-cols-2' : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6'}`}>
              {allGames.map((game) => {
                const isSelected = selectedGame?.id === game.id;
                return (
                  <motion.button
                    key={game.id}
                    onClick={() => handleGameClick(game)}
                    layout
                    className={`relative group rounded-lg overflow-hidden border transition-all duration-300 text-left ${
                      isSelected 
                        ? 'border-cyan-500/50 ring-1 ring-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
                        : 'border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="aspect-[3/4] relative">
                      <img 
                        src={game.cover} 
                        alt={game.title} 
                        className={`w-full h-full object-cover transition-all duration-300 ${isSelected ? 'brightness-110' : 'brightness-75 group-hover:brightness-100'}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {/* Card count badge */}
                      <div className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] text-white/70 font-bold">
                        {game.limitedCards.length}
                      </div>

                      {/* Game info */}
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <h4 className="text-[11px] font-bold text-white leading-tight line-clamp-2">{game.title}</h4>
                        <p className="text-[9px] text-white/40 mt-0.5">{game.developer}</p>
                      </div>

                      {/* Selected indicator */}
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 border-2 border-cyan-400/40 rounded-lg pointer-events-none"
                        />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* RIGHT: Cards Panel (65%) */}
        <AnimatePresence>
          {selectedGame && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: '65%' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden flex-shrink-0 min-w-0"
            >
              <motion.div
                initial={{ opacity: 0, x: 30, filter: 'blur(6px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: 30, filter: 'blur(6px)' }}
                transition={{ duration: 0.35, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
                className="pl-6 border-l border-white/10 h-full flex flex-col"
              >
                {/* Header bar: Card name (left) + Buy button (right) */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-[10px]">
                      {selectedGame.developer}
                    </Badge>
                    <span className="text-white/30 text-[10px]">→</span>
                    <span className="text-white/60 text-xs font-medium">{selectedGame.title}</span>
                  </div>
                </div>

                {/* Card name + Buy button bar (above the divider) */}
                <div className="flex items-center justify-between py-3">
                  <AnimatePresence mode="wait">
                    {selectedCard ? (
                      <motion.div
                        key={selectedCard.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-3"
                      >
                        <h2 className="text-xl font-black text-white">{selectedCard.name}</h2>
                        <Badge className={`${rarityColors[selectedCard.rarity]?.bg} ${rarityColors[selectedCard.rarity]?.text} border-none text-[10px]`}>
                          {selectedCard.rarity}
                        </Badge>
                        <span className="text-white/30 text-xs">•</span>
                        <span className="text-white/50 text-xs">{selectedCard.type}</span>
                      </motion.div>
                    ) : (
                      <motion.p
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-white/30 text-sm"
                      >
                        Select a card below
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Buy button - far right, above the line */}
                  <AnimatePresence>
                    {selectedCard && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-3"
                      >
                        <div className="text-right mr-2">
                          <span className="text-lg font-black text-white">{priceMap[selectedCard.rarity]}</span>
                          <span className="text-cyan-400 font-bold text-[10px] ml-1">AGP</span>
                        </div>
                        <button
                          onClick={() => handleBuy(selectedCard)}
                          disabled={justAdded}
                          className={`px-5 py-2 rounded-lg font-bold text-xs uppercase tracking-wide flex items-center gap-2 transition-all ${
                            justAdded 
                              ? 'bg-green-500 text-white' 
                              : 'bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                          }`}
                        >
                          {justAdded ? (
                            <>Added <Check className="w-3 h-3" /></>
                          ) : (
                            <>Purchase <ShoppingCart className="w-3 h-3" /></>
                          )}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Divider line */}
                <div className="h-px bg-white/10 mb-5" />

                {/* Cards Grid - Rows */}
                <div className="flex-1 overflow-y-auto">
                  <div className="flex flex-wrap gap-3">
                    {selectedGame.limitedCards.map((card) => {
                      const rarity = rarityColors[card.rarity] || rarityColors.Common;
                      const isActive = selectedCard?.id === card.id;
                      return (
                        <motion.button
                          key={card.id}
                          onClick={() => handleCardClick(card)}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          className={`relative group w-28 aspect-[2.5/3.5] rounded-xl overflow-hidden border-2 transition-all duration-300 flex-shrink-0 ${
                            isActive
                              ? `${rarity.border} shadow-lg`
                              : 'border-white/10 hover:border-white/30'
                          }`}
                          style={isActive ? { boxShadow: `0 0 25px ${rarity.glow}` } : {}}
                        >
                          <img src={card.image} alt={card.name} className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                          {/* Rarity tag */}
                          <div className="absolute top-1.5 left-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${rarity.bg} ${rarity.text} backdrop-blur-sm`}>
                              {card.rarity}
                            </span>
                          </div>

                          {/* Card name at bottom */}
                          <div className="absolute bottom-0 left-0 right-0 p-2">
                            <h4 className="text-[10px] font-bold text-white leading-tight line-clamp-2">{card.name}</h4>
                            <p className="text-[8px] text-white/40 mt-0.5">{card.type}</p>
                          </div>

                          {/* Selection ring */}
                          {isActive && (
                            <motion.div
                              layoutId="cardRing"
                              className="absolute inset-0 rounded-xl ring-2 ring-white/30 pointer-events-none"
                            />
                          )}

                          {/* Owned badge */}
                          {isPurchased(`dev_card_${card.id}`) && (
                            <div className="absolute top-1.5 right-1.5 bg-green-500/90 backdrop-blur-sm w-5 h-5 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}

                          {/* Hint: click again for details */}
                          {isActive && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              <span className="text-[9px] text-white/80 font-bold bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
                                Click for details
                              </span>
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Tag info */}
                  {selectedCard && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 flex items-center gap-2"
                    >
                      <span className="text-[10px] text-white/30 uppercase tracking-wider font-bold">{selectedCard.tag}</span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Card Detail Popup Overlay */}
      <AnimatePresence>
        {detailCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
            onClick={() => setDetailCard(null)}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-3xl bg-[#0f1115] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
              style={{ boxShadow: '0 0 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)' }}
            >
              {/* Close Button */}
              <button 
                onClick={() => setDetailCard(null)}
                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>

              {/* Left: Card Visual */}
              <div className="w-full md:w-1/3 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 relative p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-white/5">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                
                <div className="relative w-48 aspect-[2/3] group">
                  <div className="w-full h-full rounded-xl bg-gradient-to-br from-gray-800 to-black border-2 border-white/10 relative overflow-hidden shadow-2xl">
                    <img 
                      src={detailCard.image} 
                      alt={detailCard.name} 
                      className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-6xl text-white/10 font-black">?</span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <div className={`px-2 py-0.5 rounded ${rarityColors[detailCard.rarity]?.bg} ${rarityColors[detailCard.rarity]?.text} text-[9px] font-bold w-fit mb-2 backdrop-blur-md border border-white/10`}>
                        {detailCard.rarity}
                      </div>
                      <h3 className="text-white font-bold text-lg leading-tight mb-1">{detailCard.name}</h3>
                      <div className="flex gap-1">
                        {[1,2,3].map(i => <Star key={i} className="w-2 h-2 text-yellow-400 fill-yellow-400" />)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Details */}
              <div className="flex-1 p-8 flex flex-col relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold uppercase tracking-wider">
                      {detailCard.tag}
                    </span>
                  </div>
                  
                  <h2 className="text-3xl font-black text-white mb-3 tracking-tight">{detailCard.name}</h2>
                  <p className="text-white/60 text-sm leading-relaxed mb-8">
                    A rare developer-crafted card from {selectedGame?.title}. Details and full abilities will be revealed upon purchase or unlock. This edition is limited and exclusive to the developer collection.
                  </p>

                  <div className="space-y-6">
                    <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest border-b border-white/5 pb-2">Card Details</h4>
                    
                    <div className="space-y-1 bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                      <div className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <Radio className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-white/80">Type</span>
                        </div>
                        <span className="text-white font-bold text-sm">{detailCard.type}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                            <Zap className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-white/80">Rarity</span>
                        </div>
                        <span className={`font-bold text-sm ${rarityColors[detailCard.rarity]?.text}`}>{detailCard.rarity}</span>
                      </div>

                      <div className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                            <Database className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-white/80">Power Score</span>
                        </div>
                        <span className="text-white font-mono text-xs opacity-60">?</span>
                      </div>

                      <div className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                            <Gamepad2 className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-white/80">Game</span>
                        </div>
                        <span className="text-white font-bold text-sm">{selectedGame?.title}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3">
                    <button 
                      onClick={() => { handleBuy(detailCard); setDetailCard(null); }}
                      className="flex-1 py-4 bg-cyan-500 text-black font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-cyan-400 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-cyan-500/10 flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" /> Purchase — {priceMap[detailCard.rarity]} AGP
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}