# Tasks

## Task 1: Refactor useSwipeNavigation to accept configurable tab order

- [x] Modify `src/hooks/useSwipeNavigation.ts` to accept an optional `options` parameter with `tabOrder: SwipeTabConfig[]`
- [x] Rename the hardcoded `SWIPE_TAB_ORDER` constant to `DEFAULT_STUDENT_TAB_ORDER`
- [x] Create and export a `SwipeTabConfig` interface with `path: string` and `visualIndex: number` fields
- [x] Update `getSwipeIndexFromPath` to accept an optional `tabOrder` parameter (defaults to student tab order)
- [x] Update `getAdjacentTab` to accept an optional `tabOrder` parameter
- [x] Update `isTabPage` to accept an optional `tabOrder` parameter
- [x] Thread the effective tab order through all internal functions (`handleTouchMove`, `handleTouchEnd`)
- [x] Verify no regressions in student portal swipe behavior (existing tests still pass without options)

**Requirements:** 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 7.3

## Task 2: Refactor SwipeNavigationProvider to accept tabOrder prop

- [x] Add optional `tabOrder?: SwipeTabConfig[]` prop to `SwipeNavigationProviderProps`
- [x] Pass `tabOrder` to the `useSwipeNavigation` hook call
- [x] Update context to use provided tab order for `getSwipeIndexFromPath` call
- [x] Verify student layout still works without passing tabOrder (backward-compatible)

**Requirements:** 7.3, 7.4

## Task 3: Extend useNavigationDirection with instructor tab paths

- [x] Open `src/hooks/useNavigationDirection.ts` and locate the `TAB_PATHS` constant
- [x] Add instructor tab paths: `/instructor/dashboard`, `/instructor/grading`, `/instructor/courses`, `/instructor/profile`
- [x] Verify that navigation between instructor tab pages produces `tab-switch` direction (cross-fade)
- [x] Verify existing student tab path classification still works

**Requirements:** 6.1, 6.2, 6.3, 6.4

## Task 4: Create InstructorHeader component

- [x] Create `src/components/instructor/InstructorHeader.tsx`
- [x] Display "ClassCast" in Grand Hotel cursive font with color `#005587`
- [x] Display ClassCast logo image (`/UpdatedCCLogo.png`) and school logo (`/CristoReyLogo.png` with w-14 h-14)
- [x] Match the StudentHeader layout (flexbox row, centered, with padding)
- [x] Use the same Grand Hotel font import pattern

**Requirements:** 4.1, 4.2, 7.5

## Task 5: Create InstructorTabBar component

- [x] Create `src/components/instructor/InstructorTabBar.tsx`
- [x] Render 5 tab buttons: Dashboard (home icon), Grading (clipboard icon), Create (center plus/action), Courses (book icon), Profile (avatar)
- [x] Use `createPortal` to render to `document.body` (avoid position:fixed inside will-change:transform)
- [x] Apply glass morphism styling: `rgba(255,255,255,0.15)` background, `blur(24px) saturate(180%)` backdrop filter, `1px solid rgba(255,255,255,0.25)` border, `rounded-2xl`
- [x] Integrate `useLiquidGlass` hook for animated indicator
- [x] Integrate `LiquidGlassIndicator` component positioned behind active tab
- [x] Sync indicator with swipe progress via `useSwipeNavigationContext` and rAF loop
- [x] Highlight active tab icon/label with navy `#005587`, inactive with `text-gray-400`
- [x] On Create tap: animate indicator to center (index 2), then open CreateModal, on close animate back
- [x] Include spacer div (h-[80px]) to prevent content overlap
- [x] Use `usePathname` for active tab detection
- [x] Map instructor paths to visual indices: Dashboard=0, Grading=1, Courses=3, Profile=4

**Requirements:** 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 2.1, 2.2, 2.3, 2.4, 2.5

## Task 6: Update instructor layout for mobile shell

- [x] Modify `src/app/instructor/layout.tsx` to import: `usePathname`, `useNavigationDirection`, `SwipeNavigationProvider`, `TransitionContainer`, `InstructorHeader`, `InstructorTabBar`
- [x] Define `INSTRUCTOR_TAB_PATHS` array: `/instructor/dashboard`, `/instructor/grading`, `/instructor/courses`, `/instructor/profile`
- [x] Define `INSTRUCTOR_SWIPE_TAB_ORDER` with paths and visual indices
- [x] In mobile branch: render safe-area padding div (`paddingTop: env(safe-area-inset-top, 0px)`)
- [x] Conditionally render `InstructorHeader` on tab pages (same logic as student layout)
- [x] Wrap children with `SwipeNavigationProvider` passing `tabOrder={INSTRUCTOR_SWIPE_TAB_ORDER}`
- [x] Wrap children within `TransitionContainer`
- [x] Render `InstructorTabBar` inside the mobile layout
- [x] Keep desktop/wide branch unchanged (InstructorSidebar + main content)
- [x] Import Grand Hotel font link when header is shown

**Requirements:** 5.1, 5.2, 5.3, 5.4, 1.1, 1.10

## Task 7: Create instructor profile page (if missing)

- [x] Check if `/instructor/profile` route exists; if not, create `src/app/instructor/profile/page.tsx`
- [x] Display instructor name, email, avatar, and role info
- [x] Style with ClassCast theme (white bg, navy headings, rounded-2xl cards)
- [x] Include a sign-out button

**Requirements:** 1.7

## Task 8: Integration testing and polish

- [x] Test mobile layout renders correctly: header visible on tab pages, tab bar at bottom
- [x] Test swipe between Dashboard → Grading → Courses → Profile works
- [x] Test Create modal opens and closes, indicator animates correctly
- [x] Test drill-in to sub-routes hides header and disables swipe
- [x] Test drill-out back to tab pages restores header and swipe
- [x] Test desktop layout is unchanged (sidebar still renders)
- [x] Verify no student portal regressions (swipe, tab bar, header all still work)
- [x] Run `npm run build` to confirm no TypeScript or build errors

**Requirements:** All
