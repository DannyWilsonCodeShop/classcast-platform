# Study Buddy Feature

## Overview
The Study Buddy feature allows students to connect with each other on ClassCast. Students can click a button next to any user's name in the feed to add them as a "Study Buddy" (instead of the traditional "Follow" or "Friend" terminology).

## How It Works

### For Students
1. View posts/videos on the `dashboard-new` page
2. Click the Study Buddy icon (👥) next to any author's name
3. The button changes from blue to green when connected
4. Students can build their network of Study Buddies

### Technical Implementation

#### API Endpoints

**GET `/api/connections?userId=<userId>`**
- Returns all Study Buddy connections for a user
- Response: `{ success: true, connections: [...] }`

**POST `/api/connections`**
```json
{
  "requesterId": "user123",
  "requestedId": "user456",
  "status": "accepted" // or "pending" for approval
}
```

#### Database Table
- **Table Name**: `classcast-connections`
- **Primary Key**: `connectionId` (composite of `requesterId_requestedId`)
- **Attributes**:
  - `requesterId`: User who sent the request
  - `requestedId`: User who received the request
  - `status`: "accepted" or "pending"
  - `createdAt`: Timestamp
  - `updatedAt`: Timestamp

#### UI Location
- The Study Buddy button appears on:
  - Video feed items in `/student/dashboard-new`
  - Community posts in `/student/dashboard-new`
- Button is hidden for the current user's own content
- Color states:
  - **Blue**: Not connected (click to add)
  - **Green**: Connected (already Study Buddies)

## Future Enhancements
- View list of Study Buddies
- Send messages/study group invites
- Filter feed by Study Buddies only
- Notifications when Study Buddies post new content

## Files Modified
- `src/app/student/dashboard-new/page.tsx` - Added Study Buddy button and state management
- `src/app/api/connections/route.ts` - API endpoint for connections
- `create-connections-table.js` - DynamoDB table creation script

