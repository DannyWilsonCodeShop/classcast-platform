/**
 * Mock Data for Peer Response System
 * Comprehensive mock data for testing the peer video review functionality
 */

export interface MockPeerVideo {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  videoUrl: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  submittedAt: string;
  duration: number;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseName: string;
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  views?: number;
  likes?: number;
  ratings?: {
    average: number;
    count: number;
    distribution: {
      '1': number;
      '2': number;
      '3': number;
      '4': number;
      '5': number;
    };
  };
  userInteraction?: {
    liked: boolean;
    rated: boolean;
    userRating?: number;
  };
}

export interface MockPeerResponse {
  id: string;
  reviewerId: string;
  reviewerName: string;
  videoId: string;
  content: string;
  submittedAt: string;
  lastSavedAt: string;
  isSubmitted: boolean;
  wordCount: number;
  characterCount: number;
  responseType: 'text' | 'video' | 'mixed';
  videoResponse?: {
    videoUrl: string;
    thumbnailUrl: string;
    duration: number;
    fileSize: number;
  };
  parentResponseId?: string; // For threaded discussions
  threadLevel: number; // 0 = top level, 1 = reply, 2 = reply to reply, etc.
  replies?: MockPeerResponse[];
  quality?: 'excellent' | 'good' | 'adequate' | 'needs_improvement';
  aiGrade?: {
    overallGrade: number;
    rubricScores: {
      contentQuality: { earned: number; possible: number; feedback: string };
      engagement: { earned: number; possible: number; feedback: string };
      criticalThinking: { earned: number; possible: number; feedback: string };
      communication: { earned: number; possible: number; feedback: string };
    };
    overallFeedback: string;
    strengths: string[];
    improvements: string[];
  };
}

export interface MockAssignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  courseId: string;
  courseName: string;
  assignmentType: 'video_presentation' | 'discussion_thread' | 'mixed_review';
  peerReviewRequired: boolean;
  minResponsesRequired: number;
  maxResponsesAllowed?: number;
  allowVideoResponses: boolean;
  allowThreadedDiscussions: boolean;
  maxThreadDepth?: number;
  rubric: {
    contentQuality: { possible: number; description: string };
    engagement: { possible: number; description: string };
    criticalThinking: { possible: number; description: string };
    communication: { possible: number; description: string };
  };
  instructions?: string;
  gradingCriteria?: string[];
  discussionPrompt?: string;
  responseGuidelines?: string[];
}

