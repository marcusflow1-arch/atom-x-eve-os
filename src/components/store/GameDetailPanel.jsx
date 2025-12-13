import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, ThumbsUp, ThumbsDown, Package, BrainCircuit, Heart, Award, Shield, User, Info, Trophy, MessageSquare, BookOpen } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Post } from '@/entities/Post'; // Assuming Post entity is available
import CreatePostForm from '../community/CreatePostForm'; // Import form

const categoryIcons = {
    equipment: <Shield className="w-4 h-4" />,
    ability: <BrainCircuit className="w-4 h-4" />,
    companion: <Heart className="w-4 h-4" />,
    ui: <Package className="w-4 h-4" />,
    ai_teacher: <Award className="w-4 h-4" />
};

const AchievementCard = ({ achievement, onClick, isUnlocked }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [20, -20]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-20, 20]);

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXPos = event.clientX - rect.left;
    const mouseYPos = event.clientY - rect.top;
    x.set(mouseXPos / width - 0.5);
    y.set(mouseYPos / height - 0.5);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const rarityColors = {
    Common: "border-slate-600 shadow-slate-500/20",
    Uncommon: "border-green-500 shadow-green-500/20",
    Rare: "border-blue-500 shadow-blue-500/20",
    Epic: "border-purple-500 shadow-purple-500/20",
    Legendary: "border-orange-500 shadow-orange-500/20",
    Mythical: "border-red-500 shadow-red-500/20",
    Unique: "border-yellow-400 shadow-yellow-500/40",
    Limitless: "border-pink-400 shadow-pink-500/40"
  };

  const rarityColor = rarityColors[achievement.rarity] || rarityColors.Common;

  return (
    <motion.div
      onClick={() => onClick && onClick(achievement)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ 
        rotateX, 
        rotateY, 
        transformStyle: "preserve-3d" 
      }}
      whileHover={{ scale: 1.05 }}
      className={`relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer group bg-slate-900 border-2 ${isUnlocked ? rarityColor : 'border-slate-800 grayscale opacity-60'}`}
    >
      {/* Card Content */}
      <div className="absolute inset-0 flex flex-col items-center p-4 transform-style-3d">
        {/* Header */}
        <div className="w-full flex justify-between items-start mb-2" style={{ transform: "translateZ(20px)" }}>
          <Badge variant="outline" className="bg-black/50 border-white/10 text-[10px]">
            {achievement.category || 'General'}
          </Badge>
          <div className="text-yellow-400 font-bold text-xs">{achievement.points} pts</div>
        </div>

        {/* Icon / Image Area */}
        <div className="flex-1 flex items-center justify-center w-full my-2" style={{ transform: "translateZ(30px)" }}>
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-5xl shadow-inner border border-white/10">
            {achievement.icon || '🏆'}
          </div>
        </div>

        {/* Info */}
        <div className="w-full text-center mt-auto" style={{ transform: "translateZ(25px)" }}>
          <h3 className="text-white font-bold text-sm leading-tight mb-1 line-clamp-2">{achievement.title}</h3>
          <p className="text-slate-400 text-xs line-clamp-2">{achievement.description}</p>
        </div>

        {/* Rarity Label */}
        <div className="mt-3 w-full border-t border-white/10 pt-2 flex justify-between items-center" style={{ transform: "translateZ(20px)" }}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
            {achievement.rarity}
          </span>
          {isUnlocked && <Check className="w-4 h-4 text-green-400" />}
        </div>
      </div>

      {/* Shine Effect */}
      <motion.div 
        style={{
          opacity: useTransform(rotateX, (val) => Math.abs(val) / 30 + 0.1),
          background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.2) 45%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.2) 55%, transparent 80%)",
          transform: useTransform(mouseX, [-0.5, 0.5], ["translateX(-100%)", "translateX(100%)"]),
        }}
        className="absolute inset-0 z-10 pointer-events-none mix-blend-overlay"
      />
    </motion.div>
  );
};

const ReviewItem = ({ review }) => (
    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
        <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="font-semibold">{review.user}</span>
                {review.verified && <Badge variant="secondary" className="text-xs bg-blue-600/30 text-blue-300 border-blue-500/50">Verified Buyer</Badge>}
            </div>
            <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-slate-600'}`} />)}
            </div>
        </div>
        <p className="text-slate-300 mb-2">{review.content}</p>
        <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Playtime: {review.playtime}</span>
            <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="flex items-center gap-1"><ThumbsUp className="w-3 h-3"/> 12</Button>
                <Button variant="ghost" size="sm"><ThumbsDown className="w-3 h-3"/></Button>
            </div>
        </div>
    </div>
);

