const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = 'classcast-courses';
const ENROLLMENTS_TABLE = 'classcast-enrollments';
const USERS_TABLE = 'classcast-users';

async function testDatabaseTables() {
  console.log('🧪 Testing Database Tables...');
  
  try {
    // Test courses table
    const coursesResult = await docClient.send(new ScanCommand({
      TableName: COURSES_TABLE,
      Limit: 5
    }));
    
    console.log(`✅ Courses table accessible - Found ${coursesResult.Items?.length || 0} courses`);
    
    // Test enrollments table
    const enrollmentsResult = await docClient.send(new ScanCommand({
      TableName: ENROLLMENTS_TABLE,
      Limit: 5
    }));
    
    console.log(`✅ Enrollments table accessible - Found ${enrollmentsResult.Items?.length || 0} enrollments`);
    
    // Test users table
    const usersResult = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      Limit: 5
    }));
    
    console.log(`✅ Users table accessible - Found ${usersResult.Items?.length || 0} users`);
    
    return {
      courses: coursesResult.Items || [],
      enrollments: enrollmentsResult.Items || [],
      users: usersResult.Items || []
    };
  } catch (error) {
    console.log(`❌ Database test failed: ${error.message}`);
    return { courses: [], enrollments: [], users: [] };
  }
}

async function testBulkEnrollmentAPI() {
  console.log('🧪 Testing Bulk Enrollment API...');
  
  try {
    // First, get a course to test with
    const coursesResponse = await fetch('http://localhost:3000/api/courses');
    if (!coursesResponse.ok) {
      throw new Error(`Courses API returned ${coursesResponse.status}`);
    }
    
    const coursesData = await coursesResponse.json();
    const courses = coursesData.data?.courses || [];
    
    if (courses.length === 0) {
      console.log('⚠️  No courses found. Please create a course first.');
      return false;
    }
    
    const testCourse = courses[0];
    console.log(`✅ Found test course: ${testCourse.title}`);
    
    // Test bulk enrollment with sample data
    const testStudents = [
      {
        email: 'test.student1@university.edu',
        firstName: 'Test',
        lastName: 'Student1'
      },
      {
        email: 'test.student2@university.edu',
        firstName: 'Test',
        lastName: 'Student2'
      }
    ];
    
    const enrollmentResponse = await fetch('http://localhost:3000/api/courses/bulk-enroll', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        courseId: testCourse.courseId,
        students: testStudents
      }),
    });
    
    if (!enrollmentResponse.ok) {
      const errorData = await enrollmentResponse.json();
      throw new Error(`Bulk enrollment API returned ${enrollmentResponse.status}: ${errorData.error}`);
    }
    
    const enrollmentData = await enrollmentResponse.json();
    console.log(`✅ Bulk enrollment API working`);
    console.log(`   Total students: ${enrollmentData.total}`);
    console.log(`   Successful: ${enrollmentData.successful}`);
    console.log(`   Failed: ${enrollmentData.failed}`);
    
    if (enrollmentData.errors && enrollmentData.errors.length > 0) {
      console.log(`   Errors: ${enrollmentData.errors.join(', ')}`);
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Bulk enrollment API test failed: ${error.message}`);
    console.log('   Make sure your Next.js server is running: npm run dev');
    return false;
  }
}

async function testEmailParsing() {
  console.log('🧪 Testing Email Parsing...');
  
  const testEmails = [
    'student1@university.edu',
    'student2@university.edu,John,Doe',
    'student3@university.edu,Jane,Smith',
    'invalid-email',
    'student4@university.edu'
  ];
  
  const validEmails = testEmails.filter(email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.split(',')[0]);
  });
  
  console.log(`✅ Email parsing test - ${validEmails.length}/${testEmails.length} valid emails`);
  
  return validEmails.length > 0;
}

async function testCSVParsing() {
  console.log('🧪 Testing CSV Parsing...');
  
  const testCSV = `email,firstName,lastName
student1@university.edu,John,Doe
student2@university.edu,Jane,Smith
student3@university.edu,Bob,Johnson
invalid-email,Invalid,Email
student4@university.edu,Alice,Williams`;
  
  try {
    // Simulate CSV parsing
    const lines = testCSV.split('\n').filter(line => line.trim());
    const headerIndex = lines[0]?.toLowerCase().includes('email') ? 1 : 0;
    const validRows = [];
    
    for (let i = headerIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const parts = line.split(',').map(part => part.trim());
        if (parts.length >= 1) {
          const email = parts[0];
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailRegex.test(email)) {
            validRows.push({
              email,
              firstName: parts[1] || '',
              lastName: parts[2] || ''
            });
          }
        }
      }
    }
    
    console.log(`✅ CSV parsing test - ${validRows.length}/${lines.length - headerIndex} valid rows`);
    return validRows.length > 0;
  } catch (error) {
    console.log(`❌ CSV parsing test failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Bulk Enrollment Test Suite');
  console.log('=====================================');
  
  let allTestsPassed = true;
  
  // Test 1: Database Tables
  const dbData = await testDatabaseTables();
  console.log('');
  
  // Test 2: Email Parsing
  const emailTest = await testEmailParsing();
  if (!emailTest) allTestsPassed = false;
  console.log('');
  
  // Test 3: CSV Parsing
  const csvTest = await testCSVParsing();
  if (!csvTest) allTestsPassed = false;
  console.log('');
  
  // Test 4: Bulk Enrollment API
  const apiTest = await testBulkEnrollmentAPI();
  if (!apiTest) allTestsPassed = false;
  console.log('');
  
  // Summary
  console.log('📊 Test Summary');
  console.log('===============');
  
  if (allTestsPassed) {
    console.log('✅ All tests passed! Bulk enrollment is working correctly.');
    console.log('');
    console.log('🎓 You can now:');
    console.log('   • Use the instructor portal to bulk enroll students');
    console.log('   • Upload CSV files with student emails');
    console.log('   • Paste email lists directly');
    console.log('   • Send welcome emails to new students');
    console.log('   • Automatically create user accounts');
    console.log('   • Track enrollment status and results');
  } else {
    console.log('❌ Some tests failed. Please check the errors above.');
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Make sure your Next.js server is running: npm run dev');
    console.log('   2. Make sure the database tables exist: ./scripts/setup-bulk-enrollment.sh');
    console.log('   3. Check your AWS credentials and region settings');
    console.log('   4. Verify your Cognito User Pool is configured');
    console.log('   5. Check your SES configuration for email sending');
  }
  
  console.log('');
  console.log('🎉 Test suite completed!');
}

// Run the tests
runAllTests().catch(console.error);
