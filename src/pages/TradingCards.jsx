import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Layers, Star, Shield, Zap, Crown, Hexagon, ArrowLeftRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '../components/auth/AuthContext';

// Mock Data for UI visualization (would normally fetch from UserCard/TradingCard entities)
const MOCK_CARDS = [
  { id: 1, name: "Cyber Dragon", rarity: "Legendary", image: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop", series: "Genesis", mint: 42, total: 100 },
  { id: 2, name: "Neon Samurai", rarity: "Epic", image: "https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=600&fit=crop", series: "Cyberpunk", mint: 156, total: 500 },
  { id: 3, name: "Void Walker", rarity: "Rare", image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=600&fit=crop", series: "Genesis", mint: 892, total: 1000 },
  { id: 4, name: "Solar Knight", rarity: "Uncommon", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=600&fit=crop", series: "Fantasy", mint: 2341, total: 5000 },
  { id: 5, name: "Pixel Warrior", rarity: "Common", image: "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=400&h=600&fit=crop", series: "Retro", mint: 5678, total: null },
  { id: 6, name: "Blood Drain", rarity: "Legendary", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/02ea67ae3_ChatGPTImageDec4202508_27_56PM.png", series: "Dark Arts", mint: 1, total: 10 },
];

const CardComponent = ({ card, isOwned }) => {
  const rarityColors = {
    Legendary: "border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)]",
    Epic: "border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]",
    Rare: "border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)]",
    Uncommon: "border-green-500",
    Common: "border-slate-600"
  };

  const isRotating = card.name === "Blood Drain";

  return (
    <motion.div
      animate={isRotating ? { rotateY: 360 } : {}}
      transition={isRotating ? { duration: 8, repeat: Infinity, ease: "linear" } : {}}
      whileHover={isRotating ? { scale: 1.1 } : { scale: 1.05, rotateY: 10 }}
      className={`relative aspect-[2.5/3.5] rounded-xl overflow-hidden border-2 ${rarityColors[card.rarity]} bg-slate-900 cursor-pointer group`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
      
      {/* Top Badges */}
      <div className="absolute top-2 left-2 right-2 flex justify-between">
        <Badge variant="secondary" className="bg-black/50 backdrop-blur-md border border-white/10 text-[10px]">
            {card.series}
        </Badge>
        {card.total && (
            <Badge variant="secondary" className="bg-black/50 backdrop-blur-md border border-white/10 text-[10px] font-mono">
                #{card.mint}/{card.total}
            </Badge>
        )}
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-bold text-lg leading-tight mb-1">{card.name}</h3>
        <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase ${
                card.rarity === 'Legendary' ? 'text-orange-400' :
                card.rarity === 'Epic' ? 'text-purple-400' :
                card.rarity === 'Rare' ? 'text-blue-400' : 'text-slate-400'
            }`}>{card.rarity}</span>
            {isOwned && (
                <Button size="icon" variant="ghost" className="h-6 w-6 text-white hover:bg-white/20">
                    <ArrowLeftRight className="w-3 h-3" />
                </Button>
            )}
        </div>
      </div>
    </motion.div>
  );
};

export default function TradingCards() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('collection');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 pb-24">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 flex items-center gap-3">
              <Layers className="w-10 h-10 text-indigo-400" />
              DIGITAL COLLECTIBLES
            </h1>
            <p className="text-slate-400 mt-2">Collect, Trade, and Showcase your Achievement Cards</p>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
            <div className="text-right px-2">
                <div className="text-[10px] uppercase text-slate-500 font-bold">Collection Score</div>
                <div className="text-xl font-mono font-bold text-yellow-400">2,450</div>
            </div>
            <div className="h-8 w-px bg-slate-800"></div>
            <div className="text-right px-2">
                <div className="text-[10px] uppercase text-slate-500 font-bold">Unique Cards</div>
                <div className="text-xl font-mono font-bold text-cyan-400">124</div>
            </div>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <TabsList className="bg-slate-900 border border-slate-800">
                <TabsTrigger value="collection">My Collection</TabsTrigger>
                <TabsTrigger value="marketplace">Card Market</TabsTrigger>
                <TabsTrigger value="showcase">Showcase</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-1.5 w-full md:w-auto">
                <Search className="w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search cards..." 
                    className="bg-transparent border-none outline-none text-sm text-white placeholder:text-slate-500 w-full md:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>

          <TabsContent value="collection" className="space-y-6">
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {MOCK_CARDS.map(card => (
                    <CardComponent key={card.id} card={card} isOwned={true} />
                ))}
                {/* Mock Duplicates */}
                <CardComponent card={{...MOCK_CARDS[2], mint: 912}} isOwned={true} />
                <CardComponent card={{...MOCK_CARDS[4], mint: 5892}} isOwned={true} />
             </div>
          </TabsContent>

          <TabsContent value="marketplace">
             <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                <ArrowLeftRight className="w-16 h-16 text-slate-700 mb-4" />
                <h3 className="text-2xl font-bold text-slate-400">Card Marketplace</h3>
                <p className="text-slate-500 max-w-md mt-2">Trade your duplicates with other players to complete your collection. Coming soon!</p>
             </div>
          </TabsContent>
          
          <TabsContent value="showcase">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-white">Featured Showcase</h3>
                    <Button variant="outline">Edit Showcase</Button>
                </div>
                <div className="flex justify-center gap-8 perspective-1000">
                    {MOCK_CARDS.slice(0, 3).map((card, i) => (
                        <motion.div
                            key={card.id}
                            initial={{ rotateY: 0, y: 0 }}
                            animate={{ 
                                rotateY: i === 0 ? 15 : i === 2 ? -15 : 0, 
                                z: i === 1 ? 50 : 0,
                                scale: i === 1 ? 1.1 : 1
                            }}
                            className="w-64"
                        >
                            <CardComponent card={card} isOwned={true} />
                        </motion.div>
                    ))}
                </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}