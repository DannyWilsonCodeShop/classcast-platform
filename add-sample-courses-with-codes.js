#!/usr/bin/env node

/**
 * Sample Courses with Class Codes
 * Adds courses with class codes for testing enrollment
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = 'classcast-courses';
const SECTIONS_TABLE = 'classcast-sections';

// Sample courses with class codes
const sampleCourses = [
  {
    courseId: 'course_cs101_2024',
    title: 'Introduction to Computer Science',
    description: 'Fundamental concepts of computer science including programming, algorithms, and data structures.',
    code: 'CS101',
    classCode: 'CS101A', // This is the class code students will use to enroll
    courseCode: 'CS101', // This is the course code
    department: 'Computer Science',
    credits: 3,
    semester: 'Spring 2024',
    year: 2024,
    instructorId: 'instructor_001',
    instructorName: 'Dr. Michael Wilson',
    instructorEmail: 'prof.wilson@university.edu',
    status: 'published', // Important: must be published for enrollment
    maxStudents: 30,
    currentEnrollment: 0,
    enrollment: {
      students: [],
      waitlist: []
    },
    schedule: {
      days: ['Monday', 'Wednesday', 'Friday'],
      time: '10:00 AM - 11:00 AM',
      location: 'Room 101'
    },
    prerequisites: [],
    learningObjectives: [
      'Understand basic programming concepts',
      'Learn data structures and algorithms',
      'Develop problem-solving skills'
    ],
    gradingPolicy: {
      assignments: 40,
      quizzes: 20,
      exams: 30,
      participation: 5,
      final: 5
    },
    settings: {
      allowLateSubmissions: true,
      latePenalty: 10,
      allowResubmissions: false,
      requireAttendance: false,
      enableDiscussions: true,
      enableAnnouncements: true,
      privacy: 'public'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    courseId: 'course_math201_2024',
    title: 'Calculus I',
    description: 'Introduction to differential and integral calculus with applications.',
    code: 'MATH201',
    classCode: 'MATH201A', // This is the class code students will use to enroll
    courseCode: 'MATH201', // This is the course code
    department: 'Mathematics',
    credits: 4,
    semester: 'Spring 2024',
    year: 2024,
    instructorId: 'instructor_002',
    instructorName: 'Dr. Maria Garcia',
    instructorEmail: 'prof.garcia@university.edu',
    status: 'published', // Important: must be published for enrollment
    maxStudents: 25,
    currentEnrollment: 0,
    enrollment: {
      students: [],
      waitlist: []
    },
    schedule: {
      days: ['Tuesday', 'Thursday'],
      time: '2:00 PM - 3:30 PM',
      location: 'Room 205'
    },
    prerequisites: ['MATH101'],
    learningObjectives: [
      'Master differential calculus concepts',
      'Apply calculus to real-world problems',
      'Develop mathematical reasoning skills'
    ],
    gradingPolicy: {
      assignments: 30,
      quizzes: 25,
      exams: 35,
      participation: 5,
      final: 5
    },
    settings: {
      allowLateSubmissions: true,
      latePenalty: 5,
      allowResubmissions: true,
      requireAttendance: true,
      enableDiscussions: true,
      enableAnnouncements: true,
      privacy: 'public'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    courseId: 'course_eng101_2024',
    title: 'English Composition',
    description: 'Develop writing skills through various forms of composition and critical thinking.',
    code: 'ENG101',
    classCode: 'ENG101A', // This is the class code students will use to enroll
    courseCode: 'ENG101', // This is the course code
    department: 'English',
    credits: 3,
    semester: 'Spring 2024',
    year: 2024,
    instructorId: 'instructor_003',
    instructorName: 'Dr. Sarah Johnson',
    instructorEmail: 'prof.johnson@university.edu',
    status: 'published', // Important: must be published for enrollment
    maxStudents: 20,
    currentEnrollment: 0,
    enrollment: {
      students: [],
      waitlist: []
    },
    schedule: {
      days: ['Monday', 'Wednesday'],
      time: '1:00 PM - 2:30 PM',
      location: 'Room 301'
    },
    prerequisites: [],
    learningObjectives: [
      'Improve writing clarity and organization',
      'Develop critical thinking skills',
      'Master various writing formats'
    ],
    gradingPolicy: {
      assignments: 50,
      quizzes: 10,
      exams: 20,
      participation: 10,
      final: 10
    },
    settings: {
      allowLateSubmissions: true,
      latePenalty: 10,
      allowResubmissions: true,
      requireAttendance: true,
      enableDiscussions: true,
      enableAnnouncements: true,
      privacy: 'public'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Sample sections for the courses
const sampleSections = [
  {
    sectionId: 'section_cs101_001',
    courseId: 'course_cs101_2024',
    sectionName: 'CS101 - Section 1',
    sectionCode: 'CS101-001',
    classCode: 'CS101A', // Same as course class code
    description: 'Morning section for Introduction to Computer Science',
    maxEnrollment: 15,
    currentEnrollment: 0,
    schedule: {
      days: ['Monday', 'Wednesday', 'Friday'],
      time: '10:00 AM - 11:00 AM',
      location: 'Room 101'
    },
    location: 'Room 101',
    instructorId: 'instructor_001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true
  },
  {
    sectionId: 'section_cs101_002',
    courseId: 'course_cs101_2024',
    sectionName: 'CS101 - Section 2',
    sectionCode: 'CS101-002',
    classCode: 'CS101B', // Different class code for this section
    description: 'Afternoon section for Introduction to Computer Science',
    maxEnrollment: 15,
    currentEnrollment: 0,
    schedule: {
      days: ['Monday', 'Wednesday', 'Friday'],
      time: '2:00 PM - 3:00 PM',
      location: 'Room 102'
    },
    location: 'Room 102',
    instructorId: 'instructor_001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true
  },
  {
    sectionId: 'section_math201_001',
    courseId: 'course_math201_2024',
    sectionName: 'MATH201 - Section 1',
    sectionCode: 'MATH201-001',
    classCode: 'MATH201A', // Same as course class code
    description: 'Main section for Calculus I',
    maxEnrollment: 25,
    currentEnrollment: 0,
    schedule: {
      days: ['Tuesday', 'Thursday'],
      time: '2:00 PM - 3:30 PM',
      location: 'Room 205'
    },
    location: 'Room 205',
    instructorId: 'instructor_002',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true
  },
  {
    sectionId: 'section_eng101_001',
    courseId: 'course_eng101_2024',
    sectionName: 'ENG101 - Section 1',
    sectionCode: 'ENG101-001',
    classCode: 'ENG101A', // Same as course class code
    description: 'Main section for English Composition',
    maxEnrollment: 20,
    currentEnrollment: 0,
    schedule: {
      days: ['Monday', 'Wednesday'],
      time: '1:00 PM - 2:30 PM',
      location: 'Room 301'
    },
    location: 'Room 301',
    instructorId: 'instructor_003',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true
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

// Main function to populate courses and sections
async function populateCoursesWithCodes() {
  console.log('🚀 Starting course and section population...');
  
  try {
    // Add courses with class codes
    await addDataToTable(COURSES_TABLE, sampleCourses);
    
    // Add sections
    await addDataToTable(SECTIONS_TABLE, sampleSections);
    
    console.log('\n🎉 Course and section population completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Courses: ${sampleCourses.length}`);
    console.log(`   - Sections: ${sampleSections.length}`);
    
    console.log('\n🔑 Class Codes for Testing:');
    sampleCourses.forEach(course => {
      console.log(`   - ${course.title}: ${course.classCode}`);
    });
    
    console.log('\n📚 Section Codes:');
    sampleSections.forEach(section => {
      console.log(`   - ${section.sectionName}: ${section.classCode}`);
    });
    
  } catch (error) {
    console.error('❌ Error populating courses and sections:', error);
    process.exit(1);
  }
}

// Run the population
populateCoursesWithCodes();
