// ============================================================================
// DEMO/SCREENSHOT MODE - Mock Data for App Store Screenshots
// ============================================================================
// This module provides completely fake data with stock photos for generating
// App Store screenshots that contain zero real student PII.

export interface DemoStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  classOf: string;
}

export interface DemoAssignment {
  assignmentId: string;
  title: string;
  courseName: string;
  courseInitials: string;
  dueDate: string;
  maxScore: number;
  isSubmitted: boolean;
  createdAt: string;
  grade?: number;
  feedback?: string;
}

export interface DemoFeedItem {
  id: string;
  type: 'video';
  title: string;
  videoUrl: string;
  author: { name: string; avatar: string; id: string };
  rating: number;
  likes: number;
  comments: number;
  assignmentId: string;
}

export interface DemoCourse {
  id: string;
  name: string;
  code: string;
  instructor: string;
  progress: number;
}

// Stock photo avatars from Unsplash (safe, royalty-free)
// Using younger-looking diverse stock photos appropriate for high school context
const STOCK_AVATARS = [
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', // young woman
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', // teen girl
  'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=150&h=150&fit=crop&crop=face', // young man
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop&crop=face', // teen girl 2
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face', // young woman 2
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face', // young man 2
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face', // young woman 3
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', // young man 3
];

// The main demo student (the "logged in" user for screenshots)
export const DEMO_STUDENT: DemoStudent = {
  id: 'demo-screenshot-user',
  firstName: 'Alex',
  lastName: 'Johnson',
  email: 'alex.johnson@demo.edu',
  avatar: STOCK_AVATARS[0],
  classOf: '2027',
};

// Peer students for the feed
export const DEMO_PEERS: DemoStudent[] = [
  { id: 'demo-peer-1', firstName: 'Sam', lastName: 'Rivera', email: 'sam.r@demo.edu', avatar: STOCK_AVATARS[1], classOf: '2027' },
  { id: 'demo-peer-2', firstName: 'Jordan', lastName: 'Chen', email: 'jordan.c@demo.edu', avatar: STOCK_AVATARS[2], classOf: '2027' },
  { id: 'demo-peer-3', firstName: 'Taylor', lastName: 'Williams', email: 'taylor.w@demo.edu', avatar: STOCK_AVATARS[3], classOf: '2026' },
  { id: 'demo-peer-4', firstName: 'Morgan', lastName: 'Davis', email: 'morgan.d@demo.edu', avatar: STOCK_AVATARS[4], classOf: '2027' },
  { id: 'demo-peer-5', firstName: 'Casey', lastName: 'Kim', email: 'casey.k@demo.edu', avatar: STOCK_AVATARS[5], classOf: '2026' },
  { id: 'demo-peer-6', firstName: 'Riley', lastName: 'Patel', email: 'riley.p@demo.edu', avatar: STOCK_AVATARS[6], classOf: '2027' },
  { id: 'demo-peer-7', firstName: 'Avery', lastName: 'Thompson', email: 'avery.t@demo.edu', avatar: STOCK_AVATARS[7], classOf: '2027' },
];

// Demo courses
export const DEMO_COURSES: DemoCourse[] = [
  { id: 'demo-course-1', name: 'U.S. History', code: 'HIST 101', instructor: 'Dr. Martinez', progress: 72 },
  { id: 'demo-course-2', name: 'Biology Lab', code: 'BIO 201', instructor: 'Prof. Anderson', progress: 58 },
  { id: 'demo-course-3', name: 'English Literature', code: 'ENG 150', instructor: 'Ms. Thompson', progress: 85 },
  { id: 'demo-course-4', name: 'Pre-Calculus', code: 'MATH 250', instructor: 'Mr. Wilson', progress: 64 },
];

// Demo assignments with realistic due dates relative to "now"
function getRelativeDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}

export function getDemoAssignments(): DemoAssignment[] {
  return [
    {
      assignmentId: 'demo-assign-1',
      title: 'Video Essay: The American Revolution',
      courseName: 'U.S. History',
      courseInitials: 'HIST',
      dueDate: getRelativeDate(3),
      maxScore: 100,
      isSubmitted: false,
      createdAt: getRelativeDate(-2),
    },
    {
      assignmentId: 'demo-assign-2',
      title: 'Lab Report: Cell Division',
      courseName: 'Biology Lab',
      courseInitials: 'BIO',
      dueDate: getRelativeDate(5),
      maxScore: 50,
      isSubmitted: false,
      createdAt: getRelativeDate(-1),
    },
    {
      assignmentId: 'demo-assign-3',
      title: 'Poetry Analysis: Robert Frost',
      courseName: 'English Literature',
      courseInitials: 'ENG',
      dueDate: getRelativeDate(7),
      maxScore: 75,
      isSubmitted: false,
      createdAt: getRelativeDate(-3),
    },
    {
      assignmentId: 'demo-assign-4',
      title: 'Quadratic Functions Presentation',
      courseName: 'Pre-Calculus',
      courseInitials: 'MATH',
      dueDate: getRelativeDate(1),
      maxScore: 80,
      isSubmitted: false,
      createdAt: getRelativeDate(-4),
    },
    {
      assignmentId: 'demo-assign-5',
      title: 'Civil Rights Movement Documentary',
      courseName: 'U.S. History',
      courseInitials: 'HIST',
      dueDate: getRelativeDate(-2),
      maxScore: 100,
      isSubmitted: true,
      createdAt: getRelativeDate(-10),
      grade: 92,
      feedback: 'Excellent analysis of primary sources. Strong narrative structure.',
    },
    {
      assignmentId: 'demo-assign-6',
      title: 'Photosynthesis Experiment Video',
      courseName: 'Biology Lab',
      courseInitials: 'BIO',
      dueDate: getRelativeDate(-5),
      maxScore: 50,
      isSubmitted: true,
      createdAt: getRelativeDate(-12),
      grade: 47,
      feedback: 'Great experimental design and clear explanation of results.',
    },
  ];
}

