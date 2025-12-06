import React, { useState, useEffect, useCallback } from 'react';
import { Post } from '@/entities/Post';
import { Comment } from '@/entities/Comment';
import LiquidGlassCard from '@/components/shared/LiquidGlassCard';
import CreatePostForm from '../components/community/CreatePostForm';
import PostCard from '../components/community/PostCard';
import FeedPost from '../components/community/FeedPost';
import CommentSection from '../components/community/CommentSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ArrowLeft, Search, Mic, Bell, User, MessageSquare, TrendingUp, Users, Gamepad2, Swords, Shield, Trophy, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../components/auth/AuthContext';
import { base44 } from '@/api/base44Client';

export default function CommunityPage() {
    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [activeSection, setActiveSection] = useState('general_discussion');
    const [activeGame, setActiveGame] = useState(null);
    const [sortBy, setSortBy] = useState('newest');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('all');
    const [trendingTopics, setTrendingTopics] = useState([]);
    const [activeTab, setActiveTab] = useState('home'); // 'home' or 'discussions'
    const [allGames, setAllGames] = useState([
        'Cyberpunk 2088', 'Astroforge', 'Neon Rivals', 'Shadow Protocol', 
        'Star Conquest', 'Digital Frontiers', 'Elden Ring', 'Minecraft',
        'Baldurs Gate 3', 'Diablo 4', 'Call of Duty', 'Fortnite'
    ]);

    const { isAuthenticated } = useAuth();

    useEffect(() => {
        const fetchTrends = async () => {
            try {
                const res = await base44.functions.invoke('communityAI', { action: 'get_trending_topics' });
                if (res.data?.trends) setTrendingTopics(res.data.trends);
            } catch (e) {
                console.error("Failed to fetch trends", e);
            }
        };
        fetchTrends();
    }, []);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            let filter = {};
            let sort = '-created_date';

            if (sortBy === 'popular') sort = '-score';

            if (activeGame) {
                filter.game_title = activeGame;
            } else if (activeSection === 'general_discussion') {
                filter.type = 'general_discussion';
            } else if (activeSection === 'achievement_discussion') {
                filter.type = 'achievement_discussion';
            } else if (activeSection === 'feed') {
                filter = {}; 
            }

            const fetchedPosts = await Post.filter(filter, sort);
            
            let filtered = fetchedPosts;

            if (searchQuery) {
                const lowerQ = searchQuery.toLowerCase();
                filtered = filtered.filter(p => 
                    p.title?.toLowerCase().includes(lowerQ) || 
                    p.content?.toLowerCase().includes(lowerQ)
                );
            }

            if (selectedGenre !== 'all' && !activeGame) {
                filtered = filtered.filter(p => p.genre === selectedGenre);
            }

            setPosts(filtered);
        } catch (e) {
            console.error("Failed to fetch posts", e);
        } finally {
            setLoading(false);
        }
    }, [activeSection, activeGame, sortBy, searchQuery, selectedGenre]);

    const fetchComments = useCallback(async (postId) => {
        if (!postId) return;
        const fetchedComments = await Comment.filter({ post_id: postId }, '-score');
        setComments(fetchedComments);
    }, []);

    useEffect(() => {
        if (!selectedPost) {
            fetchPosts();
        } else {
            fetchComments(selectedPost.id);
        }
    }, [selectedPost, fetchPosts, fetchComments]);

    const handleCreatePost = async (postData) => {
        if (!isAuthenticated) return;
        
        try {
            const modRes = await base44.functions.invoke('communityAI', {
                action: 'moderate_content',
                data: { text: `${postData.title} ${postData.content}` }
            });
            
            if (!modRes.data.is_safe) {
                alert(`Post rejected: ${modRes.data.reason}`);
                return;
            }
        } catch (e) {
            console.error("Moderation check failed", e);
        }

        await Post.create(postData);
        setShowCreateForm(false);
        fetchPosts();
    };

    const handleVote = async (post, voteType) => {
        if (!isAuthenticated) {
            alert('Please sign in to vote');
            return;
        }
        const newScore = post.score + (voteType === 'up' ? 1 : -1);
        await Post.update(post.id, { score: newScore });
        setPosts(prevPosts => prevPosts.map(p => p.id === post.id ? {...p, score: newScore} : p));
        if (selectedPost?.id === post.id) {
            setSelectedPost(prev => ({...prev, score: newScore}));
        }
    };

    const handleSectionChange = (section) => {
        setActiveSection(section);
        setActiveGame(null);
        setSelectedPost(null);
    };

    return (
        <div 
            className="min-h-screen text-white p-8 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3548 25%, #3d4a5c 50%, #2d3548 75%, #1a1f2e 100%)' }}
        >
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-300/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-[1600px] mx-auto h-[calc(100vh-4rem)] flex flex-col gap-6">
                
                {/* Header Section */}
                <LiquidGlassCard className="px-8 py-4 flex items-center justify-between" hover={false}>
                    {/* Left: Logo/Brand */}
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-wide text-white">COMMUNITY</h1>
                            <span className="text-xs text-cyan-300 tracking-[0.2em] uppercase">Forums</span>
                        </div>
                    </div>

                    {/* Center: Navigation */}
                    <div className="flex items-center gap-8">
                        {[
                            { label: 'AI HOME', value: 'home' },
                            { label: 'DISCUSSIONS', value: 'discussions' }
                        ].map((item) => (
                            <button 
                                key={item.value} 
                                onClick={() => setActiveTab(item.value)}
                                className={`text-sm font-bold tracking-wider transition-all ${
                                    activeTab === item.value 
                                        ? 'text-cyan-300 border-b-2 border-cyan-300 pb-1' 
                                        : 'text-white/60 hover:text-white'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* Right: Search & Profile */}
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Search" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-64 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
                            />
                            <Mic className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 cursor-pointer hover:text-white" />
                        </div>
                        <div className="flex items-center gap-4">
                            <Button 
                                onClick={() => setShowCreateForm(true)}
                                className="bg-blue-600/80 hover:bg-blue-600 border border-blue-400/30 rounded-full px-6"
                            >
                                <Plus className="w-4 h-4 mr-2" /> New Post
                            </Button>
                        </div>
                    </div>
                </LiquidGlassCard>

                {/* Main Content Grid */}
                <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
                    
                    {activeTab === 'home' ? (
                        <>
                            {/* HOME TAB */}
                            {/* Left Column: Recently Discussed (25%) */}
                            <div className="col-span-3 flex flex-col gap-6">
                                <div className="flex items-center justify-between px-2">
                                    <h2 className="text-sm font-bold text-white/80 tracking-wide">RECENTLY DISCUSSED</h2>
                                </div>
                                <LiquidGlassCard className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto" hover={false}>
                                    {posts.slice(0, 6).map((post) => (
                                        <button
                                            key={post.id}
                                            onClick={() => { setActiveTab('discussions'); setSelectedPost(post); }}
                                            className="flex flex-col gap-1 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-left"
                                        >
                                            <p className="text-white text-sm font-semibold truncate">{post.title}</p>
                                            <p className="text-white/40 text-xs truncate">{post.content}</p>
                                            <p className="text-white/30 text-xs mt-1">{new Date(post.created_date).toLocaleDateString()}</p>
                                        </button>
                                    ))}
                                </LiquidGlassCard>
                            </div>

                            {/* Center Column: Trending Discussions (50%) */}
                            <div className="col-span-6 flex flex-col gap-6">
                                <div className="flex items-center justify-center px-2">
                                    <h2 className="text-sm font-bold text-white/80 tracking-wide">TRENDING DISCUSSIONS & TOPICS</h2>
                                </div>
                                <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4">
                                    {posts.slice(0, 4).map((post, idx) => (
                                        <LiquidGlassCard 
                                            key={post.id} 
                                            className="flex flex-col justify-between p-6" 
                                            hover={true}
                                            onClick={() => { setActiveTab('discussions'); setSelectedPost(post); }}
                                        >
                                            <div>
                                                <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">{post.title}</h3>
                                                <p className="text-white/60 text-sm line-clamp-3">{post.content}</p>
                                            </div>
                                            <div className="flex items-center justify-between mt-4">
                                                <span className="text-cyan-300 text-xs font-semibold">{post.type?.replace('_', ' ').toUpperCase()}</span>
                                                <span className="text-white/40 text-xs">{post.score || 0} votes</span>
                                            </div>
                                        </LiquidGlassCard>
                                    ))}
                                </div>
                            </div>

                            {/* Right Column: Recommended Games (25%) */}
                            <div className="col-span-3 flex flex-col gap-6">
                                <div className="flex items-center justify-between px-2">
                                    <h2 className="text-sm font-bold text-white/80 tracking-wide">RECOMMENDED GAMES</h2>
                                </div>
                                <LiquidGlassCard className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto" hover={false}>
                                    {['Cyberpunk 2088', 'Astroforge', 'Neon Rivals', 'Shadow Protocol', 'Star Conquest', 'Digital Frontiers'].map((game, i) => (
                                        <div 
                                            key={i}
                                            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                                <Gamepad2 className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-sm font-semibold truncate">{game}</p>
                                                <p className="text-white/40 text-xs">Recommended</p>
                                            </div>
                                        </div>
                                    ))}
                                </LiquidGlassCard>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* DISCUSSIONS TAB */}
                            {/* Left Column: Games List (20%) */}
                            <div className="col-span-2 flex flex-col gap-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-sm font-bold text-white/80 tracking-wide">GAMES</h2>
                        </div>
                        <LiquidGlassCard className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto" hover={false}>
                            {allGames.map((game, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveGame(game)}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${
                                        activeGame === game
                                            ? 'bg-blue-500/20 border border-blue-400/30 text-white'
                                            : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                                    }`}
                                >
                                    <Gamepad2 className="w-4 h-4" />
                                    <span className="font-medium text-xs truncate">{game}</span>
                                </button>
                            ))}
                        </LiquidGlassCard>
                    </div>

                    {/* Center Column: Posts Feed (60%) */}
                    <div className="col-span-8 flex flex-col gap-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-sm font-bold text-white/80 tracking-wide">
                                {activeSection === 'general_discussion' ? 'GENERAL DISCUSSIONS' : 'POSTS FEED'}
                            </h2>
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white text-xs h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">Newest</SelectItem>
                                    <SelectItem value="popular">Popular</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <LiquidGlassCard className="flex-1 p-4 overflow-y-auto" hover={false}>
                            <AnimatePresence mode="wait">
                                {selectedPost ? (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                    >
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => setSelectedPost(null)}
                                            className="mb-4"
                                        >
                                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                                        </Button>
                                        <PostCard post={selectedPost} onVote={handleVote} isDetailView={true} />
                                        <div className="mt-6">
                                            <CommentSection
                                                postId={selectedPost.id}
                                                comments={comments}
                                                onAddComment={async (data) => {
                                                    await Comment.create(data);
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
                                        className="space-y-3"
                                    >
                                        {loading ? (
                                            <div className="space-y-3">
                                                {[1,2,3,4].map(i => (
                                                    <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />
                                                ))}
                                            </div>
                                        ) : posts.length > 0 ? (
                                            posts.map(post => {
                                                if (post.type === 'achievement_share' || post.type === 'challenge') {
                                                    return (
                                                        <FeedPost 
                                                            key={post.id} 
                                                            post={post} 
                                                            onVote={handleVote} 
                                                            onShare={() => {}}
                                                        />
                                                    );
                                                }
                                                return (
                                                    <PostCard
                                                        key={post.id}
                                                        post={post}
                                                        onVote={handleVote}
                                                        onSelect={() => setSelectedPost(post)}
                                                    />
                                                );
                                            })
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                                <MessageSquare className="w-12 h-12 text-white/20 mb-4" />
                                                <h3 className="text-lg font-bold text-white/60">No discussions yet</h3>
                                                <p className="text-white/40 text-sm mt-2">Be the first to start a conversation!</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </LiquidGlassCard>
                    </div>

                    {/* Right Column: Topics (17.5%) */}
                    <div className="col-span-2 flex flex-col gap-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-sm font-bold text-white/80 tracking-wide">TOPICS</h2>
                        </div>
                        <LiquidGlassCard className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto" hover={false}>
                            {[
                                { icon: Swords, label: 'PvP Discussion', color: 'from-red-500 to-orange-500' },
                                { icon: Shield, label: 'PvE Strategies', color: 'from-blue-500 to-cyan-500' },
                                { icon: Trophy, label: 'Achievements', color: 'from-yellow-500 to-amber-500' },
                                { icon: Target, label: 'Raids & Dungeons', color: 'from-purple-500 to-pink-500' },
                                { icon: Users, label: 'Clans & Guilds', color: 'from-green-500 to-emerald-500' },
                                { icon: Gamepad2, label: 'Game Updates', color: 'from-indigo-500 to-blue-500' },
                                { icon: TrendingUp, label: 'Meta Discussion', color: 'from-cyan-500 to-teal-500' },
                                { icon: MessageSquare, label: 'General Chat', color: 'from-slate-500 to-gray-500' }
                            ].map((topic, idx) => (
                                <button
                                    key={idx}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-left group"
                                >
                                    <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${topic.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                        <topic.icon className="w-3 h-3 text-white" />
                                    </div>
                                    <span className="font-medium text-xs text-white/70 group-hover:text-white truncate">{topic.label}</span>
                                </button>
                            ))}
                        </LiquidGlassCard>
                    </div>
                        </>
                    )}

                </div>
            </div>

            <AnimatePresence>
                {showCreateForm && (
                    <CreatePostForm
                        onSubmit={handleCreatePost}
                        onCancel={() => setShowCreateForm(false)}
                        initialType={activeGame ? 'game_discussion' : 'general_discussion'}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}