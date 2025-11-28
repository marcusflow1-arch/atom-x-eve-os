
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Play, ShoppingCart, Heart, Share2, Video, Image as ImageIcon, Box } from 'lucide-react';
import { createPageUrl } from '@/utils';

const featuredGamesData = [
  {
    game_id: 'elder_scrolls_reborn',
    title: 'Elder Scrolls: Legends Expansion',
    cover_image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1280&h=720&fit=crop&q=80',
    hero_video: null,
    tagline: 'Explore new realms with 50+ hours of additional content, new spells, and legendary artifacts.',
    rating: 4.8,
    reviewCount: '1,250',
    tags: ['Fantasy', 'RPG', 'New', 'Popular'],
    price: 59.99,
    media_boxes: [
      { type: 'image', thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop', link_id: 'sample_3' },
      { type: 'video', thumbnail: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=300&fit=crop', link_id: 'neural_racing' },
      { type: 'lootbox', thumbnail: 'https://images.unsplash.com/photo-1607473069269-d82aaf7b37c7?w=400&h=300&fit=crop', link_id: 'ai_dungeon_master' },
      { type: 'image', thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop', link_id: 'sample_4' },
    ]
  },
  {
    game_id: 'cyberpunk_2088',
    title: 'Cyberpunk 2088: Phantom Liberty',
    cover_image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1280&h=720&fit=crop&q=80',
    hero_video: 'https://cdn.coverr.co/videos/coverr-a-futuristic-city-with-flying-cars-8594/1080p.mp4',
    tagline: 'Return to Night City in a high-stakes story of espionage and survival.',
    rating: 4.9,
    reviewCount: '2,100',
    tags: ['Sci-Fi', 'Action', 'RPG'],
    price: 49.99,
    media_boxes: [
      { type: 'video', thumbnail: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=300&fit=crop', link_id: 'sample_4' },
      { type: 'image', thumbnail: 'https://images.unsplash.com/photo-1607473069269-d82aaf7b37c7?w=400&h=300&fit=crop', link_id: 'ai_dungeon_master' },
    ]
  },
  {
    game_id: 'neural_racing',
    title: 'Neural Racing Championship',
    cover_image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=1280&h=720&fit=crop&q=80',
    tagline: 'AI opponents that learn and adapt to your driving style.',
    rating: 4.7,
    reviewCount: '980',
    tags: ['Racing', 'AI', 'Competitive'],
    price: 39.99,
    media_boxes: [ { type: 'image', thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop', link_id: 'sample_3' },]
  },
  {
    game_id: 'ai_dungeon_master',
    title: 'AI Dungeon Master',
    cover_image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1280&h=720&fit=crop&q=80',
    tagline: 'Infinite adventures powered by advanced AI storytelling.',
    rating: 4.9,
    reviewCount: '3,450',
    tags: ['RPG', 'AI', 'Story-Rich'],
    price: 29.99,
    media_boxes: [ { type: 'image', thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop', link_id: 'ai_dungeon_master' },]
  },
  {
    game_id: 'sample_3',
    title: 'Half-Life: Reconstructed',
    cover_image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1280&h=720&fit=crop&q=80',
    tagline: 'The legendary FPS returns with AI-enhanced graphics.',
    rating: 4.8,
    reviewCount: '5,600',
    tags: ['FPS', 'Classic', 'AI Enhanced'],
    price: 39.99,
    media_boxes: [ { type: 'video', thumbnail: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=400&h=300&fit=crop', link_id: 'neural_racing' },]
  }
];

const MediaBoxIcon = ({ type }) => {
  switch (type) {
    case 'video': return <Video className="w-5 h-5" />;
    case 'lootbox': return <Box className="w-5 h-5" />;
    case 'image':
    default: return <ImageIcon className="w-5 h-5" />;
  }
};

export default function HeroScrollBox() {
    const [activeIndex, setActiveIndex] = useState(0);
    const timeoutRef = useRef(null);
    const navigate = useNavigate();

    const resetTimeout = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };

    useEffect(() => {
        resetTimeout();
        timeoutRef.current = setTimeout(() => {
            setActiveIndex((prevIndex) => (prevIndex + 1) % featuredGamesData.length);
        }, 6000);

        return () => {
            resetTimeout();
        };
    }, [activeIndex]);

    const currentGame = featuredGamesData[activeIndex];

    return (
        <div className="w-full mb-12 relative">
            <style>{`
                /* Hero scroll box animations */
                .hero-scroll-animation {
                    animation: heroGlow 4s ease-in-out infinite alternate;
                }
                
                @keyframes heroGlow {
                    0% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
                    100% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.5); }
                }

                /* Horizontal line animation - same as Achievement Tracking */
                .hero-horizontal-line {
                    position: relative;
                    width: 100%;
                    height: 4px;
                    background: linear-gradient(270deg, #3b82f6, #60a5fa, #3b82f6);
                    background-size: 200% 200%;
                    animation: glowPulse 2s infinite linear;
                    border-radius: 2px;
                    margin-top: 16px;
                    margin-bottom: 24px;
                }

                @keyframes glowPulse {
                    0% { 
                        box-shadow: 0 0 4px #3b82f6;
                        background-position: 0% 50%;
                    }
                    50% { 
                        box-shadow: 0 0 12px #60a5fa;
                        background-position: 100% 50%;
                    }
                    100% { 
                        box-shadow: 0 0 4px #3b82f6;
                        background-position: 0% 50%;
                    }
                }
            `}</style>
            
            {/* Main Hero Box */}
            <div className="relative h-[500px] rounded-2xl overflow-hidden bg-slate-900/50 border border-slate-700/50 hero-scroll-animation">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0"
                    >
                        {currentGame.hero_video ? (
                            <video
                                autoPlay
                                muted
                                loop
                                className="w-full h-full object-cover"
                            >
                                <source src={currentGame.hero_video} type="video/mp4" />
                            </video>
                        ) : (
                            <img
                                src={currentGame.cover_image}
                                alt={currentGame.title}
                                className="w-full h-full object-cover"
                            />
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                        
                        <div className="absolute inset-0 flex items-center">
                            <div className="p-8 lg:p-12 max-w-2xl">
                                <motion.h2
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2, duration: 0.6 }}
                                    className="text-4xl lg:text-6xl font-black text-white mb-4"
                                >
                                    {currentGame.title}
                                </motion.h2>
                                
                                <motion.p
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4, duration: 0.6 }}
                                    className="text-lg text-slate-200 mb-4 leading-relaxed"
                                >
                                    {currentGame.tagline}
                                </motion.p>
                                
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.6, duration: 0.6 }}
                                    className="flex flex-wrap gap-2 mb-6"
                                >
                                    {currentGame.tags.map((tag) => (
                                        <Badge key={tag} variant="secondary" className="bg-blue-600/20 text-blue-200 border-blue-500/30">
                                            {tag}
                                        </Badge>
                                    ))}
                                </motion.div>
                                
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.8, duration: 0.6 }}
                                    className="flex items-center gap-4 mb-6"
                                >
                                    <div className="flex items-center gap-1">
                                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                        <span className="text-white font-semibold">{currentGame.rating}</span>
                                        <span className="text-slate-400">({currentGame.reviewCount} reviews)</span>
                                    </div>
                                    <span className="text-3xl font-bold text-green-400">${currentGame.price}</span>
                                </motion.div>
                                
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 1, duration: 0.6 }}
                                    className="flex flex-wrap gap-3"
                                >
                                    <Button 
                                        size="lg" 
                                        className="bg-green-600 hover:bg-green-700 text-white font-bold"
                                        onClick={() => navigate(createPageUrl(`GameDetail?id=${currentGame.game_id}`))}
                                    >
                                        <ShoppingCart className="w-5 h-5 mr-2" />
                                        Buy Now
                                    </Button>
                                    <Button 
                                        size="lg" 
                                        variant="outline" 
                                        className="border-blue-500/50 bg-blue-600/20 text-blue-200 hover:bg-blue-600/30"
                                        onClick={() => navigate(createPageUrl(`GameDetail?id=${currentGame.game_id}`))}
                                    >
                                        <Play className="w-5 h-5 mr-2" />
                                        Play Demo
                                    </Button>
                                    <Button size="lg" variant="ghost" className="text-slate-300 hover:text-white">
                                        <Heart className="w-5 h-5 mr-2" />
                                        Wishlist
                                    </Button>
                                    <Button size="lg" variant="ghost" className="text-slate-300 hover:text-white">
                                        <Share2 className="w-5 h-5 mr-2" />
                                        Share
                                    </Button>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
            
            {/* Animated Horizontal Line - Now for ALL games */}
            <motion.div
                key={`line-${activeIndex}`} // Key changes with each game for re-animation
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="hero-horizontal-line"
            />

            {/* Mini Media Boxes */}
            {currentGame.media_boxes && currentGame.media_boxes.length > 0 && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                    {currentGame.media_boxes.map((media, index) => (
                        <motion.div
                            key={index}
                            whileHover={{ scale: 1.05, y: -5 }}
                            className="relative rounded-lg overflow-hidden cursor-pointer group bg-slate-800/50 border border-slate-700/50"
                            onClick={() => navigate(createPageUrl(`GameDetail?id=${media.link_id}`))}
                        >
                            <img 
                                src={media.thumbnail} 
                                alt={`${currentGame.title} media ${index + 1}`}
                                className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-blue-600/80 p-2 rounded-full group-hover:bg-blue-500 transition-colors duration-300">
                                    <MediaBoxIcon type={media.type} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Pagination Dots */}
            <div className="flex justify-center mt-8 space-x-2">
                {featuredGamesData.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveIndex(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            index === activeIndex 
                                ? 'bg-blue-500 scale-125 shadow-lg shadow-blue-500/50' 
                                : 'bg-slate-600 hover:bg-slate-500'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}
