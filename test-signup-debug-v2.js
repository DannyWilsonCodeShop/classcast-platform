const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({ region: 'us-east-1' });
const cognito = new AWS.CognitoIdentityServiceProvider();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const USER_POOL_ID = 'us-east-1_uK50qBrap';
const CLIENT_ID = '7tbaq74itv3gdda1bt25iqafvh';
const USERS_TABLE = 'classcast-users';

async function testSignup() {
  try {
    console.log('🔍 Testing signup process...\n');

    // Test data
    const testUser = {
      username: `test-${Date.now()}@example.com`,
      email: `test-${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      password: 'TestPassword123!',
      role: 'student',
      studentId: 'TEST001'
    };

    console.log('📝 Test user data:', testUser);

    // Step 1: Create user in Cognito
    console.log('\n1️⃣ Creating user in Cognito...');
    const signupParams = {
      ClientId: CLIENT_ID,
      Username: testUser.username,
      Password: testUser.password,
      UserAttributes: [
        { Name: 'email', Value: testUser.email },
        { Name: 'given_name', Value: testUser.firstName },
        { Name: 'family_name', Value: testUser.lastName },
        { Name: 'custom:role', Value: testUser.role },
        { Name: 'custom:studentId', Value: testUser.studentId }
      ]
    };

    const signupResult = await cognito.signUp(signupParams).promise();
    console.log('✅ Cognito signup successful:', signupResult.UserSub);

    // Step 2: Check if user exists in DynamoDB (should not exist yet)
    console.log('\n2️⃣ Checking DynamoDB for user profile...');
    try {
      const getParams = {
        TableName: USERS_TABLE,
        Key: { userId: signupResult.UserSub }
      };
      const dbResult = await dynamodb.get(getParams).promise();
      
      if (dbResult.Item) {
        console.log('❌ User already exists in DynamoDB (unexpected):', dbResult.Item);
      } else {
        console.log('✅ User not in DynamoDB yet (expected - needs email confirmation)');
      }
    } catch (error) {
      console.log('✅ User not in DynamoDB (expected):', error.message);
    }

    // Step 3: Manually trigger post-confirmation Lambda by creating user profile
    console.log('\n3️⃣ Manually creating user profile in DynamoDB...');
    try {
      const userProfile = {
        userId: signupResult.UserSub,
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        role: testUser.role,
        studentId: testUser.studentId,
        status: 'active',
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        preferences: {
          notifications: {
            email: true,
            push: false
          },
          theme: 'light',
          language: 'en'
        }
      };

      await dynamodb.put({
        TableName: USERS_TABLE,
        Item: userProfile
      }).promise();

      console.log('✅ User profile created in DynamoDB');
    } catch (error) {
      console.log('❌ Failed to create user profile:', error.message);
    }

    // Step 4: Verify user profile was created
    console.log('\n4️⃣ Verifying user profile in DynamoDB...');
    try {
      const getParams = {
        TableName: USERS_TABLE,
        Key: { userId: signupResult.UserSub }
      };
      const dbResult = await dynamodb.get(getParams).promise();
      
      if (dbResult.Item) {
        console.log('✅ User profile found in DynamoDB:', {
          userId: dbResult.Item.userId,
          email: dbResult.Item.email,
          firstName: dbResult.Item.firstName,
          lastName: dbResult.Item.lastName,
          role: dbResult.Item.role,
          studentId: dbResult.Item.studentId,
          status: dbResult.Item.status
        });
      } else {
        console.log('❌ User profile not found in DynamoDB');
      }
    } catch (error) {
      console.log('❌ Error checking DynamoDB:', error.message);
    }

    // Step 5: List all users in DynamoDB (fix the role keyword issue)
    console.log('\n5️⃣ Current users in DynamoDB:');
    try {
      const scanParams = {
        TableName: USERS_TABLE,
        ProjectionExpression: 'userId, email, firstName, lastName, #role, createdAt',
        ExpressionAttributeNames: {
          '#role': 'role'  // Use expression attribute name for reserved keyword
        }
      };
      const scanResult = await dynamodb.scan(scanParams).promise();
      console.log(`Found ${scanResult.Items.length} users:`);
      scanResult.Items.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`);
      });
    } catch (error) {
      console.log('❌ Error scanning DynamoDB:', error.message);
    }

    // Cleanup: Delete test user from Cognito
    console.log('\n🧹 Cleaning up test user...');
    try {
      await cognito.adminDeleteUser({
        UserPoolId: USER_POOL_ID,
        Username: testUser.username
      }).promise();
      console.log('✅ Test user deleted from Cognito');
    } catch (error) {
      console.log('⚠️ Could not delete test user:', error.message);
    }

    // Cleanup: Delete test user from DynamoDB
    try {
      await dynamodb.delete({
        TableName: USERS_TABLE,
        Key: { userId: signupResult.UserSub }
      }).promise();
      console.log('✅ Test user deleted from DynamoDB');
    } catch (error) {
      console.log('⚠️ Could not delete test user from DynamoDB:', error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSignup();
