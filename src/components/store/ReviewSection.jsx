import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, Clock, Heart,
  MessageSquare, Send, Star, ThumbsDown, ThumbsUp, Users, X, Zap
} from 'lucide-react';

const MOCK_REVIEWS = [
  {
    id: 'r1', user: 'ShadowAce', avatar: 'S', rating: 5, recommended: true,
    hoursAtReview: 142, totalHours: 312, date: '2025-11-14', time: '9:32 PM',
    content: 'Absolutely mind-blowing experience. The card system is unlike anything I have played before — every achievement feels earned and meaningful. The world design is incredible and the story kept me hooked from start to finish.',
    votes: { up: 48, down: 3 },
    comments: [
      { id: 'c1', user: 'VoidWalker', text: 'Totally agree! The card system is what keeps me coming back.', votes: { up: 12, down: 1 }, date: '2025-11-15', replies: [{ id: 'c1-r1', user: 'NeuroGamer', text: 'Same here. The deeper synergies are where it really opens up.', votes: { up: 4, down: 0 }, date: '2025-11-16' }] },
      { id: 'c2', user: 'NeuroGamer', text: 'Same experience here. 300+ hours and still going strong!', votes: { up: 9, down: 0 }, date: '2025-11-16' },
      { id: 'c3', user: 'CryptoKnight', text: 'Agreed on the world design. The neon cityscapes are gorgeous.', votes: { up: 7, down: 0 }, date: '2025-11-17' },
      { id: 'c4', user: 'NovaPulse', text: 'The story had me up until 4am multiple nights lol', votes: { up: 15, down: 2 }, date: '2025-11-18' },
      { id: 'c5', user: 'StarForge', text: 'Card synergies are insane once you get deep into it.', votes: { up: 6, down: 1 }, date: '2025-11-19' },
    ]
  },
  {
    id: 'r2', user: 'CryptoKnight', avatar: 'C', rating: 4, recommended: true,
    hoursAtReview: 89, totalHours: 156, date: '2025-10-22', time: '3:15 PM',
    content: 'Great game overall. Combat is fluid and the achievement card system adds a unique RPG layer. Minor performance hiccups on older hardware but nothing game-breaking.',
    votes: { up: 31, down: 5 },
    comments: [
      { id: 'c1', user: 'ShadowAce', text: 'Performance improved a lot with the last patch!', votes: { up: 8, down: 0 }, date: '2025-10-23' },
      { id: 'c2', user: 'NeuroGamer', text: 'What specs are you running on?', votes: { up: 4, down: 0 }, date: '2025-10-24' },
      { id: 'c3', user: 'VoidWalker', text: 'Same here, older GPU but playable at medium settings.', votes: { up: 6, down: 1 }, date: '2025-10-25' },
    ]
  },
  {
    id: 'r3', user: 'NovaPulse', avatar: 'N', rating: 5, recommended: true,
    hoursAtReview: 312, totalHours: 489, date: '2025-09-08', time: '11:47 AM',
    content: 'I have been playing since early access and the game has evolved beautifully. The developers listen to the community, updates are regular, and the card ecosystem keeps expanding.',
    votes: { up: 67, down: 2 },
    comments: [
      { id: 'c1', user: 'GridLock', text: 'Early access was rough but yes they have polished it a lot.', votes: { up: 11, down: 1 }, date: '2025-09-09' },
      { id: 'c2', user: 'ByteRunner', text: '312 hours at time of review, respect 🔥', votes: { up: 22, down: 0 }, date: '2025-09-10' },
    ]
  },
  {
    id: 'r4', user: 'VoidWalker', avatar: 'V', rating: 3, recommended: false,
    hoursAtReview: 44, totalHours: 44, date: '2025-08-30', time: '7:20 PM',
    content: 'It is decent but not for everyone. The learning curve is steep and the tutorial does not explain the card mechanics well. Once it clicks it is great, but getting there took too long for my patience.',
    votes: { up: 19, down: 8 },
    comments: [
      { id: 'c1', user: 'ShadowAce', text: 'Totally fair — the onboarding needs work.', votes: { up: 7, down: 0 }, date: '2025-08-31' },
      { id: 'c2', user: 'NovaPulse', text: 'Check the Farm Hub section, there are player-written guides!', votes: { up: 14, down: 0 }, date: '2025-09-01' },
      { id: 'c3', user: 'PhaseShift', text: 'Same felt that way at first. Give it 10 more hours.', votes: { up: 9, down: 2 }, date: '2025-09-02' },
    ]
  }
];

