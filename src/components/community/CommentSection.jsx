import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, ArrowDown } from 'lucide-react';

const Comment = ({ comment, onVote }) => (
    <div className="flex gap-3 py-3 border-t border-slate-700">
        <div className="flex flex-col items-center justify-start space-y-1 flex-shrink-0 text-slate-400 pt-1">
            <button onClick={() => onVote(comment, 'up')} className="p-1 rounded-full hover:bg-green-500/20 hover:text-green-400">
                <ArrowUp className="w-4 h-4" />
            </button>
            <span className="font-bold text-white text-sm">{comment.score}</span>
            <button onClick={() => onVote(comment, 'down')} className="p-1 rounded-full hover:bg-red-500/20 hover:text-red-400">
                <ArrowDown className="w-4 h-4" />
            </button>
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400 mb-1">
                <span className="font-semibold text-slate-300">{comment.created_by?.split('@')[0] || 'Anonymous'}</span>
            </p>
            <p className="text-slate-200 break-words">{comment.content}</p>
            <div className="mt-2 flex items-center gap-2">
                <button onClick={() => onVote(comment, 'up')} className="text-[11px] text-green-400/80 hover:text-green-300">Like</button>
                <button onClick={() => onVote(comment, 'down')} className="text-[11px] text-red-400/80 hover:text-red-300">Dislike</button>
            </div>
        </div>
    </div>
);

export default function CommentSection({ postId, comments, onAddComment, onVote }) {
    const [newCommentText, setNewCommentText] = useState('');

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        if (!newCommentText.trim()) return;
        onAddComment({
            target_id: postId,
            target_type: 'post',
            content: newCommentText,
        });
        setNewCommentText('');
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
            <div className="space-y-2">
                {comments && comments.length > 0 ? (
                    comments.map(comment => <Comment key={comment.id} comment={comment} onVote={onVote} />)
                ) : (
                    <p className="text-slate-500 text-center py-4">No comments yet. Be the first to share your thoughts!</p>
                )}
            </div>
        </div>
    );
}