# Requirements Document

## Introduction

ClassCast is a mobile-first educational LMS for high school students that was rejected by the Apple App Store for not supporting iPad screen sizes. This feature introduces a responsive multi-column layout for the student dashboard and navigation that makes effective use of wider screens (iPad, tablet, desktop) while preserving the existing mobile experience. The layout must pass iPad App Store review (tested on iPad Air 11-inch M3, screenshots at 2048×2732 or 2732×2048) and help students accomplish tasks more efficiently with the additional screen real estate.

## Glossary

- **Layout_System**: The responsive container and grid system that determines how content sections are arranged based on viewport width
- **Side_Navigation**: A persistent vertical navigation panel that replaces the mobile bottom tab bar on wider screens
- **Content_Panel**: The primary scrollable area displaying the main page content (assignments, videos, grades, etc.)
- **Detail_Panel**: An optional secondary panel that shows contextual detail (e.g., assignment detail, video player) alongside the content panel
- **Breakpoint**: A viewport width threshold that triggers a layout change (mobile < 768px, tablet 768–1024px, desktop > 1024px)
- **Dashboard_View**: The student home screen showing assignments, quick stats, and recent videos
- **Split_View**: A two-panel layout where the content list and detail view are shown side-by-side
- **ClassCast_Theme**: The existing brand styling — primary blue #005587, gold accent #FFC72C, Oswald headers, Grand Hotel cursive logo

## Requirements

### Requirement 1: Responsive Breakpoint Detection

**User Story:** As a student using an iPad or desktop, I want the app to detect my screen size and show an optimized layout, so that I get a proper wide-screen experience instead of a stretched phone layout.

#### Acceptance Criteria

1. WHEN the viewport width is 768px or greater, THE Layout_System SHALL render the tablet/desktop layout with Side_Navigation and multi-column content
2. WHEN the viewport width is below 768px, THE Layout_System SHALL render the existing mobile single-column layout with bottom tab navigation
3. THE Layout_System SHALL use CSS media queries or a responsive hook to detect viewport width without causing layout shift during initial render
4. WHEN the viewport is resized across a Breakpoint, THE Layout_System SHALL transition between layouts within 100ms without requiring a page reload

### Requirement 2: Side Navigation for Wide Screens

**User Story:** As a student on an iPad, I want a sidebar navigation instead of a bottom tab bar, so that I can access all sections easily and see where I am in the app.

#### Acceptance Criteria

