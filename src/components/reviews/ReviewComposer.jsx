import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Send, Trophy, Clock } from 'lucide-react';

const REVIEW_TAGS = [
  { id: 'gameplay', label: 'Gameplay' },
  { id: 'story', label: 'Story' },
  { id: 'difficulty', label: 'Difficulty' },
  { id: 'performance', label: 'Performance' },
  { id: 'replay_value', label: 'Replay Value' },
];

const RECOMMENDATION_TYPES = [
  { id: 'achievement_hunters', label: 'Achievement Hunters' },
  { id: 'story_players', label: 'Story Players' },
  { id: 'competitive', label: 'Competitive Players' },
  { id: 'casual', label: 'Casual Gamers' },
];

export default function ReviewComposer({ 
  onSubmit, 
  isAuthenticated,
  user,
  userStats = { achievements: 0, playTime: '0h' }
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [recommendFor, setRecommendFor] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTag = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  const toggleRecommendation = (recId) => {
    setRecommendFor(prev => 
      prev.includes(recId) 
        ? prev.filter(r => r !== recId)
        : [...prev, recId]
    );
  };

  const handleSubmit = async () => {
    if (!rating || !content.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        rating,
        content,
        tags: selectedTags,
        recommend_for: recommendFor
      });
      // Reset form
      setRating(0);
      setContent('');
      setSelectedTags([]);
      setRecommendFor([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div 
        className="rounded-2xl p-6 text-center"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <p className="text-white/60 text-sm">Sign in to share your review</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}
    >
      <div className="p-5 space-y-4">
        {/* Header with User Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border border-cyan-400/30 flex items-center justify-center">
              <span className="text-cyan-300 text-sm font-bold">
                {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-white text-sm font-medium">
                {user?.full_name || user?.email?.split('@')[0] || 'You'}
              </p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1 text-white/40 text-xs">
                  <Trophy className="w-3 h-3" />
                  {userStats.achievements} Achievements
                </span>
                <span className="flex items-center gap-1 text-white/40 text-xs">
                  <Clock className="w-3 h-3" />
                  {userStats.playTime} Played
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Star Rating */}
        <div>
          <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Your Rating</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-all hover:scale-110 p-0.5"
              >
                <Star 
                  className={`w-7 h-7 transition-colors ${
                    star <= (hoverRating || rating) 
                      ? 'text-yellow-400 fill-yellow-400' 
                      : 'text-white/20'
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-white/60 text-sm">
                {rating === 5 && 'Outstanding'}
                {rating === 4 && 'Great'}
                {rating === 3 && 'Good'}
                {rating === 2 && 'Fair'}
                {rating === 1 && 'Poor'}
              </span>
            )}
          </div>
        </div>

        {/* Review Tags */}
        <div>
          <p className="text-white/40 text-xs uppercase tracking-wider mb-2">What stands out?</p>
          <div className="flex flex-wrap gap-2">
            {REVIEW_TAGS.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  selectedTags.includes(tag.id)
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                    : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/70'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Review Text */}
        <div>
          <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Your Review</p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your experience with this game..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 resize-none h-28 focus:outline-none focus:border-cyan-400/40 text-sm leading-relaxed transition-colors"
          />
        </div>

        {/* Recommend For (Optional) */}
        <div>
          <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Recommend for (optional)</p>
          <div className="flex flex-wrap gap-2">
            {RECOMMENDATION_TYPES.map((rec) => (
              <button
                key={rec.id}
                onClick={() => toggleRecommendation(rec.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  recommendFor.includes(rec.id)
                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                    : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/70'
                }`}
              >
                {rec.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!rating || !content.trim() || isSubmitting}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
            rating && content.trim() && !isSubmitting
              ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30'
              : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </motion.div>
  );
}