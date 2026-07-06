# Requirements Document

## Introduction

The Instructor Mobile Portal feature brings the instructor experience on mobile devices to visual and interaction parity with the student portal. Currently, instructors on mobile see page content inside a bare `<div>` with no bottom navigation bar, no liquid glass indicators, no swipe transitions, and no branded header. This feature adds a floating glass tab bar, animated indicator, swipe navigation, page transitions, and the ClassCast branded header to the instructor mobile layout — reusing existing student portal infrastructure wherever possible.

## Glossary

- **Instructor_Layout**: The Next.js layout component at `src/app/instructor/layout.tsx` that wraps all instructor pages and conditionally renders sidebar (desktop) or mobile chrome.
- **Instructor_Tab_Bar**: A floating glass bottom navigation bar for instructor mobile pages, visually identical to the StudentTabBar, containing five tab buttons.
- **Liquid_Glass_Indicator**: An animated pill element that slides and morphs between active tabs inside the tab bar, driven by the `useLiquidGlass` hook.
- **Swipe_Navigation_Provider**: A context and gesture system that enables horizontal swipe between adjacent tab pages and exposes swipe progress to the indicator.
- **Transition_Container**: A wrapper component that applies CSS animations (cross-fade, drill-in/out, swipe-left/right) when navigating between pages.
- **Instructor_Header**: A branded header component displaying "ClassCast" in Grand Hotel cursive, the ClassCast logo, and the school logo — mirroring the StudentHeader.
- **Create_Modal**: A modal overlay triggered by the center tab action button that allows instructors to begin creating assignments, courses, or other content.
- **Tab_Page**: One of the four main instructor pages navigable via swipe and tab tap: Dashboard, Grading, Courses, Profile.
- **Mobile_Viewport**: A screen width that causes `useIsWideScreen` to return `isWide: false` (the existing breakpoint used by the instructor layout).
- **ClassCast_Theme**: The application's visual identity: white background, navy `#005587`, gold `#FFC72C`, Oswald font, `rounded-2xl` border radius.

## Requirements

### Requirement 1: Instructor Bottom Tab Bar

**User Story:** As an instructor on a mobile device, I want a floating glass bottom navigation bar, so that I can quickly navigate between instructor pages with a familiar mobile interface.

#### Acceptance Criteria

1. WHILE the viewport is a Mobile_Viewport, THE Instructor_Layout SHALL render the Instructor_Tab_Bar fixed to the bottom of the screen.
2. THE Instructor_Tab_Bar SHALL display five tab buttons in the following order: Dashboard (home icon), Grading (clipboard icon), Create (center action button), Courses (book icon), Profile (avatar).
3. WHEN the instructor taps the Dashboard tab, THE Instructor_Tab_Bar SHALL navigate to `/instructor/dashboard`.
4. WHEN the instructor taps the Grading tab, THE Instructor_Tab_Bar SHALL navigate to `/instructor/grading`.
5. WHEN the instructor taps the Create tab, THE Instructor_Tab_Bar SHALL open the Create_Modal without performing a page navigation.
6. WHEN the instructor taps the Courses tab, THE Instructor_Tab_Bar SHALL navigate to `/instructor/courses`.
7. WHEN the instructor taps the Profile tab, THE Instructor_Tab_Bar SHALL navigate to `/instructor/profile`.
8. THE Instructor_Tab_Bar SHALL apply the same glass morphism styling as the StudentTabBar: `rgba(255,255,255,0.15)` background, `blur(24px) saturate(180%)` backdrop filter, `1px solid rgba(255,255,255,0.25)` border, and `rounded-2xl` border radius.
9. THE Instructor_Tab_Bar SHALL highlight the active tab icon and label using the ClassCast_Theme navy color `#005587`.
10. WHILE the viewport is not a Mobile_Viewport, THE Instructor_Layout SHALL NOT render the Instructor_Tab_Bar.

### Requirement 2: Liquid Glass Indicator

**User Story:** As an instructor on a mobile device, I want an animated glass pill that slides between tabs, so that navigation feels fluid and polished.

#### Acceptance Criteria

1. WHILE the instructor is on a Tab_Page, THE Instructor_Tab_Bar SHALL display the Liquid_Glass_Indicator positioned behind the active tab.
2. WHEN the instructor taps a tab, THE Liquid_Glass_Indicator SHALL animate from the current tab position to the tapped tab position using a 450ms spring easing.
3. WHILE the instructor performs a horizontal swipe, THE Liquid_Glass_Indicator SHALL track the swipe progress by interpolating position and morph scale between the source and target tabs.
4. WHEN a swipe gesture is cancelled, THE Liquid_Glass_Indicator SHALL snap back to the source tab position within 200ms.
5. WHEN the instructor taps the Create tab, THE Liquid_Glass_Indicator SHALL animate to the center (Create) position before the Create_Modal opens, then return to the previous active tab position after the modal closes.

### Requirement 3: Swipe Navigation

