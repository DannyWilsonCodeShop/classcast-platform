# Requirements Document

## Introduction

Page Transitions provides iOS-native-feeling animations between pages in ClassCast's student mobile experience. The feature covers four transition types — tab cross-fades, drill-in push/pop slides, shared-element morphs, and modal sheet presentations — coordinated with data-loading states so content is never revealed before it is ready. All animations must run at 60 fps in WKWebView (Capacitor iOS) using only CSS keyframe animations and GPU-accelerated transforms, without relying on the View Transitions API.

## Glossary

- **Transition_Engine**: The client-side module responsible for detecting navigation direction, selecting the correct animation, and orchestrating enter/exit keyframes for page content.
- **Tab_Switch**: A navigation event between sibling top-level pages accessed via the StudentTabBar (Dashboard, Assignments, Courses, Profile).
- **Drill_In**: A forward navigation from a parent page to a child detail page that pushes onto a logical navigation stack.
- **Drill_Out**: A backward navigation from a child detail page to its parent, popping the logical navigation stack.
- **Shared_Element_Transition**: An animation where a visual element on the source page morphs continuously into a corresponding element on the destination page.
- **Modal_Presentation**: A page or overlay that slides up from the bottom of the viewport over the current page content.
- **Navigation_Direction_Detector**: The subsystem that classifies each route change as a Tab_Switch, Drill_In, Drill_Out, or Modal_Presentation.
- **Loading_Gate**: A mechanism that holds the transition in a skeleton/placeholder state until the destination page's data query resolves successfully.
- **StudentTabBar**: The fixed-position bottom navigation component rendering tabs for Dashboard, Assignments, Courses, and Profile.
- **StudentHeader**: The shared header rendered in the student layout for main tab pages only.
- **WKWebView**: The iOS WebKit rendering engine used by Capacitor to display the web app on iOS devices.

## Requirements

### Requirement 1: Navigation Direction Detection

**User Story:** As a student, I want page transitions to match the type of navigation I performed, so that the app feels like a native iOS experience.

#### Acceptance Criteria

1. WHEN a route change occurs between any two paths in the set [/student/dashboard, /student/assignments, /student/courses, /student/profile], THE Navigation_Direction_Detector SHALL classify the navigation as a Tab_Switch.
2. WHEN a route change occurs from a parent path to a known child path (e.g., /student/assignments → /student/assignments/[id]), THE Navigation_Direction_Detector SHALL classify the navigation as a Drill_In.
3. WHEN a route change occurs from a child path back to its parent path, THE Navigation_Direction_Detector SHALL classify the navigation as a Drill_Out.
4. WHEN the browser or Capacitor back gesture/button triggers navigation, THE Navigation_Direction_Detector SHALL classify the navigation as a Drill_Out regardless of URL structure.
5. THE Navigation_Direction_Detector SHALL resolve the direction classification within 1 frame (16ms) of the route change event.

### Requirement 2: Tab Switch Transitions

**User Story:** As a student, I want tab switches to feel instant and non-directional, so that switching between main sections feels like iOS native tab bar behavior.

#### Acceptance Criteria

1. WHEN a Tab_Switch navigation occurs, THE Transition_Engine SHALL animate the outgoing page content with a fade-out and the incoming page content with a fade-in.
2. WHEN a Tab_Switch animation plays, THE Transition_Engine SHALL complete the full cross-fade within 150 to 200 milliseconds.
3. WHILE a Tab_Switch animation is in progress, THE Transition_Engine SHALL apply no horizontal translation to either the outgoing or incoming page content.
4. WHILE a Tab_Switch animation is in progress, THE StudentHeader SHALL remain stationary and visible without participating in the transition.
5. WHILE a Tab_Switch animation is in progress, THE StudentTabBar SHALL remain stationary and visible without participating in the transition.

### Requirement 3: Drill-In Transitions

**User Story:** As a student, I want forward navigation to feel like iOS push transitions, so that drilling into details feels natural and spatial.

#### Acceptance Criteria

1. WHEN a Drill_In navigation occurs, THE Transition_Engine SHALL animate the incoming page sliding in from the right edge of the viewport to its final position.
2. WHEN a Drill_In navigation occurs, THE Transition_Engine SHALL simultaneously animate the outgoing page translating slightly to the left (approximately 30% of viewport width) with reduced opacity.
3. WHEN a Drill_In animation plays, THE Transition_Engine SHALL complete the animation within 300 to 350 milliseconds using an ease-out timing function.
4. THE Transition_Engine SHALL apply Drill_In animations for the following navigation pairs: Dashboard → Assignment Detail, Dashboard → Peer Videos feed, Assignments list → Assignment Detail, Courses list → Course Detail, Assignment Detail → Peer Videos feed, Assignment Detail → Record/Upload, Course Detail → Assignment Detail.

### Requirement 4: Drill-Out Transitions

**User Story:** As a student, I want back navigation to reverse the push animation, so that returning to a parent page feels consistent and predictable.

#### Acceptance Criteria