const REACTIONS = ['👍', '👎', '🔥', '😂', '🤯', '❤️', '🎮', '💯'];

function StarDisplay({ rating, large = false }) {
  return <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className={`${large ? 'w-4 h-4' : 'w-3.5 h-3.5'} ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/15'}`} />)}</div>;
}

function GlassDivider({ vertical = false }) {
  return <div className={vertical ? 'w-px self-stretch bg-gradient-to-b from-transparent via-white/20 to-transparent' : 'h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent'} />;
}

function ReviewerProfile({ review }) {
  return (
    <aside className="w-[31%] min-w-[260px] shrink-0 px-7 py-8 border-r border-white/[0.06] bg-white/[0.018]">
      <div className="text-[9px] uppercase tracking-[0.25em] text-cyan-300/55 mb-6">Reviewer Profile</div>
      <div className="flex items-center gap-4 mb-7">
        <div className="w-16 h-16 flex items-center justify-center text-xl font-black text-white bg-gradient-to-br from-cyan-400/25 to-purple-500/25 border border-white/10">{review.avatar}</div>
        <div className="min-w-0">
          <div className="text-white font-bold text-lg truncate">{review.user}</div>
          <div className="text-white/35 text-[10px] uppercase tracking-wider">Verified Player</div>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-7"><StarDisplay rating={review.rating} large /><span className="text-white/40 text-xs">{review.recommended ? 'Recommended' : 'Not Recommended'}</span></div>
      <div className="space-y-0 border-y border-white/[0.07]">
        <div className="flex items-center justify-between py-4"><span className="text-white/35 text-[10px] uppercase tracking-wider">Account Level</span><span className="text-white text-sm font-semibold">{Math.max(1, Math.floor(review.totalHours / 20))}</span></div>
        <div className="flex items-center justify-between py-4 border-t border-white/[0.05]"><span className="text-white/35 text-[10px] uppercase tracking-wider">Games Owned</span><span className="text-white text-sm font-semibold">{Math.max(8, Math.floor(review.totalHours / 12))}</span></div>
        <div className="flex items-center justify-between py-4 border-t border-white/[0.05]"><span className="text-white/35 text-[10px] uppercase tracking-wider">Playtime</span><span className="text-white text-sm font-semibold">{review.totalHours}h</span></div>
      </div>
      <div className="mt-7">
        <div className="flex items-center gap-2 text-white/35 text-[9px] uppercase tracking-[0.18em] mb-3"><TrophyIcon /> Badge Showcase</div>
        <div className="grid grid-cols-4 gap-2">{['★','⚡','◆','◈','✦','◉','✚','◇'].map((b,i)=><div key={i} className="h-11 flex items-center justify-center border border-white/[0.07] text-cyan-300/45 text-sm bg-white/[0.02]">{b}</div>)}</div>
      </div>
    </aside>
  );
}
function TrophyIcon(){return <span className="text-cyan-300/50">✦</span>}

