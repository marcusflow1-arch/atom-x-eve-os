import React, { useMemo, useState } from 'react';
import { Flag, MessageSquareReply, Send, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const EMOJIS = ['👍', '❤️', '🔥', '😂', '💡', '🎯'];

function CommentRow({ comment, replies, reactions, currentUser, isModerator, onReply, onDelete, onReact, onReport }) {
  const own = Boolean(currentUser && (String(comment.user_id || '') === String(currentUser.id) || (!comment.user_id && comment.created_by === currentUser.email)));
  const myReaction = reactions.find((r) => String(r.user_id) === String(currentUser?.id))?.emoji;
  const counts = reactions.reduce((map, r) => ({ ...map, [r.emoji]: (map[r.emoji] || 0) + 1 }), {});
  return (
    <div className="border-t border-white/[0.055] py-4 first:border-t-0">
      <div className="flex items-center gap-2 text-xs text-white/35">
        <span className="font-semibold text-white/70">{comment.author_name || comment.created_by?.split('@')?.[0] || 'Player'}</span>
        <span>·</span><span>{new Date(comment.created_date || Date.now()).toLocaleString()}</span>
        {comment.status === 'removed' && <span className="text-red-300/60">deleted</span>}
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/65">{comment.content}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        {EMOJIS.map((emoji) => <button key={emoji} type="button" onClick={() => onReact?.('comment', comment.id, emoji)} className={`rounded-full px-2 py-1 text-[11px] ${myReaction === emoji ? 'bg-cyan-300/10 text-white' : 'text-white/35 hover:bg-white/[0.05] hover:text-white'}`}>{emoji}{counts[emoji] ? ` ${counts[emoji]}` : ''}</button>)}
        <button type="button" onClick={() => onReply(comment)} className="ml-2 flex items-center gap-1 rounded px-2 py-1 text-[11px] text-white/35 hover:bg-white/[0.05] hover:text-white"><MessageSquareReply className="h-3 w-3" />Reply</button>
        {!own && <button type="button" onClick={() => onReport?.('comment', comment.id)} className="rounded p-1.5 text-white/20 hover:text-amber-200"><Flag className="h-3 w-3" /></button>}
        {(own || isModerator) && <button type="button" onClick={() => onDelete?.(comment)} className="rounded p-1.5 text-white/20 hover:text-red-300"><Trash2 className="h-3 w-3" /></button>}
      </div>
      {replies?.length > 0 && <div className="ml-6 mt-3 border-l border-cyan-300/10 pl-4">{replies.map((reply) => <CommentRow key={reply.id} comment={reply} replies={[]} reactions={reply._reactions || []} currentUser={currentUser} isModerator={isModerator} onReply={onReply} onDelete={onDelete} onReact={onReact} onReport={onReport} />)}</div>}
    </div>
  );
}

export default function CommentSection({ post, comments = [], reactions = [], currentUser, isModerator = false, onAddComment, onDelete, onReact, onReport }) {
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const roots = useMemo(() => {
    const byParent = new Map();
    comments.forEach((comment) => {
      const key = comment.parent_comment_id || '__root__';
      byParent.set(key, [...(byParent.get(key) || []), comment]);
    });
    return (byParent.get('__root__') || []).map((comment) => ({ ...comment, _replies: (byParent.get(comment.id) || []).map((reply) => ({ ...reply, _reactions: reactions.filter((r) => r.target_type === 'comment' && r.target_id === reply.id) })) }));
  }, [comments, reactions]);

  const submit = async (event) => {
    event.preventDefault();
    if (!text.trim() || post?.is_locked) return;
    await onAddComment?.({ content: text.trim(), parent_comment_id: replyTo?.id || '' });
    setText(''); setReplyTo(null);
  };

  return (
    <section className="rounded-xl border border-white/[0.07] bg-[#090e15]/78 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">Discussion · {comments.length}</h3>{post?.is_locked && <span className="text-xs text-amber-200/65">Locked by moderator</span>}</div>
      {!post?.is_locked && <form onSubmit={submit} className="mb-5 rounded-lg border border-white/[0.07] bg-black/15 p-3">
        {replyTo && <div className="mb-2 flex items-center justify-between text-xs text-cyan-200/55"><span>Replying to {replyTo.author_name || 'player'}</span><button type="button" onClick={() => setReplyTo(null)}>Cancel</button></div>}
        <Textarea value={text} maxLength={5000} onChange={(e) => setText(e.target.value)} placeholder={replyTo ? 'Write a reply…' : 'Add useful context, a correction, or another strategy…'} className="min-h-[84px] resize-none border-0 bg-transparent text-white/80 placeholder:text-white/25 focus-visible:ring-0" />
        <div className="mt-2 flex justify-end"><button type="submit" disabled={!text.trim()} className="flex items-center gap-2 rounded-lg bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-cyan-100 disabled:opacity-30"><Send className="h-3.5 w-3.5" />Post comment</button></div>
      </form>}
      <div>{roots.length ? roots.map((comment) => <CommentRow key={comment.id} comment={comment} replies={comment._replies} reactions={reactions.filter((r) => r.target_type === 'comment' && r.target_id === comment.id)} currentUser={currentUser} isModerator={isModerator} onReply={setReplyTo} onDelete={onDelete} onReact={onReact} onReport={onReport} />) : <p className="py-8 text-center text-sm text-white/28">No replies yet. Add the first useful note.</p>}</div>
    </section>
  );
}
