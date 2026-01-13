#!/usr/bin/env node

/**
 * Test upcoming assignments for real users
 */

const testUserAssignments = async () => {
  console.log('🧪 Testing User Assignments...');
  console.log('');
  
  // Test with demo user and a few other potential users
  const testUsers = [
    'demo@email.com',
    'dwilson1919@gmail.com',
    'user_1759509796189_2pl9tx55x', // Giovanni Heras from the logs
    'user_1759515959978_nweehwntw', // Jaring Nhkum from the logs
    'user_1759493055727_30yq3s8tu'  // Aaliyah Taylor from the logs
  ];
  
  for (const userId of testUsers) {
    console.log(`👤 Testing user: ${userId}`);
    
    try {
      const response = await fetch(`http://localhost:3000/api/student/assignments?userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   📊 Total assignments: ${data.assignments?.length || 0}`);
        
        if (data.assignments && data.assignments.length > 0) {
          // Filter upcoming assignments (next 2 weeks)
          const now = new Date();
          const twoWeeksFromNow = new Date();
          twoWeeksFromNow.setDate(now.getDate() + 14);
          
          const upcomingAssignments = data.assignments.filter(assignment => {
            const dueDate = new Date(assignment.dueDate);
            return dueDate >= now && dueDate <= twoWeeksFromNow && !assignment.isSubmitted;
          });
          
          console.log(`   🎯 Upcoming (next 2 weeks): ${upcomingAssignments.length}`);
          
          if (upcomingAssignments.length > 0) {
            console.log('   📋 Upcoming assignments:');
            upcomingAssignments
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
              .slice(0, 3)
              .forEach(assignment => {
                const dueDate = new Date(assignment.dueDate);
                const diffTime = dueDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                console.log(`      • ${assignment.title}`);
                console.log(`        Due: ${dueDate.toLocaleDateString()} (${diffDays} days)`);
                console.log(`        Course: ${assignment.courseCode}`);
                console.log(`        Submitted: ${assignment.isSubmitted ? 'Yes' : 'No'}`);
              });
          }
          
          // Also check all assignments to see date ranges
          const allDueDates = data.assignments.map(a => new Date(a.dueDate));
          const earliestDue = new Date(Math.min(...allDueDates));
          const latestDue = new Date(Math.max(...allDueDates));
          
          console.log(`   📅 Assignment date range: ${earliestDue.toLocaleDateString()} to ${latestDue.toLocaleDateString()}`);
        }
        
      } else {
        console.log(`   ❌ API failed: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('🔍 Analysis:');
  console.log('- Testing multiple users to find one with upcoming assignments');
  console.log('- Looking for assignments due in next 14 days');
  console.log('- Excluding already submitted assignments');
  console.log('- Widget should show 0-5 assignments based on this data');
};

// Run the test
testUserAssignments().catch(console.error);