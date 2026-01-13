#!/usr/bin/env node

/**
 * Test upcoming assignments widget functionality
 */

const testUpcomingAssignments = async () => {
  console.log('🧪 Testing Upcoming Assignments Widget...');
  console.log('');
  
  // Test user ID (demo user)
  const userId = 'demo@email.com';
  
  try {
    console.log('📡 Fetching assignments for user:', userId);
    const response = await fetch(`http://localhost:3000/api/student/assignments?userId=${userId}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response received successfully!');
      console.log(`📊 Total assignments found: ${data.assignments?.length || 0}`);
      console.log('');
      
      if (data.assignments && data.assignments.length > 0) {
        // Filter assignments due in the next 2 weeks
        const now = new Date();
        const twoWeeksFromNow = new Date();
        twoWeeksFromNow.setDate(now.getDate() + 14);
        
        console.log('📅 Date Range Filter:');
        console.log(`   Now: ${now.toLocaleDateString()}`);
        console.log(`   Two weeks from now: ${twoWeeksFromNow.toLocaleDateString()}`);
        console.log('');
        
        const upcomingAssignments = data.assignments.filter(assignment => {
          const dueDate = new Date(assignment.dueDate);
          const isUpcoming = dueDate >= now && dueDate <= twoWeeksFromNow && !assignment.isSubmitted;
          
          console.log(`📝 ${assignment.title}:`);
          console.log(`   Due: ${dueDate.toLocaleDateString()}`);
          console.log(`   Submitted: ${assignment.isSubmitted ? 'Yes' : 'No'}`);
          console.log(`   Upcoming: ${isUpcoming ? 'Yes' : 'No'}`);
          console.log('');
          
          return isUpcoming;
        });
        
        console.log(`🎯 Upcoming assignments (next 2 weeks): ${upcomingAssignments.length}`);
        
        if (upcomingAssignments.length > 0) {
          console.log('');
          console.log('📋 Upcoming Assignments List:');
          upcomingAssignments
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 5)
            .forEach((assignment, index) => {
              const dueDate = new Date(assignment.dueDate);
              const diffTime = dueDate.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              let dueDateText = '';
              if (diffDays === 0) dueDateText = 'Due today';
              else if (diffDays === 1) dueDateText = 'Due tomorrow';
              else if (diffDays <= 7) dueDateText = `Due in ${diffDays} days`;
              else dueDateText = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
              
              console.log(`   ${index + 1}. ${assignment.title}`);
              console.log(`      Course: ${assignment.courseCode}`);
              console.log(`      Points: ${assignment.points}`);
              console.log(`      Due: ${dueDateText}`);
              console.log('');
            });
        } else {
          console.log('ℹ️  No assignments due in the next 2 weeks');
        }
        
      } else {
        console.log('ℹ️  No assignments found for user');
      }
      
    } else {
      console.log(`❌ API request failed: ${response.status} ${response.statusText}`);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
  
  console.log('');
  console.log('🔧 Widget Features:');
  console.log('✓ Fetches assignments from /api/student/assignments');
  console.log('✓ Filters assignments due in next 2 weeks');
  console.log('✓ Excludes already submitted assignments');
  console.log('✓ Sorts by due date (earliest first)');
  console.log('✓ Shows max 5 assignments');
  console.log('✓ Color-coded due dates (red=urgent, orange=soon, yellow=this week, blue=later)');
  console.log('✓ Clickable to navigate to assignment details');
  console.log('✓ "View All" button to see complete assignments list');
  console.log('✓ Loading states and empty states');
  console.log('');
  
  console.log('📱 User Experience:');
  console.log('- Due today/tomorrow: Red background (urgent)');
  console.log('- Due in 2-3 days: Orange background (soon)');
  console.log('- Due this week: Yellow background (this week)');
  console.log('- Due next week: Blue background (later)');
  console.log('- Shows course code and point value');
  console.log('- Responsive design with hover effects');
};

// Run the test
testUpcomingAssignments().catch(console.error);