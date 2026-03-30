import React, { useState, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight, Plus, Layers, Sparkles, Skull, Flame, Swords, Wand2, Ghost } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import CardInventoryOverlay from './CardInventoryOverlay';

const CARD_GENRES = [
  { id: 'all', name: 'All Cards', icon: Layers },
  { id: 'anime', name: 'Anime', icon: Sparkles },
  { id: 'dark_arts', name: 'Dark Arts', icon: Skull },
  { id: 'elemental', name: 'Elemental', icon: Flame },
  { id: 'combat', name: 'Combat', icon: Swords },
  { id: 'magic', name: 'Magic', icon: Wand2 },
  { id: 'spirit', name: 'Spirit', icon: Ghost },
  { id: 'sci_fi', name: 'Sci-Fi', icon: Layers },
  { id: 'fantasy', name: 'Fantasy', icon: Wand2 },
  { id: 'fighting_game', name: 'Fighting Game', icon: Swords },
  { id: 'shooter', name: 'Shooter', icon: Search },
];

const MOCK_CARDS = [
  { id: 6, name: "Blood Drain", rarity: "Legendary", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/02ea67ae3_ChatGPTImageDec4202508_27_56PM.png", series: "Dark Arts", genre: "dark_arts", mint: 1, total: 10 },
  { id: 14, name: "Sasuke Uchiha", rarity: "Mythic", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/4233b6dde_ChatGPTImageDec5202508_41_29AM.png", series: "Eternal Mangekyou", genre: "anime", mint: 1, total: 5, subtitle: "ETERNAL MANGEKYOU SHARINGAN" },
  { id: 15, name: "Naruto Uzumaki", rarity: "Mythic", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/bf84bbf7a_ChatGPTImageDec5202508_37_06AM.png", series: "Nine-Tails", genre: "anime", mint: 1, total: 5, subtitle: "NINE-TAILS CLOAK" },
  { id: 16, name: "Flame Atronach", rarity: "Rare", image: "https://images.unsplash.com/photo-1579731671988-cf49ce83d6a6?w=400&h=400&fit=crop", series: "Summoner", genre: "elemental", mint: 1, total: 50 },
  { id: 17, name: "Dwemer Centurion", rarity: "Epic", image: "https://images.unsplash.com/photo-1628172922754-0402e3b7b20e?w=400&h=400&fit=crop", series: "Ancient Constructs", genre: "combat", mint: 1, total: 20 },
  { id: 18, name: "Cyber Samurai", rarity: "Legendary", image: "https://images.unsplash.com/photo-1618335930266-9804b373f08f?w=400&h=400&fit=crop", series: "Neo-Tokyo Legends", genre: "sci_fi", mint: 1, total: 15 },
  { id: 19, name: "Forest Guardian", rarity: "Rare", image: "https://images.unsplash.com/photo-1588666329762-d4b97d1e8b7c?w=400&h=400&fit=crop", series: "Eldoria", genre: "fantasy", mint: 1, total: 40 },
  { id: 20, name: "Street Brawler", rarity: "Uncommon", image: "https://images.unsplash.com/photo-1542831371-d39b0a1f8e2e?w=400&h=400&fit=crop", series: "Underground Arena", genre: "fighting_game", mint: 1, total: 100 },
  { id: 21, name: "Galactic Marine", rarity: "Epic", image: "https://images.unsplash.com/photo-1563729780029-df25338f4d9b?w=400&h=400&fit=crop", series: "Cosmic Warfare", genre: "shooter", mint: 1, total: 25 },
  { id: 100, name: "", rarity: "Mythic", image: null, series: "", genre: "anime", mint: null, total: null, isEmpty: true },
  { id: 101, name: "", rarity: "Mythic", image: null, series: "", genre: "anime", mint: null, total: null, isEmpty: true },
  { id: 102, name: "", rarity: "Legendary", image: null, series: "", genre: "dark_arts", mint: null, total: null, isEmpty: true },
];

const CardComponent = ({ card, onClick }) => {
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
  
  // Create static transforms that we conditionally apply during render
  const specialOpacity = useTransform(rotateX, (val) => Math.abs(val) / 50 + 0.3);
  const specialTransform = useTransform(mouseX, [-0.5, 0.5], ["translateX(-120%)", "translateX(120%)"]);

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
      onClick={() => onClick && onClick(card)}
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
            opacity: specialOpacity,
            background: "linear-gradient(105deg, transparent 15%, rgba(147,197,253,0.6) 20%, rgba(253,224,71,0.7) 25%, rgba(251,191,36,0.5) 30%, transparent 35%)",
            transform: specialTransform,
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
                repeatDelay: 4,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

const GenreRow = ({ genre, cards, icon: Icon, onCardClick }) => {
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
            <CardComponent card={card} onClick={onCardClick} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default function GameTradingCards() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedCard, setSelectedCard] = useState(null);
  const [viewInventoryMode, setViewInventoryMode] = useState(false);

  // Generate expanded mock cards for the "row of 50" requirement
  const expandedMockCards = useMemo(() => {
      // Create 50+ cards by duplicating and modifying
      let cards = [];
      for (let i = 0; i < 5; i++) {
          cards = [...cards, ...MOCK_CARDS.map(c => ({...c, id: `${c.id}_${i}`, mint: (c.mint || 1) + i}))];
      }
      return cards;
  }, []);

  const filteredCards = useMemo(() => {
    let cards = viewInventoryMode ? expandedMockCards : MOCK_CARDS;
    if (selectedGenre !== 'all') {
      cards = cards.filter(card => card.genre === selectedGenre);
    }
    if (searchTerm) {
      cards = cards.filter(card => card.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return cards;
  }, [searchTerm, selectedGenre, viewInventoryMode, expandedMockCards]);

  const groupedCards = CARD_GENRES.filter(g => g.id !== 'all').reduce((acc, genre) => {
    acc[genre.id] = expandedMockCards.filter(card => card.genre === genre.id).slice(0, 15); // Show horizontal scroll slice
    return acc;
  }, {});

  const handleCardClick = (card) => {
    setSelectedCard(card);
  };

  const handleSeeAll = (genreId) => {
      setSelectedGenre(genreId);
      setViewInventoryMode(true);
  };

  const getRelatedCards = (card) => {
    if (!card) return [];
    return MOCK_CARDS.filter(c => 
      (c.genre === card.genre || c.series === card.series) && c.id !== card.id
    ).slice(0, 10);
  };

  return (
    <div className="flex flex-col pt-4 relative">
      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

      <div className="flex items-center justify-between mb-6 px-10">
          <h2 className="text-3xl font-black">Trading Cards</h2>
          {viewInventoryMode && (
              <button 
                  onClick={() => { setViewInventoryMode(false); setSelectedGenre('all'); }}
                  className="text-blue-400 hover:text-white transition-colors text-sm"
              >
                  Back to Categories
              </button>
          )}
      </div>

      {!viewInventoryMode && (
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide px-10">
            {CARD_GENRES.map(genre => (
              <button
                key={genre.id}
                onClick={() => setSelectedGenre(genre.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedGenre === genre.id
                    ? 'bg-purple-500/30 text-white border border-purple-400/50'
                    : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                <genre.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{genre.name}</span>
              </button>
            ))}
          </div>
      )}

      <div className="flex items-center gap-2 px-4 py-2 rounded-full mb-6 mx-10"
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

      <div className="flex-1 pr-2 px-10">
        {selectedGenre === 'all' && !viewInventoryMode ? (
          <>
            {CARD_GENRES.filter(g => g.id !== 'all').map(genre => (
              <div key={genre.id} className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        <genre.icon className="w-5 h-5 text-blue-400" />
                      </div>
                      <h2 className="text-xl font-bold text-white">{genre.name}</h2>
                      <span className="text-white/40 text-sm">({groupedCards[genre.id]?.length || 0})</span>
                    </div>
                    <button 
                        onClick={() => handleSeeAll(genre.id)}
                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                      See All <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {(groupedCards[genre.id] || []).map(card => (
                      <div key={card.id} className="flex-shrink-0 w-[200px]">
                        <CardComponent card={card} onClick={handleCardClick} />
                      </div>
                    ))}
                  </div>
                </div>
            ))}
          </>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-20">
            {filteredCards.map(card => (
              <CardComponent key={card.id} card={card} onClick={handleCardClick} />
            ))}
          </div>
        )}
        {filteredCards.length === 0 && (
          <div className="text-center py-10 text-white/50">
            No cards found for this genre or search term.
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedCard && (
          <CardInventoryOverlay 
            card={selectedCard} 
            relatedCards={getRelatedCards(selectedCard)} 
            onClose={() => setSelectedCard(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}