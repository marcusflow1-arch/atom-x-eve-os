import React, { useEffect, useMemo, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowUp, ArrowDown, MessageSquare } from "lucide-react";
import CommentSection from "../components/community/CommentSection";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PostDetail() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("id");

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const postRes = await base44.entities.Post.filter({ id: postId });
      setPost(Array.isArray(postRes) ? postRes[0] : postRes?.data?.[0] || postRes);
      const cmts = await base44.entities.Comment.filter({ target_id: postId, target_type: "post" }, "-created_date", 200);
      setComments(cmts || []);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  const handleVotePost = async (type) => {
    if (!post) return;
    const newScore = (post.score || 0) + (type === "up" ? 1 : -1);
    await base44.entities.Post.update(post.id, { score: newScore });
    setPost((p) => ({ ...p, score: newScore }));
  };

  const nestedComments = useMemo(() => {
    const byParent = new Map();
    (comments || []).forEach((c) => {
      const parent = c.parent_comment_id || null;
      if (!byParent.has(parent)) byParent.set(parent, []);
      byParent.get(parent).push(c);
    });
    return byParent;
  }, [comments]);

  const topLevel = useMemo(() => nestedComments.get(null) || [], [nestedComments]);

  return (
    <div className="min-h-screen text-white p-6 pt-28" style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}>
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" className="mb-6 text-white/70 hover:text-white" onClick={() => navigate(createPageUrl('Community'))}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Community
        </Button>

        {loading ? (
          <div className="h-40 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
        ) : post ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center text-white/70 mr-2">
                <button onClick={() => handleVotePost('up')} className="p-1.5 rounded hover:bg-white/10"><ArrowUp className="w-5 h-5" /></button>
                <div className="font-bold text-lg">{post.score || 0}</div>
                <button onClick={() => handleVotePost('down')} className="p-1.5 rounded hover:bg-white/10"><ArrowDown className="w-5 h-5" /></button>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {post.type && <Badge className="bg-white/10 border-white/20">{post.type}</Badge>}
                  {post.game_title && <Badge className="bg-cyan-500/20 border-cyan-500/30 text-cyan-200">{post.game_title}</Badge>}
                </div>
                <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
                {post.image_url && (
                  <img src={post.image_url} alt="" className="rounded-xl border border-white/10 mb-4 max-h-96 object-cover w-full" />
                )}
                <div className="prose prose-invert max-w-none text-white/80 whitespace-pre-wrap">
                  {post.content}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-white/60">Post not found.</div>
        )}

        <div className="mt-10">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-cyan-400" />Comments ({comments.length})</h3>
          <CommentSection
            postId={postId}
            comments={topLevel}
            onAddComment={async (payload) => {
              await base44.entities.Comment.create({ ...payload, target_id: postId, target_type: 'post' });
              await load();
            }}
            onVote={async (comment, type) => {
              const newScore = (comment.score || 0) + (type === 'up' ? 1 : -1);
              await base44.entities.Comment.update(comment.id, { score: newScore });
              setComments((prev) => prev.map(c => c.id === comment.id ? { ...c, score: newScore } : c));
            }}
            getReplies={(parentId) => (nestedComments.get(parentId) || [])}
          />
        </div>
      </div>
    </div>
  );
}