function Thread({ comment, depth = 0, onVote, onReply, reactionState, onReaction }) {
  const [expanded, setExpanded] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const myVote = reactionState.votes[comment.id];
  const replies = comment.replies || [];
  return (
    <motion.div layout className={`${depth ? 'ml-8 pl-4 border-l border-white/[0.07]' : ''}`}>
      <div className="py-4 border-b border-white/[0.055]">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 shrink-0 flex items-center justify-center text-[10px] font-bold text-white/80 border border-white/[0.08] bg-white/[0.035]">{comment.user?.[0] || 'P'}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2"><span className="text-white/75 text-[11px] font-bold">{comment.user}</span><span className="text-white/20 text-[9px]">{comment.date}</span></div>
            <p className="text-white/65 text-sm leading-relaxed mt-1.5">{comment.text}</p>
            <div className="flex items-center gap-4 mt-2">
              <button onClick={() => onVote(comment.id, 'up')} className={`flex items-center gap-1 text-[10px] ${myVote === 'up' ? 'text-cyan-300' : 'text-white/30 hover:text-white/60'}`}><ThumbsUp className="w-3 h-3"/>{(comment.votes?.up || 0) + (myVote === 'up' ? 1 : 0)}</button>
              <button onClick={() => onVote(comment.id, 'down')} className={`flex items-center gap-1 text-[10px] ${myVote === 'down' ? 'text-red-400' : 'text-white/30 hover:text-white/60'}`}><ThumbsDown className="w-3 h-3"/>{(comment.votes?.down || 0) + (myVote === 'down' ? 1 : 0)}</button>
              <button onClick={() => setReplyOpen(v => !v)} className="text-[10px] text-white/35 hover:text-cyan-300">Reply <ChevronDown className={`inline w-3 h-3 transition-transform ${replyOpen ? 'rotate-180' : ''}`}/></button>
              <div className="relative flex items-center gap-1">{REACTIONS.slice(0,4).map(e=><button key={e} onClick={()=>onReaction(comment.id,e)} className={`text-[12px] opacity-50 hover:opacity-100 ${reactionState.reactions[comment.id]===e?'opacity-100':''}`}>{e}</button>)}</div>
            </div>
            {replyOpen && <div className="mt-3 pl-3 border-l border-cyan-300/10"><button onClick={()=>onReply(comment.id)} className="text-[10px] text-cyan-300/70 hover:text-cyan-200 flex items-center gap-1"><MessageSquare className="w-3 h-3"/>Open reply field</button></div>}
            {replies.length > 0 && <button onClick={()=>setExpanded(v=>!v)} className="mt-3 text-[10px] text-cyan-300/70 hover:text-cyan-200 flex items-center gap-1">{expanded?'Hide':'View'} {replies.length} {replies.length===1?'reply':'replies'} <ChevronDown className={`w-3 h-3 transition-transform ${expanded?'rotate-180':''}`}/></button>}
          </div>
        </div>
      </div>
      <AnimatePresence>{expanded && replies.map(reply=><motion.div key={reply.id} initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}><Thread comment={reply} depth={depth+1} onVote={onVote} onReply={onReply} reactionState={reactionState} onReaction={onReaction}/></motion.div>)}</AnimatePresence>
    </motion.div>
  );
}

