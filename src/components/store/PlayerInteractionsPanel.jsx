import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, MessageCircle, Send } from 'lucide-react';

const MOCK_INTERACTIONS = [
  {
    id: 1,
    playerName: 'XenoMaster92',
    avatar: 'https://i.pravatar.cc/48?img=1',
    videoUrl: 'https://images.unsplash.com/photo-1538481143081-9849ae14de52?w=400&h=300&fit=crop',
    title: 'Sick headshot combo!',
    likes: 342,
    dislikes: 12,
    userReaction: null,
    comments: [
      { id: 1, author: 'Luna', text: 'That was insane!', likes: 28, dislikes: 1 },
      { id: 2, author: 'VortexKing', text: 'Nah, luck', likes: 5, dislikes: 12 },
      { id: 3, author: 'ShadowNyx', text: 'Can we get the settings?', likes: 45, dislikes: 2 },
    ]
  },
  {
    id: 2,
    playerName: 'PixelDreamer',
    avatar: 'https://i.pravatar.cc/48?img=2',
    videoUrl: 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400&h=300&fit=crop',
    title: 'First time beating the boss!',
    likes: 512,
    dislikes: 8,
    userReaction: null,
    comments: [
      { id: 1, author: 'ProGamer23', text: 'Great job! What build did you use?', likes: 67, dislikes: 0 },
      { id: 2, author: 'NeonRage', text: 'Congrats!', likes: 89, dislikes: 3 },
    ]
  },
  {
    id: 3,
    playerName: 'CyberNova',
    avatar: 'https://i.pravatar.cc/48?img=3',
    videoUrl: 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=400&h=300&fit=crop',
    title: 'Epic speedrun attempt',
    likes: 723,
    dislikes: 15,
    userReaction: null,
    comments: [
      { id: 1, author: 'SpeedRunner', text: 'So close to WR!', likes: 102, dislikes: 1 },
    ]
  },
];

export default function PlayerInteractionsPanel() {
  const [interactions, setInteractions] = useState(MOCK_INTERACTIONS);
  const [activeInteractionId, setActiveInteractionId] = useState(MOCK_INTERACTIONS[0].id);
  const [newComment, setNewComment] = useState('');
  const [commentReactions, setCommentReactions] = useState({});

  const activeInteraction = interactions.find(i => i.id === activeInteractionId);

  const handleScroll = (direction) => {
    const currentIndex = interactions.findIndex(i => i.id === activeInteractionId);
    if (direction === 'down' && currentIndex < interactions.length - 1) {
      setActiveInteractionId(interactions[currentIndex + 1].id);
    } else if (direction === 'up' && currentIndex > 0) {
      setActiveInteractionId(interactions[currentIndex - 1].id);
    }
  };

  const handleLikeInteraction = () => {
    setInteractions(interactions.map(i => 
      i.id === activeInteractionId 
        ? { 
            ...i, 
            likes: i.userReaction === 'like' ? i.likes - 1 : i.likes + 1,
            dislikes: i.userReaction === 'dislike' ? i.dislikes - 1 : i.dislikes,
            userReaction: i.userReaction === 'like' ? null : 'like'
          }
        : i
    ));
  };

  const handleDislikeInteraction = () => {
    setInteractions(interactions.map(i => 
      i.id === activeInteractionId 
        ? { 
            ...i, 
            dislikes: i.userReaction === 'dislike' ? i.dislikes - 1 : i.dislikes + 1,
            likes: i.userReaction === 'like' ? i.likes - 1 : i.likes,
            userReaction: i.userReaction === 'dislike' ? null : 'dislike'
          }
        : i
    ));
  };

  const handleCommentReaction = (commentId, reactionType) => {
    const key = `${activeInteractionId}-${commentId}`;
    const current = commentReactions[key];
    setCommentReactions(prev => ({
      ...prev,
      [key]: current === reactionType ? null : reactionType
    }));
  };

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    setInteractions(interactions.map(i =>
      i.id === activeInteractionId
        ? {
            ...i,
            comments: [
              ...i.comments,
              { id: i.comments.length + 1, author: 'You', text: newComment, likes: 0, dislikes: 0 }
            ]
          }
        : i
    ));
    setNewComment('');
  };

  if (!activeInteraction) return null;

  return (
    <div className="w-[30%] flex-shrink-0 h-full flex flex-col overflow-hidden bg-black/30 backdrop-blur-sm border-l border-white/10">
      {/* Video/Interaction Section */}
      <motion.div
        key={activeInteraction.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="flex-shrink-0 p-4 space-y-3"
      >
        {/* Player Info + Video */}
        <div 
          className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group"
          onWheel={(e) => {
            e.preventDefault();
            handleScroll(e.deltaY > 0 ? 'down' : 'up');
          }}
        >
          <img 
            src={activeInteraction.videoUrl} 
            alt={activeInteraction.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-3">
            <div className="flex items-center gap-2 mb-2">
              <img 
                src={activeInteraction.avatar} 
                alt={activeInteraction.playerName}
                className="w-8 h-8 rounded-full"
              />
              <div>
                <p className="text-white text-sm font-bold">{activeInteraction.playerName}</p>
                <p className="text-white/70 text-xs">{activeInteraction.title}</p>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/40">
            <p className="text-white/70 text-xs text-center">Scroll to next</p>
          </div>
        </div>

        {/* Like/Dislike Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLikeInteraction}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeInteraction.userReaction === 'like'
                ? 'bg-green-500/30 text-green-300 border border-green-400/50'
                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            {activeInteraction.likes}
          </button>
          <button
            onClick={handleDislikeInteraction}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeInteraction.userReaction === 'dislike'
                ? 'bg-red-500/30 text-red-300 border border-red-400/50'
                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            {activeInteraction.dislikes}
          </button>
        </div>
      </motion.div>

      {/* Comments Section */}
      <div className="flex-1 flex flex-col overflow-hidden border-t border-white/10">
        {/* Comments List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Comments</p>
          <AnimatePresence mode="popLayout">
            {activeInteraction.comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white/5 rounded-lg p-3 border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-white text-xs font-bold">{comment.author}</p>
                </div>
                <p className="text-white/80 text-xs mb-2">{comment.text}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCommentReaction(comment.id, 'like')}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                      commentReactions[`${activeInteraction.id}-${comment.id}`] === 'like'
                        ? 'text-green-400'
                        : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    {comment.likes}
                  </button>
                  <button
                    onClick={() => handleCommentReaction(comment.id, 'dislike')}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                      commentReactions[`${activeInteraction.id}-${comment.id}`] === 'dislike'
                        ? 'text-red-400'
                        : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    <ThumbsDown className="w-3 h-3" />
                    {comment.dislikes}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Comment Input */}
        <div className="flex-shrink-0 p-4 border-t border-white/10">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all"
            />
            <button
              onClick={handlePostComment}
              disabled={!newComment.trim()}
              className="bg-cyan-600/20 hover:bg-cyan-600/30 disabled:opacity-50 disabled:cursor-not-allowed border border-cyan-400/30 hover:border-cyan-400/50 text-cyan-300 p-1.5 rounded-lg transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}