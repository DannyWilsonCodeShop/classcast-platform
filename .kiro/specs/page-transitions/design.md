# Technical Design Document

## Overview

The Page Transitions system adds iOS-native-feeling navigation animations to ClassCast's student experience. It operates entirely at the layout level using pure CSS keyframe animations and a lightweight React context for navigation direction detection. No external animation library is required — the implementation uses GPU-accelerated CSS transforms/opacity that are well-supported in WKWebView.

## Architecture

### System Components

```
┌──────────────────────────────────────────────────────────┐
│                   StudentLayout                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │            TransitionProvider (Context)             │  │
│  │  ┌─────────────────┐  ┌────────────────────────┐  │  │
│  │  │  NavDirection    │  │  TransitionContainer   │  │  │
│  │  │  Detector        │  │  (CSS class applier)   │  │  │
│  │  │                  │  │                        │  │  │
│  │  │  - prevPath      │  │  - Renders children    │  │  │
│  │  │  - currPath      │  │  - Applies enter/exit  │  │  │
│  │  │  - direction     │  │    CSS classes based   │  │  │
│  │  │  - isPopState    │  │    on direction        │  │  │
│  │  └─────────────────┘  └────────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐   │
│  │StudentHeader │  │  Content    │  │ StudentTabBar│   │
│  │(static)      │  │  (animated) │  │ (static)     │   │
│  └──────────────┘  └─────────────┘  └──────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### Navigation Direction Detection Algorithm

```
function classifyNavigation(prevPath, currPath, isPopState):
  TAB_PATHS = ['/student/dashboard', '/student/assignments', 
               '/student/courses', '/student/profile']
  
  if isPopState:
    return 'drill-out'
  
  if TAB_PATHS.includes(prevPath) AND TAB_PATHS.includes(currPath):
    return 'tab-switch'
  
  prevDepth = prevPath.split('/').filter(Boolean).length
  currDepth = currPath.split('/').filter(Boolean).length
  
  if currDepth > prevDepth:
    return 'drill-in'
  
  if currDepth < prevDepth:
    return 'drill-out'
  
  // Same depth but different path (lateral navigation)
  return 'tab-switch'
```

### CSS Keyframe Definitions

```css
/* Tab switch: simple cross-fade */
@keyframes tabFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes tabFadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* Drill-in: iOS push from right */
@keyframes drillInEnter {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
@keyframes drillInExit {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(-30%); opacity: 0.4; }
}