// Mock Assignments
export const mockAssignments: MockAssignment[] = [
  {
    id: 'assignment_1',
    title: 'Video Presentation Assignment',
    description: 'Create a 5-minute presentation on your chosen topic and review your peers\' videos.',
    dueDate: '2024-02-15T23:59:59Z',
    courseId: 'cs-101',
    courseName: 'Introduction to Computer Science',
    assignmentType: 'video_presentation',
    peerReviewRequired: true,
    minResponsesRequired: 2,
    maxResponsesAllowed: 5,
    allowVideoResponses: true,
    allowThreadedDiscussions: true,
    maxThreadDepth: 3,
    rubric: {
      contentQuality: { possible: 25, description: 'Depth and accuracy of content' },
      engagement: { possible: 25, description: 'How well the presentation engages the audience' },
      criticalThinking: { possible: 25, description: 'Analysis and critical evaluation' },
      communication: { possible: 25, description: 'Clarity and effectiveness of communication' }
    },
    instructions: 'Please watch at least 2 peer videos and provide thoughtful, constructive feedback. You can respond with text, video, or both. Engage in discussions with your peers by replying to their responses.',
    gradingCriteria: [
      'Content demonstrates understanding of the topic',
      'Presentation is engaging and well-structured',
      'Critical analysis and evaluation are present',
      'Communication is clear and effective'
    ],
    responseGuidelines: [
      'Be constructive and respectful in your feedback',
      'Provide specific examples and suggestions',
      'Engage in meaningful discussions with peers',
      'Use video responses when you want to demonstrate concepts'
    ]
  },
  {
    id: 'assignment_2',
    title: 'Coding Challenge Walkthrough',
    description: 'Record yourself solving a coding problem and explain your thought process.',
    dueDate: '2024-02-20T23:59:59Z',
    courseId: 'cs-201',
    courseName: 'Data Structures and Algorithms',
    assignmentType: 'video_presentation',
    peerReviewRequired: true,
    minResponsesRequired: 3,
    maxResponsesAllowed: 6,
    allowVideoResponses: true,
    allowThreadedDiscussions: false,
    rubric: {
      contentQuality: { possible: 30, description: 'Correctness and efficiency of solution' },
      engagement: { possible: 20, description: 'How well you explain your thought process' },
      criticalThinking: { possible: 30, description: 'Analysis of different approaches' },
      communication: { possible: 20, description: 'Clarity of explanation and code comments' }
    }
  },
  {
    id: 'assignment_3',
    title: 'Ethics in AI Discussion',
    description: 'Engage in a threaded discussion about the ethical implications of artificial intelligence in modern society.',
    dueDate: '2024-02-25T23:59:59Z',
    courseId: 'cs-101',
    courseName: 'Introduction to Computer Science',
    assignmentType: 'discussion_thread',
    peerReviewRequired: true,
    minResponsesRequired: 5,
    maxResponsesAllowed: 10,
    allowVideoResponses: true,
    allowThreadedDiscussions: true,
    maxThreadDepth: 4,
    rubric: {
      contentQuality: { possible: 30, description: 'Depth of ethical analysis and understanding' },
      engagement: { possible: 25, description: 'Active participation in discussions' },
      criticalThinking: { possible: 30, description: 'Critical evaluation of different perspectives' },
      communication: { possible: 15, description: 'Clear and respectful communication' }
    },
    discussionPrompt: 'Consider the following scenario: A healthcare AI system is designed to prioritize patients for treatment based on their likelihood of survival. However, the algorithm shows bias against certain demographic groups. How should this be addressed? What are the ethical implications?',
    responseGuidelines: [
      'Respond to the initial prompt with your perspective',
      'Engage with at least 3 different classmates\' responses',
      'Build on others\' ideas and ask thoughtful questions',
      'Use video responses to explain complex concepts',
      'Maintain respectful dialogue throughout'
    ]
  }
];

