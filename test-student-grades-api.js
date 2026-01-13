#!/usr/bin/env node

/**
 * Test Student Grades API
 * Tests the new student grades API endpoint
 */

const https = require('https');

// Configuration
const BASE_URL = 'class-cast.com';
const TEST_USER_ID = 'user_1759495882086_wwr31f5id'; // Madison Smith - has submissions

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.end();
  });
}

async function testGradesAPI() {
  console.log('🧪 Testing Student Grades API\n');
  
  const options = {
    hostname: BASE_URL,
    port: 443,
    path: `/api/student/grades?userId=${TEST_USER_ID}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  try {
    console.log(`📡 Making request to: https://${BASE_URL}${options.path}`);
    
    const response = await makeRequest(options);
    console.log(`📊 Response status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      const responseData = JSON.parse(response.data);
      
      if (responseData.success) {
        console.log('✅ API call successful!');
        console.log(`📈 Statistics:`, responseData.stats);
        console.log(`📝 Number of grades: ${responseData.grades.length}`);
        
        if (responseData.grades.length > 0) {
          console.log('\n📋 Sample grades:');
          responseData.grades.slice(0, 3).forEach((grade, index) => {
            console.log(`  ${index + 1}. ${grade.assignmentTitle}`);
            console.log(`     Course: ${grade.courseName} (${grade.courseCode})`);
            console.log(`     Grade: ${grade.status === 'pending' ? 'Pending' : `${grade.grade}/${grade.maxPoints} (${Math.round((grade.grade / grade.maxPoints) * 100)}%)`}`);
            console.log(`     Status: ${grade.status}`);
            if (grade.feedback) {
              console.log(`     Feedback: ${grade.feedback.substring(0, 50)}...`);
            }
            console.log('');
          });
        } else {
          console.log('📝 No grades found for this user');
        }
      } else {
        console.log('❌ API returned error:', responseData.error);
      }
    } else {
      console.log('❌ HTTP error:', response.statusCode);
      console.log('Response:', response.data);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

async function testMultipleUsers() {
  console.log('\n🔄 Testing multiple users...\n');
  
  const testUsers = [
    'user_1759495882086_wwr31f5id', // Madison Smith
    'user_1759504746084_1nx4mm9gm', // Zola Rae Tyler
    'user_1761487642460_4k4nm4xva', // Dagmawi Wolde
    'user_1765414766381_kfdblsgwc'  // Graciela Vargas
  ];
  
  for (const userId of testUsers) {
    console.log(`👤 Testing user: ${userId}`);
    
    const options = {
      hostname: BASE_URL,
      port: 443,
      path: `/api/student/grades?userId=${userId}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    try {
      const response = await makeRequest(options);
      
      if (response.statusCode === 200) {
        const responseData = JSON.parse(response.data);
        
        if (responseData.success) {
          console.log(`   ✅ ${responseData.grades.length} grades, avg: ${responseData.stats.averageGrade}%`);
        } else {
          console.log(`   ❌ Error: ${responseData.error}`);
        }
      } else {
        console.log(`   ❌ HTTP ${response.statusCode}`);
      }
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function runTests() {
  await testGradesAPI();
  await testMultipleUsers();
  
  console.log('\n✅ All tests completed!');
}

runTests().catch(console.error);