import React from 'react';
import { Star, TrendingUp, MessageSquare } from 'lucide-react';

const TAG_LABELS = {
  gameplay: 'Gameplay',
  story: 'Story',
  difficulty: 'Difficulty',
  performance: 'Performance',
  replay_value: 'Replay Value',
};

export default function ReviewInsights({ reviews = [] }) {
  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 
      : 0
  }));

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '0.0';

  // Calculate most common tags (mock data for now)
  const tagCounts = {};
  reviews.forEach(review => {
    const tags = review.tags || ['gameplay', 'story'].slice(0, Math.floor(Math.random() * 3));
    tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  
  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Find highlighted review (most helpful - mock for now)
  const highlightedReview = reviews.length > 0 
    ? reviews.reduce((best, current) => 
        (current.content?.length > (best?.content?.length || 0)) ? current : best
      , reviews[0])
    : null;

  if (reviews.length === 0) {
    return null;
  }

  return (
    <div 
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.06)'
      }}
    >
      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <h3 className="text-white font-medium text-sm">Review Insights</h3>
        </div>

        {/* Rating Overview */}
        <div className="flex items-center gap-6">
          {/* Average Score */}
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-1">{averageRating}</div>
            <div className="flex items-center justify-center gap-0.5 mb-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star}
                  className={`w-3 h-3 ${star <= Math.round(parseFloat(averageRating)) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`}
                />
              ))}
            </div>
            <p className="text-white/40 text-xs">{reviews.length} reviews</p>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 space-y-1.5">
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center gap-2">
                <span className="text-white/50 text-xs w-3">{rating}</span>
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-500/60 to-yellow-400/60 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-white/30 text-xs w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Common Tags */}
        {sortedTags.length > 0 && (
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Most Mentioned</p>
            <div className="flex flex-wrap gap-2">
              {sortedTags.map(([tag, count]) => (
                <div 
                  key={tag}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10"
                >
                  <span className="text-white/70 text-xs">{TAG_LABELS[tag] || tag}</span>
                  <span className="text-white/30 text-[10px]">({count})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Highlighted Review */}
        {highlightedReview && (
          <div className="pt-3 border-t border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-3 h-3 text-cyan-400" />
              <p className="text-white/40 text-xs uppercase tracking-wider">Most Helpful</p>
            </div>
            <p className="text-white/60 text-xs leading-relaxed italic line-clamp-2">
              "{highlightedReview.content}"
            </p>
            <p className="text-white/30 text-[10px] mt-1">
              — {highlightedReview.created_by?.split('@')[0] || 'Player'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}