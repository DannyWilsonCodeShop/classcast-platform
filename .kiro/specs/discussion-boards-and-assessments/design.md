# Technical Design: Discussion Boards, Timed Video Assessments & Module Assignments

## 1. Architecture Overview

### Integration with Existing Assignment System

All three new features extend the existing assignment CRUD pipeline. The `classcast-assignments` table already stores records with `assignmentType: 'video'`. We add three new type values:

```
assignmentType: 'video' | 'discussion' | 'assessment' | 'module'
```

The existing `/api/assignments` POST endpoint and assignment creation wizard at `/instructor/assignments/create` already reference `'discussion' | 'assessment'` in the `AssignmentFormData` interface. Each new type stores type-specific configuration as additional fields on the assignment record (e.g., `questions[]` for assessments, `discussionConfig` for discussions, `moduleConfig` for modules).

### High-Level Component Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│ Assignment Wizard (existing)                            │
│  ├── DiscussionSetupWizard (new)                        │
│  ├── AssessmentSetupWizard (new)                        │
│  └── ModuleSetupWizard (new)                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Student Views                                           │
│  ├── DiscussionBoardView → DiscussionPostComposer       │
│  ├── AssessmentStartScreen → AssessmentRecordingView    │
│  └── ModuleWorkspace                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Instructor Review Views                                 │
│  ├── DiscussionModeratorView                            │
│  ├── AssessmentReviewPlayer                             │
│  └── ModuleReviewInterface                              │
└─────────────────────────────────────────────────────────┘
```


---

## 2. Data Models

### 2.1 Assignment Record Extension (classcast-assignments table)

The existing assignment record gains type-specific configuration fields:

```typescript
// Extended assignment record — stored in classcast-assignments
interface AssignmentRecord {
  assignmentId: string;          // PK
  courseId: string;
  instructorId: string;
  title: string;
  description: string;
  assignmentType: 'video' | 'discussion' | 'assessment' | 'module';
  dueDate: string;               // ISO 8601
  maxScore: number;
  rubric: RubricCategory[] | null;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;

  // Discussion-specific (when assignmentType === 'discussion')
  discussionConfig?: DiscussionConfig;

  // Assessment-specific (when assignmentType === 'assessment')
  assessmentQuestions?: AssessmentQuestion[];

  // Module-specific (when assignmentType === 'module')
  moduleConfig?: ModuleConfig;
}

interface DiscussionConfig {
  prompt: string;
  format: 'whole-class' | 'small-groups';
  groupSize?: number;                    // 3–10, only when format === 'small-groups'
  allowedResponseTypes: 'text' | 'video' | 'both';
  minPosts: number;                      // 1–50
  minWordCount: number;                  // 0–1000
  maxVideoDurationSeconds: number;       // default: 120
}

interface AssessmentQuestion {
  questionId: string;
  questionText: string;
  timeLimitSeconds: number;              // 15–300
  orderIndex: number;
}

