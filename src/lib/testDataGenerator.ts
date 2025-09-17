// Test Data Generator for ClassCast Platform
// This generates realistic test data for all features

export interface TestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor' | 'admin';
  grade?: string;
  major?: string;
  profilePicture?: string;
  bio: string;
  personalInfo: {
    birthday: string;
    hometown: string;
    hobbies: string[];
    favoriteSubject: string;
    careerGoal: string;
    funFacts: string[];
  };
  socialLinks: {
    instagram: string;
    twitter: string;
    linkedin: string;
  };
  videoStats: {
    totalViews: number;
    totalLikes: number;
    totalVideos: number;
    publicVideos: number;
  };
  joinDate: string;
  isOnline: boolean;
}

export interface TestCourse {
  id: string;
  title: string;
  description: string;
  instructor: TestUser;
  students: TestUser[];
  subject: string;
  gradeLevel: string;
  semester: string;
  startDate: string;
  endDate: string;
  color: string;
  icon: string;
  totalAssignments: number;
  completedAssignments: number;
}

export interface TestAssignment {
  id: string;
  title: string;
  description: string;
  course: TestCourse;
  instructor: TestUser;
  dueDate: string;
  points: number;
  type: 'video' | 'essay' | 'quiz' | 'project';
  requirements: string[];
  rubric: string[];
  status: 'draft' | 'published' | 'closed';
  submissions: TestVideoSubmission[];
  createdAt: string;
  updatedAt: string;
}

export interface TestVideoSubmission {
  id: string;
  student: TestUser;
  assignment: TestAssignment;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: string;
  fileSize: number;
  submittedAt: string;
  likes: number;
  comments: number;
  views: number;
  rating: number;
  isLiked: boolean;
  isPublic: boolean;
  status: 'submitted' | 'graded' | 'returned';
  grade?: number;
  feedback?: string;
  tags: string[];
}

export interface TestComment {
  id: string;
  videoId: string;
  author: TestUser;
  content: string;
  parentCommentId?: string;
  likes: number;
  isLiked: boolean;
  createdAt: string;
  replies: TestComment[];
}

export interface TestResponse {
  id: string;
  videoId: string;
  assignmentId: string;
  student: TestUser;
  content: string;
  wordCount: number;
  status: 'submitted' | 'graded' | 'returned';
  grade?: number;
  instructorFeedback?: string;
  createdAt: string;
  gradedAt?: string;
}

export class TestDataGenerator {
  private static instance: TestDataGenerator;
  private users: TestUser[] = [];
  private courses: TestCourse[] = [];
  private assignments: TestAssignment[] = [];
  private videos: TestVideoSubmission[] = [];
  private comments: TestComment[] = [];
  private responses: TestResponse[] = [];
  private isInitialized: boolean = false;

  static getInstance(): TestDataGenerator {
    if (!TestDataGenerator.instance) {
      TestDataGenerator.instance = new TestDataGenerator();
    }
    return TestDataGenerator.instance;
  }

  generateAllData() {
    this.generateUsers();
    this.generateCourses();
    this.generateAssignments();
    this.generateVideos();
    this.generateComments();
    this.generateResponses();
    this.isInitialized = true;
  }

