import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, TrendingUp, Users, Clock } from 'lucide-react';
import ReviewCard from './ReviewCard';

const FEED_FILTERS = [
  { id: 'recent', label: 'Recent', icon: Clock },
  { id: 'top', label: 'Top Rated', icon: TrendingUp },
  { id: 'friends', label: 'Friends', icon: Users },
];

export default function LiveReviewFeed({ 
  reviews = [], 
  onReact,
  userReactions = {},
  isAuthenticated
}) {
  const [activeFilter, setActiveFilter] = useState('recent');

  // Sort reviews based on filter
  const sortedReviews = [...reviews].sort((a, b) => {
    if (activeFilter === 'recent') {
      return new Date(b.created_date) - new Date(a.created_date);
    }
    if (activeFilter === 'top') {
      return (b.rating || 0) - (a.rating || 0);
    }
    // Friends filter would require additional data
    return 0;
  });

  return (
    <div 
      className="h-full flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.06)'
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <h3 className="text-white font-medium text-sm">Live Reviews</h3>
          </div>
          <span className="text-white/30 text-xs">{reviews.length} total</span>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1">
          {FEED_FILTERS.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeFilter === filter.id
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3 h-3" />
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <AnimatePresence mode="popLayout">
          {sortedReviews.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <MessageSquare className="w-10 h-10 text-white/10 mb-3" />
              <p className="text-white/40 text-sm">No reviews yet</p>
              <p className="text-white/20 text-xs mt-1">Be the first to share your thoughts</p>
            </motion.div>
          ) : (
            sortedReviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
              >
                <ReviewCard
                  review={review}
                  variant="compact"
                  onReact={onReact}
                  userReaction={userReactions[review.id]}
                  isAuthenticated={isAuthenticated}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Live Indicator */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white/30 text-xs">Live updates enabled</span>
        </div>
      </div>
    </div>
  );
}