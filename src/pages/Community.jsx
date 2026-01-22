import React, { useState, useEffect, useCallback, useRef } from 'react';
import LiquidGlassCard from '@/components/shared/LiquidGlassCard';
import CreatePostForm from '../components/community/CreatePostForm';
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
    Shield, Sparkles, Car, Skull, Monitor
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../components/auth/AuthContext';
import { base44 } from '@/api/base44Client';
import { showError, showSuccess } from '@/components/error/ErrorToast';
import PageErrorBoundary from '@/components/error/PageErrorBoundary';

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
    { id: 'all', label: 'All Discussions', icon: MessageSquare },
    { id: 'game_review', label: 'Game Reviews', icon: Star },
    { id: 'game_discussion', label: 'Game Discussions', icon: Gamepad2 },
    { id: 'achievement_discussion', label: 'Achievements', icon: Trophy },
    { id: 'challenge', label: 'Challenges', icon: Target },
    { id: 'general_discussion', label: 'General Chat', icon: Users },
];

export default function CommunityPage() {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, useStateShowCreateForm] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [activeSection, setActiveSection] = useState('all'); // Filter for topics
    const [activeGame, setActiveGame] = useState(null); // The game object for which we are viewing forums
    const [sortBy, setSortBy] = useState('newest');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('All Games'); // 'All Games' | 'All Cards' | specific genre
    const [allGames, setAllGames] = useState([]); // All game entities
    const [filteredGames, setFilteredGames] = useState([]); // Games after genre and search filter

    const { isAuthenticated } = useAuth();

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

    // Apply filters to games
    useEffect(() => {
        let currentGames = allGames;

        if (selectedGenre !== 'All Games' && selectedGenre !== 'All Cards') {
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
                // If we are in a game forum, 'all' means all posts for that game
                // Otherwise filter by specific type (review, discussion, etc)
                if (activeSection !== 'all') {
                    filter.type = activeSection;
                }
            } else {
                // Global feed logic if needed, but user wants Game Grid as main view
                // We might only fetch posts if we are in 'All Cards' or some other global view
                // For now, if no activeGame, we don't fetch posts unless specifically asked (maybe for a global feed)
                // But the requirement says "middle section showcase all games", so posts are secondary here.
            }

            // Only fetch if we are inside a game or we want a global feed (optional)
            if (activeGame) {
                const fetchedPosts = await base44.entities.Post.filter(filter, sort, 50);
                let filtered = fetchedPosts;
                
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
            // In production, use the integration
            /*
            const modRes = await base44.integrations.Core.InvokeLLM({ ... });
            if (!modRes.is_safe) { ... }
            */
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
        setActiveGame(game);
        setSelectedPost(null);
        setActiveSection('all');
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
        <div 
            className="min-h-screen text-white p-4 sm:p-8 pt-20 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}
        >
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-300/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-[1600px] mx-auto h-[calc(100vh-6rem)] flex flex-col gap-6">
                
                {/* Header Section - Transparent & Reorganized */}
                <div className="flex flex-col gap-6 px-2">
                    <div className="flex items-center justify-between">
                        {/* Left: Logo/Brand */}
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-wide text-white">{activeGame ? activeGame.title.toUpperCase() : 'COMMUNITY'}</h1>
                                <span className="text-xs text-cyan-300 tracking-[0.2em] uppercase">{activeGame ? 'GAME FORUM' : 'FORUMS'}</span>
                            </div>
                        </div>

                        {/* Right: Actions (Back / Create) */}
                        <div className="flex items-center gap-4">
                            {activeGame && (
                                <>
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => {
                                            setActiveGame(null);
                                            setSelectedPost(null);
                                            setSelectedGenre('All Games');
                                            setActiveSection('all');
                                        }}
                                        className="text-sm font-bold tracking-wider text-white/60 hover:text-white"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                                    </Button>
                                    <Button 
                                        onClick={() => setShowCreateForm(true)}
                                        className="bg-blue-600/80 hover:bg-blue-600 border border-blue-400/30 rounded-full px-6"
                                    >
                                        <Plus className="w-4 h-4 mr-2" /> New Post
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Search Bar - Moved below title, above genres */}
                    <div className="relative w-full max-w-md">
                        <input 
                            type="text" 
                            placeholder={activeGame ? "Search this forum..." : "Search games..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all pl-10"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    </div>
                </div>

                {/* Genre Filter Bar (Only show if NOT in a specific game forum) */}
                {!activeGame && (
                    <div className="flex-shrink-0 flex items-center gap-6 overflow-x-auto pb-2 scrollbar-hide px-2">
                        {/* Static Options */}
                        <motion.button
                            onClick={() => setSelectedGenre('All Games')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex items-center gap-2 py-2 whitespace-nowrap transition-all ${selectedGenre === 'All Games' ? 'text-cyan-400 scale-105 font-black' : 'text-white/60 hover:text-white font-medium'}`}
                        >
                            <Gamepad2 className="w-4 h-4" />
                            <span className="text-sm uppercase tracking-wide">All Games</span>
                        </motion.button>
                        
                        <motion.button
                            onClick={() => setSelectedGenre('All Cards')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex items-center gap-2 py-2 whitespace-nowrap transition-all ${selectedGenre === 'All Cards' ? 'text-cyan-400 scale-105 font-black' : 'text-white/60 hover:text-white font-medium'}`}
                        >
                            <Grid className="w-4 h-4" />
                            <span className="text-sm uppercase tracking-wide">All Cards</span>
                        </motion.button>

                        <div className="w-px h-6 bg-white/10 mx-2" />

                        {/* Scrollable Genres */}
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
                )}

                {/* Main Content Area */}
                <div className="flex-1 min-h-0 grid grid-cols-12 gap-6 overflow-hidden">
                    
                    {/* HUB VIEW: Game Grid */}
                    {!activeGame && (
                        <div className="col-span-12 overflow-y-auto pr-2 custom-scrollbar">
                             {/* Only show games if we are in 'All Games' or a specific genre, or handle 'All Cards' differently */}
                             {selectedGenre === 'All Cards' ? (
                                 <div className="flex flex-col items-center justify-center py-32 text-center bg-white/5 rounded-3xl border border-white/5 border-dashed">
                                    <Grid className="w-16 h-16 text-white/20 mb-4" />
                                    <h3 className="text-xl font-bold text-white/60">Trading Cards Forum</h3>
                                    <p className="text-white/40 text-sm mt-2">Browse discussions about trading cards across all universes.</p>
                                    <Button className="mt-6" variant="outline" disabled>Coming Soon</Button>
                                 </div>
                             ) : (
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
                             )}
                        </div>
                    )}

                    {/* FORUM VIEW: Feed + Sidebar */}
                    {activeGame && (
                        <>
                            {/* Left Column: Feed (9/12) */}
                            <div className="col-span-12 lg:col-span-9 flex flex-col h-full overflow-hidden">
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
                                                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Discussions
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
                                                {/* Sort Bar inside feed */}
                                                <div className="flex items-center justify-between mb-4 px-1">
                                                    <h2 className="text-sm font-bold text-white/60 tracking-wide uppercase">
                                                        {activeSection === 'all' ? 'All Posts' : TOPIC_TYPES.find(t => t.id === activeSection)?.label}
                                                    </h2>
                                                    <Select value={sortBy} onValueChange={setSortBy}>
                                                        <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white text-xs h-8 rounded-full">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="newest">Newest</SelectItem>
                                                            <SelectItem value="popular">Popular</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

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

                            {/* Right Column: Topics Filter (3/12) - Clean Minimal Style */}
                            <div className="hidden lg:flex col-span-3 flex-col gap-6 pl-4 border-l border-white/5">
                                <h2 className="text-sm font-bold text-white/40 tracking-wide uppercase px-2">
                                    Forum Topics
                                </h2>
                                <div className="flex flex-col gap-1">
                                    {TOPIC_TYPES.map((topic) => (
                                        <button
                                            key={topic.id}
                                            onClick={() => {
                                                setActiveSection(topic.id);
                                                setSelectedPost(null);
                                            }}
                                            className={`flex items-center gap-3 px-2 py-3 transition-all text-left group relative ${
                                                activeSection === topic.id 
                                                    ? 'text-cyan-400' 
                                                    : 'text-white/60 hover:text-white'
                                            }`}
                                        >
                                            <topic.icon className={`w-4 h-4 ${activeSection === topic.id ? 'text-cyan-400' : 'text-white/40 group-hover:text-white'}`} />
                                            <span className="font-medium text-sm">{topic.label}</span>
                                            
                                            {/* Underline Effect */}
                                            {activeSection === topic.id && (
                                                <motion.div 
                                                    layoutId="topicUnderline"
                                                    className="absolute bottom-0 left-0 right-0 h-px bg-cyan-400"
                                                />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Activity / Stats - Minimal */}
                                <div className="mt-4 px-2">
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
                    <CreatePostForm
                        onSubmit={handleCreatePost}
                        onCancel={() => useStateShowCreateForm(false)}
                        initialType={activeGame ? 'game_discussion' : 'general_discussion'}
                        initialGameTitle={activeGame ? activeGame.title : ''}
                        initialGameGenre={activeGame ? activeGame.genre : ''}
                    />
                )}
            </AnimatePresence>
        </div>
        </PageErrorBoundary>
    );
}