  private generateUsers() {
    const userData = [
      // Instructors
      {
        id: 'instructor-1',
        email: 'dr.smith@classcast.edu',
        firstName: 'Dr. Sarah',
        lastName: 'Smith',
        role: 'instructor' as const,
        major: 'Mathematics',
        bio: 'Passionate mathematics educator with 15 years of experience. I love helping students discover the beauty of numbers and problem-solving.',
        personalInfo: {
          birthday: '1980-03-15',
          hometown: 'Boston, MA',
          hobbies: ['Chess', 'Photography', 'Hiking'],
          favoriteSubject: 'Calculus',
          careerGoal: 'Inspire the next generation of mathematicians',
          funFacts: ['Published 3 research papers', 'Speaks 4 languages', 'Marathon runner']
        },
        socialLinks: {
          instagram: '@drsarahsmith',
          twitter: '@DrSarahMath',
          linkedin: 'linkedin.com/in/drsarahsmith'
        },
        videoStats: { totalViews: 0, totalLikes: 0, totalVideos: 0, publicVideos: 0 },
        joinDate: '2023-08-15',
        isOnline: true
      },
      {
        id: 'instructor-2',
        email: 'prof.johnson@classcast.edu',
        firstName: 'Prof. Michael',
        lastName: 'Johnson',
        role: 'instructor' as const,
        major: 'Physics',
        bio: 'Physics professor specializing in quantum mechanics and astrophysics. Making complex concepts accessible to all students.',
        personalInfo: {
          birthday: '1975-11-22',
          hometown: 'San Francisco, CA',
          hobbies: ['Astronomy', 'Guitar', 'Rock Climbing'],
          favoriteSubject: 'Quantum Physics',
          careerGoal: 'Make physics accessible to everyone',
          funFacts: ['Built a telescope', 'Former NASA intern', 'Plays in a band']
        },
        socialLinks: {
          instagram: '@profmike',
          twitter: '@ProfJohnson',
          linkedin: 'linkedin.com/in/profmjohnson'
        },
        videoStats: { totalViews: 0, totalLikes: 0, totalVideos: 0, publicVideos: 0 },
        joinDate: '2023-08-20',
        isOnline: false
      },
      // Students
      {
        id: 'student-1',
        email: 'alex.chen@student.classcast.edu',
        firstName: 'Alex',
        lastName: 'Chen',
        role: 'student' as const,
        grade: '11th Grade',
        major: 'Computer Science',
        profilePicture: 'AC',
        bio: 'Passionate about coding and mathematics. Love creating apps and solving complex problems.',
        personalInfo: {
          birthday: '2006-05-10',
          hometown: 'Seattle, WA',
          hobbies: ['Programming', 'Gaming', 'Basketball'],
          favoriteSubject: 'Computer Science',
          careerGoal: 'Software Engineer at a tech company',
          funFacts: ['Built 5 mobile apps', 'Captain of debate team', 'Speaks Mandarin fluently']
        },
        socialLinks: {
          instagram: '@alexchen_cs',
          twitter: '@AlexCodes',
          linkedin: 'linkedin.com/in/alexchen'
        },
        videoStats: { totalViews: 1247, totalLikes: 89, totalVideos: 12, publicVideos: 8 },
        joinDate: '2023-09-01',
        isOnline: true
      },
      {
        id: 'student-2',
        email: 'maya.patel@student.classcast.edu',
        firstName: 'Maya',
        lastName: 'Patel',
        role: 'student' as const,
        grade: '11th Grade',
        major: 'Biology',
        profilePicture: 'MP',
        bio: 'Future doctor passionate about helping others. Love learning about the human body and medical research.',
        personalInfo: {
          birthday: '2006-08-14',
          hometown: 'Austin, TX',
          hobbies: ['Volunteering', 'Dancing', 'Reading'],
          favoriteSubject: 'Biology',
          careerGoal: 'Cardiologist',
          funFacts: ['Volunteers at hospital', 'Class president', 'Speaks Hindi and Spanish']
        },
        socialLinks: {
          instagram: '@maya_future_doc',
          twitter: '@MayaPatel',
          linkedin: 'linkedin.com/in/mayapatel'
        },
        videoStats: { totalViews: 892, totalLikes: 67, totalVideos: 9, publicVideos: 6 },
        joinDate: '2023-09-01',
        isOnline: true
      },
      {
        id: 'student-3',
        email: 'marcus.rodriguez@student.classcast.edu',
        firstName: 'Marcus',
        lastName: 'Rodriguez',
        role: 'student' as const,
        grade: '11th Grade',
        major: 'Engineering',
        profilePicture: 'MR',
        bio: 'Engineering enthusiast who loves building and creating. Always curious about how things work.',
        personalInfo: {
          birthday: '2006-02-28',
          hometown: 'Miami, FL',
          hobbies: ['Robotics', 'Soccer', '3D Printing'],
          favoriteSubject: 'Physics',
          careerGoal: 'Mechanical Engineer',
          funFacts: ['Built a robot', 'Soccer team captain', 'Speaks Spanish and English']
        },
        socialLinks: {
          instagram: '@marcus_engineer',
          twitter: '@MarcusRod',
          linkedin: 'linkedin.com/in/marcusrodriguez'
        },
        videoStats: { totalViews: 1156, totalLikes: 78, totalVideos: 11, publicVideos: 7 },
        joinDate: '2023-09-01',
        isOnline: false
      },
      {
        id: 'student-4',
        email: 'emma.thompson@student.classcast.edu',
        firstName: 'Emma',
        lastName: 'Thompson',
        role: 'student' as const,
        grade: '11th Grade',
        major: 'Chemistry',
        profilePicture: 'ET',
        bio: 'Chemistry lover fascinated by molecular structures and chemical reactions. Future research scientist.',
        personalInfo: {
          birthday: '2006-12-03',
          hometown: 'Denver, CO',
          hobbies: ['Lab work', 'Painting', 'Hiking'],
          favoriteSubject: 'Chemistry',
          careerGoal: 'Research Scientist',
          funFacts: ['Won science fair', 'Art club president', 'Loves mountain climbing']
        },
        socialLinks: {
          instagram: '@emma_chem',
          twitter: '@EmmaThompson',
          linkedin: 'linkedin.com/in/emmathompson'
        },
        videoStats: { totalViews: 743, totalLikes: 54, totalVideos: 8, publicVideos: 5 },
        joinDate: '2023-09-01',
        isOnline: true
      },
      {
        id: 'student-5',
        email: 'david.lee@student.classcast.edu',
        firstName: 'David',
        lastName: 'Lee',
        role: 'student' as const,
        grade: '11th Grade',
        major: 'Mathematics',
        profilePicture: 'DL',
        bio: 'Math enthusiast who enjoys solving complex equations and helping classmates understand difficult concepts.',
        personalInfo: {
          birthday: '2006-07-19',
          hometown: 'Portland, OR',
          hobbies: ['Chess', 'Piano', 'Tennis'],
          favoriteSubject: 'Mathematics',
          careerGoal: 'Actuary',
          funFacts: ['Chess champion', 'Piano player', 'Math tutor']
        },
        socialLinks: {
          instagram: '@david_math',
          twitter: '@DavidLee',
          linkedin: 'linkedin.com/in/davidlee'
        },
        videoStats: { totalViews: 1089, totalLikes: 72, totalVideos: 10, publicVideos: 6 },
        joinDate: '2023-09-01',
        isOnline: true
      }
    ];

    this.users = userData;
  }