interface ModuleConfig {
  topic: string;
  requiredVideos: number;                // 2–20
  maxVideoDurationSeconds: number;       // 30–600
  groupFormation: 'random' | 'manual' | 'self-selection';
  groupSize: number;                     // 2–8
  gradingPolicy: 'shared' | 'individual';
}
```


### 2.2 classcast-discussion-posts

| Attribute     | Type     | Key  | Description                              |
|---------------|----------|------|------------------------------------------|
| postId        | String   | PK   | UUID, unique post identifier             |
| discussionId  | String   | GSI  | Links to assignment's assignmentId       |
| authorId      | String   |      | Student/instructor user ID               |
| parentPostId  | String   |      | null for top-level; postId for replies   |
| content       | String   |      | Text content of the post                 |
| videoUrl      | String   |      | S3 URL if video post; null otherwise     |
| wordCount     | Number   |      | Computed on write for validation         |
| createdAt     | String   |      | ISO 8601 timestamp                       |
| updatedAt     | String   |      | ISO 8601 timestamp                       |

**GSI: DiscussionIdIndex** — `discussionId` (PK), `createdAt` (SK) — enables querying all posts for a discussion ordered by time.

```typescript
interface DiscussionPost {
  postId: string;
  discussionId: string;
  authorId: string;
  parentPostId: string | null;
  content: string;
  videoUrl: string | null;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### 2.3 classcast-discussion-groups

| Attribute     | Type       | Key  | Description                              |
|---------------|------------|------|------------------------------------------|
| groupId       | String     | PK   | UUID, unique group identifier            |
| discussionId  | String     | GSI  | Links to assignment's assignmentId       |
| studentIds    | StringSet  |      | Set of student user IDs in this group    |
| groupSize     | Number     |      | Target group size (for reference)        |

**GSI: DiscussionIdIndex** — `discussionId` (PK) — enables fetching all groups for a discussion.

```typescript
interface DiscussionGroup {
  groupId: string;
  discussionId: string;
  studentIds: string[];
  groupSize: number;
}
```


### 2.4 Assessment Questions (embedded in assignment record)

Assessment questions are stored as a JSON array on the assignment record (`assessmentQuestions` field) because they are always accessed together with the assignment and never queried independently. This avoids an extra table read on every student load.

```typescript
// Stored as assessmentQuestions[] on the assignment record
interface AssessmentQuestion {
  questionId: string;          // UUID
  questionText: string;        // up to 2000 chars
  timeLimitSeconds: number;    // 15–300
  orderIndex: number;          // 0-based position
}
```

### 2.5 classcast-assessment-sessions

| Attribute           | Type       | Key  | Description                                     |
|---------------------|------------|------|-------------------------------------------------|
| sessionId           | String     | PK   | UUID, unique session identifier                 |
| assessmentId        | String     | GSI  | Links to assignment's assignmentId              |
| studentId           | String     |      | Student who took the assessment                 |
| videoUrl            | String     |      | S3 URL of continuous recording                  |
| questionTimestamps  | List       |      | Array of {questionId, timestampSeconds}         |
| integrityEvents     | List       |      | Array of {type, timestampSeconds, description}  |
| status              | String     |      | 'in-progress' | 'completed' | 'reset'           |
| startedAt           | String     |      | ISO 8601 when session began                     |
| completedAt         | String     |      | ISO 8601 when session ended (null if active)    |
| gradingData         | Map        |      | Per-question scores and feedback                |

**GSI: AssessmentIdIndex** — `assessmentId` (PK), `studentId` (SK) — enables querying all sessions for an assessment and looking up a specific student's session.

```typescript
interface AssessmentSession {
  sessionId: string;
  assessmentId: string;
  studentId: string;
  videoUrl: string | null;
  questionTimestamps: QuestionTimestamp[];
  integrityEvents: IntegrityEvent[];
  status: 'in-progress' | 'completed' | 'reset';
  startedAt: string;
  completedAt: string | null;
  gradingData: AssessmentGradingData | null;
}

interface QuestionTimestamp {
  questionId: string;
  timestampSeconds: number;
}

interface IntegrityEvent {
  type: 'camera-lost' | 'tab-navigation' | 'camera-restored';
  timestampSeconds: number;
  description: string;
}

interface AssessmentGradingData {
  questionScores: Record<string, number>;  // { [questionId]: score }
  totalScore: number;
  gradedAt: string;
  gradedBy: string;
}
```


### 2.6 classcast-module-groups

| Attribute           | Type       | Key  | Description                                     |
|---------------------|------------|------|-------------------------------------------------|
| groupId             | String     | PK   | UUID, unique group identifier                   |
| moduleAssignmentId  | String     | GSI  | Links to assignment's assignmentId              |
| studentIds          | StringSet  |      | Set of student user IDs in this group           |
| groupSize           | Number     |      | Target group size                               |
| formationMethod     | String     |      | 'random' | 'manual' | 'self-selection'          |

**GSI: ModuleAssignmentIdIndex** — `moduleAssignmentId` (PK) — fetch all groups for a module assignment.

```typescript
interface ModuleGroup {
  groupId: string;
  moduleAssignmentId: string;
  studentIds: string[];
  groupSize: number;
  formationMethod: 'random' | 'manual' | 'self-selection';
}
```

### 2.7 classcast-module-lessons

| Attribute           | Type     | Key  | Description                                     |
|---------------------|----------|------|-------------------------------------------------|
| lessonId            | String   | PK   | UUID, unique lesson identifier                  |
| moduleSubmissionId  | String   | GSI  | Links to the group's submission record          |
| title               | String   |      | Lesson title                                    |
| description         | String   |      | Lesson description                              |
| videoUrl            | String   |      | S3 URL of uploaded video                        |
| authorId            | String   |      | Student who recorded/uploaded this lesson        |
| orderIndex          | Number   |      | Position in the lesson sequence (0-based)       |
| duration            | Number   |      | Video duration in seconds                       |
| createdAt           | String   |      | ISO 8601 timestamp                              |

**GSI: ModuleSubmissionIdIndex** — `moduleSubmissionId` (PK), `orderIndex` (SK) — fetch lessons in order.

```typescript
interface ModuleLesson {
  lessonId: string;
  moduleSubmissionId: string;
  title: string;
  description: string;
  videoUrl: string;
  authorId: string;
  orderIndex: number;
  duration: number;
  createdAt: string;
}
```


---

## 3. API Endpoints

All routes follow the existing Next.js 14 App Router pattern (`src/app/api/...`). Authentication uses the same session cookie mechanism already in place.

### 3.1 Discussion Board APIs

#### POST `/api/discussions/[discussionId]/posts`
Create a new discussion post.

```typescript
// Request body
interface CreatePostRequest {
  authorId: string;
  parentPostId: string | null;  // null = top-level post
  content: string;
  videoUrl?: string;            // if video post
}

// Response
interface CreatePostResponse {
  success: boolean;
  data: { post: DiscussionPost };
}
```

**Validation:**
- Reject if discussion is past due date
- Reject text posts below minimum word count
- Reject video posts exceeding 120s duration

#### GET `/api/discussions/[discussionId]/posts`
List all posts for a discussion (filtered by group for small-group format).

```typescript
// Query params: ?studentId=xxx (used to determine group membership)
// Response
interface ListPostsResponse {
  success: boolean;
  data: {
    posts: DiscussionPost[];
    participationSummary: {
      studentId: string;
      postCount: number;
      totalWordCount: number;
      requirementsMet: boolean;
    };
  };
}
```

#### POST `/api/discussions/[discussionId]/groups`
Create random group assignments for a small-group discussion.

```typescript
// Request body
interface CreateGroupsRequest {
  courseId: string;
  groupSize: number;
}

// Response
interface CreateGroupsResponse {
  success: boolean;
  data: { groups: DiscussionGroup[] };
}
```

#### GET `/api/discussions/[discussionId]/groups/[groupId]`
Get posts for a specific group.

```typescript
interface GroupPostsResponse {
  success: boolean;
  data: {
    group: DiscussionGroup;
    posts: DiscussionPost[];
  };
}
```


### 3.2 Assessment APIs

#### POST `/api/assessments/[assessmentId]/sessions`
Start a new assessment session. Validates single-attempt constraint.

```typescript
// Request body
interface StartSessionRequest {
  studentId: string;
}

// Response
interface StartSessionResponse {
  success: boolean;
  data: {
    session: AssessmentSession;
    questions: AssessmentQuestion[];  // revealed only at session start
  };
}
```

**Validation:**
- Reject if student already has a 'completed' session (single attempt)
- Reject if assessment is past due date
- Create session with status 'in-progress'

#### PUT `/api/assessments/[assessmentId]/sessions/[sessionId]`
Complete a session: upload video URL, timestamps, and integrity events.

```typescript
// Request body
interface CompleteSessionRequest {
  videoUrl: string;
  questionTimestamps: QuestionTimestamp[];
  integrityEvents: IntegrityEvent[];
  status: 'completed';
  completedAt: string;
}

// Response
interface CompleteSessionResponse {
  success: boolean;
  data: { session: AssessmentSession };
}
```

#### GET `/api/assessments/[assessmentId]/sessions`
List all sessions for instructor review.

```typescript
// Query params: ?studentId=xxx (optional filter)
interface ListSessionsResponse {
  success: boolean;
  data: {
    sessions: AssessmentSession[];
  };
}
```

#### POST `/api/assessments/[assessmentId]/reset/[studentId]`
Reset a student's assessment attempt (instructor only).

```typescript
// Response
interface ResetSessionResponse {
  success: boolean;
  message: string;
}
```

**Action:** Sets existing session status to 'reset', allowing student to start fresh.


### 3.3 Module Assignment APIs

#### POST `/api/modules/[moduleId]/lessons`
Add a video lesson to the module submission.

```typescript
// Request body
interface AddLessonRequest {
  title: string;
  description: string;
  videoUrl: string;
  authorId: string;
  duration: number;
  orderIndex: number;
}

// Response
interface AddLessonResponse {
  success: boolean;
  data: { lesson: ModuleLesson };
}
```

#### GET `/api/modules/[moduleId]/lessons`
List all lessons for a module submission.

```typescript
interface ListLessonsResponse {
  success: boolean;
  data: {
    lessons: ModuleLesson[];
    progress: {
      totalRequired: number;
      totalUploaded: number;
      readyToSubmit: boolean;
    };
  };
}
```

#### POST `/api/modules/[moduleId]/groups`
Form student groups for the module assignment.

```typescript
// Request body
interface FormGroupsRequest {
  courseId: string;
  groupSize: number;
  formationMethod: 'random' | 'manual' | 'self-selection';
  manualGroups?: string[][];  // only for manual formation
}

// Response
interface FormGroupsResponse {
  success: boolean;
  data: { groups: ModuleGroup[] };
}
```

#### POST `/api/modules/[moduleId]/submit`
Final submission of the module by a group member.

```typescript
// Request body
interface SubmitModuleRequest {
  groupId: string;
  submittedBy: string;  // studentId confirming submission
}

// Response
interface SubmitModuleResponse {
  success: boolean;
  data: {
    submissionId: string;
    submittedAt: string;
  };
}
```

**Validation:**
- Reject if required video count not met
- Reject if past due date
- Creates/updates a record in `classcast-submissions` with all lesson references


---

## 4. Student-Facing Components

### 4.1 DiscussionBoardView

**Path:** `src/components/discussions/DiscussionBoardView.tsx`

Renders the full discussion board for a student. Shows the instructor prompt at the top, followed by threaded posts. For small-group discussions, filters to only show the student's group.

```typescript
interface DiscussionBoardViewProps {
  assignmentId: string;
  studentId: string;
  discussionConfig: DiscussionConfig;
}
```

**Behavior:**
- Fetches posts via `GET /api/discussions/[discussionId]/posts?studentId=xxx`
- Renders posts as a flat list with indentation for replies (parentPostId nesting)
- Shows participation progress bar (e.g., "2/3 posts required")
- Disables post creation if past due date
- Displays video posts with inline `<video>` player

### 4.2 DiscussionPostComposer

**Path:** `src/components/discussions/DiscussionPostComposer.tsx`

Input component for creating text and/or video posts.

```typescript
interface DiscussionPostComposerProps {
  discussionId: string;
  authorId: string;
  parentPostId: string | null;
  allowedTypes: 'text' | 'video' | 'both';
  minWordCount: number;
  maxVideoDuration: number;
  onPostCreated: (post: DiscussionPost) => void;
}
```

**Behavior:**
- Text mode: textarea with live word count indicator
- Video mode: triggers Capacitor camera recording (reuses existing camera utilities)
- Validates word count before submission
- Uploads video to S3 via presigned URL, then submits post with videoUrl
- Shows validation errors inline

### 4.3 AssessmentStartScreen

**Path:** `src/components/assessments/AssessmentStartScreen.tsx`

Pre-assessment screen showing instructions and camera permission request.

```typescript
interface AssessmentStartScreenProps {
  assignmentId: string;
  studentId: string;
  title: string;
  questionCount: number;
  totalDurationSeconds: number;
  hasExistingAttempt: boolean;
  onStart: () => void;
}
```

**Behavior:**
- Displays: number of questions, total time, framing requirements
- Requests camera permission via Capacitor/browser API
- Shows camera preview for student to verify framing
- "Start Assessment" button disabled until camera is active
- If `hasExistingAttempt`, shows "Assessment already submitted" message instead


### 4.4 AssessmentRecordingView

**Path:** `src/components/assessments/AssessmentRecordingView.tsx`

The active assessment recording experience. Full-screen camera feed with question overlay.

```typescript
interface AssessmentRecordingViewProps {
  sessionId: string;
  assessmentId: string;
  studentId: string;
  questions: AssessmentQuestion[];
  onComplete: (data: {
    videoBlob: Blob;
    questionTimestamps: QuestionTimestamp[];
    integrityEvents: IntegrityEvent[];
  }) => void;
}
```

**Layout:**
```
┌──────────────────────────────────────┐
│  [Camera Feed - Full Width]          │
│                                      │
│  ┌─── Framing Guide (dashed) ───┐   │
│  │                               │   │
│  │   Upper body visible area     │   │
│  │                               │   │
│  └───────────────────────────────┘   │
│                                      │
│  ┌───────────────────────────────┐   │
│  │ Q3/5: "Explain the concept..."│   │
│  │              0:45             │   │
│  └───────────────────────────────┘   │
└──────────────────────────────────────┘
```

**Behavior:**
- Starts MediaRecorder on mount, records continuously
- Displays current question text + countdown timer
- Auto-advances to next question when timer hits 0
- Records `QuestionTimestamp` each time a new question appears
- Monitors `visibilitychange` and MediaStream track events for integrity
- On final question timer expiry: stops recording, triggers upload flow
- No pause/skip/restart controls available

### 4.5 ModuleWorkspace

**Path:** `src/components/modules/ModuleWorkspace.tsx`

Collaborative workspace for group module creation.

```typescript
interface ModuleWorkspaceProps {
  assignmentId: string;
  studentId: string;
  groupId: string;
  moduleConfig: ModuleConfig;
}
```

**Behavior:**
- Shows group members list with online/offline indicators
- Displays lesson list with drag-and-drop reordering (react-beautiful-dnd or similar)
- Each lesson card shows: thumbnail, title, author name, duration
- "Add Video" button triggers camera recording or file upload
- Progress indicator: "3/5 videos uploaded"
- "Submit Module" button enabled only when all required videos are present
- Only the uploader can delete their own lesson


---

## 5. Instructor-Facing Components

### 5.1 Discussion Board Wizard Steps

**Path:** `src/components/instructor/wizards/DiscussionSetupWizard.tsx`

Multi-step wizard embedded within the existing assignment creation flow.

**Steps:**
1. **Prompt & Format** — Textarea for prompt (min 10 chars), format selector (whole-class/small-groups), group size slider (3–10, shown only for small-groups)
2. **Participation Rules** — Min posts (default 2), min word count (default 50)
3. **Response Settings** — Radio: text only / video only / text and video (default: both)
4. **Rubric** — Reuses existing `<RubricBuilder />` component
5. **Review** — Summary of all settings with back-navigation

### 5.2 Assessment Setup Wizard

**Path:** `src/components/instructor/wizards/AssessmentSetupWizard.tsx`

**Steps:**
1. **Assessment Info** — Title, description, student instructions
2. **Question Builder** — Interactive list with add/edit/reorder/delete
3. **Rubric** — Reuses existing `<RubricBuilder />` component
4. **Review** — All questions listed with times, total duration shown

#### Question Builder Interface

```typescript
interface QuestionBuilderProps {
  questions: AssessmentQuestion[];
  onChange: (questions: AssessmentQuestion[]) => void;
}
```

**Features:**
- Add question button appends with default 60s timer
- Inline editing of question text (textarea) and time limit (number input)
- Drag-and-drop or up/down arrow reordering
- Delete button with confirmation
- Real-time total duration display: `Total: 4m 30s (5 questions)`
- Prevents submission with 0 questions

### 5.3 Assessment Review Player

**Path:** `src/components/instructor/AssessmentReviewPlayer.tsx`

Video player with question timestamp navigation.

```typescript
interface AssessmentReviewPlayerProps {
  session: AssessmentSession;
  questions: AssessmentQuestion[];
  onGradeQuestion: (questionId: string, score: number) => void;
}
```

**Features:**
- Video player with custom timeline showing question markers
- Clickable markers jump to question start time
- Question panel beside video shows current question text
- Per-question grading input (uses rubric categories if attached)
- Integrity event indicators (red markers) on timeline
- Summary panel showing all integrity events with timestamps

### 5.4 Module Review Interface

**Path:** `src/components/instructor/ModuleReviewInterface.tsx`

Sequential video player for module submissions.

```typescript
interface ModuleReviewInterfaceProps {
  lessons: ModuleLesson[];
  groupMembers: { id: string; name: string }[];
  gradingPolicy: 'shared' | 'individual';
  onGrade: (grades: Record<string, number>) => void;
}
```

**Features:**
- Playlist view: all videos in sequence with auto-advance
- Shows lesson title, description, author attribution per video
- Shared grading: single rubric evaluation for the whole module
- Individual grading: separate score input per group member
- Integrates with existing `RubricGradingPanel` component


---

## 6. Key Algorithms

### 6.1 Random Group Assignment

Used for both Discussion Board small-groups and Module random assignment.

```typescript
function assignRandomGroups(
  studentIds: string[],
  targetGroupSize: number
): string[][] {
  // 1. Shuffle students using Fisher-Yates
  const shuffled = [...studentIds];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // 2. Calculate number of full groups
  const totalStudents = shuffled.length;
  const numGroups = Math.floor(totalStudents / targetGroupSize);

  // 3. Create groups
  const groups: string[][] = [];
  for (let i = 0; i < numGroups; i++) {
    groups.push(shuffled.slice(i * targetGroupSize, (i + 1) * targetGroupSize));
  }

  // 4. Distribute remainders evenly across existing groups
  const remainder = shuffled.slice(numGroups * targetGroupSize);
  remainder.forEach((studentId, index) => {
    groups[index % groups.length].push(studentId);
  });

  // Result: no group exceeds targetGroupSize + 1
  return groups;
}
```

**Edge cases:**
- If `totalStudents < targetGroupSize`: create a single group with all students
- If `totalStudents === 0`: return empty array

### 6.2 Assessment Timer Logic

The countdown timer runs entirely client-side for responsiveness. Server validates total elapsed time on submission.

```typescript
function useAssessmentTimer(
  questions: AssessmentQuestion[],
  onQuestionChange: (index: number, timestampSec: number) => void,
  onComplete: () => void
) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(
    questions[0].timeLimitSeconds
  );
  const sessionStartRef = useRef<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          // Time's up for current question
          const nextIndex = currentQuestionIndex + 1;
          const elapsedSec = (Date.now() - sessionStartRef.current) / 1000;

          if (nextIndex >= questions.length) {
            clearInterval(interval);
            onComplete();
            return 0;
          }

          setCurrentQuestionIndex(nextIndex);
          onQuestionChange(nextIndex, elapsedSec);
          return questions[nextIndex].timeLimitSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestionIndex]);

  return { currentQuestionIndex, remainingSeconds };
}
```


### 6.3 Integrity Event Detection

Monitors for camera loss and tab navigation during an active assessment session.

```typescript
function useIntegrityMonitor(
  mediaStream: MediaStream | null,
  sessionStartTime: number
): IntegrityEvent[] {
  const [events, setEvents] = useState<IntegrityEvent[]>([]);

  useEffect(() => {
    if (!mediaStream) return;

    // Monitor camera track
    const videoTrack = mediaStream.getVideoTracks()[0];
    const handleTrackEnded = () => {
      const ts = (Date.now() - sessionStartTime) / 1000;
      setEvents((prev) => [...prev, {
        type: 'camera-lost',
        timestampSeconds: ts,
        description: 'Camera feed was interrupted'
      }]);
    };
    videoTrack?.addEventListener('ended', handleTrackEnded);

    // Monitor mute/unmute (camera covered or disabled)
    const handleMute = () => {
      const ts = (Date.now() - sessionStartTime) / 1000;
      setEvents((prev) => [...prev, {
        type: 'camera-lost',
        timestampSeconds: ts,
        description: 'Camera feed was muted/covered'
      }]);
    };
    const handleUnmute = () => {
      const ts = (Date.now() - sessionStartTime) / 1000;
      setEvents((prev) => [...prev, {
        type: 'camera-restored',
        timestampSeconds: ts,
        description: 'Camera feed restored'
      }]);
    };
    videoTrack?.addEventListener('mute', handleMute);
    videoTrack?.addEventListener('unmute', handleUnmute);

    // Monitor tab visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const ts = (Date.now() - sessionStartTime) / 1000;
        setEvents((prev) => [...prev, {
          type: 'tab-navigation',
          timestampSeconds: ts,
          description: 'Student navigated away from assessment tab'
        }]);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      videoTrack?.removeEventListener('ended', handleTrackEnded);
      videoTrack?.removeEventListener('mute', handleMute);
      videoTrack?.removeEventListener('unmute', handleUnmute);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [mediaStream, sessionStartTime]);

  return events;
}
```

### 6.4 Question Timestamp Recording

Timestamps are recorded client-side relative to the MediaRecorder start time. Each time the timer auto-advances to the next question, we record the elapsed seconds from recording start.

```typescript
function recordQuestionTimestamp(
  recordingStartTime: number,
  questionId: string
): QuestionTimestamp {
  return {
    questionId,
    timestampSeconds: (Date.now() - recordingStartTime) / 1000
  };
}
```

The first question timestamp is always `{ questionId: questions[0].questionId, timestampSeconds: 0 }`.


---

## 7. Integration Points

### 7.1 Assignment Type Flow Through Existing CRUD

The existing assignment pipeline already handles the extended type. Here's how the new types flow:

1. **Creation:** The `POST /api/assignments` endpoint already persists arbitrary fields. New type-specific fields (`discussionConfig`, `assessmentQuestions`, `moduleConfig`) are stored directly on the assignment record. The existing `fieldMapping` in the PUT handler needs to be extended to include these new fields.

2. **Assignment List:** The student/instructor dashboards already display assignments by `courseId`. The `assignmentType` field is used to render the correct icon and route to the correct detail view.

3. **Detail View Routing:**
   ```
   /student/assignments/[id] → checks assignmentType:
     'video'      → existing VideoSubmissionView
     'discussion' → DiscussionBoardView
     'assessment' → AssessmentStartScreen (or completed view)
     'module'     → ModuleWorkspace
   ```

4. **Update:** The existing `PUT /api/assignments/[assignmentId]` endpoint's `fieldMapping` needs these additions:
   ```typescript
   discussionConfig: 'discussionConfig',
   assessmentQuestions: 'assessmentQuestions',
   moduleConfig: 'moduleConfig',
   ```

### 7.2 Grading Integration with RubricGradingPanel

All three types integrate with the existing `RubricGradingPanel` component and `SubmissionRubricGrade` type:

- **Discussion Boards:** Instructor grades per-student participation. The grade is stored in `classcast-submissions` with `gradingMethod: 'rubric'` and `rubricScores` mapped to rubric category IDs.

- **Assessments:** Per-question grading maps to rubric categories (one category per question, or a custom mapping). The `AssessmentGradingData.questionScores` feeds into the same `SubmissionRubricGrade` interface.

- **Modules:** Shared grading creates identical `SubmissionRubricGrade` records for all group members. Individual grading creates separate records.

### 7.3 Video Upload — Reusing S3 Presigned URL Infrastructure

All video uploads in the new features use the existing presigned URL flow:

```
Client → GET/POST /api/upload/presigned → receives presignedUrl + fileKey
Client → PUT presignedUrl (direct S3 upload with video/webm content)
Client → stores fileUrl in the relevant record (post, session, lesson)
```

**S3 key structure for new features:**
```
discussions/{discussionId}/{postId}_{authorId}_{timestamp}.webm
assessments/{assessmentId}/{sessionId}_{studentId}_{timestamp}.webm
modules/{moduleAssignmentId}/{lessonId}_{authorId}_{timestamp}.webm
```

**Bucket:** `classcast-videos-463470937777-us-east-1` (same as existing video submissions)

For assessment recordings (potentially long), the large file upload path (`/api/upload/large-file` with presigned URL for 100MB+ files, or multipart for 500MB+) is available. Typical assessment recordings (5–15 minutes at 720p) will be 50–150MB, fitting the single presigned URL path.

### 7.4 Capacitor Native Camera Integration

Video recording for discussions and assessments uses the same Capacitor camera APIs used in existing video assignments:

- **iOS/Android:** `@capacitor/camera` plugin for permissions + `MediaRecorder` API via web view
- **Web (desktop):** `navigator.mediaDevices.getUserMedia()` + `MediaRecorder`
- The `AssessmentRecordingView` needs continuous recording (no stop/restart), which uses `MediaRecorder` in `videoBitsPerSecond: 2500000` (720p quality) mode
- Discussion video posts use the same recording flow but with a 120-second max duration enforced client-side

---

## 8. DynamoDB Table Provisioning

New tables to create via AWS CLI or IaC:

```bash
# classcast-discussion-posts
aws dynamodb create-table \
  --table-name classcast-discussion-posts \
  --attribute-definitions \
    AttributeName=postId,AttributeType=S \
    AttributeName=discussionId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema AttributeName=postId,KeyType=HASH \
  --global-secondary-indexes \
    IndexName=DiscussionIdIndex,KeySchema=[{AttributeName=discussionId,KeyType=HASH},{AttributeName=createdAt,KeyType=RANGE}],Projection={ProjectionType=ALL} \
  --billing-mode PAY_PER_REQUEST

# classcast-discussion-groups
aws dynamodb create-table \
  --table-name classcast-discussion-groups \
  --attribute-definitions \
    AttributeName=groupId,AttributeType=S \
    AttributeName=discussionId,AttributeType=S \
  --key-schema AttributeName=groupId,KeyType=HASH \
  --global-secondary-indexes \
    IndexName=DiscussionIdIndex,KeySchema=[{AttributeName=discussionId,KeyType=HASH}],Projection={ProjectionType=ALL} \
  --billing-mode PAY_PER_REQUEST

# classcast-assessment-sessions
aws dynamodb create-table \
  --table-name classcast-assessment-sessions \
  --attribute-definitions \
    AttributeName=sessionId,AttributeType=S \
    AttributeName=assessmentId,AttributeType=S \
    AttributeName=studentId,AttributeType=S \
  --key-schema AttributeName=sessionId,KeyType=HASH \
  --global-secondary-indexes \
    IndexName=AssessmentIdIndex,KeySchema=[{AttributeName=assessmentId,KeyType=HASH},{AttributeName=studentId,KeyType=RANGE}],Projection={ProjectionType=ALL} \
  --billing-mode PAY_PER_REQUEST

# classcast-module-groups
aws dynamodb create-table \
  --table-name classcast-module-groups \
  --attribute-definitions \
    AttributeName=groupId,AttributeType=S \
    AttributeName=moduleAssignmentId,AttributeType=S \
  --key-schema AttributeName=groupId,KeyType=HASH \
  --global-secondary-indexes \
    IndexName=ModuleAssignmentIdIndex,KeySchema=[{AttributeName=moduleAssignmentId,KeyType=HASH}],Projection={ProjectionType=ALL} \
  --billing-mode PAY_PER_REQUEST

# classcast-module-lessons
aws dynamodb create-table \
  --table-name classcast-module-lessons \
  --attribute-definitions \
    AttributeName=lessonId,AttributeType=S \
    AttributeName=moduleSubmissionId,AttributeType=S \
    AttributeName=orderIndex,AttributeType=N \
  --key-schema AttributeName=lessonId,KeyType=HASH \
  --global-secondary-indexes \
    IndexName=ModuleSubmissionIdIndex,KeySchema=[{AttributeName=moduleSubmissionId,KeyType=HASH},{AttributeName=orderIndex,KeyType=RANGE}],Projection={ProjectionType=ALL} \
  --billing-mode PAY_PER_REQUEST
```

---

## 9. File Structure (New Files)

```
src/
├── app/api/
│   ├── discussions/
│   │   └── [discussionId]/
│   │       ├── posts/route.ts
│   │       └── groups/
│   │           ├── route.ts
│   │           └── [groupId]/route.ts
│   ├── assessments/
│   │   └── [assessmentId]/
│   │       ├── sessions/
│   │       │   ├── route.ts
│   │       │   └── [sessionId]/route.ts
│   │       └── reset/
│   │           └── [studentId]/route.ts
│   └── modules/
│       └── [moduleId]/
│           ├── lessons/route.ts
│           ├── groups/route.ts
│           └── submit/route.ts
├── components/
│   ├── discussions/
│   │   ├── DiscussionBoardView.tsx
│   │   ├── DiscussionPostComposer.tsx
│   │   ├── DiscussionThread.tsx
│   │   └── ParticipationProgress.tsx
│   ├── assessments/
│   │   ├── AssessmentStartScreen.tsx
│   │   ├── AssessmentRecordingView.tsx
│   │   ├── AssessmentTimer.tsx
│   │   ├── FramingGuide.tsx
│   │   └── IntegrityWarning.tsx
│   ├── modules/
│   │   ├── ModuleWorkspace.tsx
│   │   ├── LessonCard.tsx
│   │   └── LessonUploader.tsx
│   └── instructor/
│       ├── wizards/
│       │   ├── DiscussionSetupWizard.tsx
│       │   ├── AssessmentSetupWizard.tsx
│       │   ├── ModuleSetupWizard.tsx
│       │   └── QuestionBuilder.tsx
│       ├── AssessmentReviewPlayer.tsx
│       └── ModuleReviewInterface.tsx
└── types/
    ├── discussion.ts
    ├── assessment.ts
    └── module.ts
```