// Mock Peer Videos
export const mockPeerVideos: MockPeerVideo[] = [
  {
    id: 'video_1',
    studentId: 'student_1',
    studentName: 'Alex Johnson',
    studentEmail: 'alex.johnson@university.edu',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
    title: 'Machine Learning Fundamentals',
    description: 'A comprehensive overview of basic machine learning concepts, including supervised and unsupervised learning, neural networks, and practical applications in real-world scenarios.',
    submittedAt: '2024-01-20T14:30:00Z',
    duration: 320,
    assignmentId: 'assignment_1',
    assignmentTitle: 'Video Presentation Assignment',
    courseId: 'cs-101',
    courseName: 'Introduction to Computer Science',
    tags: ['machine-learning', 'ai', 'algorithms', 'data-science'],
    difficulty: 'intermediate',
    views: 45,
    likes: 12,
    ratings: {
      average: 4.8,
      count: 15,
      distribution: {
        '1': 0,
        '2': 0,
        '3': 1,
        '4': 4,
        '5': 10
      }
    },
    userInteraction: {
      liked: true,
      rated: true,
      userRating: 5
    }
  },
  {
    id: 'video_2',
    studentId: 'student_2',
    studentName: 'Sarah Chen',
    studentEmail: 'sarah.chen@university.edu',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/SubaruOutbackOnStreetAndDirt.jpg',
    title: 'Data Structures and Algorithms',
    description: 'Exploring common data structures and their implementations, with detailed explanations of time complexity and space complexity for each algorithm.',
    submittedAt: '2024-01-21T09:15:00Z',
    duration: 280,
    assignmentId: 'assignment_1',
    assignmentTitle: 'Video Presentation Assignment',
    courseId: 'cs-101',
    courseName: 'Introduction to Computer Science',
    tags: ['data-structures', 'algorithms', 'programming', 'computer-science'],
    difficulty: 'intermediate',
    views: 38,
    likes: 15,
    ratings: {
      average: 4.6,
      count: 12,
      distribution: {
        '1': 0,
        '2': 0,
        '3': 2,
        '4': 4,
        '5': 6
      }
    },
    userInteraction: {
      liked: false,
      rated: true,
      userRating: 4
    }
  },
  {
    id: 'video_3',
    studentId: 'student_3',
    studentName: 'Michael Rodriguez',
    studentEmail: 'michael.rodriguez@university.edu',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Toshiba_Canvio_Advance.mp4',
    thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Toshiba_Canvio_Advance.jpg',
    title: 'Web Development Best Practices',
    description: 'Tips and techniques for building modern web applications, covering responsive design, performance optimization, and security considerations.',
    submittedAt: '2024-01-22T16:45:00Z',
    duration: 350,
    assignmentId: 'assignment_1',
    assignmentTitle: 'Video Presentation Assignment',
    courseId: 'cs-101',
    courseName: 'Introduction to Computer Science',
    tags: ['web-development', 'frontend', 'best-practices', 'security'],
    difficulty: 'beginner',
    views: 52,
    likes: 18
  },
  {
    id: 'video_4',
    studentId: 'student_4',
    studentName: 'Emily Watson',
    studentEmail: 'emily.watson@university.edu',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
    thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/VolkswagenGTIReview.jpg',
    title: 'Database Design Principles',
    description: 'Understanding relational database design, normalization, indexing strategies, and query optimization techniques for efficient data management.',
    submittedAt: '2024-01-23T11:20:00Z',
    duration: 420,
    assignmentId: 'assignment_1',
    assignmentTitle: 'Video Presentation Assignment',
    courseId: 'cs-101',
    courseName: 'Introduction to Computer Science',
    tags: ['database', 'sql', 'design', 'optimization'],
    difficulty: 'intermediate',
    views: 41,
    likes: 14
  },
  {
    id: 'video_5',
    studentId: 'student_5',
    studentName: 'David Kim',
    studentEmail: 'david.kim@university.edu',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
    thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/WhatCarCanYouGetForAGrand.jpg',
    title: 'Software Testing Strategies',
    description: 'Comprehensive guide to software testing methodologies, including unit testing, integration testing, and automated testing frameworks.',
    submittedAt: '2024-01-24T08:45:00Z',
    duration: 380,
    assignmentId: 'assignment_1',
    assignmentTitle: 'Video Presentation Assignment',
    courseId: 'cs-101',
    courseName: 'Introduction to Computer Science',
    tags: ['testing', 'quality-assurance', 'automation', 'software-engineering'],
    difficulty: 'intermediate',
    views: 33,
    likes: 9
  },
  {
    id: 'video_6',
    studentId: 'student_6',
    studentName: 'Lisa Thompson',
    studentEmail: 'lisa.thompson@university.edu',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/WeAreGoingOnBullrun.jpg',
    title: 'Cloud Computing Architecture',
    description: 'Introduction to cloud computing concepts, including microservices, containerization, and deployment strategies using modern cloud platforms.',
    submittedAt: '2024-01-25T13:30:00Z',
    duration: 450,
    assignmentId: 'assignment_1',
    assignmentTitle: 'Video Presentation Assignment',
    courseId: 'cs-101',
    courseName: 'Introduction to Computer Science',
    tags: ['cloud-computing', 'microservices', 'containers', 'deployment'],
    difficulty: 'advanced',
    views: 29,
    likes: 11
  },
  {
    id: 'video_7',
    studentId: 'student_7',
    studentName: 'James Wilson',
    studentEmail: 'james.wilson@university.edu',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
    title: 'Cybersecurity Fundamentals',
    description: 'Essential cybersecurity concepts including threat modeling, encryption, secure coding practices, and incident response procedures.',
    submittedAt: '2024-01-26T15:10:00Z',
    duration: 390,
    assignmentId: 'assignment_1',
    assignmentTitle: 'Video Presentation Assignment',
    courseId: 'cs-101',
    courseName: 'Introduction to Computer Science',
    tags: ['cybersecurity', 'security', 'encryption', 'threat-modeling'],
    difficulty: 'intermediate',
    views: 47,
    likes: 16
  },
  {
    id: 'video_8',
    studentId: 'student_8',
    studentName: 'Maria Garcia',
    studentEmail: 'maria.garcia@university.edu',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg',
    title: 'Mobile App Development',
    description: 'Cross-platform mobile development using React Native, including state management, navigation, and performance optimization techniques.',
    submittedAt: '2024-01-27T10:25:00Z',
    duration: 360,
    assignmentId: 'assignment_1',
    assignmentTitle: 'Video Presentation Assignment',
    courseId: 'cs-101',
    courseName: 'Introduction to Computer Science',
    tags: ['mobile-development', 'react-native', 'cross-platform', 'mobile-apps'],
    difficulty: 'intermediate',
    views: 42,
    likes: 13
  }
];