  private generateCourses() {
    const instructor1 = this.users.find(u => u.id === 'instructor-1')!;
    const instructor2 = this.users.find(u => u.id === 'instructor-2')!;
    const students = this.users.filter(u => u.role === 'student');

    this.courses = [
      {
        id: 'course-1',
        title: 'Advanced Mathematics',
        description: 'Comprehensive study of calculus, algebra, and mathematical analysis. Students will explore complex mathematical concepts through interactive problem-solving and real-world applications.',
        instructor: instructor1,
        students: students.slice(0, 4),
        subject: 'Mathematics',
        gradeLevel: '11th Grade',
        semester: 'Fall 2024',
        startDate: '2024-08-15',
        endDate: '2024-12-15',
        color: 'blue',
        icon: '📐',
        totalAssignments: 8,
        completedAssignments: 3
      },
      {
        id: 'course-2',
        title: 'Physics Laboratory',
        description: 'Hands-on physics experiments and demonstrations. Students will conduct experiments, analyze data, and present findings through video documentation.',
        instructor: instructor2,
        students: students.slice(1, 5),
        subject: 'Physics',
        gradeLevel: '11th Grade',
        semester: 'Fall 2024',
        startDate: '2024-08-15',
        endDate: '2024-12-15',
        color: 'purple',
        icon: '⚛️',
        totalAssignments: 6,
        completedAssignments: 2
      }
    ];
  }

