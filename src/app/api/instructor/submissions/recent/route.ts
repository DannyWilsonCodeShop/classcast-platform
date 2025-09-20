import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Sample recent submissions data for demonstration
    const recentSubmissions = [
      {
        id: 'sub_1',
        studentName: 'Sarah Johnson',
        assignmentTitle: 'Derivatives and Limits',
        submittedAt: '2024-12-10T14:30:00Z',
        courseName: 'Calculus II',
        status: 'pending_review'
      },
      {
        id: 'sub_2',
        studentName: 'Michael Chen',
        assignmentTitle: 'Binary Tree Implementation',
        submittedAt: '2024-12-10T12:15:00Z',
        courseName: 'Data Structures',
        status: 'pending_review'
      },
      {
        id: 'sub_3',
        studentName: 'Emily Davis',
        assignmentTitle: 'Lab Report: Pendulum Motion',
        submittedAt: '2024-12-10T10:45:00Z',
        courseName: 'Physics Lab',
        status: 'graded'
      },
      {
        id: 'sub_4',
        studentName: 'David Kim',
        assignmentTitle: 'Renaissance Period Essay',
        submittedAt: '2024-12-09T16:20:00Z',
        courseName: 'World History',
        status: 'pending_review'
      },
      {
        id: 'sub_5',
        studentName: 'Lisa Wang',
        assignmentTitle: 'Integration Techniques',
        submittedAt: '2024-12-09T14:10:00Z',
        courseName: 'Calculus II',
        status: 'graded'
      }
    ];

    return NextResponse.json(recentSubmissions);
  } catch (error) {
    console.error('Error fetching recent submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent submissions' },
      { status: 500 }
    );
  }
}
