#!/usr/bin/env node

/**
 * Sample Data Population Script
 * Adds realistic sample data to DynamoDB tables for demonstration
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

// Sample data generators
const sampleUsers = [
  {
    userId: 'user_001',
    email: 'john.doe@university.edu',
    firstName: 'John',
    lastName: 'Doe',
    role: 'student',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    lastLoginAt: '2024-01-22T14:30:00Z',
    profile: {
      avatar: '/api/placeholder/40/40',
      bio: 'Computer Science major with passion for algorithms',
      schoolName: 'University of Technology',
      classOf: '2025',
      favoriteSubject: 'Data Structures',
      hobbies: 'Coding, Chess, Photography',
      careerGoals: 'Software Engineer at a tech company'
    }
  },
  {
    userId: 'user_002',
    email: 'jane.smith@university.edu',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'student',
    status: 'active',
    createdAt: '2024-01-10T09:00:00Z',
    lastLoginAt: '2024-01-22T16:45:00Z',
    profile: {
      avatar: '/api/placeholder/40/40',
      bio: 'Mathematics enthusiast and future data scientist',
      schoolName: 'University of Technology',
      classOf: '2024',
      favoriteSubject: 'Calculus',
      hobbies: 'Reading, Hiking, Music',
      careerGoals: 'Data Scientist'
    }
  },
  {
    userId: 'instructor_001',
    email: 'prof.wilson@university.edu',
    firstName: 'Dr. Michael',
    lastName: 'Wilson',
    role: 'instructor',
    status: 'active',
    createdAt: '2024-01-01T08:00:00Z',
    lastLoginAt: '2024-01-22T17:00:00Z',
    profile: {
      avatar: '/api/placeholder/40/40',
      bio: 'Professor of Computer Science with 15 years experience',
      department: 'Computer Science',
      title: 'Professor',
      researchInterests: 'Machine Learning, Algorithms, Data Structures'
    }
  },
  {
    userId: 'instructor_002',
    email: 'prof.garcia@university.edu',
    firstName: 'Dr. Maria',
    lastName: 'Garcia',
    role: 'instructor',
    status: 'active',
    createdAt: '2024-01-01T08:00:00Z',
    lastLoginAt: '2024-01-22T16:30:00Z',
    profile: {
      avatar: '/api/placeholder/40/40',
      bio: 'Mathematics Professor specializing in Calculus and Linear Algebra',
      department: 'Mathematics',
      title: 'Associate Professor',
      researchInterests: 'Applied Mathematics, Statistics'
    }
  }
];

const sampleCourses = [
  {
    courseId: 'course_001',
    code: 'CS101',
    title: 'Introduction to Computer Science',
    description: 'Fundamental concepts of computer science including programming, algorithms, and data structures.',
    instructorId: 'instructor_001',
    instructorName: 'Dr. Michael Wilson',
    department: 'Computer Science',
    credits: 3,
    semester: 'Spring 2024',
    status: 'active',
    enrollment: {
      students: ['user_001', 'user_002'],
      maxStudents: 30,
      currentCount: 2,
      enrollmentDates: {
        'user_001': '2024-01-15T10:00:00Z',
        'user_002': '2024-01-10T09:00:00Z'
      }
    },
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-22T17:00:00Z'
  },
  {
    courseId: 'course_002',
    code: 'MATH201',
    title: 'Calculus I',
    description: 'Introduction to differential and integral calculus with applications.',
    instructorId: 'instructor_002',
    instructorName: 'Dr. Maria Garcia',
    department: 'Mathematics',
    credits: 4,
    semester: 'Spring 2024',
    status: 'active',
    enrollment: {
      students: ['user_001', 'user_002'],
      maxStudents: 25,
      currentCount: 2,
      enrollmentDates: {
        'user_001': '2024-01-15T10:00:00Z',
        'user_002': '2024-01-10T09:00:00Z'
      }
    },
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-22T17:00:00Z'
  }
];

const sampleAssignments = [
  {
    assignmentId: 'assignment_001',
    courseId: 'course_001',
    title: 'Data Structures Implementation',
    description: 'Implement a binary search tree with insert, delete, and search operations. Submit a video explaining your implementation.',
    type: 'video_assessment',
    maxScore: 100,
    dueDate: '2024-02-15T23:59:59Z',
    status: 'active',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
    instructions: 'Create a 5-10 minute video demonstrating your binary search tree implementation. Show the code, explain the algorithms, and demonstrate the functionality.',
    attachments: [
      {
        name: 'BST_Requirements.pdf',
        url: '/api/placeholder/document',
        type: 'pdf'
      }
    ]
  },
  {
    assignmentId: 'assignment_002',
    courseId: 'course_002',
    title: 'Calculus Problem Solving',
    description: 'Solve the following calculus problems and explain your solutions in a video presentation.',
    type: 'video_discussion',
    maxScore: 150,
    dueDate: '2024-02-20T23:59:59Z',
    status: 'active',
    createdAt: '2024-01-18T14:00:00Z',
    updatedAt: '2024-01-18T14:00:00Z',
    instructions: 'Record a 10-15 minute video solving the provided calculus problems. Show your work step-by-step and explain your reasoning.',
    attachments: [
      {
        name: 'Calculus_Problems.pdf',
        url: '/api/placeholder/document',
        type: 'pdf'
      }
    ]
  }
];

const sampleSubmissions = [
  {
    submissionId: 'submission_001',
    studentId: 'user_001',
    assignmentId: 'assignment_001',
    courseId: 'course_001',
    type: 'video',
    status: 'submitted',
    submittedAt: '2024-01-22T14:30:00Z',
    videoUrl: 'https://s3.amazonaws.com/classcast-videos/submissions/submission_001.mp4',
    duration: 420,
    fileSize: 45000000,
    grade: null,
    maxScore: 100,
    feedback: null,
    createdAt: '2024-01-22T14:30:00Z',
    updatedAt: '2024-01-22T14:30:00Z'
  },
  {
    submissionId: 'submission_002',
    studentId: 'user_002',
    assignmentId: 'assignment_001',
    courseId: 'course_001',
    type: 'video',
    status: 'graded',
    submittedAt: '2024-01-21T16:45:00Z',
    videoUrl: 'https://s3.amazonaws.com/classcast-videos/submissions/submission_002.mp4',
    duration: 380,
    fileSize: 42000000,
    grade: 92,
    maxScore: 100,
    percentage: 92,
    letterGrade: 'A-',
    feedback: 'Excellent implementation! Your explanation of the algorithms was clear and thorough. Consider optimizing the delete operation for better performance.',
    gradedAt: '2024-01-22T10:00:00Z',
    gradedBy: 'instructor_001',
    createdAt: '2024-01-21T16:45:00Z',
    updatedAt: '2024-01-22T10:00:00Z'
  }
];

const sampleVideos = [
  {
    id: 'video_001',
    title: 'Binary Search Tree Implementation',
    description: 'A comprehensive explanation of binary search tree operations with code examples.',
    videoUrl: 'https://s3.amazonaws.com/classcast-videos/videos/video_001.mp4',
    thumbnailUrl: 'https://s3.amazonaws.com/classcast-videos/thumbnails/video_001.jpg',
    duration: 420,
    fileSize: 45000000,
    status: 'processed',
    visibility: 'public',
    tags: ['data-structures', 'algorithms', 'binary-search-tree'],
    stats: {
      views: 15,
      likes: 8,
      comments: 3,
      shares: 2
    },
    metadata: {
      resolution: '1920x1080',
      frameRate: 30,
      codec: 'h264'
    },
    createdAt: '2024-01-22T14:30:00Z',
    updatedAt: '2024-01-22T14:30:00Z'
  },
  {
    id: 'video_002',
    title: 'Calculus Problem Solving Techniques',
    description: 'Step-by-step solutions to common calculus problems with detailed explanations.',
    videoUrl: 'https://s3.amazonaws.com/classcast-videos/videos/video_002.mp4',
    thumbnailUrl: 'https://s3.amazonaws.com/classcast-videos/thumbnails/video_002.jpg',
    duration: 380,
    fileSize: 42000000,
    status: 'processed',
    visibility: 'public',
    tags: ['calculus', 'mathematics', 'problem-solving'],
    stats: {
      views: 12,
      likes: 6,
      comments: 2,
      shares: 1
    },
    metadata: {
      resolution: '1920x1080',
      frameRate: 30,
      codec: 'h264'
    },
    createdAt: '2024-01-21T16:45:00Z',
    updatedAt: '2024-01-21T16:45:00Z'
  }
];

const samplePeerResponses = [
  {
    id: 'response_001',
    reviewerId: 'user_002',
    reviewerName: 'Jane Smith',
    videoId: 'video_001',
    assignmentId: 'assignment_001',
    content: 'Great implementation! I really liked how you explained the recursive nature of the insert operation. The code is clean and well-commented. One suggestion would be to add some edge case handling for duplicate values.',
    wordCount: 45,
    characterCount: 280,
    isSubmitted: true,
    submittedAt: '2024-01-23T10:00:00Z',
    lastSavedAt: '2024-01-23T10:00:00Z',
    createdAt: '2024-01-23T10:00:00Z',
    updatedAt: '2024-01-23T10:00:00Z'
  },
  {
    id: 'response_002',
    reviewerId: 'user_001',
    reviewerName: 'John Doe',
    videoId: 'video_002',
    assignmentId: 'assignment_002',
    content: 'Excellent problem-solving approach! Your step-by-step breakdown made it easy to follow. The visual aids you used really helped illustrate the concepts. I learned a lot from your explanation of the chain rule application.',
    wordCount: 38,
    characterCount: 245,
    isSubmitted: true,
    submittedAt: '2024-01-22T15:30:00Z',
    lastSavedAt: '2024-01-22T15:30:00Z',
    createdAt: '2024-01-22T15:30:00Z',
    updatedAt: '2024-01-22T15:30:00Z'
  }
];

// Helper function to add data to a table
async function addDataToTable(tableName, items) {
  console.log(`📝 Adding ${items.length} items to ${tableName}...`);
  
  try {
    // Split into batches of 25 (DynamoDB limit)
    const batches = [];
    for (let i = 0; i < items.length; i += 25) {
      batches.push(items.slice(i, i + 25));
    }
    
    for (const batch of batches) {
      const putRequests = batch.map(item => ({
        PutRequest: { Item: item }
      }));
      
      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [tableName]: putRequests
        }
      }));
    }
    
    console.log(`✅ Successfully added ${items.length} items to ${tableName}`);
  } catch (error) {
    console.error(`❌ Error adding data to ${tableName}:`, error.message);
    throw error;
  }
}

// Main function to populate all tables
async function populateSampleData() {
  console.log('🚀 Starting sample data population...');
  
  try {
    // Add users
    await addDataToTable('classcast-users', sampleUsers);
    
    // Add courses
    await addDataToTable('classcast-courses', sampleCourses);
    
    // Add assignments
    await addDataToTable('classcast-assignments', sampleAssignments);
    
    // Add submissions
    await addDataToTable('classcast-submissions', sampleSubmissions);
    
    // Add videos
    await addDataToTable('classcast-videos', sampleVideos);
    
    // Add peer responses
    await addDataToTable('classcast-peer-responses', samplePeerResponses);
    
    console.log('\n🎉 Sample data population completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Users: ${sampleUsers.length}`);
    console.log(`   - Courses: ${sampleCourses.length}`);
    console.log(`   - Assignments: ${sampleAssignments.length}`);
    console.log(`   - Submissions: ${sampleSubmissions.length}`);
    console.log(`   - Videos: ${sampleVideos.length}`);
    console.log(`   - Peer Responses: ${samplePeerResponses.length}`);
    
  } catch (error) {
    console.error('❌ Error populating sample data:', error);
    process.exit(1);
  }
}

// Run the population
populateSampleData();
