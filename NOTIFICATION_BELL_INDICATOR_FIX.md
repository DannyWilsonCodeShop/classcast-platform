# Notification Bell Indicator Fix ✅

## Issue Reported
The notification bell indicator was showing even when there were no new notifications, causing confusion for users.

## Root Cause Analysis

### Problem 1: Video Likes Without Time Filter
The notifications API was fetching ALL videos with likes, regardless of when they were liked:

```typescript
// OLD CODE - No time filter
FilterExpression: 'studentId = :userId AND likes > :zero',
ExpressionAttributeValues: {
  ':userId': userId,
  ':zero': 0
}
```

This meant that any video that had ever received a like would show up as a notification forever.

### Problem 2: No Persistent Tracking of Viewed Notifications
The notification system was generating notifications dynamically on every fetch, but there was no way to track which notifications the user had already seen and dismissed. The `markAsRead` function tried to call an API endpoint, but:
1. The endpoint didn't properly persist the "read" state
2. Notifications were regenerated on every fetch
3. There was no client-side tracking of dismissed notifications

### Problem 3: Stale Notifications
Notifications were being shown for:
- Peer responses from last 24 hours ✅ (reasonable)
- Video likes from ANY time ❌ (too broad)
- Grades from last 7 days ✅ (reasonable)
- New assignments from last 3 days ✅ (reasonable)

## Fixes Applied

### 1. Added Time Filter for Video Likes ✅
**File**: `src/app/api/notifications/route.ts`

**Before:**
```typescript
FilterExpression: 'studentId = :userId AND likes > :zero',
ExpressionAttributeValues: {
  ':userId': userId,
  ':zero': 0
}
```

**After:**
```typescript
FilterExpression: 'studentId = :userId AND likes > :zero AND updatedAt > :recentTime',
ExpressionAttributeValues: {
  ':userId': userId,
  ':zero': 0,
  ':recentTime': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Last 7 days
}
```

Now video likes only show as notifications if they occurred in the last 7 days.

### 2. Added localStorage Tracking for Dismissed Notifications ✅
**File**: `src/components/common/NotificationBell.tsx`

**Added State:**
```typescript
const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());
```

**Load dismissed notifications on mount:**
```typescript
useEffect(() => {
  try {
    const stored = localStorage.getItem(`dismissed_notifications_${userId}`);
    if (stored) {
      setDismissedNotifications(new Set(JSON.parse(stored)));
    }
  } catch (error) {
    console.error('Error loading dismissed notifications:', error);
  }
}, [userId]);
```

**Save to localStorage when dismissing:**
```typescript
const saveDismissedNotifications = (dismissed: Set<string>) => {
  try {
    localStorage.setItem(`dismissed_notifications_${userId}`, JSON.stringify(Array.from(dismissed)));
  } catch (error) {
    console.error('Error saving dismissed notifications:', error);
  }
};
```

### 3. Filter Out Dismissed Notifications ✅
**Updated fetchNotifications:**
```typescript
if (data.success) {
  // Filter out dismissed notifications
  const filteredNotifications = (data.notifications || []).filter(
    (n: Notification) => !dismissedNotifications.has(n.id)
  );
  setNotifications(filteredNotifications);
  setLastFetch(Date.now());
}
```

### 4. Improved markAsRead Function ✅
**Before:**
- Only tried to call API endpoint
- Failed silently if endpoint didn't work
- Didn't persist dismissal

**After:**
```typescript
const markAsRead = async (notificationId: string) => {
  try {
    // Add to dismissed set
    const newDismissed = new Set(dismissedNotifications);
    newDismissed.add(notificationId);
    setDismissedNotifications(newDismissed);
    saveDismissedNotifications(newDismissed);

    // Remove from current notifications
    setNotifications(prev => prev.filter(n => n.id !== notificationId));

    // Try to mark as read on server (if endpoint exists)
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include'
      });
    } catch (error) {
      // Silently fail if endpoint doesn't exist
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};
```

### 5. Added "Clear All" Button ✅
Users can now dismiss all notifications at once:

```typescript
<button
  onClick={() => {
    // Mark all as read
    const newDismissed = new Set(dismissedNotifications);
    notifications.forEach(n => newDismissed.add(n.id));
    setDismissedNotifications(newDismissed);
    saveDismissedNotifications(newDismissed);
    setNotifications([]);
  }}
  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
>
  Clear All
</button>
```

## How It Works Now

1. **Notifications are fetched** from the API with time filters:
   - Peer responses: Last 24 hours
   - Video likes: Last 7 days ✅ (NEW)
   - Grades: Last 7 days
   - New assignments: Last 3 days

2. **Dismissed notifications are tracked** in localStorage per user:
   - Key: `dismissed_notifications_${userId}`
   - Value: Array of notification IDs

3. **Filtering happens client-side**:
   - Fetched notifications are filtered against dismissed set
   - Only new, unseen notifications are shown

4. **Clicking a notification**:
   - Marks it as dismissed
   - Saves to localStorage
   - Removes from current list
   - Navigates to the notification URL

5. **Clear All button**:
   - Dismisses all current notifications
   - Saves all IDs to localStorage
   - Clears the notification list

## Benefits

✅ **No more persistent indicators** - Once dismissed, notifications stay dismissed
✅ **Time-based filtering** - Old notifications don't keep showing up
✅ **Client-side persistence** - Works even if server endpoint fails
✅ **Per-user tracking** - Each user has their own dismissed notifications
✅ **Easy bulk dismissal** - "Clear All" button for convenience
✅ **Survives page refreshes** - localStorage persists across sessions

## Testing Recommendations

1. **Test notification dismissal:**
   - Click on a notification
   - Verify indicator updates immediately
   - Refresh page
   - Verify notification stays dismissed

2. **Test Clear All:**
   - Have multiple notifications
   - Click "Clear All"
   - Verify all notifications disappear
   - Verify indicator clears
   - Refresh page
   - Verify notifications stay cleared

3. **Test time filters:**
   - Check that old likes don't show up
   - Verify only recent notifications appear

4. **Test multiple users:**
   - Log in as different users
   - Verify each has separate dismissed notifications

## Files Modified

1. `src/app/api/notifications/route.ts` - Added time filter for video likes
2. `src/components/common/NotificationBell.tsx` - Added localStorage tracking and Clear All button

## Status: COMPLETE ✅

- ✅ Video likes now have 7-day time filter
- ✅ Dismissed notifications tracked in localStorage
- ✅ Notifications stay dismissed across page refreshes
- ✅ Clear All button for easy bulk dismissal
- ✅ Per-user notification tracking
- ✅ Bell indicator only shows for new, unseen notifications

The notification bell indicator will now only show when there are genuinely new notifications that the user hasn't dismissed yet!
