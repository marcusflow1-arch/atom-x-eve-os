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
   const [fusedCard, setFusedCard] = useState(null);

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
      
      // Create fused card
      const newFusedCard = {
         id: `fused_${Date.now()}`,
         name: `${selectedCard1.name.split(' ')[0]}-${selectedCard2.name.split(' ')[0]} Hybrid`,
         rarity: selectedCard1.rarity === 'Legendary' || selectedCard2.rarity === 'Legendary' ? 'Legendary' : 'Epic',
         type: 'Hybrid',
         ability: `${selectedCard1.ability} + ${selectedCard2.ability}`,
         level: Math.max(selectedCard1.level, selectedCard2.level),
         sourceCards: [selectedCard1, selectedCard2]
      };
      
      setFusedCard(newFusedCard);
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
            <div className="w-96 bg-white/5 rounded-2xl border border-white/10 p-8 flex flex-col items-center">
               {/* Title */}
               <h2 className="text-3xl font-black text-white mb-2">Fusion Chamber</h2>
               <p className="text-white/50 text-sm mb-8 text-center">Merge two cards from other games to make one card</p>

               {/* Fusion Container Box */}
               <div className="w-full bg-black/20 rounded-2xl border border-white/20 p-6 mb-6">
                  {/* Top Row: Card1 + Card2 */}
                  <div className="flex items-center justify-center gap-4 mb-6">
                     {/* Card Slot 1 */}
                     <div className={`w-32 aspect-[3/4] rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                        selectedCard1 ? 'bg-purple-500/20 border-purple-500/70' : 'border-white/30 bg-white/5 border-dashed'
                     }`}>
                        {selectedCard1 ? (
                           <div className="relative w-full h-full">
                              <img src={selectedCard1.image} alt="" className="w-full h-full object-cover rounded-lg" />
                              <button onClick={() => { setSelectedCard1(null); setSelectedGame1(null); }} className="absolute top-1 right-1 w-5 h-5 bg-black/80 rounded-full flex items-center justify-center text-red-400 hover:text-red-300 text-xs">
                                 ×
                              </button>
                           </div>
                        ) : (
                           <div className="text-center">
                              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2">
                                 <span className="text-xl text-white/40">1</span>
                              </div>
                              <span className="text-white/40 text-[10px]">Card 1</span>
                           </div>
                        )}
                     </div>

                     {/* Plus Sign */}
                     <div className="text-white/60 text-3xl font-bold">+</div>

                     {/* Card Slot 2 */}
                     <div className={`w-32 aspect-[3/4] rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                        selectedCard2 ? 'bg-cyan-500/20 border-cyan-500/70' : 'border-white/30 bg-white/5 border-dashed'
                     }`}>
                        {selectedCard2 ? (
                           <div className="relative w-full h-full">
                              <img src={selectedCard2.image} alt="" className="w-full h-full object-cover rounded-lg" />
                              <button onClick={() => { setSelectedCard2(null); setSelectedGame2(null); }} className="absolute top-1 right-1 w-5 h-5 bg-black/80 rounded-full flex items-center justify-center text-red-400 hover:text-red-300 text-xs">
                                 ×
                              </button>
                           </div>
                        ) : (
                           <div className="text-center">
                              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2">
                                 <span className="text-xl text-white/40">2</span>
                              </div>
                              <span className="text-white/40 text-[10px]">Card 2</span>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Equals Sign */}
                  <div className="flex justify-center mb-4">
                     <div className="text-white/60 text-2xl font-bold">=</div>
                  </div>

                  {/* Result Box */}
                  <div className="w-full">
                     {fusedCard ? (
                        <motion.div
                           initial={{ scale: 0, rotate: -180, opacity: 0 }}
                           animate={{ scale: 1, rotate: 0, opacity: 1 }}
                           transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        >
                           {/* Stacked Cards Visual */}
                           <div className="relative w-full aspect-[3/4]">
                              {/* Back Card (Card 2) - Most Behind */}
                              <div 
                                 className="absolute inset-0 rounded-xl border-2 border-cyan-500/30 bg-slate-800 overflow-hidden"
                                 style={{ transform: 'translateX(16px) translateY(16px) scale(0.88)', zIndex: 1 }}
                              >
                                 <img src={fusedCard.sourceCards[1].image} alt="" className="w-full h-full object-cover opacity-50" />
                                 <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                              </div>

                              {/* Middle Card (Card 1) */}
                              <div 
                                 className="absolute inset-0 rounded-xl border-2 border-purple-500/30 bg-slate-800 overflow-hidden"
                                 style={{ transform: 'translateX(8px) translateY(8px) scale(0.94)', zIndex: 2 }}
                              >
                                 <img src={fusedCard.sourceCards[0].image} alt="" className="w-full h-full object-cover opacity-60" />
                                 <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                              </div>

                              {/* Front Card (New Fused Card) */}
                              <div 
                                 className="absolute inset-0 rounded-xl border-4 bg-slate-900 overflow-hidden shadow-[0_0_40px_rgba(168,85,247,0.6)]"
                                 style={{ 
                                    zIndex: 3,
                                    borderImage: 'linear-gradient(135deg, rgb(168, 85, 247), rgb(6, 182, 212)) 1'
                                 }}
                              >
                                 {/* Gradient Overlay */}
                                 <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-cyan-500/20" />
                                 
                                 {/* Content */}
                                 <div className="relative z-10 h-full flex flex-col items-center justify-between p-4">
                                    <Badge className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-xs font-bold">
                                       HYBRID
                                    </Badge>
                                    
                                    <div className="flex-1 flex items-center justify-center">
                                       <div className="relative">
                                          <Crown className="w-20 h-20 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]" />
                                          <motion.div
                                             className="absolute inset-0"
                                             animate={{ rotate: 360 }}
                                             transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                          >
                                             <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-purple-400" />
                                             <Sparkles className="absolute -bottom-2 -left-2 w-5 h-5 text-cyan-400" />
                                          </motion.div>
                                       </div>
                                    </div>
                                    
                                    <div className="text-center">
                                       <h4 className="text-white font-black text-xs mb-1 leading-tight line-clamp-2">{fusedCard.name}</h4>
                                       <div className="text-[9px] text-white/60 mb-1 line-clamp-1">{fusedCard.ability}</div>
                                       <Badge className="bg-black/40 text-white/80 text-[8px]">Lv.{fusedCard.level}</Badge>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </motion.div>
                     ) : (
                        <div className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-white/30 bg-white/5 flex flex-col items-center justify-center">
                           <Sparkles className="w-12 h-12 text-white/20 mb-2" />
                           <span className="text-white/40 text-xs">Result Card</span>
                        </div>
                     )}
                  </div>
               </div>

               {/* Fusion Button */}
               {fusedCard ? (
                  <Button 
                     onClick={() => {
                        setFusedCard(null);
                        setSelectedCard1(null);
                        setSelectedCard2(null);
                        setSelectedGame1(null);
                        setSelectedGame2(null);
                     }}
                     className="w-full bg-green-600 hover:bg-green-700 h-12 font-bold text-base"
                  >
                     Create New Fusion
                  </Button>
               ) : (
                  <Button 
                     onClick={handleFusion} 
                     disabled={!selectedCard1 || !selectedCard2}
                     className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 h-14 text-lg font-black"
                  >
                     FUSION
                  </Button>
               )}
            </div>
         </div>
      </div>
   );
}