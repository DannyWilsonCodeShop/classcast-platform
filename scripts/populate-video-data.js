const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const VIDEOS_TABLE = 'classcast-videos';
const USERS_TABLE = 'classcast-users';

// Sample video data
const sampleVideos = [
  {
    id: 'video_1',
    title: 'React Hooks Explained',
    description: 'A comprehensive tutorial on React hooks for beginners. Learn useState, useEffect, and custom hooks.',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    thumbnail: 'https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=React+Hooks',
    duration: 120,
    courseId: 'cs-101',
    userId: 'student-1',
    courseName: 'CS 101 - Introduction to Computer Science',
    stats: {
      views: 45,
      likes: 12,
      comments: 3,
      responses: 1,
      averageRating: 4.2,
      totalRatings: 5
    },
    createdAt: new Date('2024-12-10T10:30:00Z').toISOString(),
    updatedAt: new Date('2024-12-10T10:30:00Z').toISOString()
  },
  {
    id: 'video_2',
    title: 'Database Design Best Practices',
    description: 'Learn the fundamentals of database design including normalization, relationships, and indexing.',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
    thumbnail: 'https://via.placeholder.com/300x200/059669/FFFFFF?text=Database+Design',
    duration: 180,
    courseId: 'cs-201',
    userId: 'student-2',
    courseName: 'CS 201 - Data Structures and Algorithms',
    stats: {
      views: 78,
      likes: 18,
      comments: 7,
      responses: 2,
      averageRating: 4.5,
      totalRatings: 8
    },
    createdAt: new Date('2024-12-09T14:20:00Z').toISOString(),
    updatedAt: new Date('2024-12-09T14:20:00Z').toISOString()
  },
  {
    id: 'video_3',
    title: 'JavaScript Async/Await Patterns',
    description: 'Master asynchronous programming in JavaScript with async/await, promises, and error handling.',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_3mb.mp4',
    thumbnail: 'https://via.placeholder.com/300x200/DC2626/FFFFFF?text=Async+Await',
    duration: 95,
    courseId: 'cs-102',
    userId: 'student-3',
    courseName: 'CS 102 - Web Development',
    stats: {
      views: 32,
      likes: 8,
      comments: 2,
      responses: 0,
      averageRating: 4.0,
      totalRatings: 3
    },
    createdAt: new Date('2024-12-08T16:45:00Z').toISOString(),
    updatedAt: new Date('2024-12-08T16:45:00Z').toISOString()
  },
  {
    id: 'video_4',
    title: 'CSS Grid Layout Tutorial',
    description: 'Complete guide to CSS Grid layout system with practical examples and responsive design.',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_4mb.mp4',
    thumbnail: 'https://via.placeholder.com/300x200/7C3AED/FFFFFF?text=CSS+Grid',
    duration: 150,
    courseId: 'cs-102',
    userId: 'student-4',
    courseName: 'CS 102 - Web Development',
    stats: {
      views: 56,
      likes: 15,
      comments: 4,
      responses: 1,
      averageRating: 4.3,
      totalRatings: 6
    },
    createdAt: new Date('2024-12-07T11:15:00Z').toISOString(),
    updatedAt: new Date('2024-12-07T11:15:00Z').toISOString()
  },
  {
    id: 'video_5',
    title: 'Python Data Structures',
    description: 'Understanding lists, dictionaries, sets, and tuples in Python with practical examples.',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
    thumbnail: 'https://via.placeholder.com/300x200/EA580C/FFFFFF?text=Python+Data',
    duration: 200,
    courseId: 'cs-101',
    userId: 'student-5',
    courseName: 'CS 101 - Introduction to Computer Science',
    stats: {
      views: 89,
      likes: 22,
      comments: 9,
      responses: 3,
      averageRating: 4.6,
      totalRatings: 10
    },
    createdAt: new Date('2024-12-06T09:30:00Z').toISOString(),
    updatedAt: new Date('2024-12-06T09:30:00Z').toISOString()
  }
];

