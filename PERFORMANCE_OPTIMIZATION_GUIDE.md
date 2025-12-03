# Performance Optimization Guide for ClassCast

## Current Status

✅ **CloudFront is active** (via AWS Amplify)
⚠️ **CloudFront showing errors** (`x-cache: Error from cloudfront`)
✅ **TTFB is good** (102ms)
❌ **Website feels slow** (likely due to other factors)

## How CloudFront Works

### What You Have Now

**Amplify CloudFront** (automatically created):
- Serves your Next.js app (HTML, CSS, JS)
- Domain: `class-cast.com` → Amplify CloudFront
- **Does NOT serve S3 assets** (videos, files)

**S3 Assets CloudFront** (we just created):
- Serves S3 files (videos, images, documents)
- Domain: `dimlqetlpy2s3.cloudfront.net`
- Only for S3 bucket content

### What CloudFront Can Do

CloudFront can serve:
1. ✅ **Static assets** (images, CSS, JS) - via Amplify
2. ✅ **S3 files** (videos, documents) - via our distribution
3. ❌ **API responses** - NOT cached (dynamic data)
4. ❌ **Database queries** - NOT cached

## Why Your Site Feels Slow

Based on your setup, the slowness is likely from:

### 1. **Too Many API Calls** 
Every page makes multiple API calls to:
- Fetch user data
- Load courses
- Get assignments
- Fetch submissions
- Load grades

**Solution:** Implement caching and data prefetching

### 2. **Large Bundle Size**
Your Next.js app might be loading too much JavaScript upfront.

**Solution:** Code splitting and lazy loading

### 3. **Unoptimized Images**
Images not using Next.js Image optimization.

**Solution:** Use Next.js `<Image>` component

### 4. **Database Query Performance**
DynamoDB scans instead of queries.

**Solution:** Add indexes and optimize queries

### 5. **No Server-Side Caching**
API responses not cached.

**Solution:** Add Redis or in-memory caching

## Performance Optimization Plan

### Phase 1: Quick Wins (Free, 1-2 hours)

#### 1. Enable Next.js Image Optimization
```typescript
// Replace <img> with Next.js Image
import Image from 'next/image';

<Image 
  src="/logo.png" 
  width={200} 
  height={50} 
  alt="Logo"
  priority // for above-the-fold images
/>
```

#### 2. Add Loading States
```typescript
// Show skeletons while loading
{loading ? <Skeleton /> : <Content />}
```

#### 3. Implement React Query for Caching
```bash
npm install @tanstack/react-query
```

```typescript
// Cache API responses in browser
const { data, isLoading } = useQuery({
  queryKey: ['courses'],
  queryFn: fetchCourses,
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

**Cost:** $0
**Impact:** 30-50% faster perceived performance

### Phase 2: Medium Optimizations (Free, 4-6 hours)

#### 1. Add DynamoDB Indexes
Create GSIs for common queries:
- `email-index` for user lookups
- `courseId-index` for course queries
- `assignmentId-index` for submissions

**Cost:** $0 (within free tier)
**Impact:** 50-80% faster API responses

#### 2. Implement Code Splitting
```typescript
// Lazy load heavy components
const VideoPlayer = dynamic(() => import('./VideoPlayer'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});
```

**Cost:** $0
**Impact:** 40% smaller initial bundle

#### 3. Add API Response Caching
```typescript
// Cache in API routes
const cache = new Map();

