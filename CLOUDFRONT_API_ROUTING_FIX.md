# CloudFront API Routing Fix - 403 Error Solution

## 🎯 Problem Identified

The 403 CloudFront error occurs because:

1. **Frontend calls**: `https://class-cast.com/api/assignments/...` 
2. **Actual API**: `https://ete1conlc8.execute-api.us-east-1.amazonaws.com/prod`
3. **CloudFront**: Serves static files, doesn't know about `/api/` routes
4. **Result**: 403 Forbidden when trying to access non-existent static files

## ✅ Solution Options

### Option 1: Update Frontend to Use Correct API URL (Recommended)

Update your frontend code to use the correct API Gateway URL instead of relative paths.

#### 1. Create API Configuration

```typescript
// src/lib/apiConfig.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://ete1conlc8.execute-api.us-east-1.amazonaws.com/prod';

export const apiConfig = {
  baseUrl: API_BASE_URL,
  endpoints: {
    assignments: `${API_BASE_URL}/assignments`,
    courses: `${API_BASE_URL}/courses`,
    users: `${API_BASE_URL}/users`,
    // ... other endpoints
  }
};

export function getApiUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
}
```

#### 2. Update Frontend API Calls

Instead of:
```javascript
fetch('/api/assignments/assignment_123', { method: 'PUT', ... })
```

Use:
```javascript
import { getApiUrl } from '@/lib/apiConfig';
fetch(getApiUrl('assignments/assignment_123'), { method: 'PUT', ... })
```

### Option 2: Configure CloudFront to Proxy API Calls

Add CloudFront behaviors to forward `/api/*` requests to your API Gateway.

#### CloudFront Configuration Needed:
```yaml
# In your CloudFront distribution
behaviors:
  - pathPattern: "/api/*"
    targetOrigin: "ete1conlc8.execute-api.us-east-1.amazonaws.com"
    viewerProtocolPolicy: "redirect-to-https"
    allowedMethods: ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    forwardedHeaders: ["Authorization", "Content-Type"]
    cachePolicyId: "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # Managed-CachingDisabled
```

### Option 3: Use Next.js API Routes (Current Setup)

Your current setup uses Next.js API routes in `src/app/api/`. These should work, but they need to be deployed properly.

## 🚀 Immediate Fix (Option 1 - Recommended)

Let's update your frontend to use the correct API URL:

### Step 1: Create API Configuration
```bash
# Create the API config file
touch src/lib/apiConfig.ts
```

### Step 2: Update Assignment Update Logic

Find where the assignment update is happening and change:
```javascript
// From this:
fetch(`/api/assignments/${assignmentId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updateData)
})

// To this:
fetch(`https://ete1conlc8.execute-api.us-east-1.amazonaws.com/prod/assignments/${assignmentId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updateData)
})
```

## 🔧 Quick Test

Test if your API Gateway is working:

```bash
# Test GET (should work)
curl -X GET "https://ete1conlc8.execute-api.us-east-1.amazonaws.com/prod/assignments/assignment_1768361755173_ti155u2nf"

# Test PUT (the failing request)
curl -X PUT "https://ete1conlc8.execute-api.us-east-1.amazonaws.com/prod/assignments/assignment_1768361755173_ti155u2nf" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Update"}'
```

## 📊 Architecture Overview

```
Current (Broken):
Browser → CloudFront (class-cast.com) → /api/assignments/* → 403 (No such file)

Fixed:
Browser → API Gateway (ete1conlc8.execute-api.us-east-1.amazonaws.com) → Lambda → DynamoDB
```

## 🔍 Verification Steps

1. **Check API Gateway**: Verify your Lambda functions are connected
2. **Test Direct API**: Use curl/Postman to test API Gateway directly  
3. **Update Frontend**: Change all `/api/` calls to use full API Gateway URL
4. **Test Assignment Update**: Try adding a resource again
5. **Monitor Logs**: Check CloudWatch logs for any errors

## 📝 Files to Update

Based on your error, you'll need to find and update the assignment update logic in:
- Instructor course management components
- Assignment editing forms
- Resource management components

Look for files containing:
- `fetch('/api/assignments/`
- `method: 'PUT'`
- Assignment update functions

## 🚨 Emergency Workaround

If you need an immediate fix, you can temporarily bypass CloudFront by:

1. **Direct API Gateway**: Update just the failing assignment update call
2. **Environment Variable**: Use `NEXT_PUBLIC_API_BASE_URL` in your fetch calls
3. **Conditional Logic**: Use CloudFront for GET, API Gateway for PUT/POST

```javascript
const apiUrl = method === 'GET' 
  ? `/api/assignments/${assignmentId}` // Use CloudFront for reads
  : `${process.env.NEXT_PUBLIC_API_BASE_URL}/assignments/${assignmentId}`; // Use API Gateway for writes
```

---

**Next Steps**: 
1. Implement Option 1 (update frontend API calls)
2. Test assignment updates
3. Gradually migrate all API calls to use the correct URL
4. Consider implementing Option 2 for a more seamless experience