1. WHEN a Drill_Out navigation occurs, THE Transition_Engine SHALL animate the outgoing page sliding out to the right edge of the viewport.
2. WHEN a Drill_Out navigation occurs, THE Transition_Engine SHALL simultaneously animate the incoming (parent) page translating from its offset position back to center with restored opacity.
3. WHEN a Drill_Out animation plays, THE Transition_Engine SHALL complete the animation within 300 to 350 milliseconds using an ease-in timing function.
4. WHEN the iOS swipe-back gesture is detected in WKWebView, THE Transition_Engine SHALL use the Drill_Out animation for that navigation.

### Requirement 5: Shared-Element Transitions

**User Story:** As a student, I want visual continuity between cards and their detail headers, so that large layout changes feel smooth rather than jarring.

#### Acceptance Criteria

1. WHEN navigating from a page containing an assignment card to Assignment Detail, THE Transition_Engine SHALL animate the card's background color element morphing into the Assignment Detail header bar.
2. WHEN navigating from Dashboard to Peer Videos feed where a video thumbnail is visible, THE Transition_Engine SHALL animate the thumbnail element expanding into the video player area on the destination page.
3. WHEN navigating from a page containing a course card to Course Detail, THE Transition_Engine SHALL animate the course card morphing into the Course Detail header gradient.
4. THE Transition_Engine SHALL calculate shared-element geometry (position and dimensions) from the source element's bounding rectangle at the moment of navigation.
5. WHEN a shared-element source is not visible in the viewport at navigation time, THE Transition_Engine SHALL fall back to a standard Drill_In animation.
6. THE Transition_Engine SHALL complete shared-element morph animations within 350 to 400 milliseconds using a cubic-bezier ease curve.

### Requirement 6: Modal Presentation Transitions

**User Story:** As a student, I want modals to slide up from the bottom like iOS sheets, so that overlays feel native and contextual.

#### Acceptance Criteria

1. WHEN a modal is presented (Post modal, Rubric modal, or Resources modal), THE Transition_Engine SHALL animate the modal sliding up from below the viewport to its final position.
2. WHEN a modal is presented, THE Transition_Engine SHALL simultaneously fade in a semi-transparent backdrop overlay.
3. WHEN a modal is dismissed, THE Transition_Engine SHALL animate the modal sliding down below the viewport while fading out the backdrop.
4. THE Transition_Engine SHALL complete modal enter and exit animations within 250 to 300 milliseconds.
5. WHILE a modal animation is in progress, THE Transition_Engine SHALL keep the underlying page content visible and stationary (no transform applied to the page).

### Requirement 7: Loading State Coordination

**User Story:** As a student, I want transitions to reveal real content only when it's ready, so that I never see a flash of empty or partially loaded content.

#### Acceptance Criteria

1. WHEN a navigation transition begins and the destination page uses react-query, THE Loading_Gate SHALL hold the skeleton/placeholder state visible until the query's isSuccess status is true.
2. WHEN the destination page's data resolves before the transition animation completes, THE Loading_Gate SHALL reveal content at the end of the animation duration.
3. WHEN the destination page's data has not resolved after the transition animation completes, THE Loading_Gate SHALL continue displaying the skeleton until isSuccess becomes true, then cross-fade to content within 150 milliseconds.
4. IF a destination page's data query fails (isError is true), THEN THE Loading_Gate SHALL display the page's error state instead of holding the skeleton indefinitely.
5. THE Loading_Gate SHALL coordinate with the existing react-query hooks (useStudentAssignments, useStudentFeed, useStudentCourses) without requiring changes to their query configuration.

### Requirement 8: Performance and Platform Constraints

**User Story:** As a student using the iOS app, I want transitions to be smooth and jank-free, so that the app feels as responsive as a native iOS application.

#### Acceptance Criteria

1. THE Transition_Engine SHALL use only CSS transform and opacity properties for animations to ensure GPU compositing on WKWebView.
2. THE Transition_Engine SHALL maintain 60 frames per second during all transition animations on iPhone hardware (iPhone 12 and newer).
3. THE Transition_Engine SHALL NOT use the View Transitions API, as WKWebView does not support this feature.
4. THE Transition_Engine SHALL NOT trigger layout reflow during active animations (no changes to width, height, top, left, margin, or padding during animation frames).
5. WHILE an animation is active, THE Transition_Engine SHALL promote animated elements to their own compositing layer using will-change or translateZ(0) hints.
6. THE Transition_Engine SHALL function correctly in both the Vercel-deployed web environment and the Capacitor WKWebView iOS environment.

### Requirement 9: Architecture Integration

**User Story:** As a developer, I want the transition system to integrate cleanly with the existing Next.js App Router architecture, so that adding transitions does not require restructuring the application.

#### Acceptance Criteria

1. THE Transition_Engine SHALL integrate at the layout level (src/app/student/layout.tsx) to intercept and animate route changes for all student pages.
2. THE Transition_Engine SHALL use CSS keyframe animations or a lightweight animation library compatible with React 19 and Next.js 15 App Router.
3. THE Transition_Engine SHALL detect navigation direction without requiring changes to existing router.push() calls in page components or the StudentTabBar.
4. WHEN a new student page is added to the application, THE Transition_Engine SHALL apply the appropriate default transition (Tab_Switch or Drill_In) based on route depth without requiring explicit configuration for the new page.
5. THE Transition_Engine SHALL not interfere with the existing wide-screen layout (WideScreenSidebar) which does not use page transitions.
