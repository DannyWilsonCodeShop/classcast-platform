import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { extractYouTubeVideoId as getYouTubeVideoId } from '@/lib/youtube';
import { isRequestFromDemoUser, getDemoTargetFromRequest } from '@/lib/demo-mode-middleware';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const s3Client = new S3Client({ region: process.env.REGION || process.env.AWS_REGION || 'us-east-1' });
const VIDEO_BUCKET = process.env.VIDEO_BUCKET || 'classcast-videos-463470937777-us-east-1';
const SIGNED_URL_EXPIRY = 60 * 60 * 6; // 6 hours

function extractS3KeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    let key = decodeURIComponent(urlObj.pathname.substring(1));
    if (key.startsWith(`${VIDEO_BUCKET}/`)) {
      key = key.substring(VIDEO_BUCKET.length + 1);
    }
    return key || null;
  } catch {
    return null;
  }
}

function isExternalOrPublicUrl(url: string): boolean {
  if (!url) return true;
  return (
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('drive.google.com') ||
    url.includes('img.youtube.com') ||
    url.startsWith('/api/placeholder') ||
    url.startsWith('data:')
  );
}

// Sign S3-hosted objects; leave YouTube/Drive/placeholder/data URLs untouched. Never throws.
async function signIfS3(url: string | null | undefined): Promise<string | null | undefined> {
  if (!url || isExternalOrPublicUrl(url)) return url;
  const isS3 = url.includes('amazonaws.com') || url.startsWith('s3://');
  if (!isS3) return url;
  try {
    const key = url.startsWith('s3://')
      ? url.replace(/^s3:\/\/[^/]+\//, '')
      : extractS3KeyFromUrl(url);
    if (!key) return url;
    return await getSignedUrl(s3Client, new GetObjectCommand({ Bucket: VIDEO_BUCKET, Key: key }), { expiresIn: SIGNED_URL_EXPIRY });
  } catch (err) {
    console.warn('signIfS3 (student feed) failed, using original URL:', err);
    return url;
  }
}

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
  isLiked?: boolean; // Track if current user has liked this video
  isFromEnrolledCourse?: boolean; // Track if video is from student's enrolled course
  
  // Community post-specific
  content?: string;
  
  // Assignment-specific
  dueDate?: string;
  description?: string;
  status?: 'upcoming' | 'active' | 'past_due';
  assignmentId?: string; // Add assignmentId for navigation
  
  // Instructor features
  isPinned?: boolean;
  isHighlighted?: boolean;
  pinnedAt?: string;
}