/* Drill-out: iOS pop to right */
@keyframes drillOutEnter {
  from { transform: translateX(-30%); opacity: 0.4; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes drillOutExit {
  from { transform: translateX(0); }
  to { transform: translateX(100%); }
}

/* Modal: iOS sheet */
@keyframes modalSlideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
@keyframes modalSlideDown {
  from { transform: translateY(0); }
  to { transform: translateY(100%); }
}
@keyframes backdropFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes backdropFadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
```

### Component Hierarchy

```
src/
├── app/student/layout.tsx          ← Wraps children in TransitionContainer
├── hooks/useNavigationDirection.ts ← Direction detection hook
├── components/transitions/
│   ├── TransitionProvider.tsx       ← Context provider + popstate listener
│   ├── TransitionContainer.tsx      ← Applies CSS classes, manages old/new content
│   └── ModalTransition.tsx          ← Wrapper for modal slide-up/down
└── app/globals.css                  ← Keyframe definitions + utility classes
```

## Data Models

### NavigationDirection (enum)

```typescript
type NavigationDirection = 'tab-switch' | 'drill-in' | 'drill-out' | 'none';
```

### TransitionState

```typescript
interface TransitionState {
  direction: NavigationDirection;
  prevPath: string | null;
  currPath: string;
  isAnimating: boolean;
}
```

### TransitionConfig

```typescript
interface TransitionConfig {
  tabSwitch: { duration: 180; easing: 'ease-out' };
  drillIn: { duration: 320; easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)' };
  drillOut: { duration: 300; easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)' };
  modal: { duration: 280; easing: 'cubic-bezier(0.32, 0.72, 0, 1)' };
}
```

## Detailed Design

### 1. TransitionProvider (Context)

The provider wraps the student layout and:
- Listens to `usePathname()` changes to detect route transitions
- Listens to `popstate` events to detect browser/gesture back navigation
- Exposes `direction` and `isAnimating` to children
- Stores previous pathname to compare against current

```typescript
// Simplified hook logic
export function useNavigationDirection() {
  const pathname = usePathname();
  const [state, setState] = useState<TransitionState>({ ... });
  const prevPathRef = useRef(pathname);
  const isPopStateRef = useRef(false);

  // Listen for popstate (back button / swipe gesture)
  useEffect(() => {
    const handler = () => { isPopStateRef.current = true; };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  // Detect direction on pathname change
  useEffect(() => {
    if (pathname === prevPathRef.current) return;
    const direction = classifyNavigation(
      prevPathRef.current, pathname, isPopStateRef.current
    );
    setState({ direction, prevPath: prevPathRef.current, currPath: pathname, isAnimating: true });
    prevPathRef.current = pathname;
    isPopStateRef.current = false;
    
    // Clear animating state after duration
    const timeout = setTimeout(() => setState(s => ({ ...s, isAnimating: false })), 350);
    return () => clearTimeout(timeout);
  }, [pathname]);

  return state;
}
```

### 2. TransitionContainer

This component renders in the layout's content area. It:
- Receives `children` (the current page)
- Applies the appropriate CSS animation class based on `direction`
- Uses `key={pathname}` to force React to mount new content (triggering enter animation)

```tsx
function TransitionContainer({ children }: { children: React.ReactNode }) {
  const { direction } = useNavigationDirection();
  const pathname = usePathname();
  
  const animationClass = {
    'tab-switch': 'animate-tab-enter',
    'drill-in': 'animate-drill-in-enter', 
    'drill-out': 'animate-drill-out-enter',
    'none': '',
  }[direction] || '';

  return (
    <div 
      key={pathname} 
      className={`flex-1 min-h-0 ${animationClass}`}
      style={{ willChange: direction !== 'none' ? 'transform, opacity' : 'auto' }}
    >
      {children}
    </div>
  );
}
```

### 3. Loading Gate Integration

The loading gate is handled at the page level (not the transition level). Each page already shows skeletons during `isLoading`. The transition animates whatever the page renders — if it's a skeleton, the skeleton animates in. When data arrives, the page re-renders with real content (no additional transition needed since react re-renders in place).

This keeps the transition system decoupled from data-fetching concerns.

### 4. Modal Transition Wrapper

A reusable component that wraps modal content with enter/exit animations:

```tsx
function ModalTransition({ isOpen, onClose, children }) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animClass, setAnimClass] = useState('');

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => setAnimClass('animate-modal-enter'));
    } else {
      setAnimClass('animate-modal-exit');
      setTimeout(() => setShouldRender(false), 280);
    }
  }, [isOpen]);

  if (!shouldRender) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className={`absolute inset-0 bg-black/40 ${isOpen ? 'animate-backdrop-enter' : 'animate-backdrop-exit'}`} onClick={onClose} />
      <div className={`relative ${animClass}`}>{children}</div>
    </div>
  );
}
```

### 5. Shared-Element Transitions (Phase 2)

Shared-element transitions are the most complex and should be implemented in a second phase after the base transitions are stable. The approach:

1. Source element registers its `getBoundingClientRect()` in a global store at navigation time
2. Destination page reads the stored rect and renders a "ghost" element at that position
3. The ghost animates (position + dimensions) to the destination element's final rect
4. Once animation completes, the ghost is removed and the real element becomes visible

This requires coordination between pages and will be implemented after validating base transitions in WKWebView.

## Integration Points

### Modified Files

| File | Change |
|------|--------|
| `src/app/student/layout.tsx` | Wrap content area in `TransitionContainer`, add `TransitionProvider` |
| `src/app/globals.css` | Add keyframe definitions and animation utility classes |
| `src/components/student/StudentTabBar.tsx` | No changes (router.push calls stay the same) |
| Modal components (Post, Rubric, Resources) | Wrap in `ModalTransition` component |

### New Files

| File | Purpose |
|------|---------|
| `src/hooks/useNavigationDirection.ts` | Direction detection logic |
| `src/components/transitions/TransitionContainer.tsx` | Animated content wrapper |
| `src/components/transitions/ModalTransition.tsx` | Modal enter/exit animations |

### Dependencies

No new npm packages required. Pure CSS animations + React state.

## Performance Considerations

- All animations use only `transform` and `opacity` (compositor-only properties)
- `will-change` is applied only during active animations, removed after
- No DOM reads (getBoundingClientRect) during animation frames
- Keyframes are defined in CSS (not JS), parsed once by the engine
- Animation durations are short enough (150-350ms) that dropped frames are imperceptible

## Phased Implementation

1. **Phase 1**: Tab cross-fade + drill-in/out push transitions (core navigation feel)
2. **Phase 2**: Modal slide-up animations (Post, Rubric, Resources modals)
3. **Phase 3**: Shared-element transitions (assignment card → detail header)

Phase 1 provides 80% of the perceived native feel. Phases 2 and 3 are refinements.
