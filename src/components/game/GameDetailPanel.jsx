import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Play, ShoppingCart, Heart, Share, Star, Trophy, Sword, Zap, Package,
  Monitor, Gamepad, Cpu, HardDrive, Download, Eye, Users, MessageSquare, Crown, Bot, X,
  ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown, Clock, Calendar, Tag, Gift, Plus, Flag
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

// Mock DLC Data
const mockDLCs = [
  { id: 1, name: 'Expansion Pack: Shadow Realm', price: 19.99, image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300', discount: 0 },
  { id: 2, name: 'Character Pack: Elite Warriors', price: 9.99, image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300', discount: 25 },
  { id: 3, name: 'Soundtrack Collection', price: 4.99, image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300', discount: 0 },
  { id: 4, name: 'Cosmetic Bundle: Neon Dreams', price: 14.99, image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300', discount: 50 },
];

// Mock Reviews Data
const mockReviews = [
  { id: 1, user: 'DragonSlayer99', avatar: 'https://i.pravatar.cc/40?img=1', rating: 'positive', hours: 156, date: '2024-12-15', helpful: 234, notHelpful: 12, content: 'Absolutely phenomenal game! The story kept me hooked from start to finish. The combat system is fluid and rewarding. Graphics are stunning and the soundtrack is incredible. Highly recommend to anyone who loves action RPGs.' },
  { id: 2, user: 'CasualGamer42', avatar: 'https://i.pravatar.cc/40?img=2', rating: 'positive', hours: 45, date: '2024-12-10', helpful: 89, notHelpful: 5, content: 'Great game overall. Some minor bugs here and there but nothing game-breaking. The developers are actively patching issues which is refreshing to see.' },
  { id: 3, user: 'ProReviewer', avatar: 'https://i.pravatar.cc/40?img=3', rating: 'negative', hours: 12, date: '2024-12-08', helpful: 45, notHelpful: 78, content: 'Not my cup of tea. The difficulty spikes are frustrating and the tutorial doesn\'t explain mechanics well. Maybe it gets better later but I couldn\'t get into it.' },
  { id: 4, user: 'NightOwlGaming', avatar: 'https://i.pravatar.cc/40?img=4', rating: 'positive', hours: 89, date: '2024-12-05', helpful: 156, notHelpful: 8, content: 'One of the best games I\'ve played this year. The world-building is exceptional and there\'s so much content to explore. Worth every penny!' },
  { id: 5, user: 'SpeedRunner_X', avatar: 'https://i.pravatar.cc/40?img=5', rating: 'positive', hours: 312, date: '2024-11-28', helpful: 67, notHelpful: 3, content: 'Perfect for speedrunning! Tight controls, consistent mechanics, and interesting routing options. The community is also super welcoming.' },
];

// Media Gallery Component (Steam-style)
function MediaGallery({ game }) {
  const [activeMedia, setActiveMedia] = useState(0);
  const [isVideo, setIsVideo] = useState(true);
  
  const media = [
    { type: 'video', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', thumbnail: game.banner || game.cover_image },
    ...(game.screenshots || [game.cover, game.banner, game.cover, game.banner]).map(s => ({ type: 'image', src: s, thumbnail: s }))
  ];

  return (
    <div className="space-y-2">
      {/* Main Display */}
      <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-white/10">
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
      </div>

      {/* Thumbnail Strip */}
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {media.map((item, index) => (
          <button
            key={index}
            onClick={() => setActiveMedia(index)}
            className={`relative flex-shrink-0 w-28 h-16 rounded overflow-hidden border-2 transition-all ${
              activeMedia === index ? 'border-white' : 'border-transparent hover:border-white/50'
            }`}
          >
            <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
            {item.type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Play className="w-4 h-4 text-white fill-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Game Info Sidebar (Steam-style right panel)
function GameInfoSidebar({ game, gameIsOwned, onPurchase, isAuthenticated }) {
  return (
    <div className="space-y-4">
      {/* Cover Image */}
      <img 
        src={game.cover_image || game.cover} 
        alt={game.title}
        className="w-full aspect-[2/3] object-cover rounded-lg border border-white/10"
      />

      {/* Description */}
      <p className="text-sm text-slate-300 leading-relaxed line-clamp-4">
        {game.description}
      </p>

      {/* Quick Info */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">REVIEWS:</span>
          <span className="text-blue-400">Very Positive (2,847)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">RELEASE DATE:</span>
          <span className="text-slate-300">{game.releaseDate || 'Dec 15, 2024'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">DEVELOPER:</span>
          <span className="text-blue-400 hover:underline cursor-pointer">{game.developer || 'Game Studio'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">PUBLISHER:</span>
          <span className="text-blue-400 hover:underline cursor-pointer">{game.publisher || 'Publisher Inc'}</span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {['Action', 'RPG', 'Open World', 'Story Rich', 'Multiplayer'].map((tag, i) => (
          <span key={i} className="px-2 py-1 bg-white/10 rounded text-xs text-slate-300 hover:bg-white/20 cursor-pointer transition-colors">
            {tag}
          </span>
        ))}
      </div>

      {/* Purchase Section */}
      <div className="bg-slate-800/80 rounded-lg p-4 border border-white/10">
        <p className="text-sm text-slate-400 mb-2">Buy {game.title}</p>
        <div className="flex items-center justify-between mb-3">
          {game.originalPrice && (
            <Badge className="bg-green-600 text-white">-{Math.round((1 - game.price / game.originalPrice) * 100)}%</Badge>
          )}
          <div className="text-right">
            {game.originalPrice && (
              <span className="text-slate-500 line-through text-sm mr-2">${game.originalPrice}</span>
            )}
            <span className="text-2xl font-bold text-white">${game.price}</span>
          </div>
        </div>
        
        {gameIsOwned ? (
          <Button className="w-full bg-green-600 hover:bg-green-700">
            <Play className="w-4 h-4 mr-2" />
            Play Now
          </Button>
        ) : (
          <div className="space-y-2">
            <Button onClick={onPurchase} className="w-full bg-green-600 hover:bg-green-700">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
            <Button variant="outline" className="w-full border-white/20 hover:bg-white/10">
              <Heart className="w-4 h-4 mr-2" />
              Add to Wishlist
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// DLC Section Component
function DLCSection({ dlcs }) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-white/10">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Gift className="w-5 h-5 text-blue-400" />
        Downloadable Content
      </h3>
      <div className="space-y-2">
        {dlcs.map((dlc) => (
          <div key={dlc.id} className="flex items-center gap-3 p-2 bg-slate-900/50 rounded-lg hover:bg-slate-900/80 transition-colors cursor-pointer">
            <img src={dlc.image} alt={dlc.name} className="w-20 h-12 object-cover rounded" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{dlc.name}</p>
            </div>
            <div className="text-right">
              {dlc.discount > 0 && (
                <Badge className="bg-green-600 text-white text-xs mb-1">-{dlc.discount}%</Badge>
              )}
              <p className="text-white font-bold">
                ${dlc.discount > 0 ? (dlc.price * (1 - dlc.discount / 100)).toFixed(2) : dlc.price}
              </p>
            </div>
            <Button size="sm" variant="outline" className="border-white/20 hover:bg-white/10">
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Review Card Component
function ReviewCard({ review }) {
  const [helpfulVoted, setHelpfulVoted] = useState(null);

  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-white/10">
      <div className="flex items-start gap-3 mb-3">
        <img src={review.avatar} alt={review.user} className="w-10 h-10 rounded" />
        <div className="flex-1">
          <p className="text-blue-400 font-medium text-sm">{review.user}</p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            <span>{review.hours} hrs on record</span>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded ${
          review.rating === 'positive' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {review.rating === 'positive' ? (
            <ThumbsUp className="w-4 h-4" />
          ) : (
            <ThumbsDown className="w-4 h-4" />
          )}
          <span className="text-xs font-medium capitalize">{review.rating === 'positive' ? 'Recommended' : 'Not Recommended'}</span>
        </div>
      </div>

      <p className="text-xs text-slate-500 mb-2">POSTED: {review.date}</p>
      <p className="text-sm text-slate-300 leading-relaxed mb-4">{review.content}</p>

      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <span className="text-xs text-slate-500">Was this review helpful?</span>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setHelpfulVoted('yes')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              helpfulVoted === 'yes' ? 'bg-blue-500/30 text-blue-400' : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            <ThumbsUp className="w-3 h-3" />
            Yes ({review.helpful + (helpfulVoted === 'yes' ? 1 : 0)})
          </button>
          <button 
            onClick={() => setHelpfulVoted('no')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              helpfulVoted === 'no' ? 'bg-red-500/30 text-red-400' : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            <ThumbsDown className="w-3 h-3" />
            No ({review.notHelpful + (helpfulVoted === 'no' ? 1 : 0)})
          </button>
          <button className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-white/5 text-slate-400 hover:bg-white/10">
            <Flag className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Reviews Section Component
function ReviewsSection({ reviews }) {
  const [filter, setFilter] = useState('all');
  const [showWriteReview, setShowWriteReview] = useState(false);

  const positiveCount = reviews.filter(r => r.rating === 'positive').length;
  const positivePercent = Math.round((positiveCount / reviews.length) * 100);

  const filteredReviews = filter === 'all' 
    ? reviews 
    : reviews.filter(r => r.rating === filter);

  return (
    <div className="space-y-4">
      {/* Review Summary */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-white/10">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          User Reviews
        </h3>
        
        <div className="flex items-center gap-6 mb-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">{positivePercent}%</div>
            <div className="text-xs text-slate-500">Positive</div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${positivePercent}%` }} />
              </div>
              <span className="text-xs text-slate-400">{reviews.length} reviews</span>
            </div>
            <p className="text-sm text-blue-400 font-medium">Very Positive</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={() => setShowWriteReview(!showWriteReview)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Write a Review
          </Button>
          <div className="flex gap-1 ml-auto">
            {['all', 'positive', 'negative'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  filter === f 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {f === 'all' ? 'All' : f === 'positive' ? 'Positive' : 'Negative'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Write Review Form */}
      <AnimatePresence>
        {showWriteReview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-800/50 rounded-lg p-4 border border-white/10"
          >
            <h4 className="text-white font-medium mb-3">Write Your Review</h4>
            <div className="flex gap-3 mb-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors">
                <ThumbsUp className="w-4 h-4" />
                Recommended
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:bg-white/10 transition-colors">
                <ThumbsDown className="w-4 h-4" />
                Not Recommended
              </button>
            </div>
            <textarea 
              placeholder="Write your review here..."
              className="w-full h-32 bg-slate-900/50 border border-white/10 rounded-lg p-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={() => setShowWriteReview(false)}>Cancel</Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Submit Review</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews List */}
      <div className="space-y-3">
        {filteredReviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}

// System Requirements Component
function SystemRequirements({ game }) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-white/10">
      <h3 className="text-lg font-bold text-white mb-4">System Requirements</h3>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-bold text-slate-400 mb-3">MINIMUM:</h4>
          <div className="space-y-2 text-sm">
            <div><span className="text-slate-500">OS:</span> <span className="text-slate-300">Windows 10 64-bit</span></div>
            <div><span className="text-slate-500">Processor:</span> <span className="text-slate-300">Intel Core i5-4460</span></div>
            <div><span className="text-slate-500">Memory:</span> <span className="text-slate-300">8 GB RAM</span></div>
            <div><span className="text-slate-500">Graphics:</span> <span className="text-slate-300">NVIDIA GTX 960</span></div>
            <div><span className="text-slate-500">Storage:</span> <span className="text-slate-300">50 GB available</span></div>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-400 mb-3">RECOMMENDED:</h4>
          <div className="space-y-2 text-sm">
            <div><span className="text-slate-500">OS:</span> <span className="text-slate-300">Windows 10/11 64-bit</span></div>
            <div><span className="text-slate-500">Processor:</span> <span className="text-slate-300">Intel Core i7-8700K</span></div>
            <div><span className="text-slate-500">Memory:</span> <span className="text-slate-300">16 GB RAM</span></div>
            <div><span className="text-slate-500">Graphics:</span> <span className="text-slate-300">NVIDIA RTX 3070</span></div>
            <div><span className="text-slate-500">Storage:</span> <span className="text-slate-300">50 GB SSD</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GameDetailPanel({ gameId, onClose, showBackButton = true, from = 'store' }) {
  const { addToCart, isPurchased } = useCart();
  const { isAuthenticated, user, updateUserData } = useAuth();
  
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');

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
        console.error("Error fetching game:", error);
        if (legacyEnhancedMockData[gameId]) {
          setGame(legacyEnhancedMockData[gameId]);
        } else {
          setGame(null);
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (gameId) {
      fetchGame();
    } else {
      setLoading(false);
      setGame(null);
    }
  }, [gameId]);

  const handlePurchase = async () => {
    if (game && isAuthenticated) {
      const currentPurchased = user?.purchased_items || [];
      if (!currentPurchased.includes(game.id)) {
        await updateUserData({ 
          purchased_items: [...currentPurchased, game.id] 
        });
      }
    }
  };

  const gameIsOwned = game?.id ? isPurchased(game.id) : false;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900 text-white p-6">
        <h1 className="text-4xl font-bold mb-4">Game Not Found</h1>
        <p className="text-slate-400 mb-8">The game you're looking for doesn't exist.</p>
        {showBackButton && onClose && (
          <Button onClick={onClose}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-b from-slate-900 via-slate-900 to-black text-white overflow-y-auto">
      {/* Header Banner */}
      <div className="relative h-80 overflow-hidden">
        <img
          src={game.banner || game.cover_image || game.cover}
          alt={game.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
        
        {/* Close Button */}
        {showBackButton && onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-all text-white/80 hover:text-white z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-black text-white mb-2">{game.title}</h1>
            <div className="flex items-center gap-4 text-sm text-slate-300">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span>{game.rating || '4.8'}</span>
              </div>
              <span>{game.developer || 'Game Studio'}</span>
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                {game.genre}
              </Badge>
              {game.aiEnhanced && (
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                  <Bot className="w-3 h-3 mr-1" />
                  AI Enhanced
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Steam Layout */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Left Column - Media & Content */}
          <div className="flex-1 space-y-6">
            {/* Media Gallery */}
            <MediaGallery game={game} />

            {/* Description */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-3">About This Game</h3>
              <p className="text-slate-300 leading-relaxed">{game.description}</p>
            </div>

            {/* DLC Section */}
            <DLCSection dlcs={mockDLCs} />

            {/* System Requirements */}
            <SystemRequirements game={game} />

            {/* Reviews Section */}
            <ReviewsSection reviews={mockReviews} />

            {/* Tabs for Equipment/Abilities (Atom x Eve specific) */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-white/10">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-slate-900/50 mb-4">
                  <TabsTrigger value="about">Features</TabsTrigger>
                  <TabsTrigger value="equipment">Equipment</TabsTrigger>
                  <TabsTrigger value="abilities">Abilities</TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {['Single-player', 'Online Co-op', 'Steam Achievements', 'Cloud Saves', 'Controller Support', 'AI Companion'].map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="equipment">
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {[
                      { id: 1, name: 'Dragon Blade', type: 'Weapon', rarity: 'Legendary' },
                      { id: 2, name: 'Shadow Armor', type: 'Chest', rarity: 'Epic' },
                      { id: 3, name: 'Phoenix Helm', type: 'Head', rarity: 'Rare' },
                      { id: 4, name: 'Mystic Gauntlets', type: 'Hands', rarity: 'Epic' },
                      { id: 5, name: 'Thunder Boots', type: 'Feet', rarity: 'Rare' },
                      { id: 6, name: 'Crystal Shield', type: 'Shield', rarity: 'Epic' },
                    ].map((item) => (
                      <div key={item.id} className="bg-slate-900/50 rounded-lg p-2 border border-white/5 hover:border-white/20 transition-colors cursor-pointer">
                        <div className="w-full aspect-square bg-slate-800 rounded-md mb-1.5 flex items-center justify-center">
                          <Sword className="w-6 h-6 text-slate-600" />
                        </div>
                        <p className="text-[10px] text-white font-medium truncate">{item.name}</p>
                        <Badge className={`${rarityColors[item.rarity]} text-[8px] px-1 py-0`}>{item.rarity}</Badge>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="abilities">
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {[
                      { id: 1, name: 'Inferno Strike', tier: 'Legendary', cooldown: '45s' },
                      { id: 2, name: 'Time Warp', tier: 'Epic', cooldown: '60s' },
                      { id: 3, name: 'Shadow Step', tier: 'Rare', cooldown: '15s' },
                      { id: 4, name: 'Void Shield', tier: 'Epic', cooldown: '30s' },
                      { id: 5, name: 'Lightning Storm', tier: 'Legendary', cooldown: '90s' },
                      { id: 6, name: 'Healing Nova', tier: 'Rare', cooldown: '25s' },
                    ].map((ability) => (
                      <div key={ability.id} className="bg-slate-900/50 rounded-lg p-2 border border-purple-500/10 hover:border-purple-500/30 transition-colors cursor-pointer">
                        <div className="w-full aspect-square bg-purple-900/20 rounded-md mb-1.5 flex items-center justify-center">
                          <Zap className="w-6 h-6 text-purple-500" />
                        </div>
                        <p className="text-[10px] text-white font-medium truncate">{ability.name}</p>
                        <div className="flex items-center justify-between">
                          <Badge className={`${rarityColors[ability.tier]} text-[8px] px-1 py-0`}>{ability.tier}</Badge>
                          <span className="text-[8px] text-purple-400">{ability.cooldown}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right Column - Game Info Sidebar */}
          <div className="w-80 flex-shrink-0">
            <div className="sticky top-4">
              <GameInfoSidebar 
                game={game} 
                gameIsOwned={gameIsOwned} 
                onPurchase={handlePurchase}
                isAuthenticated={isAuthenticated}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}