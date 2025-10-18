const { DynamoDBClient, ScanCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoDBClient = new DynamoDBClient({ region: 'us-east-1' });

const CRISTO_REY_LOGO = '/logos/cristo-rey-atlanta.png';

async function addCristoReyLogoToAllUsers() {
  console.log('🏫 Adding Cristo Rey logo to all existing users...\n');

  try {
    // Scan all users from classcast-users table
    const scanCommand = new ScanCommand({
      TableName: 'classcast-users'
    });

    const result = await dynamoDBClient.send(scanCommand);
    
    if (!result.Items || result.Items.length === 0) {
      console.log('❌ No users found in the database');
      return;
    }

    console.log(`📊 Found ${result.Items.length} users to update\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const item of result.Items) {
      const user = unmarshall(item);
      
      // Check if user already has the Cristo Rey logo
      if (user.schoolLogo === CRISTO_REY_LOGO) {
        console.log(`⏭️  Skipping ${user.firstName} ${user.lastName} (${user.email}) - already has Cristo Rey logo`);
        skipCount++;
        continue;
      }

      try {
        // Update user with Cristo Rey logo
        const updateCommand = new UpdateItemCommand({
          TableName: 'classcast-users',
          Key: marshall({
            userId: user.userId
          }),
          UpdateExpression: 'SET schoolLogo = :logo, updatedAt = :updatedAt',
          ExpressionAttributeValues: marshall({
            ':logo': CRISTO_REY_LOGO,
            ':updatedAt': new Date().toISOString()
          })
        });

        await dynamoDBClient.send(updateCommand);
        
        console.log(`✅ Updated ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to update ${user.email}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully updated: ${successCount} users`);
    console.log(`⏭️  Skipped (already had logo): ${skipCount} users`);
    console.log(`❌ Failed: ${errorCount} users`);
    console.log(`📦 Total users processed: ${result.Items.length}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error scanning users:', error);
    throw error;
  }
}

// Run the script
addCristoReyLogoToAllUsers()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

