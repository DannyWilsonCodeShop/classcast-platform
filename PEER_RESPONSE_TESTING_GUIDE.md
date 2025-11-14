# Peer Video Response Feature - Testing Guide

## Overview
The peer video response feature allows students to watch and provide written feedback on their classmates' video submissions.

## How It Works

### Student Portal Flow:

1. **Submit Your Video**
   - Student must first submit their own video for an assignment
   - Navigate to: `/student/assignments/[assignmentId]`
   - Click "Submit Assignment" button

2. **Access Peer Videos**
   - After submitting, peer videos appear in "Classmate Submissions" section
   - Click "Review & Respond →" button
   - OR click on any peer video thumbnail

3. **Leave a Response**
   - Navigate to: `/student/peer-reviews?assignmentId=[id]`
   - Watch peer video
   - Click "Write Response" button
   - Type response (minimum 50 characters required)
   - Click "Submit Response"

### Instructor Portal - Viewing Responses:

1. **Bulk Grading Interface**
   - Navigate to: `/instructor/grading/bulk`
   - Select a student's submission
   - Scroll down to "Student's Peer Responses" section
   - See all responses the student has written to peers

2. **Course Detail Page**
   - Navigate to: `/instructor/courses/[courseId]`
   - View submissions tab
   - See peer response counts per student

## API Endpoints

### GET /api/peer-responses
**Query Parameters:**
- `assignmentId` - Filter by assignment
- `studentId` - Filter by student (reviewer)
- `videoId` - Filter by video being reviewed

**Returns:** Array of peer responses with threaded replies

### POST /api/peer-responses
**Body:**
```json
{
  "reviewerId": "student_id",
  "reviewerName": "Student Name",
  "videoId": "video_id",
  "assignmentId": "assignment_id",
  "content": "Response text (min 50 chars)",
  "isSubmitted": true
}
```

**Returns:** Created response object

## Common Issues & Solutions

### Issue: Students can't see peer videos
**Solution:** 
- Verify student has submitted their own video first
- Check assignment has `enablePeerResponses: true`
- Check `hidePeerVideosUntilInstructorPosts` setting

### Issue: Response button disabled
**Solution:**
- Response must be at least 50 characters
- Check for JavaScript errors in browser console

### Issue: Responses not showing in instructor portal
**Solution:**
- Verify response was submitted with `isSubmitted: true`
- Check DynamoDB table `classcast-peer-responses` exists
- Verify `assignmentId` matches between submission and response

## Testing Checklist

- [ ] Student can submit video
- [ ] Peer videos appear after submission
- [ ] Student can navigate to peer review page
- [ ] Student can watch peer videos
- [ ] Student can write response (50+ chars)
- [ ] Submit button enables when requirements met
- [ ] Response submits successfully
- [ ] Success notification appears
- [ ] Response appears in instructor bulk grading
- [ ] Response count updates correctly
- [ ] Word count and character count calculated

## Database Schema

### Table: classcast-peer-responses
```
{
  responseId: string (PK)
  assignmentId: string (GSI)
  reviewerId: string
  reviewerName: string
  videoId: string
  content: string
  wordCount: number
  characterCount: number
  isSubmitted: boolean
  submittedAt: string (ISO date)
  createdAt: string (ISO date)
  updatedAt: string (ISO date)
  threadLevel: number
  replies: string[] (array of responseIds)
}
```

## Feature Requirements

### Assignment Settings:
- `enablePeerResponses`: boolean - Enable/disable feature
- `minResponsesRequired`: number - Required responses to complete
- `maxResponsesPerVideo`: number - Max responses per video
- `responseDueDate`: string - Due date for responses
- `responseWordLimit`: number - Max words per response
- `responseCharacterLimit`: number - Max characters per response

## Code Locations

- **Student Peer Review Page**: `src/app/student/peer-reviews/page.tsx`
- **API Route**: `src/app/api/peer-responses/route.ts`
- **Instructor Bulk Grading**: `src/app/instructor/grading/bulk/page.tsx`
- **Assignment Page**: `src/app/student/assignments/[assignmentId]/page.tsx`

## Debugging Tips

1. **Check Browser Console** for JavaScript errors
2. **Check Network Tab** for API call failures
3. **Verify DynamoDB Tables** exist in AWS console
4. **Check IAM Permissions** for DynamoDB access
5. **Verify Assignment Settings** have peer responses enabled
6. **Check Student Has Submitted** their own video first

## Content Moderation

Peer responses are automatically scanned for:
- Profanity and inappropriate language
- Personally Identifiable Information (PII)
- Harmful content (via OpenAI moderation)

Flagged content creates moderation alerts for instructors.
