#!/usr/bin/env node

const AWS = require('aws-sdk');

AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

const dynamodb = new AWS.DynamoDB();

async function createPasswordResetTable() {
  console.log('📋 Creating password-reset-tokens table...');

  const params = {
    TableName: 'password-reset-tokens',
    KeySchema: [
      {
        AttributeName: 'token',
        KeyType: 'HASH'
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'token',
        AttributeType: 'S'
      }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    TimeToLiveSpecification: {
      AttributeName: 'expiresAt',
      Enabled: true
    }
  };

  try {
    const result = await dynamodb.createTable(params).promise();
    console.log('✅ Table created successfully');
    console.log('   Table ARN:', result.TableDescription.TableArn);
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log('✅ Table already exists');
    } else {
      console.error('❌ Error creating table:', error);
      throw error;
    }
  }
}

async function main() {
  try {
    await createPasswordResetTable();
    console.log('\n🎯 Password reset table setup complete!');
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();