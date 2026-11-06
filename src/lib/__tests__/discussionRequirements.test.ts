import { computeParticipation, getRequirements } from '../discussionRequirements';

const post = (postId: string, authorId: string, parentPostId: string | null = null, hidden = false) => ({
  postId,
  authorId,
  parentPostId,
  hidden,
  wordCount: 10,
});

const cfg = { minPosts: 1, minReplies: 2 };

describe('discussionRequirements', () => {
  it('reads new and legacy configs', () => {
    expect(getRequirements(cfg)).toEqual({ postsRequired: 1, repliesRequired: 2, legacy: false });
    expect(getRequirements({ minPosts: 2 })).toEqual({ postsRequired: 2, repliesRequired: 0, legacy: true });
  });

  it('falls back to 2 when minPosts is missing', () => {
    expect(getRequirements({}).postsRequired).toBe(2);
    expect(getRequirements(undefined).postsRequired).toBe(2);
  });

  it('1 post only: posts met, replies not met, not complete', () => {
    const r = computeParticipation([post('a', 's1')], 's1', cfg);
    expect(r.postCount).toBe(1);
    expect(r.replyCount).toBe(0);
    expect(r.postsMet).toBe(true);
    expect(r.repliesMet).toBe(false);
    expect(r.requirementsMet).toBe(false);
  });

  it('1 post + 2 replies to others is met', () => {
    const posts = [post('a', 's1'), post('b', 's2'), post('c', 's3'), post('r1', 's1', 'b'), post('r2', 's1', 'c')];
    const r = computeParticipation(posts, 's1', cfg);
    expect(r.replyCount).toBe(2);
    expect(r.requirementsMet).toBe(true);
  });

  it('reply to own post is not counted', () => {
    const posts = [post('a', 's1'), post('r1', 's1', 'a')];
    const r = computeParticipation(posts, 's1', cfg);
    expect(r.postCount).toBe(1);
    expect(r.replyCount).toBe(0);
  });

  it('replies do not count as original posts', () => {
    const posts = [post('b', 's2'), post('r1', 's1', 'b')];
    const r = computeParticipation(posts, 's1', cfg);
    expect(r.postCount).toBe(0);
    expect(r.postsMet).toBe(false);
  });

  it('excludes hidden posts', () => {
    const posts = [post('a', 's1', null, true)];
    const r = computeParticipation(posts, 's1', cfg);
    expect(r.postCount).toBe(0);
  });

  it('legacy minPosts=2 with 1 post is not met, 1 more needed', () => {
    const r = computeParticipation([post('a', 's1')], 's1', { minPosts: 2 });
    expect(r.legacy).toBe(true);
    expect(r.requirementsMet).toBe(false);
    expect(r.postsRequired - r.postCount).toBe(1);
  });

  it('legacy counts posts and replies together', () => {
    const posts = [post('a', 's1'), post('r1', 's1', 'a')];
    expect(computeParticipation(posts, 's1', { minPosts: 2 }).requirementsMet).toBe(true);
  });

  it('missing minPosts falls back to 2 combined', () => {
    expect(computeParticipation([post('a', 's1')], 's1', {}).requirementsMet).toBe(false);
    expect(computeParticipation([post('a', 's1'), post('b', 's1')], 's1', {}).requirementsMet).toBe(true);
  });
});
