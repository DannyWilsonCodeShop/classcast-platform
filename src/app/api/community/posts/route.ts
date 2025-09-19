import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBService } from '@/lib/dynamodb';

export async function GET(request: NextRequest) {
  try {
    // Mock data for community posts and announcements
    const posts = [
      // Instructor Announcements (pinned and highlighted)
      {
        id: 'announcement_1',
        author: 'Dr. Sarah Johnson',
        authorRole: 'instructor',
        title: '📢 Important: Midterm Exam Schedule Update',
        content: 'Hello everyone! I wanted to let you all know that the midterm exam has been moved to next Friday, March 15th at 2:00 PM. Please make sure to review chapters 5-8 thoroughly. Good luck with your studies!',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        likes: 45,
        comments: 12,
        tags: ['announcement', 'exam', 'schedule'],
        reactions: { like: 45, love: 8, helpful: 23, celebrate: 2 },
        isLiked: false,
        isBookmarked: false,
        trending: true,
        pinned: true,
        isAnnouncement: true
      },
      {
        id: 'announcement_2',
        author: 'Prof. Michael Chen',
        authorRole: 'instructor',
        title: '🎉 Congratulations on Great Project Submissions!',
        content: 'I was really impressed with the quality of your recent project submissions. The creativity and attention to detail really shows. Keep up the excellent work!',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        likes: 38,
        comments: 8,
        tags: ['congratulations', 'projects', 'feedback'],
        reactions: { like: 38, love: 15, helpful: 5, celebrate: 20 },
        isLiked: false,
        isBookmarked: false,
        trending: true,
        pinned: false,
        isAnnouncement: true
      },
      // Student Posts
      {
        id: 'post_1',
        author: 'Alex Martinez',
        authorRole: 'student',
        title: 'Study Group for CS 101 - Anyone Interested?',
        content: 'Hey everyone! I\'m organizing a study group for CS 101. We meet every Tuesday and Thursday at 6 PM in the library. All skill levels welcome!',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        likes: 12,
        comments: 5,
        tags: ['study-group', 'cs101', 'collaboration'],
        reactions: { like: 12, love: 3, helpful: 8, celebrate: 1 },
        isLiked: false,
        isBookmarked: false,
        trending: false,
        pinned: false,
        isAnnouncement: false
      },
      {
        id: 'post_2',
        author: 'Emma Wilson',
        authorRole: 'student',
        title: 'Tips for Effective Time Management',
        content: 'I\'ve been struggling with time management lately, but I found some great techniques that really help. Here are my top 5 tips: 1) Use the Pomodoro Technique, 2) Create a daily schedule, 3) Prioritize tasks, 4) Take regular breaks, 5) Review and adjust weekly.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        likes: 28,
        comments: 15,
        tags: ['tips', 'time-management', 'productivity'],
        reactions: { like: 28, love: 12, helpful: 20, celebrate: 3 },
        isLiked: false,
        isBookmarked: false,
        trending: true,
        pinned: false,
        isAnnouncement: false
      },
      {
        id: 'post_3',
        author: 'David Kim',
        authorRole: 'student',
        title: 'Looking for Project Partner - Web Development',
        content: 'I\'m working on a web development project for my portfolio and looking for a partner. I\'m comfortable with React and Node.js. Anyone interested in collaborating?',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        likes: 8,
        comments: 7,
        tags: ['collaboration', 'web-development', 'project'],
        reactions: { like: 8, love: 2, helpful: 6, celebrate: 1 },
        isLiked: false,
        isBookmarked: false,
        trending: false,
        pinned: false,
        isAnnouncement: false
      },
      {
        id: 'post_4',
        author: 'Lisa Thompson',
        authorRole: 'student',
        title: 'Resources for Learning Machine Learning',
        content: 'I\'ve been diving deep into machine learning and found some amazing free resources. Here are my recommendations: 1) Andrew Ng\'s Coursera course, 2) Fast.ai practical course, 3) Kaggle Learn modules, 4) Google\'s ML Crash Course.',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        likes: 35,
        comments: 22,
        tags: ['machine-learning', 'resources', 'learning'],
        reactions: { like: 35, love: 18, helpful: 25, celebrate: 5 },
        isLiked: false,
        isBookmarked: false,
        trending: true,
        pinned: false,
        isAnnouncement: false
      },
      {
        id: 'post_5',
        author: 'James Rodriguez',
        authorRole: 'student',
        title: 'Campus Event: Tech Talk on AI Ethics',
        content: 'There\'s an interesting tech talk happening this Friday at 3 PM in the main auditorium about AI ethics and responsible development. Free pizza and networking after!',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
        likes: 15,
        comments: 9,
        tags: ['event', 'ai-ethics', 'networking'],
        reactions: { like: 15, love: 4, helpful: 11, celebrate: 2 },
        isLiked: false,
        isBookmarked: false,
        trending: false,
        pinned: false,
        isAnnouncement: false
      }
    ];

    // Sort posts: pinned announcements first, then by timestamp (newest first)
    const sortedPosts = posts.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return NextResponse.json(sortedPosts);
  } catch (error) {
    console.error('Error fetching community posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content } = body;

    // Basic validation
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const dynamoDBService = new DynamoDBService();
    
    // Create new post
    const post = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      content,
      author: 'Current User', // TODO: Get from auth context
      authorRole: 'student', // TODO: Get from auth context
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: 0,
      tags: [],
      reactions: { like: 0, love: 0, helpful: 0, celebrate: 0 },
      isLiked: false,
      isBookmarked: false,
      trending: false,
      pinned: false
    };

    // TODO: Save to database
    // await dynamoDBService.putItem('community-posts', post);

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating community post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
