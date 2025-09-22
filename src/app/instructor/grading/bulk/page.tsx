'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';

interface Submission {
  id: string;
  studentName: string;
  studentId: string;
  assignmentTitle: string;
  assignmentId: string;
  courseName: string;
  courseCode: string;
  submittedAt: string;
  status: 'pending' | 'graded' | 'returned';
  grade?: number;
  feedback?: string;
  fileUrl: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  fileSize: number; // in bytes
}

const BulkGradingPage: React.FC = () => {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [currentSubmissionIndex, setCurrentSubmissionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isGrading, setIsGrading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<string>('all');
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Current submission being graded
  const [currentGrade, setCurrentGrade] = useState<number | ''>('');
  const [currentFeedback, setCurrentFeedback] = useState('');
  const [isAutoAdvance, setIsAutoAdvance] = useState(false);

  useEffect(() => {
    // Get filters from URL params - only run on client side
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const courseFilter = urlParams.get('course');
      const assignmentFilter = urlParams.get('assignment');
      
      console.log('URL Parameters:', { courseFilter, assignmentFilter });
      
      if (courseFilter) {
        setSelectedCourse(courseFilter);
      }
      if (assignmentFilter) {
        setSelectedAssignment(assignmentFilter);
      }
    }
  }, []);

  // Comprehensive mock data for video submissions with realistic student data
  const mockSubmissions: Submission[] = [
      {
        id: 'sub1',
        studentName: 'Alex Thompson',
        studentId: 'student_001',
        assignmentTitle: 'Derivatives and Limits - Video Lesson',
        assignmentId: 'assignment_1',
        courseName: 'Introduction to Calculus',
        courseCode: 'MATH101',
        submittedAt: '2024-01-22T14:30:00Z',
        status: 'pending',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
        duration: 320,
        fileSize: 45000000
      },
      {
        id: 'sub13',
        studentName: 'Jennifer Martinez',
        studentId: 'student_013',
        assignmentTitle: 'Derivatives and Limits - Video Lesson',
        assignmentId: 'assignment_1',
        courseName: 'Introduction to Calculus',
        courseCode: 'MATH101',
        submittedAt: '2024-01-23T09:15:00Z',
        status: 'pending',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/SubaruOutbackOnStreetAndDirt.jpg',
        duration: 180,
        fileSize: 28000000
      },
      {
        id: 'sub14',
        studentName: 'Kevin Park',
        studentId: 'student_014',
        assignmentTitle: 'Derivatives and Limits - Video Lesson',
        assignmentId: 'assignment_1',
        courseName: 'Introduction to Calculus',
        courseCode: 'MATH101',
        submittedAt: '2024-01-22T16:45:00Z',
        status: 'graded',
        grade: 88,
        feedback: 'Good understanding of the concepts! Your explanation of the limit definition was clear. Consider adding more visual examples to help other students understand.',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Toshiba_Canvio_Advance.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Toshiba_Canvio_Advance.jpg',
        duration: 240,
        fileSize: 35000000
      },
      {
        id: 'sub15',
        studentName: 'Rachel Green',
        studentId: 'student_015',
        assignmentTitle: 'Derivatives and Limits - Video Lesson',
        assignmentId: 'assignment_1',
        courseName: 'Introduction to Calculus',
        courseCode: 'MATH101',
        submittedAt: '2024-01-21T13:20:00Z',
        status: 'pending',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/VolkswagenGTIReview.jpg',
        duration: 520,
        fileSize: 75000000
      },
      {
        id: 'sub16',
        studentName: 'Marcus Johnson',
        studentId: 'student_016',
        assignmentTitle: 'Binary Tree Implementation - Video Assessment',
        assignmentId: 'assignment_6',
        courseName: 'Data Structures & Algorithms',
        courseCode: 'CS301',
        submittedAt: '2024-01-23T11:30:00Z',
        status: 'pending',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/WhatCarCanYouGetForAGrand.jpg',
        duration: 340,
        fileSize: 47000000
      },
      {
        id: 'sub17',
        studentName: 'Sophie Chen',
        studentId: 'student_017',
        assignmentTitle: 'Binary Tree Implementation - Video Assessment',
        assignmentId: 'assignment_6',
        courseName: 'Data Structures & Algorithms',
        courseCode: 'CS301',
        submittedAt: '2024-01-22T15:45:00Z',
        status: 'graded',
        grade: 94,
        feedback: 'Excellent implementation! Your code is clean and well-commented. The explanation of the traversal algorithms was particularly impressive.',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/WeAreGoingOnBullrun.jpg',
        duration: 450,
        fileSize: 68000000
      },
      {
        id: 'sub18',
        studentName: 'Tyler Williams',
        studentId: 'student_018',
        assignmentTitle: 'Thermodynamics Concepts - Video Lesson',
        assignmentId: 'assignment_5',
        courseName: 'Physics for Engineers',
        courseCode: 'PHYS201',
        submittedAt: '2024-01-23T08:20:00Z',
        status: 'pending',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg',
        duration: 280,
        fileSize: 39000000
      },
      {
        id: 'sub19',
        studentName: 'Isabella Rodriguez',
        studentId: 'student_019',
        assignmentTitle: 'Renaissance Period Analysis - Video Discussion',
        assignmentId: 'assignment_10',
        courseName: 'World History',
        courseCode: 'HIST201',
        submittedAt: '2024-01-22T19:15:00Z',
        status: 'graded',
        grade: 91,
        feedback: 'Outstanding analysis! Your connection between Renaissance art and social change was insightful. The historical context you provided was excellent.',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg',
        duration: 310,
        fileSize: 43000000
      },
      {
        id: 'sub20',
        studentName: 'Noah Anderson',
        studentId: 'student_020',
        assignmentTitle: 'Mitosis Process - Video Lesson',
        assignmentId: 'assignment_11',
        courseName: 'Cell Biology',
        courseCode: 'BIO150',
        submittedAt: '2024-01-23T14:00:00Z',
        status: 'pending',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerMeltdowns.jpg',
        duration: 400,
        fileSize: 55000000
      },
      {
        id: 'sub21',
        studentName: 'Olivia Taylor',
        studentId: 'student_021',
        assignmentTitle: 'Memory Systems - Video Discussion',
        assignmentId: 'assignment_12',
        courseName: 'Introduction to Psychology',
        courseCode: 'PSYC101',
        submittedAt: '2024-01-22T12:30:00Z',
        status: 'graded',
        grade: 87,
        feedback: 'Good understanding of memory systems! Your examples were relevant and well-explained. Consider diving deeper into the neurological aspects next time.',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg',
        duration: 290,
        fileSize: 41000000
      },
      {
        id: 'sub22',
        studentName: 'Ethan Brown',
        studentId: 'student_022',
        assignmentTitle: 'Technical Documentation - Video Lesson',
        assignmentId: 'assignment_8',
        courseName: 'Technical Writing',
        courseCode: 'ENG101',
        submittedAt: '2024-01-23T10:45:00Z',
        status: 'pending',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg',
        duration: 350,
        fileSize: 48000000
      },
      {
        id: 'sub23',
        studentName: 'Ava Wilson',
        studentId: 'student_023',
        assignmentTitle: 'Data Visualization Techniques - Video Lesson',
        assignmentId: 'assignment_4',
        courseName: 'Data Science Fundamentals',
        courseCode: 'DS201',
        submittedAt: '2024-01-21T17:30:00Z',
        status: 'graded',
        grade: 96,
        feedback: 'Exceptional work! Your data visualization examples were outstanding and your explanations were crystal clear. This is graduate-level quality.',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg',
        duration: 380,
        fileSize: 52000000
      },
      {
        id: 'sub24',
        studentName: 'Liam Davis',
        studentId: 'student_024',
        assignmentTitle: 'Chain Rule Discussion - Video Discussion',
        assignmentId: 'assignment_3',
        courseName: 'Introduction to Calculus',
        courseCode: 'MATH101',
        submittedAt: '2024-01-23T13:15:00Z',
        status: 'pending',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
        duration: 420,
        fileSize: 58000000
      },
      {
        id: 'sub25',
        studentName: 'Zoe Anderson',
        studentId: 'student_025',
        assignmentTitle: 'Integration Techniques - Video Assessment',
        assignmentId: 'assignment_2',
        courseName: 'Introduction to Calculus',
        courseCode: 'MATH101',
        submittedAt: '2024-01-22T14:30:00Z',
        status: 'graded',
        grade: 94,
        feedback: 'Excellent work on integration by parts! Your explanation was clear and your examples were well-chosen. Great job showing the step-by-step process.',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg',
        duration: 350,
        fileSize: 48000000
      },
      {
        id: 'sub26',
        studentName: 'Caleb Thompson',
        studentId: 'student_026',
        assignmentTitle: 'Optimization Problems - Video Assessment',
        assignmentId: 'assignment_4',
        courseName: 'Introduction to Calculus',
        courseCode: 'MATH101',
        submittedAt: '2024-01-24T11:20:00Z',
        status: 'pending',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg',
        duration: 290,
        fileSize: 41000000
      },
      {
        id: 'sub27',
        studentName: 'Maya Patel',
        studentId: 'student_027',
        assignmentTitle: 'Series Convergence - Video Lesson',
        assignmentId: 'assignment_5',
        courseName: 'Introduction to Calculus',
        courseCode: 'MATH101',
        submittedAt: '2024-01-25T16:45:00Z',
        status: 'graded',
        grade: 89,
        feedback: 'Good understanding of convergence tests! Your examples were helpful, but try to be more systematic in your approach to testing series.',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerMeltdowns.jpg',
        duration: 400,
        fileSize: 55000000
      },
      {
        id: 'sub28',
        studentName: 'Nathan Wright',
        studentId: 'student_028',
        assignmentTitle: 'L\'Hôpital\'s Rule - Video Assessment',
        assignmentId: 'assignment_6',
        courseName: 'Introduction to Calculus',
        courseCode: 'MATH101',
        submittedAt: '2024-01-26T09:30:00Z',
        status: 'pending',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg',
        duration: 310,
        fileSize: 43000000
      },
      {
        id: 'sub29',
        studentName: 'Grace Lee',
        studentId: 'student_029',
        assignmentTitle: 'Related Rates Problems - Video Discussion',
        assignmentId: 'assignment_7',
        courseName: 'Introduction to Calculus',
        courseCode: 'MATH101',
        submittedAt: '2024-01-27T13:15:00Z',
        status: 'graded',
        grade: 92,
        feedback: 'Outstanding work on related rates! Your problem selection was excellent and your explanations were very clear. The visual diagrams really helped.',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg',
        duration: 280,
        fileSize: 39000000
      },
      {
        id: 'sub30',
        studentName: 'Owen Garcia',
        studentId: 'student_030',
        assignmentTitle: 'Fundamental Theorem of Calculus - Video Lesson',
        assignmentId: 'assignment_8',
        courseName: 'Introduction to Calculus',
        courseCode: 'MATH101',
        submittedAt: '2024-01-28T15:20:00Z',
        status: 'pending',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/WeAreGoingOnBullrun.jpg',
        duration: 450,
        fileSize: 68000000
      },
      {
        id: 'sub31',
        studentName: 'Alex Chen',
        studentId: 'student_031',
        assignmentTitle: 'Binary Tree Implementation - Video Assessment',
        assignmentId: 'assignment_1',
        courseName: 'Introduction to Computer Science',
        courseCode: 'CS101',
        submittedAt: '2024-01-23T10:30:00Z',
        status: 'graded',
        grade: 87,
        feedback: 'Good implementation! Your explanation of the traversal methods was clear. Consider adding more comments to your code for better readability.',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
        duration: 420,
        fileSize: 58000000
      },
      {
        id: 'sub32',
        studentName: 'Sofia Martinez',
        studentId: 'student_032',
        assignmentTitle: 'Binary Tree Implementation - Video Assessment',
        assignmentId: 'assignment_1',
        courseName: 'Introduction to Computer Science',
        courseCode: 'CS101',
        submittedAt: '2024-01-23T14:45:00Z',
        status: 'pending',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg',
        duration: 380,
        fileSize: 52000000
      },
      {
        id: 'sub33',
        studentName: 'Daniel Kim',
        studentId: 'student_033',
        assignmentTitle: 'Binary Tree Implementation - Video Assessment',
        assignmentId: 'assignment_1',
        courseName: 'Introduction to Computer Science',
        courseCode: 'CS101',
        submittedAt: '2024-01-24T09:15:00Z',
        status: 'graded',
        grade: 92,
        feedback: 'Excellent work! Your code is clean and well-structured. The visual representation of the tree was particularly helpful.',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg',
        duration: 350,
        fileSize: 48000000
      },
      {
        id: 'sub34',
        studentName: 'Emma Wilson',
        studentId: 'student_034',
        assignmentTitle: 'Binary Tree Implementation - Video Assessment',
        assignmentId: 'assignment_1',
        courseName: 'Introduction to Computer Science',
        courseCode: 'CS101',
        submittedAt: '2024-01-24T16:20:00Z',
        status: 'pending',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg',
        duration: 290,
        fileSize: 41000000
      },
      {
        id: 'sub35',
        studentName: 'Ryan O\'Connor',
        studentId: 'student_035',
        assignmentTitle: 'Binary Tree Implementation - Video Assessment',
        assignmentId: 'assignment_1',
        courseName: 'Introduction to Computer Science',
        courseCode: 'CS101',
        submittedAt: '2024-01-25T11:30:00Z',
        status: 'graded',
        grade: 85,
        feedback: 'Good effort! Your implementation works correctly, but try to explain your thought process more clearly in future videos.',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerMeltdowns.jpg',
        duration: 400,
        fileSize: 55000000
      },
      {
        id: 'sub2',
        studentName: 'Maria Rodriguez',
        studentId: 'student_002',
        assignmentTitle: 'Binary Tree Implementation - Video Assessment',
        assignmentId: 'assignment_1',
        courseName: 'Introduction to Computer Science',
        courseCode: 'CS101',
        submittedAt: '2024-01-22T12:15:00Z',
        status: 'pending',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg',
        duration: 480,
        fileSize: 62000000
      },
      {
        id: 'sub3',
        studentName: 'James Wilson',
        studentId: 'student_003',
        assignmentTitle: 'Thermodynamics Concepts - Video Lesson',
        assignmentId: 'assignment_5',
        courseName: 'Physics for Engineers',
        courseCode: 'PHYS201',
        submittedAt: '2024-01-21T10:45:00Z',
        status: 'graded',
        grade: 92,
        feedback: 'Outstanding explanation! Your real-world examples made complex concepts accessible. The visual demonstrations were particularly effective.',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
        duration: 420,
        fileSize: 58000000
      },
      {
        id: 'sub4',
        studentName: 'Sarah Kim',
        studentId: 'student_004',
        assignmentTitle: 'Renaissance Period Analysis - Video Discussion',
        assignmentId: 'assignment_10',
        courseName: 'World History',
        courseCode: 'HIST201',
        submittedAt: '2024-01-21T16:20:00Z',
        status: 'pending',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg',
        duration: 380,
        fileSize: 52000000
      },
      {
        id: 'sub5',
        studentName: 'David Chen',
        studentId: 'student_005',
        assignmentTitle: 'Integration Techniques - Video Assessment',
        assignmentId: 'assignment_2',
        courseName: 'Introduction to Calculus',
        courseCode: 'MATH101',
        submittedAt: '2024-01-20T14:10:00Z',
        status: 'graded',
        grade: 95,
        feedback: 'Excellent work! Your explanation of the substitution method was very clear and the step-by-step approach was perfect for learning.',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg',
        duration: 350,
        fileSize: 48000000
      },
      {
        id: 'sub6',
        studentName: 'Emma Johnson',
        studentId: 'student_006',
        assignmentTitle: 'Mitosis Process - Video Lesson',
        assignmentId: 'assignment_11',
        courseName: 'Cell Biology',
        courseCode: 'BIO150',
        submittedAt: '2024-01-20T11:30:00Z',
        status: 'pending',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg',
        duration: 290,
        fileSize: 41000000
      },
      {
        id: 'sub7',
        studentName: 'Michael Brown',
        studentId: 'student_007',
        assignmentTitle: 'Technical Documentation - Video Lesson',
        assignmentId: 'assignment_8',
        courseName: 'Technical Writing',
        courseCode: 'ENG101',
        submittedAt: '2024-01-19T15:45:00Z',
        status: 'graded',
        grade: 88,
        feedback: 'Good technical content and clear explanations. Consider improving the visual presentation and adding more examples.',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerMeltdowns.jpg',
        duration: 400,
        fileSize: 55000000
      },
      {
        id: 'sub8',
        studentName: 'Lisa Garcia',
        studentId: 'student_008',
        assignmentTitle: 'Memory Systems - Video Discussion',
        assignmentId: 'assignment_12',
        courseName: 'Introduction to Psychology',
        courseCode: 'PSYC101',
        submittedAt: '2024-01-19T13:20:00Z',
        status: 'pending',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg',
        duration: 310,
        fileSize: 43000000
      },
      {
        id: 'sub9',
        studentName: 'Ryan O\'Connor',
        studentId: 'student_009',
        assignmentTitle: 'Basic Programming Concepts - Video Assessment',
        assignmentId: 'assignment_3',
        courseName: 'Introduction to Computer Science',
        courseCode: 'CS101',
        submittedAt: '2024-01-18T09:15:00Z',
        status: 'graded',
        grade: 78,
        feedback: 'Good effort! Your code examples were clear, but try to explain your thought process more thoroughly. Keep practicing!',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg',
        duration: 280,
        fileSize: 39000000
      },
      {
        id: 'sub10',
        studentName: 'Priya Patel',
        studentId: 'student_010',
        assignmentTitle: 'Data Visualization Techniques - Video Lesson',
        assignmentId: 'assignment_4',
        courseName: 'Data Science Fundamentals',
        courseCode: 'DS201',
        submittedAt: '2024-01-22T08:30:00Z',
        status: 'graded',
        grade: 96,
        feedback: 'Exceptional work! Your data visualization examples were outstanding and your explanations were crystal clear. This is graduate-level quality.',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/WeAreGoingOnBullrun.jpg',
        duration: 450,
        fileSize: 68000000
      },
      {
        id: 'sub11',
        studentName: 'Alex Thompson',
        studentId: 'student_001',
        assignmentTitle: 'Integration by Parts - Video Assessment',
        assignmentId: 'assignment_13',
        courseName: 'Introduction to Calculus',
        courseCode: 'MATH101',
        submittedAt: '2024-01-21T16:45:00Z',
        status: 'pending',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/WhatCarCanYouGetForAGrand.jpg',
        duration: 340,
        fileSize: 47000000
      },
      {
        id: 'sub12',
        studentName: 'Maria Rodriguez',
        studentId: 'student_002',
        assignmentTitle: 'Machine Learning Algorithms - Video Discussion',
        assignmentId: 'assignment_14',
        courseName: 'Data Structures & Algorithms',
        courseCode: 'CS301',
        submittedAt: '2024-01-20T14:20:00Z',
        status: 'graded',
        grade: 91,
        feedback: 'Excellent analysis of machine learning algorithms! Your comparison between different approaches was insightful and well-structured.',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/VolkswagenGTIReview.jpg',
        duration: 520,
        fileSize: 75000000
      }
    ];

  // Set submissions directly
  useEffect(() => {
    console.log('Loaded submissions:', mockSubmissions.length);
    console.log('Sample submission:', mockSubmissions[0]);
    setSubmissions(mockSubmissions);
    setIsLoading(false);
  }, []);

  // Video controls
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Navigation between submissions
  const goToNextSubmission = () => {
    if (currentSubmissionIndex < filteredSubmissions.length - 1) {
      setCurrentSubmissionIndex(currentSubmissionIndex + 1);
      setCurrentGrade('');
      setCurrentFeedback('');
      setIsPlaying(false);
    }
  };

  const goToPreviousSubmission = () => {
    if (currentSubmissionIndex > 0) {
      setCurrentSubmissionIndex(currentSubmissionIndex - 1);
      setCurrentGrade('');
      setCurrentFeedback('');
      setIsPlaying(false);
    }
  };

  const goToSubmission = (index: number) => {
    setCurrentSubmissionIndex(index);
    setCurrentGrade('');
    setCurrentFeedback('');
    setIsPlaying(false);
  };

  // Grading functions
  const handleGradeSubmission = async () => {
    if (!currentGrade || currentSubmissionIndex >= filteredSubmissions.length) return;

    setIsGrading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update submission with grade
      setSubmissions(prev => prev.map(sub => 
        sub.id === filteredSubmissions[currentSubmissionIndex].id
          ? {
              ...sub,
              status: 'graded' as const,
              grade: Number(currentGrade),
              feedback: currentFeedback || 'Graded'
            }
          : sub
      ));
      
      setCurrentGrade('');
      setCurrentFeedback('');
      
      // Auto-advance to next submission if enabled
      if (isAutoAdvance && currentSubmissionIndex < filteredSubmissions.length - 1) {
        setTimeout(() => {
          goToNextSubmission();
        }, 1000);
      }
    } catch (error) {
      console.error('Error grading submission:', error);
      alert('Error grading submission. Please try again.');
    } finally {
      setIsGrading(false);
    }
  };

  // Use mockSubmissions directly for filtering to avoid state issues
  const submissionsToFilter = submissions.length > 0 ? submissions : mockSubmissions;
  
  const filteredSubmissions = submissionsToFilter.filter(submission => {
    const courseMatch = selectedCourse === 'all' || 
      submission.courseName.toLowerCase().includes(selectedCourse.toLowerCase()) ||
      submission.courseCode.toLowerCase().includes(selectedCourse.toLowerCase());
    const assignmentMatch = selectedAssignment === 'all' || submission.assignmentId === selectedAssignment;
    
    return courseMatch && assignmentMatch;
  });
  
  console.log('Filtered submissions count:', filteredSubmissions.length);
  console.log('Selected course:', selectedCourse);
  console.log('Selected assignment:', selectedAssignment);
  console.log('Total submissions:', submissionsToFilter.length);

  const currentSubmission = filteredSubmissions[currentSubmissionIndex];

  // Format time helper
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format file size helper
  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'returned':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'graded':
        return 'Graded';
      case 'returned':
        return 'Returned';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <InstructorRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading submissions...</p>
          </div>
        </div>
      </InstructorRoute>
    );
  }

  if (filteredSubmissions.length === 0) {
    return (
      <InstructorRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
          <div className="text-center">
            <div className="text-6xl mb-4">📹</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">No Submissions Found</h1>
            <p className="text-gray-600 mb-4">No video submissions match your current filter.</p>
            <div className="text-sm text-gray-500 mb-6">
              <p>Course: {selectedCourse}</p>
              <p>Assignment: {selectedAssignment}</p>
              <p>Total submissions: {submissions.length}</p>
            </div>
            <div className="space-x-4">
              <button
                onClick={() => {
                  setSelectedCourse('all');
                  setSelectedAssignment('all');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Show All Submissions
              </button>
              <button
                onClick={() => router.back()}
                className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-blue-500 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </InstructorRoute>
    );
  }

  return (
    <InstructorRoute>
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-yellow-300/30 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <span className="text-2xl">←</span>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-1">
                    Video Grading Interface
                  </h1>
                  <p className="text-gray-600 text-sm">
                    {currentSubmissionIndex + 1} of {filteredSubmissions.length} submissions
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Course Filter */}
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Courses</option>
                  <option value="calculus">Introduction to Calculus (MATH101)</option>
                  <option value="computer">Data Structures & Algorithms (CS301)</option>
                  <option value="physics">Physics for Engineers (PHYS201)</option>
                  <option value="history">World History (HIST201)</option>
                  <option value="biology">Cell Biology (BIO150)</option>
                  <option value="english">Technical Writing (ENG101)</option>
                  <option value="psychology">Introduction to Psychology (PSYC101)</option>
                  <option value="science">Introduction to Computer Science (CS101)</option>
                  <option value="data">Data Science Fundamentals (DS201)</option>
                </select>
                
                {/* Assignment Filter */}
                <select
                  value={selectedAssignment}
                  onChange={(e) => setSelectedAssignment(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Assignments</option>
                  <option value="assignment_1">Derivatives and Limits - Video Lesson</option>
                  <option value="assignment_2">Integration Techniques - Video Assessment</option>
                  <option value="assignment_3">Basic Programming Concepts - Video Assessment</option>
                  <option value="assignment_4">Data Visualization Techniques - Video Lesson</option>
                  <option value="assignment_5">Thermodynamics Concepts - Video Lesson</option>
                  <option value="assignment_6">Binary Tree Implementation - Video Assessment</option>
                  <option value="assignment_8">Technical Documentation - Video Lesson</option>
                  <option value="assignment_10">Renaissance Period Analysis - Video Discussion</option>
                  <option value="assignment_11">Mitosis Process - Video Lesson</option>
                  <option value="assignment_12">Memory Systems - Video Discussion</option>
                  <option value="assignment_13">Integration by Parts - Video Assessment</option>
                  <option value="assignment_14">Machine Learning Algorithms - Video Discussion</option>
                </select>
                
                {/* Auto-advance toggle */}
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isAutoAdvance}
                    onChange={(e) => setIsAutoAdvance(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span>Auto-advance</span>
                </label>
              </div>
            </div>
          </div>
        </div>

            {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-6 h-[calc(100vh-200px)]">
            <div className="h-full flex flex-col">
              {/* Global Playback Speed Control */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Global Playback Speed:</span>
                  <div className="flex items-center space-x-2">
                    {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(speed => (
                      <button
                        key={speed}
                        onClick={() => handleSpeedChange(speed)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          playbackSpeed === speed
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Video List - Vertical Scrolling */}
              <div className="flex-1 overflow-y-auto space-y-6">
                {filteredSubmissions.map((submission, index) => (
                  <div
                    key={submission.id}
                    className={`p-6 rounded-lg border-2 transition-all duration-300 ${
                      index === currentSubmissionIndex
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Video Player */}
                      <div>
                        <div className="bg-black rounded-lg overflow-hidden mb-4 relative">
                          <video
                            ref={index === currentSubmissionIndex ? videoRef : null}
                            src={submission.fileUrl}
                            className="w-full h-64 object-contain"
                            onTimeUpdate={index === currentSubmissionIndex ? handleTimeUpdate : undefined}
                            onLoadedMetadata={index === currentSubmissionIndex ? handleLoadedMetadata : undefined}
                            onPlay={() => index === currentSubmissionIndex && setIsPlaying(true)}
                            onPause={() => index === currentSubmissionIndex && setIsPlaying(false)}
                            onEnded={() => index === currentSubmissionIndex && setIsPlaying(false)}
                          />
                          
                          {/* Video Controls Overlay */}
                          {index === currentSubmissionIndex && (
                            <div className="absolute bottom-4 left-4 right-4">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={handlePlayPause}
                                  className="w-8 h-8 bg-black/70 text-white rounded-full flex items-center justify-center hover:bg-black/90 transition-colors"
                                >
                                  {isPlaying ? '⏸️' : '▶️'}
                                </button>
                                
                                <div className="flex-1 bg-gray-200 rounded-full h-1">
                                  <div 
                                    className="bg-blue-500 h-1 rounded-full transition-all duration-200"
                                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                                  />
                                </div>
                                
                                <span className="text-white text-xs">
                                  {formatTime(currentTime)} / {formatTime(duration)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Submission Info and Grading Form */}
                      <div className="space-y-4">
                        {/* Submission Info */}
                        <div>
                          <h2 className="text-xl font-bold text-gray-800 mb-2">
                            {submission.studentName}
                          </h2>
                          <p className="text-sm text-gray-600 mb-1">
                            {submission.assignmentTitle}
                          </p>
                          <p className="text-xs text-gray-500 mb-3">
                            {submission.courseName} ({submission.courseCode})
                          </p>
                          
                          <div className="flex items-center justify-between mb-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                              {getStatusText(submission.status)}
                            </span>
                            {submission.grade && (
                              <span className="text-sm font-bold text-green-600">
                                Grade: {submission.grade}%
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Grading Form */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Grade (0-100)
                            </label>
                            <input
                              type="number"
                              value={index === currentSubmissionIndex ? currentGrade : ''}
                              onChange={(e) => {
                                if (index === currentSubmissionIndex) {
                                  setCurrentGrade(e.target.value ? Number(e.target.value) : '');
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              min="0"
                              max="100"
                              placeholder="Enter grade"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Feedback
                            </label>
                            <textarea
                              value={index === currentSubmissionIndex ? currentFeedback : ''}
                              onChange={(e) => {
                                if (index === currentSubmissionIndex) {
                                  setCurrentFeedback(e.target.value);
                                }
                              }}
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter detailed feedback for the student..."
                            />
                          </div>
                          
                          <button
                            onClick={() => {
                              if (index === currentSubmissionIndex) {
                                handleGradeSubmission();
                              } else {
                                goToSubmission(index);
                              }
                            }}
                            disabled={index === currentSubmissionIndex ? (!currentGrade || isGrading) : false}
                            className={`w-full px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                              index === currentSubmissionIndex
                                ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
                                : 'bg-gray-500 text-white hover:bg-gray-600'
                            }`}
                          >
                            {index === currentSubmissionIndex 
                              ? (isGrading ? 'Grading...' : 'Grade Submission')
                              : 'Select This Submission'
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </InstructorRoute>
  );
};

export default BulkGradingPage;
