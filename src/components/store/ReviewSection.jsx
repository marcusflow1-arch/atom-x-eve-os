import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Send, ChevronLeft, ChevronRight, X, Clock, Calendar, Check } from 'lucide-react';

const MOCK_REVIEWS = [
  {
    id: 'r1',
    user: 'ShadowAce',
    avatar: 'S',
    rating: 5,
    recommended: true,
    hoursAtReview: 142,
    totalHours: 312,
    date: '2025-11-14',
    time: '9:32 PM',
    content: 'Absolutely mind-blowing experience. The card system is unlike anything I\'ve played before — every achievement feels earned and meaningful. The world design is incredible and the story kept me hooked from start to finish.',
    votes: { up: 48, down: 3 },
    comments: [
      { id: 'c1', user: 'VoidWalker', text: 'Totally agree! The card system is what keeps me coming back.', votes: { up: 12, down: 1 }, date: '2025-11-15' },
      { id: 'c2', user: 'NeuroGamer', text: 'Same experience here. 300+ hours and still going strong!', votes: { up: 9, down: 0 }, date: '2025-11-16' },
      { id: 'c3', user: 'CryptoKnight', text: 'Agreed on the world design. The neon cityscapes are gorgeous.', votes: { up: 7, down: 0 }, date: '2025-11-17' },
      { id: 'c4', user: 'NovaPulse', text: 'The story had me up until 4am multiple nights lol', votes: { up: 15, down: 2 }, date: '2025-11-18' },
      { id: 'c5', user: 'StarForge', text: 'Card synergies are insane once you get deep into it.', votes: { up: 6, down: 1 }, date: '2025-11-19' },
      { id: 'c6', user: 'DarkMatter', text: 'New player here — is there a good guide to start with?', votes: { up: 4, down: 0 }, date: '2025-11-20' },
      { id: 'c7', user: 'PhaseShift', text: 'Check the Farm Hub for farming guides, super helpful.', votes: { up: 8, down: 0 }, date: '2025-11-21' },
      { id: 'c8', user: 'ByteRunner', text: 'The achievement system is what keeps the game fresh long term.', votes: { up: 11, down: 1 }, date: '2025-11-22' },
      { id: 'c9', user: 'NeonWarden', text: '142 hours is nothing wait til you hit 500 lol', votes: { up: 18, down: 0 }, date: '2025-11-23' },
      { id: 'c10', user: 'GridLock', text: 'What build were you running at 142h?', votes: { up: 3, down: 0 }, date: '2025-11-24' },
      { id: 'c11', user: 'QuantumDrift', text: 'Stealth + Void abilities is the meta right now.', votes: { up: 14, down: 2 }, date: '2025-11-25' },
      { id: 'c12', user: 'IronVeil', text: 'Best purchase of the year honestly.', votes: { up: 20, down: 1 }, date: '2025-11-26' },
    ]
  },
  {
    id: 'r2',
    user: 'CryptoKnight',
    avatar: 'C',
    rating: 4,
    recommended: true,
    hoursAtReview: 89,
    totalHours: 156,
    date: '2025-10-22',
    time: '3:15 PM',
    content: 'Great game overall. Combat is fluid and the achievement card system adds a unique RPG layer. Minor performance hiccups on older hardware but nothing game-breaking. Would definitely recommend for fans of the genre.',
    votes: { up: 31, down: 5 },
    comments: [
      { id: 'c1', user: 'ShadowAce', text: 'Performance improved a lot with the last patch!', votes: { up: 8, down: 0 }, date: '2025-10-23' },
      { id: 'c2', user: 'NeuroGamer', text: 'What specs are you running on?', votes: { up: 4, down: 0 }, date: '2025-10-24' },
      { id: 'c3', user: 'VoidWalker', text: 'Same here, older GPU but playable at medium settings.', votes: { up: 6, down: 1 }, date: '2025-10-25' },
    ]
  },
  {
    id: 'r3',
    user: 'NovaPulse',
    avatar: 'N',
    rating: 5,
    recommended: true,
    hoursAtReview: 312,
    totalHours: 489,
    date: '2025-09-08',
    time: '11:47 AM',
    content: 'I\'ve been playing since early access and the game has evolved beautifully. The developers listen to the community, updates are regular, and the card ecosystem keeps expanding. This is a live-service done right.',
    votes: { up: 67, down: 2 },
    comments: [
      { id: 'c1', user: 'GridLock', text: 'Early access was rough but yes they\'ve polished it a lot.', votes: { up: 11, down: 1 }, date: '2025-09-09' },
      { id: 'c2', user: 'ByteRunner', text: '312 hours at time of review, respect 🔥', votes: { up: 22, down: 0 }, date: '2025-09-10' },
    ]
  },
  {
    id: 'r4',
    user: 'VoidWalker',
    avatar: 'V',
    rating: 3,
    recommended: false,
    hoursAtReview: 44,
    totalHours: 44,
    date: '2025-08-30',
    time: '7:20 PM',
    content: 'It\'s decent but not for everyone. The learning curve is steep and the tutorial doesn\'t explain the card mechanics well. Once it clicks it\'s great, but getting there took too long for my patience.',
    votes: { up: 19, down: 8 },
    comments: [
      { id: 'c1', user: 'ShadowAce', text: 'Totally fair — the onboarding needs work.', votes: { up: 7, down: 0 }, date: '2025-08-31' },
      { id: 'c2', user: 'NovaPulse', text: 'Check the Farm Hub section, there are player-written guides!', votes: { up: 14, down: 0 }, date: '2025-09-01' },
      { id: 'c3', user: 'PhaseShift', text: 'Same felt that way at first. Give it 10 more hours.', votes: { up: 9, down: 2 }, date: '2025-09-02' },
    ]
  },
];

