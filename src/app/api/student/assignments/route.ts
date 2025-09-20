import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock assignment data for demonstration
    const assignments = [
      {
        id: 'assignment_1',
        courseId: 'course_1',
        courseName: 'Introduction to Calculus',
        courseCode: 'MATH101',
        title: 'Derivatives and Limits',
        description: 'Complete problems 1-20 from chapter 3. Show all work and explain your reasoning.',
        dueDate: '2024-01-25T23:59:59Z',
        status: 'upcoming',
        points: 100,
        submissionType: 'video',
        isSubmitted: false,
        submittedAt: null,
        grade: null,
        feedback: null,
        instructor: 'Dr. Sarah Johnson',
        createdAt: '2024-01-15T09:00:00Z',
        attachments: []
      },
      {
        id: 'assignment_2',
        courseId: 'course_2',
        courseName: 'Physics for Engineers',
        courseCode: 'PHYS201',
        title: 'Lab Report: Pendulum Motion',
        description: 'Analyze the motion of a simple pendulum and write a comprehensive lab report.',
        dueDate: '2024-01-23T23:59:59Z',
        status: 'upcoming',
        points: 150,
        submissionType: 'document',
        isSubmitted: false,
        submittedAt: null,
        grade: null,
        feedback: null,
        instructor: 'Prof. Michael Chen',
        createdAt: '2024-01-10T10:30:00Z',
        attachments: []
      },
      {
        id: 'assignment_3',
        courseId: 'course_3',
        courseName: 'Data Structures & Algorithms',
        courseCode: 'CS301',
        title: 'Binary Tree Implementation',
        description: 'Implement a binary search tree with insert, delete, and search operations in your preferred language.',
        dueDate: '2024-01-26T23:59:59Z',
        status: 'upcoming',
        points: 200,
        submissionType: 'code',
        isSubmitted: false,
        submittedAt: null,
        grade: null,
        feedback: null,
        instructor: 'Dr. Emily Rodriguez',
        createdAt: '2024-01-08T14:15:00Z',
        attachments: []
      },
      {
        id: 'assignment_4',
        courseId: 'course_1',
        courseName: 'Introduction to Calculus',
        courseCode: 'MATH101',
        title: 'Integration Techniques',
        description: 'Solve the integration problems using substitution and integration by parts.',
        dueDate: '2024-01-20T23:59:59Z',
        status: 'past_due',
        points: 120,
        submissionType: 'video',
        isSubmitted: true,
        submittedAt: '2024-01-20T22:30:00Z',
        grade: 95,
        feedback: 'Excellent work! Your explanation of the substitution method was very clear.',
        instructor: 'Dr. Sarah Johnson',
        createdAt: '2024-01-10T09:00:00Z',
        attachments: []
      },
      {
        id: 'assignment_5',
        courseId: 'course_3',
        courseName: 'Data Structures & Algorithms',
        courseCode: 'CS301',
        title: 'Sorting Algorithm Analysis',
        description: 'Compare the time complexity of bubble sort, merge sort, and quick sort with examples.',
        dueDate: '2024-01-18T23:59:59Z',
        status: 'completed',
        points: 180,
        submissionType: 'video',
        isSubmitted: true,
        submittedAt: '2024-01-18T20:45:00Z',
        grade: 88,
        feedback: 'Good analysis! Consider adding more examples for better understanding.',
        instructor: 'Dr. Emily Rodriguez',
        createdAt: '2024-01-05T11:20:00Z',
        attachments: []
      },
      {
        id: 'assignment_6',
        courseId: 'course_6',
        courseName: 'World History',
        courseCode: 'HIST201',
        title: 'Renaissance Period Essay',
        description: 'Write a 1500-word essay on the impact of the Renaissance on modern society.',
        dueDate: '2024-01-24T23:59:59Z',
        status: 'upcoming',
        points: 250,
        submissionType: 'document',
        isSubmitted: false,
        submittedAt: null,
        grade: null,
        feedback: null,
        instructor: 'Prof. Robert Martinez',
        createdAt: '2024-01-12T08:00:00Z',
        attachments: []
      }
    ];

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Error fetching student assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}