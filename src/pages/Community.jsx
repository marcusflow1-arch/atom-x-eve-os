import React, { useState, useEffect, useCallback } from 'react';
import { Post } from '@/entities/Post';
import { Comment } from '@/entities/Comment';
import CreatePostForm from '../components/community/CreatePostForm';
import PostCard from '../components/community/PostCard';
import FeedPost from '../components/community/FeedPost';
import CommentSection from '../components/community/CommentSection';
import ForumSidebar from '../components/community/ForumSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ArrowLeft, Search, Filter, Clock, Flame, Newspaper, LayoutList, Globe, Gamepad2, Trophy, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../components/auth/AuthContext';
import { base44 } from '@/api/base44Client';

export default function CommunityPage() {
    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    
    // Navigation State
    const [activeSection, setActiveSection] = useState('general_discussion'); // general_discussion, achievement_discussion, game_forums
    const [activeGame, setActiveGame] = useState(null); // If specific game selected
    
    // Filter State
    const [sortBy, setSortBy] = useState('newest'); // newest, popular
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('all');
    const [trendingTopics, setTrendingTopics] = useState([]);

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
            let sort = '-created_date'; // Default new

            if (sortBy === 'popular') sort = '-score';

            // Section Logic
            if (activeGame) {
                filter.game_title = activeGame;
            } else if (activeSection === 'general_discussion') {
                filter.type = 'general_discussion';
            } else if (activeSection === 'achievement_discussion') {
                filter.type = 'achievement_discussion';
            } else if (activeSection === 'feed') {
                // For feed, we might want almost everything or just achievements/challenges
                // Let's assume feed shows everything for now, sorted by new
                filter = {}; 
            }

            // Genre Filter (if implemented in backend or client side)
            // Since our backend filter is simple key-value, we'll handle genre/search client side if needed
            // but ideally we filter by what we can.

            const fetchedPosts = await Post.filter(filter, sort);
            
            // Client-side filtering for advanced cases (Search, Genre)
            let filtered = fetchedPosts;

            if (searchQuery) {
                const lowerQ = searchQuery.toLowerCase();
                filtered = filtered.filter(p => 
                    p.title?.toLowerCase().includes(lowerQ) || 
                    p.content?.toLowerCase().includes(lowerQ)
                );
            }

            if (selectedGenre !== 'all' && !activeGame) {
                // Assuming posts have genre field we added
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
        
        // AI Moderation Check
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
        setActiveGame(null); // Reset game selection when switching main sections
        setSelectedPost(null);
    };

    const handleGameChange = (gameTitle) => {
        setActiveGame(gameTitle);
        setActiveSection('game_forums'); // Switch context to game forums
        setSelectedPost(null);
    };

    return (
        <div className="bg-slate-950 min-h-screen text-slate-200 page-container">
            <div className="max-w-[1600px] mx-auto p-4 md:p-6">
                
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                            <LayoutList className="w-8 h-8 text-blue-500" />
                            COMMUNITY HUB
                        </h1>
                        <p className="text-slate-400">Connect, discuss, and discover with fellow players</p>
                    </div>
                    <Button
                        onClick={() => setShowCreateForm(true)}
                        className="bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 font-bold"
                    >
                        <Plus className="w-5 h-5 mr-2" /> New Discussion
                    </Button>
                </header>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Navigation */}
                    <ForumSidebar 
                        activeSection={activeSection} 
                        onSectionChange={handleSectionChange}
                        activeGame={activeGame}
                        onGameChange={handleGameChange}
                    />

                    {/* Main Content Area */}
                    <main className="flex-1 min-w-0">
                        <AnimatePresence mode="wait">
                            {selectedPost ? (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden"
                                >
                                    <div className="p-4 border-b border-slate-800 flex items-center gap-4 sticky top-0 bg-slate-900/95 backdrop-blur z-10">
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedPost(null)}>
                                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Feed
                                        </Button>
                                        <div className="h-4 w-px bg-slate-700" />
                                        <span className="text-sm text-slate-400 font-medium truncate max-w-[300px]">
                                            {selectedPost.title}
                                        </span>
                                    </div>
                                    <div className="p-6">
                                        <PostCard post={selectedPost} onVote={handleVote} isDetailView={true} />
                                        <div className="mt-8">
                                            <CommentSection
                                                postId={selectedPost.id}
                                                comments={comments}
                                                onAddComment={async (data) => {
                                                    await Comment.create(data);
                                                    fetchComments(selectedPost.id);
                                                }}
                                                onVote={async (c, type) => {
                                                    // Mock implementation
                                                    fetchComments(selectedPost.id);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-6"
                                >
                                    {/* Feed Header / Filters */}
                                    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                            <div className="bg-slate-800 p-2 rounded-lg">
                                                {activeGame ? (
                                                    <Gamepad2 className="w-5 h-5 text-indigo-400" />
                                                ) : activeSection === 'achievement_discussion' ? (
                                                    <Trophy className="w-5 h-5 text-yellow-400" />
                                                ) : (
                                                    <Globe className="w-5 h-5 text-blue-400" />
                                                )}
                                            </div>
                                            <div>
                                                <h2 className="font-bold text-white">
                                                    {activeGame || (activeSection === 'achievement_discussion' ? 'Achievement Hunters' : 'General Lounge')}
                                                </h2>
                                                <p className="text-xs text-slate-400">
                                                    {posts.length} discussions active
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                            <div className="relative flex-1 md:w-64">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <Input 
                                                    placeholder="Search discussions..." 
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="pl-9 bg-slate-950/50 border-slate-800 h-10"
                                                />
                                            </div>
                                            <Select value={sortBy} onValueChange={setSortBy}>
                                                <SelectTrigger className="w-[140px] bg-slate-950/50 border-slate-800 h-10">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="newest">
                                                        <div className="flex items-center gap-2"><Clock className="w-3 h-3" /> Newest</div>
                                                    </SelectItem>
                                                    <SelectItem value="popular">
                                                        <div className="flex items-center gap-2"><Flame className="w-3 h-3" /> Popular</div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Posts List */}
                                    <div className="space-y-4 min-h-[400px]">
                                        {/* Trending Topics Bar */}
                                        {trendingTopics.length > 0 && (
                                            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                                                {trendingTopics.map((trend, i) => (
                                                    <div key={i} className="flex items-center gap-1 px-3 py-1 bg-slate-800 rounded-full text-xs text-blue-300 whitespace-nowrap">
                                                        <Activity className="w-3 h-3" /> {trend}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {loading ? (
                                            <div className="space-y-4">
                                                {[1,2,3].map(i => (
                                                    <div key={i} className="h-40 bg-slate-900/30 rounded-xl animate-pulse" />
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
                                            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-900/20 rounded-xl border border-slate-800 border-dashed">
                                                <Newspaper className="w-16 h-16 text-slate-700 mb-4" />
                                                <h3 className="text-xl font-bold text-slate-400">No discussions found</h3>
                                                <p className="text-slate-500 max-w-md mt-2 mb-6">
                                                    Be the first to start a conversation in this section!
                                                </p>
                                                <Button onClick={() => setShowCreateForm(true)} variant="outline">
                                                    Start Discussion
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </main>
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
        </div>
    );
}