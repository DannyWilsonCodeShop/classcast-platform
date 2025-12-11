/**
 * Virtualized grading hook - only renders visible submissions
 * Dramatically reduces DOM nodes and improves performance
 */

import { useState, useEffect, useMemo, useCallback } from 'react';

interface VideoSubmission {
  submissionId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  videoUrl: string;
  thumbnailUrl?: string;
  submittedAt: string;
  duration: number;
  fileSize: number;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded';
  sectionId?: string;
  sectionName?: string;
}

interface VirtualizedGradingOptions {
  itemHeight: number; // Height of each submission card
  overscan: number; // Number of items to render outside viewport
  containerHeight: number; // Height of the scrollable container
}

export function useVirtualizedGrading(
  submissions: VideoSubmission[],
  options: VirtualizedGradingOptions
) {
  const { itemHeight, overscan, containerHeight } = options;
  
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  
  // Calculate which items should be visible
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      submissions.length - 1
    );
    
    // Add overscan items
    const overscanStart = Math.max(0, startIndex - overscan);
    const overscanEnd = Math.min(submissions.length - 1, endIndex + overscan);
    
    return {
      start: overscanStart,
      end: overscanEnd,
      startIndex,
      endIndex
    };
  }, [scrollTop, itemHeight, containerHeight, submissions.length, overscan]);
  
  // Get only the visible items
  const visibleItems = useMemo(() => {
    return submissions.slice(visibleRange.start, visibleRange.end + 1).map((submission, index) => ({
      ...submission,
      virtualIndex: visibleRange.start + index,
      absoluteIndex: visibleRange.start + index
    }));
  }, [submissions, visibleRange]);
  
  // Calculate total height for scrollbar
  const totalHeight = submissions.length * itemHeight;
  
  // Calculate offset for visible items
  const offsetY = visibleRange.start * itemHeight;
  
  // Scroll handler with throttling
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    
    if (!isScrolling) {
      setIsScrolling(true);
    }
    
    // Debounce scrolling state
    const timeoutId = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
    
    return () => clearTimeout(timeoutId);
  }, [isScrolling]);
  
  // Get loading priority based on position relative to viewport
  const getLoadingPriority = useCallback((absoluteIndex: number) => {
    const viewportStart = Math.floor(scrollTop / itemHeight);
    const viewportEnd = viewportStart + Math.ceil(containerHeight / itemHeight);
    
    if (absoluteIndex === 0) return 'immediate'; // Always prioritize first item
    if (absoluteIndex >= viewportStart && absoluteIndex <= viewportEnd) return 'priority';
    if (absoluteIndex >= viewportStart - 1 && absoluteIndex <= viewportEnd + 1) return 'normal';
    return 'lazy';
  }, [scrollTop, itemHeight, containerHeight]);
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    getLoadingPriority,
    isScrolling,
    visibleRange,
    // Performance metrics
    renderedCount: visibleItems.length,
    totalCount: submissions.length,
    renderRatio: submissions.length > 0 ? (visibleItems.length / submissions.length) : 0
  };
}