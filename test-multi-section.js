#!/usr/bin/env node

/**
 * Test Multi-Section Functionality
 * Creates a course with multiple sections and tests enrollment
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = 'classcast-courses';
const SECTIONS_TABLE = 'classcast-sections';

// Test course with multiple sections
const testCourse = {
  courseId: 'test_course_multi_section',
  title: 'Advanced Computer Science',
  description: 'Advanced topics in computer science with multiple sections for different time slots.',
  code: 'CS301',
  classCode: 'CS301A', // Main course class code
  courseCode: 'CS301',
  department: 'Computer Science',
  credits: 3,
  semester: 'Spring 2024',
  year: 2024,
  instructorId: 'instructor_001',
  instructorName: 'Dr. Michael Wilson',
  instructorEmail: 'prof.wilson@university.edu',
  status: 'published',
  maxStudents: 60, // Total capacity across all sections
  currentEnrollment: 0,
  enrollment: {
    students: [],
    waitlist: []
  },
  schedule: {
    days: ['Monday', 'Wednesday', 'Friday'],
    time: 'Multiple Times',
    location: 'Various Rooms'
  },
  prerequisites: ['CS101', 'CS201'],
  learningObjectives: [
    'Master advanced algorithms and data structures',
    'Develop complex software systems',
    'Understand system design principles'
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
};

// Test sections for the course
const testSections = [
  {
    sectionId: 'test_section_001',
    courseId: 'test_course_multi_section',
    sectionName: 'CS301 - Section 1 (Morning)',
    sectionCode: 'CS301-001',
    classCode: 'CS301A1', // Unique class code for this section
    description: 'Morning section for Advanced Computer Science',
    maxEnrollment: 20,
    currentEnrollment: 0,
    schedule: {
      days: ['Monday', 'Wednesday', 'Friday'],
      time: '9:00 AM - 10:30 AM',
      location: 'Room 201'
    },
    location: 'Room 201',
    instructorId: 'instructor_001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true
  },
  {
    sectionId: 'test_section_002',
    courseId: 'test_course_multi_section',
    sectionName: 'CS301 - Section 2 (Afternoon)',
    sectionCode: 'CS301-002',
    classCode: 'CS301A2', // Unique class code for this section
    description: 'Afternoon section for Advanced Computer Science',
    maxEnrollment: 20,
    currentEnrollment: 0,
    schedule: {
      days: ['Monday', 'Wednesday', 'Friday'],
      time: '2:00 PM - 3:30 PM',
      location: 'Room 202'
    },
    location: 'Room 202',
    instructorId: 'instructor_001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true
  },
  {
    sectionId: 'test_section_003',
    courseId: 'test_course_multi_section',
    sectionName: 'CS301 - Section 3 (Evening)',
    sectionCode: 'CS301-003',
    classCode: 'CS301A3', // Unique class code for this section
    description: 'Evening section for Advanced Computer Science',
    maxEnrollment: 20,
    currentEnrollment: 0,
    schedule: {
      days: ['Tuesday', 'Thursday'],
      time: '6:00 PM - 8:00 PM',
      location: 'Room 203'
    },
    location: 'Room 203',
    instructorId: 'instructor_001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true
  }
];

// Test students for enrollment
const testStudents = [
  {
    userId: 'test_student_001',
    email: 'student1@university.edu',
    firstName: 'Alice',
    lastName: 'Johnson',
    enrolledAt: new Date().toISOString(),
    status: 'active',
    sectionId: 'test_section_001'
  },
  {
    userId: 'test_student_002',
    email: 'student2@university.edu',
    firstName: 'Bob',
    lastName: 'Smith',
    enrolledAt: new Date().toISOString(),
    status: 'active',
    sectionId: 'test_section_001'
  },
  {
    userId: 'test_student_003',
    email: 'student3@university.edu',
    firstName: 'Carol',
    lastName: 'Davis',
    enrolledAt: new Date().toISOString(),
    status: 'active',
    sectionId: 'test_section_002'
  },
  {
    userId: 'test_student_004',
    email: 'student4@university.edu',
    firstName: 'David',
    lastName: 'Wilson',
    enrolledAt: new Date().toISOString(),
    status: 'active',
    sectionId: 'test_section_002'
  },
  {
    userId: 'test_student_005',
    email: 'student5@university.edu',
    firstName: 'Eve',
    lastName: 'Brown',
    enrolledAt: new Date().toISOString(),
    status: 'active',
    sectionId: 'test_section_003'
  }
];

async function createTestData() {
  console.log('🧪 Creating test multi-section course...\n');
  
  try {
    // Create the course
    console.log('📚 Creating course...');
    await docClient.send(new PutCommand({
      TableName: COURSES_TABLE,
      Item: testCourse
    }));
    console.log('✅ Course created successfully');

    // Create sections
    console.log('\n🏫 Creating sections...');
    for (const section of testSections) {
      await docClient.send(new PutCommand({
        TableName: SECTIONS_TABLE,
        Item: section
      }));
      console.log(`✅ Section created: ${section.sectionName} (${section.classCode})`);
    }

    // Update course with enrolled students
    console.log('\n👥 Adding test students to course...');
    const updatedCourse = {
      ...testCourse,
      enrollment: {
        students: testStudents,
        waitlist: []
      },
      currentEnrollment: testStudents.length
    };

    await docClient.send(new PutCommand({
      TableName: COURSES_TABLE,
      Item: updatedCourse
    }));
    console.log('✅ Students added to course');

    // Update section enrollment counts
    console.log('\n📊 Updating section enrollment counts...');
    const sectionCounts = testStudents.reduce((acc, student) => {
      acc[student.sectionId] = (acc[student.sectionId] || 0) + 1;
      return acc;
    }, {});

    for (const [sectionId, count] of Object.entries(sectionCounts)) {
      const section = testSections.find(s => s.sectionId === sectionId);
      if (section) {
        const updatedSection = {
          ...section,
          currentEnrollment: count
        };
        await docClient.send(new PutCommand({
          TableName: SECTIONS_TABLE,
          Item: updatedSection
        }));
        console.log(`✅ Section ${section.sectionName}: ${count} students`);
      }
    }

    console.log('\n🎉 Multi-section test data created successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Course: ${testCourse.title} (${testCourse.classCode})`);
    console.log(`   Sections: ${testSections.length}`);
    console.log(`   Total Students: ${testStudents.length}`);
    
    console.log('\n🔑 Class Codes for Testing:');
    testSections.forEach(section => {
      console.log(`   ${section.sectionName}: ${section.classCode}`);
    });

    console.log('\n👥 Student Distribution:');
    testSections.forEach(section => {
      const studentsInSection = testStudents.filter(s => s.sectionId === section.sectionId);
      console.log(`   ${section.sectionName}: ${studentsInSection.length} students`);
      studentsInSection.forEach(student => {
        console.log(`     - ${student.firstName} ${student.lastName} (${student.email})`);
      });
    });

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  }
}

// Run the test
createTestData().catch(console.error);
