import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { getYouTubeVideoId } from '@/lib/youtube';

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

    // Fetch video submissions from enrolled courses (with error handling)
    try {
      const submissionsResult = await docClient.send(new ScanCommand({
        TableName: 'classcast-submissions'
      }));

      const submissions = submissionsResult.Items || [];
      
      console.log(`📹 Found ${submissions.length} total submissions`);
      console.log(`🎓 Student courseIds:`, courseIds);
      
      // For each submission, get student info to populate author details
      for (const sub of submissions) {
        console.log(`🔍 Checking submission ${sub.submissionId}: courseId=${sub.courseId}, status=${sub.status}, hidden=${sub.hidden}`);
        
        if (!courseIds.includes(sub.courseId)) {
          console.log(`  ❌ Skipped: courseId ${sub.courseId} not in student's courses`);
          continue;
        }
        if (sub.status === 'deleted') {
          console.log(`  ❌ Skipped: status is deleted`);
          continue;
        }
        if (sub.hidden) {
          console.log(`  ❌ Skipped: hidden is true`);
          continue;
        }
        
        console.log(`  ✅ Including video submission: ${sub.videoTitle || 'Untitled'}`);
        
        const course = studentCourses.find(c => c.courseId === sub.courseId);
        
        let videoId = null;
        try {
          videoId = sub.videoUrl ? getYouTubeVideoId(sub.videoUrl) : null;
          console.log(`  📹 Video URL: ${sub.videoUrl}, YouTube ID: ${videoId || 'none'}`);
        } catch (youtubeError) {
          console.warn(`  ⚠️  Error getting YouTube ID:`, youtubeError);
        }
        
        // Get student details
        let studentName = 'Unknown Student';
        let studentAvatar = null;
        
        try {
          console.log(`  👤 Fetching user details for studentId: ${sub.studentId}`);
          const userResult = await docClient.send(new ScanCommand({
            TableName: 'classcast-users',
            FilterExpression: 'userId = :userId',
            ExpressionAttributeValues: {
              ':userId': sub.studentId
            },
            Limit: 1
          }));
          
          console.log(`  📊 User query result: ${userResult.Items?.length || 0} users found`);
          
          if (userResult.Items && userResult.Items.length > 0) {
            const user = userResult.Items[0];
            studentName = user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : user.email || studentName;
            studentAvatar = user.avatar || user.profilePicture || user.profile?.avatar;
            console.log(`  ✓ Found user: ${studentName}, avatar: ${studentAvatar ? 'YES' : 'NO'}`);
          } else {
            console.warn(`  ⚠️  No user found for studentId: ${sub.studentId}`);
          }
        } catch (userError) {
          console.error('  ❌ Error fetching student details:', userError);
        }
        
        try {
          console.log(`  ➕ Adding video to feed items...`);
          feedItems.push({
            id: sub.submissionId,
            type: 'video',
            timestamp: sub.submittedAt || sub.createdAt,
            courseId: sub.courseId,
            courseName: course?.name || course?.courseName,
            courseInitials: course?.courseInitials || course?.code?.substring(0, 3).toUpperCase(),
            assignmentId: sub.assignmentId,
            videoUrl: sub.videoUrl,
            thumbnailUrl: videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : sub.thumbnailUrl,
            title: sub.videoTitle || sub.title,
            author: {
              id: sub.studentId,
              name: studentName,
              avatar: studentAvatar
            },
            likes: sub.likes || 0,
            comments: sub.commentCount || 0
          });
          console.log(`  ✓ Video added successfully`);
        } catch (pushError) {
          console.error(`  ❌ Error pushing video to feedItems:`, pushError);
        }
      }
      
      console.log(`\n✅ Successfully added ${feedItems.filter(i => i.type === 'video').length} video items to feed`);
    } catch (videoError: any) {
      console.error('❌ Video submissions ERROR:', videoError);
      console.error('Error name:', videoError.name);
      console.error('Error message:', videoError.message);
      console.error('Error stack:', videoError.stack);
    }

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

  } catch (error: any) {
    console.error('Error fetching student feed:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch feed',
        details: error.message,
        errorType: error.name
      },
      { status: 500 }
    );
  }
}

