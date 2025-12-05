import React, { useState, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Search, ChevronRight, Plus, Layers, Sparkles, Skull, Flame, Swords, Wand2, Ghost } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const CARD_GENRES = [
  { id: 'all', name: 'All Cards', icon: Layers },
  { id: 'anime', name: 'Anime', icon: Sparkles },
  { id: 'dark_arts', name: 'Dark Arts', icon: Skull },
  { id: 'elemental', name: 'Elemental', icon: Flame },
  { id: 'combat', name: 'Combat', icon: Swords },
  { id: 'magic', name: 'Magic', icon: Wand2 },
  { id: 'spirit', name: 'Spirit', icon: Ghost },
];

const MOCK_CARDS = [
  { id: 6, name: "Blood Drain", rarity: "Legendary", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/02ea67ae3_ChatGPTImageDec4202508_27_56PM.png", series: "Dark Arts", genre: "dark_arts", mint: 1, total: 10, game: "Elder Scrolls: Reborn" },
  { id: 14, name: "Sasuke Uchiha", rarity: "Mythic", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/4233b6dde_ChatGPTImageDec5202508_41_29AM.png", series: "Eternal Mangekyou", genre: "anime", mint: 1, total: 5, subtitle: "ETERNAL MANGEKYOU SHARINGAN", game: "Cyberpunk 2088" },
  { id: 15, name: "Naruto Uzumaki", rarity: "Mythic", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/bf84bbf7a_ChatGPTImageDec5202508_37_06AM.png", series: "Nine-Tails", genre: "anime", mint: 1, total: 5, subtitle: "NINE-TAILS CLOAK", game: "Cyberpunk 2088" },
  { id: 16, name: "Flame Atronach", rarity: "Rare", image: "https://images.unsplash.com/photo-1579731671988-cf49ce83d6a6?w=400&h=400&fit=crop", series: "Summoner", genre: "elemental", mint: 1, total: 50, game: "Elder Scrolls: Reborn" },
  { id: 17, name: "Dwemer Centurion", rarity: "Epic", image: "https://images.unsplash.com/photo-1628172922754-0402e3b7b20e?w=400&h=400&fit=crop", series: "Ancient Constructs", genre: "combat", mint: 1, total: 20, game: "Elder Scrolls: Reborn" },
  { id: 100, name: "", rarity: "Mythic", image: null, series: "", genre: "anime", mint: null, total: null, isEmpty: true, game: "Cyberpunk 2088" },
  { id: 101, name: "", rarity: "Mythic", image: null, series: "", genre: "anime", mint: null, total: null, isEmpty: true, game: "Cyberpunk 2088" },
  { id: 102, name: "", rarity: "Legendary", image: null, series: "", genre: "dark_arts", mint: null, total: null, isEmpty: true, game: "Elder Scrolls: Reborn" },
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

  const isEmptyCard = card.isEmpty;
  const specialCards = ["Blood Drain", "Sasuke Uchiha", "Naruto Uzumaki"];
  const isSpecialCard = specialCards.includes(card.name) || isEmptyCard;

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
      {isEmptyCard ? (
        <div 
          className="w-full h-full flex flex-col items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, rgba(30,30,50,0.9) 100%)',
            border: '2px dashed rgba(255,255,255,0.2)',
          }}
        >
          <Plus className="w-12 h-12 text-white/20 mb-2" />
          <span className="text-white/30 text-sm font-medium">Coming Soon</span>
          <Badge className="mt-2 bg-white/10 text-white/50 border-white/20 text-[10px]">
            {card.rarity}
          </Badge>
        </div>
      ) : (
        <img src={card.image} alt={card.name} className="w-full h-full object-cover" style={{ transform: "translateZ(0)" }} />
      )}
      
      {!isSpecialCard && !isEmptyCard && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
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
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white font-bold text-lg leading-tight mb-1">{card.name}</h3>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase ${
                card.rarity === 'Legendary' ? 'text-orange-400' :
                card.rarity === 'Epic' ? 'text-purple-400' :
                card.rarity === 'Rare' ? 'text-blue-400' : 'text-slate-400'
              }`}>{card.rarity}</span>
            </div>
          </div>
        </>
      )}
      
      {isSpecialCard && !isEmptyCard && (
        <motion.div 
          style={{
            opacity: useTransform(rotateX, (val) => Math.abs(val) / 50 + 0.3),
            background: "linear-gradient(105deg, transparent 15%, rgba(147,197,253,0.6) 20%, rgba(253,224,71,0.7) 25%, rgba(251,191,36,0.5) 30%, transparent 35%)",
            transform: useTransform(mouseX, [-0.5, 0.5], ["translateX(-120%)", "translateX(120%)"]),
          }}
          className="absolute inset-0 z-10 pointer-events-none mix-blend-screen"
        />
      )}
      
      {isSpecialCard && !isEmptyCard && (
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

const GenreRow = ({ genre, cards, icon: Icon }) => {
  if (cards.length === 0) return null;
  
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Icon className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-white">{genre}</h2>
          <span className="text-white/40 text-sm">({cards.length})</span>
        </div>
        <button className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
          See All <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {cards.map(card => (
          <div key={card.id} className="flex-shrink-0 w-[200px]">
            <CardComponent card={card} isOwned={true} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default function GameTradingCards({ selectedGame }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');

  const filteredCardsByGame = useMemo(() => {
    if (!selectedGame) return [];
    return MOCK_CARDS.filter(card => card.game === selectedGame.title);
  }, [selectedGame]);

  const getCardsByGenre = (genreId) => {
    if (genreId === 'all') return filteredCardsByGame;
    return filteredCardsByGame.filter(card => card.genre === genreId);
  };

  const groupedCards = CARD_GENRES.filter(g => g.id !== 'all').reduce((acc, genre) => {
    acc[genre.id] = filteredCardsByGame.filter(card => card.genre === genre.id);
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col pt-4">
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {CARD_GENRES.map(genre => (
          <button
            key={genre.id}
            onClick={() => setSelectedGenre(genre.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              selectedGenre === genre.id
                ? 'bg-blue-500/30 text-white border border-blue-400/50'
                : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <genre.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{genre.name}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 px-4 py-2 rounded-full w-full mb-6"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Search className="w-4 h-4 text-white/40" />
        <input 
          type="text" 
          placeholder="Search cards..." 
          className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/40 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {selectedGenre === 'all' ? (
          <>
            {CARD_GENRES.filter(g => g.id !== 'all').map(genre => (
              <GenreRow 
                key={genre.id}
                genre={genre.name}
                cards={groupedCards[genre.id] || []}
                icon={genre.icon}
              />
            ))}
          </>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {getCardsByGenre(selectedGenre).filter(card => 
              card.name.toLowerCase().includes(searchTerm.toLowerCase())
            ).map(card => (
              <CardComponent key={card.id} card={card} isOwned={true} />
            ))}
          </div>
        )}
        {getCardsByGenre(selectedGenre).filter(card => 
          card.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).length === 0 && (
          <div className="text-center py-10 text-white/50">
            No cards found for this genre or search term.
          </div>
        )}
      </div>
    </div>
  );
}