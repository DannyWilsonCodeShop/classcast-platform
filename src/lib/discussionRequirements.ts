/**
 * Single source of truth for discussion participation requirements and counting.
 * Pure: no AWS imports.
 */

export interface RequirementsConfig {
  minPosts?: number;
  minReplies?: number;
}

export interface CountablePost {
  postId: string;
  authorId: string;
  parentPostId?: string | null;
  hidden?: boolean;
  wordCount?: number;
}

export interface Requirements {
  postsRequired: number;
  repliesRequired: number;
  /** Legacy record (no minReplies): minPosts counts posts + replies combined. */
  legacy: boolean;
}

export interface Participation {
  studentId: string;
  postCount: number;
  replyCount: number;
  totalWordCount: number;
  postsRequired: number;
  repliesRequired: number;
  legacy: boolean;
  postsMet: boolean;
  repliesMet: boolean;
  requirementsMet: boolean;
}

const DEFAULT_MIN_POSTS = 2;

export function getRequirements(config?: RequirementsConfig | null): Requirements {
  const minPosts = typeof config?.minPosts === 'number' ? config.minPosts : DEFAULT_MIN_POSTS;
  const hasReplies = typeof config?.minReplies === 'number';
  return {
    postsRequired: minPosts,
    repliesRequired: hasReplies ? (config!.minReplies as number) : 0,
    legacy: !hasReplies,
  };
}

export function computeParticipation(
  posts: CountablePost[],
  authorId: string,
  config?: RequirementsConfig | null
): Participation {
  const req = getRequirements(config);
  const visible = posts.filter(p => !p.hidden);
  const byId = new Map(visible.map(p => [p.postId, p]));
  const mine = visible.filter(p => p.authorId === authorId);

  let postCount: number;
  let replyCount: number;
  let postsMet: boolean;
  let repliesMet: boolean;

  if (req.legacy) {
    postCount = mine.length;
    replyCount = 0;
    postsMet = postCount >= req.postsRequired;
    repliesMet = true;
  } else {
    postCount = mine.filter(p => !p.parentPostId).length;
    replyCount = mine.filter(p => {
      if (!p.parentPostId) return false;
      const parent = byId.get(p.parentPostId);
      return !!parent && parent.authorId !== authorId;
    }).length;
    postsMet = postCount >= req.postsRequired;
    repliesMet = replyCount >= req.repliesRequired;
  }

  return {
    studentId: authorId,
    postCount,
    replyCount,
    totalWordCount: mine.reduce((sum, p) => sum + (p.wordCount || 0), 0),
    postsRequired: req.postsRequired,
    repliesRequired: req.repliesRequired,
    legacy: req.legacy,
    postsMet,
    repliesMet,
    requirementsMet: postsMet && repliesMet,
  };
}
