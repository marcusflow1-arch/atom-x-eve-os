import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, ArrowDown, CornerUpRight } from 'lucide-react';

const Comment = ({ comment, onVote, onReplyClick, replies = [] }) => (
  <div className="flex gap-3 py-3 border-t border-slate-700">
    <div className="flex flex-col items-center justify-start space-y-1 flex-shrink-0 text-slate-400 pt-1">
      <button onClick={() => onVote(comment, 'up')} className="p-1 rounded-full hover:bg-green-500/20 hover:text-green-400">
        <ArrowUp className="w-4 h-4" />
      </button>
      <span className="font-bold text-white text-sm">{comment.score || 0}</span>
      <button onClick={() => onVote(comment, 'down')} className="p-1 rounded-full hover:bg-red-500/20 hover:text-red-400">
        <ArrowDown className="w-4 h-4" />
      </button>
    </div>
    <div className="flex-1">
      <p className="text-xs text-slate-400 mb-1">
        <span className="font-semibold text-slate-300">{comment.created_by?.split('@')[0] || 'Anonymous'}</span>
      </p>
      <p className="text-slate-200 whitespace-pre-wrap">{comment.content}</p>
      <div className="mt-2">
        <button onClick={() => onReplyClick(comment)} className="text-xs text-white/60 hover:text-white flex items-center gap-1">
          <CornerUpRight className="w-3 h-3" /> Reply
        </button>
      </div>
      {replies.length > 0 && (
        <div className="mt-3 pl-6 border-l border-white/10 space-y-2">
          {replies.map(r => (
            <div key={r.id} className="flex gap-2">
              <div className="flex flex-col items-center justify-start text-slate-400 pt-1">
                <span className="text-[11px]">{r.score || 0}</span>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 mb-0.5"><span className="font-semibold text-slate-300">{r.created_by?.split('@')[0] || 'Anonymous'}</span></p>
                <p className="text-slate-200 whitespace-pre-wrap">{r.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default function CommentSection({ postId, comments, onAddComment, onVote, getReplies }) {
    const [newCommentText, setNewCommentText] = useState('');
    const [replyTo, setReplyTo] = useState(null);

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        if (!newCommentText.trim()) return;
        onAddComment({
            post_id: postId, // legacy
            target_id: postId,
            target_type: 'post',
            content: newCommentText,
            parent_comment_id: replyTo?.id || null,
        });
        setNewCommentText('');
        setReplyTo(null);
    };

    return (
        <div className="bg-slate-800/30 p-4 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-4">Comments</h3>
            <form onSubmit={handleCommentSubmit} className="mb-6">
                <Textarea 
                    placeholder="Add a comment..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="mb-2"
                />
                <Button type="submit" size="sm" disabled={!newCommentText.trim()}>Comment</Button>
            </form>
            {replyTo && (
              <div className="mb-3 text-xs text-white/60">Replying to <span className="text-white">{replyTo.created_by?.split('@')[0] || 'user'}</span> <button className="ml-2 underline" onClick={() => setReplyTo(null)}>cancel</button></div>
            )}
            <div className="space-y-2">
                {comments && comments.length > 0 ? (
                    comments.map(comment => (
                      <Comment 
                        key={comment.id} 
                        comment={comment} 
                        onVote={onVote} 
                        onReplyClick={(c) => setReplyTo(c)}
                        replies={getReplies ? getReplies(comment.id) : []}
                      />
                    ))
                ) : (
                    <p className="text-slate-500 text-center py-4">No comments yet. Be the first to share your thoughts!</p>
                )}
            </div>
        </div>
    );
}