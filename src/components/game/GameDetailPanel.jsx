import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, ShoppingCart, Heart, Star, Sword, Zap,
  ThumbsUp, ThumbsDown, Clock, Gift, Plus, Flag, X, Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCart } from '../CartContext';
import { useAuth } from '../auth/AuthContext';
import { Game } from '@/entities/Game';
import { allMockGames } from '../store/mockData';
import { enhancedMockGameData as legacyEnhancedMockData } from '../store/mockGameDetailData';

const rarityColors = {
  Common: 'text-gray-400 bg-gray-500/20',
  Uncommon: 'text-green-400 bg-green-500/20',
  Rare: 'text-blue-400 bg-blue-500/20',
  Epic: 'text-purple-400 bg-purple-500/20',
  Legendary: 'text-orange-400 bg-orange-500/20'
};

// Mock Data
const mockDLCs = [
  { id: 1, name: 'Expansion Pack: Shadow Realm', price: 19.99, image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300', discount: 0 },
  { id: 2, name: 'Character Pack: Elite Warriors', price: 9.99, image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300', discount: 25 },
  { id: 3, name: 'Soundtrack Collection', price: 4.99, image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300', discount: 0 },
];

const mockReviews = [
  { id: 1, user: 'DragonSlayer99', avatar: 'https://i.pravatar.cc/40?img=1', rating: 'positive', hours: 156, date: '2024-12-15', helpful: 234, notHelpful: 12, content: 'Absolutely phenomenal game! The story kept me hooked from start to finish. The combat system is fluid and rewarding.' },
  { id: 2, user: 'CasualGamer42', avatar: 'https://i.pravatar.cc/40?img=2', rating: 'positive', hours: 45, date: '2024-12-10', helpful: 89, notHelpful: 5, content: 'Great game overall. Some minor bugs here and there but nothing game-breaking.' },
  { id: 3, user: 'ProReviewer', avatar: 'https://i.pravatar.cc/40?img=3', rating: 'negative', hours: 12, date: '2024-12-08', helpful: 45, notHelpful: 78, content: 'Not my cup of tea. The difficulty spikes are frustrating.' },
];

// Liquid Glass Card Component
const LiquidGlassCard = ({ children, className = '' }) => (
  <div 
    className={`relative rounded-xl overflow-hidden ${className}`}
    style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
    }}
  >
    {children}
  </div>
);

// Media Gallery - Steam Style
function MediaGallery({ game }) {
  const [activeMedia, setActiveMedia] = useState(0);
  
  const media = [
    { type: 'video', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', thumbnail: game.banner || game.cover_image },
    ...(game.screenshots || [game.cover, game.banner, game.cover, game.banner]).map(s => ({ type: 'image', src: s, thumbnail: s }))
  ];

  return (
    <div className="space-y-2">
      {/* Main Display */}
      <LiquidGlassCard className="aspect-video">
        {media[activeMedia]?.type === 'video' ? (
          <video 
            className="w-full h-full object-cover"
            controls
            autoPlay
            muted
            poster={game.banner || game.cover_image}
          >
            <source src={media[activeMedia].src} type="video/mp4" />
          </video>
        ) : (
          <img 
            src={media[activeMedia]?.src} 
            alt="Screenshot"
            className="w-full h-full object-cover"
          />
        )}
      </LiquidGlassCard>

      {/* Thumbnail Strip */}
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {media.map((item, index) => (
          <button
            key={index}
            onClick={() => setActiveMedia(index)}
            className={`relative flex-shrink-0 w-[120px] h-[68px] rounded-md overflow-hidden transition-all ${
              activeMedia === index 
                ? 'ring-2 ring-cyan-400 opacity-100' 
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
            {item.type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Play className="w-5 h-5 text-white fill-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Purchase Box Component (separate for top placement)
function PurchaseBox({ game, gameIsOwned, onPurchase }) {
  return (
    <LiquidGlassCard className="p-4 mb-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {game.originalPrice && (
            <Badge className="bg-green-600 text-white text-xs">-{Math.round((1 - game.price / game.originalPrice) * 100)}%</Badge>
          )}
          <div>
            {game.originalPrice && (
              <span className="text-slate-500 line-through text-sm mr-2">${game.originalPrice}</span>
            )}
            <span className="text-xl font-bold text-white">${game.price}</span>
          </div>
        </div>
        
        {gameIsOwned ? (
          <Button className="bg-green-600 hover:bg-green-700 h-9 px-6">
            <Play className="w-4 h-4 mr-2" />
            Play Now
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button onClick={onPurchase} className="bg-green-600 hover:bg-green-700 h-9 px-6">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
            <Button variant="outline" className="border-white/20 hover:bg-white/10 h-9 px-4">
              <Heart className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </LiquidGlassCard>
  );
}

// Game Info Sidebar
function GameInfoSidebar({ game }) {
  return (
    <div className="space-y-4">
      {/* Cover Image */}
      <LiquidGlassCard>
        <img 
          src={game.cover_image || game.cover} 
          alt={game.title}
          className="w-full aspect-[4/5] object-cover"
        />
      </LiquidGlassCard>

      {/* Description */}
      <p className="text-sm text-slate-300 leading-relaxed">
        {game.description?.slice(0, 200)}...
      </p>

      {/* Quick Info */}
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500 uppercase">Recent Reviews:</span>
          <span className="text-cyan-400">Very Positive (2,909)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 uppercase">All Reviews:</span>
          <span className="text-cyan-400">Very Positive (33,539)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 uppercase">Release Date:</span>
          <span className="text-slate-300">{game.releaseDate || 'May 16, 2024'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 uppercase">Developer:</span>
          <span className="text-cyan-400 hover:underline cursor-pointer">{game.developer || 'Game Studio'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 uppercase">Publisher:</span>
          <span className="text-cyan-400 hover:underline cursor-pointer">{game.publisher || 'Publisher Inc'}</span>
        </div>
      </div>

      {/* Tags */}
      <div>
        <p className="text-xs text-slate-500 uppercase mb-2">Popular user-defined tags:</p>
        <div className="flex flex-wrap gap-1">
          {['Open World', 'Action', 'Story Rich', 'Singleplayer', 'Adventure'].map((tag, i) => (
            <span key={i} className="px-2 py-0.5 bg-cyan-500/20 rounded text-[10px] text-cyan-300 hover:bg-cyan-500/30 cursor-pointer transition-colors">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// DLC Section
function DLCSection({ dlcs }) {
  return (
    <LiquidGlassCard className="p-4">
      <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
        <Gift className="w-4 h-4 text-cyan-400" />
        Content For This Game
      </h3>
      <div className="space-y-2">
        {dlcs.map((dlc) => (
          <div key={dlc.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
            <img src={dlc.image} alt={dlc.name} className="w-16 h-10 object-cover rounded" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white font-medium truncate">{dlc.name}</p>
            </div>
            <div className="text-right flex items-center gap-2">
              {dlc.discount > 0 && (
                <Badge className="bg-green-600 text-white text-[10px]">-{dlc.discount}%</Badge>
              )}
              <p className="text-white font-bold text-sm">
                ${dlc.discount > 0 ? (dlc.price * (1 - dlc.discount / 100)).toFixed(2) : dlc.price}
              </p>
            </div>
          </div>
        ))}
      </div>
    </LiquidGlassCard>
  );
}

// Review Card
function ReviewCard({ review }) {
  const [helpfulVoted, setHelpfulVoted] = useState(null);

  return (
    <LiquidGlassCard className="p-3">
      <div className="flex items-start gap-3 mb-2">
        <img src={review.avatar} alt={review.user} className="w-8 h-8 rounded" />
        <div className="flex-1">
          <p className="text-cyan-400 font-medium text-xs">{review.user}</p>
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <Clock className="w-2.5 h-2.5" />
            <span>{review.hours} hrs</span>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${
          review.rating === 'positive' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {review.rating === 'positive' ? <ThumbsUp className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />}
          <span>{review.rating === 'positive' ? 'Recommended' : 'Not Recommended'}</span>
        </div>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed mb-3">{review.content}</p>

      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <span className="text-[10px] text-slate-500">Helpful?</span>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setHelpfulVoted('yes')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-colors ${
              helpfulVoted === 'yes' ? 'bg-cyan-500/30 text-cyan-400' : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            <ThumbsUp className="w-2.5 h-2.5" />
            Yes
          </button>
          <button 
            onClick={() => setHelpfulVoted('no')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-colors ${
              helpfulVoted === 'no' ? 'bg-red-500/30 text-red-400' : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            <ThumbsDown className="w-2.5 h-2.5" />
            No
          </button>
        </div>
      </div>
    </LiquidGlassCard>
  );
}

// Reviews Section
function ReviewsSection({ reviews }) {
  const [filter, setFilter] = useState('all');
  const positiveCount = reviews.filter(r => r.rating === 'positive').length;
  const positivePercent = Math.round((positiveCount / reviews.length) * 100);
  const filteredReviews = filter === 'all' ? reviews : reviews.filter(r => r.rating === filter);

  return (
    <div className="space-y-3">
      <LiquidGlassCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">User Reviews</h3>
          <div className="flex gap-1">
            {['all', 'positive', 'negative'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                  filter === f ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">{positivePercent}%</div>
            <div className="text-[10px] text-slate-500">Positive</div>
          </div>
          <div className="flex-1">
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-1">
              <div className="h-full bg-cyan-500" style={{ width: `${positivePercent}%` }} />
            </div>
            <p className="text-xs text-cyan-400">Very Positive</p>
          </div>
        </div>
      </LiquidGlassCard>

      <div className="space-y-2">
        {filteredReviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}

// System Requirements
function SystemRequirements() {
  return (
    <LiquidGlassCard className="p-4">
      <h3 className="text-sm font-bold text-white mb-3">System Requirements</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 mb-2 uppercase">Minimum</h4>
          <div className="space-y-1 text-[11px]">
            <div><span className="text-slate-500">OS:</span> <span className="text-slate-300">Windows 10</span></div>
            <div><span className="text-slate-500">CPU:</span> <span className="text-slate-300">Intel i5-4460</span></div>
            <div><span className="text-slate-500">RAM:</span> <span className="text-slate-300">8 GB</span></div>
            <div><span className="text-slate-500">GPU:</span> <span className="text-slate-300">GTX 960</span></div>
            <div><span className="text-slate-500">Storage:</span> <span className="text-slate-300">50 GB</span></div>
          </div>
        </div>
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 mb-2 uppercase">Recommended</h4>
          <div className="space-y-1 text-[11px]">
            <div><span className="text-slate-500">OS:</span> <span className="text-slate-300">Windows 11</span></div>
            <div><span className="text-slate-500">CPU:</span> <span className="text-slate-300">Intel i7-8700K</span></div>
            <div><span className="text-slate-500">RAM:</span> <span className="text-slate-300">16 GB</span></div>
            <div><span className="text-slate-500">GPU:</span> <span className="text-slate-300">RTX 3070</span></div>
            <div><span className="text-slate-500">Storage:</span> <span className="text-slate-300">50 GB SSD</span></div>
          </div>
        </div>
      </div>
    </LiquidGlassCard>
  );
}

export default function GameDetailPanel({ gameId, onClose, showBackButton = true }) {
  const { isPurchased } = useCart();
  const { isAuthenticated, user, updateUserData } = useAuth();
  
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('features');

  useEffect(() => {
    const fetchGame = async () => {
      setLoading(true);
      try {
        if (allMockGames[gameId]) {
          setGame(allMockGames[gameId]);
        } else {
          const fetchedGame = await Game.get(gameId);
          setGame(fetchedGame);
        }
      } catch (error) {
        if (legacyEnhancedMockData[gameId]) {
          setGame(legacyEnhancedMockData[gameId]);
        } else {
          setGame(null);
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (gameId) fetchGame();
    else { setLoading(false); setGame(null); }
  }, [gameId]);

  const handlePurchase = async () => {
    if (game && isAuthenticated) {
      const currentPurchased = user?.purchased_items || [];
      if (!currentPurchased.includes(game.id)) {
        await updateUserData({ purchased_items: [...currentPurchased, game.id] });
      }
    }
  };

  const gameIsOwned = game?.id ? isPurchased(game.id) : false;

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900 text-white p-6">
        <h1 className="text-2xl font-bold mb-4">Game Not Found</h1>
        {showBackButton && onClose && (
          <Button onClick={onClose}>Back</Button>
        )}
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-[100] text-white overflow-y-auto"
      style={{
        background: 'linear-gradient(180deg, #1a2332 0%, #0f1419 50%, #0a0e14 100%)'
      }}
    >
      {/* Close Button */}
      {showBackButton && onClose && (
        <button 
          onClick={onClose}
          className="fixed top-4 right-4 z-[110] w-10 h-10 rounded-full flex items-center justify-center transition-all text-white/80 hover:text-white"
          style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Header */}
      <div className="px-6 pt-4 pb-2">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-white">{game.title}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span>{game.rating || '4.8'}</span>
            </div>
            <span>{game.developer || 'Game Studio'}</span>
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
              {game.genre}
            </Badge>
            {game.aiEnhanced && (
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                <Bot className="w-3 h-3 mr-1" />
                AI Enhanced
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Steam Layout */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex gap-5">
          {/* Left Column - Media & Content */}
          <div className="flex-1 space-y-4">
            {/* Media Gallery */}
            <MediaGallery game={game} />

            {/* Features/Equipment/Abilities Tabs */}
            <LiquidGlassCard className="p-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-white/5 mb-4 h-8">
                  <TabsTrigger value="features" className="text-xs">Features</TabsTrigger>
                  <TabsTrigger value="equipment" className="text-xs">Equipment</TabsTrigger>
                  <TabsTrigger value="abilities" className="text-xs">Abilities</TabsTrigger>
                </TabsList>

                <TabsContent value="features" className="mt-0">
                  <div className="grid grid-cols-3 gap-3">
                    {['Single-player', 'Online Co-op', 'Achievements', 'Cloud Saves', 'Controller Support', 'AI Companion'].map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="equipment" className="mt-0">
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                    {[
                      { id: 1, name: 'Dragon Blade', rarity: 'Legendary' },
                      { id: 2, name: 'Shadow Armor', rarity: 'Epic' },
                      { id: 3, name: 'Phoenix Helm', rarity: 'Rare' },
                      { id: 4, name: 'Mystic Gauntlets', rarity: 'Epic' },
                      { id: 5, name: 'Thunder Boots', rarity: 'Rare' },
                      { id: 6, name: 'Crystal Shield', rarity: 'Epic' },
                    ].map((item) => (
                      <div key={item.id} className="bg-white/5 rounded-lg p-2 hover:bg-white/10 transition-colors cursor-pointer">
                        <div className="w-full aspect-square bg-slate-800 rounded-md mb-1 flex items-center justify-center">
                          <Sword className="w-5 h-5 text-slate-600" />
                        </div>
                        <p className="text-[9px] text-white truncate">{item.name}</p>
                        <Badge className={`${rarityColors[item.rarity]} text-[7px] px-1 py-0`}>{item.rarity}</Badge>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="abilities" className="mt-0">
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                    {[
                      { id: 1, name: 'Inferno Strike', tier: 'Legendary', cooldown: '45s' },
                      { id: 2, name: 'Time Warp', tier: 'Epic', cooldown: '60s' },
                      { id: 3, name: 'Shadow Step', tier: 'Rare', cooldown: '15s' },
                      { id: 4, name: 'Void Shield', tier: 'Epic', cooldown: '30s' },
                      { id: 5, name: 'Lightning Storm', tier: 'Legendary', cooldown: '90s' },
                      { id: 6, name: 'Healing Nova', tier: 'Rare', cooldown: '25s' },
                    ].map((ability) => (
                      <div key={ability.id} className="bg-purple-500/10 rounded-lg p-2 hover:bg-purple-500/20 transition-colors cursor-pointer">
                        <div className="w-full aspect-square bg-purple-900/30 rounded-md mb-1 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-purple-500" />
                        </div>
                        <p className="text-[9px] text-white truncate">{ability.name}</p>
                        <div className="flex items-center justify-between">
                          <Badge className={`${rarityColors[ability.tier]} text-[7px] px-1 py-0`}>{ability.tier}</Badge>
                          <span className="text-[7px] text-purple-400">{ability.cooldown}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </LiquidGlassCard>

            {/* DLC Section */}
            <DLCSection dlcs={mockDLCs} />

            {/* System Requirements */}
            <SystemRequirements />
          </div>

          {/* Right Column - Game Info Sidebar */}
          <div className="w-[300px] flex-shrink-0">
            <GameInfoSidebar 
              game={game} 
              gameIsOwned={gameIsOwned} 
              onPurchase={handlePurchase}
            />
          </div>
        </div>
      </div>

      {/* User Reviews Section - Full Width at Bottom */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mb-6" />
        <ReviewsSection reviews={mockReviews} />
      </div>
    </div>
  );
}