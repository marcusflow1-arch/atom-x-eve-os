import React, { useState, useEffect, useCallback } from 'react';
import LiquidGlassCard from '@/components/shared/LiquidGlassCard';
import CreatePostForm from '../components/community/CreatePostForm';
import PostCard from '../components/community/PostCard';
import FeedPost from '../components/community/FeedPost';
import CommentSection from '../components/community/CommentSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowLeft, Search, Mic, Bell, User, MessageSquare, TrendingUp, Users, Gamepad2, Swords, Shield, Trophy, Target, Sparkles, Bot, Radio, Star, X } from 'lucide-react';
import VirtualizedPostList from '../components/community/VirtualizedPostList';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../components/auth/AuthContext';
import { base44 } from '@/api/base44Client';
import { showError, showSuccess } from '@/components/error/ErrorToast';
import PageErrorBoundary from '@/components/error/PageErrorBoundary';

export default function CommunityPage() {
    const navigate = useNavigate();
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

            const fetchedPostsResponse = await base44.entities.Post.filter(filter, sort, 50);
            const fetchedPosts = fetchedPostsResponse.data || fetchedPostsResponse;
            
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
        const fetchedCommentsResponse = await base44.entities.Comment.filter({ post_id: postId }, '-score', 100);
        const fetchedComments = fetchedCommentsResponse.data || fetchedCommentsResponse;
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
                showError(`Post rejected: ${modRes.data.reason}`, 'Moderation');
                return;
            }
        } catch (e) {
            showError(e, 'Moderation');
            return;
        }

        try {
            await base44.entities.Post.create(postData);
            setShowCreateForm(false);
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

    const handleSectionChange = (section) => {
        setActiveSection(section);
        setActiveGame(null);
        setSelectedPost(null);
    };

    return (
        <PageErrorBoundary pageName="Community">
        <div 
            className="min-h-screen text-white p-8 pt-24 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}
        >
            {/* Close Button removed - handled by layout */}

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
                            <h1 className="text-xl font-bold tracking-wide text-white">{activeTab === 'home' ? 'ATOM×EVE' : 'COMMUNITY'}</h1>
                            <span className="text-xs text-cyan-300 tracking-[0.2em] uppercase">{activeTab === 'home' ? 'UPDATE' : 'Forums'}</span>
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
                            {/* HOME TAB - RECONSTRUCTED UI */}
                            
                            {/* Left Column: Recent Discussions (25%) */}
                            <div className="col-span-3 flex flex-col gap-6">
                                <div className="flex items-center px-2">
                                    <h2 className="text-sm font-bold text-white/80 tracking-wide uppercase">Recent Discussions</h2>
                                </div>
                                <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                                    {loading ? (
                                        [1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />)
                                    ) : (
                                        (posts.slice(0, 4).length > 0 ? posts.slice(0, 4) : [
                                            { id: 'm1', user: { full_name: 'GamerQueen22', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' }, title: 'Best RPGs of 2026?', created_date: new Date().toISOString() },
                                            { id: 'm2', user: { full_name: 'NeonRider', avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' }, title: 'Hidden gems in the store', created_date: new Date(Date.now() - 3600000).toISOString() },
                                            { id: 'm3', user: { full_name: 'PixelMaster', avatar_url: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150' }, title: 'Tournament highlights', created_date: new Date(Date.now() - 7200000).toISOString() }
                                        ]).map((post) => (
                                            <LiquidGlassCard 
                                                key={post.id} 
                                                className="p-4 flex gap-3 items-start group cursor-pointer" 
                                                hover={true}
                                                onClick={() => setSelectedPost(post)}
                                            >
                                                <div className="relative">
                                                    <img 
                                                        src={post.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user?.id || 'user'}`} 
                                                        alt="avatar" 
                                                        className="w-10 h-10 rounded-full object-cover border-2 border-white/10"
                                                    />
                                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="text-white text-sm font-bold truncate">{post.user?.full_name || post.user?.username || 'User'}</h4>
                                                        <span className="text-white/30 text-[10px]">
                                                            {new Date(post.created_date).getHours() % 12 || 12} hours ago
                                                        </span>
                                                    </div>
                                                    <p className="text-white/70 text-sm font-medium leading-tight mt-1 line-clamp-2">
                                                        {post.title}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-2 text-white/30">
                                                        <MessageSquare className="w-3 h-3 hover:text-cyan-400" />
                                                        <span className="text-[10px]">12</span>
                                                        <div className="flex-1" />
                                                        <Badge className="bg-white/5 hover:bg-white/10 text-white/50 border-0 text-[10px] h-5 px-2">
                                                            {post.genre || 'General'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </LiquidGlassCard>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Center Column: Trending Topics (50%) */}
                            <div className="col-span-6 flex flex-col gap-6">
                                <div className="flex items-center justify-center px-2">
                                    <h2 className="text-sm font-bold text-white/80 tracking-wide uppercase">Trending Topics</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-4 h-full">
                                    {[
                                        { title: 'Esports Futures', posts: '1.2K Posts', icon: Swords, color: 'from-blue-500 to-cyan-400', glow: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]' },
                                        { title: 'Indie Gems', posts: '850 Posts', icon: Gamepad2, color: 'from-purple-500 to-indigo-500', glow: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]' },
                                        { title: 'Strategy Meta', posts: '2.1K Posts', icon: TrendingUp, color: 'from-emerald-400 to-teal-500', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]' },
                                        { title: 'Hardware Talk', posts: '540 Posts', icon: Bot, color: 'from-orange-400 to-red-500', glow: 'shadow-[0_0_30px_rgba(249,115,22,0.3)]' }
                                    ].map((topic, i) => (
                                        <LiquidGlassCard 
                                            key={i} 
                                            className={`relative p-6 flex flex-col items-center justify-center text-center group overflow-hidden ${i === 0 ? 'row-span-2 aspect-auto' : 'aspect-square'}`}
                                            hover={true}
                                        >
                                            {/* Glow Effect */}
                                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-br ${topic.color}`} />
                                            
                                            <div className={`
                                                mb-4 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3
                                                ${i === 0 ? 'w-24 h-24' : 'w-16 h-16'}
                                                bg-gradient-to-br ${topic.color} ${topic.glow}
                                            `}>
                                                <topic.icon className={`${i === 0 ? 'w-10 h-10' : 'w-7 h-7'} text-white`} strokeWidth={1.5} />
                                            </div>
                                            
                                            <h3 className={`font-bold text-white mb-1 ${i === 0 ? 'text-2xl' : 'text-lg'}`}>
                                                {topic.title}
                                            </h3>
                                            <p className="text-white/50 text-xs font-medium bg-white/10 px-3 py-1 rounded-full">
                                                {topic.posts}
                                            </p>
                                            
                                            {/* Decorative lines */}
                                            <div className="absolute top-0 right-0 p-4 opacity-20">
                                                <div className="w-16 h-16 border-t-2 border-r-2 border-white rounded-tr-3xl" />
                                            </div>
                                            <div className="absolute bottom-0 left-0 p-4 opacity-20">
                                                <div className="w-8 h-8 border-b-2 border-l-2 border-white rounded-bl-xl" />
                                            </div>
                                        </LiquidGlassCard>
                                    ))}
                                </div>
                            </div>

                            {/* Right Column: Game Recommendations (25%) */}
                            <div className="col-span-3 flex flex-col gap-6">
                                <div className="flex items-center justify-between px-2">
                                    <h2 className="text-sm font-bold text-white/80 tracking-wide uppercase">Game Recommendations</h2>
                                </div>
                                <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                                    {[
                                        { title: 'Astroforge', genre: 'Sci-Fi Adventure', image: 'https://images.unsplash.com/photo-1614728853970-300dc0486d13?w=400' },
                                        { title: 'Neon Rivals', genre: 'Cyberpunk Action', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400' },
                                        { title: 'Ethereal', genre: 'Puzzle Platformer', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400' }
                                    ].map((game, i) => (
                                        <div key={i} className="group relative rounded-2xl overflow-hidden aspect-[4/3] cursor-pointer shadow-lg shadow-black/20">
                                            <img 
                                                src={game.image} 
                                                alt={game.title} 
                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                            
                                            <div className="absolute top-3 right-3">
                                                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                </div>
                                            </div>

                                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                                <h3 className="text-white font-bold text-lg mb-1">{game.title}</h3>
                                                <p className="text-white/60 text-xs mb-3">{game.genre}</p>
                                                <Button className="w-full bg-cyan-500/80 hover:bg-cyan-400 text-white border-0 rounded-xl font-bold tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all transform group-hover:translate-y-0 translate-y-2 opacity-90 group-hover:opacity-100">
                                                    PLAY NOW
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
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
                                        className="h-full"
                                    >
                                        {loading ? (
                                            <div className="space-y-3">
                                                {[1,2,3,4].map(i => (
                                                    <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />
                                                ))}
                                            </div>
                                        ) : posts.length > 0 ? (
                                            <VirtualizedPostList
                                              posts={posts}
                                              selectedPost={selectedPost}
                                              onVote={handleVote}
                                              onSelect={setSelectedPost}
                                            />
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
        </PageErrorBoundary>
    );
}