// Sample user data for video authors
const sampleUsers = [
  {
    userId: 'student-1',
    email: 'sarah.johnson@university.edu',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'student',
    status: 'active',
    avatar: 'https://via.placeholder.com/40x40/4F46E5/FFFFFF?text=SJ',
    createdAt: new Date('2024-09-01T00:00:00Z').toISOString(),
    lastLoginAt: new Date('2024-12-10T08:00:00Z').toISOString()
  },
  {
    userId: 'student-2',
    email: 'mike.chen@university.edu',
    firstName: 'Mike',
    lastName: 'Chen',
    role: 'student',
    status: 'active',
    avatar: 'https://via.placeholder.com/40x40/059669/FFFFFF?text=MC',
    createdAt: new Date('2024-09-01T00:00:00Z').toISOString(),
    lastLoginAt: new Date('2024-12-09T14:00:00Z').toISOString()
  },
  {
    userId: 'student-3',
    email: 'emily.davis@university.edu',
    firstName: 'Emily',
    lastName: 'Davis',
    role: 'student',
    status: 'active',
    avatar: 'https://via.placeholder.com/40x40/DC2626/FFFFFF?text=ED',
    createdAt: new Date('2024-09-01T00:00:00Z').toISOString(),
    lastLoginAt: new Date('2024-12-08T16:00:00Z').toISOString()
  },
  {
    userId: 'student-4',
    email: 'alex.wilson@university.edu',
    firstName: 'Alex',
    lastName: 'Wilson',
    role: 'student',
    status: 'active',
    avatar: 'https://via.placeholder.com/40x40/7C3AED/FFFFFF?text=AW',
    createdAt: new Date('2024-09-01T00:00:00Z').toISOString(),
    lastLoginAt: new Date('2024-12-07T11:00:00Z').toISOString()
  },
  {
    userId: 'student-5',
    email: 'jordan.brown@university.edu',
    firstName: 'Jordan',
    lastName: 'Brown',
    role: 'student',
    status: 'active',
    avatar: 'https://via.placeholder.com/40x40/EA580C/FFFFFF?text=JB',
    createdAt: new Date('2024-09-01T00:00:00Z').toISOString(),
    lastLoginAt: new Date('2024-12-06T09:00:00Z').toISOString()
  }
];

async function populateUsers() {
  console.log('Populating users...');
  
  for (const user of sampleUsers) {
    try {
      await docClient.send(new PutCommand({
        TableName: USERS_TABLE,
        Item: user
      }));
      console.log(`✓ Added user: ${user.firstName} ${user.lastName}`);
    } catch (error) {
      console.error(`✗ Error adding user ${user.userId}:`, error);
    }
  }
}

async function populateVideos() {
  console.log('Populating videos...');
  
  for (const video of sampleVideos) {
    try {
      await docClient.send(new PutCommand({
        TableName: VIDEOS_TABLE,
        Item: video
      }));
      console.log(`✓ Added video: ${video.title}`);
    } catch (error) {
      console.error(`✗ Error adding video ${video.id}:`, error);
    }
  }
}

async function checkTablesExist() {
  try {
    // Check if videos table exists
    await docClient.send(new ScanCommand({
      TableName: VIDEOS_TABLE,
      Limit: 1
    }));
    console.log('✓ Videos table exists');
  } catch (error) {
    console.error('✗ Videos table does not exist or is not accessible:', error.message);
    return false;
  }

  try {
    // Check if users table exists
    await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      Limit: 1
    }));
    console.log('✓ Users table exists');
  } catch (error) {
    console.error('✗ Users table does not exist or is not accessible:', error.message);
    return false;
  }

  return true;
}

async function main() {
  console.log('🚀 Starting video data population...');
  
  // Check if tables exist
  const tablesExist = await checkTablesExist();
  if (!tablesExist) {
    console.log('❌ Required tables do not exist. Please deploy the CDK stack first.');
    process.exit(1);
  }

  // Populate users first
  await populateUsers();
  
  // Then populate videos
  await populateVideos();
  
  console.log('✅ Video data population completed!');
  console.log('\n📊 Summary:');
  console.log(`- ${sampleUsers.length} users added`);
  console.log(`- ${sampleVideos.length} videos added`);
  console.log('\n🎬 You can now test the video interaction features in the student dashboard!');
}

main().catch(console.error);
