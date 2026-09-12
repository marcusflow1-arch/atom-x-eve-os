import React from 'react';
import { BookOpen, Eye, Gamepad2, Lock, MessageSquare, Pin, Shield, Trash2, Flag, Clock3 } from 'lucide-react';
import { motion } from 'framer-motion';

const EMOJIS = ['👍', '❤️', '🔥', '😂', '💡', '🎯'];

const timeAgo = (value) => {
  const ms = Date.now() - new Date(value || Date.now()).getTime();
  const minutes = Math.max(0, Math.floor(ms / 60000));
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `${days}d` : new Date(value).toLocaleDateString();
};

const labelFor = (post) => {
  if (post.guide_kind && post.guide_kind !== 'none') return post.guide_kind.replaceAll('_', ' ');
  if (post.community === 'achievements') return 'achievement hunt';
  if (post.community === 'farming') return 'farming';
  if (post.community === 'guide') return 'guide';
  if (post.community === 'tips') return 'tip';
  return (post.type || 'discussion').replaceAll('_', ' ');
};

export default function PostCard({
  post,
  onSelect,
  reactions = [],
  commentCount = 0,
  onReact,
  onDelete,
  onReport,
  onModerate,
  currentUser,
  isModerator = false,
  isDetailView = false,
}) {
  const ownPost = Boolean(currentUser && (String(post.user_id || '') === String(currentUser.id) || (!post.user_id && post.created_by === currentUser.email)));
  const counts = reactions.reduce((acc, item) => {
    acc[item.emoji] = (acc[item.emoji] || 0) + 1;
    return acc;
  }, {});
  const myReaction = reactions.find((item) => String(item.user_id) === String(currentUser?.id))?.emoji;
  const guide = post.community === 'guide' || post.guide_kind && post.guide_kind !== 'none' || ['guide', 'achievement_guide', 'farming_guide', 'full_guide'].includes(post.type);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b1017]/75 backdrop-blur-xl transition-all hover:border-cyan-300/15 hover:bg-[#0d141d]/88"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/20 to-transparent" />
      <button type="button" onClick={!isDetailView ? () => onSelect?.(post) : undefined} className={`w-full p-5 text-left ${isDetailView ? 'cursor-default' : 'cursor-pointer'}`}>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-white/38">
          {post.is_pinned && <span className="flex items-center gap-1 text-cyan-200/75"><Pin className="h-3 w-3" /> pinned</span>}
          {post.is_locked && <span className="flex items-center gap-1 text-amber-200/70"><Lock className="h-3 w-3" /> locked</span>}
          <span className={`rounded-full px-2 py-1 ${guide ? 'bg-cyan-300/10 text-cyan-200/80' : 'bg-white/[0.05] text-white/55'}`}>
            {guide && <BookOpen className="mr-1 inline h-3 w-3" />}{labelFor(post)}
          </span>
          {post.difficulty && post.difficulty !== 'any' && <span>{post.difficulty}</span>}
          <span className="ml-auto normal-case tracking-normal text-white/30">{post.author_name || post.created_by?.split('@')?.[0] || 'Player'} · {timeAgo(post.created_date)}</span>
        </div>

        <h2 className={`font-semibold leading-tight text-white ${isDetailView ? 'text-2xl' : 'text-[17px]'} group-hover:text-cyan-100`}>{post.title}</h2>
        <p className={`mt-2 whitespace-pre-wrap text-sm leading-6 text-white/58 ${isDetailView ? '' : 'line-clamp-3'}`}>{post.content}</p>

        {post.image_url && <img src={post.image_url} alt="" className="mt-4 max-h-[360px] w-full rounded-lg border border-white/[0.06] object-cover" />}

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/35">
          {post.game_title && <span className="flex items-center gap-1.5"><Gamepad2 className="h-3.5 w-3.5" />{post.game_title}</span>}
          <span className="flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" />{commentCount}</span>
          <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" />{Number(post.view_count || 0)}</span>
          {post.edited_at && <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" />edited</span>}
          {post.tags?.slice(0, 4).map((tag) => <span key={tag} className="text-cyan-200/45">#{tag}</span>)}
        </div>
      </button>

      <div className="flex flex-wrap items-center gap-1 border-t border-white/[0.05] px-4 py-2.5">
        {EMOJIS.map((emoji) => (
          <button
            type="button"
            key={emoji}
            onClick={() => onReact?.(post, emoji)}
            className={`rounded-full border px-2 py-1 text-xs transition-colors ${myReaction === emoji ? 'border-cyan-300/25 bg-cyan-300/10 text-white' : 'border-transparent text-white/45 hover:border-white/10 hover:bg-white/[0.05] hover:text-white'}`}
          >
            {emoji}{counts[emoji] ? <span className="ml-1 text-[10px]">{counts[emoji]}</span> : null}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-1">
          {!ownPost && <button type="button" onClick={() => onReport?.('post', post.id)} className="rounded p-1.5 text-white/25 hover:bg-white/[0.05] hover:text-amber-200" title="Report"><Flag className="h-3.5 w-3.5" /></button>}
          {(ownPost || isModerator) && <button type="button" onClick={() => onDelete?.(post)} className="rounded p-1.5 text-white/25 hover:bg-red-500/10 hover:text-red-300" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>}
          {isModerator && <>
            <button type="button" onClick={() => onModerate?.(post, post.is_pinned ? 'unpin' : 'pin')} className="rounded p-1.5 text-white/25 hover:bg-cyan-500/10 hover:text-cyan-200" title={post.is_pinned ? 'Unpin' : 'Pin'}><Pin className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => onModerate?.(post, post.is_locked ? 'unlock' : 'lock')} className="rounded p-1.5 text-white/25 hover:bg-amber-500/10 hover:text-amber-200" title={post.is_locked ? 'Unlock' : 'Lock'}><Shield className="h-3.5 w-3.5" /></button>
          </>}
        </div>
      </div>
    </motion.article>
  );
}
