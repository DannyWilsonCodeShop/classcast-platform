# Implementation Tasks: iPad/Desktop Layout

> **Branch:** `dev` — All work should be done on the `dev` branch.

## Task 1: Create `useIsWideScreen` Hook

- [ ] 1.1 Create `src/hooks/useIsWideScreen.ts` with a custom hook that uses `window.matchMedia` to detect viewport width
- [ ] 1.2 Hook returns `{ isWide: boolean (≥768px), isDesktop: boolean (≥1024px), isMobile: boolean (<768px) }`
- [ ] 1.3 Handle SSR by defaulting all values to `false`/`true` (mobile-first) on the server
- [ ] 1.4 Add event listener for `matchMedia` change events to reactively update state on resize
- [ ] 1.5 Clean up event listeners on unmount

## Task 2: Create `WideScreenSidebar` Component

- [ ] 2.1 Create `src/components/student/WideScreenSidebar.tsx` with the sidebar shell (white background, fixed left positioning)
- [ ] 2.2 Add logo section at top: Grand Hotel "ClassCast" text + school logo image
- [ ] 2.3 Add 6 navigation items: Dashboard, Courses, Assignments, Grades, Profile, Settings — each with an icon and label
- [ ] 2.4 Highlight the active nav item using `usePathname()` — left border accent in #005587, blue-tinted background
- [ ] 2.5 Add Record button with gold (#FFC72C) background, camera/plus icon, visually distinct from nav items
- [ ] 2.6 Add student avatar + first name at the bottom of the sidebar
- [ ] 2.7 Implement compact mode (64px, icons only) for `md` breakpoint (768–1024px) and full mode (240px, icons + labels) for `lg` breakpoint (>1024px)
- [ ] 2.8 Add smooth width transition (duration-200) between compact and full modes
- [ ] 2.9 Wire Record button to open the assignment picker modal (reuse existing modal logic)

## Task 3: Update Student Layout Wrapper

- [ ] 3.1 Modify `src/app/student/layout.tsx` to import and use `useIsWideScreen` hook
- [ ] 3.2 When `isWide` is true, render `WideScreenSidebar` + content wrapper div with flex layout
- [ ] 3.3 When `isWide` is false, render children directly (existing behavior, pages handle their own bottom nav)
- [ ] 3.4 Add a CSS class or data attribute to the wrapper that pages can use to detect they're in wide mode
- [ ] 3.5 Ensure the sidebar and content area fill the full viewport height (`h-screen` or `h-dvh`)

## Task 4: Update Dashboard Page for Wide-Screen Layout

- [ ] 4.1 In `src/app/student/dashboard/page.tsx`, import `useIsWideScreen` and conditionally render two-column layout
- [ ] 4.2 Render quick stats row at full width above the columns (same stats, slightly larger text for wide)
- [ ] 4.3 Left column (~55%): Assignments section — increase card limit from 3 to 6, vertical scrollable list
- [ ] 4.4 Right column (~45%): Videos section — render as 2-column grid of thumbnails instead of horizontal scroll
- [ ] 4.5 Hide the mobile header (ClassCast logo bar) and bottom nav when in wide mode
- [ ] 4.6 Preserve all existing card styling (colored backgrounds, Oswald headers, due badges, author avatars, gold borders, star ratings)
- [ ] 4.7 Ensure both columns scroll independently if content overflows

## Task 5: Update `globals.css` for iPad Compatibility

- [ ] 5.1 Remove the phone-frame wrapper styles for touch devices (update the `@media (hover: hover) and (pointer: fine)` block)
- [ ] 5.2 Ensure `data-student-page` elements fill 100% width/height on iPad-sized viewports (no max-width: 480px)
- [ ] 5.3 Add `.wide-sidebar-layout` utility class for the sidebar + content flex container
- [ ] 5.4 Verify no overflow/clipping at 2048×2732 (portrait) and 2732×2048 (landscape) by testing with browser dev tools
- [ ] 5.5 Ensure minimum touch target sizes: add a utility or Tailwind extend for `min-w-[44px] min-h-[44px]` on interactive elements

## Task 6: Implement Detail Panel (Split-View) for Desktop

- [ ] 6.1 Create `src/components/student/DetailPanel.tsx` component that renders assignment detail or video player
- [ ] 6.2 Add `selectedItem` state management in the dashboard page (type: 'assignment' | 'video', itemId: string | null)
- [ ] 6.3 When `isDesktop` (≥1024px) and an assignment is tapped, show detail in the DetailPanel instead of navigating
- [ ] 6.4 When `isDesktop` and a video is tapped, show video player in the DetailPanel
- [ ] 6.5 Render a placeholder ("Select an assignment or video to view details") when nothing is selected
- [ ] 6.6 Add a close button that clears the selection and returns to placeholder
- [ ] 6.7 When viewport is between 768–1023px, tapping items should navigate to the full-page detail view (existing behavior)

## Task 7: Update Demo Screenshot Page for iPad

- [ ] 7.1 Update `src/app/demo/screenshots/page.tsx` to detect viewport and render the wide-screen layout variant
- [ ] 7.2 Add a URL parameter option (e.g., `?layout=ipad`) to force the wide layout for screenshot capture
- [ ] 7.3 Verify the demo page renders correctly at iPad screenshot dimensions (2048×2732 portrait, 2732×2048 landscape)

## Task 8: Testing and Polish

- [ ] 8.1 Test all breakpoints in Chrome DevTools: 375px (iPhone), 768px (iPad Mini portrait), 810px (iPad Air portrait), 1024px (iPad landscape), 1180px (iPad Air landscape), 1440px (desktop)
- [ ] 8.2 Test orientation changes on actual iPad simulator or device — layout transitions smoothly
- [ ] 8.3 Test iPad split-screen mode (Slide Over ~320px) — should fall back to mobile layout
- [ ] 8.4 Verify all text is ≥14px at iPad resolution
- [ ] 8.5 Verify all touch targets are ≥44×44pt
- [ ] 8.6 Run `npm run build` to ensure no TypeScript errors or build failures
- [ ] 8.7 Capture iPad App Store screenshots at required dimensions and verify they look polished
