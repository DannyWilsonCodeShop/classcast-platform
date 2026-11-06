import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { computeParticipation, getRequirements, CountablePost } from '@/lib/discussionRequirements';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const POSTS_TABLE = 'classcast-discussion-posts';
const ASSIGNMENTS_TABLE = 'classcast-assignments';
const COURSES_TABLE = 'classcast-courses';

// Read-only: per-student participation for a discussion, including students with zero posts.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ discussionId: string }> }
) {
  try {
    const { discussionId } = await params;

    const assignmentResult = await docClient.send(new GetCommand({
      TableName: ASSIGNMENTS_TABLE,
      Key: { assignmentId: discussionId },
    }));
    const assignment = assignmentResult.Item;
    if (!assignment) {
      return NextResponse.json({ success: false, error: 'Discussion not found' }, { status: 404 });
    }
    const config = assignment.discussionConfig || null;

    const courseResult = assignment.courseId
      ? await docClient.send(new GetCommand({ TableName: COURSES_TABLE, Key: { courseId: assignment.courseId } }))
      : { Item: undefined };
    const roster: any[] = (courseResult.Item?.enrollment?.students || []).filter(
      (s: any) => !s.status || s.status === 'active'
    );

    const posts: any[] = [];
    let lastKey: Record<string, any> | undefined;
    do {
      const page = await docClient.send(new QueryCommand({
        TableName: POSTS_TABLE,
        IndexName: 'DiscussionIdIndex',
        KeyConditionExpression: 'discussionId = :discussionId',
        ExpressionAttributeValues: { ':discussionId': discussionId },
        ScanIndexForward: true,
        ExclusiveStartKey: lastKey,
      }));
      posts.push(...(page.Items || []));
      lastKey = page.LastEvaluatedKey;
    } while (lastKey);

    const countable = posts as CountablePost[];
    const req = getRequirements(config);

    const rosterIds = new Set<string>();
    const students = roster.map((s: any) => {
      const id = s.userId || s.studentId;
      rosterIds.add(id);
      const authored = posts.find(p => p.authorId === id);
      const name = [s.firstName, s.lastName].filter(Boolean).join(' ') || s.name || authored?.authorName || s.email || 'Student';
      return buildRow(id, name, s.email || '', countable, posts, config);
    });

    // Authors with posts who are not on the active roster (e.g. dropped) are still shown
    const extraAuthors = new Map<string, string>();
    posts.forEach(p => {
      if (!rosterIds.has(p.authorId) && !extraAuthors.has(p.authorId)) extraAuthors.set(p.authorId, p.authorName || 'Student');
    });
    extraAuthors.forEach((name, id) => students.push(buildRow(id, name, '', countable, posts, config)));

    students.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      success: true,
      data: {
        requirements: { postsRequired: req.postsRequired, repliesRequired: req.repliesRequired, legacy: req.legacy },
        students,
      },
    });
  } catch (error) {
    console.error('Error computing discussion participation:', error);
    return NextResponse.json({ success: false, error: 'Failed to compute participation' }, { status: 500 });
  }
}

function buildRow(id: string, name: string, email: string, countable: CountablePost[], posts: any[], config: any) {
  const p = computeParticipation(countable, id, config);
  return {
    studentId: id,
    name,
    postCount: p.postCount,
    replyCount: p.replyCount,
    totalWordCount: p.totalWordCount,
    postsMet: p.postsMet,
    repliesMet: p.repliesMet,
    requirementsMet: p.requirementsMet,
    posts: posts.filter(x => x.authorId === id && !x.hidden),
  };
}