  private generateAssignments() {
    const course1 = this.courses[0];
    const course2 = this.courses[1];

    this.assignments = [
      {
        id: 'assignment-1',
        title: 'Quadratic Functions Video Explanation',
        description: 'Create a 5-7 minute video explaining how to solve quadratic equations using the quadratic formula. Include step-by-step examples and real-world applications.',
        course: course1,
        instructor: course1.instructor,
        dueDate: '2024-10-15T23:59:59Z',
        points: 100,
        type: 'video' as const,
        requirements: [
          'Video must be 5-7 minutes long',
          'Include at least 3 worked examples',
          'Explain the quadratic formula clearly',
          'Show real-world applications',
          'Use clear audio and visual aids'
        ],
        rubric: [
          'Mathematical accuracy (25 points)',
          'Clarity of explanation (25 points)',
          'Visual presentation (20 points)',
          'Real-world connections (15 points)',
          'Audio quality (15 points)'
        ],
        status: 'published' as const,
        submissions: [],
        createdAt: '2024-09-01T10:00:00Z',
        updatedAt: '2024-09-01T10:00:00Z'
      },
      {
        id: 'assignment-2',
        title: 'Calculus Derivative Rules',
        description: 'Demonstrate the power rule, product rule, and chain rule for derivatives. Create a video showing how to apply each rule with multiple examples.',
        course: course1,
        instructor: course1.instructor,
        dueDate: '2024-10-30T23:59:59Z',
        points: 100,
        type: 'video' as const,
        requirements: [
          'Cover all three derivative rules',
          'Include 2 examples for each rule',
          'Show step-by-step solutions',
          'Use clear handwriting or digital tools',
          'Video should be 8-10 minutes'
        ],
        rubric: [
          'Correct application of rules (30 points)',
          'Clear step-by-step solutions (25 points)',
          'Multiple examples (20 points)',
          'Presentation quality (15 points)',
          'Time management (10 points)'
        ],
        status: 'published' as const,
        submissions: [],
        createdAt: '2024-09-15T10:00:00Z',
        updatedAt: '2024-09-15T10:00:00Z'
      },
      {
        id: 'assignment-3',
        title: 'Pendulum Motion Experiment',
        description: 'Conduct a pendulum experiment and create a video documenting your findings. Measure the period of oscillation and analyze the relationship between length and period.',
        course: course2,
        instructor: course2.instructor,
        dueDate: '2024-11-05T23:59:59Z',
        points: 100,
        type: 'video' as const,
        requirements: [
          'Set up pendulum with different lengths',
          'Measure period for each length',
          'Create data table and graph',
          'Explain the physics behind the results',
          'Video should be 6-8 minutes'
        ],
        rubric: [
          'Experimental setup (25 points)',
          'Data collection accuracy (25 points)',
          'Data analysis and graphing (20 points)',
          'Physics explanation (20 points)',
          'Video documentation (10 points)'
        ],
        status: 'published' as const,
        submissions: [],
        createdAt: '2024-09-20T10:00:00Z',
        updatedAt: '2024-09-20T10:00:00Z'
      },
      {
        id: 'assignment-4',
        title: 'Chemical Reaction Demonstration',
        description: 'Choose a chemical reaction and create a video demonstrating it safely. Explain the reactants, products, and the type of reaction occurring.',
        course: course2,
        instructor: course2.instructor,
        dueDate: '2024-11-20T23:59:59Z',
        points: 100,
        type: 'video' as const,
        requirements: [
          'Choose a safe chemical reaction',
          'Show before and after states',
          'Explain the chemical equation',
          'Identify the type of reaction',
          'Include safety precautions'
        ],
        rubric: [
          'Safety demonstration (30 points)',
          'Chemical accuracy (25 points)',
          'Clear explanation (20 points)',
          'Visual documentation (15 points)',
          'Safety awareness (10 points)'
        ],
        status: 'published' as const,
        submissions: [],
        createdAt: '2024-10-01T10:00:00Z',
        updatedAt: '2024-10-01T10:00:00Z'
      }
    ];
  }

