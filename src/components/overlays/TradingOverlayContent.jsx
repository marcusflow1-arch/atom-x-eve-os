import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Mic, ArrowLeftRight, TrendingUp, Clock, Star, 
  Sparkles, Filter, Eye, ShoppingCart
} from 'lucide-react';

// Mock trading cards
const mockCards = [
  {
    id: 1,
    name: 'Dragon Slayer',
    type: 'Ability',
    rarity: 'Legendary',
    genre: 'RPG',
    power: 950,
    icon: '🐉',
    price: 2500,
    seller: 'DragonMaster99',
    description: 'Unleash devastating fire damage',
    trades: 47
  },
  {
    id: 2,
    name: 'Cyber Hack',
    type: 'Ability',
    rarity: 'Epic',
    genre: 'Shooter',
    power: 720,
    icon: '💻',
    price: 1200,
    seller: 'CyberNinja',
    description: 'Disable enemy equipment',
    trades: 89
  },
  {
    id: 3,
    name: 'Time Warp',
    type: 'Ability',
    rarity: 'Mythical',
    genre: 'Sci-Fi',
    power: 1200,
    icon: '⏰',
    price: 5000,
    seller: 'ChronoWarrior',
    description: 'Slow down time temporarily',
    trades: 12
  },
  {
    id: 4,
    name: 'Plasma Rifle',
    type: 'Equipment',
    rarity: 'Rare',
    genre: 'Shooter',
    power: 540,
    icon: '🔫',
    price: 800,
    seller: 'GunSmith42',
    description: 'High-damage energy weapon',
    trades: 156
  },
  {
    id: 5,
    name: 'Phoenix Rebirth',
    type: 'Ability',
    rarity: 'Godlike',
    genre: 'Fantasy',
    power: 1500,
    icon: '🔥',
    price: 15000,
    seller: 'PhoenixLord',
    description: 'Resurrect with full HP once per battle',
    trades: 3
  }
];

const rarityStyles = {
  Common: {
    bg: 'from-slate-600 to-slate-700',
    border: 'border-slate-500',
    glow: 'shadow-slate-500/50',
    text: 'text-slate-300'
  },
  Uncommon: {
    bg: 'from-green-600 to-green-700',
    border: 'border-green-500',
    glow: 'shadow-green-500/50',
    text: 'text-green-300'
  },
  Rare: {
    bg: 'from-blue-600 to-blue-700',
    border: 'border-blue-500',
    glow: 'shadow-blue-500/50',
    text: 'text-blue-300'
  },
  Epic: {
    bg: 'from-purple-600 to-purple-700',
    border: 'border-purple-500',
    glow: 'shadow-purple-500/50',
    text: 'text-purple-300'
  },
  Legendary: {
    bg: 'from-orange-600 to-orange-700',
    border: 'border-orange-500',
    glow: 'shadow-orange-500/50',
    text: 'text-orange-300'
  },
  Mythical: {
    bg: 'from-red-600 to-red-700',
    border: 'border-red-500',
    glow: 'shadow-red-500/50',
    text: 'text-red-300'
  },
  Godlike: {
    bg: 'from-fuchsia-600 via-purple-600 to-pink-600',
    border: 'border-fuchsia-500',
    glow: 'shadow-fuchsia-500/50 shadow-2xl',
    text: 'text-fuchsia-300'
  }
};

