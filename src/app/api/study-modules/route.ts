import { NextRequest, NextResponse } from 'next/server';
import { StudyModule } from '@/types/study-modules';

// Mock data for study modules
const mockStudyModules: StudyModule[] = [
  {
    id: 'module-1',
    title: 'Introduction to Calculus',
    description: 'Master the fundamentals of calculus with interactive videos and practice problems. Learn limits, derivatives, and basic integration.',
    thumbnail: '/api/placeholder/300/200',
    category: 'Mathematics',
    difficulty: 'Intermediate',
    estimatedTime: '2 hours 30 minutes',
    totalLessons: 8,
    completedLessons: 0,
    progress: 0,
    rating: 4.8,
    enrolledCount: 1247,
    createdBy: 'Dr. Sarah Johnson',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
    lessons: [
      {
        id: 'lesson-1-1',
        moduleId: 'module-1',
        title: 'What is Calculus?',
        description: 'An introduction to the concept of calculus and its real-world applications',
        type: 'video',
        order: 1,
        duration: '12 minutes',
        videoUrl: 'https://www.youtube.com/watch?v=WUvTyaaNkzM',
        isCompleted: false,
        isLocked: false
      },
      {
        id: 'lesson-1-2',
        moduleId: 'module-1',
        title: 'Understanding Limits',
        description: 'Learn the fundamental concept of limits in calculus',
        type: 'video',
        order: 2,
        duration: '18 minutes',
        videoUrl: 'https://www.youtube.com/watch?v=riXcZT2ICjA',
        isCompleted: false,
        isLocked: true
      },
      {
        id: 'lesson-1-3',
        moduleId: 'module-1',
        title: 'Limits Quiz',
        description: 'Test your understanding of limits',
        type: 'quiz',
        order: 3,
        isCompleted: false,
        isLocked: true,
        quiz: {
          id: 'quiz-1-3',
          lessonId: 'lesson-1-3',
          title: 'Limits Knowledge Check',
          description: 'Test your understanding of limits and their properties',
          questions: [
            {
              id: 'q1',
              type: 'multiple-choice',
              question: 'What is the limit of f(x) = x² as x approaches 3?',
              options: ['6', '9', '12', 'undefined'],
              correctAnswer: '9',
              explanation: 'When x approaches 3, x² approaches 3² = 9',
              points: 10
            },
            {
              id: 'q2',
              type: 'true-false',
              question: 'The limit of a function always equals the function value at that point.',
              correctAnswer: 'false',
              explanation: 'Limits can exist even when the function is undefined at that point',
              points: 10
            }
          ],
          passingScore: 70,
          attempts: [],
          maxAttempts: 3
        }
      },
      {
        id: 'lesson-1-4',
        moduleId: 'module-1',
        title: 'Introduction to Derivatives',
        description: 'Learn what derivatives are and how to calculate them',
        type: 'video',
        order: 4,
        duration: '22 minutes',
        videoUrl: 'https://www.youtube.com/watch?v=5yfh5cf4-0w',
        isCompleted: false,
        isLocked: true
      }
    ]
  },
  {
    id: 'module-2',
    title: 'Shakespeare\'s Hamlet Analysis',
    description: 'Dive deep into Shakespeare\'s masterpiece with guided analysis, character studies, and thematic exploration.',
    thumbnail: '/api/placeholder/300/200',
    category: 'Literature',
    difficulty: 'Advanced',
    estimatedTime: '3 hours 15 minutes',
    totalLessons: 12,
    completedLessons: 0,
    progress: 0,
    rating: 4.6,
    enrolledCount: 892,
    createdBy: 'Prof. Michael Chen',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-18T00:00:00Z',
    lessons: [
      {
        id: 'lesson-2-1',
        moduleId: 'module-2',
        title: 'Historical Context of Hamlet',
        description: 'Understanding the Elizabethan era and its influence on the play',
        type: 'video',
        order: 1,
        duration: '15 minutes',
        videoUrl: 'https://www.youtube.com/watch?v=p5p0onbUB6k',
        isCompleted: false,
        isLocked: false
      },
      {
        id: 'lesson-2-2',
        moduleId: 'module-2',
        title: 'Character Analysis: Hamlet',
        description: 'Deep dive into Hamlet\'s character development and motivations',
        type: 'video',
        order: 2,
        duration: '20 minutes',
        videoUrl: 'https://www.youtube.com/watch?v=lIW2dkUU8r0',
        isCompleted: false,
        isLocked: true
      }
    ]
  },
  {
    id: 'module-3',
    title: 'Python Programming Basics',
    description: 'Learn Python from scratch with hands-on coding exercises and interactive challenges.',
    thumbnail: '/api/placeholder/300/200',
    category: 'Computer Science',
    difficulty: 'Beginner',
    estimatedTime: '4 hours',
    totalLessons: 15,
    completedLessons: 0,
    progress: 0,
    rating: 4.9,
    enrolledCount: 2156,
    createdBy: 'Dr. Emily Rodriguez',
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-22T00:00:00Z',
    lessons: [
      {
        id: 'lesson-3-1',
        moduleId: 'module-3',
        title: 'Setting Up Python',
        description: 'Install Python and set up your development environment',
        type: 'video',
        order: 1,
        duration: '10 minutes',
        videoUrl: 'https://www.youtube.com/watch?v=YYXdXT2l-Gg',
        isCompleted: false,
        isLocked: false
      }
    ]
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');

    let filteredModules = [...mockStudyModules];

    // Filter by category
    if (category && category !== 'all') {
      filteredModules = filteredModules.filter(module => 
        module.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by difficulty
    if (difficulty && difficulty !== 'all') {
      filteredModules = filteredModules.filter(module => 
        module.difficulty.toLowerCase() === difficulty.toLowerCase()
      );
    }

    // Add enrollment status for user
    if (userId) {
      // In a real app, check enrollment status from database
      filteredModules = filteredModules.map(module => ({
        ...module,
        isEnrolled: false // Mock: user not enrolled in any modules yet
      }));
    }

    return NextResponse.json({
      success: true,
      modules: filteredModules,
      total: filteredModules.length
    });
  } catch (error) {
    console.error('Error fetching study modules:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch study modules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, moduleId, action } = body;

    if (!userId || !moduleId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (action === 'enroll') {
      // In a real app, save enrollment to database
      console.log(`User ${userId} enrolled in module ${moduleId}`);
      
      return NextResponse.json({
        success: true,
        message: 'Successfully enrolled in module',
        enrolledAt: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing study module request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}