  private generateVideos() {
    const students = this.users.filter(u => u.role === 'student');
    const assignments = this.assignments;

    this.videos = [
      {
        id: 'video-1',
        student: students[0], // Alex Chen
        assignment: assignments[0],
        title: 'Quadratic Formula Explained Simply',
        description: 'I break down the quadratic formula step by step with easy examples. Hope this helps you understand it better!',
        videoUrl: '/videos/quadratic-alex.mp4',
        thumbnailUrl: '/thumbnails/quadratic-alex.jpg',
        duration: '6:32',
        fileSize: 45.2,
        submittedAt: '2024-10-10T14:30:00Z',
        likes: 24,
        comments: 8,
        views: 156,
        rating: 4.8,
        isLiked: false,
        isPublic: true,
        status: 'graded' as const,
        grade: 92,
        feedback: 'Excellent explanation! Great use of examples and clear step-by-step process. Minor deduction for audio quality.',
        tags: ['mathematics', 'quadratic', 'algebra', 'tutorial']
      },
      {
        id: 'video-2',
        student: students[1], // Maya Patel
        assignment: assignments[0],
        title: 'Quadratic Equations Made Easy',
        description: 'Here\'s my take on solving quadratic equations. I used a different approach that might be easier to follow.',
        videoUrl: '/videos/quadratic-maya.mp4',
        thumbnailUrl: '/thumbnails/quadratic-maya.jpg',
        duration: '5:45',
        fileSize: 38.7,
        submittedAt: '2024-10-12T16:45:00Z',
        likes: 18,
        comments: 5,
        views: 98,
        rating: 4.5,
        isLiked: true,
        isPublic: true,
        status: 'graded' as const,
        grade: 88,
        feedback: 'Good approach! Clear explanation and good examples. Work on speaking a bit louder next time.',
        tags: ['mathematics', 'quadratic', 'algebra', 'tutorial']
      },
      {
        id: 'video-3',
        student: students[2], // Marcus Rodriguez
        assignment: assignments[1],
        title: 'Derivative Rules in Action',
        description: 'I demonstrate all three derivative rules with multiple examples. Check out my step-by-step process!',
        videoUrl: '/videos/derivatives-marcus.mp4',
        thumbnailUrl: '/thumbnails/derivatives-marcus.jpg',
        duration: '9:15',
        fileSize: 62.1,
        submittedAt: '2024-10-25T11:20:00Z',
        likes: 31,
        comments: 12,
        views: 203,
        rating: 4.9,
        isLiked: false,
        isPublic: true,
        status: 'submitted' as const,
        tags: ['calculus', 'derivatives', 'mathematics', 'tutorial']
      },
      {
        id: 'video-4',
        student: students[3], // Emma Thompson
        assignment: assignments[2],
        title: 'Pendulum Physics Lab',
        description: 'My pendulum experiment results! I tested 5 different lengths and found some interesting patterns.',
        videoUrl: '/videos/pendulum-emma.mp4',
        thumbnailUrl: '/thumbnails/pendulum-emma.jpg',
        duration: '7:20',
        fileSize: 51.3,
        submittedAt: '2024-10-28T13:15:00Z',
        likes: 22,
        comments: 9,
        views: 134,
        rating: 4.6,
        isLiked: true,
        isPublic: true,
        status: 'graded' as const,
        grade: 95,
        feedback: 'Outstanding work! Excellent experimental design and data analysis. Very clear presentation.',
        tags: ['physics', 'pendulum', 'experiment', 'oscillation']
      },
      {
        id: 'video-5',
        student: students[4], // David Lee
        assignment: assignments[0],
        title: 'Quadratic Formula with Visual Aids',
        description: 'I created some visual aids to help explain the quadratic formula. Let me know what you think!',
        videoUrl: '/videos/quadratic-david.mp4',
        thumbnailUrl: '/thumbnails/quadratic-david.jpg',
        duration: '6:58',
        fileSize: 47.8,
        submittedAt: '2024-10-14T09:30:00Z',
        likes: 15,
        comments: 6,
        views: 87,
        rating: 4.3,
        isLiked: false,
        isPublic: true,
        status: 'graded' as const,
        grade: 85,
        feedback: 'Great visual aids! The explanation was clear and the graphics helped a lot. Keep up the good work!',
        tags: ['mathematics', 'quadratic', 'visual', 'tutorial']
      }
    ];

    // Update assignment submissions
    assignments[0].submissions = this.videos.filter(v => v.assignment.id === 'assignment-1');
    assignments[1].submissions = this.videos.filter(v => v.assignment.id === 'assignment-2');
    assignments[2].submissions = this.videos.filter(v => v.assignment.id === 'assignment-3');
  }