const COMMENTS_PER_PAGE = 10;

function StarDisplay({ rating, size = 'sm' }) {
  const s = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`${s} ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20 fill-white/20'}`} />
      ))}
    </div>
  );
}

const EMOJI_GROUPS = [
  { label: '😂 Reactions', emojis: ['😂','🤣','😭','😅','🥲','😤','😡','🤯','😱','🥹','😍','🤩','😎','🤔','😒','🫡','💀','🫠','🤡','👀'] },
  { label: '🎮 Gaming', emojis: ['🎮','🕹️','🏆','⚔️','🛡️','💎','🔥','💥','⚡','🌀','🎯','👑','🦾','🤖','👾','🧠','🚀','💣','🪄','🎲'] },
  { label: '👋 Gestures', emojis: ['👍','👎','🙌','👏','🤝','🫶','❤️','💔','🫂','💪','🤘','✌️','🖖','🤙','👌','🤌','🫵','🙏','🤞','💯'] },
  { label: '✨ Glyphs', emojis: ['✨','🌟','⭐','💫','🔮','🌈','❄️','🌊','🌙','☀️','⚙️','🧩','🔑','🗝️','📜','🪙','💰','🎪','🎭','🎬'] },
];

function EmojiPicker({ onSelect }) {
  const [activeGroup, setActiveGroup] = useState(0);
  return (
    <div className="rounded-xl overflow-hidden shadow-2xl" style={{ background: 'rgba(15,20,30,0.97)', border: '1px solid rgba(255,255,255,0.12)', width: '260px' }}>
      {/* Group tabs */}
      <div className="flex border-b border-white/10">
        {EMOJI_GROUPS.map((g, i) => (
          <button
            key={i}
            onClick={() => setActiveGroup(i)}
            className={`flex-1 py-2 text-[11px] font-bold transition-all truncate px-1 ${activeGroup === i ? 'text-cyan-300 border-b-2 border-cyan-400 bg-cyan-400/5' : 'text-white/30 hover:text-white/60'}`}
          >
            {g.emojis[0]}
          </button>
        ))}
      </div>
      {/* Emoji grid */}
      <div className="grid grid-cols-10 gap-0.5 p-2">
        {EMOJI_GROUPS[activeGroup].emojis.map((e, i) => (
          <button
            key={i}
            onClick={() => onSelect(e)}
            className="w-6 h-6 flex items-center justify-center text-base hover:bg-white/10 rounded transition-all"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

function CommentView({ review, onClose, user }) {
  const [page, setPage] = useState(0);
  const [comments, setComments] = useState(review.comments);
  const [commentVotes, setCommentVotes] = useState({});
  const [replyDraft, setReplyDraft] = useState('');
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = React.useRef(null);

  const totalPages = Math.ceil(comments.length / COMMENTS_PER_PAGE);
  const pageComments = comments.slice(page * COMMENTS_PER_PAGE, (page + 1) * COMMENTS_PER_PAGE);

  const handleVote = (commentId, type) => {
    setCommentVotes(prev => {
      const existing = prev[commentId];
      if (existing === type) return { ...prev, [commentId]: null };
      return { ...prev, [commentId]: type };
    });
  };

  const handleInsertEmoji = (emoji) => {
    const el = textareaRef.current;
    if (el) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = replyDraft.slice(0, start) + emoji + replyDraft.slice(end);
      setReplyDraft(next);
      // Restore cursor after emoji
      setTimeout(() => { el.focus(); el.setSelectionRange(start + emoji.length, start + emoji.length); }, 0);
    } else {
      setReplyDraft(prev => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleSendReply = () => {
    if (!replyDraft.trim()) return;
    const name = user?.full_name || user?.email?.split('@')[0] || 'Player';
    const newComment = {
      id: `c_${Date.now()}`,
      user: name,
      text: replyDraft.trim(),
      votes: { up: 0, down: 0 },
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
    };
    setComments(prev => [...prev, newComment]);
    setReplyDraft('');
    setShowReplyBox(false);
    setShowEmojiPicker(false);
    // Jump to last page to show new comment
    setPage(Math.floor(comments.length / COMMENTS_PER_PAGE));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full"
    >
      {/* Original review compact header */}
      <div className="flex items-start gap-3 p-4 border-b border-white/10 bg-white/3 flex-shrink-0">
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
        >
          <ChevronLeft className="w-4 h-4 text-white/60" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-bold text-white text-sm">{review.user}</span>
            <StarDisplay rating={review.rating} />
            <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${review.recommended ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
              {review.recommended ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
              {review.recommended ? 'Recommended' : 'Not Recommended'}
            </span>
          </div>
          <p className="text-white/60 text-xs line-clamp-2">{review.content}</p>
        </div>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2" style={{ scrollbarWidth: 'none' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/40 text-[10px] uppercase tracking-wider font-bold">{comments.length} Replies</span>
          <button
            onClick={() => setShowReplyBox(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-cyan-300 hover:text-cyan-100 transition-all"
            style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)' }}
          >
            <MessageSquare className="w-3 h-3" /> Reply
          </button>
        </div>

        {/* Inline reply box */}
        <AnimatePresence>
          {showReplyBox && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-2"
            >
              <div className="p-3 rounded-xl space-y-2" style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)' }}>
                <textarea
                  ref={textareaRef}
                  autoFocus
                  placeholder="Leave a reply… use 😂 emojis, ⚔️ glyphs, anything!"
                  value={replyDraft}
                  onChange={e => setReplyDraft(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendReply()}
                  rows={2}
                  className="w-full px-2.5 py-1.5 rounded-lg text-[11px] text-white/80 placeholder-white/25 bg-white/5 border border-white/10 outline-none focus:border-cyan-400/40 resize-none leading-relaxed"
                />
                <div className="flex items-center gap-2 relative">
                  {/* Emoji toggle */}
                  <div className="relative">
                    <button
                      onClick={() => setShowEmojiPicker(v => !v)}
                      className="px-2.5 py-1.5 rounded-lg text-base hover:bg-white/10 transition-all"
                      title="Add emoji / glyph"
                    >
                      😊
                    </button>
                    <AnimatePresence>
                      {showEmojiPicker && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-full mb-2 left-0 z-50"
                        >
                          <EmojiPicker onSelect={handleInsertEmoji} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <button
                    onClick={handleSendReply}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-cyan-400 hover:text-cyan-200 transition-all"
                    style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)' }}
                  >
                    <Send className="w-3 h-3" /> Send
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {pageComments.map((c) => {
          const myVote = commentVotes[c.id];
          return (
            <div key={c.id} className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 bg-gradient-to-br from-blue-500/60 to-purple-500/60 mt-0.5">
                {c.user[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white/70 text-[11px] font-bold">{c.user}</span>
                  <span className="text-white/25 text-[9px]">{c.date}</span>
                </div>
                <p className="text-white/75 text-xs leading-relaxed">{c.text}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <button
                    onClick={() => handleVote(c.id, 'up')}
                    className={`flex items-center gap-1 text-[10px] transition-all ${myVote === 'up' ? 'text-cyan-300' : 'text-white/30 hover:text-white/60'}`}
                  >
                    <ThumbsUp className="w-2.5 h-2.5" /> {c.votes.up + (myVote === 'up' ? 1 : 0)}
                  </button>
                  <button
                    onClick={() => handleVote(c.id, 'down')}
                    className={`flex items-center gap-1 text-[10px] transition-all ${myVote === 'down' ? 'text-red-400' : 'text-white/30 hover:text-white/60'}`}
                  >
                    <ThumbsDown className="w-2.5 h-2.5" /> {c.votes.down + (myVote === 'down' ? 1 : 0)}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 flex-shrink-0">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-25"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <ChevronLeft className="w-4 h-4 text-white/70" />
          </button>
          <span className="text-white/30 text-xs">{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-25"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <ChevronRight className="w-4 h-4 text-white/70" />
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default function ReviewSection({ reviews: dbReviews, user }) {
  const reviews = dbReviews?.length > 0 ? dbReviews.map((r, i) => ({
    id: r.id,
    user: r.created_by || 'Anonymous',
    avatar: (r.created_by || 'A')[0].toUpperCase(),
    rating: r.rating || 5,
    recommended: (r.rating || 5) >= 3,
    hoursAtReview: Math.floor(Math.random() * 200 + 20),
    totalHours: Math.floor(Math.random() * 400 + 100),
    date: new Date(r.created_date).toLocaleDateString('en-CA'),
    time: new Date(r.created_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    content: r.content || '',
    votes: { up: Math.floor(Math.random() * 50), down: Math.floor(Math.random() * 10) },
    comments: []
  })) : MOCK_REVIEWS;

  const [openComments, setOpenComments] = useState(null); // reviewId
  const [reviewVotes, setReviewVotes] = useState({});
  const [newReviewDraft, setNewReviewDraft] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [showWriteBox, setShowWriteBox] = useState(false);
  const [localReviews, setLocalReviews] = useState(reviews);

  const handleReviewVote = (id, type) => {
    setReviewVotes(prev => {
      const existing = prev[id];
      if (existing === type) return { ...prev, [id]: null };
      return { ...prev, [id]: type };
    });
  };

  const handleSubmitReview = () => {
    if (!newReviewDraft.trim()) return;
    const name = user?.full_name || user?.email?.split('@')[0] || 'Player';
    const now = new Date();
    setLocalReviews(prev => [{
      id: `local_${Date.now()}`,
      user: name,
      avatar: name[0].toUpperCase(),
      rating: newRating,
      recommended: newRating >= 3,
      hoursAtReview: 0,
      totalHours: 0,
      date: now.toLocaleDateString('en-CA'),
      time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      content: newReviewDraft.trim(),
      votes: { up: 0, down: 0 },
      comments: []
    }, ...prev]);
    setNewReviewDraft('');
    setNewRating(5);
    setShowWriteBox(false);
  };

  const activeReview = openComments ? localReviews.find(r => r.id === openComments) : null;

  return (
    <div className="border-t border-white/10 pt-10 mt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Customer Reviews</h3>
          <div className="flex items-center gap-3">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-cyan-400 fill-cyan-400" />)}
            </div>
            <span className="text-white/50 text-sm">Very Positive ({localReviews.length.toLocaleString()} reviews)</span>
          </div>
        </div>
        <button
          onClick={() => setShowWriteBox(v => !v)}
          className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}
        >
          <MessageSquare className="w-4 h-4" /> Write a Review
        </button>
      </div>

      {/* Write Review Box */}
      <AnimatePresence>
        {showWriteBox && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="p-5 rounded-2xl space-y-4" style={{ background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.15)' }}>
              <div className="flex items-center gap-3">
                <span className="text-white/50 text-sm">Your rating:</span>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <button key={i} onClick={() => setNewRating(i)}>
                      <Star className={`w-5 h-5 transition-all ${i <= newRating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20 fill-white/20'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                placeholder="Share your thoughts about the game…"
                value={newReviewDraft}
                onChange={e => setNewReviewDraft(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm text-white/80 placeholder-white/25 bg-white/5 border border-white/10 outline-none focus:border-cyan-400/40 resize-none leading-relaxed"
              />
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowWriteBox(false)} className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white transition-all">Cancel</button>
                <button
                  onClick={handleSubmitReview}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                  style={{ background: 'rgba(34,211,238,0.2)', border: '1px solid rgba(34,211,238,0.3)', color: 'rgba(150,240,255,1)' }}
                >
                  <Send className="w-3.5 h-3.5" /> Post Review
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews list */}
      <div className="space-y-4">
        {localReviews.length === 0 ? (
          <div className="py-16 text-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <MessageSquare className="w-12 h-12 text-white/15 mx-auto mb-3" />
            <p className="text-white/30 font-medium">No reviews yet. Be the first to share your thoughts!</p>
          </div>
        ) : localReviews.map((review) => {
          const isShowingComments = openComments === review.id;
          const myVote = reviewVotes[review.id];

          return (
            <motion.div
              key={review.id}
              layout
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <AnimatePresence mode="wait">
                {isShowingComments ? (
                  <motion.div
                    key="comments"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-[480px] flex flex-col"
                  >
                    <CommentView
                      review={review}
                      onClose={() => setOpenComments(null)}
                      user={user}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="review"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-5 space-y-4"
                  >
                    {/* Review Header */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/70 to-purple-600/70 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {review.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold text-white text-sm">{review.user}</span>
                          <StarDisplay rating={review.rating} />
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* Recommended badge */}
                          <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${review.recommended ? 'text-green-400 bg-green-500/10 border border-green-500/20' : 'text-red-400 bg-red-500/10 border border-red-500/20'}`}>
                            {review.recommended ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                            {review.recommended ? 'Recommended' : 'Not Recommended'}
                          </span>
                          {/* Hours */}
                          <span className="flex items-center gap-1 text-white/35 text-[10px]">
                            <Clock className="w-2.5 h-2.5" /> {review.hoursAtReview}h at review · {review.totalHours}h total
                          </span>
                          {/* Date & Time */}
                          <span className="flex items-center gap-1 text-white/35 text-[10px]">
                            <Calendar className="w-2.5 h-2.5" /> {review.date} · {review.time}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Review Content */}
                    <p className="text-white/75 text-sm leading-relaxed">"{review.content}"</p>

                    {/* Footer: votes + comment trigger */}
                    <div className="flex items-center gap-3 pt-2 border-t border-white/6">
                      <span className="text-white/30 text-[10px] mr-1">Was this helpful?</span>
                      <button
                        onClick={() => handleReviewVote(review.id, 'up')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${myVote === 'up' ? 'text-cyan-300 bg-cyan-500/15 border border-cyan-400/30' : 'text-white/40 hover:text-white/70 bg-white/5 border border-white/10'}`}
                      >
                        <ThumbsUp className="w-3 h-3" /> {review.votes.up + (myVote === 'up' ? 1 : 0)}
                      </button>
                      <button
                        onClick={() => handleReviewVote(review.id, 'down')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${myVote === 'down' ? 'text-red-400 bg-red-500/15 border border-red-400/30' : 'text-white/40 hover:text-white/70 bg-white/5 border border-white/10'}`}
                      >
                        <ThumbsDown className="w-3 h-3" /> {review.votes.down + (myVote === 'down' ? 1 : 0)}
                      </button>
                      <button
                        onClick={() => setOpenComments(review.id)}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold text-white/50 hover:text-white transition-all"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        <MessageSquare className="w-3 h-3" />
                        {review.comments.length} {review.comments.length === 1 ? 'comment' : 'comments'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}