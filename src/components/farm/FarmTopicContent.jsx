import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, ArrowUp, ArrowDown, TrendingUp, Trophy, Users, UserPlus, AlertCircle, Video } from 'lucide-react';
import FarmCardBrowser from './FarmCardBrowser';
import CommentSection from '@/components/community/CommentSection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

  const popularTopics = [
    { label: 'Guides & Strategies', icon: Trophy, color: 'text-yellow-400' },
    { label: 'Farm Queue', icon: Users, color: 'text-cyan-400' },
    { label: 'Recruitment', icon: UserPlus, color: 'text-green-400' },
    { label: 'Bug Reports', icon: AlertCircle, color: 'text-red-400' },
    { label: 'Media & Content', icon: Video, color: 'text-purple-400' }
  ];

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

      <div className="flex-1 h-full overflow-hidden p-4 flex gap-4">
        <div className="flex-[7] min-w-0 h-full rounded-2xl border border-white/[0.05] bg-[#11161d] overflow-hidden">
          {!selectedPost ? (
            <div className="h-full flex flex-col">
              <div className="px-6 pt-5 pb-4 border-b border-white/[0.05] flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">All Discussions</h2>
                  <p className="text-xs text-white/35 mt-1">Join the conversation and share your strategies</p>
                </div>
                <Button className="bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/25 rounded-full text-xs h-8 px-4">
                  + New Post
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
                  {posts.length === 0 ? (
                    <div className="py-12 text-center">
                      <MessageSquare className="w-10 h-10 text-white/20 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-white/50">No posts yet</p>
                      <p className="text-xs text-white/25 mt-1">Create the first post for this Farm Hub topic.</p>
                    </div>
                  ) : (
                    posts.map((post) => (
                      <button
                        key={post.id}
                        onClick={() => setSelectedPost(post)}
                        className="w-full text-left rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 hover:bg-white/[0.05] transition-all"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-[10px] text-white/35 mb-2 uppercase tracking-wider">
                              <span className="text-cyan-300">Discussion</span>
                              <span>•</span>
                              <span>Posted by {post.created_by?.split('@')[0] || 'Anonymous'}</span>
                              <span>•</span>
                              <span>{new Date(post.created_date || Date.now()).toLocaleDateString()}</span>
                            </div>
                            <h3 className="text-lg font-semibold text-white">{post.title}</h3>
                            <p className="text-sm text-white/55 mt-1 line-clamp-2">{post.content}</p>
                            <div className="flex items-center justify-between gap-3 mt-4 text-[11px] text-white/30">
                              <div className="flex items-center gap-3">
                                <span className="px-2 py-1 rounded-md bg-black/30 border border-white/5">{gameTitle}</span>
                                <span>Comments</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handlePostVote(post, 'up'); }}
                                  className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-white/60 hover:text-green-400 hover:border-green-500/30 hover:bg-green-500/10"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                  <span>{post.score || 0}</span>
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handlePostVote(post, 'down'); }}
                                  className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-white/60 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                  <span>Dislike</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="px-6 pt-5 pb-4 border-b border-white/[0.05] flex items-center justify-between">
                <button onClick={() => setSelectedPost(null)} className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">← Back to discussions</button>
                <div className="flex items-center gap-2">
                  <button onClick={() => handlePostVote(selectedPost, 'up')} className="px-3 py-1.5 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-semibold">Like</button>
                  <button onClick={() => handlePostVote(selectedPost, 'down')} className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold">Dislike</button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-1 pt-0.5 text-white/40">
                      <button onClick={() => handlePostVote(selectedPost, 'up')} className="p-1 rounded-full hover:bg-white/10 hover:text-white/80">
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-bold text-white">{selectedPost.score || 0}</span>
                      <button onClick={() => handlePostVote(selectedPost, 'down')} className="p-1 rounded-full hover:bg-white/10 hover:text-white/80">
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-[10px] text-white/35 mb-2 uppercase tracking-wider">
                        <span className="text-cyan-300">Discussion</span>
                        <span>•</span>
                        <span>Posted by {selectedPost.created_by?.split('@')[0] || 'Anonymous'}</span>
                      </div>
                      <h2 className="text-xl font-bold text-white">{selectedPost.title}</h2>
                      <div className="text-sm text-white/75 leading-6 whitespace-pre-wrap mt-4">{selectedPost.content}</div>
                    </div>
                  </div>
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
            </div>
          )}
        </div>

        <div className="flex-[3] h-full overflow-y-auto space-y-4 pr-1">
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-cyan-400" /> About This Hub
            </h3>
            <p className="text-xs text-white/50 leading-relaxed mb-4">
              Welcome to the Farm Hub for <span className="text-white/80 font-semibold">{gameTitle}</span>. Discuss strategies, find groups, and share your progress with the community.
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 shadow-lg">
            <h3 className="text-sm font-bold text-white mb-4">Popular Topics</h3>
            <div className="space-y-2">
              {popularTopics.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/[0.02] hover:bg-white/[0.05] transition-all group">
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-4 h-4 ${item.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
                    <span className="text-xs font-medium text-white/70 group-hover:text-white transition-colors">{item.label}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-white/10 text-white/40 bg-black/40">{Math.floor(Math.random() * 40) + 1}</Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/[0.05] rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center backdrop-blur-md">
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Top Contributor</h3>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">This Week</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-black/30 p-3 rounded-xl backdrop-blur-md border border-white/5">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-300 ring-2 ring-cyan-500/30">A</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white font-semibold truncate">AtomPlayer99</p>
                <p className="text-[10px] text-cyan-400 font-mono">+450 Rep</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}