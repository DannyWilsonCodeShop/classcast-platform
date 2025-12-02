const fetch = require('node-fetch');

// Test the grade export endpoint
async function testGradeExport() {
  try {
    console.log('🧪 Testing Grade Export Endpoint...\n');
    
    // You'll need to provide actual IDs from your system
    const courseId = process.argv[2];
    const assignmentId = process.argv[3];
    
    if (!courseId || !assignmentId) {
      console.log('❌ Please provide courseId and assignmentId');
      console.log('Usage: node test-grade-export.js <courseId> <assignmentId>');
      console.log('\nTo find IDs:');
      console.log('1. Go to instructor portal');
      console.log('2. Open an assignment grades page');
      console.log('3. Check the URL: /instructor/courses/[courseId]/assignments/[assignmentId]/grades');
      return;
    }
    
    console.log('Course ID:', courseId);
    console.log('Assignment ID:', assignmentId);
    console.log('='.repeat(60));
    
    const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const endpoint = `${API_URL}/api/instructor/courses/${courseId}/assignments/${assignmentId}/export-grades`;
    
    console.log('\n📡 Calling:', endpoint);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n📊 Response Status:', response.status, response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('\n📦 Response Data:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ Export successful!');
      console.log('   Assignment:', data.data.assignment.title);
      console.log('   Students:', data.data.grades.length);
      console.log('\n   Sample grades:');
      data.data.grades.slice(0, 3).forEach((grade, i) => {
        console.log(`   ${i + 1}. ${grade.studentName} - ${grade.grade || 'Not graded'}`);
      });
    } else {
      console.log('\n❌ Export failed');
      console.log('   Error:', data.error);
    }
    
  } catch (error) {
    console.error('\n❌ Error testing export:', error);
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
  }
}

testGradeExport();