  private generateComments() {
    const students = this.users.filter(u => u.role === 'student');
    const videos = this.videos;

    this.comments = [
      {
        id: 'comment-1',
        videoId: 'video-1',
        author: students[1], // Maya
        content: 'Great explanation Alex! The way you broke down the formula really helped me understand it better.',
        likes: 5,
        isLiked: false,
        createdAt: '2024-10-10T15:45:00Z',
        replies: [
          {
            id: 'comment-1-1',
            videoId: 'video-1',
            author: students[0], // Alex
            content: 'Thanks Maya! Glad it helped. Let me know if you need help with anything else.',
            likes: 2,
            isLiked: true,
            createdAt: '2024-10-10T16:00:00Z',
            replies: []
          }
        ]
      },
      {
        id: 'comment-2',
        videoId: 'video-1',
        author: students[2], // Marcus
        content: 'Could you explain the discriminant part a bit more? I\'m still confused about when to use it.',
        likes: 3,
        isLiked: false,
        createdAt: '2024-10-10T17:20:00Z',
        replies: []
      },
      {
        id: 'comment-3',
        videoId: 'video-2',
        author: students[0], // Alex
        content: 'Nice approach Maya! I like how you used the factoring method first. That\'s a good strategy.',
        likes: 4,
        isLiked: true,
        createdAt: '2024-10-12T18:30:00Z',
        replies: []
      },
      {
        id: 'comment-4',
        videoId: 'video-3',
        author: students[3], // Emma
        content: 'Excellent work Marcus! Your examples are really clear. The chain rule explanation was perfect.',
        likes: 7,
        isLiked: false,
        createdAt: '2024-10-25T14:15:00Z',
        replies: []
      },
      {
        id: 'comment-5',
        videoId: 'video-4',
        author: students[0], // Alex
        content: 'Wow Emma, your data analysis is really impressive! The graph you created shows the relationship perfectly.',
        likes: 6,
        isLiked: true,
        createdAt: '2024-10-28T15:30:00Z',
        replies: []
      }
    ];
  }

