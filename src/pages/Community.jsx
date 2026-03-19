import React, { useState, useEffect, useCallback, useRef } from 'react';
import LiquidGlassCard from '@/components/shared/LiquidGlassCard';
import PostComposer from '../components/community/PostComposer';
import PostCard from '../components/community/PostCard';
import CommentSection from '../components/community/CommentSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
    Plus, ArrowLeft, Search, Mic, MessageSquare, 
    Gamepad2, Star, Trophy, Target, Users, 
    Grid, ChevronRight, Hash, Crosshair, 
    Shield, Sparkles, Car, Skull, Monitor,
    Video, Image, Palette, Newspaper, Book, Wheat
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../components/auth/AuthContext';
import { base44 } from '@/api/base44Client';
import { showError, showSuccess } from '@/components/error/ErrorToast';
import PageErrorBoundary from '@/components/error/PageErrorBoundary';
import HotTopicsSidebar from '../components/community/HotTopicsSidebar';
import GameBanner from '../components/community/GameBanner';
import { getWallpaperFor } from '../components/community/gameWallpapers';
import GlassPageFrame from '../components/shared/GlassPageFrame';

// Mock Genres configuration matching Store/Marketplace
const GENRE_CONFIG = [
    { label: 'Action', icon: Crosshair },
    { label: 'RPG', icon: Shield },
    { label: 'Shooter', icon: Crosshair },
    { label: 'Sci-Fi', icon: Sparkles },
    { label: 'Strategy', icon: Trophy },
    { label: 'Adventure', icon: Gamepad2 },
    { label: 'Sports', icon: Trophy },
    { label: 'Racing', icon: Car },
    { label: 'Simulation', icon: Monitor },
    { label: 'Horror', icon: Skull },
];

const TOPIC_TYPES = [
    { id: 'all', label: 'All', icon: Grid },
    { id: 'discussion', label: 'Discussion', icon: MessageSquare },
    { id: 'video', label: 'Video', icon: Video },
    { id: 'screenshot', label: 'Screenshots', icon: Image },
    { id: 'artwork', label: 'Artwork', icon: Palette },
    { id: 'news', label: 'News', icon: Newspaper },
    { id: 'guide', label: 'Guides', icon: Book },
    { id: 'review', label: 'Review', icon: Star },
];

