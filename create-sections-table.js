#!/usr/bin/env node

/**
 * Create Sections Table
 * Creates the classcast-sections DynamoDB table
 */

const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });

async function createSectionsTable() {
  console.log('🏗️ Creating classcast-sections table...');
  
  try {
    const command = new CreateTableCommand({
      TableName: 'classcast-sections',
      AttributeDefinitions: [
        {
          AttributeName: 'sectionId',
          AttributeType: 'S'
        },
        {
          AttributeName: 'courseId',
          AttributeType: 'S'
        },
        {
          AttributeName: 'instructorId',
          AttributeType: 'S'
        }
      ],
      KeySchema: [
        {
          AttributeName: 'sectionId',
          KeyType: 'HASH'
        }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'courseId-index',
          KeySchema: [
            {
              AttributeName: 'courseId',
              KeyType: 'HASH'
            }
          ],
          Projection: {
            ProjectionType: 'ALL'
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        },
        {
          IndexName: 'instructorId-index',
          KeySchema: [
            {
              AttributeName: 'instructorId',
              KeyType: 'HASH'
            }
          ],
          Projection: {
            ProjectionType: 'ALL'
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    });

    const result = await client.send(command);
    console.log('✅ Table created successfully!');
    console.log('Table status:', result.TableDescription.TableStatus);
    
    // Wait for table to be active
    console.log('⏳ Waiting for table to become active...');
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    
    console.log('🎉 Sections table is ready!');
    
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('✅ Table already exists!');
    } else {
      console.error('❌ Error creating table:', error.message);
      throw error;
    }
  }
}

// Run the creation
createSectionsTable().catch(console.error);
