/**
 * Discussion Board types for ClassCast
 */

export interface DiscussionConfig {
  prompt: string;
  format: 'whole-class' | 'small-groups';
  groupSize?: number;                    // 3–10, only when format === 'small-groups'
  allowedResponseTypes: 'text' | 'video' | 'both';
  minPosts: number;                      // 1–50
  minWordCount: number;                  // 0–1000
  maxVideoDurationSeconds: number;       // default: 120
}

export interface DiscussionPost {
  postId: string;
  discussionId: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  parentPostId: string | null;
  content: string;
  videoUrl: string | null;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DiscussionGroup {
  groupId: string;
  discussionId: string;
  studentIds: string[];
  groupSize: number;
}

export interface ParticipationSummary {
  studentId: string;
  postCount: number;
  totalWordCount: number;
  requirementsMet: boolean;
}
