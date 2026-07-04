# Implementation Plan: Swipe Navigation with Liquid Glass

## Overview

This implementation adds horizontal swipe gesture navigation between student tab pages and a liquid glass morphing indicator to the StudentTabBar. The approach builds incrementally: core utility functions first, then the gesture engine hook, then the indicator hook, then the provider/component integration, and finally CSS and wiring.

## Tasks

- [x] 1. Add swipe navigation CSS and extend TransitionContainer
  - [x] 1.1 Add swipe keyframes, liquid glass styles, and utility classes to globals.css
    - Add `@keyframes swipeLeftEnter`, `swipeLeftExit`, `swipeRightEnter`, `swipeRightExit`
    - Add `.animate-swipe-left-enter`, `.animate-swipe-right-enter` animation classes
    - Add `.liquid-glass-indicator`, `.liquid-glass-indicator--animating`, `.liquid-glass-indicator--snapping` styles
    - Add `.swipe-content-area` (touch-action: pan-y), `.swipe-pane`, `.swipe-pane--current`, `.swipe-pane--preview` styles
    - Add `@media (prefers-reduced-motion: reduce)` overrides for all swipe/glass animations
    - _Requirements: 8.1, 8.7, 9.5_

  - [x] 1.2 Extend useNavigationDirection to support swipe-left and swipe-right directions
    - Add `'swipe-left' | 'swipe-right'` to the `NavigationDirection` type union
    - Add a module-level `swipeDirectionOverride` ref that the swipe engine can set before router.push
    - Modify `classifyNavigation` to check the override before standard classification, then clear it
    - Export a `setSwipeDirection` function that sets the override
    - _Requirements: 7.1, 7.3, 7.4_

  - [x] 1.3 Add swipe-left and swipe-right entries to TransitionContainer's ANIMATION_CLASS_MAP
    - Add `'swipe-left': 'animate-swipe-left-enter'` and `'swipe-right': 'animate-swipe-right-enter'` to the map
    - _Requirements: 7.2_

- [x] 2. Implement core swipe navigation hook
  - [x] 2.1 Create src/hooks/useSwipeNavigation.ts with gesture detection engine
    - Implement `SWIPE_TAB_ORDER` constant mapping paths to visual indices (excluding Post button)
    - Implement `getSwipeIndexFromPath`, `getAdjacentTab`, `isTabPage` utility functions
    - Implement `computeCommitDecision` (displacement ≥ 50px OR velocity ≥ 300px/s)
    - Implement `computeTranslation` with damping at 80% screen width (factor 0.5)
    - Implement `checkDirectionLock` (ratio 1.5:1, minimum 10px movement)
    - Implement `shouldIgnoreGesture` (edge zones 20px, defaultPrevented, horizontal scroll detection)
    - Implement `isHorizontallyScrollable` (walks DOM tree checking scrollWidth > clientWidth + overflow)
    - Implement `computeRubberBand` for boundary resistance (max 15% screen, 0.3 resistance)
    - Wire touch/pointer event listeners via useEffect on containerRef
    - Use refs for all position updates during active gesture (no React re-renders)
    - Call `setSwipeDirection` and `router.push` on commit; animate snap-back on cancel
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.3, 3.4, 3.5, 8.1, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4_

  - [ ]* 2.2 Write property test for swipe commit decision (Property 1)
    - **Property 1: Swipe Commit Decision**
    - Test that for any displacement ≥ 50px OR velocity ≥ 300px/s → commit; otherwise → cancel
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

  - [ ]* 2.3 Write property test for translation proportionality with damping (Property 2)
    - **Property 2: Translation Proportionality with Damping**
    - Test that translation = deltaX when |deltaX| ≤ 80% screen, and damped formula when > 80%
    - **Validates: Requirements 1.5, 3.1, 3.4**

  - [ ]* 2.4 Write property test for direction lock classification (Property 3)
    - **Property 3: Direction Lock Classification**
    - Test classification as horizontal iff |dx| ≥ |dy| × 1.5, vertical iff |dy| ≥ |dx| × 1.5
    - **Validates: Requirements 1.6**

  - [ ]* 2.5 Write property test for tab order navigation (Property 4)
    - **Property 4: Tab Order Navigation**
    - Test getAdjacentTab returns correct next/prev index in [0,1,2,3] or null at boundaries
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

  - [ ]* 2.6 Write property test for route classification (Property 5)
    - **Property 5: Route Classification**
    - Test isTabPage returns true only for the four known Tab_Page paths
    - **Validates: Requirements 2.5, 2.6**

  - [ ]* 2.7 Write property test for preview page position (Property 6)
    - **Property 6: Preview Page Position**
    - Test preview pane translateX = (1 - progress) × 100% in the direction of entry
    - **Validates: Requirements 3.2**

  - [ ]* 2.8 Write property test for edge zone exclusion (Property 9)
    - **Property 9: Edge Zone Exclusion**
    - Test that touches with clientX < 20 or > screenWidth - 20 are ignored
    - **Validates: Requirements 9.2**

  - [ ]* 2.9 Write property test for scrollable element detection (Property 10)
    - **Property 10: Scrollable Element Detection**
    - Test that elements with scrollWidth > clientWidth and overflowX auto/scroll are detected
    - **Validates: Requirements 9.1**

