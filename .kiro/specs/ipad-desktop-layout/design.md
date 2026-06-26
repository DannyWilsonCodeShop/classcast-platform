# Design Document: iPad/Desktop Layout

## Overview

This design introduces a responsive layout system for the ClassCast student dashboard that renders a multi-column layout with side navigation on iPad and desktop viewports (≥768px), while preserving the existing mobile experience below that threshold. The approach modifies the student `layout.tsx` wrapper and the dashboard page to conditionally render different layout structures based on viewport width.

## Architecture

### Component Hierarchy

```
StudentLayout (src/app/student/layout.tsx)
├── Mobile Layout (< 768px) — unchanged current behavior
│   └── {children} with bottom nav per page
│
└── Wide Layout (≥ 768px)
    ├── WideScreenSidebar (new component)
    │   ├── Logo section (Grand Hotel + school logo)
    │   ├── Nav items (Dashboard, Courses, Assignments, Grades, Profile, Settings)
    │   ├── Record button (gold accent)
    │   └── Student avatar + name
    └── Content area (flex-1)
        └── {children} — pages render their wide-screen variants
```

### Key Technical Decisions

1. **Layout detection via CSS + React hook**: Use a `useMediaQuery` hook wrapping `window.matchMedia('(min-width: 768px)')` to conditionally render sidebar vs bottom nav. CSS media queries handle initial paint to avoid flash.

2. **Modify `layout.tsx` rather than individual pages**: The student layout wrapper becomes the single point of control for sidebar vs bottom nav. Individual pages (dashboard, courses, grades) only need to adapt their content grid, not their chrome.

3. **Reuse existing Sidebar.tsx as starting point**: The existing `src/components/dashboard/layout/Sidebar.tsx` has course-based navigation. The new `WideScreenSidebar` will be a simplified, ClassCast-themed variant specifically for the student section.

4. **CSS-first responsive grids on dashboard page**: The dashboard page uses Tailwind's responsive utilities (`md:grid-cols-2`, `lg:grid-cols-[55%_45%]`) so the two-column layout is pure CSS — no JS layout calculation needed.

5. **Split-view at 1024px+ uses Next.js parallel routes or conditional rendering**: For the detail panel, we'll use a context-based approach where selecting an item sets state that renders a detail panel inline, rather than full navigation.

6. **Remove phone-frame CSS for touch devices**: Update `globals.css` to ensure the `(hover: hover) and (pointer: fine)` phone-frame wrapper never applies when viewport is ≥768px on touch devices (already partially done but needs cleanup).

## Components

### 1. `useIsWideScreen` Hook

**File:** `src/hooks/useIsWideScreen.ts`

**Purpose:** Reactive boolean that's `true` when viewport ≥ 768px. Handles SSR gracefully (defaults to `false` on server).

```typescript
interface UseIsWideScreenReturn {
  isWide: boolean;        // >= 768px
  isDesktop: boolean;     // >= 1024px
  isMobile: boolean;      // < 768px
}
```

### 2. `WideScreenSidebar` Component

**File:** `src/components/student/WideScreenSidebar.tsx`

**Purpose:** Persistent left-side navigation for tablet/desktop viewports.

**Props:**
```typescript
interface WideScreenSidebarProps {
  compact?: boolean; // true for 768–1024px (icons only)
}
```