// GET /api/student/feed - Get unified feed for student
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');
    const includeAllPublic = searchParams.get('includeAllPublic') === 'true'; // New parameter
    
    // Handle demo mode - redirect to target user
    if (isRequestFromDemoUser(request)) {
      const demoTargetUser = getDemoTargetFromRequest(request);
      if (demoTargetUser) {
        userId = demoTargetUser;
        console.log(`🎭 Demo mode: Fetching feed for target user ${userId}`);
      }
    }
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }

    console.log(`📡 Fetching feed for user ${userId}, includeAllPublic: ${includeAllPublic}`);

    // Get student's enrolled courses
    const coursesResult = await docClient.send(new ScanCommand({
      TableName: 'classcast-courses'
    }));

    const allCourses = coursesResult.Items || [];
    const studentCourses = allCourses.filter(course => 
      course.enrollment?.students?.some((s: any) => s.userId === userId)
    );

    const courseIds = studentCourses.map(c => c.courseId);
    
    // If includeAllPublic is true, also include public courses
    let allowedCourseIds = courseIds;
    if (includeAllPublic) {
      // Include all courses that are marked as public or don't have privacy settings
      const publicCourses = allCourses.filter(course => 
        course.isPublic !== false && course.privacy !== 'private'
      );
      allowedCourseIds = [...new Set([...courseIds, ...publicCourses.map(c => c.courseId)])];
      console.log(`🌐 Including public videos from ${allowedCourseIds.length - courseIds.length} additional courses`);
    }
    
    const feedItems: FeedItem[] = [];

    // Fetch video submissions from enrolled courses (with error handling)
    try {
      const submissionsResult = await docClient.send(new ScanCommand({
        TableName: 'classcast-submissions'
      }));

      let submissions = submissionsResult.Items || [];
      
      console.log(`📹 Found ${submissions.length} total submissions`);
      
      // Filter to allowed courses and non-deleted/hidden, then sort by date and limit
      submissions = submissions
        .filter(sub => 
          allowedCourseIds.includes(sub.courseId) && 
          sub.status !== 'deleted' && 
          !sub.hidden &&
          // Respect visibility setting: only show if user is in the same course
          // 'global' = anyone can see, 'course' = same course only, 'section' = same section only
          (sub.visibility === 'global' || allowedCourseIds.includes(sub.courseId))
        )
        // Shuffle randomly for variety on the dashboard
        .sort(() => Math.random() - 0.5)
        .slice(0, 30); // Process up to 30 random submissions
      
      console.log(`📹 Processing ${submissions.length} random submissions (limited to 30)`);
      
      // Batch load all users at once instead of per-submission
      const allUsersResult = await docClient.send(new ScanCommand({
        TableName: 'classcast-users',
        ProjectionExpression: 'userId, email, firstName, lastName, avatar, profilePicture'
      }));
      const allUsers = allUsersResult.Items || [];
      const userMap = new Map<string, any>();
      for (const u of allUsers) {
        userMap.set(u.userId, u);
        if (u.email) userMap.set(u.email, u);
      }
      
      // Batch load assignments for title lookup
      const allAssignmentsResult = await docClient.send(new ScanCommand({
        TableName: 'classcast-assignments',
        ProjectionExpression: 'assignmentId, title'
      }));
      const assignmentMap = new Map<string, string>();
      for (const a of (allAssignmentsResult.Items || [])) {
        if (a.assignmentId && a.title) assignmentMap.set(a.assignmentId, a.title);
      }
      
      // For each submission, build feed item
      for (const sub of submissions) {
        const isFromEnrolledCourse = courseIds.includes(sub.courseId);
        const course = studentCourses.find(c => c.courseId === sub.courseId) || 
                      allCourses.find(c => c.courseId === sub.courseId);
        
        const videoUrl = sub.videoUrl || sub.googleDriveUrl || sub.youtubeUrl || sub.googleDriveOriginalUrl || sub.url || sub.externalUrl;
        let videoId = null;
        try { videoId = videoUrl ? getYouTubeVideoId(videoUrl) : null; } catch {}
        
        // Look up user from batch-loaded map
        const user = userMap.get(sub.studentId);
        const studentName = user 
          ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Student'
          : (sub.studentId.includes('@') ? sub.studentId : 'Student');
        const studentAvatar = user?.avatar || user?.profilePicture || null;
        
        const likedBy = sub.likedBy || [];
        const isLiked = userId ? likedBy.includes(userId) : false;
        
        feedItems.push({
          id: sub.submissionId,
          type: 'video',
          timestamp: sub.submittedAt || sub.createdAt,
          courseId: sub.courseId,
          courseName: course?.name || course?.courseName,
          courseInitials: course?.courseInitials || course?.code?.substring(0, 3).toUpperCase(),
          assignmentId: sub.assignmentId,
          videoUrl: videoUrl,
          thumbnailUrl: sub.thumbnailUrl || (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null),
          title: assignmentMap.get(sub.assignmentId) || sub.videoTitle || sub.title || 'Video',
          author: { id: sub.studentId, name: studentName, avatar: studentAvatar },
          likes: sub.likes || 0,
          comments: sub.commentCount || 0,
          rating: sub.averageRating || 0,
          viewCount: sub.viewCount || 0,
          isLiked,
          isFromEnrolledCourse,
          isPinned: sub.isPinned || false,
          isHighlighted: sub.isHighlighted || false,
          pinnedAt: sub.pinnedAt
        });
      }
      
      console.log(`✅ Feed: ${feedItems.filter(i => i.type === 'video').length} videos (random selection, up to 30)`);
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
    
    // Process community posts with user lookup
    for (const post of posts.filter(p => p.status !== 'deleted' && !p.hidden)) {
      let authorName = post.userName || '';
      let authorAvatar = post.userAvatar;
      
      // If we don't have user info in the post, try to fetch it
      if (!post.userName || !post.userAvatar) {
        try {
          const userResult = await docClient.send(new GetCommand({
            TableName: 'classcast-users',
            Key: { userId: post.userId }
          }));
          
          if (userResult.Item) {
            const user = userResult.Item;
            authorName = user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : user.email || authorName;
            authorAvatar = user.avatar || user.profilePicture || user.profile?.avatar || authorAvatar;
          }
        } catch (userError) {
          console.warn(`Failed to fetch user data for community post author ${post.userId}:`, userError);
          // Use email as fallback if available, otherwise use a generic name
          if (!authorName) {
            authorName = post.userId.includes('@') ? post.userId : 'User';
          }
        }
      }
      
      feedItems.push({
        id: post.postId,
        type: 'community',
        timestamp: post.createdAt,
        content: post.content,
        title: post.title,
        author: {
          id: post.userId,
          name: authorName,
          avatar: authorAvatar
        },
        likes: post.likeCount || 0,
        comments: post.commentCount || 0
      });
    }

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
          status,
          isPinned: assignment.isPinned || false,
          isHighlighted: assignment.isHighlighted || false,
          pinnedAt: assignment.pinnedAt
        });
      });

    // Sort by pinned status first, then by timestamp (newest first)
    feedItems.sort((a, b) => {
      // Pinned items go to the top
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Then highlighted items
      if (a.isHighlighted && !b.isHighlighted) return -1;
      if (!a.isHighlighted && b.isHighlighted) return 1;
      
      // Finally sort by timestamp (newest first)
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // Sign S3 video/thumbnail URLs on the video items so dashboard tiles load reliably
    // (S3 objects are private; unsigned URLs 403). Only the selected video items are signed.
    await Promise.all(feedItems.map(async (item) => {
      if (item.type !== 'video') return;
      const [signedVideo, signedThumb] = await Promise.all([
        signIfS3(item.videoUrl),
        signIfS3(item.thumbnailUrl),
      ]);
      item.videoUrl = signedVideo || item.videoUrl;
      item.thumbnailUrl = signedThumb ?? item.thumbnailUrl;
    }));

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

