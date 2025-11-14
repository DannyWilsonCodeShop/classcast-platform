// Test script to check video submissions API
const testVideoSubmissionsAPI = async () => {
  console.log('Testing video submissions API...');
  
  const courseId = 'course_1759712904515_rnhq82nyx';
  const sectionId = '429dfbf1-40cb-43bb-8d64-4749ba26d12e';
  
  try {
    // Test 1: Get submissions for course only
    console.log('\n=== Test 1: Course submissions ===');
    const courseUrl = `http://localhost:3000/api/instructor/video-submissions?courseId=${courseId}`;
    console.log('URL:', courseUrl);
    
    const courseResponse = await fetch(courseUrl);
    console.log('Status:', courseResponse.status);
    
    if (courseResponse.ok) {
      const courseData = await courseResponse.json();
      console.log('Response:', JSON.stringify(courseData, null, 2));
    } else {
      const errorText = await courseResponse.text();
      console.log('Error:', errorText);
    }
    
    // Test 2: Get submissions for course and section
    console.log('\n=== Test 2: Section submissions ===');
    const sectionUrl = `http://localhost:3000/api/instructor/video-submissions?courseId=${courseId}&sectionId=${sectionId}`;
    console.log('URL:', sectionUrl);
    
    const sectionResponse = await fetch(sectionUrl);
    console.log('Status:', sectionResponse.status);
    
    if (sectionResponse.ok) {
      const sectionData = await sectionResponse.json();
      console.log('Response:', JSON.stringify(sectionData, null, 2));
    } else {
      const errorText = await sectionResponse.text();
      console.log('Error:', errorText);
    }
    
    // Test 3: Get all submissions
    console.log('\n=== Test 3: All submissions ===');
    const allUrl = `http://localhost:3000/api/instructor/video-submissions`;
    console.log('URL:', allUrl);
    
    const allResponse = await fetch(allUrl);
    console.log('Status:', allResponse.status);
    
    if (allResponse.ok) {
      const allData = await allResponse.json();
      console.log('Response:', JSON.stringify(allData, null, 2));
    } else {
      const errorText = await allResponse.text();
      console.log('Error:', errorText);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

testVideoSubmissionsAPI();
