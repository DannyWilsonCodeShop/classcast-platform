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
  );
};

