/**
 * Virtualized feed component for student dashboard
 * Only renders visible videos for optimal performance
 */

import React, { useRef, useEffect, useState } from 'react';
import { useVirtualizedGrading } from '@/hooks/useVirtualizedGrading';
import { FeedItem } from '@/app/api/student/feed/route';

interface VirtualizedFeedProps {
  feedItems: FeedItem[];
  renderItem: (item: FeedItem, index: number) => React.ReactNode;
  itemHeight?: number;
  overscan?: number;
}

const DEFAULT_ITEM_HEIGHT = 600; // Approximate height of each feed item
const DEFAULT_OVERSCAN = 3; // Render 3 extra items above and below

export const VirtualizedFeed: React.FC<VirtualizedFeedProps> = ({
  feedItems,
  renderItem,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  overscan = DEFAULT_OVERSCAN
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(800);
  
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

  // Transform FeedItems to match VideoSubmission interface for the hook
  const transformedSubmissions = feedItems.map((item, index) => ({
    submissionId: item.id || `item-${index}`,
    studentId: item.author?.id || 'unknown',
    studentName: item.author?.name || 'Unknown User',
    studentEmail: item.author?.id || 'unknown@example.com',
    videoUrl: item.videoUrl || '',
    thumbnailUrl: item.thumbnailUrl,
    submittedAt: item.timestamp,
    duration: 0,
    fileSize: 0,
    grade: undefined,
    feedback: undefined,
    status: 'submitted' as const,
    sectionId: item.courseId,
    sectionName: item.courseName
  }));

  const {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    isScrolling,
    renderedCount,
    totalCount,
    renderRatio
  } = useVirtualizedGrading(transformedSubmissions, {
    itemHeight,
    overscan,
    containerHeight
  });

  // Map back to original feed items
  const visibleFeedItems = visibleItems.map(item => {
    const originalIndex = transformedSubmissions.findIndex(t => t.submissionId === item.submissionId);
    return {
      ...feedItems[originalIndex],
      virtualIndex: item.absoluteIndex
    };
  });

  return (
    <div className="space-y-4">
      {/* Performance indicator */}
      <div className="flex items-center justify-between text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg">
        <div className="flex items-center space-x-4">
          <span>🚀 Virtualized feed</span>
          <span>📊 Showing {renderedCount} of {totalCount} videos</span>
          <span>⚡ {(renderRatio * 100).toFixed(1)}% DOM usage</span>
        </div>
        {isScrolling && (
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Scrolling...</span>
          </div>
        )}
      </div>

      {/* Virtualized container */}
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
              {visibleFeedItems.map((item, index) => (
                <div
                  key={item.id}
                  style={{ minHeight: itemHeight }}
                  className="mb-0"
                >
                  {renderItem(item, item.virtualIndex || index)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Performance stats */}
      <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded">
        💡 Performance: Only rendering {renderedCount} videos instead of {totalCount} 
        ({totalCount > 0 ? Math.round((1 - renderRatio) * 100) : 0}% reduction in DOM nodes)
        {totalCount > 20 && (
          <span className="ml-2 text-green-600 font-medium">
            🎯 Major performance boost for large feeds!
          </span>
        )}
      </div>
    </div>
  );
};

// Hook for easy integration with existing feed logic
export const useVirtualizedFeed = (feedItems: FeedItem[]) => {
  const [isVirtualized, setIsVirtualized] = useState(feedItems.length > 10);
  
  useEffect(() => {
    // Auto-enable virtualization for feeds with more than 10 items
    setIsVirtualized(feedItems.length > 10);
  }, [feedItems.length]);
  
  return {
    isVirtualized,
    shouldVirtualize: feedItems.length > 10,
    toggleVirtualization: () => setIsVirtualized(!isVirtualized),
    feedCount: feedItems.length
  };
};