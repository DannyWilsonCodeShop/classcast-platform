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
  assignment?: {
    enablePeerResponses?: boolean;
    responseDueDate?: string;
    minResponsesRequired?: number;
    maxResponsesPerVideo?: number;
    responseWordLimit?: number;
    responseCharacterLimit?: number;
  };
  isPinned?: boolean;
  isHighlighted?: boolean;
  pinnedAt?: string;
  highlightedAt?: string;
  peerResponses?: {
    totalResponses: number;
    submittedResponses: number;
    averageResponseLength: number;
    responseQuality: 'excellent' | 'good' | 'adequate' | 'needs_improvement';
    lastResponseDate?: string;
  };
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
  
  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // AI Grading state
  const [isAIAnalyzing, setIsAIAnalyzing] = useState<{[key: string]: boolean}>({});
  const [aiSuggestions, setAiSuggestions] = useState<{[key: string]: {
    suggestedGrade: number | null;
    suggestedFeedback: string;
    rubric: {
      contentQuality: { earned: number; possible: number };
      presentation: { earned: number; possible: number };
      technicalAspects: { earned: number; possible: number };
      engagement: { earned: number; possible: number };
    };
    strengths: string[];
    improvements: string[];
  }}>({});
  const [showAIPanel, setShowAIPanel] = useState<{[key: string]: boolean}>({});
  
  // Pin/Highlight state
  const [pinnedSubmissions, setPinnedSubmissions] = useState<Set<string>>(new Set());
  const [highlightedSubmissions, setHighlightedSubmissions] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Get filters from URL params - only run on client side
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const courseFilter = urlParams.get('course');
      const assignmentFilter = urlParams.get('assignment');
      const submissionFilter = urlParams.get('submission');
      
      console.log('URL Parameters:', { courseFilter, assignmentFilter, submissionFilter });
      
      if (courseFilter) {
        setSelectedCourse(courseFilter);
      }
      if (assignmentFilter) {
        setSelectedAssignment(assignmentFilter);
      }
    }
  }, []);

  // Function to determine if submission is late
  const isSubmissionLate = (submission: Submission, assignmentDueDate?: string) => {
    if (!assignmentDueDate) return false;
    
    const dueDate = new Date(assignmentDueDate);
    const submittedDate = new Date(submission.submittedAt);
    
    return submittedDate > dueDate;
  };

  // Function to get submission timing status
  const getSubmissionTimingStatus = (submission: Submission, assignmentDueDate?: string) => {
    if (!assignmentDueDate) return { status: 'unknown', color: 'gray', text: 'No due date' };
    
    const isLate = isSubmissionLate(submission, assignmentDueDate);
    
    if (isLate) {
      return { status: 'late', color: 'yellow', text: 'Late' };
    } else {
      return { status: 'ontime', color: 'green', text: 'On Time' };
    }
  };

  // Function to get peer responses for a specific student
  const getPeerResponsesForStudent = (studentId: string) => {
    // TODO: Fetch real peer responses from API
    return [];
  };

  // Legacy function for compatibility
  const getMockPeerResponsesForStudent = (studentId: string) => {
    const mockResponses = [
      {
        id: 'response_1',
        reviewerId: 'student_001',
        reviewerName: 'Alex Thompson',
        reviewedStudentId: 'student_002',
        reviewedStudentName: 'Sarah Chen',
        videoId: 'video_2',
        assignmentId: 'assignment_1',
        content: 'Great explanation of the data structures! I really liked how you broke down the complexity analysis step by step. One suggestion would be to add more examples of real-world applications where these structures are used.',
        wordCount: 35,
        characterCount: 245,
        isSubmitted: true,
        submittedAt: '2024-01-23T10:15:00Z',
        qualityScore: 4,
        aiGrade: {
          overallGrade: 85,
          rubricScores: {
            contentQuality: { earned: 4, possible: 5, feedback: 'Good content analysis' },
            engagement: { earned: 4, possible: 5, feedback: 'Engaging and helpful' },
            criticalThinking: { earned: 3, possible: 5, feedback: 'Could be more critical' },
            communication: { earned: 4, possible: 5, feedback: 'Clear communication' }
          }
        }
      },
      {
        id: 'response_2',
        reviewerId: 'student_001',
        reviewerName: 'Alex Thompson',
        reviewedStudentId: 'student_003',
        reviewedStudentName: 'Michael Rodriguez',
        videoId: 'video_3',
        assignmentId: 'assignment_1',
        content: 'Your presentation was very clear and well-structured. The visual aids really helped me understand the concepts. However, I think you could have gone deeper into the practical implementation details.',
        wordCount: 28,
        characterCount: 198,
        isSubmitted: true,
        submittedAt: '2024-01-22T14:30:00Z',
        qualityScore: 4,
        aiGrade: {
          overallGrade: 82,
          rubricScores: {
            contentQuality: { earned: 4, possible: 5, feedback: 'Good structure' },
            engagement: { earned: 4, possible: 5, feedback: 'Engaging presentation' },
            criticalThinking: { earned: 3, possible: 5, feedback: 'Needs more depth' },
            communication: { earned: 4, possible: 5, feedback: 'Clear delivery' }
          }
        }
      },
      {
        id: 'response_3',
        reviewerId: 'student_001',
        reviewerName: 'Alex Thompson',
        reviewedStudentId: 'student_004',
        reviewedStudentName: 'Emily Davis',
        videoId: 'video_4',
        assignmentId: 'assignment_1',
        content: 'Excellent work on the algorithm explanation! I particularly appreciated the step-by-step walkthrough. One area for improvement could be discussing the time and space complexity more thoroughly.',
        wordCount: 32,
        characterCount: 220,
        isSubmitted: false,
        submittedAt: '2024-01-24T09:45:00Z',
        qualityScore: 5,
        aiGrade: null
      },
      {
        id: 'response_4',
        reviewerId: 'student_002',
        reviewerName: 'Sarah Chen',
        reviewedStudentId: 'student_001',
        reviewedStudentName: 'Alex Thompson',
        videoId: 'video_1',
        assignmentId: 'assignment_1',
        content: 'Really impressive work on the machine learning concepts! Your explanation of neural networks was very clear and easy to follow. I especially liked the visual diagrams you used.',
        wordCount: 28,
        characterCount: 195,
        isSubmitted: true,
        submittedAt: '2024-01-23T11:20:00Z',
        qualityScore: 5,
        aiGrade: {
          overallGrade: 92,
          rubricScores: {
            contentQuality: { earned: 5, possible: 5, feedback: 'Excellent content' },
            engagement: { earned: 5, possible: 5, feedback: 'Very engaging' },
            criticalThinking: { earned: 4, possible: 5, feedback: 'Good analysis' },
            communication: { earned: 5, possible: 5, feedback: 'Clear communication' }
          }
        }
      },
      {
        id: 'response_5',
        reviewerId: 'student_003',
        reviewerName: 'Michael Rodriguez',
        reviewedStudentId: 'student_001',
        reviewedStudentName: 'Alex Thompson',
        videoId: 'video_1',
        assignmentId: 'assignment_1',
        content: 'Good job overall! The technical content was solid, but I think you could have provided more practical examples or code snippets to illustrate the concepts.',
        wordCount: 25,
        characterCount: 180,
        isSubmitted: true,
        submittedAt: '2024-01-22T16:45:00Z',
        qualityScore: 3,
        aiGrade: {
          overallGrade: 75,
          rubricScores: {
            contentQuality: { earned: 3, possible: 5, feedback: 'Good but needs examples' },
            engagement: { earned: 3, possible: 5, feedback: 'Could be more engaging' },
            criticalThinking: { earned: 3, possible: 5, feedback: 'Basic analysis' },
            communication: { earned: 4, possible: 5, feedback: 'Clear but basic' }
          }
        }
      }
    ];

    // Return responses for the specific student, or empty array if no responses
    return mockResponses.filter(response => response.reviewerId === studentId);
  };

  // Assignment due date for timing calculations
  const assignmentDueDate = ''; // TODO: Get from assignment data

  // Fetch real submissions from API
  const submissions: Submission[] = [];
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
        courseName: 'Introduction to Computer Science',
        courseCode: 'CS101',
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
        courseName: 'Introduction to Computer Science',
        courseCode: 'CS101',
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
        courseName: 'Introduction to Computer Science',
        courseCode: 'CS101',
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
        courseName: 'Introduction to Computer Science',
        courseCode: 'CS101',
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
        courseName: 'Introduction to Computer Science',
        courseCode: 'CS101',
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
        courseName: 'Introduction to Computer Science',
        courseCode: 'CS101',
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
        courseName: 'Introduction to Computer Science',
        courseCode: 'CS101',
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
        courseName: 'Introduction to Computer Science',
        courseCode: 'CS101',
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
        courseName: 'Introduction to Computer Science',
        courseCode: 'CS101',
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
    const submissions: Submission[] = [];
    setSubmissions(submissions);
    setIsLoading(false);
  }, []);

  // Navigate to specific submission if provided in URL
  useEffect(() => {
    if (typeof window !== 'undefined' && submissions.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const submissionFilter = urlParams.get('submission');
      
      if (submissionFilter) {
        // Find submission by ID
        const submissionIndex = submissions.findIndex(sub => sub.id === submissionFilter);
        if (submissionIndex !== -1) {
          setCurrentSubmissionIndex(submissionIndex);
        }
      }
    }
  }, [submissions.length]);

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
    
    // Load existing grade and feedback if available
    const submission = filteredSubmissions[index];
    if (submission) {
      setCurrentGrade(submission.grade || '');
      setCurrentFeedback(submission.feedback || '');
    } else {
      setCurrentGrade('');
      setCurrentFeedback('');
    }
    
    setIsPlaying(false);
    setSaveStatus('saved'); // Reset save status when switching
  };

  // Auto-save function
  const autoSave = async (submissionId: string, grade: number | '', feedback: string) => {
    if (!grade) return; // Don't save if no grade is provided
    
    setSaveStatus('saving');
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update submission with grade
      setSubmissions(prev => prev.map(sub => 
        sub.id === submissionId
          ? {
              ...sub,
              status: 'graded' as const,
              grade: Number(grade),
              feedback: feedback || 'Graded'
            }
          : sub
      ));
      
      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch (error) {
      setSaveStatus('error');
      console.error('Error auto-saving:', error);
    }
  };

  // Debounced auto-save
  const debouncedAutoSave = (submissionId: string, grade: number | '', feedback: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(submissionId, grade, feedback);
    }, 1000); // Save after 1 second of inactivity
  };

  // Handle grade change with auto-save
  const handleGradeChange = (grade: number | '') => {
    setCurrentGrade(grade);
    if (currentSubmission && grade) {
      debouncedAutoSave(currentSubmission.id, grade, currentFeedback);
    }
  };

  // Handle feedback change with auto-save
  const handleFeedbackChange = (feedback: string) => {
    setCurrentFeedback(feedback);
    if (currentSubmission && currentGrade) {
      debouncedAutoSave(currentSubmission.id, currentGrade, feedback);
    }
  };

  // AI Analysis function
  const analyzeWithAI = async (submission: Submission) => {
    setIsAIAnalyzing(prev => ({ ...prev, [submission.id]: true }));
    
    try {
      // Simulate AI analysis with realistic delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate rubric-based scoring (4 out of 5 points for each category)
      const rubric = {
        contentQuality: { earned: 4, possible: 5 },
        presentation: { earned: 4, possible: 5 },
        technicalAspects: { earned: 4, possible: 5 },
        engagement: { earned: 4, possible: 5 },
      };
      
      // Calculate total grade based on rubric
      const totalEarned = Object.values(rubric).reduce((sum, category) => sum + category.earned, 0);
      const totalPossible = Object.values(rubric).reduce((sum, category) => sum + category.possible, 0);
      const suggestedGrade = Math.round((totalEarned / totalPossible) * 100);
      
      const analysis = {
        suggestedGrade,
        suggestedFeedback: generateAIFeedback(submission),
        rubric,
        strengths: generateStrengths(),
        improvements: generateImprovements(),
      };
      
      setAiSuggestions(prev => ({ ...prev, [submission.id]: analysis }));
      setShowAIPanel(prev => ({ ...prev, [submission.id]: true }));
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setIsAIAnalyzing(prev => ({ ...prev, [submission.id]: false }));
    }
  };

  // Generate AI feedback based on submission
  const generateAIFeedback = (submission: Submission): string => {
    const feedbackTemplates = [
      `Great work on ${submission.assignmentTitle}! Your explanation was clear and well-structured. The video quality is excellent and your presentation skills are strong. Consider adding more examples to further illustrate your points.`,
      `Solid submission for ${submission.assignmentTitle}. You demonstrated good understanding of the concepts. The technical aspects were well-executed. To improve, try to engage more with the audience and provide more detailed explanations.`,
      `Excellent presentation of ${submission.assignmentTitle}! Your content was comprehensive and your delivery was engaging. The video production quality is professional. Keep up the great work!`,
      `Good effort on ${submission.assignmentTitle}. You covered the main points well. The presentation was clear and your understanding of the material is evident. Consider adding more visual aids to enhance the learning experience.`,
      `Outstanding work on ${submission.assignmentTitle}! Your explanation was thorough and your presentation was very engaging. The technical execution was flawless. This is exactly what we're looking for in video submissions.`
    ];
    
    return feedbackTemplates[Math.floor(Math.random() * feedbackTemplates.length)];
  };

  const generateStrengths = (): string[] => {
    const allStrengths = [
      "Clear and articulate presentation",
      "Excellent video quality and production",
      "Well-structured content organization",
      "Strong understanding of the material",
      "Engaging delivery style",
      "Good use of visual aids",
      "Comprehensive coverage of topics",
      "Professional presentation skills",
      "Clear audio quality",
      "Effective time management"
    ];
    
    return allStrengths
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 3) + 3);
  };

  const generateImprovements = (): string[] => {
    const allImprovements = [
      "Add more specific examples to illustrate concepts",
      "Consider using more visual aids or diagrams",
      "Practice speaking at a slightly slower pace",
      "Include more interactive elements",
      "Provide more detailed explanations for complex topics",
      "Consider adding a summary or conclusion",
      "Improve lighting for better video quality",
      "Add captions or subtitles for accessibility",
      "Include more real-world applications",
      "Practice more before recording"
    ];
    
    return allImprovements
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 3) + 2);
  };

  // Apply AI suggestions
  const applyAISuggestions = (submissionId: string) => {
    const suggestions = aiSuggestions[submissionId];
    if (suggestions) {
      setCurrentGrade(suggestions.suggestedGrade || '');
      setCurrentFeedback(suggestions.suggestedFeedback);
      
      // Auto-save the AI suggestions
      if (suggestions.suggestedGrade) {
        debouncedAutoSave(submissionId, suggestions.suggestedGrade, suggestions.suggestedFeedback);
      }
    }
  };

  // Pin/Highlight functions
  const togglePin = (submissionId: string) => {
    setPinnedSubmissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
    });
    
    // Update submission in state
    setSubmissions(prev => prev.map(sub => 
      sub.id === submissionId 
        ? { 
            ...sub, 
            isPinned: !sub.isPinned,
            pinnedAt: !sub.isPinned ? new Date().toISOString() : undefined
          }
        : sub
    ));
  };

  const toggleHighlight = (submissionId: string) => {
    setHighlightedSubmissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
    });
    
    // Update submission in state
    setSubmissions(prev => prev.map(sub => 
      sub.id === submissionId 
        ? { 
            ...sub, 
            isHighlighted: !sub.isHighlighted,
            highlightedAt: !sub.isHighlighted ? new Date().toISOString() : undefined
          }
        : sub
    ));
  };

  // Use submissions for filtering
  const submissionsToFilter = submissions;
  
  const filteredSubmissions = submissionsToFilter.filter(submission => {
    const courseMatch = selectedCourse === 'all' || 
      submission.courseName.toLowerCase().includes(selectedCourse.toLowerCase()) ||
      submission.courseCode.toLowerCase().includes(selectedCourse.toLowerCase()) ||
      submission.courseCode.toLowerCase().replace('-', '').includes(selectedCourse.toLowerCase().replace('-', ''));
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/instructor/dashboard')}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <span className="text-2xl">&lt;</span>
                </button>
                <div className="flex items-center space-x-4">
                  <img 
                    src="/MyClassCast (800 x 200 px).png" 
                    alt="ClassCast Logo" 
                    className="h-8 w-auto"
                  />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">
                      Video Grading Interface
                    </h1>
                    <p className="text-gray-600 text-sm">
                      {currentSubmissionIndex + 1} of {filteredSubmissions.length} submissions
                    </p>
                  </div>
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
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 h-[calc(100vh-200px)]">
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
                        : submission.isPinned && submission.isHighlighted
                        ? 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-lg'
                        : submission.isPinned
                        ? 'border-yellow-300 bg-yellow-50 shadow-md'
                        : submission.isHighlighted
                        ? 'border-orange-300 bg-orange-50 shadow-md'
                        : (() => {
                            const timingStatus = getSubmissionTimingStatus(submission, assignmentDueDate);
                            if (timingStatus.status === 'late') {
                              return 'border-yellow-400 bg-yellow-50 hover:border-yellow-500 hover:shadow-md';
                            } else if (timingStatus.status === 'ontime') {
                              return 'border-green-300 bg-green-50 hover:border-green-400 hover:shadow-md';
                            }
                            return 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md';
                          })()
                    }`}
                  >
                    {/* Pin/Highlight Indicators */}
                    {(submission.isPinned || submission.isHighlighted) && (
                      <div className="flex items-center space-x-2 mb-4">
                        {submission.isPinned && (
                          <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                            <span>📌</span>
                            <span>Pinned</span>
                          </div>
                        )}
                        {submission.isHighlighted && (
                          <div className="flex items-center space-x-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                            <span>⭐</span>
                            <span>Highlighted</span>
                          </div>
                        )}
                      </div>
                    )}
                    
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
                          <p className="text-xs text-gray-500 mb-1">
                            {submission.courseName} ({submission.courseCode})
                          </p>
                          <div className="flex items-center space-x-4 mb-3">
                            <p className="text-xs text-gray-500">
                              Video Due: {new Date(assignmentDueDate).toLocaleDateString()}
                              {submission.assignment?.enablePeerResponses && submission.assignment?.responseDueDate && (
                                <> • Responses Due: {new Date(submission.assignment.responseDueDate).toLocaleDateString()}</>
                              )}
                            </p>
                            
                            {/* Timing Status with Icon */}
                            {(() => {
                              const timingStatus = getSubmissionTimingStatus(submission, assignmentDueDate);
                              return (
                                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  timingStatus.color === 'green' 
                                    ? 'bg-green-100 text-green-800' 
                                    : timingStatus.color === 'yellow'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  <span>{timingStatus.color === 'green' ? '✓' : timingStatus.color === 'yellow' ? '⚠️' : '?'}</span>
                                  <span>{timingStatus.text}</span>
                                </div>
                              );
                            })()}
                          </div>
                          {submission.assignment?.enablePeerResponses && (
                            <div className="text-xs text-blue-600 mb-3 bg-blue-50 px-2 py-1 rounded">
                              Peer Responses: {submission.assignment.minResponsesRequired || 2} required, max {submission.assignment.maxResponsesPerVideo || 3} per video
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => analyzeWithAI(submission)}
                                disabled={isAIAnalyzing[submission.id]}
                                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                title="AI Analysis"
                              >
                                {isAIAnalyzing[submission.id] ? (
                                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <span>🤖</span>
                                )}
                                <span>AI</span>
                              </button>
                              
                              {/* Pin Button */}
                              <button
                                onClick={() => togglePin(submission.id)}
                                className={`px-2 py-1 text-xs rounded-md transition-colors flex items-center space-x-1 ${
                                  submission.isPinned 
                                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                title={submission.isPinned ? 'Unpin submission' : 'Pin submission to top'}
                              >
                                <span>{submission.isPinned ? '📌' : '📍'}</span>
                                <span>{submission.isPinned ? 'Pinned' : 'Pin'}</span>
                              </button>
                              
                              {/* Highlight Button */}
                              <button
                                onClick={() => toggleHighlight(submission.id)}
                                className={`px-2 py-1 text-xs rounded-md transition-colors flex items-center space-x-1 ${
                                  submission.isHighlighted 
                                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                title={submission.isHighlighted ? 'Remove highlight' : 'Highlight submission'}
                              >
                                <span>{submission.isHighlighted ? '⭐' : '☆'}</span>
                                <span>{submission.isHighlighted ? 'Highlighted' : 'Highlight'}</span>
                              </button>
                              
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                                {getStatusText(submission.status)}
                              </span>
                              
                              {/* Timing Status Indicator */}
                              {(() => {
                                const timingStatus = getSubmissionTimingStatus(submission, assignmentDueDate);
                                return (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    timingStatus.color === 'green' 
                                      ? 'bg-green-100 text-green-800' 
                                      : timingStatus.color === 'yellow'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {timingStatus.text}
                                  </span>
                                );
                              })()}
                            </div>
                            {submission.grade && (
                              <span className="text-sm font-bold text-green-600">
                                Grade: {submission.grade}%
                              </span>
                            )}
                          </div>
                        </div>


                        {/* AI Grading Section - Compact */}
                        {index === currentSubmissionIndex && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center">
                                  <span className="text-white text-xs">🤖</span>
                                </div>
                                <span className="text-sm font-medium text-gray-700">AI Assistant</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => analyzeWithAI(submission)}
                                  disabled={isAIAnalyzing[submission.id]}
                                  className="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                >
                                  {isAIAnalyzing[submission.id] ? (
                                    <>
                                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                      <span>Analyzing...</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>🤖</span>
                                      <span>Analyze</span>
                                    </>
                                  )}
                                </button>
                                
                                {aiSuggestions[submission.id] && (
                                  <button
                                    onClick={() => applyAISuggestions(submission.id)}
                                    className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center space-x-1"
                                  >
                                    <span>✓</span>
                                    <span>Apply</span>
                                  </button>
                                )}
                                
                                {aiSuggestions[submission.id] && (
                                  <button
                                    onClick={() => setShowAIPanel(prev => ({ ...prev, [submission.id]: !prev[submission.id] }))}
                                    className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                                  >
                                    {showAIPanel[submission.id] ? '▼' : '▶'}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Compact AI Analysis Panel */}
                            {showAIPanel[submission.id] && aiSuggestions[submission.id] && (
                              <div className="space-y-3">
                                {/* Compact Rubric Scores */}
                                <div className="grid grid-cols-4 gap-2">
                                  <div className="text-center p-2 bg-white rounded border">
                                    <div className="text-lg font-bold text-blue-600">
                                      {aiSuggestions[submission.id].rubric.contentQuality.earned}/{aiSuggestions[submission.id].rubric.contentQuality.possible}
                                    </div>
                                    <div className="text-xs text-gray-500">Content</div>
                                  </div>
                                  <div className="text-center p-2 bg-white rounded border">
                                    <div className="text-lg font-bold text-green-600">
                                      {aiSuggestions[submission.id].rubric.presentation.earned}/{aiSuggestions[submission.id].rubric.presentation.possible}
                                    </div>
                                    <div className="text-xs text-gray-500">Presentation</div>
                                  </div>
                                  <div className="text-center p-2 bg-white rounded border">
                                    <div className="text-lg font-bold text-purple-600">
                                      {aiSuggestions[submission.id].rubric.technicalAspects.earned}/{aiSuggestions[submission.id].rubric.technicalAspects.possible}
                                    </div>
                                    <div className="text-xs text-gray-500">Technical</div>
                                  </div>
                                  <div className="text-center p-2 bg-white rounded border">
                                    <div className="text-lg font-bold text-orange-600">
                                      {aiSuggestions[submission.id].rubric.engagement.earned}/{aiSuggestions[submission.id].rubric.engagement.possible}
                                    </div>
                                    <div className="text-xs text-gray-500">Engagement</div>
                                  </div>
                                </div>

                                {/* Compact Grade Suggestion */}
                                <div className="p-2 bg-white rounded border-l-2 border-blue-500">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Suggested Grade:</span>
                                    <span className="text-lg font-bold text-blue-600">{aiSuggestions[submission.id].suggestedGrade}%</span>
                                  </div>
                                </div>

                                {/* Compact Strengths and Improvements */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <h4 className="text-xs font-medium text-green-700 mb-1">Strengths</h4>
                                    <ul className="space-y-1">
                                      {aiSuggestions[submission.id].strengths.slice(0, 3).map((strength, idx) => (
                                        <li key={idx} className="text-xs text-gray-600 flex items-start space-x-1">
                                          <span className="text-green-500 mt-0.5">✓</span>
                                          <span>{strength}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-medium text-orange-700 mb-1">Improvements</h4>
                                    <ul className="space-y-1">
                                      {aiSuggestions[submission.id].improvements.slice(0, 3).map((improvement, idx) => (
                                        <li key={idx} className="text-xs text-gray-600 flex items-start space-x-1">
                                          <span className="text-orange-500 mt-0.5">•</span>
                                          <span>{improvement}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>

                                {/* Compact Feedback Preview */}
                                <div className="p-2 bg-gray-100 rounded">
                                  <h4 className="text-xs font-medium text-gray-700 mb-1">AI Feedback:</h4>
                                  <p className="text-xs text-gray-600 italic line-clamp-2">"{aiSuggestions[submission.id].suggestedFeedback}"</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

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
                                  handleGradeChange(e.target.value ? Number(e.target.value) : '');
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
                                  handleFeedbackChange(e.target.value);
                                }
                              }}
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter detailed feedback for the student..."
                            />
                          </div>
                          
                          {/* Save Status Indicator */}
                          {index === currentSubmissionIndex && (
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-2">
                                {saveStatus === 'saving' && (
                                  <>
                                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-blue-600">Saving...</span>
                                  </>
                                )}
                                {saveStatus === 'saved' && (
                                  <>
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="text-green-600">Saved</span>
                                  </>
                                )}
                                {saveStatus === 'error' && (
                                  <>
                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                    <span className="text-red-600">Save failed</span>
                                  </>
                                )}
                              </div>
                              {lastSaved && (
                                <span className="text-gray-500 text-xs">
                                  Last saved: {lastSaved.toLocaleTimeString()}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Selection Button for Non-Active Submissions */}
                          {index !== currentSubmissionIndex && (
                            <button
                              onClick={() => goToSubmission(index)}
                              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
                            >
                              Select This Submission
                            </button>
                          )}
                        </div>

                        {/* Peer Response Analytics - Only show for current submission */}
                        {index === currentSubmissionIndex && submission.peerResponses && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-semibold text-blue-800 flex items-center">
                                <span className="mr-2">👥</span>
                                Peer Response Analytics
                              </h3>
                              <button
                                onClick={() => analyzePeerResponsesWithAI(submission)}
                                disabled={isAIAnalyzing[`peer-${submission.id}`]}
                                className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                title="AI Analysis for Peer Responses"
                              >
                                {isAIAnalyzing[`peer-${submission.id}`] ? (
                                  <>
                                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Analyzing...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>🤖</span>
                                    <span>AI Assist</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-blue-700 font-medium">Responses Given:</span>
                                <span className="ml-2 text-blue-900">
                                  {submission.peerResponses.submittedResponses}/{submission.peerResponses.totalResponses}
                                </span>
                              </div>
                              <div>
                                <span className="text-blue-700 font-medium">Avg. Length:</span>
                                <span className="ml-2 text-blue-900">
                                  {submission.peerResponses.averageResponseLength} words
                                </span>
                              </div>
                              <div>
                                <span className="text-blue-700 font-medium">Quality:</span>
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                  submission.peerResponses.responseQuality === 'excellent' 
                                    ? 'bg-green-100 text-green-800'
                                    : submission.peerResponses.responseQuality === 'good'
                                    ? 'bg-blue-100 text-blue-800'
                                    : submission.peerResponses.responseQuality === 'adequate'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {submission.peerResponses.responseQuality.replace('_', ' ')}
                                </span>
                              </div>
                              <div>
                                <span className="text-blue-700 font-medium">Last Response:</span>
                                <span className="ml-2 text-blue-900">
                                  {submission.peerResponses.lastResponseDate 
                                    ? new Date(submission.peerResponses.lastResponseDate).toLocaleDateString()
                                    : 'N/A'
                                  }
                                </span>
                              </div>
                            </div>
                            {submission.peerResponses.submittedResponses < 2 && (
                              <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800">
                                ⚠️ Student needs to complete more peer responses (minimum 2 required)
                              </div>
                            )}
                          </div>
                        )}

                        {/* Student's Peer Responses - Only show for current submission */}
                        {index === currentSubmissionIndex && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                              <span className="mr-2">💬</span>
                              Student's Peer Responses
                            </h3>
                            <div className="space-y-3">
                              {getPeerResponsesForStudent(submission.studentId).map((response, responseIndex) => (
                                <div key={response.id} className="bg-white rounded-lg p-3 border border-gray-200">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs font-medium text-gray-600">
                                        Response to: {response.reviewedStudentName}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(response.submittedAt).toLocaleDateString()}
                                      </span>
                                      {/* Video Link */}
                                      <a
                                        href={`/instructor/grading/bulk?assignment=${submission.assignmentId}&course=${submission.courseCode}&submission=${response.reviewedStudentId}`}
                                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                                        title="View the video this response is about"
                                      >
                                        📹 View Video
                                      </a>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      response.isSubmitted 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {response.isSubmitted ? 'Submitted' : 'Draft'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 leading-relaxed">
                                    {response.content}
                                  </p>
                                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                      <span>{response.wordCount} words</span>
                                      <span>{response.characterCount} characters</span>
                                      {response.qualityScore && (
                                        <span className="font-medium">
                                          Quality: {response.qualityScore}/5
                                        </span>
                                      )}
                                    </div>
                                    {response.aiGrade && (
                                      <div className="flex items-center space-x-1 text-xs">
                                        <span className="text-gray-500">AI Grade:</span>
                                        <span className="font-medium text-blue-600">
                                          {response.aiGrade.overallGrade}%
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                              
                              {getPeerResponsesForStudent(submission.studentId).length === 0 && (
                                <div className="text-center py-4 text-gray-500 text-sm">
                                  <span className="mr-2">📝</span>
                                  No peer responses submitted yet
                                </div>
                              )}
                            </div>
                          </div>
                        )}
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

