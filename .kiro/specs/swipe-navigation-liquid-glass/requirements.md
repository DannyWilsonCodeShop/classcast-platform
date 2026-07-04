# Requirements Document

## Introduction

Swipe Navigation with Liquid Glass extends ClassCast's student mobile experience with two complementary interaction enhancements: horizontal swipe gestures to navigate between main tab pages, and a fluid "liquid glass" morphing animation on the tab bar's active indicator. Together these deliver an iOS 26-style tactile navigation feel — users physically drag between pages and watch the glass indicator stretch and settle into its new position. All animations must sustain 60 fps in WKWebView using CSS-only transitions and transforms, with no JavaScript animation libraries.

## Glossary

- **Swipe_Engine**: The client-side module responsible for detecting horizontal touch gestures on the content area, calculating swipe progress, and triggering page navigation when thresholds are met.
- **Liquid_Glass_Indicator**: The animated active-tab pill element in the StudentTabBar that morphs fluidly between tab positions with a glass blur/refraction visual treatment.
- **StudentTabBar**: The fixed-position bottom navigation bar rendering five items: Home, Assignments, Post (center action button), Courses, Profile.
- **Tab_Page**: One of the four navigable main tab pages: Dashboard (/student/dashboard), Assignments (/student/assignments), Courses (/student/courses), Profile (/student/profile).
- **Swipe_Threshold**: The minimum horizontal distance (in pixels) or velocity a touch gesture must exceed to commit a page navigation.
- **Swipe_Progress**: A normalized value from 0 to 1 representing how far the user has swiped toward the next or previous Tab_Page.
- **Post_Button**: The center (index 2) item in the StudentTabBar that triggers a modal action and is excluded from swipe navigation sequencing.
- **TransitionContainer**: The existing layout component that applies CSS animations to page content during route changes.
- **Navigation_Direction_Detector**: The existing subsystem (useNavigationDirection hook) that classifies route changes for animation selection.
- **WKWebView**: The iOS WebKit rendering engine used by Capacitor to display the web app on iOS devices.
- **Tab_Order**: The sequential order of navigable tabs for swipe purposes: Dashboard (0) → Assignments (1) → Courses (2) → Profile (3). The Post_Button is excluded from this sequence.

## Requirements

### Requirement 1: Horizontal Swipe Gesture Detection

**User Story:** As a student, I want to swipe left or right on the content area to navigate between tab pages, so that switching between sections feels as natural as swiping between pages in iOS.

#### Acceptance Criteria

1. WHEN a horizontal touch gesture with a displacement exceeding the Swipe_Threshold is detected on the content area of a Tab_Page, THE Swipe_Engine SHALL initiate a navigation to the adjacent Tab_Page in the swipe direction.
2. WHEN a horizontal touch gesture has velocity exceeding 300 pixels per second in the swipe direction, THE Swipe_Engine SHALL commit the navigation regardless of displacement distance.
3. WHEN horizontal displacement exceeds the Swipe_Threshold (50 pixels minimum), THE Swipe_Engine SHALL commit the navigation regardless of velocity.
4. WHEN a swipe gesture does not meet either the displacement threshold or the velocity threshold, THE Swipe_Engine SHALL cancel the navigation and animate the content back to its original position.
5. WHILE the user is actively dragging horizontally, THE Swipe_Engine SHALL translate the current page content to follow the touch position proportionally.
6. THE Swipe_Engine SHALL distinguish horizontal swipes from vertical scrolls by requiring the horizontal displacement to exceed vertical displacement by a ratio of at least 1.5:1 before locking the gesture direction.

### Requirement 2: Swipe Navigation Scope and Tab Order

**User Story:** As a student, I want swipe navigation to only work between the main tab pages and skip the Post button, so that I can quickly move between sections without accidentally triggering unrelated actions.

#### Acceptance Criteria