**User Story:** As an instructor on a mobile device, I want to swipe horizontally between pages, so that I can navigate efficiently without always reaching for the tab bar.

#### Acceptance Criteria

1. WHILE the instructor is on a Tab_Page in the Mobile_Viewport, THE Swipe_Navigation_Provider SHALL enable horizontal swipe gestures.
2. THE Swipe_Navigation_Provider SHALL recognize swipe between the following Tab_Pages in order: Dashboard, Grading, Courses, Profile (skipping Create since it is a modal action).
3. WHEN the instructor swipes left on a Tab_Page, THE Swipe_Navigation_Provider SHALL navigate to the next Tab_Page in the defined order.
4. WHEN the instructor swipes right on a Tab_Page, THE Swipe_Navigation_Provider SHALL navigate to the previous Tab_Page in the defined order.
5. WHEN the instructor is on the first Tab_Page (Dashboard) and swipes right, THE Swipe_Navigation_Provider SHALL apply a rubber-band resistance effect and remain on the current page.
6. WHEN the instructor is on the last Tab_Page (Profile) and swipes left, THE Swipe_Navigation_Provider SHALL apply a rubber-band resistance effect and remain on the current page.
7. WHILE the instructor is swiping, THE Swipe_Navigation_Provider SHALL translate the current page content proportionally to the swipe displacement and reveal the target page preview.

### Requirement 4: ClassCast Branded Header

**User Story:** As an instructor on a mobile device, I want to see the ClassCast branded header, so that the experience looks consistent with the student portal and reinforces the app's identity.

#### Acceptance Criteria

1. WHILE the instructor is on a Tab_Page in the Mobile_Viewport, THE Instructor_Layout SHALL display the Instructor_Header at the top of the screen.
2. THE Instructor_Header SHALL display "ClassCast" in Grand Hotel cursive font with color `#005587`, the ClassCast logo image, and the school logo image — matching the StudentHeader layout.
3. WHEN the instructor navigates to a sub-route via drill-in, THE Instructor_Header SHALL remain visible during the exit animation and then hide on the sub-route page.
4. WHILE the viewport is not a Mobile_Viewport, THE Instructor_Layout SHALL NOT render the Instructor_Header.

### Requirement 5: Instructor Mobile Layout Integration

**User Story:** As an instructor on a mobile device, I want the header, content area, and tab bar composed correctly, so that pages display within the proper mobile shell without content overlap.

#### Acceptance Criteria

1. WHILE the viewport is a Mobile_Viewport, THE Instructor_Layout SHALL render components in the following vertical order: safe-area padding, Instructor_Header (when on a Tab_Page), Swipe_Navigation_Provider wrapping Transition_Container wrapping page content, and Instructor_Tab_Bar.
2. THE Instructor_Layout SHALL apply `paddingTop: env(safe-area-inset-top, 0px)` to the root container to respect device notch areas.
3. THE Instructor_Tab_Bar SHALL include a spacer element above itself to prevent page content from being hidden behind the fixed nav bar.
4. WHILE the viewport is not a Mobile_Viewport, THE Instructor_Layout SHALL continue to render the InstructorSidebar and bare main content area as it does currently.

### Requirement 6: Page Transitions

**User Story:** As an instructor on a mobile device, I want smooth animated transitions between pages, so that navigation feels native and spatial context is maintained.

#### Acceptance Criteria

1. WHEN the instructor switches between Tab_Pages via tab tap, THE Transition_Container SHALL apply a cross-fade animation (`animate-tab-enter`).
2. WHEN the instructor navigates from a Tab_Page to a sub-route, THE Transition_Container SHALL apply a drill-in push animation (`animate-drill-in-enter`).
3. WHEN the instructor navigates back from a sub-route to a Tab_Page, THE Transition_Container SHALL apply a drill-out animation (`animate-drill-out-enter`).
4. WHEN the instructor swipes to a new Tab_Page, THE Transition_Container SHALL apply the corresponding swipe animation (`animate-swipe-left-enter` or `animate-swipe-right-enter`).
5. THE Transition_Container SHALL force a component remount (via key change) only for drill-in and drill-out navigations.

### Requirement 7: Shared Component Extraction

**User Story:** As a developer, I want shared mobile components extracted from the student portal, so that both portals reuse the same code without duplication.

#### Acceptance Criteria

1. THE Liquid_Glass_Indicator component SHALL be usable by both the StudentTabBar and the Instructor_Tab_Bar without modification.
2. THE `useLiquidGlass` hook SHALL be usable by both the StudentTabBar and the Instructor_Tab_Bar without modification.
3. THE Swipe_Navigation_Provider SHALL accept a configurable tab order, so that instructor pages and student pages can define different swipeable routes.
4. THE Transition_Container SHALL function identically in both the student layout and the instructor layout without modification.
5. THE Instructor_Header SHALL reuse the same markup and styling as the StudentHeader, either by sharing a common component or by extracting a base component that both portals compose.
