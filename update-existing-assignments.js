#!/usr/bin/env node

/**
 * Update Existing Assignments with Small File Size Limits
 * 
 * This script updates existing assignments that have small maxFileSize limits
 * to support larger video uploads (up to 2GB).
 */

async function updateExistingAssignments() {
  console.log('🔧 Updating existing assignments with small file size limits...');
  
  try {
    // First, get all assignments via API
    const response = await fetch('http://localhost:3000/api/assignments', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Could not fetch assignments from API. Make sure the server is running.');
    }

    const data = await response.json();
    
    if (!data.success || !data.assignments) {
      throw new Error('Invalid response from assignments API');
    }

    const assignments = data.assignments;
    console.log(`📊 Found ${assignments.length} total assignments`);

    // Find assignments with small file size limits (less than 500MB)
    const problematicAssignments = assignments.filter(assignment => {
      const maxFileSize = assignment.maxFileSize || 0;
      const sizeMB = maxFileSize / (1024 * 1024);
      return sizeMB > 0 && sizeMB < 500; // Less than 500MB is problematic for video
    });

    console.log(`⚠️  Found ${problematicAssignments.length} assignments with small file size limits`);

    if (problematicAssignments.length === 0) {
      console.log('✅ No assignments need updating');
      return;
    }

    // Show what we found
    console.log('\n📋 Assignments that will be updated:');
    problematicAssignments.forEach(assignment => {
      const currentSizeMB = Math.round((assignment.maxFileSize || 0) / (1024 * 1024));
      console.log(`  - "${assignment.title}" (${assignment.assignmentId}): ${currentSizeMB}MB → 2GB`);
    });

    console.log('\n🔧 Updating assignments...');
    
    let updated = 0;
    let errors = 0;

    for (const assignment of problematicAssignments) {
      try {
        const updateResponse = await fetch(`http://localhost:3000/api/assignments/${assignment.assignmentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...assignment,
            maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
            updatedAt: new Date().toISOString()
          })
        });

        if (updateResponse.ok) {
          console.log(`  ✅ Updated "${assignment.title}"`);
          updated++;
        } else {
          const errorData = await updateResponse.json();
          console.log(`  ❌ Failed to update "${assignment.title}": ${errorData.error || 'Unknown error'}`);
          errors++;
        }
      } catch (error) {
        console.log(`  ❌ Failed to update "${assignment.title}": ${error.message}`);
        errors++;
      }
    }

    console.log('\n📊 Update Summary:');
    console.log(`✅ Successfully updated: ${updated} assignments`);
    console.log(`❌ Failed to update: ${errors} assignments`);
    
    if (updated > 0) {
      console.log('\n🎉 Students should now be able to upload larger video files!');
      console.log('💡 Test with a video file between 100MB and 1GB to verify the fix.');
    }

  } catch (error) {
    console.error('❌ Error updating assignments:', error.message);
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
  console.log('📋 Assignment File Size Limit Updater\n');
  
  const serverRunning = await checkServerStatus();
  if (!serverRunning) {
    console.log('❌ Development server is not running');
    console.log('Please start it with: npm run dev');
    console.log('Then run this script again.');
    return;
  }

  await updateExistingAssignments();
}

if (require.main === module) {
  main().catch(console.error);
}