const AchievementRewardItem = ({ achievement }) => (
    <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
        <div className={`w-12 h-12 flex-shrink-0 rounded-md flex items-center justify-center ${achievement.status === 'unlocked' ? 'bg-green-600/30' : 'bg-slate-700'}`}>
            {categoryIcons[achievement.type] || <Star className="w-6 h-6"/>}
        </div>
        <div>
            <h4 className={`font-bold ${achievement.status === 'unlocked' ? 'text-green-400' : 'text-white'}`}>{achievement.title}</h4>
            <p className="text-sm text-slate-400">{achievement.description}</p>
        </div>
        <Badge variant={achievement.status === 'unlocked' ? 'default' : 'secondary'} className={`ml-auto ${achievement.status === 'unlocked' ? 'bg-green-600' : ''}`}>
            {achievement.status}
        </Badge>
    </div>
);

export default function GameDetailPanel({ game, onPurchase }) {
    const [activeTab, setActiveTab] = useState('game_detail');
    const [activeMedia, setActiveMedia] = useState(() => {
        // Safely initialize activeMedia with fallback
        if (game?.media && game.media.length > 0) {
            return game.media[0];
        }
        // Fallback media object if game.media is undefined or empty
        return {
            type: 'image',
            url: game?.cover_image || game?.image || '/placeholder.jpg'
        };
    });
    const [communityPosts, setCommunityPosts] = useState([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);
    const [showCreatePost, setShowCreatePost] = useState(false);

    useEffect(() => {
        if (activeTab === 'community' && game?.title) {
            const fetchPosts = async () => {
                setIsLoadingPosts(true);
                try {
                    // Assuming Post.filter takes filter object, sort field, and limit
                    const posts = await Post.filter({ game_title: game.title }, '-created_date', 5);
                    setCommunityPosts(posts);
                } catch (error) {
                    console.error("Failed to fetch community posts:", error);
                }
                setIsLoadingPosts(false);
            };
            fetchPosts();
        }
    }, [activeTab, game?.title]);
    
    const handleCreatePost = async (postData) => {
      try {
        // Add game_title to postData
        const newPost = { ...postData, game_title: game.title };
        await Post.create(newPost);
        setShowCreatePost(false);
        // Refetch posts to update the list
        const posts = await Post.filter({ game_title: game.title }, '-created_date', 5);
        setCommunityPosts(posts);
      } catch (error) {
        console.error("Failed to create post:", error);
      }
    };

    if (!game) {
        return (
            <div className="flex items-center justify-center h-full text-slate-500 p-4">
                <p>Select a game to see the details.</p>
            </div>
        );
    }

    // Safely handle media array with fallbacks
    const gameMedia = game.media && Array.isArray(game.media) && game.media.length > 0 
        ? game.media 
        : [{ 
            type: 'image', 
            url: game.cover_image || game.image || 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&h=300&fit=crop',
            alt: game.title || 'Game image'
        }];

    const topLevelTabs = [
        { id: 'game_detail', label: 'Game Detail', icon: <Info className="w-4 h-4" /> },
        { id: 'progression', label: 'Progression', icon: <BookOpen className="w-4 h-4" /> },
        { id: 'achievements', label: 'Achievements', icon: <Trophy className="w-4 h-4" /> },
        { id: 'equipment', label: 'Equipment', icon: <Shield className="w-4 h-4" /> },
        { id: 'community', label: 'Community', icon: <MessageSquare className="w-4 h-4" /> },
    ];
    
    // Content for the "Game Detail" tab
    const GameDetailContent = () => (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Media Section */}
            <div className="p-4 flex-shrink-0">
                <div className="aspect-video rounded-lg overflow-hidden mb-2 bg-black">
                    {activeMedia.type === 'video' ? (
                        <video src={activeMedia.url} autoPlay muted loop className="w-full h-full object-cover"></video>
                    ) : (
                        <img src={activeMedia.url} alt={activeMedia.alt || "Main Media"} className="w-full h-full object-cover" />
                    )}
                </div>
                <div className="grid grid-cols-5 gap-2">
                    {gameMedia.map((media, index) => (
                        <div key={index} 
                             className={`aspect-video rounded-md overflow-hidden cursor-pointer border-2 ${activeMedia.url === media.url ? 'border-blue-500' : 'border-transparent'}`}
                             onClick={() => setActiveMedia(media)}>
                            <img src={media.url} alt={media.alt || `thumbnail ${index}`} className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Info Section */}
            <div className="px-4 pb-4 flex-grow overflow-y-auto">
                <h2 className="text-2xl font-bold mb-1">{game.title}</h2>
                <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
                    <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span>{game.rating || '4.5'} ({(game.reviewsCount || 1250)?.toLocaleString()} reviews)</span>
                    </div>
                    <span>{game.developer || 'AtomXEve Studios'}</span>
                    <span>{game.original_year ? new Date(game.original_year, 0).toLocaleDateString() : 'TBA'}</span>
                </div>
                <p className="text-sm text-slate-300 mb-4">{game.description}</p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => onPurchase(game)}>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Buy Now - {game.price ? `$${game.price.toLocaleString()}` : 'Free'}
                </Button>
            </div>
        </div>
    );

    // Content for the "Achievements" tab
    const AchievementsContent = () => (
        <div className="p-4 overflow-y-auto h-full">
            <h3 className="text-xl font-bold mb-4">Unlockable Achievements</h3>
            {(game.achievements && game.achievements.length > 0) ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {game.achievements.map(ach => (
                        <AchievementCard 
                            key={ach.id} 
                            achievement={ach} 
                            isUnlocked={ach.status === 'unlocked'}
                            onClick={(ach) => console.log('Achievement clicked:', ach)}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-slate-400">No achievements available for this game yet.</p>
            )}
        </div>
    );

    // Content for the "Equipment" tab
    const EquipmentContent = () => (
        <div className="p-4 overflow-y-auto h-full space-y-3">
            <h3 className="text-xl font-bold mb-2">In-Game Equipment</h3>
            {(game.equipment && game.equipment.length > 0) ? 
                game.equipment.map(eq => (
                    <div key={eq.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <h4 className="font-bold text-white">{eq.name}</h4>
                        <p className="text-sm text-green-400">{eq.statBonus}</p>
                        <p className="text-xs text-slate-400 mt-1">Unlock: Complete "{eq.unlockAchievement}"</p>
                    </div>
                )) :
                <p className="text-slate-400">No equipment information available for this game yet.</p>
            }
        </div>
    );

    // Content for the new Progression Tab
    const ProgressionContent = () => (
        <div className="p-4 overflow-y-auto h-full space-y-4">
            <h3 className="text-xl font-bold mb-2">Achievement Progression Path</h3>
            <p className="text-slate-400 text-sm mb-4">Complete achievements to unlock powerful rewards.</p>
            <div className="space-y-3">
                {(game.achievements && game.achievements.length > 0) ? 
                    game.achievements.map(ach => <AchievementRewardItem key={ach.id} achievement={ach} />) :
                    <p className="text-slate-400">No progression data available for this game yet.</p>
                }
            </div>
        </div>
    );
    
    // Content for the "Community" tab
    const CommunityContent = () => (
         <div className="p-4 overflow-y-auto h-full space-y-3">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold">Community Feed</h3>
                <Button variant="outline" onClick={() => setShowCreatePost(true)}>Ask for Help</Button>
            </div>
            {isLoadingPosts ? <p>Loading posts...</p> : 
              communityPosts.length > 0 ? (
                communityPosts.map(post => (
                  <div key={post.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <p className="font-bold text-white text-sm">{post.title}</p>
                    <p className="text-xs text-slate-400 line-clamp-2">{post.content}</p>
                    <span className="text-xs text-slate-500">by {post.created_by?.split('@')[0] || 'Unknown User'}</span>
                  </div>
                ))
              ) : <p className="text-slate-400">No community posts for this game yet.</p>
            }
            <h3 className="text-xl font-bold mb-2 pt-4">Community Reviews</h3>
            {(game.reviews && game.reviews.length > 0) ? 
                game.reviews.map(rev => <ReviewItem key={rev.id} review={rev} />) :
                <p className="text-slate-400">No reviews yet. Be the first to review this game!</p>
            }
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-slate-900/50 text-white rounded-2xl">
            {showCreatePost && (
              <CreatePostForm
                onSubmit={handleCreatePost}
                onCancel={() => setShowCreatePost(false)}
                initialType="game_discussion"
              />
            )}
            {/* Top Level Tab Navigation */}
            <div className="flex-shrink-0 px-4 pt-4 border-b border-slate-700/50 overflow-x-auto">
                <div className="flex items-center gap-2">
                    {topLevelTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative -mb-px ${
                                activeTab === tab.id
                                    ? 'text-blue-400 border-b-2 border-blue-400'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-grow overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                    >
                        {activeTab === 'game_detail' && <GameDetailContent />}
                        {activeTab === 'progression' && <ProgressionContent />}
                        {activeTab === 'achievements' && <AchievementsContent />}
                        {activeTab === 'equipment' && <EquipmentContent />}
                        {activeTab === 'community' && <CommunityContent />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}