- [x] 3. Checkpoint - Verify core hook logic
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement liquid glass indicator hook and component
  - [x] 4.1 Create src/hooks/useLiquidGlass.ts with indicator interpolation logic
    - Implement `computeIndicatorPosition` (linear interpolation between source/target at 20% tab width)
    - Implement morph scaleX calculation (stretch first half, compress second half, range 1.0–1.4)
    - Implement `computeSpringSettle` (overshoot to 1.03x then settle back)
    - Implement `syncWithSwipeProgress` for rAF-driven direct DOM updates during swipe
    - Implement `animateToTab` for tap navigation with 450ms spring-like CSS transition
    - Implement `snapBack` for cancelled swipe with 200ms ease-out CSS transition
    - _Requirements: 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 5.5, 8.2, 8.6_

  - [ ]* 4.2 Write property test for indicator position interpolation (Property 7)
    - **Property 7: Indicator Position Interpolation**
    - Test left = sourceLeft + (targetLeft - sourceLeft) × progress where position = index × 20%
    - **Validates: Requirements 4.2**

  - [ ]* 4.3 Write property test for indicator morph curve (Property 8)
    - **Property 8: Indicator Morph Curve**
    - Test scaleX = 1 + morphProgress × 0.4, always between 1.0 and 1.4
    - **Validates: Requirements 5.2**

  - [x] 4.4 Create src/components/student/LiquidGlassIndicator.tsx component
    - Render a div with `.liquid-glass-indicator` class and forwarded ref from useLiquidGlass
    - Accept `activeIndex` and `indicatorRef` props
    - Position via inline style left = `${activeIndex * 20}%` as initial state
    - Apply backdrop-filter blur, semi-transparent background, inner border, box-shadow per design
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 5. Implement SwipeNavigationProvider and integrate into layout
  - [x] 5.1 Create src/components/transitions/SwipeNavigationProvider.tsx
    - Create `SwipeNavigationContext` with progressRef, isSwipingRef, targetTabIndexRef, currentTabIndex
    - Render container div with containerRef and swipe-content-area class
    - Render current pane (children) with currentPaneRef and swipe-pane--current class
    - Render preview pane with previewPaneRef and swipe-pane--preview class (initially offscreen)
    - Wire useSwipeNavigation hook and expose context to children
    - _Requirements: 3.1, 3.2, 3.5, 8.5_

  - [x] 5.2 Modify src/app/student/layout.tsx to wrap content with SwipeNavigationProvider
    - Import SwipeNavigationProvider
    - Wrap the TransitionContainer (or its children) with SwipeNavigationProvider on mobile layout
    - Ensure wide-screen layout is not affected (provider only on mobile)
    - _Requirements: 7.5_

- [x] 6. Integrate LiquidGlassIndicator into StudentTabBar
  - [x] 6.1 Modify src/components/student/StudentTabBar.tsx to use LiquidGlassIndicator
    - Import LiquidGlassIndicator and useLiquidGlass hook
    - Import SwipeNavigationContext to access progressRef and isSwipingRef
    - Replace the existing static indicator `<div>` with `<LiquidGlassIndicator>` component
    - Wire useLiquidGlass syncWithSwipeProgress to rAF loop reading progressRef during swipes
    - Wire animateToTab for existing tab button click handlers
    - Ensure tap navigation still triggers 'tab-switch' direction (not swipe direction)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 7. Add swipe left/right navigation between assignments on detail page
  - [ ] 7.1 Add swipe navigation to assignments/[assignmentId]/page.tsx
    - Import `useSwipeNavigation` utilities (computeCommitDecision, computeTranslation, checkDirectionLock, computeRubberBand)
    - Fetch the student's assignment list (from useStudentAssignments or route context) to determine prev/next assignment IDs
    - Attach touch event listeners to the page content area
    - On horizontal swipe commit: navigate to the previous or next assignment detail page using router.push
    - Apply swipe-left/swipe-right direction override via setSwipeDirection before navigation
    - Add rubber-band effect when at first/last assignment in the list
    - Ensure swipe does not conflict with vertical scrolling on the page
    - Only enable when assignment list has more than one item

- [ ] 8. Final checkpoint - End-to-end validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All position updates during active gestures use direct DOM manipulation via refs (no React re-renders)
- The design specifies TypeScript with React/Next.js — all implementations use this stack

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "2.8", "2.9", "4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "4.4"] },
    { "id": 4, "tasks": ["5.1"] },
    { "id": 5, "tasks": ["5.2", "6.1"] },
    { "id": 6, "tasks": ["7.1"] }
  ]
}
```
