# Video Upload URL Generation Lambda Function

## Overview

The `generate-video-upload-url.ts` Lambda function provides secure, presigned S3 URLs for video uploads in the assignment management system. This function handles authentication, validation, access control, and generates temporary upload URLs with proper security constraints.

## 🚀 **Key Features**

### **Security & Access Control**
- **JWT Authentication**: Verifies user identity and permissions
- **Role-based Access**: Different permissions for students, instructors, and admins
- **Course Enrollment Validation**: Students can only upload to enrolled courses
- **Assignment Validation**: Checks if assignments allow video submissions
- **Resubmission Control**: Prevents duplicate submissions when not allowed

### **File Validation**
- **File Type Restrictions**: Only allows supported video formats
- **File Size Limits**: Configurable maximum file size (default: 500MB)
- **File Name Sanitization**: Prevents malicious file names
- **Content Type Validation**: Ensures proper MIME type enforcement

### **S3 Integration**
- **Presigned URL Generation**: Secure, temporary upload URLs
- **Structured Key Generation**: Organized S3 key hierarchy
- **Metadata Preservation**: Rich metadata for tracking and organization
- **Conditional Uploads**: Server-side validation constraints

## 📋 **API Specification**

### **Endpoint**
```
POST /video-upload-url
```

### **Request Headers**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

### **Request Body Schema**
```typescript
{
  fileName: string,           // Required: Video file name
  fileType: string,           // Required: MIME type (e.g., 'video/mp4')
  fileSize: number,           // Required: File size in bytes
  assignmentId: string,       // Required: Assignment identifier
  courseId: string,           // Required: Course identifier
  uploadType?: string,        // Optional: Type of upload (default: 'assignment')
  expiresIn?: number,         // Optional: URL expiry in seconds (default: 3600)
  metadata?: {                // Optional: Additional file metadata
    title?: string,
    description?: string,
    tags?: string[],
    duration?: number,        // Video duration in seconds
    quality?: 'low' | 'medium' | 'high' | '4k',
    language?: string
  }
}
```

### **Response Schema**
```typescript
{
  success: boolean,
  data: {
    uploadUrl: string,        // S3 presigned upload URL
    s3Key: string,           // Generated S3 object key
    expiresAt: string,       // ISO timestamp when URL expires
    uploadId: string,        // Unique upload identifier
    requestId: string        // Request tracking ID
  },
  message: string,
  timestamp: string
}
```

## 🔐 **Access Control Matrix**

| User Role | Assignment Access | Course Access | Upload Permissions |
|-----------|------------------|---------------|-------------------|
| **Student** | Enrolled courses only | Enrolled courses only | Assignment submissions only |
| **Instructor** | Own courses | Department courses | Course materials, lectures |
| **Admin** | All assignments | All courses | Full access |

### **Student Upload Rules**
1. **Must be enrolled** in the specified course
2. **Assignment must allow** video submissions
3. **No duplicate submissions** unless resubmission is allowed
4. **File size limits** apply based on course/assignment settings

### **Instructor Upload Rules**
1. **Must have access** to the specified course
2. **Can upload** course materials, lectures, presentations
3. **Department restrictions** may apply
4. **File size limits** are typically higher than students

## 📁 **S3 Key Structure**

The function generates organized S3 keys following this pattern:
```
{courseId}/{assignmentId}/{userId}/{timestamp}_{filename}
```

### **Example Keys**
```
CS101/assignment123/user456/1703123456789_presentation.mp4
MATH201/lecture001/instructor789/1703123456790_week1.mp4
PHYS101/demo001/admin001/1703123456791_lab_demo.mp4
```

### **Benefits of This Structure**
- **Easy organization** by course and assignment
- **User isolation** prevents conflicts
- **Timestamp uniqueness** ensures no overwrites
- **Efficient querying** for course-related content
- **Simplified cleanup** and lifecycle management

## ⚙️ **Configuration**

### **Environment Variables**
```bash
# Required
VIDEO_BUCKET=demo-project-videos

# Optional (with defaults)
UPLOAD_EXPIRY_SECONDS=3600          # 1 hour
MAX_VIDEO_SIZE_MB=500               # 500MB
ALLOWED_VIDEO_TYPES=video/mp4,video/avi,video/mov,video/wmv,video/flv,video/webm,video/mkv
```

### **Supported Video Formats**
- **MP4** (H.264, H.265)
- **AVI** (Xvid, DivX)
- **MOV** (QuickTime)
- **WMV** (Windows Media)
- **FLV** (Flash Video)
- **WebM** (VP8, VP9)
- **MKV** (Matroska)

## 🔒 **Security Features**

### **Presigned URL Security**
- **Time-limited access**: URLs expire after specified time
- **Conditional uploads**: Server-side validation constraints
- **Content type enforcement**: Prevents MIME type spoofing
- **File size validation**: Prevents oversized uploads
- **Key validation**: Ensures uploads go to correct location

### **Upload Constraints**
```typescript
Conditions: [
  ['content-length-range', 1, fileSize],           // File size validation
  ['starts-with', '$key', s3Key],                 // Key validation
  ['eq', '$Content-Type', fileType],              // Content type validation
  ['eq', '$x-amz-meta-assignment-id', assignmentId], // Assignment ID metadata
  ['eq', '$x-amz-meta-course-id', courseId],     // Course ID metadata
  ['eq', '$x-amz-meta-upload-type', uploadType], // Upload type metadata
  ['eq', '$x-amz-meta-user-id', userId]          // User ID metadata
]
```

### **Metadata Preservation**
- **Assignment context**: Links uploads to specific assignments
- **Course context**: Organizes content by course
- **User tracking**: Identifies upload source
- **Upload metadata**: Timestamps, file info, custom fields

