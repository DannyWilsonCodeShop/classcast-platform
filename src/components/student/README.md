# Student Submissions View Components

This directory contains React components for displaying student submission history with comprehensive grade display, feedback viewing, and video playback capabilities.

## 🎯 **Overview**

The student submissions view system provides a complete interface for students to:
- View their submission history across all courses and assignments
- Access grades, feedback, and rubric scores
- Play back video submissions with advanced controls
- Filter and sort submissions by various criteria
- Navigate through paginated results efficiently

## 🏗️ **Component Architecture**

### **Core Components**

#### **SubmissionHistory** (`SubmissionHistory.tsx`)
The main orchestrator component that manages the entire submission viewing experience.

**Features:**
- Fetches submissions from the API with filtering and pagination
- Manages component state and user interactions
- Handles loading, error, and empty states
- Integrates with all supporting components

**Props:**
```typescript
interface SubmissionHistoryProps {
  title?: string;           // Custom title for the component
  maxItems?: number;        // Maximum items to display per page
  showFilters?: boolean;    // Whether to show filtering controls
  showSort?: boolean;       // Whether to show sorting controls
  className?: string;       // Additional CSS classes
}
```

#### **SubmissionCard** (`SubmissionCard.tsx`)
Displays individual submission details in an expandable card format.

**Features:**
- Shows submission metadata (title, course, dates, status)
- Displays grades and feedback in compact or expanded view
- Lists all submitted files with type detection
- Expandable sections for video playback and detailed feedback
- Responsive design with proper status color coding

**Props:**
```typescript
interface SubmissionCardProps {
  submission: SubmissionData;  // Complete submission data
  className?: string;          // Additional CSS classes
}
```

#### **VideoPlayer** (`VideoPlayer.tsx`)
Advanced video playback component with custom controls and keyboard shortcuts.

**Features:**
- HTML5 video element with custom UI controls
- Play/pause, seek, volume, and fullscreen controls
- Keyboard shortcuts (space, arrows, M, F)
- Auto-hiding controls with mouse movement detection
- Progress bar with visual feedback
- Metadata display (resolution, duration, processing info)

**Props:**
```typescript
interface VideoPlayerProps {
  videoUrl: string;                    // Video source URL
  onClose: () => void;                // Close handler
  metadata?: {                        // Optional video metadata
    duration?: number;
    resolution?: { width: number; height: number };
    processingDuration?: number;
  };
  className?: string;                 // Additional CSS classes
}
```

#### **GradeDisplay** (`GradeDisplay.tsx`)
Comprehensive grade and feedback display component with multiple view modes.

**Features:**
- Compact and full display modes
- Letter grade conversion (A, B+, C-, etc.)
- Color-coded grade ranges (green, blue, yellow, orange, red)
- Progress bar visualization
- Grade summary card in full mode
- Preserves line breaks in feedback text

**Props:**
```typescript
interface GradeDisplayProps {
  grade?: number;           // Student's score
  maxScore?: number;        // Maximum possible score
  feedback?: string;        // Instructor feedback
  compact?: boolean;        // Use compact display mode
  className?: string;       // Additional CSS classes
}
```

#### **FeedbackViewer** (`FeedbackViewer.tsx`)
Tabbed interface for viewing different types of feedback and assessment data.

**Features:**
- Tabbed navigation between feedback types
- Instructor feedback display
- Rubric scores with visual indicators
- Instructor notes section
- Criterion-level feedback when available
- Total rubric score summary

**Props:**
```typescript
interface FeedbackViewerProps {
  feedback: string;                    // Main feedback text
  rubricScores?: RubricScore[];       // Detailed rubric assessment
  instructorNotes?: string;           // Additional instructor notes
  className?: string;                 // Additional CSS classes
}
```

### **Supporting Components**

#### **SubmissionFilters** (`SubmissionFilters.tsx`)
Comprehensive filtering interface for submissions.

**Features:**
- Basic filters (status, grade status, search)
- Advanced filters (course, assignment, date range)
- Quick date presets (last week, month, semester)
- Active filter display with removal options
- Color-coded filter badges
- Collapsible advanced section

#### **SubmissionSort** (`SubmissionSort.tsx`)
Sorting controls for submission ordering.

**Features:**
- Field selection (date, grade, status, title)
- Order selection (ascending/descending)
- Visual feedback for active sort
- Descriptive text for current sort
- Keyboard accessible controls

## 📊 **Data Types**

### **SubmissionData Interface**
```typescript
interface SubmissionData {
  submissionId: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseName: string;
  studentId: string;
  studentName: string;
  status: string;
  submittedAt: string;
  processedAt?: string;
  grade?: number;
  maxScore?: number;
  feedback?: string;
  videoUrl?: string;
  videoUrlExpiry?: string;
  thumbnailUrls?: string[];
  videoDuration?: number;
  videoResolution?: { width: number; height: number };
  processingDuration?: number;
  errorMessage?: string;
  retryCount: number;
  metadata: Record<string, any>;
  files: Array<{
    name: string;
    url: string;
    size: number;
    type: string;
    uploadedAt: string;
  }>;
}
```

### **RubricScore Interface**
```typescript
interface RubricScore {
  criterion: string;
  points: number;
  maxPoints: number;
  feedback?: string;
}
```

## 🔌 **API Integration**

### **Submissions API Route** (`/api/submissions`)
- **Method**: GET
- **Authentication**: Required (JWT token)
- **Parameters**: 
  - `status`: Filter by submission status
  - `hasGrade`: Filter by grading status
  - `courseId`: Filter by course
  - `assignmentId`: Filter by assignment
  - `submittedAfter/Before`: Date range filters
  - `search`: Text search
  - `sortBy`: Sort field
  - `sortOrder`: Sort direction
  - `page`: Page number
  - `limit`: Items per page
  - `includeVideoUrls`: Include video URLs
  - `videoUrlExpiry`: Video URL expiration time

