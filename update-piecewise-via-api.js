#!/usr/bin/env node

/**
 * Update Graphing Piecewise Functions Assignment via API
 * 
 * This script uses your existing API endpoints to:
 * 1. Find the assignment containing "Piecewise" 
 * 2. Update the title to "Graphing Piecewise Functions"
 * 3. Add the "Student problem sheet" resource
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function updatePiecewiseAssignment() {
  console.log('🔍 Searching for Piecewise Functions Assignment...');
  
  try {
    // First, get all assignments to find the piecewise one
    console.log('📡 Fetching all assignments...');
    const response = await fetch(`${BASE_URL}/api/assignments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch assignments: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.assignments) {
      throw new Error('Invalid response format from assignments API');
    }

    console.log(`📋 Found ${data.assignments.length} total assignments`);

    // Find assignments containing "piecewise" (case insensitive)
    const piecewiseAssignments = data.assignments.filter(assignment => 
      assignment.title && assignment.title.toLowerCase().includes('piecewise')
    );

    if (piecewiseAssignments.length === 0) {
      console.log('❌ No assignments found containing "piecewise" in the title');
      console.log('\n📋 Available assignments:');
      data.assignments.slice(0, 10).forEach((assignment, index) => {
        console.log(`   ${index + 1}. ${assignment.title} (${assignment.assignmentId})`);
      });
      if (data.assignments.length > 10) {
        console.log(`   ... and ${data.assignments.length - 10} more`);
      }
      return;
    }

    console.log(`✅ Found ${piecewiseAssignments.length} piecewise assignment(s):`);
    
    for (const assignment of piecewiseAssignments) {
      console.log(`\n📝 Processing: ${assignment.title}`);
      console.log(`   ID: ${assignment.assignmentId}`);
      
      // Prepare the updated assignment data
      const updatedAssignment = {
        ...assignment,
        title: 'Graphing Piecewise Functions',
        updatedAt: new Date().toISOString()
      };

      // Prepare the new resource
      const newResource = {
        resourceId: `resource-${Date.now()}`,
        title: 'Student problem sheet',
        type: 'link',
        url: 'https://docs.google.com/spreadsheets/d/1ZTkpE6zv2zMwQAhqKUcNtpZkM71gFleBm8Vcx8Zvsi0/edit?usp=sharing',
        description: 'Google Sheets document with practice problems for graphing piecewise functions',
        addedAt: new Date().toISOString(),
        isRequired: false,
        order: (assignment.resources?.length || 0) + 1
      };

      // Get existing resources or initialize empty array
      const existingResources = assignment.resources || [];
      
      // Check if this resource already exists
      const resourceExists = existingResources.some(resource => 
        resource.title === 'Student problem sheet' || 
        resource.url === newResource.url
      );

      if (!resourceExists) {
        console.log('   ➕ Adding new resource: Student problem sheet');
        updatedAssignment.resources = [...existingResources, newResource];
      } else {
        console.log('   ℹ️  Resource already exists, only updating title');
        updatedAssignment.resources = existingResources;
      }

      // Update the assignment via API
      console.log('📤 Updating assignment via API...');
      const updateResponse = await fetch(`${BASE_URL}/api/assignments/${assignment.assignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedAssignment)
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(`Failed to update assignment: ${updateResponse.status} ${updateResponse.statusText}\n${errorText}`);
      }

      const updateResult = await updateResponse.json();
      
      if (updateResult.success) {
        console.log('✅ Assignment updated successfully!');
        console.log(`   New Title: ${updateResult.assignment?.title || updatedAssignment.title}`);
        console.log(`   Resources Count: ${updatedAssignment.resources?.length || 0}`);
        
        if (updatedAssignment.resources && updatedAssignment.resources.length > 0) {
          console.log('   📚 Resources:');
          updatedAssignment.resources.forEach((resource, index) => {
            console.log(`      ${index + 1}. ${resource.title} (${resource.type})`);
            if (resource.url) {
              console.log(`         URL: ${resource.url.substring(0, 60)}...`);
            }
          });
        }
      } else {
        console.log('❌ Update failed:', updateResult.error || 'Unknown error');
      }
    }

  } catch (error) {
    console.error('❌ Error updating assignment:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Make sure your development server is running on http://localhost:3000');
      console.log('   Run: npm run dev');
    } else if (error.message.includes('404')) {
      console.log('💡 The API endpoint might not exist. Check your API routes.');
    } else if (error.message.includes('401') || error.message.includes('403')) {
      console.log('💡 Authentication might be required. This script may need to be run from an authenticated context.');
    }
  }
}

// Helper function to list assignments
async function listAssignments() {
  console.log('📋 Listing all assignments...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/assignments`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch assignments: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.assignments) {
      console.log(`📋 Found ${data.assignments.length} assignments:`);
      data.assignments.forEach((assignment, index) => {
        console.log(`   ${index + 1}. ${assignment.title} (${assignment.assignmentId})`);
        if (assignment.resources && assignment.resources.length > 0) {
          console.log(`      📚 ${assignment.resources.length} resource(s)`);
        }
      });
    } else {
      console.log('❌ No assignments found or invalid response');
    }
  } catch (error) {
    console.error('❌ Error listing assignments:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🎯 Updating Graphing Piecewise Functions Assignment (via API)');
  console.log('============================================================');
  console.log(`🌐 API Base URL: ${BASE_URL}`);
  console.log('');

  // Check command line arguments
  if (process.argv.includes('--list')) {
    await listAssignments();
    return;
  }

  await updatePiecewiseAssignment();
  
  console.log('\n✅ Update process completed!');
  console.log('\n💡 To list all assignments, run: node update-piecewise-via-api.js --list');
}

// Run the script
main().catch(console.error);