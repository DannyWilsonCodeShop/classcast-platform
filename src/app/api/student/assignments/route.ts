import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Comprehensive mock assignment data with diverse types and statuses
    const assignments = [
      // MATH101 - Calculus Assignments
      {
        id: 'assignment_1',
        courseId: 'course_1',
        courseName: 'Introduction to Calculus',
        courseCode: 'MATH101',
        title: 'Derivatives and Limits - Video Lesson',
        description: 'Create a 5-minute video explaining the concept of derivatives and limits. Use visual aids and work through 3 example problems step by step.',
        dueDate: '2024-01-25T23:59:59Z',
        status: 'upcoming',
        points: 100,
        submissionType: 'video',
        assignmentType: 'Video Lesson',
        isSubmitted: false,
        submittedAt: null,
        grade: null,
        feedback: null,
        instructor: 'Dr. Sarah Johnson',
        createdAt: '2024-01-15T09:00:00Z',
        attachments: ['derivatives_worksheet.pdf', 'example_problems.pdf']
      },
      {
        id: 'assignment_2',
        courseId: 'course_1',
        courseName: 'Introduction to Calculus',
        courseCode: 'MATH101',
        title: 'Integration Techniques - Video Assessment',
        description: 'Solve the integration problems using substitution and integration by parts. Record yourself explaining your solution process.',
        dueDate: '2024-01-20T23:59:59Z',
        status: 'past_due',
        points: 120,
        submissionType: 'video',
        assignmentType: 'Video Assessment',
        isSubmitted: true,
        submittedAt: '2024-01-20T22:30:00Z',
        grade: 95,
        feedback: 'Excellent work! Your explanation of the substitution method was very clear. Great use of visual aids.',
        instructor: 'Dr. Sarah Johnson',
        createdAt: '2024-01-10T09:00:00Z',
        attachments: ['integration_problems.pdf']
      },
      {
        id: 'assignment_3',
        courseId: 'course_1',
        courseName: 'Introduction to Calculus',
        courseCode: 'MATH101',
        title: 'Chain Rule Discussion - Video Discussion',
        description: 'Record a 3-minute video discussing when and how to apply the chain rule. Include examples from different contexts.',
        dueDate: '2024-01-30T23:59:59Z',
        status: 'upcoming',
        points: 80,
        submissionType: 'video',
        assignmentType: 'Video Discussion',
        isSubmitted: false,
        submittedAt: null,
        grade: null,
        feedback: null,
        instructor: 'Dr. Sarah Johnson',
        createdAt: '2024-01-18T14:00:00Z',
        attachments: ['chain_rule_examples.pdf']
      },
      
      // PHYS201 - Physics Assignments
      {
        id: 'assignment_4',
        courseId: 'course_2',
        courseName: 'Physics for Engineers',
        courseCode: 'PHYS201',
        title: 'Lab Report: Pendulum Motion - Video Assessment',
        description: 'Analyze the motion of a simple pendulum and create a video presentation of your findings with data visualization.',
        dueDate: '2024-01-23T23:59:59Z',
        status: 'upcoming',
        points: 150,
        submissionType: 'video',
        assignmentType: 'Video Assessment',
        isSubmitted: false,
        submittedAt: null,
        grade: null,
        feedback: null,
        instructor: 'Prof. Michael Chen',
        createdAt: '2024-01-10T10:30:00Z',
        attachments: ['pendulum_lab_instructions.pdf', 'data_collection_sheet.pdf']
      },
      {
        id: 'assignment_5',
        courseId: 'course_2',
        courseName: 'Physics for Engineers',
        courseCode: 'PHYS201',
        title: 'Thermodynamics Concepts - Video Lesson',
        description: 'Create a 7-minute video explaining the first and second laws of thermodynamics with real-world examples.',
        dueDate: '2024-01-18T23:59:59Z',
        status: 'completed',
        points: 130,
        submissionType: 'video',
        assignmentType: 'Video Lesson',
        isSubmitted: true,
        submittedAt: '2024-01-18T20:45:00Z',
        grade: 92,
        feedback: 'Outstanding explanation! Your real-world examples made complex concepts accessible. Consider adding more mathematical derivations.',
        instructor: 'Prof. Michael Chen',
        createdAt: '2024-01-05T11:20:00Z',
        attachments: ['thermodynamics_notes.pdf']
      },
      
      // CS301 - Computer Science Assignments
      {
        id: 'assignment_6',
        courseId: 'course_3',
        courseName: 'Data Structures & Algorithms',
        courseCode: 'CS301',
        title: 'Binary Tree Implementation - Video Assessment',
        description: 'Implement a binary search tree and record a video walkthrough of your code explaining the algorithms.',
        dueDate: '2024-01-26T23:59:59Z',
        status: 'upcoming',
        points: 200,
        submissionType: 'video',
        assignmentType: 'Video Assessment',
        isSubmitted: false,
        submittedAt: null,
        grade: null,
        feedback: null,
        instructor: 'Dr. Emily Rodriguez',
        createdAt: '2024-01-08T14:15:00Z',
        attachments: ['bst_requirements.pdf', 'test_cases.pdf']
      },
      {
        id: 'assignment_7',
        courseId: 'course_3',
        courseName: 'Data Structures & Algorithms',
        courseCode: 'CS301',
        title: 'Algorithm Complexity Analysis - Video Discussion',
        description: 'Compare the time complexity of different sorting algorithms. Record a discussion with visual demonstrations.',
        dueDate: '2024-01-22T23:59:59Z',
        status: 'upcoming',
        points: 120,
        submissionType: 'video',
        assignmentType: 'Video Discussion',
        isSubmitted: false,
        submittedAt: null,
        grade: null,
        feedback: null,
        instructor: 'Dr. Emily Rodriguez',
        createdAt: '2024-01-12T16:30:00Z',
        attachments: ['complexity_analysis_guide.pdf']
      },
      
      // ENG101 - English Assignments
      {
        id: 'assignment_8',
        courseId: 'course_4',
        courseName: 'Technical Writing',
        courseCode: 'ENG101',
        title: 'Technical Documentation - Video Lesson',
        description: 'Create a video tutorial explaining how to write effective technical documentation for software projects.',
        dueDate: '2024-01-28T23:59:59Z',
        status: 'upcoming',
        points: 110,
        submissionType: 'video',
        assignmentType: 'Video Lesson',
        isSubmitted: false,
        submittedAt: null,
        grade: null,
        feedback: null,
        instructor: 'Prof. David Thompson',
        createdAt: '2024-01-14T09:15:00Z',
        attachments: ['documentation_standards.pdf', 'example_docs.pdf']
      },
      
      // CHEM102 - Chemistry Assignments
      {
        id: 'assignment_9',
        courseId: 'course_5',
        courseName: 'Organic Chemistry',
        courseCode: 'CHEM102',
        title: 'Reaction Mechanisms - Video Assessment',
        description: 'Record a video explaining the mechanism of SN2 reactions with molecular models and diagrams.',
        dueDate: '2024-02-01T09:00:00Z',
        status: 'upcoming',
        points: 140,
        submissionType: 'video',
        assignmentType: 'Video Assessment',
        isSubmitted: false,
        submittedAt: null,
        grade: null,
        feedback: null,
        instructor: 'Dr. Lisa Wang',
        createdAt: '2024-01-16T11:00:00Z',
        attachments: ['reaction_mechanisms.pdf', 'molecular_models.pdf']
      },
      
      // HIST201 - History Assignments
      {
        id: 'assignment_10',
        courseId: 'course_6',
        courseName: 'World History',
        courseCode: 'HIST201',
        title: 'Renaissance Period Analysis - Video Discussion',
        description: 'Create a video discussing the impact of the Renaissance on modern society with historical evidence.',
        dueDate: '2024-01-24T23:59:59Z',
        status: 'upcoming',
        points: 180,
        submissionType: 'video',
        assignmentType: 'Video Discussion',
        isSubmitted: false,
        submittedAt: null,
        grade: null,
        feedback: null,
        instructor: 'Prof. Robert Martinez',
        createdAt: '2024-01-12T08:00:00Z',
        attachments: ['renaissance_sources.pdf', 'analysis_framework.pdf']
      },
      
      // BIO150 - Biology Assignments
      {
        id: 'assignment_11',
        courseId: 'course_7',
        courseName: 'Cell Biology',
        courseCode: 'BIO150',
        title: 'Mitosis Process - Video Lesson',
        description: 'Create a detailed video explaining the stages of mitosis with visual aids and diagrams.',
        dueDate: '2024-01-28T23:59:59Z',
        status: 'upcoming',
        points: 125,
        submissionType: 'video',
        assignmentType: 'Video Lesson',
        isSubmitted: false,
        submittedAt: null,
        grade: null,
        feedback: null,
        instructor: 'Dr. Jennifer Kim',
        createdAt: '2024-01-17T13:45:00Z',
        attachments: ['mitosis_diagrams.pdf', 'cell_cycle_notes.pdf']
      },
      
      // PSYC101 - Psychology Assignments
      {
        id: 'assignment_12',
        courseId: 'course_8',
        courseName: 'Introduction to Psychology',
        courseCode: 'PSYC101',
        title: 'Memory Systems - Video Discussion',
        description: 'Record a discussion about different types of memory systems and their functions in daily life.',
        dueDate: '2024-01-30T23:59:59Z',
        status: 'upcoming',
        points: 95,
        submissionType: 'video',
        assignmentType: 'Video Discussion',
        isSubmitted: false,
        submittedAt: null,
        grade: null,
        feedback: null,
        instructor: 'Dr. Maria Garcia',
        createdAt: '2024-01-19T10:20:00Z',
        attachments: ['memory_systems_reading.pdf']
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