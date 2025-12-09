# AWS Cost Optimization Report
**Date**: December 9, 2024  
**Status**: 🚨 CRITICAL - 80% of Free Tier Consumed

## 📊 Current Usage (30 Days)

### DynamoDB (CRITICAL ISSUE)
- **Total Reads**: 3.6M reads
- **Free Tier Limit**: 25M reads/month
- **Status**: ⚠️ 14% of free tier, but inefficient queries

#### Table-by-Table Breakdown:
| Table | Reads (30d) | Issue |
|-------|-------------|-------|
| classcast-video-interactions | **2,104,438** | 🔴 CRITICAL - Full table scans |
| classcast-users | 285,021 | ⚠️ High - No caching |
| classcast-submissions | 462,636 | ⚠️ High - No caching |
| classcast-courses | 249,724 | ⚠️ High - No caching |
| classcast-assignments | 169,668 | ⚠️ High - No caching |
| classcast-sections | 36,146 | ✅ OK |
| classcast-connections | 4,785 | ✅ OK |
| classcast-peer-responses | 4,134 | ✅ OK |

### S3 Storage
- **Current**: 29.62 GB
- **Free Tier**: 5 GB
- **Overage**: 24.62 GB × $0.023/GB = **$0.57/month**
- **Status**: 🔴 6x over free tier

### Amplify Hosting
- **Data Transfer**: 6.38 GB
- **Requests**: 493,509 (16K/day)
- **Free Tier**: 15 GB/month
- **Status**: ✅ 42% of free tier

### CloudFront
- **Status**: ✅ Not being used (0 requests)
- **Issue**: Should be caching but isn't configured

---

## 🔥 Root Causes

### 1. Video Interactions Table Scans (CRITICAL)
**Problem**: Every video card on dashboard does a full table scan

**Code Location**: `src/app/api/videos/[videoId]/interactions/route.ts`

```typescript
// ❌ BAD: Scans entire table for every video
const command = new ScanCommand({
  TableName: INTERACTIONS_TABLE,
  FilterExpression: 'videoId = :videoId',
  ExpressionAttributeValues: { ':videoId': videoId }
});
```

**Impact**:
- 171 videos × 139 users × multiple page loads = 2.1M scans
- Each scan reads the entire 204-item table
- No caching, no indexes

**Fix Required**:
1. Add GSI (Global Secondary Index) on `videoId`
2. Use QueryCommand instead of ScanCommand
3. Add 5-minute cache on frontend
4. Batch load interactions for multiple videos

### 2. No Frontend Caching
**Problem**: Every page load fetches fresh data from DynamoDB

**Affected Pages**:
- Student Dashboard (loads all courses, assignments, submissions)
- Instructor Dashboard (loads all students, courses)
- Grading Pages (loads submissions repeatedly)

**Fix Required**:
- Implement React Query or SWR
- Cache data for 5 minutes
- Use stale-while-revalidate pattern

### 3. S3 Storage Overage
**Problem**: 29.62 GB of videos stored (6x free tier)

**Breakdown**:
- 193 video files
- Average: 153 MB per video
- Cost: $0.57/month (small but growing)

**Fix Required**:
- ✅ Lifecycle policies configured (moves to IA after 90 days)
- Encourage YouTube/Google Drive links
- Set 100MB upload limit
- Delete test/old videos

### 4. CloudFront Not Being Used
**Problem**: CloudFront distribution exists but has 0 requests

**Impact**:
- All requests hit Amplify directly
- No caching of static assets
- Higher data transfer costs

**Fix Required**:
- Update DNS to point to CloudFront
- Configure caching rules
- Cache API responses at edge

---

## 💰 Cost Breakdown

### Current Monthly Cost (Estimated)
| Service | Usage | Cost |
|---------|-------|------|
| DynamoDB | 3.6M reads | $0.00 (under free tier) |
| S3 Storage | 29.62 GB | $0.57 |
| S3 Requests | Low | $0.05 |
| Amplify Hosting | 6.38 GB | $0.00 (under free tier) |
| **Total** | | **~$0.62/month** |

