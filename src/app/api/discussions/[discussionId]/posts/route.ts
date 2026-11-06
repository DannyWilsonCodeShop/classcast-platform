import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { DiscussionPost } from '@/types/discussion';
import { computeParticipation, CountablePost, RequirementsConfig } from '@/lib/discussionRequirements';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const POSTS_TABLE = 'classcast-discussion-posts';
const GROUPS_TABLE = 'classcast-discussion-groups';
const ASSIGNMENTS_TABLE = 'classcast-assignments';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ discussionId: string }> }
) {
  try {
    const { discussionId } = await params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    // Fetch all posts for this discussion
    const result = await docClient.send(new QueryCommand({
      TableName: POSTS_TABLE,
      IndexName: 'DiscussionIdIndex',
      KeyConditionExpression: 'discussionId = :discussionId',
      ExpressionAttributeValues: { ':discussionId': discussionId },
      ScanIndexForward: true, // oldest first
    }));

    let posts = result.Items || [];

    // If small-group format, filter to only the student's group
    if (studentId) {
      const groupResult = await docClient.send(new QueryCommand({
        TableName: GROUPS_TABLE,
        IndexName: 'DiscussionIdIndex',
        KeyConditionExpression: 'discussionId = :discussionId',
        ExpressionAttributeValues: { ':discussionId': discussionId },
      }));

      const groups = groupResult.Items || [];
      const studentGroup = groups.find((g: Record<string, unknown>) =>
        g.studentIds && (g.studentIds as string[]).includes(studentId)
      );

      if (studentGroup) {
        // Filter posts to only those from group members
        const groupMembers = new Set(studentGroup.studentIds as string[]);
        posts = posts.filter((p: Record<string, unknown>) => groupMembers.has(p.authorId as string));
      }
    }

    // Compute participation summary for the requesting student
    let participationSummary = null;
    if (studentId) {
      // Get assignment to check requirements
      const assignmentResult = await docClient.send(new GetCommand({
        TableName: ASSIGNMENTS_TABLE,
        Key: { assignmentId: discussionId },
      }));
      const assignment = assignmentResult.Item;
      participationSummary = computeParticipation(
        posts as unknown as CountablePost[],
        studentId,
        assignment?.discussionConfig as RequirementsConfig | undefined
      );
    }

    return NextResponse.json({
      success: true,
      data: { posts, participationSummary },
    }, {
      headers: { 'Cache-Control': 'no-store' }
    });

  } catch (error) {
    console.error('Error fetching discussion posts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ discussionId: string }> }
) {
  try {
    const { discussionId } = await params;
    const body = await request.json();
    const { authorId, authorName, authorAvatar, parentPostId, content, videoUrl, links, imageUrl } = body;

    if (!authorId || (!content && !videoUrl && !imageUrl)) {
      return NextResponse.json(
        { success: false, error: 'Author ID and content (text, video, or image) are required' },
        { status: 400 }
      );
    }

    // Get assignment to check due date and config
    const assignmentResult = await docClient.send(new GetCommand({
      TableName: ASSIGNMENTS_TABLE,
      Key: { assignmentId: discussionId },
    }));
    const assignment = assignmentResult.Item;

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Discussion not found' },
        { status: 404 }
      );
    }

    // Check if past due date
    if (assignment.dueDate && new Date(assignment.dueDate as string) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'This discussion is past its due date' },
        { status: 400 }
      );
    }

    // Validate word count for text posts
    const wordCount = content ? content.trim().split(/\s+/).filter(Boolean).length : 0;
    const discussionConfig = assignment.discussionConfig as Record<string, unknown> | undefined;
    const minWordCount = (discussionConfig?.minWordCount as number) || 0;

    if (content && minWordCount > 0 && wordCount < minWordCount) {
      return NextResponse.json(
        { success: false, error: `Post must be at least ${minWordCount} words (currently ${wordCount})` },
        { status: 400 }
      );
    }

    // Create post
    const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const post: DiscussionPost = {
      postId,
      discussionId,
      authorId,
      authorName: authorName || '',
      authorAvatar: authorAvatar || '',
      parentPostId: parentPostId || null,
      content: content || '',
      videoUrl: videoUrl || null,
      links: Array.isArray(links) ? links : [],
      imageUrl: imageUrl || null,
      hidden: false,
      wordCount,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({
      TableName: POSTS_TABLE,
      Item: post,
    }));

    return NextResponse.json({
      success: true,
      data: { post },
    });

  } catch (error) {
    console.error('Error creating discussion post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500 }
    );
  }
}


// Light moderation: soft-hide (or unhide) a post. `hidden` is a DynamoDB reserved word, so it is aliased as #h.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ discussionId: string }> }
) {
  try {
    await params; // discussionId is part of the route; the post is keyed by postId
    const body = await request.json();
    const { postId, hidden } = body;

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'postId is required' },
        { status: 400 }
      );
    }

    await docClient.send(new UpdateCommand({
      TableName: POSTS_TABLE,
      Key: { postId },
      UpdateExpression: 'SET #h = :hidden, updatedAt = :now',
      ExpressionAttributeNames: { '#h': 'hidden' },
      ExpressionAttributeValues: {
        ':hidden': hidden !== false, // default to hiding
        ':now': new Date().toISOString(),
      },
    }));

    return NextResponse.json({ success: true, data: { postId, hidden: hidden !== false } });

  } catch (error) {
    console.error('Error moderating discussion post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update post' },
      { status: 500 }
    );
  }
}
