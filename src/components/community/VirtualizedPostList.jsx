import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import PostCard from './PostCard';
import FeedPost from './FeedPost';

export default function VirtualizedPostList({ 
  posts, 
  selectedPost, 
  onVote, 
  onSelect 
}) {
  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: posts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated height per post
    overscan: 5, // Render 5 extra items outside viewport
  });

  return (
    <div
      ref={parentRef}
      className="h-full overflow-auto"
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const post = posts[virtualRow.index];
          
          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="pb-3"
            >
              {post.type === 'achievement_share' || post.type === 'challenge' ? (
                <FeedPost 
                  post={post} 
                  onVote={onVote} 
                  onShare={() => {}}
                />
              ) : (
                <PostCard
                  post={post}
                  onVote={onVote}
                  onSelect={() => onSelect(post)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}