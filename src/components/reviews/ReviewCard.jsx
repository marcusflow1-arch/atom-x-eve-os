import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, Trophy, Clock, ChevronDown, ChevronUp } from 'lucide-react';

// Mock badges based on player type
const PLAYER_BADGES = {
  'achievement_hunter': { label: 'Achievement Hunter', color: 'text-yellow-400' },
  'story_focused': { label: 'Story Focused', color: 'text-purple-400' },
  'competitive': { label: 'Competitive', color: 'text-red-400' },
  'completionist': { label: 'Completionist', color: 'text-cyan-400' },
};

// Review tag colors
const TAG_COLORS = {
  gameplay: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
  story: 'bg-purple-500/20 border-purple-500/30 text-purple-300',
  difficulty: 'bg-orange-500/20 border-orange-500/30 text-orange-300',
  performance: 'bg-green-500/20 border-green-500/30 text-green-300',
  replay_value: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300',
};

export default function ReviewCard({ 
  review, 
  variant = 'default', // 'default' | 'compact'
  onReact,
  userReaction,
  isAuthenticated
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Mock credibility data (in production, this would come from the review/user)
  const achievementCount = review.achievement_count || Math.floor(Math.random() * 50) + 5;
  const playTime = review.play_time || `${Math.floor(Math.random() * 100) + 10}h`;
  const badge = review.badge || Object.keys(PLAYER_BADGES)[Math.floor(Math.random() * 4)];
  const tags = review.tags || ['gameplay', 'story'].slice(0, Math.floor(Math.random() * 3) + 1);
  
  const isLongContent = review.content && review.content.length > 150;
  const displayContent = isExpanded || !isLongContent 
    ? review.content 
    : review.content.slice(0, 150) + '...';

  const badgeInfo = PLAYER_BADGES[badge];

  if (variant === 'compact') {
    return (
      <motion.div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative group rounded-xl overflow-hidden transition-all duration-300 cursor-pointer"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${isHovered ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)'}`,
          boxShadow: isHovered ? '0 0 20px rgba(100, 200, 255, 0.1)' : 'none'
        }}
      >
        <div className="p-4">
          {/* Top Row: Avatar + Name + Rating */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {/* Avatar with status ring */}
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border border-cyan-400/30 flex items-center justify-center">
                  <span className="text-cyan-300 text-xs font-bold">
                    {(review.created_by || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-400 border border-[#0d0d0d]" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate max-w-[100px]">
                  {review.created_by?.split('@')[0] || 'Player'}
                </p>
              </div>
            </div>
            {/* Star Rating */}
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i}
                  className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/10'}`}
                />
              ))}
            </div>
          </div>

          {/* Review Excerpt */}
          <p className="text-white/60 text-xs leading-relaxed line-clamp-2 mb-2">
            {review.content}
          </p>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 2).map((tag) => (
                <span 
                  key={tag}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${TAG_COLORS[tag] || 'bg-white/10 border-white/20 text-white/60'}`}
                >
                  {tag.replace('_', ' ')}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${isHovered ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)'}`,
        boxShadow: isHovered ? '0 0 30px rgba(100, 200, 255, 0.1)' : 'none'
      }}
    >
      <div className="p-5">
        {/* Top Row: Identity + Rating */}
        <div className="flex items-start justify-between mb-3">
          {/* Left: Avatar + Name + Badge */}
          <div className="flex items-center gap-3">
            {/* Avatar with status ring */}
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border-2 border-cyan-400/30 flex items-center justify-center">
                <span className="text-cyan-300 text-base font-bold">
                  {(review.created_by || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-blue-400 border-2 border-[#0d0d0d]" />
            </div>
            
            <div>
              {/* Player Name */}
              <div className="flex items-center gap-2">
                <p className="text-white font-medium">
                  {review.created_by?.split('@')[0] || 'Anonymous Player'}
                </p>
                {/* Badge */}
                {badgeInfo && (
                  <span className={`text-[10px] font-medium ${badgeInfo.color}`}>
                    {badgeInfo.label}
                  </span>
                )}
              </div>
              
              {/* Credibility Line */}
              <div className="flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1 text-white/40 text-xs">
                  <Trophy className="w-3 h-3" />
                  {achievementCount} Achievements
                </span>
                <span className="flex items-center gap-1 text-white/40 text-xs">
                  <Clock className="w-3 h-3" />
                  {playTime} Played
                </span>
              </div>
            </div>
          </div>

          {/* Right: Star Rating */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i}
                  className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/15'}`}
                />
              ))}
            </div>
            {review.rating >= 4 && (
              <span className="text-[10px] text-green-400 font-medium">Highly Recommended</span>
            )}
            {review.rating === 3 && (
              <span className="text-[10px] text-yellow-400 font-medium">Mixed</span>
            )}
            {review.rating <= 2 && (
              <span className="text-[10px] text-orange-400 font-medium">For Hardcore Only</span>
            )}
          </div>
        </div>

        {/* Review Content */}
        <div className="mb-3">
          <p className="text-white/80 text-sm leading-relaxed">
            {displayContent}
          </p>
          {isLongContent && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 mt-2 text-cyan-400 text-xs hover:text-cyan-300 transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Read more
                </>
              )}
            </button>
          )}
        </div>

        {/* Tag Chips */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.map((tag) => (
              <span 
                key={tag}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${TAG_COLORS[tag] || 'bg-white/10 border-white/20 text-white/60'}`}
              >
                {tag.charAt(0).toUpperCase() + tag.slice(1).replace('_', ' ')}
              </span>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onReact?.(review.id, 'agree')}
              disabled={!isAuthenticated}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all text-xs ${
                userReaction === 'agree' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
              } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${userReaction === 'agree' ? 'fill-green-400' : ''}`} />
              Helpful
            </button>
            <button 
              onClick={() => onReact?.(review.id, 'disagree')}
              disabled={!isAuthenticated}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all text-xs ${
                userReaction === 'disagree' 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
              } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 rotate-180 ${userReaction === 'disagree' ? 'fill-red-400' : ''}`} />
              Not Helpful
            </button>
          </div>
          
          <span className="text-white/30 text-[10px]">
            {new Date(review.created_date).toLocaleDateString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}