**Behavior:**
- Compact mode (768–1024px): 64px wide, icons only, labels on hover via tooltip
- Full mode (>1024px): 240px wide, icons + labels
- Navigation items: Dashboard, Courses, Assignments, Grades, Profile, Settings
- Record button: Gold (#FFC72C) background, prominent placement, opens assignment picker modal
- Bottom section: Student avatar with gold border + first name
- Active state: Left border accent in primary blue, blue-tinted background

**Visual:**
- Background: white with subtle left border
- Logo: Grand Hotel "ClassCast" at top, school logo below
- Oswald font for section labels
- Smooth width transition between compact and full modes

### 3. `WideScreenDashboard` Component (or conditional rendering within dashboard page)

**File:** Inline within `src/app/student/dashboard/page.tsx` (conditional branch)

**Purpose:** Two-column layout for the dashboard content when in wide-screen mode.

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Quick Stats (full width)                     │
│ [📋 3 due this week] [✅ 5 submitted]       │
├────────────────────────┬────────────────────┤
│ Assignments (55%)      │ Recent Videos (45%) │
│                        │                     │
│ ┌──────────────────┐   │ ┌────┐ ┌────┐     │
│ │ Assignment Card  │   │ │vid │ │vid │     │
│ └──────────────────┘   │ └────┘ └────┘     │
│ ┌──────────────────┐   │ ┌────┐ ┌────┐     │
│ │ Assignment Card  │   │ │vid │ │vid │     │
│ └──────────────────┘   │ └────┘ └────┘     │
│ ┌──────────────────┐   │                     │
│ │ Assignment Card  │   │                     │
│ └──────────────────┘   │                     │
│ ... up to 6            │                     │
│ [View All →]           │                     │
├────────────────────────┴────────────────────┤
│ (Detail Panel — only at ≥1024px)            │
└─────────────────────────────────────────────┘
```

### 4. `DetailPanel` Component

**File:** `src/components/student/DetailPanel.tsx`

**Purpose:** Right-side panel that shows assignment or video details when an item is selected (≥1024px only).

**Props:**
```typescript
interface DetailPanelProps {
  type: 'assignment' | 'video' | null;
  itemId: string | null;
  onClose: () => void;
}
```

**Behavior:**
- Renders nothing (or placeholder) when `type` is null
- Fetches and displays assignment detail or video player
- Close button returns to placeholder state
- Takes approximately 40% of the content area width when active (assignments list shrinks to 60%)

### 5. Updated `globals.css` Rules

**Changes:**
- Remove the phone-frame for all touch devices regardless of viewport size
- Add `.wide-layout` utility class for the sidebar + content container
- Ensure `data-student-page` wrapper handles both mobile and wide layouts

## Data Flow

```
User lands on /student/dashboard
  → StudentLayout renders
    → useIsWideScreen() checks viewport
    → If wide: render WideScreenSidebar + content wrapper
    → If mobile: render existing layout (children handle their own bottom nav)
  
  → Dashboard page renders
    → useIsWideScreen() checks viewport
    → If wide: render two-column grid (assignments left, videos right)
    → If mobile: render existing single-column layout
    
  → User taps assignment (wide + desktop)
    → If ≥1024px: set selectedItem state, render DetailPanel inline
    → If 768–1023px: router.push to assignment detail page
    → If < 768px: router.push to assignment detail page
```

## Styling Approach

All responsive behavior uses Tailwind CSS responsive prefixes:
- `md:` → 768px+ (tablet)
- `lg:` → 1024px+ (desktop)
- Default → mobile

Example pattern for the dashboard grid:
```tsx
<div className="flex flex-col md:grid md:grid-cols-[55fr_45fr] md:gap-6 lg:grid-cols-[55fr_45fr]">
  {/* Assignments column */}
  {/* Videos column */}
</div>
```

Sidebar width handled with Tailwind:
```tsx
<aside className="md:w-16 lg:w-60 transition-all duration-200">
```

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/hooks/useIsWideScreen.ts` | New | Viewport detection hook |
| `src/components/student/WideScreenSidebar.tsx` | New | Sidebar navigation component |
| `src/components/student/DetailPanel.tsx` | New | Split-view detail panel |
| `src/app/student/layout.tsx` | Modify | Conditionally render sidebar + hide bottom nav |
| `src/app/student/dashboard/page.tsx` | Modify | Add two-column grid for wide screens |
| `src/app/globals.css` | Modify | Remove phone-frame for iPad, add wide layout utilities |
| `src/app/demo/screenshots/page.tsx` | Modify | Add iPad screenshot variant |

## Correctness Properties

### Property 1: Layout Mutual Exclusivity
For any viewport width, exactly one layout variant is active — either the mobile layout (with bottom nav) or the wide layout (with sidebar). They are never both visible simultaneously.

**Test approach:** For any randomly generated viewport width (300–2000px), assert that `(isWide && sidebarVisible && !bottomNavVisible) || (!isWide && !sidebarVisible && bottomNavVisible)`.

### Property 2: Sidebar Width Invariant
For all viewport widths ≥ 768px, the sidebar width is either compact (64px, when 768 ≤ width < 1024) or full (220–260px, when width ≥ 1024). It never renders at an intermediate or zero width.

**Test approach:** Property-based test with random widths in [768, 2000] range, asserting compact mode for [768, 1024) and full mode for [1024, ∞).

### Property 3: Assignment Display Cap
For any list of N assignments (N ≥ 0), the dashboard wide-screen view displays at most 6 assignment cards. The displayed count equals min(N, 6) where N is the number of unsubmitted assignments.

**Test approach:** Generate random arrays of 0–50 assignments with random submitted states. Assert rendered count = min(unsubmitted.length, 6).

### Property 4: Navigation Completeness
The WideScreenSidebar always contains exactly 6 navigation items (Dashboard, Courses, Assignments, Grades, Profile, Settings) plus the Record button, regardless of user state or viewport width (as long as ≥768px).

**Test approach:** Render the sidebar with various user objects and assert item count = 7 (6 nav + 1 record).

### Property 5: Active Route Highlighting Consistency
For any valid student route, exactly one navigation item in the sidebar is highlighted as active. The highlighted item corresponds to the current pathname prefix.

**Test approach:** Property-based test generating random valid routes from the set [/student/dashboard, /student/courses, /student/assignments, /student/grades, /student/profile, /student/settings], asserting exactly one item has active styling.

### Property 6: Touch Target Minimum Size
All interactive elements (buttons, links, nav items) in the wide layout render at a minimum of 44×44 CSS pixels, satisfying Apple HIG requirements.

**Test approach:** Query all interactive elements in the rendered wide layout and assert `offsetWidth >= 44 && offsetHeight >= 44`.

## Edge Cases

- **Viewport exactly at 768px**: Should render wide layout (inclusive threshold)
- **Rapid resize across breakpoint**: Debounce or use CSS transitions to prevent layout thrashing
- **No assignments / no videos**: Empty states render gracefully in both columns
- **Very long assignment titles**: Truncate with ellipsis (existing behavior preserved)
- **SSR / initial render**: Default to mobile layout on server to avoid hydration mismatch; CSS handles showing correct layout immediately on client
- **iPad split-screen (Slide Over)**: When iPad runs app in split-screen, viewport may be < 768px — should gracefully fall back to mobile layout
- **Orientation change on iPad**: Layout should adapt when rotating between portrait and landscape without reload