1. THE Swipe_Engine SHALL limit swipe navigation to the four Tab_Pages in the following order: Dashboard → Assignments → Courses → Profile.
2. THE Swipe_Engine SHALL skip the Post_Button position when determining the next or previous tab for navigation, treating the tab sequence as Dashboard (0) ↔ Assignments (1) ↔ Courses (2) ↔ Profile (3).
3. WHEN the user is on the first tab (Dashboard) and swipes right (toward previous), THE Swipe_Engine SHALL not navigate and SHALL provide a rubber-band resistance effect.
4. WHEN the user is on the last tab (Profile) and swipes left (toward next), THE Swipe_Engine SHALL not navigate and SHALL provide a rubber-band resistance effect.
5. WHEN the current route is a sub-page (e.g., /student/assignments/[id]), THE Swipe_Engine SHALL not respond to horizontal swipe gestures.
6. THE Swipe_Engine SHALL determine whether the current route is a Tab_Page by comparing the pathname against the set of known Tab_Page paths.

### Requirement 3: Swipe Visual Feedback During Gesture

**User Story:** As a student, I want to see the page content moving with my finger during a swipe, so that the interaction feels direct and responsive.

#### Acceptance Criteria

1. WHILE a horizontal swipe gesture is in progress on a Tab_Page, THE Swipe_Engine SHALL translate the current page content horizontally by the touch displacement amount using CSS transforms.
2. WHILE a horizontal swipe gesture is in progress, THE Swipe_Engine SHALL reveal a preview of the destination page content on the incoming edge, translated from offscreen proportionally.
3. WHEN a swipe gesture is cancelled (thresholds not met), THE Swipe_Engine SHALL animate both the current and preview page content back to their resting positions within 200 milliseconds.
4. WHILE a swipe gesture is in progress, THE Swipe_Engine SHALL apply a damping factor of 0.5 to the translation when the gesture exceeds 80% of the screen width to indicate resistance.
5. THE Swipe_Engine SHALL calculate and update translation positions using requestAnimationFrame to avoid layout thrashing during the gesture.

### Requirement 4: Swipe-to-Tab-Bar Synchronization

**User Story:** As a student, I want the tab bar's active indicator and icon states to update as I swipe between pages, so that the navigation feels cohesive and the tab bar reflects where I am.

#### Acceptance Criteria

1. WHEN a swipe navigation commits and the route changes to a new Tab_Page, THE StudentTabBar SHALL update the active tab indicator to reflect the new active tab.
2. WHILE a swipe gesture is in progress, THE Liquid_Glass_Indicator SHALL translate its position proportionally between the source tab and destination tab positions based on Swipe_Progress.
3. WHEN a swipe gesture is cancelled, THE Liquid_Glass_Indicator SHALL animate back to the current active tab position within 200 milliseconds.
4. WHEN a tab is tapped directly in the StudentTabBar, THE Swipe_Engine SHALL not interfere with the existing tap navigation behavior.

### Requirement 5: Liquid Glass Indicator Animation on Tab Change

**User Story:** As a student, I want the tab bar's active indicator to animate smoothly between positions with a liquid glass morphing effect, so that the navigation feels premium and modern.

#### Acceptance Criteria

1. WHEN the active tab changes (via swipe or tap), THE Liquid_Glass_Indicator SHALL animate from the source tab position to the destination tab position using a CSS transition.
2. WHILE the Liquid_Glass_Indicator is animating between positions, THE Liquid_Glass_Indicator SHALL stretch horizontally (scale-x increase) during the first half of the animation and compress back to its resting width during the second half, creating a squish-and-settle morph effect.
3. THE Liquid_Glass_Indicator SHALL complete its position and morph animation within 400 to 500 milliseconds using a spring-like easing curve (cubic-bezier approximation of a damped spring).
4. THE Liquid_Glass_Indicator SHALL maintain its backdrop-filter blur (8px) and glass transparency styling throughout the animation without flickering or visual artifacts.
5. WHEN the Liquid_Glass_Indicator reaches its destination position, THE Liquid_Glass_Indicator SHALL apply a subtle scale overshoot (approximately 1.03x) followed by a settle-back to 1.0x scale to simulate a spring landing.

### Requirement 6: Liquid Glass Visual Treatment

**User Story:** As a student, I want the tab indicator to look like a floating glass element with depth and refraction, so that the UI feels aligned with modern iOS design language.

