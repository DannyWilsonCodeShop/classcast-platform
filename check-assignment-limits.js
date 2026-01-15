#!/usr/bin/env node

/**
 * Check Assignment File Size Limits via API
 * This script checks the current maxFileSize settings for assignments
 */

async function checkAssignmentLimits() {
  console.log('🔍 Checking assignment file size limits via API...');
  
  try {
    // Check if we can access the API
    const response = await fetch('http://localhost:3000/api/assignments', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      console.log('❌ API not accessible. Make sure the development server is running:');
      console.log('   npm run dev');
      return;
    }

    const data = await response.json();
    
    if (data.success && data.assignments) {
      const assignments = data.assignments;
      console.log(`📊 Found ${assignments.length} assignments`);
      
      // Analyze file size limits
      const sizeGroups = {};
      assignments.forEach(assignment => {
        const size = assignment.maxFileSize || 0;
        const sizeMB = Math.round(size / (1024 * 1024));
        const key = sizeMB === 0 ? 'No limit set' : `${sizeMB}MB`;
        
        if (!sizeGroups[key]) {
          sizeGroups[key] = [];
        }
        sizeGroups[key].push(assignment);
      });

      console.log('\n📊 File size limit distribution:');
      Object.entries(sizeGroups).forEach(([limit, assignments]) => {
        console.log(`${limit}: ${assignments.length} assignments`);
        
        // Show examples with problematic limits
        if (limit === '100MB' || limit === '50MB') {
          console.log(`   ⚠️  These assignments may block large video uploads!`);
          assignments.slice(0, 3).forEach(a => {
            console.log(`      - "${a.title}" (${a.assignmentId})`);
          });
          if (assignments.length > 3) {
            console.log(`      - (+${assignments.length - 3} more)`);
          }
        }
      });

      // Check for problematic assignments
      const problematicAssignments = assignments.filter(a => {
        const sizeMB = (a.maxFileSize || 0) / (1024 * 1024);
        return sizeMB > 0 && sizeMB < 500; // Less than 500MB is problematic for video
      });

      if (problematicAssignments.length > 0) {
        console.log(`\n⚠️  Found ${problematicAssignments.length} assignments with small file size limits that may prevent video uploads!`);
        console.log('\n🔧 To fix this issue:');
        console.log('1. Update the assignment creation system to allow larger file sizes');
        console.log('2. Update existing assignments to have 2GB limits');
        console.log('3. Test video uploads with files between 100MB and 1GB');
      } else {
        console.log('\n✅ All assignments have appropriate file size limits for video uploads');
      }

    } else {
      console.log('❌ Could not retrieve assignments from API');
    }

  } catch (error) {
    console.error('❌ Error checking assignment limits:', error.message);
    console.log('\n💡 Make sure:');
    console.log('1. The development server is running (npm run dev)');
    console.log('2. The API is accessible at http://localhost:3000');
  }
}

// Check if server is running
async function checkServerStatus() {
  try {
    const response = await fetch('http://localhost:3000/api/health');
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log('📋 Assignment File Size Limit Checker\n');
  
  const serverRunning = await checkServerStatus();
  if (!serverRunning) {
    console.log('❌ Development server is not running');
    console.log('Please start it with: npm run dev');
    console.log('Then run this script again.');
    return;
  }

  await checkAssignmentLimits();
}

if (require.main === module) {
  main().catch(console.error);
}