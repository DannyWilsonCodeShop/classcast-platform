#!/usr/bin/env node

/**
 * Test Enrollment Functionality
 * Tests the class code enrollment process
 */

const fetch = require('node-fetch');

async function testEnrollment() {
  console.log('🧪 Testing enrollment functionality...\n');
  
  const testCases = [
    {
      classCode: 'CS101A',
      userId: 'test_user_001',
      description: 'Test enrollment in CS101A (Introduction to Computer Science)'
    },
    {
      classCode: 'MATH201A',
      userId: 'test_user_002',
      description: 'Test enrollment in MATH201A (Calculus I)'
    },
    {
      classCode: 'INVALID',
      userId: 'test_user_003',
      description: 'Test enrollment with invalid class code'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📝 ${testCase.description}`);
    console.log(`   Class Code: ${testCase.classCode}`);
    console.log(`   User ID: ${testCase.userId}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/student/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classCode: testCase.classCode,
          userId: testCase.userId
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log(`   ✅ Success: ${data.message || 'Enrollment successful'}`);
        if (data.course) {
          console.log(`   📚 Course: ${data.course.title}`);
          console.log(`   👨‍🏫 Instructor: ${data.course.instructorName}`);
        }
      } else {
        console.log(`   ❌ Error: ${data.error}`);
      }
      
    } catch (error) {
      console.log(`   💥 Exception: ${error.message}`);
    }
  }
  
  console.log('\n🏁 Enrollment testing completed!');
}

// Run the test
testEnrollment().catch(console.error);