1. WHILE the viewport width is 768px or greater, THE Side_Navigation SHALL display a persistent vertical navigation panel on the left side of the screen
2. THE Side_Navigation SHALL include navigation items for: Dashboard, Courses, Assignments, Grades, Profile, and Settings
3. THE Side_Navigation SHALL highlight the currently active navigation item with the ClassCast_Theme primary blue (#005587)
4. THE Side_Navigation SHALL display the ClassCast logo (Grand Hotel cursive) and school logo at the top
5. THE Side_Navigation SHALL display the student name and avatar at the bottom
6. THE Side_Navigation SHALL occupy a fixed width between 220px and 260px
7. WHILE the viewport width is 768px or greater, THE Layout_System SHALL hide the mobile bottom tab navigation

### Requirement 3: Multi-Column Dashboard Layout

**User Story:** As a student on an iPad, I want to see my assignments and video feed side-by-side, so that I can find what I need faster without scrolling through a long single column.

#### Acceptance Criteria

1. WHILE the viewport width is 768px or greater, THE Dashboard_View SHALL display content in a two-column layout: assignments on the left (approximately 55% width) and recent videos on the right (approximately 45% width)
2. THE Dashboard_View SHALL display quick stats (due this week count, submitted count) above both columns in a full-width row
3. WHEN assignments are displayed in the left column, THE Dashboard_View SHALL show up to 6 assignment cards in a scrollable list
4. WHEN videos are displayed in the right column, THE Dashboard_View SHALL show video thumbnails in a 2-column grid instead of a horizontal scroll
5. THE Dashboard_View SHALL preserve the existing assignment card design (colored backgrounds, Oswald headers, due-date badges)
6. THE Dashboard_View SHALL preserve the existing video card design (author avatar with gold border, star ratings, like counts)

### Requirement 4: Split-View Detail Navigation

**User Story:** As a student on an iPad, I want to tap an assignment and see its details alongside the list, so that I can quickly browse between assignments without losing my place.

#### Acceptance Criteria

1. WHILE the viewport width is 1024px or greater, THE Layout_System SHALL support a Split_View where tapping a list item opens its detail in a side panel rather than navigating to a new page
2. WHEN a student taps an assignment card in the assignments list, THE Detail_Panel SHALL display the assignment details (description, due date, submission status, instructional video) in the right panel
3. WHEN a student taps a video thumbnail, THE Detail_Panel SHALL display the video player with comments and ratings in the right panel
4. WHEN no item is selected in Split_View, THE Detail_Panel SHALL display a placeholder message encouraging the student to select an item
5. WHILE the viewport width is between 768px and 1023px, THE Layout_System SHALL navigate to the detail page as a full-screen push instead of Split_View

### Requirement 5: Theme and Visual Consistency

**User Story:** As a student, I want the iPad layout to feel like the same ClassCast app I use on my phone, so that the experience is familiar and cohesive.

#### Acceptance Criteria

1. THE Layout_System SHALL use the ClassCast_Theme primary blue (#005587) for headers, active navigation, and primary actions
2. THE Layout_System SHALL use the ClassCast_Theme gold (#FFC72C) as an accent for avatar borders, active indicators, and the record button
3. THE Layout_System SHALL use Oswald font for all section headers and assignment titles
4. THE Layout_System SHALL use Grand Hotel cursive font for the ClassCast logo text in the Side_Navigation
5. THE Layout_System SHALL maintain the existing gradient background (from-[#e8f4f8] via-white to-[#f0f9fc]) on the Content_Panel
6. THE Layout_System SHALL maintain rounded card styling (rounded-xl or rounded-2xl) consistent with the mobile design

### Requirement 6: iPad App Store Screenshot Compatibility

**User Story:** As the app developer, I want the layout to render correctly at iPad screenshot dimensions, so that the app passes Apple App Store review.

#### Acceptance Criteria

1. WHEN rendered at 2048×2732 pixels (portrait iPad), THE Layout_System SHALL display the Side_Navigation and multi-column Dashboard_View without clipping or overflow
2. WHEN rendered at 2732×2048 pixels (landscape iPad), THE Layout_System SHALL display the Side_Navigation and Split_View layout without clipping or overflow
3. THE Layout_System SHALL render all text at readable sizes (minimum 14px effective size at iPad resolution)
4. THE Layout_System SHALL render all touch targets at a minimum of 44×44 points as per Apple Human Interface Guidelines
5. THE Layout_System SHALL not display the desktop phone-frame wrapper (the gray background with centered phone mockup) when viewed on iPad-sized viewports

### Requirement 7: Record Video Action on Wide Screens

**User Story:** As a student on an iPad, I want a clear way to record a video assignment, so that the primary app action remains discoverable on wider screens.

#### Acceptance Criteria

1. WHILE the viewport width is 768px or greater, THE Side_Navigation SHALL include a prominent "Record" button styled with the ClassCast_Theme gold accent (#FFC72C) and a plus/camera icon
2. WHEN the student taps the Record button in the Side_Navigation, THE Layout_System SHALL display the assignment picker modal (same as mobile)
3. THE Record button SHALL be visually distinct from other navigation items to emphasize it as the primary action

### Requirement 8: Graceful Degradation for Intermediate Sizes

**User Story:** As a student using a variety of tablet sizes, I want the layout to adapt smoothly, so that nothing looks broken at any width.

#### Acceptance Criteria

1. WHILE the viewport width is between 768px and 1024px, THE Layout_System SHALL display the Side_Navigation in a compact mode (icons only, approximately 64px wide) with labels shown on hover or focus
2. WHILE the viewport width is greater than 1024px, THE Side_Navigation SHALL display full icon-and-label navigation items
3. THE Content_Panel SHALL use flexible widths (percentages or CSS flex/grid) that adapt to remaining space after the Side_Navigation
4. IF the viewport width is too narrow to display both columns of the Dashboard_View legibly (below 900px total), THEN THE Layout_System SHALL collapse to a single-column content layout with Side_Navigation still visible