### **Integration with Lambda Functions**
The components integrate with the existing `fetch-submissions` Lambda function through the Next.js API route, ensuring:
- Proper authentication and authorization
- Student access control (students can only view their own submissions)
- Video URL generation with temporary access
- Comprehensive filtering and sorting

## 🎨 **Styling and Design**

### **Design System**
- **Colors**: Consistent with the application's color palette
- **Typography**: Clear hierarchy with proper contrast
- **Spacing**: Consistent spacing using Tailwind CSS utilities
- **Responsiveness**: Mobile-first design with breakpoint considerations

### **Status Color Coding**
- **Graded**: Green (success)
- **Submitted**: Blue (info)
- **Late**: Yellow (warning)
- **Returned**: Red (error)
- **Draft**: Gray (neutral)

### **Grade Color Coding**
- **90-100%**: Green (A range)
- **80-89%**: Blue (B range)
- **70-79%**: Yellow (C range)
- **60-69%**: Orange (D range)
- **0-59%**: Red (F range)

## ♿ **Accessibility Features**

### **ARIA Support**
- Proper labels for form controls
- Tab navigation for feedback sections
- Progress indicators for video playback
- Screen reader friendly status messages

### **Keyboard Navigation**
- Tab navigation through all interactive elements
- Keyboard shortcuts for video player
- Enter/Space activation for buttons
- Arrow key navigation for sort controls

### **Visual Indicators**
- High contrast color schemes
- Clear visual hierarchy
- Consistent iconography
- Loading and error state indicators

## 🧪 **Testing Strategy**

### **Test Coverage**
Each component has comprehensive unit tests covering:
- **Rendering**: Component displays correctly with various props
- **Interactions**: User interactions trigger appropriate callbacks
- **State Management**: Component state updates correctly
- **Edge Cases**: Handles missing data and error conditions
- **Accessibility**: Proper ARIA labels and keyboard navigation

### **Test Files**
- `SubmissionHistory.test.tsx` - Main component tests
- `SubmissionCard.test.tsx` - Card component tests
- `VideoPlayer.test.tsx` - Video player tests
- `GradeDisplay.test.tsx` - Grade display tests
- `FeedbackViewer.test.tsx` - Feedback viewer tests
- `SubmissionFilters.test.tsx` - Filter component tests
- `SubmissionSort.test.tsx` - Sort component tests

### **Mocking Strategy**
- **Components**: Mock supporting components to isolate testing
- **Hooks**: Mock `useAuth` for authentication state
- **APIs**: Mock `fetch` for API calls
- **Browser APIs**: Mock video element methods and fullscreen APIs

## 🚀 **Performance Considerations**

### **Optimization Techniques**
- **Memoization**: Use `useCallback` for event handlers
- **Lazy Loading**: Load video content only when needed
- **Pagination**: Efficient data loading with page limits
- **Debouncing**: Search input debouncing for API calls

### **Bundle Size**
- **Tree Shaking**: Only import required components
- **Code Splitting**: Lazy load video player when needed
- **Icon Optimization**: Use lightweight SVG icons

## 🌐 **Browser Support**

### **Supported Browsers**
- **Chrome**: 90+ (Full support)
- **Firefox**: 88+ (Full support)
- **Safari**: 14+ (Full support)
- **Edge**: 90+ (Full support)

### **Feature Detection**
- **Video API**: HTML5 video element support
- **Fullscreen API**: Modern fullscreen implementation
- **CSS Grid**: Responsive layout support
- **ES6+**: Modern JavaScript features

## 🔒 **Security Features**

### **Access Control**
- **Authentication**: JWT token validation
- **Authorization**: Student-only access to their submissions
- **Data Isolation**: Students cannot access other students' data

### **Content Security**
- **Video URLs**: Temporary, expiring URLs for video access
- **File Validation**: Server-side file type and size validation
- **XSS Prevention**: Proper content sanitization

## 🔮 **Future Enhancements**

### **Planned Features**
- **Offline Support**: Cache submissions for offline viewing
- **Advanced Analytics**: Submission performance tracking
- **Collaborative Features**: Peer review integration
- **Mobile App**: Native mobile application support

### **Performance Improvements**
- **Virtual Scrolling**: Handle large submission lists
- **Image Optimization**: Automatic image compression
- **CDN Integration**: Global content delivery
- **Caching Strategy**: Intelligent data caching

## 🐛 **Troubleshooting**

### **Common Issues**

#### **Video Not Playing**
- Check browser video codec support
- Verify video URL is accessible
- Ensure proper CORS configuration

#### **Filters Not Working**
- Verify API endpoint is accessible
- Check authentication token validity
- Review filter parameter format

#### **Performance Issues**
- Monitor network requests
- Check component re-render frequency
- Verify proper memoization usage

### **Debug Mode**
Enable debug logging by setting:
```typescript
process.env.NODE_ENV = 'development';
```

## 🤝 **Contributing**

### **Development Setup**
1. Install dependencies: `npm install`
2. Run tests: `npm test`
3. Start development server: `npm run dev`

### **Code Standards**
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Jest**: Comprehensive testing framework

### **Component Guidelines**
- **Props Interface**: Define clear prop types
- **Error Handling**: Graceful error handling
- **Loading States**: Proper loading indicators
- **Accessibility**: ARIA labels and keyboard support

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 **Support**

For questions or issues:
1. Check the troubleshooting section
2. Review existing GitHub issues
3. Create a new issue with detailed information
4. Contact the development team

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Maintainer**: Development Team
