// Debug script to test the bulk grading API
// Run this with: node debug-bulk-grading.js

const testBulkGradingAPI = async () => {
  const baseUrl = 'https://class-cast.com';
  
  // Test parameters from the URL you provided
  const params = {
    assignment: 'assignment_1762810231627_vqgj30vea',
    course: 'course_1760635875079_bcjiq11ho',
    submission: 'submission_1763085729707_simnnc83o'
  };
  
  console.log('🔍 Testing bulk grading API with parameters:', params);
  
  // Test 1: Call with assignment ID only
  try {
    const url1 = `${baseUrl}/api/instructor/video-submissions?assignmentId=${params.assignment}`;
    console.log('\n📡 Testing API call 1:', url1);
    
    const response1 = await fetch(url1, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Note: In production, this would need proper authentication
    });
    
    const data1 = await response1.json();
    console.log('📊 Response 1 status:', response1.status);
    console.log('📊 Response 1 data:', JSON.stringify(data1, null, 2));
  } catch (error) {
    console.error('❌ Error in test 1:', error);
  }
  
  // Test 2: Call with course ID only
  try {
    const url2 = `${baseUrl}/api/instructor/video-submissions?courseId=${params.course}`;
    console.log('\n📡 Testing API call 2:', url2);
    
    const response2 = await fetch(url2, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data2 = await response2.json();
    console.log('📊 Response 2 status:', response2.status);
    console.log('📊 Response 2 data:', JSON.stringify(data2, null, 2));
  } catch (error) {
    console.error('❌ Error in test 2:', error);
  }
  
  // Test 3: Call with both assignment and course
  try {
    const url3 = `${baseUrl}/api/instructor/video-submissions?assignmentId=${params.assignment}&courseId=${params.course}`;
    console.log('\n📡 Testing API call 3:', url3);
    
    const response3 = await fetch(url3, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data3 = await response3.json();
    console.log('📊 Response 3 status:', response3.status);
    console.log('📊 Response 3 data:', JSON.stringify(data3, null, 2));
  } catch (error) {
    console.error('❌ Error in test 3:', error);
  }
};

// Run the test
testBulkGradingAPI().catch(console.error);