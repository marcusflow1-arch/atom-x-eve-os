import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';
import FarmCardBrowser from './FarmCardBrowser';
import FarmCardDetail from './FarmCardDetail';
import CommentSection from '@/components/community/CommentSection';
import { Button } from '@/components/ui/button';

export default function FarmTopicContent({ topic, gameId, gameTitle, isOwned, onJoinRoomRequest, intent }) {
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const refreshKey = searchParams.get('refresh');
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);

  const farmCommunity = topic || 'achievements';

  const { data: posts = [], refetch: refetchPosts } = useQuery({
    queryKey: ['farm-hub-posts', gameTitle, farmCommunity, refreshKey],
    queryFn: () => base44.entities.Post.filter({ game_title: gameTitle, community: farmCommunity, is_farm_hub: true }, '-created_date', 100),
    initialData: [],
  });

  const sortedComments = useMemo(() => [...comments].sort((a, b) => Number(b.score || 0) - Number(a.score || 0)), [comments]);

  useEffect(() => {
    if (selectedPost && !posts.find((post) => post.id === selectedPost.id)) {
      setSelectedPost(null);
      setComments([]);
    }
  }, [posts, selectedPost]);

  const fetchComments = async (postId) => {
    const nextComments = await base44.entities.Comment.filter({ target_id: postId, target_type: 'post' }, '-created_date', 100);
    setComments(nextComments || []);
  };

  useEffect(() => {
    if (selectedPost?.id) {
      fetchComments(selectedPost.id);
    } else {
      setComments([]);
    }
  }, [selectedPost?.id]);

  const handlePostVote = async (post, voteType) => {
    if (!isAuthenticated) return;
    const currentScore = Number(post.score || 0);
    const newScore = currentScore + (voteType === 'up' ? 1 : -1);
    await base44.entities.Post.update(post.id, { score: newScore });
    await refetchPosts();
    if (selectedPost?.id === post.id) {
      setSelectedPost({ ...post, score: newScore });
    }
  };

  const handleCommentVote = async (comment, voteType) => {
    if (!isAuthenticated) return;
    const currentScore = Number(comment.score || 0);
    const newScore = currentScore + (voteType === 'up' ? 1 : -1);
    await base44.entities.Comment.update(comment.id, { score: newScore });
    setComments((prev) => prev.map((item) => item.id === comment.id ? { ...item, score: newScore } : item));
  };

  const handleAddComment = async (data) => {
    if (!isAuthenticated || !selectedPost?.id) return;
    await base44.entities.Comment.create(data);
    await fetchComments(selectedPost.id);
  };

  const handleBumpComment = async (comment) => {
    if (!isAuthenticated) return;
    const bumpedScore = Number(comment.score || 0) + 1;
    await base44.entities.Comment.update(comment.id, { score: bumpedScore });
    setComments((prev) => prev.map((item) => item.id === comment.id ? { ...item, score: bumpedScore } : item));
  };

  const selectedPostComments = selectedPost ? sortedComments.map((comment) => ({ ...comment, score: Number(comment.score || 0) })) : [];

  return (
    <div className="h-full flex">
      <div className="w-[280px] flex-shrink-0 flex flex-col h-full" style={{
        borderRight: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(15, 20, 25, 0.3)',
      }}>
        <div className="px-3 pt-3 pb-2 flex-shrink-0">
          <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Achievement Cards</h3>
        </div>
        <div className="flex-1 overflow-hidden">
          <FarmCardBrowser
            gameTitle={gameTitle}
            selectedCard={selectedCard}
            onSelectCard={setSelectedCard}
          />
        </div>
      </div>

      <div className="flex-1 h-full overflow-hidden">
        <div className="grid h-full grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 overflow-hidden border-r border-white/5">
            <FarmCardDetail card={selectedCard} activeTopic={topic} gameTitle={gameTitle} />
          </div>

          <div className="h-full overflow-hidden bg-white/[0.02]">
            <div className="h-full flex flex-col">
              <div className="px-4 pt-4 pb-3 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider">Farm Hub</h3>
                  <p className="text-[10px] text-white/30 mt-1">{posts.length} post{posts.length === 1 ? '' : 's'} in {farmCommunity}</p>
                </div>
                <MessageSquare className="w-4 h-4 text-cyan-400" />
              </div>

              {!selectedPost ? (
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {posts.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center px-6">
                      <div>
                        <MessageSquare className="w-10 h-10 text-white/20 mx-auto mb-3" />
                        <p className="text-sm font-semibold text-white/50">No posts yet</p>
                        <p className="text-xs text-white/25 mt-1">Create the first post for this Farm Hub topic.</p>
                      </div>
                    </div>
                  ) : (
                    posts.map((post) => (
                      <button
                        key={post.id}
                        onClick={() => setSelectedPost(post)}
                        className="w-full text-left rounded-2xl border p-4 transition-all bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center gap-1 pt-0.5">
                            <button onClick={(e) => { e.stopPropagation(); handlePostVote(post, 'up'); }} className="p-1 rounded-lg text-white/40 hover:text-green-400 hover:bg-green-500/10">
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-bold text-white">{post.score || 0}</span>
                            <button onClick={(e) => { e.stopPropagation(); handlePostVote(post, 'down'); }} className="p-1 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10">
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-white line-clamp-2">{post.title}</h4>
                            <p className="text-xs text-white/40 mt-1 line-clamp-3">{post.content}</p>
                            <div className="flex items-center gap-3 mt-3 text-[10px] text-white/30">
                              <span>{post.created_by?.split('@')[0] || 'Anonymous'}</span>
                              <span>•</span>
                              <span>{new Date(post.created_date || Date.now()).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <button onClick={() => setSelectedPost(null)} className="text-[11px] font-semibold text-cyan-300 hover:text-cyan-200">← Back to posts</button>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handlePostVote(selectedPost, 'up')} className="px-3 py-1.5 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-semibold">Like</button>
                      <button onClick={() => handlePostVote(selectedPost, 'down')} className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold">Dislike</button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold mb-2">{farmCommunity}</p>
                    <h2 className="text-lg font-bold text-white leading-tight">{selectedPost.title}</h2>
                    <p className="text-xs text-white/35 mt-2">Posted by {selectedPost.created_by?.split('@')[0] || 'Anonymous'}</p>
                    <div className="text-sm text-white/75 leading-6 whitespace-pre-wrap mt-4">{selectedPost.content}</div>
                  </div>

                  <CommentSection
                    postId={selectedPost.id}
                    comments={selectedPostComments}
                    onAddComment={handleAddComment}
                    onVote={handleCommentVote}
                  />

                  {selectedPostComments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white/35">Bump comments</h4>
                      <div className="space-y-2">
                        {selectedPostComments.map((comment) => (
                          <div key={comment.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
                            <div className="min-w-0">
                              <p className="text-xs text-white/65 truncate">{comment.content}</p>
                              <p className="text-[10px] text-white/30 mt-1">Score {comment.score || 0}</p>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => handleBumpComment(comment)} className="text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/10">
                              <TrendingUp className="w-3.5 h-3.5 mr-1" /> Bump
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}