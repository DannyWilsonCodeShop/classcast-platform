/**
 * Smart video loading hook for optimal first video performance
 * Balances variety with caching and fast first load
 */

import { useState, useEffect, useMemo } from 'react';

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

interface SmartLoadingOptions {
  prioritizeUngraded?: boolean;
  varietyFactor?: number; // 0-1, how much to randomize vs optimize
  cacheAwareness?: boolean;
}

export function useSmartVideoLoading(
  submissions: VideoSubmission[],
  options: SmartLoadingOptions = {}
) {
  const {
    prioritizeUngraded = true,
    varietyFactor = 0.3,
    cacheAwareness = true
  } = options;

  const [loadedVideos, setLoadedVideos] = useState<Set<string>>(new Set());
  const [priorityOrder, setPriorityOrder] = useState<VideoSubmission[]>([]);

  // Smart ordering algorithm
  const smartOrderedSubmissions = useMemo(() => {
    if (submissions.length === 0) return [];

    // Step 1: Separate by priority criteria
    const ungraded = submissions.filter(s => s.status === 'submitted');
    const graded = submissions.filter(s => s.status === 'graded');
    
    // Step 2: Score each submission for optimal first load
    const scoreSubmission = (submission: VideoSubmission): number => {
      let score = 0;
      
      // Priority: Ungraded submissions first (if enabled)
      if (prioritizeUngraded && submission.status === 'submitted') {
        score += 100;
      }
      
      // Cache-friendly: Prefer smaller file types that load faster
      if (cacheAwareness) {
        // YouTube videos load fastest (iframe, cached by Google)
        if (submission.videoUrl?.includes('youtube.com') || submission.videoUrl?.includes('youtu.be')) {
          score += 50;
        }
        // Google Drive videos are medium speed
        else if (submission.videoUrl?.includes('drive.google.com')) {
          score += 30;
        }
        // S3 videos depend on size and caching
        else {
          score += 10;
        }
      }
      
      // Recency: Slightly prefer newer submissions
      const daysSinceSubmission = (Date.now() - new Date(submission.submittedAt).getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 20 - daysSinceSubmission); // Up to 20 points for recent submissions
      
      // Variety: Add some randomness to prevent always showing the same first video
      if (varietyFactor > 0) {
        score += Math.random() * varietyFactor * 50;
      }
      
      return score;
    };

    // Step 3: Sort by score (highest first)
    const scoredSubmissions = submissions.map(submission => ({
      submission,
      score: scoreSubmission(submission)
    }));

    scoredSubmissions.sort((a, b) => b.score - a.score);

    // Step 4: Apply final ordering strategy
    const ordered = scoredSubmissions.map(item => item.submission);
    
    // Ensure variety: If same student appears in top 3, spread them out
    const diversified = [...ordered];
    const seenStudents = new Set<string>();
    const topPositions = Math.min(5, diversified.length);
    
    for (let i = 0; i < topPositions; i++) {
      const submission = diversified[i];
      if (seenStudents.has(submission.studentId)) {
        // Find a different student to swap with
        for (let j = i + 1; j < diversified.length; j++) {
          if (!seenStudents.has(diversified[j].studentId)) {
            [diversified[i], diversified[j]] = [diversified[j], diversified[i]];
            break;
          }
        }
      }
      seenStudents.add(diversified[i].studentId);
    }

    return diversified;
  }, [submissions, prioritizeUngraded, varietyFactor, cacheAwareness]);

  // Track which videos should be loaded immediately vs lazy loaded
  const getLoadingStrategy = (index: number) => {
    if (index === 0) return 'immediate'; // Always load first video immediately
    if (index <= 2) return 'priority'; // Load top 3 with high priority
    if (index <= 5) return 'normal'; // Load next few normally
    return 'lazy'; // Lazy load the rest
  };

  // Preload strategy for optimal performance
  useEffect(() => {
    if (smartOrderedSubmissions.length > 0) {
      // Mark first video as priority for immediate loading
      const firstSubmission = smartOrderedSubmissions[0];
      setLoadedVideos(prev => new Set(prev).add(firstSubmission.submissionId));
      
      // Preload next 2 videos after a short delay
      setTimeout(() => {
        const nextSubmissions = smartOrderedSubmissions.slice(1, 3);
        setLoadedVideos(prev => {
          const newSet = new Set(prev);
          nextSubmissions.forEach(sub => newSet.add(sub.submissionId));
          return newSet;
        });
      }, 1000);
    }
  }, [smartOrderedSubmissions]);

  return {
    orderedSubmissions: smartOrderedSubmissions,
    loadedVideos,
    getLoadingStrategy,
    markVideoLoaded: (submissionId: string) => {
      setLoadedVideos(prev => new Set(prev).add(submissionId));
    },
    isVideoLoaded: (submissionId: string) => loadedVideos.has(submissionId)
  };
}