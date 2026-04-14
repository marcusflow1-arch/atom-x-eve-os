import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, MessageCircle, Send, Camera, Video, User2 } from 'lucide-react';

const MOCK_MOMENTS = [
  {
    id: 1, type: 'screenshot', name: 'Epic final boss moment 🔥',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80',
    user: 'ShadowAce', likes: 142,
    comments: [
      { user: 'NeuroGamer', text: 'BRO that lighting!! 😭🙌' },
      { user: 'VoidWalker', text: 'I died here 47 times lmao' },
    ],
    extras: [
      { type: 'screenshot', url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&q=75', name: 'Boss phase 2' },
      { type: 'screenshot', url: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=300&q=75', name: 'Victory screen' },
      { type: 'video', url: '', name: 'Kill clip' },
    ],
  },
  {
    id: 2, type: 'screenshot', name: 'Hidden spot nobody talks about',
    url: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=600&q=80',
    user: 'CryptoKnight', likes: 89,
    comments: [{ user: 'NovaPulse', text: 'Where is this?? I need to know' }],
    extras: [
      { type: 'screenshot', url: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=300&q=75', name: 'Another angle' },
      { type: 'screenshot', url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300&q=75', name: 'Map view' },
    ],
  },
  {
    id: 3, type: 'screenshot', name: 'My character after 200hrs 👑',
    url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&q=80',
    user: 'NovaPulse', likes: 312,
    comments: [
      { user: 'ShadowAce', text: 'The drip is REAL 🔥' },
      { user: 'CryptoKnight', text: 'Goals honestly' },
      { user: 'NeuroGamer', text: 'Respect the grind 🤝' },
    ],
    extras: [
      { type: 'screenshot', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&q=75', name: 'Equipment set 1' },
      { type: 'screenshot', url: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=300&q=75', name: 'Equipment set 2' },
      { type: 'video', url: '', name: 'Showcase clip' },
    ],
  },
  {
    id: 4, type: 'screenshot', name: 'Caught the sunrise, worth it',
    url: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=600&q=80',
    user: 'NeuroGamer', likes: 201, comments: [],
    extras: [
      { type: 'screenshot', url: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=300&q=75', name: 'Sunset too' },
    ],
  },
];

export default function CommunityMomentsSection({ game, user }) {
  const [moments, setMoments] = useState(MOCK_MOMENTS);
  const [likedMoments, setLikedMoments] = useState({});
  const [openComment, setOpenComment] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [activeMedia, setActiveMedia] = useState({});

  const handleLike = (id) => {
    const wasLiked = likedMoments[id];
    setLikedMoments(prev => ({ ...prev, [id]: !wasLiked }));
    setMoments(prev => prev.map(m => m.id === id ? { ...m, likes: m.likes + (wasLiked ? -1 : 1) } : m));
  };

  const handleAddComment = (id) => {
    if (!commentDraft.trim()) return;
    const name = user?.full_name || user?.email?.split('@')[0] || 'Player';
    setMoments(prev => prev.map(m => m.id === id
      ? { ...m, comments: [...m.comments, { user: name, text: commentDraft.trim() }] }
      : m
    ));
    setCommentDraft('');
    setOpenComment(null);
  };

  return (
    <div className="border-t border-white/10 pt-8 space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Camera className="w-4 h-4 text-cyan-400" />
        <span className="text-white font-black text-sm">Community Moments</span>
        <span className="ml-auto text-white/30 text-[10px]">{moments.length} captures</span>
      </div>

      {moments.map((moment) => (
        <motion.div key={moment.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex gap-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>

            {/* LEFT: image + thumbnails + actions */}
            <div className="flex flex-col" style={{ width: '58%', flexShrink: 0 }}>
              {/* Main image */}
              {(() => {
                const active = activeMedia[moment.id] || { url: moment.url, type: moment.type, name: moment.name };
                return (
                  <div className="relative overflow-hidden" style={{ aspectRatio: '16/8.4' }}>
                    {active.type === 'video' ? (
                      <video key={active.url} src={active.url} className="w-full h-full object-cover" controls />
                    ) : (
                      <img src={active.url} alt={active.name} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 px-3 py-2">
                      <p className="text-white font-black text-xs leading-tight drop-shadow-lg">{active.name}</p>
                      <p className="text-white/50 text-[10px] mt-0.5 flex items-center gap-1"><User2 className="w-2.5 h-2.5" />{moment.user}</p>
                    </div>
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.7)' }}>
                      {active.type === 'video' ? <Video className="w-2.5 h-2.5" /> : <Camera className="w-2.5 h-2.5" />}
                      {active.type}
                    </div>
                  </div>
                );
              })()}

              {/* Thumbnail strip */}
              {moment.extras && moment.extras.length > 0 && (
                <div className="flex gap-1 px-2 pt-3 pb-1">
                  {/* Main thumbnail */}
                  <div
                    onClick={() => setActiveMedia(prev => ({ ...prev, [moment.id]: { url: moment.url, type: moment.type, name: moment.name } }))}
                    className="relative rounded-md overflow-hidden cursor-pointer group flex-1"
                    style={{ aspectRatio: '16/9', outline: !activeMedia[moment.id] ? '2px solid rgba(34,211,238,0.7)' : '2px solid transparent' }}
                  >
                    <img src={moment.url} alt={moment.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/35 group-hover:bg-black/10 transition-all" />
                  </div>
                  {moment.extras.map((ex, ei) => {
                    const isActive = activeMedia[moment.id]?.url === ex.url;
                    return (
                      <div
                        key={ei}
                        onClick={() => setActiveMedia(prev => ({ ...prev, [moment.id]: ex }))}
                        className="relative rounded-md overflow-hidden cursor-pointer group flex-1"
                        style={{ aspectRatio: '16/9', outline: isActive ? '2px solid rgba(34,211,238,0.7)' : '2px solid transparent' }}
                      >
                        {ex.type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <Video className="w-3 h-3 text-white/50" />
                          </div>
                        ) : (
                          <img src={ex.url} alt={ex.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        )}
                        <div className="absolute inset-0 bg-black/35 group-hover:bg-black/10 transition-all" />
                        <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)' }}>
                          <p className="text-white/70 text-[7px] font-semibold truncate leading-tight">{ex.name}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Like / Dislike row */}
              <div className="flex items-center gap-2 px-2 pb-2 pt-1">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => handleLike(moment.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${likedMoments[moment.id] ? 'text-cyan-300' : 'text-white/40 hover:text-white/70'}`}
                  style={{ background: likedMoments[moment.id] ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${likedMoments[moment.id] ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.08)'}` }}
                >
                  <ThumbsUp className="w-3 h-3" /> {moment.likes}
                </motion.button>
                <button className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-white/30 hover:text-white/60 transition-all" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <ThumbsUp className="w-3 h-3 rotate-180" />
                </button>
                <button
                  onClick={() => setOpenComment(openComment === moment.id ? null : moment.id)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-white/40 hover:text-white/70 transition-all ml-auto"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <MessageCircle className="w-3 h-3" /> {moment.comments.length} replies
                </button>
              </div>
            </div>

            {/* RIGHT: comments panel */}
            <div className="flex-1 flex flex-col border-l" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}>
              <div className="flex-1 overflow-y-auto px-3 pt-3 pb-2 space-y-2" style={{ scrollbarWidth: 'none' }}>
                {moment.comments.length === 0 ? (
                  <p className="text-white/20 text-xs text-center mt-4">No replies yet — be first!</p>
                ) : (
                  moment.comments.map((c, ci) => (
                    <div key={ci} className="flex items-start gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5" style={{ background: `hsl(${ci * 80 + 40},55%,28%)` }}>{c.user[0]}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white/70 text-[10px] font-bold mb-0.5">{c.user}</p>
                        <p className="text-white/80 text-xs leading-relaxed">{c.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Comment input */}
              <div className="px-3 pb-3 pt-2 mt-auto">
                <div className="flex gap-1.5">
                  <textarea
                    placeholder="Share your thoughts… 😄"
                    value={openComment === moment.id ? commentDraft : ''}
                    onChange={e => { setOpenComment(moment.id); setCommentDraft(e.target.value); }}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAddComment(moment.id)}
                    rows={2}
                    className="flex-1 px-2.5 py-1.5 rounded-lg text-[11px] text-white/80 placeholder-white/25 bg-white/5 border border-white/10 outline-none focus:border-cyan-400/40 resize-none leading-relaxed"
                  />
                  <button onClick={() => handleAddComment(moment.id)} className="px-2.5 py-1.5 rounded-lg text-cyan-400 hover:text-cyan-200 transition-all self-end" style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)' }}>
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      ))}
    </div>
  );
}