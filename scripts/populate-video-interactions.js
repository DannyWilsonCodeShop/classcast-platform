const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const INTERACTIONS_TABLE = 'classcast-video-interactions';

// Sample interactions data
const sampleInteractions = [
  // Likes for video_1 (React Hooks)
  {
    id: 'interaction_1',
    videoId: 'video_1',
    userId: 'student-2',
    userName: 'Mike Chen',
    userAvatar: 'https://via.placeholder.com/40x40/059669/FFFFFF?text=MC',
    type: 'like',
    createdAt: new Date('2024-12-10T11:00:00Z').toISOString(),
    updatedAt: new Date('2024-12-10T11:00:00Z').toISOString()
  },
  {
    id: 'interaction_2',
    videoId: 'video_1',
    userId: 'student-3',
    userName: 'Emily Davis',
    userAvatar: 'https://via.placeholder.com/40x40/DC2626/FFFFFF?text=ED',
    type: 'like',
    createdAt: new Date('2024-12-10T12:30:00Z').toISOString(),
    updatedAt: new Date('2024-12-10T12:30:00Z').toISOString()
  },
  {
    id: 'interaction_3',
    videoId: 'video_1',
    userId: 'student-4',
    userName: 'Alex Wilson',
    userAvatar: 'https://via.placeholder.com/40x40/7C3AED/FFFFFF?text=AW',
    type: 'like',
    createdAt: new Date('2024-12-10T14:15:00Z').toISOString(),
    updatedAt: new Date('2024-12-10T14:15:00Z').toISOString()
  },

  // Comments for video_1
  {
    id: 'interaction_4',
    videoId: 'video_1',
    userId: 'student-2',
    userName: 'Mike Chen',
    userAvatar: 'https://via.placeholder.com/40x40/059669/FFFFFF?text=MC',
    type: 'comment',
    content: 'Great explanation! The useState examples really helped me understand the concept.',
    likes: 2,
    replies: [],
    createdAt: new Date('2024-12-10T11:15:00Z').toISOString(),
    updatedAt: new Date('2024-12-10T11:15:00Z').toISOString()
  },
  {
    id: 'interaction_5',
    videoId: 'video_1',
    userId: 'student-3',
    userName: 'Emily Davis',
    userAvatar: 'https://via.placeholder.com/40x40/DC2626/FFFFFF?text=ED',
    type: 'comment',
    content: 'Could you make a follow-up video on useEffect? I\'m still confused about the dependency array.',
    likes: 1,
    replies: [],
    createdAt: new Date('2024-12-10T12:45:00Z').toISOString(),
    updatedAt: new Date('2024-12-10T12:45:00Z').toISOString()
  },
  {
    id: 'interaction_6',
    videoId: 'video_1',
    userId: 'student-4',
    userName: 'Alex Wilson',
    userAvatar: 'https://via.placeholder.com/40x40/7C3AED/FFFFFF?text=AW',
    type: 'comment',
    content: 'This is exactly what I needed for my project. Thanks for sharing!',
    likes: 0,
    replies: [],
    createdAt: new Date('2024-12-10T14:30:00Z').toISOString(),
    updatedAt: new Date('2024-12-10T14:30:00Z').toISOString()
  },

  // Ratings for video_1
  {
    id: 'interaction_7',
    videoId: 'video_1',
    userId: 'student-2',
    userName: 'Mike Chen',
    userAvatar: 'https://via.placeholder.com/40x40/059669/FFFFFF?text=MC',
    type: 'rating',
    contentCreatorId: 'student-1',
    rating: 5,
    comment: 'Excellent tutorial! Very clear and well-structured.',
    createdAt: new Date('2024-12-10T11:20:00Z').toISOString(),
    updatedAt: new Date('2024-12-10T11:20:00Z').toISOString()
  },
  {
    id: 'interaction_8',
    videoId: 'video_1',
    userId: 'student-3',
    userName: 'Emily Davis',
    userAvatar: 'https://via.placeholder.com/40x40/DC2626/FFFFFF?text=ED',
    type: 'rating',
    contentCreatorId: 'student-1',
    rating: 4,
    comment: 'Really helpful content. Would love to see more examples.',
    createdAt: new Date('2024-12-10T13:00:00Z').toISOString(),
    updatedAt: new Date('2024-12-10T13:00:00Z').toISOString()
  },

  // Likes for video_2 (Database Design)
  {
    id: 'interaction_9',
    videoId: 'video_2',
    userId: 'student-1',
    userName: 'Sarah Johnson',
    userAvatar: 'https://via.placeholder.com/40x40/4F46E5/FFFFFF?text=SJ',
    type: 'like',
    createdAt: new Date('2024-12-09T15:00:00Z').toISOString(),
    updatedAt: new Date('2024-12-09T15:00:00Z').toISOString()
  },
  {
    id: 'interaction_10',
    videoId: 'video_2',
    userId: 'student-3',
    userName: 'Emily Davis',
    userAvatar: 'https://via.placeholder.com/40x40/DC2626/FFFFFF?text=ED',
    type: 'like',
    createdAt: new Date('2024-12-09T16:30:00Z').toISOString(),
    updatedAt: new Date('2024-12-09T16:30:00Z').toISOString()
  },
  {
    id: 'interaction_11',
    videoId: 'video_2',
    userId: 'student-4',
    userName: 'Alex Wilson',
    userAvatar: 'https://via.placeholder.com/40x40/7C3AED/FFFFFF?text=AW',
    type: 'like',
    createdAt: new Date('2024-12-09T17:45:00Z').toISOString(),
    updatedAt: new Date('2024-12-09T17:45:00Z').toISOString()
  },

  // Comments for video_2
  {
    id: 'interaction_12',
    videoId: 'video_2',
    userId: 'student-1',
    userName: 'Sarah Johnson',
    userAvatar: 'https://via.placeholder.com/40x40/4F46E5/FFFFFF?text=SJ',
    type: 'comment',
    content: 'The normalization examples were really clear. This helped me understand 3NF better.',
    likes: 3,
    replies: [],
    createdAt: new Date('2024-12-09T15:15:00Z').toISOString(),
    updatedAt: new Date('2024-12-09T15:15:00Z').toISOString()
  },
  {
    id: 'interaction_13',
    videoId: 'video_2',
    userId: 'student-3',
    userName: 'Emily Davis',
    userAvatar: 'https://via.placeholder.com/40x40/DC2626/FFFFFF?text=ED',
    type: 'comment',
    content: 'Great video! Could you cover indexing strategies in the next one?',
    likes: 1,
    replies: [],
    createdAt: new Date('2024-12-09T16:45:00Z').toISOString(),
    updatedAt: new Date('2024-12-09T16:45:00Z').toISOString()
  },

  // Ratings for video_2
  {
    id: 'interaction_14',
    videoId: 'video_2',
    userId: 'student-1',
    userName: 'Sarah Johnson',
    userAvatar: 'https://via.placeholder.com/40x40/4F46E5/FFFFFF?text=SJ',
    type: 'rating',
    contentCreatorId: 'student-2',
    rating: 5,
    comment: 'Outstanding explanation of database concepts!',
    createdAt: new Date('2024-12-09T15:30:00Z').toISOString(),
    updatedAt: new Date('2024-12-09T15:30:00Z').toISOString()
  },
  {
    id: 'interaction_15',
    videoId: 'video_2',
    userId: 'student-3',
    userName: 'Emily Davis',
    userAvatar: 'https://via.placeholder.com/40x40/DC2626/FFFFFF?text=ED',
    type: 'rating',
    contentCreatorId: 'student-2',
    rating: 4,
    comment: 'Very informative and well-paced.',
    createdAt: new Date('2024-12-09T17:00:00Z').toISOString(),
    updatedAt: new Date('2024-12-09T17:00:00Z').toISOString()
  },

  // Some interactions for other videos
  {
    id: 'interaction_16',
    videoId: 'video_3',
    userId: 'student-1',
    userName: 'Sarah Johnson',
    userAvatar: 'https://via.placeholder.com/40x40/4F46E5/FFFFFF?text=SJ',
    type: 'like',
    createdAt: new Date('2024-12-08T17:00:00Z').toISOString(),
    updatedAt: new Date('2024-12-08T17:00:00Z').toISOString()
  },
  {
    id: 'interaction_17',
    videoId: 'video_3',
    userId: 'student-2',
    userName: 'Mike Chen',
    userAvatar: 'https://via.placeholder.com/40x40/059669/FFFFFF?text=MC',
    type: 'like',
    createdAt: new Date('2024-12-08T18:30:00Z').toISOString(),
    updatedAt: new Date('2024-12-08T18:30:00Z').toISOString()
  },
  {
    id: 'interaction_18',
    videoId: 'video_3',
    userId: 'student-1',
    userName: 'Sarah Johnson',
    userAvatar: 'https://via.placeholder.com/40x40/4F46E5/FFFFFF?text=SJ',
    type: 'comment',
    content: 'The async/await examples were perfect! This cleared up my confusion.',
    likes: 1,
    replies: [],
    createdAt: new Date('2024-12-08T17:15:00Z').toISOString(),
    updatedAt: new Date('2024-12-08T17:15:00Z').toISOString()
  },
  {
    id: 'interaction_19',
    videoId: 'video_3',
    userId: 'student-2',
    userName: 'Mike Chen',
    userAvatar: 'https://via.placeholder.com/40x40/059669/FFFFFF?text=MC',
    type: 'comment',
    content: 'Great video! The error handling section was particularly helpful.',
    likes: 0,
    replies: [],
    createdAt: new Date('2024-12-08T18:45:00Z').toISOString(),
    updatedAt: new Date('2024-12-08T18:45:00Z').toISOString()
  },
  {
    id: 'interaction_20',
    videoId: 'video_3',
    userId: 'student-1',
    userName: 'Sarah Johnson',
    userAvatar: 'https://via.placeholder.com/40x40/4F46E5/FFFFFF?text=SJ',
    type: 'rating',
    contentCreatorId: 'student-3',
    rating: 4,
    comment: 'Very clear explanation of async concepts!',
    createdAt: new Date('2024-12-08T17:30:00Z').toISOString(),
    updatedAt: new Date('2024-12-08T17:30:00Z').toISOString()
  }
];

async function populateInteractions() {
  console.log('Populating video interactions...');
  
  for (const interaction of sampleInteractions) {
    try {
      await docClient.send(new PutCommand({
        TableName: INTERACTIONS_TABLE,
        Item: interaction
      }));
      console.log(`✓ Added ${interaction.type} interaction: ${interaction.id}`);
    } catch (error) {
      console.error(`✗ Error adding interaction ${interaction.id}:`, error);
    }
  }
}

async function main() {
  console.log('🚀 Starting video interactions population...');
  
  // Populate interactions
  await populateInteractions();
  
  console.log('✅ Video interactions population completed!');
  console.log('\n📊 Summary:');
  console.log(`- ${sampleInteractions.length} interactions added`);
  console.log('\n🎬 You can now test the interactive features:');
  console.log('- Like/unlike videos');
  console.log('- Add comments to videos');
  console.log('- Rate content creators');
  console.log('- View real-time interaction counts');
}

main().catch(console.error);
