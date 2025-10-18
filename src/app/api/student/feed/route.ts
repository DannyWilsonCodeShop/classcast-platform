import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export interface FeedItem {
  id: string;
  type: 'video' | 'community' | 'assignment';
  timestamp: string;
  courseId?: string;
  courseName?: string;
  courseInitials?: string;
  
  // Video-specific
  videoUrl?: string;
  thumbnailUrl?: string;
  title?: string;
  author?: {
    id: string;
    name: string;
    avatar?: string;
  };
  likes?: number;
  comments?: number;
  
  // Community post-specific
  content?: string;
  
  // Assignment-specific
  dueDate?: string;
  description?: string;
  status?: 'upcoming' | 'active' | 'past_due';
}

// GET /api/student/feed - Get unified feed for student
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }

    // Get student's enrolled courses
    const coursesResult = await docClient.send(new ScanCommand({
      TableName: 'classcast-courses'
    }));

    const allCourses = coursesResult.Items || [];
    const studentCourses = allCourses.filter(course => 
      course.enrollment?.students?.some((s: any) => s.userId === userId)
    );

    const courseIds = studentCourses.map(c => c.courseId);
    const feedItems: FeedItem[] = [];

    // Fetch video submissions from enrolled courses
    const submissionsResult = await docClient.send(new ScanCommand({
      TableName: 'classcast-video-submissions'
    }));

    const submissions = submissionsResult.Items || [];
    submissions
      .filter(sub => 
        courseIds.includes(sub.courseId) && 
        sub.status !== 'deleted' &&
        !sub.hidden
      )
      .forEach(sub => {
        const course = studentCourses.find(c => c.courseId === sub.courseId);
        feedItems.push({
          id: sub.submissionId,
          type: 'video',
          timestamp: sub.submittedAt || sub.createdAt,
          courseId: sub.courseId,
          courseName: course?.name || course?.courseName,
          courseInitials: course?.courseInitials,
          videoUrl: sub.videoUrl,
          thumbnailUrl: sub.thumbnailUrl,
          title: sub.videoTitle || sub.title,
          author: {
            id: sub.studentId,
            name: `${sub.studentFirstName || ''} ${sub.studentLastName || ''}`.trim(),
            avatar: sub.studentAvatar
          },
          likes: sub.likes || 0,
          comments: sub.commentCount || 0
        });
      });

    // Fetch community posts
    const postsResult = await docClient.send(new ScanCommand({
      TableName: 'classcast-community-posts'
    }));

    const posts = postsResult.Items || [];
    posts
      .filter(post => post.status !== 'deleted' && !post.hidden)
      .forEach(post => {
        feedItems.push({
          id: post.postId,
          type: 'community',
          timestamp: post.createdAt,
          content: post.content,
          title: post.title,
          author: {
            id: post.userId,
            name: post.userName || 'Unknown User',
            avatar: post.userAvatar
          },
          likes: post.likeCount || 0,
          comments: post.commentCount || 0
        });
      });

    // Fetch assignments from enrolled courses
    const assignmentsResult = await docClient.send(new ScanCommand({
      TableName: 'classcast-assignments'
    }));

    const assignments = assignmentsResult.Items || [];
    const now = new Date().toISOString();
    
    assignments
      .filter(assignment => courseIds.includes(assignment.courseId))
      .forEach(assignment => {
        const course = studentCourses.find(c => c.courseId === assignment.courseId);
        const dueDate = assignment.dueDate;
        let status: 'upcoming' | 'active' | 'past_due' = 'active';
        
        if (dueDate) {
          if (dueDate < now) {
            status = 'past_due';
          } else {
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
            if (dueDate > sevenDaysFromNow.toISOString()) {
              status = 'upcoming';
            }
          }
        }

        feedItems.push({
          id: assignment.assignmentId,
          type: 'assignment',
          timestamp: assignment.createdAt,
          courseId: assignment.courseId,
          courseName: course?.name || course?.courseName,
          courseInitials: course?.courseInitials,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueDate,
          status
        });
      });

    // Sort by timestamp (newest first)
    feedItems.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      feed: feedItems,
      courses: studentCourses.map(c => ({
        courseId: c.courseId,
        name: c.name || c.courseName,
        initials: c.courseInitials || c.code?.substring(0, 3).toUpperCase(),
        code: c.code,
        unreadCount: 0 // TODO: Implement notification count
      }))
    });

  } catch (error) {
    console.error('Error fetching student feed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feed' },
      { status: 500 }
    );
  }
}

