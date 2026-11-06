/**
 * Discussion Board types for ClassCast
 */

export interface DiscussionConfig {
  prompt: string;
  format: 'whole-class' | 'small-groups';
  groupSize?: number;                    // 3–10, only when format === 'small-groups'
  allowedResponseTypes: 'text' | 'video' | 'both';
  minPosts: number;                      // 1–50, original (top-level) posts required
  minReplies?: number;                   // 0–50, replies to classmates required; undefined = legacy record where minPosts counts posts+replies
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
  links?: string[];            // explicit URLs attached to the post (also auto-linkified from content at render)
  imageUrl?: string | null;    // optional inline image attachment
  hidden?: boolean;            // moderation: soft-hide a post from the student view
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
  replyCount?: number;
  postsRequired?: number;
  repliesRequired?: number;
  legacy?: boolean;
  postsMet?: boolean;
  repliesMet?: boolean;
}