  private generateResponses() {
    const students = this.users.filter(u => u.role === 'student');
    const videos = this.videos;

    this.responses = [
      {
        id: 'response-1',
        videoId: 'video-1',
        assignmentId: 'assignment-1',
        student: students[1], // Maya
        content: 'Alex\'s video on quadratic equations was really helpful! I particularly liked how he explained the discriminant and its significance in determining the nature of the roots. His step-by-step approach made it easy to follow along, and the examples he chose were perfect for understanding the concept. The visual aids he used, especially the graph showing the parabola, really helped me connect the algebraic solution to the graphical representation. I would suggest adding a bit more about the practical applications of quadratic equations in real-world scenarios, but overall it was an excellent explanation that helped me understand the material better.',
        wordCount: 98,
        status: 'graded' as const,
        grade: 88,
        instructorFeedback: 'Good analysis! You clearly understood the concepts and provided thoughtful feedback. Consider discussing more about the mathematical reasoning behind the discriminant.',
        createdAt: '2024-10-11T10:30:00Z',
        gradedAt: '2024-10-12T14:20:00Z'
      },
      {
        id: 'response-2',
        videoId: 'video-2',
        assignmentId: 'assignment-1',
        student: students[2], // Marcus
        content: 'Maya\'s approach to solving quadratic equations was different from what I learned in class, but I found it really effective. She used the factoring method first, which is a great strategy when the equation can be factored easily. Her explanation of completing the square was particularly clear, and I liked how she showed multiple methods for solving the same equation. The way she organized her work on the whiteboard was very neat and easy to follow. I think her video would be especially helpful for students who struggle with the quadratic formula, as she provides alternative methods that might click better for some learners. The only suggestion I have is to maybe include a quick check of the answers to verify they work in the original equation.',
        wordCount: 127,
        status: 'graded' as const,
        grade: 92,
        instructorFeedback: 'Excellent response! You provided thoughtful analysis and constructive feedback. Your suggestion about checking answers is very practical.',
        createdAt: '2024-10-13T16:45:00Z',
        gradedAt: '2024-10-14T09:15:00Z'
      },
      {
        id: 'response-3',
        videoId: 'video-4',
        assignmentId: 'assignment-3',
        student: students[0], // Alex
        content: 'Emma\'s pendulum experiment was really well done! I was impressed by her experimental setup and the systematic way she collected data. Her analysis of the relationship between pendulum length and period was thorough, and the graph she created clearly shows the square root relationship predicted by the physics equations. I particularly liked how she explained the sources of error in her experiment and how they might have affected her results. The way she connected her experimental findings to the theoretical physics concepts was excellent. Her video was well-organized and easy to follow, with clear explanations of each step of the process. This is exactly the kind of hands-on learning that helps me understand physics concepts better.',
        wordCount: 134,
        status: 'submitted' as const,
        createdAt: '2024-10-29T11:20:00Z'
      }
    ];
  }

  // Getters for accessing the generated data
  getUsers(): TestUser[] {
    if (!this.isInitialized) {
      this.generateAllData();
    }
    return this.users;
  }

  getCourses(): TestCourse[] {
    if (!this.isInitialized) {
      this.generateAllData();
    }
    return this.courses;
  }

  getAssignments(): TestAssignment[] {
    if (!this.isInitialized) {
      this.generateAllData();
    }
    return this.assignments;
  }

  getVideos(): TestVideoSubmission[] {
    if (!this.isInitialized) {
      this.generateAllData();
    }
    return this.videos;
  }

  getComments(): TestComment[] {
    if (!this.isInitialized) {
      this.generateAllData();
    }
    return this.comments;
  }

  getResponses(): TestResponse[] {
    if (!this.isInitialized) {
      this.generateAllData();
    }
    return this.responses;
  }

  // Get data by specific criteria
  getUsersByRole(role: 'student' | 'instructor' | 'admin'): TestUser[] {
    if (!this.isInitialized) {
      this.generateAllData();
    }
    return this.users.filter(user => user.role === role);
  }

  getVideosByAssignment(assignmentId: string): TestVideoSubmission[] {
    if (!this.isInitialized) {
      this.generateAllData();
    }
    return this.videos.filter(video => video.assignment.id === assignmentId);
  }

  getCommentsByVideo(videoId: string): TestComment[] {
    if (!this.isInitialized) {
      this.generateAllData();
    }
    return this.comments.filter(comment => comment.videoId === videoId);
  }

  getResponsesByVideo(videoId: string): TestResponse[] {
    if (!this.isInitialized) {
      this.generateAllData();
    }
    return this.responses.filter(response => response.videoId === videoId);
  }

  getCourseById(courseId: string): TestCourse | undefined {
    if (!this.isInitialized) {
      this.generateAllData();
    }
    return this.courses.find(course => course.id === courseId);
  }

  getAssignmentById(assignmentId: string): TestAssignment | undefined {
    if (!this.isInitialized) {
      this.generateAllData();
    }
    return this.assignments.find(assignment => assignment.id === assignmentId);
  }

  getVideoById(videoId: string): TestVideoSubmission | undefined {
    if (!this.isInitialized) {
      this.generateAllData();
    }
    return this.videos.find(video => video.id === videoId);
  }

  getUserById(userId: string): TestUser | undefined {
    if (!this.isInitialized) {
      this.generateAllData();
    }
    return this.users.find(user => user.id === userId);
  }
}

// Export singleton instance
export const testDataGenerator = TestDataGenerator.getInstance();
