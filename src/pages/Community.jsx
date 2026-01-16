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
import { Plus, ArrowLeft, Search, Mic, Bell, User, MessageSquare, TrendingUp, Users, Gamepad2, Swords, Shield, Trophy, Target, Sparkles, Bot, Radio, Star, X, Image as ImageIcon, Link as LinkIcon, Hash, Send, Layers, ScrollText, ChevronRight } from 'lucide-react';
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
    const [recentlyVisited, setRecentlyVisited] = useState([]); // Mock history
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
                            
                            {/* Left Column: Recently Visited Topics (25%) */}
                            <div className="col-span-3 flex flex-col gap-6">
                                <div className="flex items-center px-2">
                                    <h2 className="text-sm font-bold text-white/80 tracking-wide uppercase">Recently Visited</h2>
                                </div>
                                <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                                    {/* Mock Recently Visited - using posts for now as "topics" */}
                                    {(posts.slice(0, 5).length > 0 ? posts.slice(0, 5) : [
                                        { id: 'm1', user: { full_name: 'GamerQueen22', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' }, title: 'Best RPGs of 2026?', created_date: new Date().toISOString(), topic: 'RPG' },
                                        { id: 'm2', user: { full_name: 'NeonRider', avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' }, title: 'Hidden gems in the store', created_date: new Date(Date.now() - 3600000).toISOString(), topic: 'Store' },
                                        { id: 'm3', user: { full_name: 'PixelMaster', avatar_url: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150' }, title: 'Tournament highlights', created_date: new Date(Date.now() - 7200000).toISOString(), topic: 'Esports' }
                                    ]).map((post, idx) => (
                                        <LiquidGlassCard 
                                            key={post.id || idx} 
                                            className="p-4 flex gap-3 items-center group cursor-pointer bg-white/5 hover:bg-white/10" 
                                            hover={true}
                                            onClick={() => {
                                                setSelectedPost(post);
                                                setActiveTab('discussions'); // Navigate to discussion
                                            }}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 text-white">
                                                 <Hash className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-white text-sm font-bold truncate">{post.title}</h4>
                                                <p className="text-white/40 text-xs mt-0.5 truncate">
                                                    Visited {new Date(post.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <ArrowLeft className="w-4 h-4 text-white/20 group-hover:text-white rotate-180 transition-colors" />
                                        </LiquidGlassCard>
                                    ))}
                                </div>
                            </div>

                            {/* Center Column: Trending Topics (50%) */}
                            <div className="col-span-6 flex flex-col gap-6">
                                <div className="flex items-center justify-center px-2">
                                    <h2 className="text-sm font-bold text-white/80 tracking-wide uppercase">Trending Topics</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-4 h-[calc(100vh-16rem)] overflow-y-auto custom-scrollbar">
                                    {[
                                        { title: 'Esports Futures', posts: '1.2K Posts', icon: Swords, color: 'from-blue-500 to-cyan-400', glow: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]' },
                                        { title: 'Indie Gems', posts: '850 Posts', icon: Gamepad2, color: 'from-purple-500 to-indigo-500', glow: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]' },
                                        { title: 'Strategy Meta', posts: '2.1K Posts', icon: TrendingUp, color: 'from-emerald-400 to-teal-500', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]' },
                                        { title: 'Hardware Talk', posts: '540 Posts', icon: Bot, color: 'from-orange-400 to-red-500', glow: 'shadow-[0_0_30px_rgba(249,115,22,0.3)]' },
                                        { title: 'Game Development', posts: '320 Posts', icon: Layers, color: 'from-pink-500 to-rose-500', glow: 'shadow-[0_0_30px_rgba(244,63,94,0.3)]' },
                                        { title: 'Lore & Story', posts: '1.5K Posts', icon: ScrollText, color: 'from-amber-400 to-yellow-500', glow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]' }
                                    ].map((topic, i) => (
                                        <LiquidGlassCard 
                                            key={i} 
                                            className="relative p-6 flex flex-col items-center justify-center text-center group overflow-hidden aspect-square cursor-pointer"
                                            hover={true}
                                            onClick={() => {
                                                // Navigate to discussions for this topic
                                                setActiveSection(topic.title.toLowerCase().replace(' ', '_'));
                                                setActiveTab('discussions');
                                            }}
                                        >
                                            {/* Glow Effect */}
                                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-br ${topic.color}`} />
                                            
                                            <div className={`
                                                mb-4 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3
                                                w-16 h-16
                                                bg-gradient-to-br ${topic.color} ${topic.glow}
                                            `}>
                                                <topic.icon className="w-8 h-8 text-white" strokeWidth={1.5} />
                                            </div>
                                            
                                            <h3 className="font-bold text-white mb-1 text-lg">
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

                            {/* Right Column: Game Forums (25%) */}
                            <div className="col-span-3 flex flex-col gap-6">
                                <div className="flex items-center justify-between px-2">
                                    <h2 className="text-sm font-bold text-white/80 tracking-wide uppercase">Game Forums</h2>
                                </div>
                                <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
                                    {[
                                        { title: 'Astroforge', genre: 'Sci-Fi Adventure', posts: '12K', active: '1.2K' },
                                        { title: 'Neon Rivals', genre: 'Cyberpunk Action', posts: '8.5K', active: '900' },
                                        { title: 'Ethereal', genre: 'Puzzle Platformer', posts: '3.2K', active: '450' },
                                        { title: 'Cyberpunk 2088', genre: 'RPG', posts: '45K', active: '5.6K' },
                                        { title: 'Shadow Protocol', genre: 'Stealth', posts: '2.1K', active: '120' }
                                    ].map((game, i) => (
                                        <div 
                                            key={i} 
                                            className="group flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all cursor-pointer"
                                            onClick={() => {
                                                setActiveGame(game.title);
                                                setActiveTab('discussions');
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {game.title.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-bold text-sm group-hover:text-cyan-400 transition-colors">{game.title}</h3>
                                                    <p className="text-white/30 text-[10px]">{game.genre} • {game.active} online</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
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

                    {/* Center Column: Revamped Posts Feed (60%) */}
                    <div className="col-span-8 flex flex-col gap-6 h-full overflow-hidden">
                        
                        {/* Feed Header & Create Post */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="text-sm font-bold text-white/80 tracking-wide">
                                    {activeGame ? `FORUM: ${activeGame.toUpperCase()}` : 'COMMUNITY FEED'}
                                </h2>
                                <div className="flex items-center gap-3">
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
                            </div>

                            {/* "What's on your mind?" Input Box */}
                            <LiquidGlassCard className="p-4 flex gap-4 items-center" hover={false}>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                                    <User className="w-5 h-5" />
                                </div>
                                <button 
                                    onClick={() => setShowCreateForm(true)}
                                    className="flex-1 text-left bg-white/5 hover:bg-white/10 rounded-full px-6 py-3 text-white/50 text-sm transition-all"
                                >
                                    Start a discussion about {activeGame || 'anything'}...
                                </button>
                                <Button 
                                    onClick={() => setShowCreateForm(true)}
                                    size="icon" 
                                    className="rounded-full bg-blue-600 hover:bg-blue-500"
                                >
                                    <Plus className="w-5 h-5" />
                                </Button>
                            </LiquidGlassCard>
                        </div>

                        {/* Feed Content */}
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
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
                                            className="mb-6 hover:bg-white/10 -ml-2"
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
                                        className="space-y-4 pb-20"
                                    >
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
                                            <div className="flex flex-col items-center justify-center py-32 text-center bg-white/5 rounded-3xl border border-white/5 border-dashed">
                                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                                    <MessageSquare className="w-8 h-8 text-white/20" />
                                                </div>
                                                <h3 className="text-xl font-bold text-white/60">No discussions yet</h3>
                                                <p className="text-white/40 text-sm mt-2 max-w-xs mx-auto">Be the first to start a conversation in this community!</p>
                                                <Button 
                                                    onClick={() => setShowCreateForm(true)}
                                                    className="mt-6 bg-blue-600 hover:bg-blue-500 rounded-full px-8"
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