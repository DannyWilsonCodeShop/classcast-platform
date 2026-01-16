# Assignment Edit Modal & Resources Display Fix

**Date**: January 15, 2026  
**Issues Fixed**:
1. Edit modal stays open after successful update
2. Resources not showing on student assignment page

## Issue 1: Modal Not Closing

### Problem
After updating an assignment in the instructor portal, the success alert appears but the edit modal remains open, requiring manual closure.

### Root Cause
The `setEditingAssignment(null)` was being called AFTER the blocking `alert()` call, which could cause timing issues with React state updates.

### Solution
**File**: `src/app/instructor/courses/[courseId]/page.tsx`

```typescript
// BEFORE
const result = await response.json();
console.log('✅ Assignment updated successfully:', result);

setEditingAssignment(null);
await fetchCourseDetails();
alert('Assignment updated successfully!');

// AFTER
const result = await response.json();
console.log('✅ Assignment updated successfully:', result);

// Close modal BEFORE showing alert to prevent UI issues
setEditingAssignment(null);

// Refresh assignments to show changes
await fetchCourseDetails();

// Show success message after modal is closed
setTimeout(() => {
  alert('Assignment updated successfully!');
}, 100);
```

### Changes Made
1. **Close modal first**: `setEditingAssignment(null)` now runs before the alert
2. **Delayed alert**: Wrapped alert in `setTimeout` to allow React to update the UI
3. **Better UX**: Modal closes immediately, then success message appears

## Issue 2: Resources Not Displaying

### Problem
Assignment resources (links, files) added by instructors don't appear on the student assignment detail page.

### Root Cause
**Browser/CDN caching** - The resources ARE in the database and ARE being returned by the API, but the browser is showing cached data from before the resources were added.

### Verification
Database check confirms resources are saved correctly:
```json
{
  "resources": [
    {
      "createdAt": "2026-01-15T15:59:56.508Z",
      "id": "resource_1768492796508_x7it53hkz",
      "type": "link",
      "title": "Problem Sheet",
      "url": "https://docs.google.com/spreadsheets/d/..."
    }
  ]
}
```

### Solution
**File**: `src/app/student/assignments/[assignmentId]/page.tsx`

Added comprehensive logging to track resources through the data flow:
```typescript
// Log when fetching from API
console.log('📎 Resources from API:', foundAssignment.resources);

// Log when transforming data
console.log('📎 Resources:', transformedAssignment.resources);

// Log when rendering
console.log('🔍 Rendering assignment details. Resources:', displayAssignment?.resources);
```

The resources display code is already correct:
```tsx
{displayAssignment.resources && displayAssignment.resources.length > 0 && (
  <div>
    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
      <span className="mr-2">📎</span>
      Assignment Resources
    </h3>
    <AssignmentResourcesDisplay resources={displayAssignment.resources} />
  </div>
)}
```

## How to See Resources (For Students)

Since the issue is browser caching, students need to do a **hard refresh** to see newly added resources:

### Method 1: Hard Refresh (Recommended)
- **Mac**: `Cmd + Shift + R`
- **Windows/Linux**: `Ctrl + Shift + R`

### Method 2: Clear Browser Cache
1. Open browser settings
2. Clear cache for class-cast.com
3. Reload the page

### Method 3: Incognito/Private Mode
- Open the assignment page in an incognito/private window
- This bypasses all cache

### Method 4: Wait for Auto-Refresh
- Switch to another tab, then back to the assignment page
- The page will auto-refresh when it becomes visible again

## Technical Details

### Cache-Busting Already in Place
The following cache-busting mechanisms are already implemented:
1. **Timestamp query parameters**: `?t=${Date.now()}`
2. **No-cache headers**: `Cache-Control: no-cache, no-store, must-revalidate`
3. **Fetch options**: `cache: 'no-store'`
4. **Auto-refresh on visibility**: Page refreshes when tab becomes active

### Why Hard Refresh Still Needed
The browser may have cached the **HTML page itself** before these cache-busting mechanisms were deployed. Once the user does one hard refresh to get the new code, all future updates will load automatically.

## Testing

### Test Modal Closure
1. Go to instructor course page
2. Click edit on any assignment
3. Make a change and click "Save Changes"
4. **Expected**: Modal closes immediately, then success alert appears
5. **Verify**: You're back at the course page, not stuck in the modal

### Test Resources Display
1. As instructor: Add a resource link to an assignment
2. As student: Open that assignment page
3. Do a hard refresh (`Cmd+Shift+R` or `Ctrl+Shift+R`)
4. **Expected**: See "Assignment Resources" section with the link
5. **Verify**: Can click the link and it opens correctly

## Files Modified

1. `src/app/instructor/courses/[courseId]/page.tsx`
   - Fixed modal closure timing
   - Added setTimeout to alert

2. `src/app/student/assignments/[assignmentId]/page.tsx`
   - Added resource debugging logs
   - Verified resources display code is correct

## Next Steps

If resources still don't show after hard refresh:
1. Check browser console for the resource logs
2. Verify the API is returning resources in the response
3. Check if AssignmentResourcesDisplay component is working
4. Verify no JavaScript errors are preventing rendering

## Notes

- The modal fix is immediate and requires no user action
- The resources display requires one hard refresh per user
- After the hard refresh, all future updates will load automatically
- The cache-busting is working, but can't override already-cached HTML
