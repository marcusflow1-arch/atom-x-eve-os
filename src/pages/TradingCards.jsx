import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Search, Filter, Layers, Star, Shield, Zap, Crown, Hexagon, ArrowLeftRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '../components/auth/AuthContext';

// Mock Data for UI visualization (would normally fetch from UserCard/TradingCard entities)
const MOCK_CARDS = [
  { id: 6, name: "Blood Drain", rarity: "Legendary", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/02ea67ae3_ChatGPTImageDec4202508_27_56PM.png", series: "Dark Arts", mint: 1, total: 10 },
  { id: 14, name: "Sasuke Uchiha", rarity: "Mythic", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/4233b6dde_ChatGPTImageDec5202508_41_29AM.png", series: "Eternal Mangekyou", mint: 1, total: 5, subtitle: "ETERNAL MANGEKYOU SHARINGAN" },
  { id: 15, name: "Naruto Uzumaki", rarity: "Mythic", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/bf84bbf7a_ChatGPTImageDec5202508_37_06AM.png", series: "Nine-Tails", mint: 1, total: 5, subtitle: "NINE-TAILS CLOAK" },
];

const CardComponent = ({ card, isOwned }) => {
  const rarityColors = {
    Legendary: "border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)]",
    Epic: "border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]",
    Rare: "border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)]",
    Uncommon: "border-green-500",
    Common: "border-slate-600",
    Mythic: "border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]"
  };

  const specialCards = [
    "Blood Drain",
    "Sasuke Uchiha",
    "Naruto Uzumaki"
  ];
  const isSpecialCard = specialCards.includes(card.name);

  // Tilt Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [25, -25]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-25, 25]);

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXPos = event.clientX - rect.left;
    const mouseYPos = event.clientY - rect.top;
    const xPct = mouseXPos / width - 0.5;
    const yPct = mouseYPos / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      onMouseMove={isSpecialCard ? handleMouseMove : undefined}
      onMouseLeave={isSpecialCard ? handleMouseLeave : undefined}
      style={{ 
        rotateX: isSpecialCard ? rotateX : 0, 
        rotateY: isSpecialCard ? rotateY : 0,
        transformStyle: "preserve-3d",
      }}
      whileHover={{ scale: 1.05, ...(isSpecialCard ? {} : { rotateY: 10 }) }}
      className={`relative aspect-[2.5/3.5] rounded-xl overflow-hidden cursor-pointer group ${
        isSpecialCard ? 'shadow-2xl' : `border-2 ${rarityColors[card.rarity] || rarityColors.Common} bg-slate-900`
      }`}
    >
      <img src={card.image} alt={card.name} className="w-full h-full object-cover" style={{ transform: "translateZ(0)" }} />
      
      {!isSpecialCard && (
        <>
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
        </>
      )}
      
      {/* Mythical Stardust Reflection for Special Cards */}
      {isSpecialCard && (
         <motion.div 
            style={{
                opacity: useTransform(rotateX, (val) => Math.abs(val) / 50 + 0.3),
                background: "linear-gradient(105deg, transparent 15%, rgba(147,197,253,0.6) 20%, rgba(253,224,71,0.7) 25%, rgba(251,191,36,0.5) 30%, transparent 35%)",
                transform: useTransform(mouseX, [-0.5, 0.5], ["translateX(-120%)", "translateX(120%)"]),
            }}
            className="absolute inset-0 z-10 pointer-events-none mix-blend-screen"
         />
      )}
      
      {/* Golden Particles Overlay */}
      {isSpecialCard && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-yellow-300 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
                y: [0, -20, -40],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default function TradingCards() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('collection');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div 
      className="min-h-screen text-white p-6 pb-24"
      style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3548 25%, #3d4a5c 50%, #2d3548 75%, #1a1f2e 100%)' }}
    >
      {/* Ambient Glow Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-slate-300/5 rounded-full blur-[120px]" />
      </div>
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