/**
 * Virtualized feed component for student dashboard
 * Only renders visible videos for optimal performance
 */

import React, { useRef, useEffect, useState } from 'react';
import { FeedItem } from '@/app/api/student/feed/route';

interface VirtualizedFeedProps {
  feedItems: FeedItem[];
  renderItem: (item: FeedItem, index: number) => React.ReactNode;
  itemHeight?: number;
  overscan?: number;
}

const DEFAULT_VIDEO_HEIGHT = 600; // Approximate height of video items
const DEFAULT_COMMUNITY_HEIGHT = 200; // Approximate height of community posts
const DEFAULT_OVERSCAN = 3; // Render 3 extra items above and below

// Function to calculate item height based on type
const getItemHeight = (item: FeedItem): number => {
  switch (item.type) {
    case 'video':
      return DEFAULT_VIDEO_HEIGHT;
    case 'community':
      // Dynamic height based on content length
      const contentLength = (item.content || '').length;
      const baseHeight = 150; // Base height for header and actions
      const contentHeight = Math.max(50, Math.min(300, contentLength * 0.8)); // Estimate based on content
      return baseHeight + contentHeight;
    case 'assignment':
      return 250; // Medium height for assignments
    default:
      return DEFAULT_VIDEO_HEIGHT;
  }
};

export const VirtualizedFeed: React.FC<VirtualizedFeedProps> = ({
  feedItems,
  renderItem,
  itemHeight, // This will be ignored in favor of dynamic heights
  overscan = DEFAULT_OVERSCAN
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(800);
  const [scrollTop, setScrollTop] = useState(0);
  
  // Update container height on window resize
  useEffect(() => {
    const updateHeight = () => {
      if (typeof window !== 'undefined') {
        setContainerHeight(window.innerHeight - 200); // Account for header/nav
      }
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Calculate cumulative heights for each item
  const itemHeights = feedItems.map(getItemHeight);
  const cumulativeHeights = itemHeights.reduce((acc, height, index) => {
    acc[index] = (acc[index - 1] || 0) + height;
    return acc;
  }, [] as number[]);
  
  const totalHeight = cumulativeHeights[cumulativeHeights.length - 1] || 0;

  // Calculate visible items based on scroll position
  const getVisibleItems = () => {
    const startY = scrollTop;
    const endY = scrollTop + containerHeight;
    
    // Find first visible item
    let startIndex = 0;
    for (let i = 0; i < cumulativeHeights.length; i++) {
      if (cumulativeHeights[i] > startY) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
    }
    
    // Find last visible item
    let endIndex = feedItems.length - 1;
    for (let i = startIndex; i < cumulativeHeights.length; i++) {
      if ((cumulativeHeights[i - 1] || 0) > endY) {
        endIndex = Math.min(feedItems.length - 1, i + overscan);
        break;
      }
    }
    
    return { startIndex, endIndex };
  };

  const { startIndex, endIndex } = getVisibleItems();
  const visibleItems = feedItems.slice(startIndex, endIndex + 1);
  
  // Calculate offset for visible items
  const offsetY = startIndex > 0 ? cumulativeHeights[startIndex - 1] : 0;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Total height spacer for scrollbar */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          <div className="space-y-0 video-feed">
            {visibleItems.map((item, index) => {
              const actualIndex = startIndex + index;
              const itemHeight = itemHeights[actualIndex];
              return (
                <div
                  key={item.id}
                  style={{ height: itemHeight }}
                  className="mb-0"
                >
                  {renderItem(item, actualIndex)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

