# Implementation Tasks

## Task 1: Create navigation direction detection hook
- [x] Create `src/hooks/useNavigationDirection.ts` with the `useNavigationDirection` hook
- [x] Implement `classifyNavigation()` function that compares previous and current paths
- [x] Define `TAB_PATHS` constant for sibling tab routes
- [x] Add `popstate` event listener to detect browser/gesture back navigation
- [x] Track previous path via `useRef` and detect direction on `usePathname()` changes
- [x] Export `NavigationDirection` type and `TransitionState` interface
- [x] Verify hook re-renders only on actual path changes (not same-path navigations)

## Task 2: Add CSS keyframe animations to globals.css
- [x] Add `@keyframes tabFadeIn` (opacity 0→1, 180ms ease-out)
- [x] Add `@keyframes drillInEnter` (translateX 100%→0, 320ms)
- [x] Add `@keyframes drillInExit` (translateX 0→-30%, opacity 1→0.4, 320ms)
- [x] Add `@keyframes drillOutEnter` (translateX -30%→0, opacity 0.4→1, 300ms)
- [x] Add `@keyframes drillOutExit` (translateX 0→100%, 300ms)
- [x] Add utility classes: `.animate-tab-enter`, `.animate-drill-in-enter`, `.animate-drill-out-enter`
- [x] Set `animation-fill-mode: both` on all animation classes
- [x] Use `cubic-bezier(0.2, 0.9, 0.3, 1)` for drill animations (iOS spring-like curve)

## Task 3: Create TransitionContainer component
- [x] Create `src/components/transitions/TransitionContainer.tsx`
- [x] Import and use `useNavigationDirection` hook
- [x] Apply animation class based on detected direction
- [x] Use `key={pathname}` to force remount on route change (triggers enter animation)
- [x] Apply `will-change: transform, opacity` only during active animations
- [x] Remove `will-change` after animation completes (via `onAnimationEnd`)
- [x] Ensure the container fills available space (`flex-1 min-h-0`)

## Task 4: Integrate TransitionContainer into student layout
- [x] Import `TransitionContainer` in `src/app/student/layout.tsx`
- [x] Replace the plain `<div className="flex-1 min-h-0">` content wrapper with `<TransitionContainer>`
- [x] Ensure `StudentHeader` remains outside the animated container (stays static)
- [x] Ensure wide-screen layout path is unaffected (no transitions for desktop)
- [x] Verify tab switches show cross-fade animation
- [x] Verify drill-in navigation (e.g., assignments → assignment detail) shows push-from-right
- [x] Verify back navigation shows slide-out-to-right

## Task 5: Create ModalTransition component
- [x] Create `src/components/transitions/ModalTransition.tsx`
- [x] Add `@keyframes modalSlideUp` (translateY 100%→0, 280ms) to globals.css
- [x] Add `@keyframes modalSlideDown` (translateY 0→100%, 280ms) to globals.css
- [x] Add `@keyframes backdropFadeIn` and `@keyframes backdropFadeOut` to globals.css
- [x] Implement mount/unmount lifecycle: render on open, animate out before unmount
- [x] Use `requestAnimationFrame` to ensure enter animation triggers after mount
- [x] Accept `isOpen`, `onClose`, and `children` props

## Task 6: Apply ModalTransition to existing modals
- [x] Wrap Post modal in `StudentTabBar.tsx` with `ModalTransition`
- [x] Wrap Post modal in `dashboard/page.tsx` with `ModalTransition`
- [x] Wrap Rubric modal in `assignments/[assignmentId]/page.tsx` with `ModalTransition`
- [x] Wrap Resources modal in `assignments/[assignmentId]/page.tsx` with `ModalTransition`
- [x] Wrap Resources modal in `courses/[courseId]/page.tsx` with `ModalTransition`
- [x] Verify modals slide up from bottom on open and slide down on close
- [x] Verify backdrop fades in/out independently of modal content

## Task 7: Test transitions in Capacitor WKWebView
- [ ] Build for iOS: `npm run cap:build:ios`
- [ ] Test tab switches on physical iPhone (verify 60fps cross-fade, no slide)
- [ ] Test drill-in on physical iPhone (verify push from right is smooth)
- [ ] Test back gesture (swipe from left edge) triggers drill-out animation
- [ ] Test modal presentation (verify slide up, no jank)
- [ ] Verify `backdrop-filter` still works on glass nav bar during transitions
- [ ] Verify no double-rendering or flash between transition frames
- [ ] Check Safari desktop as fallback (Vercel deployment)