// Mock Peer Responses with Video Responses and Threaded Discussions
export const mockPeerResponses: MockPeerResponse[] = [
  {
    id: 'response_video_1_001',
    reviewerId: 'current_student_id',
    reviewerName: 'Current Student',
    videoId: 'video_1',
    content: 'Alex, your explanation of machine learning fundamentals was really clear and well-structured. I particularly liked how you broke down the different types of learning algorithms. The examples you used made it easy to understand the concepts. One suggestion would be to include more visual diagrams to illustrate the neural network architecture. Overall, great presentation!',
    submittedAt: '2024-01-23T10:15:00Z',
    lastSavedAt: '2024-01-23T10:15:00Z',
    isSubmitted: true,
    wordCount: 67,
    characterCount: 456,
    responseType: 'text',
    threadLevel: 0,
    quality: 'excellent',
    aiGrade: {
      overallGrade: 92,
      rubricScores: {
        contentQuality: { earned: 23, possible: 25, feedback: 'Excellent content with clear explanations and good examples' },
        engagement: { earned: 24, possible: 25, feedback: 'Highly engaging presentation that maintains interest' },
        criticalThinking: { earned: 22, possible: 25, feedback: 'Good analysis with some room for deeper evaluation' },
        communication: { earned: 23, possible: 25, feedback: 'Clear and effective communication throughout' }
      },
      overallFeedback: 'Outstanding response! This demonstrates excellent understanding and engagement. The 67 words show thorough analysis and thoughtful feedback.',
      strengths: ['Comprehensive response length', 'Includes specific examples', 'Shows personal engagement', 'Positive and constructive tone'],
      improvements: ['Consider alternative viewpoints', 'Add more critical analysis']
    },
    replies: [
      {
        id: 'response_video_1_001_reply_1',
        reviewerId: 'student_1',
        reviewerName: 'Alex Johnson',
        videoId: 'video_1',
        content: 'Thanks for the feedback! I actually have some diagrams I created but didn\'t include in the video. Let me share them here.',
        submittedAt: '2024-01-23T11:30:00Z',
        lastSavedAt: '2024-01-23T11:30:00Z',
        isSubmitted: true,
        wordCount: 20,
        characterCount: 134,
        responseType: 'text',
        parentResponseId: 'response_video_1_001',
        threadLevel: 1
      },
      {
        id: 'response_video_1_001_reply_2',
        reviewerId: 'student_3',
        reviewerName: 'Michael Rodriguez',
        videoId: 'video_1',
        content: 'I agree with the visual suggestion! I found this video really helpful for understanding neural networks: [link]. It might complement your presentation well.',
        submittedAt: '2024-01-23T12:45:00Z',
        lastSavedAt: '2024-01-23T12:45:00Z',
        isSubmitted: true,
        wordCount: 25,
        characterCount: 185,
        responseType: 'text',
        parentResponseId: 'response_video_1_001',
        threadLevel: 1
      }
    ]
  },
  {
    id: 'response_video_2_001',
    reviewerId: 'current_student_id',
    reviewerName: 'Current Student',
    videoId: 'video_2',
    content: 'Sarah, excellent work on the data structures presentation! Your code examples were very helpful and the time complexity analysis was thorough. I learned a lot about how different algorithms perform in various scenarios. The way you explained the trade-offs between different data structures was particularly insightful. Keep up the great work!',
    submittedAt: '2024-01-23T14:30:00Z',
    lastSavedAt: '2024-01-23T14:30:00Z',
    isSubmitted: true,
    wordCount: 58,
    characterCount: 398,
    responseType: 'video',
    videoResponse: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
      duration: 120,
      fileSize: 15000000
    },
    threadLevel: 0,
    quality: 'excellent',
    aiGrade: {
      overallGrade: 88,
      rubricScores: {
        contentQuality: { earned: 22, possible: 25, feedback: 'Very good content with helpful examples' },
        engagement: { earned: 23, possible: 25, feedback: 'Engaging response that shows personal investment' },
        criticalThinking: { earned: 21, possible: 25, feedback: 'Good analysis of trade-offs and performance' },
        communication: { earned: 22, possible: 25, feedback: 'Clear and well-structured communication' }
      },
      overallFeedback: 'Very good response! This shows strong understanding with good analysis. Consider adding more specific examples to reach the next level.',
      strengths: ['Includes specific examples', 'Shows personal engagement', 'Positive and constructive tone', 'Shows critical thinking'],
      improvements: ['Expand response with more detailed analysis', 'Add more specific examples to support points']
    }
  },
  {
    id: 'response_video_3_001',
    reviewerId: 'current_student_id',
    reviewerName: 'Current Student',
    videoId: 'video_3',
    content: 'Michael, your web development presentation covered a lot of important topics. I found the section on performance optimization particularly useful. However, I think you could have spent more time on security considerations as that\'s such an important aspect of modern web development. The examples you provided were good, but maybe include some code snippets to make it more practical.',
    submittedAt: '2024-01-24T09:20:00Z',
    lastSavedAt: '2024-01-24T09:20:00Z',
    isSubmitted: false,
    wordCount: 71,
    characterCount: 487,
    responseType: 'mixed',
    videoResponse: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg',
      duration: 90,
      fileSize: 12000000
    },
    threadLevel: 0,
    quality: 'good',
    aiGrade: {
      overallGrade: 78,
      rubricScores: {
        contentQuality: { earned: 19, possible: 25, feedback: 'Good content but could be more specific' },
        engagement: { earned: 20, possible: 25, feedback: 'Some personal connection but could be stronger' },
        criticalThinking: { earned: 20, possible: 25, feedback: 'Good critical analysis with constructive suggestions' },
        communication: { earned: 19, possible: 25, feedback: 'Clear communication with room for improvement' }
      },
      overallFeedback: 'Good response! This demonstrates solid understanding. To improve, try to be more specific and provide more detailed analysis.',
      strengths: ['Comprehensive response length', 'Includes specific examples', 'Shows critical thinking', 'Constructive suggestions'],
      improvements: ['Include more personal perspective', 'Add more specific examples', 'Improve sentence structure']
    }
  },
  // Discussion thread responses for assignment_3
  {
    id: 'discussion_ethics_001',
    reviewerId: 'current_student_id',
    reviewerName: 'Current Student',
    videoId: 'discussion_ethics',
    content: 'I think the bias in healthcare AI is a critical issue that needs immediate attention. The algorithm should be retrained with more diverse data and regularly audited for fairness. We also need diverse teams developing these systems to catch potential biases early.',
    submittedAt: '2024-01-26T10:00:00Z',
    lastSavedAt: '2024-01-26T10:00:00Z',
    isSubmitted: true,
    wordCount: 45,
    characterCount: 312,
    responseType: 'text',
    threadLevel: 0,
    quality: 'good',
    replies: [
      {
        id: 'discussion_ethics_001_reply_1',
        reviewerId: 'student_4',
        reviewerName: 'Emily Watson',
        videoId: 'discussion_ethics',
        content: 'I agree about diverse teams, but how do we ensure the auditing process itself isn\'t biased? Who gets to decide what "fair" means in this context?',
        submittedAt: '2024-01-26T11:15:00Z',
        lastSavedAt: '2024-01-26T11:15:00Z',
        isSubmitted: true,
        wordCount: 28,
        characterCount: 198,
        responseType: 'text',
        parentResponseId: 'discussion_ethics_001',
        threadLevel: 1,
        replies: [
          {
            id: 'discussion_ethics_001_reply_1_reply_1',
            reviewerId: 'current_student_id',
            reviewerName: 'Current Student',
            videoId: 'discussion_ethics',
            content: 'That\'s a great point! I think we need multiple stakeholders involved - patients, healthcare providers, ethicists, and community representatives. The definition of fairness should be co-created, not imposed.',
            submittedAt: '2024-01-26T14:30:00Z',
            lastSavedAt: '2024-01-26T14:30:00Z',
            isSubmitted: true,
            wordCount: 32,
            characterCount: 234,
            responseType: 'text',
            parentResponseId: 'discussion_ethics_001_reply_1',
            threadLevel: 2
          }
        ]
      }
    ]
  }
];