## 📊 **Usage Examples**

### **Basic Assignment Upload**
```javascript
const response = await fetch('/video-upload-url', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fileName: 'algorithm-explanation.mp4',
    fileType: 'video/mp4',
    fileSize: 52428800, // 50MB
    assignmentId: 'assignment123',
    courseId: 'CS101'
  })
});

const { uploadUrl, s3Key } = await response.json();
```

### **Lecture Upload with Metadata**
```javascript
const response = await fetch('/video-upload-url', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fileName: 'week1-introduction.mp4',
    fileType: 'video/mp4',
    fileSize: 104857600, // 100MB
    assignmentId: 'lecture001',
    courseId: 'CS101',
    uploadType: 'lecture',
    metadata: {
      title: 'Introduction to Algorithms',
      description: 'Week 1 lecture covering basic concepts',
      duration: 1800, // 30 minutes
      quality: 'high',
      language: 'en'
    }
  })
});
```

### **Custom Expiry Time**
```javascript
const response = await fetch('/video-upload-url', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fileName: 'final-presentation.mp4',
    fileType: 'video/mp4',
    fileSize: 209715200, // 200MB
    assignmentId: 'final123',
    courseId: 'CS101',
    expiresIn: 7200 // 2 hours
  })
});
```

## 🚨 **Error Handling**

### **Common Error Codes**
| Status | Code | Description |
|--------|------|-------------|
| **400** | `VALIDATION_ERROR` | Request validation failed |
| **401** | `UNAUTHORIZED` | Authentication failed |
| **403** | `NOT_ENROLLED` | Student not enrolled in course |
| **403** | `VIDEO_NOT_ALLOWED` | Assignment doesn't allow videos |
| **403** | `ALREADY_SUBMITTED` | Duplicate submission not allowed |
| **403** | `COURSE_ACCESS_DENIED` | Instructor access denied |
| **500** | `S3_ERROR` | S3 service error |

### **Error Response Format**
```typescript
{
  success: false,
  error: string,
  details: {
    errors?: Array<{
      field: string,
      message: string
    }>,
    code?: string,
    message?: string,
    requestId: string
  },
  timestamp: string
}
```

## 🧪 **Testing**

### **Run Tests**
```bash
# Run all video upload tests
npm test -- --testPathPattern="video-upload-url.test.ts"

# Run with coverage
npm test -- --coverage --testPathPattern="video-upload-url.test.ts"
```

### **Test Coverage Areas**
- **Request Validation**: All field validations and constraints
- **Access Control**: Role-based permissions and course access
- **S3 Operations**: Presigned URL generation and error handling
- **Response Formatting**: Proper response structure and headers
- **Error Handling**: Various error scenarios and edge cases
- **Edge Cases**: Boundary conditions and special characters

## 🔧 **Deployment**

### **Prerequisites**
1. **S3 Bucket**: Configured with proper CORS and lifecycle policies
2. **IAM Permissions**: Lambda execution role with S3 access
3. **Environment Variables**: Configured with appropriate values
4. **JWT Verification**: Proper JWT token validation setup

### **S3 Bucket Configuration**
```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["PUT", "POST", "GET"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag"]
    }
  ]
}
```

### **Lambda Execution Role**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::demo-project-videos/*"
    }
  ]
}
```

## 📈 **Performance Considerations**

### **Optimization Features**
- **Async operations**: Non-blocking validation and access checks
- **Efficient S3 calls**: Single presigned URL generation
- **Minimal database queries**: Cached access control checks
- **Request tracking**: Unique IDs for monitoring and debugging

### **Scalability**
- **Stateless design**: No shared state between invocations
- **Parallel processing**: Multiple validation checks can run concurrently
- **Resource limits**: Configurable file size and expiry constraints
- **Error isolation**: Failures don't affect other operations

## 🔍 **Monitoring & Logging**

### **Request Tracking**
- **Unique request IDs**: Generated for each request
- **Structured logging**: Consistent log format across all operations
- **Performance metrics**: Timing information for key operations
- **Error tracking**: Detailed error information for debugging

### **Log Format**
```
[req_1703123456789_abc123] Starting video upload URL generation request
[req_1703123456789_abc123] User authenticated: user123, Role: student
[req_1703123456789_abc123] Request validated, generating upload URL for: {...}
[req_1703123456789_abc123] Generated S3 key: CS101/assignment123/user123/1703123456789_test-video.mp4
[req_1703123456789_abc123] Successfully generated presigned URL for key: ...
[req_1703123456789_abc123] Successfully generated upload URL for test-video.mp4
```

## 🚀 **Future Enhancements**

### **Planned Features**
- **Chunked uploads**: Support for large file multipart uploads
- **Video processing**: Automatic transcoding and optimization
- **Thumbnail generation**: Automatic video thumbnail creation
- **Progress tracking**: Real-time upload progress monitoring
- **Batch operations**: Multiple file upload support

### **Integration Opportunities**
- **CloudFront**: CDN integration for video delivery
- **MediaConvert**: Serverless video processing
- **Elastic Transcoder**: Video format conversion
- **Rekognition**: Content analysis and moderation

## 📚 **Related Documentation**

- **`fetch-assignments.ts`**: Assignment retrieval and management
- **`create-assignment.ts`**: Assignment creation with validation
- **`jwt-verifier.ts`**: Authentication and authorization
- **`PAGINATION_FEATURES_README.md`**: Pagination system documentation

---

**Function Name**: `generate-video-upload-url.ts`  
**Purpose**: Secure S3 presigned URL generation for video uploads  
**Security Level**: High (JWT auth, role-based access, S3 constraints)  
**Test Coverage**: Comprehensive (40+ test cases)  
**Production Ready**: Yes, with proper configuration