#### Acceptance Criteria

1. THE Liquid_Glass_Indicator SHALL render with a backdrop-filter blur of at least 8 pixels to create a frosted glass appearance over the tab bar background.
2. THE Liquid_Glass_Indicator SHALL render with a semi-transparent white background (between 25% and 40% opacity) that reveals blurred content beneath the pill.
3. THE Liquid_Glass_Indicator SHALL render with a subtle white inner border (1px, 30-50% opacity) to simulate glass edge refraction.
4. THE Liquid_Glass_Indicator SHALL render with a soft box-shadow to create a sense of elevation and depth separation from the tab bar surface.
5. THE Liquid_Glass_Indicator SHALL maintain its rounded-xl border-radius throughout all animation states without distortion.

### Requirement 7: Integration with Existing Transition System

**User Story:** As a developer, I want the swipe navigation to work with the existing TransitionContainer and useNavigationDirection hook, so that animation behavior remains consistent across swipe and tap navigation.

#### Acceptance Criteria

1. WHEN a swipe navigation commits, THE Swipe_Engine SHALL trigger a route change using Next.js router that the Navigation_Direction_Detector classifies as a Tab_Switch.
2. WHEN a swipe navigation commits, THE TransitionContainer SHALL use a horizontal slide animation (matching the swipe direction) instead of the default cross-fade for the page transition.
3. THE Swipe_Engine SHALL extend the existing useNavigationDirection hook to expose a new direction value of 'swipe-left' or 'swipe-right' when a swipe-initiated navigation occurs.
4. WHEN navigation is triggered by a direct tab tap (not swipe), THE TransitionContainer SHALL continue to use the existing cross-fade Tab_Switch animation.
5. THE Swipe_Engine SHALL not require modifications to existing router.push() calls in page components.

### Requirement 8: Performance Constraints

**User Story:** As a student using the iOS app, I want swipe gestures and glass animations to be smooth and jank-free, so that the interaction feels responsive and native.

#### Acceptance Criteria

1. THE Swipe_Engine SHALL use only CSS transform properties (translateX) for gesture-following translation to ensure GPU compositing in WKWebView.
2. THE Liquid_Glass_Indicator SHALL animate using only CSS transition properties (transform, left, width) to maintain GPU compositing.
3. THE Swipe_Engine SHALL maintain 60 frames per second during active swipe gestures on iPhone 12 and newer hardware.
4. THE Swipe_Engine SHALL NOT use JavaScript animation libraries (Framer Motion, GSAP, react-spring, or similar) for any gesture or indicator animations.
5. WHILE a swipe gesture is in progress, THE Swipe_Engine SHALL not trigger React re-renders for position updates — translation SHALL be applied directly to DOM element style properties via refs.
6. THE Liquid_Glass_Indicator SHALL not cause paint invalidation of elements outside the tab bar during its animation.
7. THE Swipe_Engine SHALL add touch-action: pan-y CSS to the swipeable content area to prevent the browser from consuming horizontal touch events for native scrolling.

### Requirement 9: Accessibility and Edge Cases

**User Story:** As a student, I want swipe navigation to coexist with other touch interactions without conflicts, so that horizontal scrollable content and other gestures still work correctly.

#### Acceptance Criteria

1. WHEN the content area contains a horizontally scrollable element (carousel, table) that is currently scrollable, THE Swipe_Engine SHALL defer to the scrollable element's scroll behavior and not initiate page navigation.
2. WHEN a swipe gesture begins within 20 pixels of the left or right screen edge, THE Swipe_Engine SHALL ignore the gesture to avoid conflict with iOS system back-swipe and edge gestures.
3. IF a touch event has its defaultPrevented flag set by a child element, THEN THE Swipe_Engine SHALL not process that event as a swipe gesture.
4. THE Swipe_Engine SHALL support pointer events in addition to touch events for compatibility with iPad trackpad gestures.
5. WHEN reduced-motion preferences are enabled (prefers-reduced-motion: reduce), THE Liquid_Glass_Indicator SHALL transition to new positions instantly without stretch or spring animations.