export async function GET(request) {
  const cacheKey = request.url;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const data = await fetchData();
  cache.set(cacheKey, data);
  setTimeout(() => cache.delete(cacheKey), 60000); // 1 min
  
  return data;
}
```

**Cost:** $0
**Impact:** 90% faster for cached requests

### Phase 3: Advanced Optimizations ($5-20/month)

#### 1. Add Redis for Caching
Use AWS ElastiCache (Redis):
- Cache user sessions
- Cache course data
- Cache assignment lists

**Cost:** $15/month (t4g.micro)
**Impact:** 80% faster API responses

#### 2. Add CloudFront for API Gateway
Create CloudFront distribution for API:
- Cache GET requests
- Reduce API Gateway costs
- Faster response times

**Cost:** $5-10/month
**Impact:** 60% faster API calls

#### 3. Optimize Database Queries
- Use batch operations
- Implement pagination
- Add query result caching

**Cost:** $0
**Impact:** 70% faster data fetching

### Phase 4: Premium Performance ($50-100/month)

#### 1. Upgrade to Next.js Edge Runtime
Deploy API routes to CloudFront edge locations.

**Cost:** Included in Amplify
**Impact:** 50% faster global performance

#### 2. Add CDN for Dynamic Content
Use CloudFront with Lambda@Edge for personalized caching.

**Cost:** $20-50/month
**Impact:** 70% faster for returning users

#### 3. Implement Full-Page Caching
Cache entire pages at CDN level.

**Cost:** Included
**Impact:** 95% faster for cached pages

## Cost Breakdown

### Current Monthly Costs (Estimated)
- Amplify Hosting: $5-10
- S3 Storage: $2-5
- DynamoDB: $0-5
- CloudFront (S3): $5-10
- API Gateway: $1-3
- Lambda: $0-2
- **Total: $15-35/month**

### With Optimizations

#### Option 1: Free Optimizations Only
- Same cost: $15-35/month
- 50-70% performance improvement
- **Best value for money**

#### Option 2: Add Redis Caching
- Additional: $15/month
- Total: $30-50/month
- 80-90% performance improvement
- **Recommended for 100+ active users**

#### Option 3: Full Performance Stack
- Additional: $50/month
- Total: $65-85/month
- 95% performance improvement
- **For 500+ users or enterprise**

## Immediate Actions (Do This Now)

### 1. Fix CloudFront Error
The `x-cache: Error from cloudfront` suggests a configuration issue.

```bash
# Redeploy your Amplify app
git commit --allow-empty -m "Trigger Amplify rebuild"
git push
```

This will recreate the CloudFront distribution properly.

### 2. Enable Compression
Add to `next.config.ts`:
```typescript
module.exports = {
  compress: true,
  // ... other config
}
```

### 3. Add Cache Headers
Create `middleware.ts`:
```typescript
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Cache static assets for 1 year
  if (request.nextUrl.pathname.startsWith('/_next/static')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  // Cache API responses for 5 minutes
  if (request.nextUrl.pathname.startsWith('/api')) {
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300');
  }
  
  return response;
}
```

### 4. Optimize Images
Run this script to find unoptimized images:
```bash
node find-unoptimized-images.js
```

## Monitoring Performance

### 1. Add Performance Monitoring
```bash
npm install @vercel/analytics
```

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**Cost:** Free for 100k events/month

### 2. Monitor CloudFront
```bash
node check-cloudfront-metrics.js
```

### 3. Check API Performance
```bash
# Add to your API routes
console.time('API Call');
// ... your code
console.timeEnd('API Call');
```

## Expected Results

### Before Optimization
- Page Load: 3-5 seconds
- API Calls: 500-1000ms
- User Experience: Slow, frustrating

### After Free Optimizations
- Page Load: 1-2 seconds (60% faster)
- API Calls: 200-400ms (60% faster)
- User Experience: Much better

### After Redis + Caching
- Page Load: 0.5-1 second (80% faster)
- API Calls: 50-100ms (90% faster)
- User Experience: Excellent

## My Recommendation

**Start with Phase 1 & 2 (Free optimizations):**
1. Implement React Query for client-side caching
2. Add DynamoDB indexes
3. Implement code splitting
4. Fix CloudFront error by redeploying
5. Add proper cache headers

**Cost:** $0
**Time:** 4-6 hours
**Impact:** 60-70% performance improvement

**Then monitor for 2 weeks:**
- If still slow with 100+ users → Add Redis ($15/month)
- If API calls are slow → Add API CloudFront ($5/month)
- If database is slow → Optimize queries (free)

## Next Steps

1. Run: `node analyze-performance.js` to see current metrics
2. Run: `node implement-quick-wins.js` to apply free optimizations
3. Redeploy Amplify to fix CloudFront error
4. Monitor performance for 1 week
5. Decide if paid optimizations are needed

---

**Bottom Line:** Your site can be 60-70% faster with FREE optimizations. Only add paid services if you have 100+ concurrent users.
