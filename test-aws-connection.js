#!/usr/bin/env node

/**
 * AWS Backend Connection Test for Both Portals
 * Tests all AWS services and their connectivity to both instructor and student portals
 */

const AWS = require('aws-sdk');

// Configuration
const config = {
  region: 'us-east-1',
  cognito: {
    userPoolId: 'us-east-1_uK50qBrap',
    clientId: '7tbaq74itv3gdda1bt25iqafvh',
    identityPoolId: 'us-east-1:463470937777',
  },
  apiGateway: {
    url: 'https://785t4qadp8.execute-api.us-east-1.amazonaws.com/prod',
  },
  dynamodb: {
    tables: {
      users: 'classcast-users',
      assignments: 'classcast-assignments',
      submissions: 'classcast-submissions',
      courses: 'classcast-courses',
      contentModeration: 'classcast-content-moderation',
    },
  },
  s3: {
    buckets: {
      videos: 'classcast-videos-463470937777-us-east-1',
      assets: 'cdk-hnb659fds-assets-463470937777-us-east-1',
    },
  },
};

// Initialize AWS services
const cognito = new AWS.CognitoIdentityServiceProvider({ region: config.region });
const dynamodb = new AWS.DynamoDB({ region: config.region });
const s3 = new AWS.S3({ region: config.region });

console.log('🔍 AWS Backend Connection Test for Both Portals');
console.log('================================================');
console.log('');

// Test results
const results = {
  cognito: { status: 'pending', details: {} },
  apiGateway: { status: 'pending', details: {} },
  dynamodb: { status: 'pending', details: {} },
  s3: { status: 'pending', details: {} },
  overall: { status: 'pending', portals: { instructor: false, student: false } },
};

// Test Cognito
async function testCognito() {
  console.log('📋 Testing Cognito User Pool...');
  try {
    const userPool = await cognito.describeUserPool({ UserPoolId: config.cognito.userPoolId }).promise();
    const userPoolClient = await cognito.describeUserPoolClient({
      UserPoolId: config.cognito.userPoolId,
      ClientId: config.cognito.clientId,
    }).promise();

    results.cognito = {
      status: 'success',
      details: {
        poolName: userPool.UserPool.Name,
        poolStatus: userPool.UserPool.Status,
        usersCount: userPool.UserPool.EstimatedNumberOfUsers,
        clientName: userPoolClient.UserPoolClient.ClientName,
        clientStatus: userPoolClient.UserPoolClient.Status,
      },
    };

    console.log('✅ Cognito User Pool Connected');
    console.log(`   - Pool Name: ${userPool.UserPool.Name}`);
    console.log(`   - Status: ${userPool.UserPool.Status}`);
    console.log(`   - Users Count: ${userPool.UserPool.EstimatedNumberOfUsers}`);
    console.log(`   - Client Name: ${userPoolClient.UserPoolClient.ClientName}`);
  } catch (error) {
    results.cognito = { status: 'error', details: { error: error.message } };
    console.log('❌ Cognito Error:', error.message);
  }
  console.log('');
}