// Mock Student Analytics
export const mockStudentAnalytics = {
  totalResponses: 3,
  submittedResponses: 2,
  draftResponses: 1,
  averageResponseLength: 65,
  averageQualityScore: 4.2,
  responseQuality: 'good' as const,
  lastResponseDate: '2024-01-24T09:20:00Z',
  completionRate: 66.7, // 2 out of 3 required responses
  peerFeedbackReceived: 5,
  averagePeerRating: 4.5
};

// Student Profile Peer Interaction Data
export interface StudentPeerProfile {
  studentId: string;
  studentName: string;
  studentEmail: string;
  totalVideosSubmitted: number;
  totalLikesReceived: number;
  totalRatingsReceived: number;
  averageRating: number;
  ratingDistribution: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
  totalResponsesGiven: number;
  totalLikesGiven: number;
  totalRatingsGiven: number;
  peerEngagementScore: number;
  topRatedVideos: Array<{
    videoId: string;
    title: string;
    rating: number;
    likes: number;
    assignmentTitle: string;
  }>;
  recentActivity: Array<{
    type: 'video_submitted' | 'response_given' | 'video_liked' | 'video_rated';
    description: string;
    timestamp: string;
    assignmentTitle?: string;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    earnedAt: string;
  }>;
}

// Mock Student Peer Profiles
export const mockStudentProfiles: StudentPeerProfile[] = [
  {
    studentId: 'current_student_id',
    studentName: 'Current Student',
    studentEmail: 'current.student@university.edu',
    totalVideosSubmitted: 8,
    totalLikesReceived: 47,
    totalRatingsReceived: 23,
    averageRating: 4.3,
    ratingDistribution: {
      '1': 0,
      '2': 1,
      '3': 3,
      '4': 8,
      '5': 11
    },
    totalResponsesGiven: 15,
    totalLikesGiven: 32,
    totalRatingsGiven: 18,
    peerEngagementScore: 87,
    topRatedVideos: [
      {
        videoId: 'video_1',
        title: 'Machine Learning Fundamentals',
        rating: 4.8,
        likes: 12,
        assignmentTitle: 'Video Presentation Assignment'
      },
      {
        videoId: 'video_2',
        title: 'Data Structures and Algorithms',
        rating: 4.6,
        likes: 9,
        assignmentTitle: 'Video Presentation Assignment'
      }
    ],
    recentActivity: [
      {
        type: 'video_submitted',
        description: 'Submitted video: "Web Development Best Practices"',
        timestamp: '2024-01-25T14:30:00Z',
        assignmentTitle: 'Video Presentation Assignment'
      },
      {
        type: 'response_given',
        description: 'Responded to Alex Johnson\'s video',
        timestamp: '2024-01-24T10:15:00Z',
        assignmentTitle: 'Video Presentation Assignment'
      },
      {
        type: 'video_liked',
        description: 'Liked Sarah Chen\'s video',
        timestamp: '2024-01-23T16:45:00Z'
      },
      {
        type: 'video_rated',
        description: 'Rated Michael Rodriguez\'s video 5 stars',
        timestamp: '2024-01-23T14:20:00Z'
      }
    ],
    achievements: [
      {
        id: 'achievement_1',
        title: 'Peer Helper',
        description: 'Given 10+ helpful responses to peers',
        icon: '🤝',
        earnedAt: '2024-01-20T00:00:00Z'
      },
      {
        id: 'achievement_2',
        title: 'Highly Rated',
        description: 'Achieved 4.0+ average rating',
        icon: '⭐',
        earnedAt: '2024-01-15T00:00:00Z'
      },
      {
        id: 'achievement_3',
        title: 'Engaged Learner',
        description: 'Liked 25+ peer videos',
        icon: '👍',
        earnedAt: '2024-01-10T00:00:00Z'
      }
    ]
  },
  {
    studentId: 'student_1',
    studentName: 'Alex Johnson',
    studentEmail: 'alex.johnson@university.edu',
    totalVideosSubmitted: 6,
    totalLikesReceived: 38,
    totalRatingsReceived: 19,
    averageRating: 4.5,
    ratingDistribution: {
      '1': 0,
      '2': 0,
      '3': 2,
      '4': 7,
      '5': 10
    },
    totalResponsesGiven: 12,
    totalLikesGiven: 28,
    totalRatingsGiven: 15,
    peerEngagementScore: 92,
    topRatedVideos: [
      {
        videoId: 'video_1',
        title: 'Machine Learning Fundamentals',
        rating: 4.8,
        likes: 12,
        assignmentTitle: 'Video Presentation Assignment'
      }
    ],
    recentActivity: [
      {
        type: 'video_submitted',
        description: 'Submitted video: "Machine Learning Fundamentals"',
        timestamp: '2024-01-20T14:30:00Z',
        assignmentTitle: 'Video Presentation Assignment'
      }
    ],
    achievements: [
      {
        id: 'achievement_1',
        title: 'Peer Helper',
        description: 'Given 10+ helpful responses to peers',
        icon: '🤝',
        earnedAt: '2024-01-18T00:00:00Z'
      }
    ]
  }
];

