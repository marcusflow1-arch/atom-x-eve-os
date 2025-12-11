import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, Sparkles, Shield, Zap, ChevronLeft, Grid, Gamepad2, Crown, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

export default function CrossGameFusion() {
   const navigate = useNavigate();
   const [selectedGame1, setSelectedGame1] = useState(null);
   const [selectedGame2, setSelectedGame2] = useState(null);
   const [selectedCard1, setSelectedCard1] = useState(null);
   const [selectedCard2, setSelectedCard2] = useState(null);

   // Mock games list
   const gamesList = [
      { id: 'elder_scrolls', name: 'Elder Scrolls: Reborn', genre: 'Fantasy RPG', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop' },
      { id: 'cyberpunk', name: 'Cyberpunk 2088', genre: 'Sci-Fi', image: 'https://images.unsplash.com/photo-1535378437327-b71494669e91?w=300&h=300&fit=crop' },
      { id: 'mage_wars', name: 'Mage Wars Online', genre: 'MMORPG', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=300&h=300&fit=crop' },
      { id: 'galactic_warfare', name: 'Galactic Warfare', genre: 'Shooter', image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=300&h=300&fit=crop' },
   ];

   // Generate cards for a game
   const getGameCards = (gameId) => {
      return Array.from({ length: 12 }, (_, i) => ({
         id: `${gameId}_card_${i}`,
         name: `${gamesList.find(g => g.id === gameId)?.name} Card ${i + 1}`,
         rarity: ['Common', 'Rare', 'Epic', 'Legendary'][i % 4],
         type: i % 2 === 0 ? 'Weapon' : 'Armor',
         image: gamesList.find(g => g.id === gameId)?.image,
         level: Math.floor(Math.random() * 20) + 1,
         ability: i % 3 === 0 ? 'Fire Strike' : i % 3 === 1 ? 'Ice Shard' : 'Lightning Bolt'
      }));
   };

   const handleFusion = () => {
      if (!selectedCard1 || !selectedCard2) {
         alert('Select 2 cards from different games!');
         return;
      }
      alert(`Fusion complete! Created a new hybrid card combining abilities from both ${selectedCard1.name} and ${selectedCard2.name}!`);
      setSelectedCard1(null);
      setSelectedCard2(null);
   };

   return (
      <div className="min-h-screen w-full bg-slate-900 text-white p-8">
         {/* Header */}
         <div className="max-w-[1920px] mx-auto mb-8">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors">
               <ChevronLeft className="w-5 h-5" />
               <span className="text-sm font-medium">Back to Blacksmith</span>
            </button>
            
            <div className="flex items-center gap-3 mb-2">
               <Flame className="w-8 h-8 text-orange-400" />
               <h1 className="text-4xl font-black text-white">Cross-Game Fusion</h1>
            </div>
            <p className="text-white/50">Combine cards from different games to create unique hybrid abilities</p>
         </div>

         {/* Main Layout */}
         <div className="max-w-[1920px] mx-auto flex gap-6 h-[calc(100vh-200px)]">
            {/* LEFT: Game Selection */}
            <div className="w-64 bg-white/5 rounded-2xl border border-white/10 p-5 overflow-y-auto">
               <h3 className="text-white/60 text-xs font-bold uppercase mb-4 flex items-center gap-2">
                  <Grid className="w-4 h-4" /> Game Library
               </h3>
               <div className="space-y-2">
                  {gamesList.map((game) => (
                     <button
                        key={game.id}
                        onClick={() => {
                           if (!selectedCard1) {
                              setSelectedGame1(game);
                           } else {
                              setSelectedGame2(game);
                           }
                        }}
                        className={`w-full text-left px-3 py-3 rounded-lg transition-all flex items-center gap-3 ${
                           selectedGame1?.id === game.id || selectedGame2?.id === game.id
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
                              : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                     >
                        <Gamepad2 className="w-4 h-4" />
                        <div className="flex-1 min-w-0">
                           <div className="text-sm font-bold truncate">{game.name}</div>
                           <div className="text-[10px] text-white/40">{game.genre}</div>
                        </div>
                     </button>
                  ))}
               </div>
            </div>

            {/* MIDDLE: Inventory Grid */}
            <div className="flex-1 bg-white/5 rounded-2xl border border-white/10 p-6 overflow-hidden flex flex-col">
               <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-white font-bold">
                     {selectedCard1 ? (selectedGame2?.name || 'Select Second Game') : (selectedGame1?.name || 'Select a Game')}
                  </h3>
                  <Badge className="bg-white/10 text-white/60 text-xs">
                     {selectedCard1 ? (getGameCards(selectedGame2?.id || selectedGame1?.id).length) : (selectedGame1 ? getGameCards(selectedGame1.id).length : 0)} Cards
                  </Badge>
               </div>

               <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-4 gap-3">
                     {(selectedCard1 ? (selectedGame2 ? getGameCards(selectedGame2.id) : []) : (selectedGame1 ? getGameCards(selectedGame1.id) : [])).map((card) => (
                        <div
                           key={card.id}
                           onClick={() => {
                              if (!selectedCard1) {
                                 setSelectedCard1(card);
                              } else if (!selectedCard2) {
                                 setSelectedCard2(card);
                              }
                           }}
                           className={`aspect-square rounded-lg border-2 relative cursor-pointer transition-all hover:scale-105 ${
                              card.rarity === 'Legendary' ? 'border-orange-500/50 bg-orange-500/10' :
                              card.rarity === 'Epic' ? 'border-purple-500/50 bg-purple-500/10' :
                              card.rarity === 'Rare' ? 'border-blue-500/50 bg-blue-500/10' :
                              'border-slate-600 bg-slate-800/50'
                           } hover:shadow-lg`}
                        >
                           <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                              <Shield className={`w-10 h-10 mb-1 ${
                                 card.rarity === 'Legendary' ? 'text-orange-400' :
                                 card.rarity === 'Epic' ? 'text-purple-400' :
                                 card.rarity === 'Rare' ? 'text-blue-400' : 'text-slate-400'
                              }`} />
                              <div className="text-[8px] font-mono text-white/60 text-center truncate w-full px-1">{card.name}</div>
                           </div>

                           <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-bold text-white">
                              Lv.{card.level}
                           </div>

                           <div className="absolute top-1 right-1 text-xs">{card.rarity === 'Legendary' ? '⭐' : card.rarity === 'Epic' ? '💜' : '🔵'}</div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* RIGHT: Fusion Chamber */}
            <div className="w-80 bg-white/5 rounded-2xl border border-white/10 p-6 flex flex-col">
               <div className="text-center mb-6">
                  <h3 className="text-2xl font-black text-white mb-1">Fusion Chamber</h3>
                  <p className="text-white/40 text-xs">Merge abilities from 2 different games</p>
               </div>

               {/* Slot 1 */}
               <div className={`aspect-[3/4] rounded-xl border-2 flex flex-col items-center justify-center mb-4 transition-all ${
                  selectedCard1 ? 'bg-purple-500/20 border-purple-500/70' : 'border-white/20 bg-white/5 border-dashed'
               }`}>
                  {selectedCard1 ? (
                     <>
                        <Shield className="w-16 h-16 text-purple-300 mb-2" />
                        <span className="font-bold text-white text-sm text-center px-2">{selectedCard1.name}</span>
                        <Badge className="mt-2 bg-purple-500/20 text-purple-300 text-[10px]">{selectedCard1.ability}</Badge>
                        <button onClick={() => { setSelectedCard1(null); setSelectedGame1(null); }} className="mt-2 text-[10px] text-red-400 hover:text-red-300">
                           Remove
                        </button>
                     </>
                  ) : (
                     <>
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2">
                           <div className="text-2xl text-white/40">1</div>
                        </div>
                        <span className="text-white/40 text-xs">Select Game 1 Card</span>
                     </>
                  )}
               </div>

               {/* Plus Icon */}
               <div className="flex justify-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                     <ArrowLeftRight className="w-4 h-4 text-white/60" />
                  </div>
               </div>

               {/* Slot 2 */}
               <div className={`aspect-[3/4] rounded-xl border-2 flex flex-col items-center justify-center mb-6 transition-all ${
                  selectedCard2 ? 'bg-cyan-500/20 border-cyan-500/70' : 'border-white/20 bg-white/5 border-dashed'
               }`}>
                  {selectedCard2 ? (
                     <>
                        <Shield className="w-16 h-16 text-cyan-300 mb-2" />
                        <span className="font-bold text-white text-sm text-center px-2">{selectedCard2.name}</span>
                        <Badge className="mt-2 bg-cyan-500/20 text-cyan-300 text-[10px]">{selectedCard2.ability}</Badge>
                        <button onClick={() => { setSelectedCard2(null); setSelectedGame2(null); }} className="mt-2 text-[10px] text-red-400 hover:text-red-300">
                           Remove
                        </button>
                     </>
                  ) : (
                     <>
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2">
                           <div className="text-2xl text-white/40">2</div>
                        </div>
                        <span className="text-white/40 text-xs">Select Game 2 Card</span>
                     </>
                  )}
               </div>

               {/* Fusion Info */}
               {selectedCard1 && selectedCard2 && (
                  <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-xl p-4 mb-4 border border-white/10">
                     <div className="text-xs font-bold text-white/80 uppercase mb-2">Fusion Result</div>
                     <div className="text-white/60 text-xs space-y-1">
                        <div>• Combined Abilities: {selectedCard1.ability} + {selectedCard2.ability}</div>
                        <div>• Rarity: Hybrid {selectedCard1.rarity}</div>
                        <div>• Type: Cross-Genre Weapon</div>
                     </div>
                  </div>
               )}

               {/* Fusion Button */}
               <Button 
                  onClick={handleFusion} 
                  disabled={!selectedCard1 || !selectedCard2}
                  className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 h-14 text-lg font-bold"
               >
                  <Flame className="w-5 h-5 mr-2" />
                  Fuse Cards
               </Button>
            </div>
         </div>
      </div>
   );
}