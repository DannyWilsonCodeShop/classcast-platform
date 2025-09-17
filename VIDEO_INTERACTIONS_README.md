# Video Interactions Feature

## 🎬 Overview

The Video Interactions feature enables students to engage with video content through likes, comments, and ratings. This creates a social learning environment where students can interact with peer-generated content and provide feedback to content creators.

## ✨ Features

### 🧡 Like System
- **Like/Unlike Videos**: Students can like and unlike videos with a single click
- **Real-time Counts**: Like counts update immediately in the UI
- **Prevent Duplicate Likes**: Users can only like a video once
- **Visual Feedback**: Heart icons change color when liked

### 💬 Comment System
- **Add Comments**: Students can add text comments to videos
- **View All Comments**: Modal displays all comments with user information
- **Real-time Updates**: Comment counts update immediately
- **User Attribution**: Comments show author name, avatar, and timestamp

### ⭐ Rating System
- **Rate Content Creators**: 1-5 star rating system for content creators
- **Optional Feedback**: Students can add written feedback with ratings
- **Average Rating Display**: Videos show average rating from all users
- **Rating Breakdown**: Clear descriptions for each star level

### 📊 Statistics Tracking
- **View Counts**: Track how many times videos are viewed
- **Like Counts**: Real-time like statistics
- **Comment Counts**: Track total comments per video
- **Rating Averages**: Calculate and display average ratings
- **Response Counts**: Track video responses (for future use)

## 🏗️ Architecture

### Database Tables

#### `classcast-videos`
Stores video metadata and aggregated statistics:
```json
{
  "id": "video_123",
  "title": "React Hooks Tutorial",
  "description": "Learn React hooks...",
  "videoUrl": "https://...",
  "thumbnail": "https://...",
  "duration": 120,
  "courseId": "cs-101",
  "userId": "student-1",
  "courseName": "CS 101",
  "stats": {
    "views": 45,
    "likes": 12,
    "comments": 3,
    "responses": 1,
    "averageRating": 4.2,
    "totalRatings": 5
  },
  "createdAt": "2024-12-10T10:30:00Z",
  "updatedAt": "2024-12-10T10:30:00Z"
}
```

#### `classcast-video-interactions`
Stores individual user interactions:
```json
{
  "id": "interaction_123",
  "videoId": "video_123",
  "userId": "student-2",
  "userName": "Mike Chen",
  "userAvatar": "https://...",
  "type": "like|comment|rating",
  "content": "Great video!",
  "rating": 5,
  "contentCreatorId": "student-1",
  "createdAt": "2024-12-10T11:00:00Z",
  "updatedAt": "2024-12-10T11:00:00Z"
}
```

### API Endpoints

#### Videos API
- `GET /api/videos` - List all videos with filtering
- `POST /api/videos` - Create new video

#### Video Interactions API
- `GET /api/videos/[videoId]/interactions` - Get interactions for a video
- `POST /api/videos/[videoId]/interactions` - Create new interaction
- `DELETE /api/videos/[videoId]/interactions` - Remove interaction

### React Components

#### `VideoReels`
Main component displaying video feed with interactive features:
- Fetches videos from API
- Displays video cards with metadata
- Handles like/unlike functionality
- Opens comment and rating modals
- Updates real-time statistics

#### `VideoPlayer`
Advanced video playback component:
- Custom video controls
- Keyboard shortcuts
- Metadata display
- Fullscreen support

## 🚀 Setup Instructions

### 1. Deploy Infrastructure
```bash
# Deploy the CDK stack with video tables
cd cdk
npm install
cdk deploy DatabaseStack
cd ..
```

### 2. Populate Sample Data
```bash
# Run the complete setup script
./scripts/setup-video-interactions.sh
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Test the Features
```bash
# Run the test suite
node scripts/test-video-interactions.js
```

## 🧪 Testing

### Manual Testing
1. Navigate to the student dashboard
2. Scroll to the "Trending Now" section
3. Test each interaction type:
   - Click the heart icon to like/unlike
   - Click the comment icon to add/view comments
   - Click the star icon to rate content creators

### Automated Testing
The test suite verifies:
- Database connectivity
- API endpoint functionality
- Like/unlike operations
- Comment creation
- Rating submission
- Real-time statistics updates

## 📱 User Experience

### Student Dashboard Integration
- **Social Media Style**: Instagram/TikTok-inspired interface
- **Mobile-First Design**: Optimized for mobile devices
- **Real-time Updates**: Immediate feedback on interactions
- **Intuitive Icons**: Clear visual indicators for each action

### Interaction Flow
1. **Discovery**: Students see video reels in dashboard
2. **Engagement**: Click to like, comment, or rate
3. **Feedback**: Immediate visual confirmation
4. **Community**: View other students' interactions

## 🔧 Configuration

### Environment Variables
```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# DynamoDB Tables
VIDEOS_TABLE=classcast-videos
INTERACTIONS_TABLE=classcast-video-interactions
USERS_TABLE=classcast-users
```

### CDK Configuration
The video tables are defined in `cdk/lib/database-stack.ts`:
- Videos table with GSIs for course and user queries
- Interactions table with GSIs for video, user, and type queries
- Proper indexing for efficient queries

## 🚨 Troubleshooting

### Common Issues

#### "Videos not loading"
- Check if DynamoDB tables exist
- Verify AWS credentials
- Run the setup script: `./scripts/setup-video-interactions.sh`

#### "API errors"
- Ensure Next.js server is running: `npm run dev`
- Check browser console for detailed error messages
- Verify API endpoint URLs

#### "Interactions not saving"
- Check DynamoDB permissions
- Verify table names in environment variables
- Check AWS region configuration

### Debug Mode
Enable detailed logging by setting:
```bash
NODE_ENV=development
```

## 🔮 Future Enhancements

### Planned Features
- **Video Responses**: Students can create video responses to other videos
- **Reaction Types**: More than just likes (love, helpful, etc.)
- **Comment Threading**: Nested replies to comments
- **Notification System**: Notify users of interactions
- **Analytics Dashboard**: Detailed interaction analytics
- **Content Moderation**: AI-powered comment filtering

### Performance Optimizations
- **Caching**: Redis cache for frequently accessed data
- **Pagination**: Load more videos on scroll
- **Lazy Loading**: Load interactions on demand
- **CDN Integration**: Optimize video delivery

## 📊 Metrics & Analytics

### Tracked Metrics
- **Engagement Rate**: Likes per video view
- **Comment Rate**: Comments per video view
- **Rating Distribution**: Average ratings by content creator
- **User Activity**: Most active students
- **Content Performance**: Most popular videos

### Business Intelligence
- Identify popular content creators
- Understand student engagement patterns
- Optimize content recommendations
- Measure learning outcomes

## 🤝 Contributing

### Adding New Interaction Types
1. Update the `VideoInteraction` type in `types/video-interactions.ts`
2. Add handling in the API endpoint
3. Update the UI components
4. Add database migration if needed

### Code Style
- Use TypeScript for type safety
- Follow React best practices
- Write comprehensive tests
- Document all public APIs

## 📄 License

This feature is part of the ClassCast Platform and follows the same licensing terms.

---

**Happy Learning! 🎓✨**