// Demo feed items (videos from peers)
export function getDemoFeed(): DemoFeedItem[] {
  return [
    {
      id: 'demo-feed-1',
      type: 'video',
      title: 'Boston Tea Party Analysis',
      videoUrl: '',
      author: { name: 'Sam Rivera', avatar: STOCK_AVATARS[1], id: 'demo-peer-1' },
      rating: 5,
      likes: 12,
      comments: 3,
      assignmentId: 'demo-assign-5',
    },
    {
      id: 'demo-feed-2',
      type: 'video',
      title: 'Mitosis Time-Lapse',
      videoUrl: '',
      author: { name: 'Jordan Chen', avatar: STOCK_AVATARS[2], id: 'demo-peer-2' },
      rating: 4,
      likes: 8,
      comments: 2,
      assignmentId: 'demo-assign-6',
    },
    {
      id: 'demo-feed-3',
      type: 'video',
      title: 'Stopping by Woods on a Snowy Evening',
      videoUrl: '',
      author: { name: 'Taylor Williams', avatar: STOCK_AVATARS[3], id: 'demo-peer-3' },
      rating: 5,
      likes: 15,
      comments: 5,
      assignmentId: 'demo-assign-3',
    },
    {
      id: 'demo-feed-4',
      type: 'video',
      title: 'Solving Quadratics',
      videoUrl: '',
      author: { name: 'Morgan Davis', avatar: STOCK_AVATARS[4], id: 'demo-peer-4' },
      rating: 4,
      likes: 6,
      comments: 1,
      assignmentId: 'demo-assign-4',
    },
    {
      id: 'demo-feed-5',
      type: 'video',
      title: 'Declaration of Independence',
      videoUrl: '',
      author: { name: 'Casey Kim', avatar: STOCK_AVATARS[5], id: 'demo-peer-5' },
      rating: 5,
      likes: 20,
      comments: 7,
      assignmentId: 'demo-assign-1',
    },
    {
      id: 'demo-feed-6',
      type: 'video',
      title: 'DNA Replication Model',
      videoUrl: '',
      author: { name: 'Riley Patel', avatar: STOCK_AVATARS[6], id: 'demo-peer-6' },
      rating: 4,
      likes: 9,
      comments: 2,
      assignmentId: 'demo-assign-2',
    },
  ];
}

// Demo grades for the grades page
export function getDemoGrades() {
  return [
    { courseId: 'demo-course-1', courseName: 'U.S. History', grade: 'A-', percentage: 91, assignments: 8, completed: 6 },
    { courseId: 'demo-course-2', courseName: 'Biology Lab', grade: 'A', percentage: 94, assignments: 6, completed: 5 },
    { courseId: 'demo-course-3', courseName: 'English Literature', grade: 'B+', percentage: 87, assignments: 7, completed: 7 },
    { courseId: 'demo-course-4', courseName: 'Pre-Calculus', grade: 'B', percentage: 83, assignments: 10, completed: 8 },
  ];
}

// Check if screenshot/demo mode is active
export function isScreenshotMode(): boolean {
  if (typeof window === 'undefined') return false;
  // Activated via URL param ?demo=screenshots or localStorage flag
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('demo') === 'screenshots') return true;
  if (localStorage.getItem('classcast-screenshot-mode') === 'true') return true;
  return false;
}

// Enable screenshot mode (persists in localStorage)
export function enableScreenshotMode(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('classcast-screenshot-mode', 'true');
}

// Disable screenshot mode
export function disableScreenshotMode(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('classcast-screenshot-mode');
}

// ============================================================================
// DEMO LOGIN CREDENTIALS (for Apple App Review)
// ============================================================================
export const DEMO_LOGIN_EMAIL = 'demo@classcast.ai';
export const DEMO_LOGIN_PASSWORD = 'Demo2026!';

/**
 * Check if the given credentials match the demo account
 */
export function isDemoLoginCredentials(email: string, password: string): boolean {
  return email.toLowerCase() === DEMO_LOGIN_EMAIL && password === DEMO_LOGIN_PASSWORD;
}

/**
 * Get the demo user object to set in AuthContext when demo login succeeds
 */
export function getDemoUserForAuth() {
  return {
    id: 'demo-screenshot-user',
    email: DEMO_LOGIN_EMAIL,
    firstName: DEMO_STUDENT.firstName,
    lastName: DEMO_STUDENT.lastName,
    role: 'student' as const,
    avatar: DEMO_STUDENT.avatar,
    emailVerified: true,
    isDemoUser: true,
    demoViewingUserId: 'demo-screenshot-user',
    classOf: DEMO_STUDENT.classOf,
  };
}