### Projected Cost Without Optimization
If usage doubles (278 users, 342 videos):
| Service | Usage | Cost |
|---------|-------|------|
| DynamoDB | 7.2M reads | $0.00 (still under 25M) |
| S3 Storage | 60 GB | $1.38 |
| Amplify | 12 GB | $0.00 (under free tier) |
| **Total** | | **~$1.50/month** |

### Projected Cost After Optimization
With caching and indexes:
| Service | Usage | Cost |
|---------|-------|------|
| DynamoDB | 1M reads (70% reduction) | $0.00 |
| S3 Storage | 60 GB (with lifecycle) | $0.80 |
| CloudFront | 12 GB (replaces Amplify) | $0.00 (free tier) |
| **Total** | | **~$0.80/month** |

---

## ✅ Immediate Actions Taken

1. ✅ **S3 Lifecycle Policies**
   - Videos → Standard-IA after 90 days
   - Videos → Glacier after 180 days
   - Thumbnails deleted after 365 days

2. ✅ **DynamoDB Billing Mode**
   - All tables on PAY_PER_REQUEST (on-demand)
   - No wasted provisioned capacity

---

## 🚀 Required Code Changes

### Priority 1: Add DynamoDB Index (CRITICAL)
```bash
# Run this script to add GSI
node add-video-interactions-index.js
```

### Priority 2: Implement Frontend Caching
Install React Query:
```bash
npm install @tanstack/react-query
```

Update dashboard to cache data:
```typescript
// Before: Fetches on every render
const response = await fetch('/api/videos/...');

// After: Caches for 5 minutes
const { data } = useQuery({
  queryKey: ['video-interactions', videoId],
  queryFn: () => fetch('/api/videos/...').then(r => r.json()),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000 // 10 minutes
});
```

### Priority 3: Batch Load Interactions
Create new endpoint: `/api/videos/batch-interactions`
```typescript
// Load interactions for multiple videos at once
POST /api/videos/batch-interactions
Body: { videoIds: ['video1', 'video2', ...] }
```

### Priority 4: Enable CloudFront
```bash
# Update DNS to use CloudFront
node update-dns-to-cloudfront.js
```

---

## 📈 Expected Results

### After Implementing All Fixes:
- **DynamoDB Reads**: 2.1M → 300K (85% reduction)
- **Page Load Time**: 3s → 0.5s (6x faster)
- **Monthly Cost**: $0.62 → $0.30 (50% reduction)
- **Free Tier Usage**: 80% → 30%

### Long-term Sustainability:
- Can support 500+ users within free tier
- Can store 100+ GB videos for ~$2/month
- Page loads will be instant with caching

---

## 🎯 Action Plan

### Week 1 (This Week)
- [ ] Add GSI to video-interactions table
- [ ] Update API to use QueryCommand
- [ ] Install React Query
- [ ] Add caching to dashboard

### Week 2
- [ ] Implement batch loading
- [ ] Enable CloudFront caching
- [ ] Add video size limits (100MB)
- [ ] Delete test videos

### Week 3
- [ ] Monitor costs daily
- [ ] Optimize remaining high-read tables
- [ ] Add request debouncing
- [ ] Implement pagination

### Ongoing
- [ ] Encourage YouTube/Google Drive links
- [ ] Archive old course videos
- [ ] Monitor DynamoDB metrics
- [ ] Review costs monthly

---

## 💡 Best Practices Going Forward

1. **Always use indexes** - Never scan tables
2. **Cache aggressively** - 5-minute cache for most data
3. **Batch requests** - Load multiple items at once
4. **Use CloudFront** - Cache at edge locations
5. **Monitor costs** - Check AWS billing daily
6. **Prefer external storage** - YouTube/Drive are free
7. **Set limits** - Max video size, max storage per user
8. **Clean up regularly** - Delete old test data

---

## 📞 Support

If costs continue to rise:
1. Check CloudWatch metrics for anomalies
2. Review DynamoDB read patterns
3. Check for infinite loops or polling
4. Consider AWS Support (free tier includes basic support)
