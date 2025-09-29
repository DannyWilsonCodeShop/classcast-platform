const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function addVideoSampleData() {
  console.log('🎬 Adding sample video data...');

  // Sample videos
  const videos = [
    {
      id: 'video_001',
      title: 'Introduction to React Hooks',
      description: 'Learn the basics of React hooks and how to use them in your components.',
      videoUrl: 'https://example.com/videos/react-hooks-intro.mp4',
      thumbnail: 'https://example.com/thumbnails/react-hooks.jpg',
      duration: 1200, // 20 minutes
      courseId: 'cs-101',
      userId: '84c8b438-c061-700f-1051-0aecb612e646',
      courseName: 'Computer Science 101',
      stats: {
        views: 45,
        likes: 12,
        comments: 3,
        responses: 1,
        averageRating: 4.2,
        totalRatings: 5
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'video_002',
      title: 'Advanced JavaScript Concepts',
      description: 'Deep dive into closures, prototypes, and async programming in JavaScript.',
      videoUrl: 'https://example.com/videos/js-advanced.mp4',
      thumbnail: 'https://example.com/thumbnails/js-advanced.jpg',
      duration: 1800, // 30 minutes
      courseId: 'cs-101',
      userId: '84c8b438-c061-700f-1051-0aecb612e646',
      courseName: 'Computer Science 101',
      stats: {
        views: 32,
        likes: 8,
        comments: 2,
        responses: 0,
        averageRating: 4.5,
        totalRatings: 3
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Sample video interactions
  const interactions = [
    {
      id: 'interaction_001',
      videoId: 'video_001',
      userId: '84c8b438-c061-700f-1051-0aecb612e646',
      userName: 'Test Instructor',
      userAvatar: 'https://example.com/avatars/test-instructor.jpg',
      type: 'like',
      content: '',
      rating: null,
      contentCreatorId: '84c8b438-c061-700f-1051-0aecb612e646',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'interaction_002',
      videoId: 'video_001',
      userId: '84c8b438-c061-700f-1051-0aecb612e646',
      userName: 'Test Instructor',
      userAvatar: 'https://example.com/avatars/test-instructor.jpg',
      type: 'comment',
      content: 'Great explanation of useState!',
      rating: null,
      contentCreatorId: '84c8b438-c061-700f-1051-0aecb612e646',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'interaction_003',
      videoId: 'video_002',
      userId: '84c8b438-c061-700f-1051-0aecb612e646',
      userName: 'Test Instructor',
      userAvatar: 'https://example.com/avatars/test-instructor.jpg',
      type: 'rating',
      content: '',
      rating: 5,
      contentCreatorId: '84c8b438-c061-700f-1051-0aecb612e646',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  try {
    // Add videos
    for (const video of videos) {
      await docClient.send(new PutCommand({
        TableName: 'classcast-videos',
        Item: video
      }));
      console.log(`✅ Added video: ${video.title}`);
    }

    // Add interactions
    for (const interaction of interactions) {
      await docClient.send(new PutCommand({
        TableName: 'classcast-video-interactions',
        Item: interaction
      }));
      console.log(`✅ Added interaction: ${interaction.type} for ${interaction.videoId}`);
    }

    console.log('🎉 Sample video data added successfully!');
    console.log(`📊 Added ${videos.length} videos and ${interactions.length} interactions`);

  } catch (error) {
    console.error('❌ Error adding sample video data:', error);
  }
}

addVideoSampleData();
