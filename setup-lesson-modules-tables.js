/**
 * Setup DynamoDB Tables for Lesson Modules Feature
 * 
 * This script creates the necessary tables for the lesson modules system:
 * - LessonModules: Stores module information
 * - LessonVideos: Stores lesson videos with questions
 * - PracticeTests: Stores standalone practice tests
 * - StudentModuleProgress: Tracks student progress
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  DynamoDBDocumentClient, 
  CreateTableCommand,
  DescribeTableCommand 
} = require('@aws-sdk/lib-dynamodb');

require('dotenv').config({ path: '.env.local' });

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

async function tableExists(tableName) {
  try {
    await docClient.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      return false;
    }
    throw error;
  }
}

async function createLessonModulesTable() {
  const tableName = 'LessonModules';
  
  if (await tableExists(tableName)) {
    console.log(`✅ Table ${tableName} already exists`);
    return;
  }

  const command = new CreateTableCommand({
    TableName: tableName,
    KeySchema: [
      { AttributeName: 'moduleId', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'moduleId', AttributeType: 'S' },
      { AttributeName: 'courseId', AttributeType: 'S' },
      { AttributeName: 'instructorId', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'CourseIdIndex',
        KeySchema: [
          { AttributeName: 'courseId', KeyType: 'HASH' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
      {
        IndexName: 'InstructorIdIndex',
        KeySchema: [
          { AttributeName: 'instructorId', KeyType: 'HASH' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  });

  await docClient.send(command);
  console.log(`✅ Created table: ${tableName}`);
}

async function createLessonVideosTable() {
  const tableName = 'LessonVideos';
  
  if (await tableExists(tableName)) {
    console.log(`✅ Table ${tableName} already exists`);
    return;
  }

  const command = new CreateTableCommand({
    TableName: tableName,
    KeySchema: [
      { AttributeName: 'moduleId', KeyType: 'HASH' },
      { AttributeName: 'lessonId', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'moduleId', AttributeType: 'S' },
      { AttributeName: 'lessonId', AttributeType: 'S' },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  });

  await docClient.send(command);
  console.log(`✅ Created table: ${tableName}`);
}

async function createPracticeTestsTable() {
  const tableName = 'PracticeTests';
  
  if (await tableExists(tableName)) {
    console.log(`✅ Table ${tableName} already exists`);
    return;
  }

  const command = new CreateTableCommand({
    TableName: tableName,
    KeySchema: [
      { AttributeName: 'moduleId', KeyType: 'HASH' },
      { AttributeName: 'testId', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'moduleId', AttributeType: 'S' },
      { AttributeName: 'testId', AttributeType: 'S' },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  });

  await docClient.send(command);
  console.log(`✅ Created table: ${tableName}`);
}

async function createStudentModuleProgressTable() {
  const tableName = 'StudentModuleProgress';
  
  if (await tableExists(tableName)) {
    console.log(`✅ Table ${tableName} already exists`);
    return;
  }

  const command = new CreateTableCommand({
    TableName: tableName,
    KeySchema: [
      { AttributeName: 'studentId', KeyType: 'HASH' },
      { AttributeName: 'progressId', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'studentId', AttributeType: 'S' },
      { AttributeName: 'progressId', AttributeType: 'S' },
      { AttributeName: 'moduleId', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'ModuleIdIndex',
        KeySchema: [
          { AttributeName: 'moduleId', KeyType: 'HASH' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  });

  await docClient.send(command);
  console.log(`✅ Created table: ${tableName}`);
}

async function main() {
  console.log('🚀 Setting up Lesson Modules tables...\n');

  try {
    await createLessonModulesTable();
    await createLessonVideosTable();
    await createPracticeTestsTable();
    await createStudentModuleProgressTable();

    console.log('\n✅ All tables created successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Add these environment variables to .env.local:');
    console.log('   DYNAMODB_LESSON_MODULES_TABLE=LessonModules');
    console.log('   DYNAMODB_LESSON_VIDEOS_TABLE=LessonVideos');
    console.log('   DYNAMODB_PRACTICE_TESTS_TABLE=PracticeTests');
    console.log('   DYNAMODB_STUDENT_MODULE_PROGRESS_TABLE=StudentModuleProgress');
    console.log('\n2. Wait a few minutes for tables to become active');
    console.log('3. Start creating lesson modules in the instructor portal!');
  } catch (error) {
    console.error('❌ Error setting up tables:', error);
    process.exit(1);
  }
}

main();
