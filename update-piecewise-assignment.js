#!/usr/bin/env node

/**
 * Update Graphing Piecewise Functions Assignment
 * 
 * This script:
 * 1. Updates the assignment title to "Graphing Piecewise Functions"
 * 2. Adds a resource: "Student problem sheet" with Google Sheets link
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(client);

const ASSIGNMENTS_TABLE = process.env.ASSIGNMENTS_TABLE || 'classcast-assignments';

async function updatePiecewiseAssignment() {
  console.log('🔍 Searching for Graphing Piecewise Functions Assignment...');
  
  try {
    // First, find the assignment by searching for "piecewise" in the title
    const scanParams = {
      TableName: ASSIGNMENTS_TABLE,
      FilterExpression: 'contains(#title, :searchTerm)',
      ExpressionAttributeNames: {
        '#title': 'title'
      },
      ExpressionAttributeValues: {
        ':searchTerm': 'Piecewise'
      }
    };

    const scanResult = await docClient.send(new ScanCommand(scanParams));
    
    if (!scanResult.Items || scanResult.Items.length === 0) {
      console.log('❌ No assignments found containing "Piecewise" in the title');
      console.log('📋 Searching for assignments with similar names...');
      
      // Try broader search
      const broadScanParams = {
        TableName: ASSIGNMENTS_TABLE,
        FilterExpression: 'contains(#title, :graphing) OR contains(#title, :piece)',
        ExpressionAttributeNames: {
          '#title': 'title'
        },
        ExpressionAttributeValues: {
          ':graphing': 'Graphing',
          ':piece': 'piece'
        }
      };
      
      const broadResult = await docClient.send(new ScanCommand(broadScanParams));
      
      if (broadResult.Items && broadResult.Items.length > 0) {
        console.log('📋 Found similar assignments:');
        broadResult.Items.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.title} (ID: ${item.assignmentId})`);
        });
      }
      
      return;
    }

    console.log(`✅ Found ${scanResult.Items.length} assignment(s) with "Piecewise" in title:`);
    
    for (const assignment of scanResult.Items) {
      console.log(`\n📝 Processing Assignment: ${assignment.title}`);
      console.log(`   ID: ${assignment.assignmentId}`);
      console.log(`   Current Title: ${assignment.title}`);
      
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

      let updateExpression = 'SET #title = :newTitle, #updatedAt = :updatedAt';
      let expressionAttributeNames = {
        '#title': 'title',
        '#updatedAt': 'updatedAt'
      };
      let expressionAttributeValues = {
        ':newTitle': 'Graphing Piecewise Functions',
        ':updatedAt': new Date().toISOString()
      };

      if (!resourceExists) {
        console.log('   ➕ Adding new resource: Student problem sheet');
        const updatedResources = [...existingResources, newResource];
        
        updateExpression += ', #resources = :resources';
        expressionAttributeNames['#resources'] = 'resources';
        expressionAttributeValues[':resources'] = updatedResources;
      } else {
        console.log('   ℹ️  Resource already exists, skipping resource addition');
      }

      // Update the assignment
      const updateParams = {
        TableName: ASSIGNMENTS_TABLE,
        Key: {
          assignmentId: assignment.assignmentId
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      };

      console.log('📤 Updating assignment...');
      const updateResult = await docClient.send(new UpdateCommand(updateParams));
      
      console.log('✅ Assignment updated successfully!');
      console.log(`   New Title: ${updateResult.Attributes.title}`);
      console.log(`   Resources Count: ${updateResult.Attributes.resources?.length || 0}`);
      
      if (updateResult.Attributes.resources) {
        console.log('   📚 Resources:');
        updateResult.Attributes.resources.forEach((resource, index) => {
          console.log(`      ${index + 1}. ${resource.title} (${resource.type})`);
          if (resource.url) {
            console.log(`         URL: ${resource.url}`);
          }
        });
      }
    }

  } catch (error) {
    console.error('❌ Error updating assignment:', error);
    
    if (error.name === 'ResourceNotFoundException') {
      console.log('💡 The assignments table might not exist or the table name might be incorrect.');
      console.log(`   Current table name: ${ASSIGNMENTS_TABLE}`);
    } else if (error.name === 'ValidationException') {
      console.log('💡 There might be an issue with the update expression or attribute names.');
    }
  }
}

// Helper function to list all assignments (for debugging)
async function listAllAssignments() {
  console.log('\n🔍 Listing all assignments for reference...');
  
  try {
    const scanParams = {
      TableName: ASSIGNMENTS_TABLE,
      ProjectionExpression: 'assignmentId, title, #status',
      ExpressionAttributeNames: {
        '#status': 'status'
      }
    };

    const result = await docClient.send(new ScanCommand(scanParams));
    
    if (result.Items && result.Items.length > 0) {
      console.log(`📋 Found ${result.Items.length} assignments:`);
      result.Items.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.title} (${item.assignmentId}) - Status: ${item.status || 'unknown'}`);
      });
    } else {
      console.log('📋 No assignments found in the table');
    }
  } catch (error) {
    console.error('❌ Error listing assignments:', error);
  }
}

// Main execution
async function main() {
  console.log('🎯 Updating Graphing Piecewise Functions Assignment');
  console.log('==================================================');
  console.log(`📊 Table: ${ASSIGNMENTS_TABLE}`);
  console.log(`🌍 Region: ${process.env.AWS_REGION || 'us-east-1'}`);
  console.log('');

  // Check if we should list all assignments first
  if (process.argv.includes('--list')) {
    await listAllAssignments();
    return;
  }

  await updatePiecewiseAssignment();
  
  console.log('\n✅ Update process completed!');
  console.log('\n💡 To list all assignments, run: node update-piecewise-assignment.js --list');
}

// Run the script
main().catch(console.error);