function ReviewDrawer({ review, user, onClose }) {
  const [comments, setComments] = useState(review.comments || []);
  const [votes, setVotes] = useState({});
  const [reactions, setReactions] = useState({});
  const [draft, setDraft] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  const [showComposer, setShowComposer] = useState(false);
  const [showReactionBar, setShowReactionBar] = useState(false);

  const handleVote = (id, type) => setVotes(prev => ({...prev, [id]: prev[id] === type ? null : type}));
  const handleReaction = (id, emoji) => setReactions(prev => ({...prev, [id]: prev[id] === emoji ? null : emoji}));
  const handleReply = (id) => { setReplyTarget(id); setShowComposer(true); };
  const handleSend = () => {
    if (!draft.trim()) return;
    const name = user?.full_name || user?.email?.split('@')[0] || 'Player';
    const newComment = { id:`local_${Date.now()}`, user:name, text:draft.trim(), votes:{up:0,down:0}, date:new Date().toLocaleDateString('en-US'), replies:[] };
    if (replyTarget) {
      setComments(prev => prev.map(c => c.id === replyTarget ? {...c, replies:[...(c.replies||[]),newComment]} : c));
    } else setComments(prev => [...prev, newComment]);
    setDraft(''); setReplyTarget(null); setShowComposer(false);
  };
  return <motion.div className="fixed inset-0 z-[120] flex items-stretch justify-end" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
    <div className="absolute inset-0 bg-black/45 backdrop-blur-[7px]" onClick={onClose}/>
    <motion.div initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}} transition={{type:'tween',duration:.38}} className="relative w-[min(1180px,calc(100vw-72px))] h-full bg-[#0c1118]/90 backdrop-blur-3xl border-l border-white/[0.09] shadow-[-24px_0_80px_rgba(0,0,0,.35)] flex overflow-hidden">
      <ReviewerProfile review={review}/>
      <section className="flex-1 min-w-0 flex flex-col">
        <header className="px-7 py-5 flex items-center gap-4 border-b border-white/[0.07] shrink-0">
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center text-white/45 hover:text-white border border-white/[0.07] bg-white/[0.025]"><ChevronRight className="w-4 h-4"/></button>
          <div className="min-w-0 flex-1"><div className="text-[9px] uppercase tracking-[.22em] text-cyan-300/50">Review Discussion</div><div className="text-white font-bold text-lg truncate">{review.user}'s review</div></div>
          <div className="text-right"><div className="text-white/30 text-[8px] uppercase">Helpful</div><div className="text-white text-sm font-semibold">{review.votes.up}</div></div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center text-white/30 hover:text-white"><X className="w-4 h-4"/></button>
        </header>
        <div className="px-7 py-5 shrink-0 bg-white/[0.012]">
          <div className="flex items-center gap-3 mb-3"><StarDisplay rating={review.rating}/><span className={review.recommended?'text-green-400/75':'text-red-400/75'}>{review.recommended?'Recommended':'Not Recommended'}</span><span className="text-white/20">•</span><span className="text-white/30 text-[10px]">{review.hoursAtReview}h at review · {review.totalHours}h total</span></div>
          <p className="text-white/72 text-sm leading-7 max-w-4xl">{review.content}</p>
          <div className="flex items-center gap-3 mt-4"><button className="text-[10px] text-white/35 flex items-center gap-1"><ThumbsUp className="w-3 h-3"/>{review.votes.up}</button><button className="text-[10px] text-white/35 flex items-center gap-1"><ThumbsDown className="w-3 h-3"/>{review.votes.down}</button><span className="text-white/20 text-[10px]">{review.date} · {review.time}</span></div>
        </div>
        <GlassDivider/>
        <div className="flex-1 overflow-y-auto px-7" style={{scrollbarWidth:'thin'}}>
          <div className="flex items-center justify-between py-4"><div className="text-white/35 text-[9px] uppercase tracking-[.2em]">Thread · {comments.length} comments</div><button onClick={()=>{setReplyTarget(null);setShowComposer(v=>!v)}} className="text-[10px] text-cyan-300/80 hover:text-cyan-200 flex items-center gap-1"><MessageSquare className="w-3 h-3"/> New comment</button></div>
          {comments.map(c=><Thread key={c.id} comment={c} onVote={handleVote} onReply={handleReply} reactionState={{votes,reactions}} onReaction={handleReaction}/>) }
          {comments.length===0 && <div className="py-20 text-center text-white/25 text-sm">No comments yet.</div>}
        </div>
        <div className="shrink-0 border-t border-white/[0.07] px-7 py-4 bg-black/10">
          <AnimatePresence>{showComposer && <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:8}} className="mb-3"><div className="text-[9px] uppercase tracking-wider text-cyan-300/45 mb-2">{replyTarget?'Replying in thread':'Add to discussion'}</div><textarea autoFocus value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend();}}} rows={3} placeholder={replyTarget?'Write your reply…':'Share your thoughts…'} className="w-full resize-none bg-white/[0.025] border border-white/[0.08] outline-none focus:border-cyan-300/25 px-4 py-3 text-sm text-white/75 placeholder-white/20"/></motion.div>}</AnimatePresence>
          <div className="flex items-center gap-3"><button onClick={()=>{setReplyTarget(null);setShowComposer(v=>!v)}} className="text-[10px] text-white/35 hover:text-white flex items-center gap-1"><ChevronDown className={`w-3 h-3 transition-transform ${showComposer?'rotate-180':''}`}/> {showComposer?'Hide':'Comment'}</button><div className="relative"><button onClick={()=>setShowReactionBar(v=>!v)} className="text-[12px] text-white/35 hover:text-white">☺</button>{showReactionBar&&<div className="absolute bottom-8 left-0 flex gap-1 p-2 bg-[#111822]/95 border border-white/10 backdrop-blur-xl">{REACTIONS.map(e=><button key={e} onClick={()=>{setDraft(d=>d+e);setShowReactionBar(false)}} className="text-sm hover:scale-110">{e}</button>)}</div>}</div><span className="text-white/15 text-[9px]">Enter to send · Shift+Enter for a new line</span><button onClick={handleSend} disabled={!draft.trim()} className="ml-auto flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-cyan-200 border border-cyan-300/15 bg-cyan-300/[0.06] disabled:opacity-25"><Send className="w-3 h-3"/> Send</button></div>
        </div>
      </section>
    </motion.div>
  </motion.div>;
}