// Test API Gateway
async function testAPIGateway() {
  console.log('🌐 Testing API Gateway...');
  try {
    const response = await fetch(`${config.apiGateway.url}/`);
    const data = await response.json();

    if (response.ok) {
      results.apiGateway = {
        status: 'success',
        details: {
          url: config.apiGateway.url,
          status: response.status,
          message: data.message,
          version: data.version,
        },
      };
      console.log('✅ API Gateway Connected');
      console.log(`   - URL: ${config.apiGateway.url}`);
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Message: ${data.message}`);
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    results.apiGateway = { status: 'error', details: { error: error.message } };
    console.log('❌ API Gateway Error:', error.message);
  }
  console.log('');
}

// Test DynamoDB
async function testDynamoDB() {
  console.log('🗄️ Testing DynamoDB...');
  try {
    const tables = await dynamodb.listTables().promise();
    const tableDetails = [];

    // Check each required table
    for (const tableName of Object.values(config.dynamodb.tables)) {
      try {
        const table = await dynamodb.describeTable({ TableName: tableName }).promise();
        tableDetails.push({
          name: tableName,
          status: table.Table.TableStatus,
          itemCount: table.Table.ItemCount || 0,
        });
      } catch (error) {
        tableDetails.push({
          name: tableName,
          status: 'NOT_FOUND',
          itemCount: 0,
        });
      }
    }

    results.dynamodb = {
      status: 'success',
      details: {
        totalTables: tables.TableNames.length,
        tables: tableDetails,
      },
    };

    console.log('✅ DynamoDB Connected');
    console.log(`   - Total Tables: ${tables.TableNames.length}`);
    console.log('   - Required Tables:');
    tableDetails.forEach(table => {
      const status = table.status === 'ACTIVE' ? '✅' : '❌';
      console.log(`     ${status} ${table.name}: ${table.status} (${table.itemCount} items)`);
    });
  } catch (error) {
    results.dynamodb = { status: 'error', details: { error: error.message } };
    console.log('❌ DynamoDB Error:', error.message);
  }
  console.log('');
}

// Test S3
async function testS3() {
  console.log('📦 Testing S3...');
  try {
    const buckets = await s3.listBuckets().promise();
    const bucketDetails = [];

    // Check each required bucket
    for (const [key, bucketName] of Object.entries(config.s3.buckets)) {
      try {
        const bucket = await s3.headBucket({ Bucket: bucketName }).promise();
        bucketDetails.push({
          name: bucketName,
          type: key,
          status: 'EXISTS',
        });
      } catch (error) {
        bucketDetails.push({
          name: bucketName,
          type: key,
          status: 'NOT_FOUND',
        });
      }
    }

    results.s3 = {
      status: 'success',
      details: {
        totalBuckets: buckets.Buckets.length,
        buckets: bucketDetails,
      },
    };

    console.log('✅ S3 Connected');
    console.log(`   - Total Buckets: ${buckets.Buckets.length}`);
    console.log('   - Required Buckets:');
    bucketDetails.forEach(bucket => {
      const status = bucket.status === 'EXISTS' ? '✅' : '❌';
      console.log(`     ${status} ${bucket.name} (${bucket.type})`);
    });
  } catch (error) {
    results.s3 = { status: 'error', details: { error: error.message } };
    console.log('❌ S3 Error:', error.message);
  }
  console.log('');
}

// Test Portal Connectivity
async function testPortalConnectivity() {
  console.log('🎯 Testing Portal Connectivity...');
  
  const instructorTests = [
    { name: 'Instructor Dashboard', url: 'https://main.d166bugwfgjggz.amplifyapp.com/instructor/dashboard' },
    { name: 'Instructor Courses', url: 'https://main.d166bugwfgjggz.amplifyapp.com/instructor/courses' },
    { name: 'Instructor Grading', url: 'https://main.d166bugwfgjggz.amplifyapp.com/instructor/grading/bulk' },
  ];

  const studentTests = [
    { name: 'Student Dashboard', url: 'https://main.d166bugwfgjggz.amplifyapp.com/student/dashboard' },
    { name: 'Student Courses', url: 'https://main.d166bugwfgjggz.amplifyapp.com/student/courses' },
    { name: 'Student Assignments', url: 'https://main.d166bugwfgjggz.amplifyapp.com/student/assignments' },
  ];

  let instructorSuccess = 0;
  let studentSuccess = 0;

  console.log('   Instructor Portal Tests:');
  for (const test of instructorTests) {
    try {
      const response = await fetch(test.url);
      if (response.ok) {
        console.log(`     ✅ ${test.name}`);
        instructorSuccess++;
      } else {
        console.log(`     ❌ ${test.name} (${response.status})`);
      }
    } catch (error) {
      console.log(`     ❌ ${test.name} (${error.message})`);
    }
  }

  console.log('   Student Portal Tests:');
  for (const test of studentTests) {
    try {
      const response = await fetch(test.url);
      if (response.ok) {
        console.log(`     ✅ ${test.name}`);
        studentSuccess++;
      } else {
        console.log(`     ❌ ${test.name} (${response.status})`);
      }
    } catch (error) {
      console.log(`     ❌ ${test.name} (${error.message})`);
    }
  }

  results.overall.portals.instructor = instructorSuccess === instructorTests.length;
  results.overall.portals.student = studentSuccess === studentTests.length;
  results.overall.status = results.overall.portals.instructor && results.overall.portals.student ? 'success' : 'partial';

  console.log('');
}

// Generate Summary Report
function generateSummaryReport() {
  console.log('📊 CONNECTION SUMMARY REPORT');
  console.log('============================');
  console.log('');

  // Service Status
  console.log('🔧 AWS Services Status:');
  Object.entries(results).forEach(([service, result]) => {
    if (service === 'overall') return;
    const status = result.status === 'success' ? '✅' : '❌';
    console.log(`   ${status} ${service.toUpperCase()}: ${result.status.toUpperCase()}`);
  });

  console.log('');
  console.log('🎯 Portal Connectivity:');
  console.log(`   ${results.overall.portals.instructor ? '✅' : '❌'} Instructor Portal: ${results.overall.portals.instructor ? 'CONNECTED' : 'ISSUES'}`);
  console.log(`   ${results.overall.portals.student ? '✅' : '❌'} Student Portal: ${results.overall.portals.student ? 'CONNECTED' : 'ISSUES'}`);

  console.log('');
  console.log('📈 Overall Status:');
  const allServicesWorking = Object.values(results).every(result => 
    result.status === 'success' || result.status === 'partial'
  );
  console.log(`   ${allServicesWorking ? '✅' : '❌'} Backend Connection: ${allServicesWorking ? 'HEALTHY' : 'NEEDS ATTENTION'}`);

  if (!allServicesWorking) {
    console.log('');
    console.log('🔧 Recommended Actions:');
    if (results.cognito.status !== 'success') {
      console.log('   - Check Cognito User Pool configuration');
    }
    if (results.apiGateway.status !== 'success') {
      console.log('   - Verify API Gateway deployment and endpoints');
    }
    if (results.dynamodb.status !== 'success') {
      console.log('   - Ensure DynamoDB tables are created and accessible');
    }
    if (results.s3.status !== 'success') {
      console.log('   - Verify S3 bucket permissions and configuration');
    }
  }

  console.log('');
  console.log('🎉 Test completed!');
}

// Main execution
async function main() {
  try {
    await testCognito();
    await testAPIGateway();
    await testDynamoDB();
    await testS3();
    await testPortalConnectivity();
    generateSummaryReport();
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run the test
main();
