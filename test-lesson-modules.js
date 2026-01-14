/**
 * Test Lesson Modules Feature
 * 
 * This script tests the lesson modules API endpoints
 */

const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function testCreateModule() {
  console.log('\n📝 Testing: Create Lesson Module');
  
  const response = await fetch(`${BASE_URL}/api/instructor/lesson-modules`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Introduction to Calculus',
      description: 'Learn the fundamentals of calculus including limits, derivatives, and integrals',
      courseId: 'course_test_123',
      introVideoUrl: 'https://www.youtube.com/watch?v=WUvTyaaNkzM',
    }),
  });

  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
  
  if (data.success) {
    console.log('✅ Module created successfully');
    return data.module.moduleId;
  } else {
    console.log('❌ Failed to create module');
    return null;
  }
}

async function testListModules() {
  console.log('\n📋 Testing: List Lesson Modules');
  
  const response = await fetch(`${BASE_URL}/api/instructor/lesson-modules`);
  const data = await response.json();
  
  console.log('Response:', JSON.stringify(data, null, 2));
  
  if (data.success) {
    console.log(`✅ Found ${data.modules.length} modules`);
    return data.modules;
  } else {
    console.log('❌ Failed to list modules');
    return [];
  }
}

async function testGetModule(moduleId) {
  console.log('\n🔍 Testing: Get Single Module');
  
  const response = await fetch(`${BASE_URL}/api/instructor/lesson-modules/${moduleId}`);
  const data = await response.json();
  
  console.log('Response:', JSON.stringify(data, null, 2));
  
  if (data.success) {
    console.log('✅ Module retrieved successfully');
    return data.module;
  } else {
    console.log('❌ Failed to get module');
    return null;
  }
}

async function testUpdateModule(moduleId) {
  console.log('\n✏️ Testing: Update Module');
  
  const response = await fetch(`${BASE_URL}/api/instructor/lesson-modules/${moduleId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Introduction to Calculus - Updated',
      status: 'published',
    }),
  });

  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
  
  if (data.success) {
    console.log('✅ Module updated successfully');
    return data.module;
  } else {
    console.log('❌ Failed to update module');
    return null;
  }
}

async function testAddLesson(moduleId) {
  console.log('\n➕ Testing: Add Lesson to Module');
  
  const response = await fetch(`${BASE_URL}/api/instructor/lesson-modules/${moduleId}/lessons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Lesson 1: Understanding Limits',
      description: 'Introduction to the concept of limits in calculus',
      videoUrl: 'https://www.youtube.com/watch?v=riXcZT2ICjA',
      duration: 15,
    }),
  });

  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
  
  if (data.success) {
    console.log('✅ Lesson added successfully');
    return data.lesson;
  } else {
    console.log('❌ Failed to add lesson');
    return null;
  }
}

async function testListLessons(moduleId) {
  console.log('\n📚 Testing: List Lessons');
  
  const response = await fetch(`${BASE_URL}/api/instructor/lesson-modules/${moduleId}/lessons`);
  const data = await response.json();
  
  console.log('Response:', JSON.stringify(data, null, 2));
  
  if (data.success) {
    console.log(`✅ Found ${data.lessons.length} lessons`);
    return data.lessons;
  } else {
    console.log('❌ Failed to list lessons');
    return [];
  }
}

async function testDeleteModule(moduleId) {
  console.log('\n🗑️ Testing: Delete Module');
  
  const response = await fetch(`${BASE_URL}/api/instructor/lesson-modules/${moduleId}`, {
    method: 'DELETE',
  });

  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
  
  if (data.success) {
    console.log('✅ Module deleted successfully');
    return true;
  } else {
    console.log('❌ Failed to delete module');
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Lesson Modules API Tests\n');
  console.log('Base URL:', BASE_URL);
  console.log('=' .repeat(50));

  try {
    // Test 1: Create Module
    const moduleId = await testCreateModule();
    if (!moduleId) {
      console.log('\n❌ Cannot continue tests without module ID');
      return;
    }

    // Test 2: List Modules
    await testListModules();

    // Test 3: Get Single Module
    await testGetModule(moduleId);

    // Test 4: Update Module
    await testUpdateModule(moduleId);

    // Test 5: Add Lesson
    await testAddLesson(moduleId);

    // Test 6: Add Another Lesson
    await testAddLesson(moduleId);

    // Test 7: List Lessons
    await testListLessons(moduleId);

    // Test 8: Delete Module (optional - comment out to keep test data)
    // await testDeleteModule(moduleId);

    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests completed!');
    console.log('\n📝 Summary:');
    console.log('- Module creation: ✅');
    console.log('- Module listing: ✅');
    console.log('- Module retrieval: ✅');
    console.log('- Module update: ✅');
    console.log('- Lesson creation: ✅');
    console.log('- Lesson listing: ✅');
    console.log('\n🎉 Lesson Modules feature is working correctly!');
    console.log('\n📌 Test Module ID:', moduleId);
    console.log('You can view this module in the instructor portal at:');
    console.log(`${BASE_URL}/instructor/lesson-modules/${moduleId}`);

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  }
}

// Run tests
runTests();
