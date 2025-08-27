# Student Community Feed Component

The Student Community Feed is a comprehensive React component that enables students to explore, interact with, and learn from their peers' video submissions in an educational environment.

## Overview

This component creates a social learning experience where students can:
- Browse peer submissions with rich metadata
- Watch videos with a full-featured video player
- Like and comment on submissions
- Filter and search through content
- View grades and feedback
- Engage in peer-to-peer learning

## Components

### 1. StudentCommunityFeed (Main Component)

The main container component that orchestrates the entire community feed experience.

**Features:**
- Responsive grid layout for submissions
- Advanced filtering and search capabilities
- Pagination for large datasets
- Real-time community interactions
- Mock data integration for development

**Props:**
```typescript
interface StudentCommunityFeedProps {
  currentUserId?: string;  // ID of the current user
  className?: string;      // Additional CSS classes
}
```

### 2. PeerSubmissionCard

Individual submission cards that display peer work with interactive elements.

**Features:**
- Submission metadata display
- Grade visualization
- File previews with video support
- Expandable detailed view
- Community interaction buttons

**Props:**
```typescript
interface PeerSubmissionCardProps {
  submission: PeerSubmissionData;
  onLike: (submissionId: string) => void;
  onComment: (submissionId: string, comment: string) => void;
  currentUserId?: string;
  className?: string;
}
```

### 3. CommunityInteractions

Handles social interactions like likes, comments, and sharing.

**Features:**
- Like/unlike functionality
- Comment system with real-time updates
- Interaction statistics display
- Share capabilities
- User-friendly comment interface

### 4. VideoPlayer

Full-featured video player with advanced controls and metadata display.

**Features:**
- Custom video controls
- Keyboard shortcuts
- Fullscreen support
- Video metadata display
- Error handling
- Responsive design

**Keyboard Shortcuts:**
- `Space`: Play/Pause
- `←/→`: Seek 10 seconds
- `↑/↓`: Volume control
- `M`: Mute/Unmute
- `F`: Toggle fullscreen
- `Escape`: Close/Exit fullscreen

### 5. GradeDisplay

Visualizes grades and feedback in an attractive, informative way.

**Features:**
- Grade letter display
- Percentage visualization
- Progress bars
- Grade scale breakdown
- Performance summaries
- Compact and full view modes

## Data Structure

### PeerSubmissionData Interface

```typescript
interface PeerSubmissionData {
  submissionId: string;
  studentId: string;
  studentName: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseName: string;
  status: 'submitted' | 'graded' | 'late' | 'returned';
  submittedAt: string;
  processedAt?: string;
  sharedAt?: string;
  grade?: number;
  maxScore?: number;
  feedback?: string;
  videoDuration?: number;
  videoResolution?: {
    width: number;
    height: number;
  };
  processingDuration?: number;
  files: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: string;
  }>;
  likes: Array<{
    userId: string;
    userName: string;
    createdAt: string;
  }>;
  comments: Array<{
    id: string;
    text: string;
    authorId: string;
    authorName: string;
    createdAt: string;
    isEdited?: boolean;
  }>;
  peerReviews?: Array<{
    reviewerId: string;
    reviewerName: string;
    score: number;
    maxScore: number;
    feedback: string;
    submittedAt: string;
  }>;
}
```

## Features

### Search and Filtering
- **Text Search**: Search across assignment titles, student names, and course names
- **Status Filtering**: Filter by submission status (submitted, graded, late, returned)
- **Course Filtering**: Filter by specific courses
- **Sorting Options**: Sort by recent, oldest, grade, likes, or comments

### Community Interactions
- **Likes**: Students can like peer submissions (except their own)
- **Comments**: Rich comment system with real-time updates
- **Sharing**: Share submissions with other students
- **Peer Reviews**: View and contribute to peer review systems

### Video Experience
- **Video Playback**: Full-featured video player with custom controls
- **Metadata Display**: Show video duration, resolution, and processing time
- **Responsive Design**: Optimized for various screen sizes
- **Accessibility**: Keyboard navigation and screen reader support

### Grade Visualization
- **Grade Letters**: A-F grading with color coding
- **Progress Bars**: Visual representation of performance
- **Grade Scale**: Clear breakdown of grading criteria
- **Performance Feedback**: Encouraging performance summaries

## Usage Examples

### Basic Implementation

```tsx
import { StudentCommunityFeed } from '@/components/student/StudentCommunityFeed';

function MyPage() {
  return (
    <StudentCommunityFeed
      currentUserId="user-123"
      className="my-8"
    />
  );
}
```

### With Custom Styling

```tsx
<StudentCommunityFeed
  currentUserId="user-123"
  className="bg-white shadow-lg rounded-xl p-6"
/>
```

### Individual Components

```tsx
import { PeerSubmissionCard } from '@/components/student/PeerSubmissionCard';
import { VideoPlayer } from '@/components/student/VideoPlayer';

// Use individual components as needed
<PeerSubmissionCard
  submission={submissionData}
  onLike={handleLike}
  onComment={handleComment}
  currentUserId="user-123"
/>
```

## Styling

The component uses Tailwind CSS for styling and includes:
- Responsive design patterns
- Consistent color schemes
- Hover and focus states
- Smooth transitions and animations
- Accessibility-focused design

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Focus Management**: Clear focus indicators and logical tab order
- **Color Contrast**: High contrast ratios for readability
- **Semantic HTML**: Proper heading structure and landmarks

## Performance Considerations

- **Debounced Search**: Prevents excessive API calls during typing
- **Lazy Loading**: Components load only when needed
- **Memoization**: Uses React.memo and useMemo for optimization
- **Pagination**: Limits rendered items for large datasets
- **Efficient Rendering**: Minimizes unnecessary re-renders

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ features
- CSS Grid and Flexbox
- HTML5 video support

## Dependencies

- React 18+
- TypeScript
- Tailwind CSS
- Modern browser APIs (Fullscreen API, etc.)

## Future Enhancements

- **Real-time Updates**: WebSocket integration for live interactions
- **Advanced Analytics**: Learning analytics and insights
- **Mobile App**: React Native version
- **Offline Support**: Service worker integration
- **Internationalization**: Multi-language support
- **Accessibility Improvements**: Enhanced screen reader support

## Contributing

When contributing to this component:
1. Follow the existing code style and patterns
2. Add proper TypeScript types
3. Include accessibility considerations
4. Write comprehensive tests
5. Update documentation
6. Consider performance implications

## License

This component is part of the educational platform and follows the project's licensing terms.





