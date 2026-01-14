# Lesson Modules Feature - Implementation Plan

## Overview
Create a comprehensive lesson module system for instructors with interactive video lessons, quizzes, and practice tests.

## Features to Implement

### 1. Instructor Dashboard Enhancements
- ✅ User greeting (like Udemy student portal)
- ✅ Lesson modules sidebar
- ✅ Quick access to module creation

### 2. Lesson Module Creation Wizard
**Step 1: Module Setup**
- Module title
- Module description
- Course selection
- Module thumbnail

**Step 2: Intro Video**
- Upload or link to intro video
- Video description
- Duration

**Step 3: Lesson Videos (Sequential)**
- Add multiple lesson videos
- Drag-and-drop reordering
- Video title and description
- Duration for each

**Step 4: Interactive Questions**
- Add pause points in videos
- Multiple choice questions
- Correct answer selection
- Points per question
- Feedback messages

**Step 5: Practice Tests**
- Standalone tests (no video required)
- Multiple question types
- Time limits
- Passing score
- Retake options

**Step 6: Review & Publish**
- Preview module
- Publish or save as draft

### 3. Student Experience
- Sequential lesson progression
- Video pauses for questions
- Answer recording and grading
- Progress tracking
- Certificate on completion

## Database Schema

### LessonModules Table
```typescript
{
  moduleId: string;
  courseId: string;
  instructorId: string;
  title: string;
  description: string;
  thumbnail?: string;
  introVideoUrl?: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}
```

### LessonVideos Table
```typescript
{
  lessonId: string;
  moduleId: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  order: number; // Sequential order
  questions: Question[]; // Embedded questions
  createdAt: string;
}
```

### Question Interface
```typescript
{
  questionId: string;
  pauseTime: number; // Seconds into video
  questionText: string;
  options: string[];
  correctAnswer: number; // Index of correct option
  points: number;
  feedback?: string;
}
```

### PracticeTests Table
```typescript
{
  testId: string;
  moduleId: string;
  title: string;
  description: string;
  questions: Question[];
  timeLimit?: number; // Minutes
  passingScore: number; // Percentage
  allowRetakes: boolean;
  createdAt: string;
}
```

### StudentProgress Table
```typescript
{
  progressId: string;
  studentId: string;
  moduleId: string;
  lessonId?: string;
  testId?: string;
  completed: boolean;
  score?: number;
  answers: Answer[];
  completedAt?: string;
}
```

## API Endpoints

### Module Management
- `POST /api/instructor/lesson-modules` - Create module
- `GET /api/instructor/lesson-modules` - List modules
- `PUT /api/instructor/lesson-modules/[id]` - Update module
- `DELETE /api/instructor/lesson-modules/[id]` - Delete module

### Lesson Management
- `POST /api/instructor/lesson-modules/[id]/lessons` - Add lesson
- `PUT /api/instructor/lesson-modules/[id]/lessons/[lessonId]` - Update lesson
- `DELETE /api/instructor/lesson-modules/[id]/lessons/[lessonId]` - Delete lesson

### Student Progress
- `GET /api/student/lesson-modules` - List available modules
- `GET /api/student/lesson-modules/[id]` - Get module details
- `POST /api/student/lesson-modules/[id]/progress` - Update progress
- `POST /api/student/lesson-modules/[id]/submit-answer` - Submit answer

## UI Components

### Instructor Components
1. **LessonModuleSidebar** - Navigation for modules
2. **ModuleCreationWizard** - Step-by-step module creation
3. **LessonVideoEditor** - Add/edit lesson videos
4. **QuestionEditor** - Add interactive questions
5. **PracticeTestBuilder** - Create standalone tests
6. **ModulePreview** - Preview before publishing

### Student Components
1. **ModuleList** - Browse available modules
2. **InteractiveVideoPlayer** - Video with pause/question feature
3. **QuizComponent** - Answer questions
4. **PracticeTestView** - Take practice tests
5. **ProgressTracker** - Track completion
6. **CertificateView** - Display completion certificate

## Implementation Priority

### Phase 1: Core Structure (This Session)
- ✅ User greeting on instructor dashboard
- ✅ Lesson modules sidebar
- ✅ Basic module creation wizard (steps 1-3)
- ✅ Database schema setup

### Phase 2: Interactive Features
- Video player with pause/question
- Question editor
- Answer grading system
- Progress tracking

### Phase 3: Practice Tests
- Standalone test builder
- Test taking interface
- Results and feedback

### Phase 4: Polish & Analytics
- Module analytics
- Student performance reports
- Certificates
- Advanced features

## File Structure
```
src/
├── app/
│   ├── instructor/
│   │   ├── lesson-modules/
│   │   │   ├── page.tsx (List modules)
│   │   │   ├── create/
│   │   │   │   └── page.tsx (Creation wizard)
│   │   │   └── [moduleId]/
│   │   │       ├── page.tsx (Edit module)
│   │   │       └── lessons/
│   │   │           └── [lessonId]/
│   │   │               └── page.tsx (Edit lesson)
│   │   └── dashboard/
│   │       └── page.tsx (Updated with greeting & sidebar)
│   ├── student/
│   │   └── lesson-modules/
│   │       ├── page.tsx (Browse modules)
│   │       └── [moduleId]/
│   │           ├── page.tsx (Module overview)
│   │           └── lessons/
│   │               └── [lessonId]/
│   │                   └── page.tsx (Take lesson)
│   └── api/
│       ├── instructor/
│       │   └── lesson-modules/
│       │       └── route.ts
│       └── student/
│           └── lesson-modules/
│               └── route.ts
├── components/
│   ├── instructor/
│   │   ├── LessonModuleSidebar.tsx
│   │   ├── ModuleCreationWizard.tsx
│   │   ├── LessonVideoEditor.tsx
│   │   ├── QuestionEditor.tsx
│   │   └── PracticeTestBuilder.tsx
│   └── student/
│       ├── InteractiveVideoPlayer.tsx (Already exists!)
│       ├── QuizComponent.tsx (Already exists!)
│       └── ModuleProgressTracker.tsx
└── types/
    └── lesson-modules.ts
```

## Next Steps

1. Update instructor dashboard with greeting
2. Create lesson modules sidebar
3. Build module creation wizard (basic version)
4. Set up API routes
5. Create database tables
6. Implement interactive video player
7. Add question/answer system
8. Build practice test feature

---

**Status:** Planning Complete - Ready for Implementation
**Estimated Time:** 3-4 hours for Phase 1
**Dependencies:** Existing video upload system, quiz components