export default function ReviewSection({ reviews: dbReviews, user }) {
  const reviews = useMemo(() => dbReviews?.length ? dbReviews.map(r => ({
    id:r.id, user:r.created_by||'Anonymous', avatar:(r.created_by||'A')[0].toUpperCase(), rating:r.rating||5,
    recommended:(r.rating||5)>=3, hoursAtReview:Math.floor(Math.random()*200+20), totalHours:Math.floor(Math.random()*400+100),
    date:r.created_date?new Date(r.created_date).toLocaleDateString('en-CA'):'—', time:r.created_date?new Date(r.created_date).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}):'', content:r.content||'', votes:{up:Math.floor(Math.random()*50),down:Math.floor(Math.random()*10)}, comments:[]
  })) : MOCK_REVIEWS, [dbReviews]);
  const [localReviews,setLocalReviews]=useState(reviews);
  const [openComments,setOpenComments]=useState(null);
  const [reviewVotes,setReviewVotes]=useState({});
  const [newReviewDraft,setNewReviewDraft]=useState('');
  const [newRating,setNewRating]=useState(5);
  const [showWriteBox,setShowWriteBox]=useState(false);

  const handleReviewVote=(id,type)=>setReviewVotes(prev=>({...prev,[id]:prev[id]===type?null:type}));
  const handleSubmitReview=()=>{if(!newReviewDraft.trim())return;const name=user?.full_name||user?.email?.split('@')[0]||'Player';const now=new Date();setLocalReviews(prev=>[{id:`local_${Date.now()}`,user:name,avatar:name[0]?.toUpperCase()||'P',rating:newRating,recommended:newRating>=3,hoursAtReview:0,totalHours:0,date:now.toLocaleDateString('en-CA'),time:now.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}),content:newReviewDraft.trim(),votes:{up:0,down:0},comments:[]},...prev]);setNewReviewDraft('');setNewRating(5);setShowWriteBox(false);};

  return <div className="w-full max-w-[1600px] mx-auto border-t border-white/[0.08] pt-10 mt-4 px-4 sm:px-6 lg:px-10">
    <div className="flex items-center justify-between mb-7"><div><h3 className="text-2xl font-bold text-white mb-1">Customer Reviews</h3><div className="flex items-center gap-3"><div className="flex gap-0.5">{[1,2,3,4,5].map(i=><Star key={i} className="w-4 h-4 text-cyan-400 fill-cyan-400"/>)}</div><span className="text-white/40 text-sm">Very Positive ({localReviews.length.toLocaleString()} reviews)</span></div></div><button onClick={()=>setShowWriteBox(v=>!v)} className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white/70 border border-white/[0.09] bg-white/[0.025] hover:bg-white/[0.05]"><MessageSquare className="w-4 h-4"/> Write a Review</button></div>
    <GlassDivider/>
    <AnimatePresence>{showWriteBox&&<motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden"><div className="py-6 max-w-4xl"><div className="flex items-center gap-3 mb-4"><span className="text-white/35 text-[10px] uppercase tracking-wider">Your rating</span>{[1,2,3,4,5].map(i=><button key={i} onClick={()=>setNewRating(i)}><Star className={`w-5 h-5 ${i<=newRating?'text-yellow-400 fill-yellow-400':'text-white/15'}`}/></button>)}</div><textarea value={newReviewDraft} onChange={e=>setNewReviewDraft(e.target.value)} rows={4} placeholder="Share your thoughts about the game…" className="w-full resize-none bg-white/[0.025] border border-white/[0.08] outline-none focus:border-cyan-300/25 px-4 py-3 text-sm text-white/75 placeholder-white/20"/><div className="flex justify-end gap-3 mt-3"><button onClick={()=>setShowWriteBox(false)} className="px-4 py-2 text-xs text-white/35">Cancel</button><button onClick={handleSubmitReview} className="px-4 py-2 text-xs font-bold text-cyan-200 border border-cyan-300/15 bg-cyan-300/[0.06]">Post Review</button></div></div></motion.div>}</AnimatePresence>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-12 gap-y-2 py-4">{localReviews.map(review=>{const myVote=reviewVotes[review.id];return <motion.article layout key={review.id} className="py-7 border-b border-white/[0.055]">
      <div className="flex items-start gap-4"><div className="w-11 h-11 shrink-0 flex items-center justify-center text-white font-bold bg-white/[0.035] border border-white/[0.07]">{review.avatar}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap"><span className="text-white font-bold text-sm">{review.user}</span><StarDisplay rating={review.rating}/><span className={review.recommended?'text-green-400/65 text-[9px]':'text-red-400/65 text-[9px]'}>{review.recommended?'RECOMMENDED':'NOT RECOMMENDED'}</span></div><div className="flex items-center gap-3 mt-1.5 text-white/25 text-[9px] flex-wrap"><span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{review.hoursAtReview}h at review · {review.totalHours}h total</span><span className="flex items-center gap-1"><Calendar className="w-3 h-3"/>{review.date} · {review.time}</span></div></div></div>
      <p className="text-white/65 text-sm leading-7 mt-5 max-w-3xl">{review.content}</p>
      <div className="flex items-center gap-4 mt-5 pt-3 border-t border-white/[0.04]"><span className="text-white/20 text-[9px] uppercase tracking-wider">Helpful</span><button onClick={()=>handleReviewVote(review.id,'up')} className={`flex items-center gap-1 text-[10px] ${myVote==='up'?'text-cyan-300':'text-white/30 hover:text-white/60'}`}><ThumbsUp className="w-3 h-3"/>{review.votes.up+(myVote==='up'?1:0)}</button><button onClick={()=>handleReviewVote(review.id,'down')} className={`flex items-center gap-1 text-[10px] ${myVote==='down'?'text-red-400':'text-white/30 hover:text-white/60'}`}><ThumbsDown className="w-3 h-3"/>{review.votes.down+(myVote==='down'?1:0)}</button><button onClick={()=>setOpenComments(review.id)} className="ml-auto flex items-center gap-1.5 text-[10px] text-white/40 hover:text-cyan-300"><MessageSquare className="w-3 h-3"/>{review.comments.length} comments <ChevronRight className="w-3 h-3"/></button></div>
    </motion.article>})}</div>
    <AnimatePresence>{openComments&&<ReviewDrawer review={localReviews.find(r=>r.id===openComments)} user={user} onClose={()=>setOpenComments(null)}/>}</AnimatePresence>
  </div>;
}
