import React, { useState, useEffect, useCallback } from 'react';
import { Post } from '@/entities/Post';
import { Comment } from '@/entities/Comment';
import CreatePostForm from '../components/community/CreatePostForm';
import PostCard from '../components/community/PostCard';
import CommentSection from '../components/community/CommentSection';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, Star, MessageSquare, Globe, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../components/auth/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const tabs = [
    { id: 'game_review', label: 'Game Reviews', icon: Star },
    { id: 'game_discussion', label: 'Game Discussion', icon: MessageSquare },
    { id: 'general_discussion', label: 'General Discussion', icon: Globe },
];

export default function CommunityPage() {
    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [activeTab, setActiveTab] = useState('game_review');

    const { isAuthenticated } = useAuth();

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        const fetchedPosts = await Post.filter({ type: activeTab }, '-score');
        setPosts(fetchedPosts);
        setLoading(false);
    }, [activeTab]);

    const fetchComments = useCallback(async (postId) => {
        if (!postId) return;
        const fetchedComments = await Comment.filter({ post_id: postId }, '-score');
        setComments(fetchedComments);
    }, []);

    // Initial fetch and real-time polling
    useEffect(() => {
        if (!selectedPost) {
            fetchPosts();
        } else {
            fetchComments(selectedPost.id);
        }

        const intervalId = setInterval(() => {
            if (!selectedPost && !showCreateForm) {
                fetchPosts();
            }
        }, 15000); // Poll for new posts every 15 seconds

        return () => clearInterval(intervalId);
    }, [selectedPost, fetchPosts, fetchComments, showCreateForm]);

    const handleCreatePost = async (postData) => {
        if (!isAuthenticated) {
            alert('Please sign in to create posts');
            return;
        }
        await Post.create(postData);
        setShowCreateForm(false);
        fetchPosts(); // Refetch immediately after posting
    };

    const handleVote = async (post, voteType) => {
        if (!isAuthenticated) {
            alert('Please sign in to vote');
            return;
        }
        const newScore = post.score + (voteType === 'up' ? 1 : -1);
        await Post.update(post.id, { score: newScore });
        // Optimistic update
        setPosts(prevPosts => prevPosts.map(p => p.id === post.id ? {...p, score: newScore} : p));
    };

    const handleCommentVote = async (comment, voteType) => {
        const newScore = comment.score + (voteType === 'up' ? 1 : -1);
        await Comment.update(comment.id, { score: newScore });
        fetchComments(selectedPost.id); // Refetch comments
    };

    const handleAddComment = async (commentData) => {
        await Comment.create(commentData);
        fetchComments(selectedPost.id); // Refetch comments
    };

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setSelectedPost(null); // Go back to feed view when changing tabs
    };

    return (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-black min-h-screen text-slate-200 p-6 page-container">
            <style>{`
                /* Community specific scrollable areas */
                .community-posts,
                .comment-section,
                .post-detail {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }

                .community-posts::-webkit-scrollbar,
                .comment-section::-webkit-scrollbar,
                .post-detail::-webkit-scrollbar {
                    display: none;
                }
            `}</style>

            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        {selectedPost && (
                            <Button variant="ghost" size="icon" onClick={() => setSelectedPost(null)}>
                                <ArrowLeft />
                            </Button>
                        )}
                        <h1 className="text-4xl font-extrabold tracking-tight text-white">
                            {selectedPost ? selectedPost.title : 'Community Hub'}
                        </h1>
                    </div>
                    <Button
                        onClick={() => {
                            if (!isAuthenticated) {
                                alert('Please sign in to create posts');
                                return;
                            }
                            setShowCreateForm(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        {isAuthenticated ? 'Create Post' : 'Sign In to Post'}
                    </Button>
                </header>

                {!isAuthenticated && (
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
                        <p className="text-blue-300 text-center">
                            Sign in to create posts, vote, and participate in discussions
                        </p>
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="flex border-b border-slate-700 mb-8">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors relative ${
                                    activeTab === tab.id
                                        ? 'text-blue-400'
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                                {activeTab === tab.id && (
                                    <motion.div
                                        className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-400"
                                        layoutId="underline"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Posts container with hidden scrollbar */}
                <div className="community-posts max-h-screen overflow-y-auto">
                    <AnimatePresence>
                        {showCreateForm && (
                            <CreatePostForm
                                onSubmit={handleCreatePost}
                                onCancel={() => setShowCreateForm(false)}
                                initialType={activeTab}
                            />
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedPost ? `post-${selectedPost.id}` : `feed-${activeTab}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {selectedPost ? (
                                <div className="post-detail space-y-4">
                                    <PostCard post={selectedPost} onVote={handleVote} isDetailView={true} />
                                    <CommentSection
                                        postId={selectedPost.id}
                                        comments={comments}
                                        onAddComment={handleAddComment}
                                        onVote={handleCommentVote}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {loading ? (
                                        <p className="text-center text-slate-400 py-8">Loading posts...</p>
                                    ) : posts.length > 0 ? (
                                        posts.map(post => (
                                            <PostCard
                                                key={post.id}
                                                post={post}
                                                onVote={handleVote}
                                                onSelect={() => setSelectedPost(post)}
                                            />
                                        ))
                                    ) : (
                                        <div className="text-center py-16 bg-slate-800/30 rounded-lg">
                                            <h3 className="text-xl font-semibold text-white">No Posts Yet</h3>
                                            <p className="text-slate-400 mt-2">Be the first to create a post in this section!</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}