// Mock Instructor Analytics for Peer Responses
export const mockInstructorAnalytics = {
  totalAssignments: 2,
  assignmentsWithPeerReview: 2,
  totalPeerVideos: 8,
  totalPeerResponses: 24,
  averageResponsesPerVideo: 3.0,
  averageResponseQuality: 4.1,
  studentsWithIncompleteReviews: 3,
  topReviewers: [
    { studentName: 'Current Student', responseCount: 3, averageQuality: 4.2 },
    { studentName: 'Alex Johnson', responseCount: 4, averageQuality: 4.5 },
    { studentName: 'Sarah Chen', responseCount: 3, averageQuality: 4.0 }
  ],
  qualityDistribution: {
    excellent: 8,
    good: 12,
    adequate: 3,
    needs_improvement: 1
  }
};

// Helper functions
export const getPeerVideosByAssignment = (assignmentId: string): MockPeerVideo[] => {
  return mockPeerVideos.filter(video => video.assignmentId === assignmentId);
};

export const getPeerResponsesByVideo = (videoId: string): MockPeerResponse[] => {
  return mockPeerResponses.filter(response => response.videoId === videoId);
};

export const getPeerResponsesByReviewer = (reviewerId: string): MockPeerResponse[] => {
  return mockPeerResponses.filter(response => response.reviewerId === reviewerId);
};

export const getAssignmentById = (assignmentId: string): MockAssignment | undefined => {
  return mockAssignments.find(assignment => assignment.id === assignmentId);
};

export const calculateResponseStats = (responses: MockPeerResponse[], minRequired: number) => {
  const total = responses.length;
  const submitted = responses.filter(r => r.isSubmitted).length;
  const remaining = Math.max(0, minRequired - submitted);
  const completionRate = minRequired > 0 ? (submitted / minRequired) * 100 : 0;
  
  return {
    totalResponses: total,
    submittedResponses: submitted,
    draftResponses: total - submitted,
    remainingRequired: remaining,
    completionRate
  };
};