const TradingCard = ({ card, onView, isDetailed = false }) => {
  const style = rarityStyles[card.rarity];

  return (
    <motion.div
      whileHover={{ scale: 1.05, rotateY: 5 }}
      className={`relative rounded-xl overflow-hidden ${isDetailed ? 'w-full' : ''}`}
    >
      {/* Card Background with Gradient */}
      <div className={`bg-gradient-to-br ${style.bg} p-[2px] rounded-xl ${style.glow}`}>
        <div className="bg-slate-900 rounded-xl p-4">
          {/* Card Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="text-4xl">{card.icon}</div>
            <Badge className={`${style.border} ${style.text} bg-transparent`}>
              {card.rarity}
            </Badge>
          </div>

          {/* Card Info */}
          <div className="mb-3">
            <h3 className="text-white font-bold text-lg mb-1">{card.name}</h3>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Badge variant="outline" className="text-xs">{card.type}</Badge>
              <Badge variant="outline" className="text-xs">{card.genre}</Badge>
            </div>
          </div>

          {isDetailed && (
            <p className="text-slate-300 text-sm mb-3">{card.description}</p>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-sm mb-3">
            <div>
              <div className="text-yellow-400 font-bold">{card.power}</div>
              <div className="text-xs text-slate-500">Power</div>
            </div>
            <div>
              <div className="text-blue-400 font-bold">{card.price} AGP</div>
              <div className="text-xs text-slate-500">Price</div>
            </div>
          </div>

          {/* Seller Info */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span>Seller: {card.seller}</span>
            <span>{card.trades} trades</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {!isDetailed && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => onView(card)}
              >
                <Eye className="w-3 h-3 mr-1" /> View
              </Button>
            )}
            <Button 
              size="sm" 
              className={`flex-1 bg-gradient-to-r ${style.bg}`}
            >
              <ShoppingCart className="w-3 h-3 mr-1" /> Buy
            </Button>
          </div>
        </div>
      </div>

      {/* Animated Glow for Godlike */}
      {card.rarity === 'Godlike' && (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 rounded-xl pointer-events-none"
        />
      )}
    </motion.div>
  );
};

export default function TradingOverlayContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [isListening, setIsListening] = useState(false);

  const startVoiceSearch = () => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchTerm(transcript);
      };

      recognition.start();
    }
  };

  const filteredCards = mockCards.filter(card =>
    card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex gap-6 h-full">
      {/* Left Side - Search & Browse */}
      <div className="flex-1 flex flex-col">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Input
              placeholder="Search cards, abilities, equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800 border-slate-700 pl-10 pr-12"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Button
              onClick={startVoiceSearch}
              variant="ghost"
              size="icon"
              className={`absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 ${
                isListening ? 'text-red-500 animate-pulse' : 'text-slate-400'
              }`}
            >
              <Mic className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4">
          <Button variant="outline" size="sm">
            <Filter className="w-3 h-3 mr-1" /> All Rarities
          </Button>
          <Button variant="outline" size="sm">
            <TrendingUp className="w-3 h-3 mr-1" /> Trending
          </Button>
          <Button variant="outline" size="sm">
            <Clock className="w-3 h-3 mr-1" /> Recent
          </Button>
        </div>

        <Tabs defaultValue="marketplace" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800 mb-4">
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="mylistings">My Listings</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace" className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {filteredCards.map(card => (
                <TradingCard 
                  key={card.id} 
                  card={card} 
                  onView={setSelectedCard}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mylistings">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-8 text-center">
                <Sparkles className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">You have no active listings</p>
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                  Create Listing
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-8 text-center">
                <Clock className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">No trading history yet</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Side - Detailed Preview */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="w-96 flex-shrink-0"
          >
            <Card className="bg-slate-800/50 border-slate-700 h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-lg">Card Details</h3>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setSelectedCard(null)}
                  >
                    ×
                  </Button>
                </div>

                <TradingCard card={selectedCard} isDetailed={true} />

                <div className="mt-6 space-y-4">
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">Seller Info</h4>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Username</span>
                      <span className="text-white">{selectedCard.seller}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-slate-400">Total Trades</span>
                      <span className="text-green-400">{selectedCard.trades}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-slate-400">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-white">4.8</span>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Buy for {selectedCard.price} AGP
                  </Button>

                  <Button variant="outline" className="w-full">
                    <ArrowLeftRight className="w-4 h-4 mr-2" />
                    Make Offer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}