export default function CommunityPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, useStateShowCreateForm] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [activeSection, setActiveSection] = useState('all'); // Filter for topics
    
    // Initialize activeGame from navigation state if available
    const [activeGame, setActiveGame] = useState(location.state?.selectedGame || null); 
    const [sortBy, setSortBy] = useState('newest');
    const [hotFilter, setHotFilter] = useState('none');
    const [rightPosts, setRightPosts] = useState([]);
    const [loadingRight, setLoadingRight] = useState(false);

    // Sync activeGame when location state changes (e.g. from Clan navigation)
    useEffect(() => {
        if (location.state?.selectedGame) {
            setActiveGame(location.state.selectedGame);
        }
        if (location.state?.section) {
            setActiveSection(location.state.section);
        }
    }, [location.state]);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('All Games'); // 'All Games' | 'All Cards' | specific genre
    const [allGames, setAllGames] = useState([]); // All game entities
    const [filteredGames, setFilteredGames] = useState([]); // Games after genre and search filter

    const { isAuthenticated } = useAuth();
    const genreScrollRef = useRef(null);
    const hoverIntervalRef = useRef(null);
    const hoverDirRef = useRef(1);

    // Horizontal scroll support for genres + gentle hover auto-scroll
    useEffect(() => {
        const el = genreScrollRef.current;
        if (!el) return;

        const onWheel = (e) => {
            if (e.deltaY === 0) return;
            if (el.scrollWidth > el.clientWidth) {
                e.preventDefault();
                el.scrollLeft += e.deltaY;
            }
        };
        el.addEventListener('wheel', onWheel, { passive: false });

        const onEnter = () => {
            if (hoverIntervalRef.current) return;
            hoverIntervalRef.current = setInterval(() => {
                if (!el) return;
                el.scrollLeft += 1.5 * hoverDirRef.current;
                if (el.scrollLeft <= 0) hoverDirRef.current = 1;
                else if (el.scrollLeft + el.clientWidth >= el.scrollWidth) hoverDirRef.current = -1;
            }, 16);
        };
        const onLeave = () => {
            if (hoverIntervalRef.current) {
                clearInterval(hoverIntervalRef.current);
                hoverIntervalRef.current = null;
            }
        };
        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mouseleave', onLeave);

        return () => {
            el.removeEventListener('wheel', onWheel);
            el.removeEventListener('mouseenter', onEnter);
            el.removeEventListener('mouseleave', onLeave);
            if (hoverIntervalRef.current) {
                clearInterval(hoverIntervalRef.current);
                hoverIntervalRef.current = null;
            }
        };
    }, []);

    // Fetch all games
    useEffect(() => {
        const fetchGames = async () => {
            try {
                const gamesResponse = await base44.entities.Game.list('-original_year', 50);
                setAllGames(gamesResponse);
                setFilteredGames(gamesResponse);
            } catch (e) {
                console.error("Failed to fetch games", e);
            }
        };
        fetchGames();
    }, []);

    // Support deep links via URL params (?game=Title&section=general_discussion)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const gameTitle = params.get('game');
        const sectionParam = params.get('section');
        if (sectionParam) setActiveSection(sectionParam);
        
        if (gameTitle && allGames.length) {
            // Allow switching games if URL param changes
            const match = allGames.find(g => String(g.title).toLowerCase() === gameTitle.toLowerCase());
            if (match) {
                setActiveGame(match);
                // Clear selected post when URL changes (like clicking the sidebar quick link again)
                setSelectedPost(null);
            }
        } else if (!gameTitle && allGames.length) {
            // No game param — go back to game hub
            setActiveGame(null);
            setSelectedPost(null);
        }
    }, [location.search, location.key, allGames]);

    // Save visited game to Recent Forum Games
    useEffect(() => {
        if (activeGame) {
            try {
                const stored = JSON.parse(localStorage.getItem('recent_forum_games') || '[]');
                // Remove if exists to avoid duplicates
                const filtered = stored.filter(g => g.name !== activeGame.title);
                // Add to front
                const toSave = [{
                    id: activeGame.id,
                    name: activeGame.title,
                    image: activeGame.cover_image || activeGame.banner_image || activeGame.image
                }, ...filtered].slice(0, 5);
                
                localStorage.setItem('recent_forum_games', JSON.stringify(toSave));
                // Dispatch event so LibrarySidebar can update immediately
                window.dispatchEvent(new Event('recentForumGamesUpdated'));
            } catch (e) {
                console.error("Failed to save recent forum game", e);
            }
        }
    }, [activeGame]);

    // Apply filters to games
    useEffect(() => {
        let currentGames = allGames;

        if (selectedGenre !== 'All Games') {
            currentGames = currentGames.filter(game => game.genre === selectedGenre);
        }

        if (searchQuery && !activeGame) {
            const lowerQ = searchQuery.toLowerCase();
            currentGames = currentGames.filter(game =>
                game.title.toLowerCase().includes(lowerQ)
            );
        }
        setFilteredGames(currentGames);
    }, [allGames, selectedGenre, searchQuery, activeGame]);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            let filter = {};
            let sort = '-created_date';

            if (sortBy === 'popular') sort = '-score';

            if (activeGame) {
                filter.game_title = activeGame.title;
                
                // Map new topics to backend filters best effort
                if (activeSection !== 'all') {
                    if (activeSection === 'discussion') filter.type = 'game_discussion';
                    else if (activeSection === 'review') filter.type = 'game_review';
                    else if (activeSection === 'guide') filter.community = 'guide';
                    else if (activeSection === 'news') filter.community = 'general'; // fallback
                    // Video, Screenshot, Artwork handled by client-side filter or generic
                }
            }

            // Only fetch if we are inside a game or we want a global feed (optional)
            if (activeGame) {
                const fetchedPosts = await base44.entities.Post.filter(filter, sort, 50);
                let filtered = fetchedPosts;
                
                // Client-side filtering for media types
                if (activeSection === 'video' || activeSection === 'screenshot' || activeSection === 'artwork') {
                    filtered = filtered.filter(p => p.image_url);
                }

                if (searchQuery) {
                    const lowerQ = searchQuery.toLowerCase();
                    filtered = filtered.filter(p => 
                        p.title?.toLowerCase().includes(lowerQ) || 
                        p.content?.toLowerCase().includes(lowerQ)
                    );
                }
                setPosts(filtered);
            }
        } catch (e) {
            console.error("Failed to fetch posts", e);
        } finally {
            setLoading(false);
        }
    }, [activeSection, activeGame, sortBy, searchQuery]);

    const fetchRightPosts = useCallback(async () => {
        if (!activeGame) return;
        setLoadingRight(true);
        try {
            let filter = { game_title: activeGame.title };
            let sort = '-created_date';

            if (hotFilter === 'hot' || hotFilter === 'trending') sort = '-score';
            if (hotFilter === 'to_know') filter.community = 'guide';
            if (hotFilter === 'tips') filter.community = 'tips';

            const fetchedPosts = await base44.entities.Post.filter(filter, sort, 10);
            setRightPosts(fetchedPosts);
        } catch (e) {
            console.error("Failed to fetch right posts", e);
        } finally {
            setLoadingRight(false);
        }
    }, [activeGame, hotFilter]);

    useEffect(() => {
        if (hotFilter !== 'none') {
            fetchRightPosts();
        }
    }, [fetchRightPosts, hotFilter]);

    const fetchComments = useCallback(async (postId) => {
        if (!postId) return;
        const fetchedComments = await base44.entities.Comment.filter({ target_id: postId, target_type: 'post' }, '-created_date', 100);
        setComments(fetchedComments);
    }, []);

    useEffect(() => {
        if (activeGame) {
            if (!selectedPost) {
                fetchPosts();
            } else {
                fetchComments(selectedPost.id);
            }
        }
    }, [selectedPost, fetchPosts, fetchComments, activeGame]);

    const handleCreatePost = async (postData) => {
        if (!isAuthenticated) return;
        
        try {
            // Simplified moderation check
        } catch (e) {
            // Ignore for now
        }

        try {
            await base44.entities.Post.create(postData);
            useStateShowCreateForm(false);
            fetchPosts();
            showSuccess('Post created successfully!');
        } catch (error) {
            showError(error, 'Create Post');
        }
    };

    const handleVote = async (post, voteType) => {
        if (!isAuthenticated) {
            showError('Please sign in to vote');
            return;
        }
        try {
            const newScore = post.score + (voteType === 'up' ? 1 : -1);
            await base44.entities.Post.update(post.id, { score: newScore });
            setPosts(prevPosts => prevPosts.map(p => p.id === post.id ? {...p, score: newScore} : p));
            if (selectedPost?.id === post.id) {
                setSelectedPost(prev => ({...prev, score: newScore}));
            }
        } catch (error) {
            showError(error, 'Vote');
        }
    };

    const handleSelectGame = (game) => {
        // Update URL so the state syncs and back button works natively
        navigate(`${location.pathname}?game=${encodeURIComponent(game.title)}`);
        setSearchQuery(''); // Clear global search when entering a game
    }

    const setShowCreateForm = (value) => {
        if (value && !isAuthenticated) {
             showError("Please sign in to create posts.");
             return;
        }
        useStateShowCreateForm(value);
    }

    return (
        <PageErrorBoundary pageName="Community">
        <GlassPageFrame>
        <div 
            className="min-h-screen text-white p-4 sm:p-8 pt-40 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}
        >
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-300/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-[1600px] mx-auto h-[calc(100vh-8rem)] flex flex-col gap-6">
                
                {/* Header Section (Title) - Now at the top */}
                {!activeGame && (
                    <div className="flex items-center gap-4 px-2 mt-12 mb-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <MessageSquare className="w-4 h-4" />
                        </div>
                        <h1 className="text-xl font-bold tracking-wide text-white">GAMES DISCUSSION</h1>
                    </div>
                )}

                {/* Genre Filter Bar + Search - Moved Below Header */}
                {!activeGame && (
                    <div className="px-2">
                        <div className="flex items-center gap-4">
                            <motion.button
                                onClick={() => setSelectedGenre('All Games')}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`flex items-center gap-2 py-2 whitespace-nowrap transition-all ${selectedGenre === 'All Games' ? 'text-cyan-400 scale-105 font-black' : 'text-white/60 hover:text-white font-medium'}`}
                            >
                                <Gamepad2 className="w-4 h-4" />
                                <span className="text-sm uppercase tracking-wide">All Games</span>
                            </motion.button>

                            <div className="h-6 w-px bg-white/20" />

                            <div 
                                ref={genreScrollRef}
                                className="flex-1 flex items-center gap-6 overflow-x-auto pb-2 scrollbar-hide"
                            >
                                {GENRE_CONFIG.map((genre) => {
                                    const Icon = genre.icon;
                                    const isActive = selectedGenre === genre.label;
                                    return (
                                        <motion.button
                                            key={genre.label}
                                            onClick={() => setSelectedGenre(genre.label)}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`flex items-center gap-2 py-2 whitespace-nowrap transition-all ${isActive ? 'text-cyan-400 scale-105 font-black' : 'text-white/60 hover:text-white font-medium'}`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span className="text-sm uppercase tracking-wide">{genre.label}</span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Search Bar under All Games */}
                        <div className="relative mt-3 max-w-md">
                            <input 
                                type="text" 
                                placeholder="Search games..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all pl-9 pr-8"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                            <Mic className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 hover:text-white/60 cursor-pointer" />
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="flex-1 min-h-0 grid grid-cols-12 gap-6 overflow-hidden">
                    
                    {/* HUB VIEW: Game Grid */}
                    {!activeGame && (
                        <div className="col-span-12 overflow-y-auto pr-2 custom-scrollbar">
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                                    {loading && allGames.length === 0 ? (
                                        [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                            <div key={i} className="aspect-video bg-white/5 rounded-2xl animate-pulse" />
                                        ))
                                    ) : filteredGames.length > 0 ? (
                                        filteredGames.map(game => (
                                            <LiquidGlassCard
                                                key={game.id}
                                                className="group relative aspect-video rounded-2xl overflow-hidden cursor-pointer"
                                                hover={true}
                                                onClick={() => handleSelectGame(game)}
                                            >
                                                <img 
                                                    src={game.cover_image || game.banner_image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop"} 
                                                    alt={game.title} 
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
                                                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-2">
                                                    <Badge className="w-fit bg-cyan-500/20 text-cyan-300 border-cyan-500/30 backdrop-blur-md">
                                                        {game.genre}
                                                    </Badge>
                                                    <h3 className="text-white text-xl font-bold truncate group-hover:text-cyan-400 transition-colors">
                                                        {game.title}
                                                    </h3>
                                                    <div className="flex items-center gap-4 text-white/40 text-xs mt-1">
                                                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Forum</span>
                                                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Community</span>
                                                    </div>
                                                </div>
                                            </LiquidGlassCard>
                                        ))
                                    ) : (
                                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                                            <Search className="w-12 h-12 text-white/20 mb-4" />
                                            <h3 className="text-xl font-bold text-white/60">No Games Found</h3>
                                            <p className="text-white/40 text-sm mt-2">Try selecting a different genre.</p>
                                        </div>
                                    )}
                                </div>
                        </div>
                    )}

                    {/* FORUM VIEW: Feed + Sidebar */}
                    {activeGame && (
                        <>
                            {/* Left Rail: Hot Topics (2/12) */}
                            <div className="hidden lg:flex col-span-2 flex-col gap-4 pr-4 border-r border-white/5 pt-[7.75rem]">
                                <HotTopicsSidebar
                                  selected={hotFilter}
                                  onSelect={(id) => {
                                    setHotFilter(id);
                                    // Removed logic that reset activeSection or selectedPost
                                    // Now hotFilter purely drives the Right Sidebar
                                  }}
                                />
                            </div>
                            {/* Center: Feed (7/12) */}
                            <div className="col-span-12 lg:col-span-7 flex flex-col h-full overflow-hidden pt-[7.75rem]">
                                
                                {/* Horizontal Topic Filter Bar - Above the Banner */}
                                <div className="mb-4 w-full overflow-x-auto scrollbar-hide">
                                    <div className="flex items-center justify-between min-w-max gap-2 px-1">
                                        {TOPIC_TYPES.map((topic) => {
                                            const Icon = topic.icon;
                                            const isActive = activeSection === topic.id;
                                            return (
                                                <button
                                                    key={topic.id}
                                                    onClick={() => {
                                                        setActiveSection(topic.id);
                                                        setSelectedPost(null);
                                                    }}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all border ${
                                                        isActive 
                                                            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                                                            : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                                    }`}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    <span className="font-medium text-xs uppercase tracking-wide">{topic.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Controls Toolbar: Back, Search, New Post, Sort */}
                                <div className="mb-6">
                                <GameBanner imageUrl={getWallpaperFor(activeGame?.title) || activeGame?.banner_image || activeGame?.cover_image}>
                                    <div className="flex items-center gap-4">
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            onClick={() => {
                                                navigate(location.pathname); // Clear URL params
                                                setSelectedGenre('All Games');
                                                setActiveSection('all');
                                            }}
                                            className="text-white/60 hover:text-white shrink-0 -ml-2"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                        </Button>
                                        
                                        <h2 className="text-sm font-bold text-white tracking-wide uppercase whitespace-nowrap">
                                            {activeSection === 'all' ? 'All Posts' : TOPIC_TYPES.find(t => t.id === activeSection)?.label}
                                        </h2>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => navigate(createPageUrl('Farm') + `?gameId=${activeGame?.id || ''}`)}
                                            className="rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white h-8 px-3 text-xs whitespace-nowrap"
                                        >
                                            <Wheat className="w-3.5 h-3.5 mr-1.5" />
                                            Farm Hub
                                        </Button>

                                        <div className="relative w-full max-w-md">
                                            <input 
                                                type="text" 
                                                placeholder="Search this forum..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all pl-9"
                                            />
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                                        </div>

                                        <div className="flex-1" />

                                        <div className="flex items-center gap-3">
                                            <Button 
                                                onClick={() => setShowCreateForm(true)}
                                                size="sm"
                                                className="bg-blue-600/80 hover:bg-blue-600 border border-blue-400/30 rounded-full px-4 h-8 text-xs whitespace-nowrap"
                                            >
                                                <Plus className="w-3 h-3 mr-1" /> New Post
                                            </Button>
                                            <Select value={sortBy} onValueChange={setSortBy}>
                                                <SelectTrigger className="w-28 bg-white/5 border-white/10 text-white text-xs h-8 rounded-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="newest">Newest</SelectItem>
                                                    <SelectItem value="popular">Popular</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </GameBanner>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-20">
                                    <AnimatePresence mode="wait">
                                        {selectedPost ? (
                                            <motion.div
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="bg-[#0f1419]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 min-h-full"
                                            >
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => setSelectedPost(null)}
                                                    className="mb-6 hover:bg-white/10 -ml-2 text-white/60"
                                                >
                                                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Feed
                                                </Button>
                                                
                                                <PostCard post={selectedPost} onVote={handleVote} isDetailView={true} />
                                                
                                                <div className="mt-8 border-t border-white/10 pt-6">
                                                    <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                                                        <MessageSquare className="w-4 h-4 text-cyan-400" />
                                                        Comments ({comments.length})
                                                    </h3>
                                                    <CommentSection
                                                        postId={selectedPost.id}
                                                        comments={comments}
                                                        onAddComment={async (data) => {
                                                           await base44.entities.Comment.create(data);
                                                           fetchComments(selectedPost.id);
                                                        }}
                                                        onVote={async () => fetchComments(selectedPost.id)}
                                                    />
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="space-y-4"
                                            >
                                                {/* (Old header removed) */}

                                                {loading ? (
                                                    [1,2,3,4].map(i => (
                                                        <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
                                                    ))
                                                ) : posts.length > 0 ? (
                                                    posts.map(post => (
                                                        <div key={post.id} onClick={() => setSelectedPost(post)}>
                                                            <PostCard post={post} onVote={handleVote} />
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center py-20 text-center bg-white/5 rounded-3xl border border-white/5 border-dashed">
                                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                                            <MessageSquare className="w-8 h-8 text-white/20" />
                                                        </div>
                                                        <h3 className="text-xl font-bold text-white/60">No discussions yet</h3>
                                                        <p className="text-white/40 text-sm mt-2 max-w-xs mx-auto">Be the first to post about {activeGame.title}!</p>
                                                        <Button 
                                                            onClick={() => setShowCreateForm(true)}
                                                            className="mt-6 bg-cyan-600 hover:bg-cyan-500 rounded-full px-8"
                                                        >
                                                            Create Post
                                                        </Button>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Right Column: Community Posts / Hot Topics Results (3/12) */}
                            <div className="hidden lg:flex col-span-3 flex-col gap-6 pl-4 border-l border-white/5 pt-[7.75rem]">
                                <h2 className="text-sm font-bold text-white/40 tracking-wide uppercase px-2">
                                    {hotFilter !== 'none' ? `${hotFilter.replace('_', ' ')}` : 'Community Activity'}
                                </h2>
                                
                                <div className="flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-12rem)] custom-scrollbar pr-2">
                                    {loadingRight ? (
                                        [1, 2, 3].map(i => (
                                            <div key={i} className="h-20 bg-white/5 rounded-lg animate-pulse" />
                                        ))
                                    ) : rightPosts.length > 0 ? (
                                        rightPosts.map(post => (
                                            <div 
                                                key={post.id}
                                                onClick={() => setSelectedPost(post)}
                                                className="bg-white/5 hover:bg-white/10 p-3 rounded-lg cursor-pointer transition-colors border border-white/5 hover:border-white/10 group"
                                            >
                                                <h4 className="text-sm font-bold text-white mb-1 line-clamp-2 group-hover:text-cyan-400 transition-colors">
                                                    {post.title}
                                                </h4>
                                                <div className="flex items-center gap-3 text-[10px] text-white/40">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-3 h-3" />
                                                        {post.created_by?.split('@')[0] || 'User'}
                                                    </span>
                                                    {post.score > 0 && (
                                                        <span className="flex items-center gap-1 text-green-400">
                                                            <Trophy className="w-3 h-3" />
                                                            {post.score}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 text-white/20 text-xs">
                                            Select a topic from the left sidebar to view posts here.
                                        </div>
                                    )}
                                </div>

                                {/* Activity / Stats - Minimal (Moved to bottom) */}
                                <div className="mt-auto px-2">
                                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                        <Target className="w-4 h-4 text-purple-400" />
                                        Forum Activity
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 rounded-lg p-3 text-center">
                                            <div className="text-2xl font-bold text-white">{posts.length}</div>
                                            <div className="text-[10px] uppercase tracking-wider text-white/40">Posts</div>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-3 text-center">
                                            <div className="text-2xl font-bold text-white">{comments.length}</div>
                                            <div className="text-[10px] uppercase tracking-wider text-white/40">Replies</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showCreateForm && (
                    <PostComposer
                        isOpen={showCreateForm}
                        onSubmit={handleCreatePost}
                        onCancel={() => useStateShowCreateForm(false)}
                        initialType={activeGame ? 'game_discussion' : 'general_discussion'}
                        initialGameTitle={activeGame ? activeGame.title : ''}
                        initialGameGenre={activeGame ? activeGame.genre : ''}
                    />
                )}
            </AnimatePresence>
        </div>
        </GlassPageFrame>
        </PageErrorBoundary>
    );
}