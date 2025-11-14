# S3 Storage Infrastructure for DemoProject

## 🏗️ **Overview**

This document describes the S3 storage infrastructure for the DemoProject application, including bucket configuration, CORS policies, lifecycle management, and CloudFront integration.

## 📦 **S3 Bucket Configuration**

### **Bucket Name:**
```
demoproject-storage-{ACCOUNT_ID}-{REGION}
```

### **Key Features:**
- **Versioning**: Enabled for file recovery and rollback
- **Encryption**: AWS managed encryption (AES-256)
- **Public Access**: Blocked for security
- **Object Ownership**: Bucket owner enforced (ACLs disabled)

## 🔒 **Security & Access Control**

### **Encryption:**
- **At Rest**: Server-side encryption with AES-256
- **In Transit**: TLS 1.2+ for all API calls
- **Key Management**: AWS managed keys

### **Access Control:**
- **Public Access**: Completely blocked
- **IAM Policies**: Least privilege access
- **Origin Access Identity**: CloudFront access only
- **Bucket Policies**: Application service access

### **CORS Configuration:**
```json
{
  "allowedMethods": ["GET", "POST", "PUT", "DELETE", "HEAD"],
  "allowedOrigins": [
    "http://localhost:3000",
    "https://localhost:3000",
    "https://*.vercel.app",
    "https://*.amazonaws.com"
  ],
  "allowedHeaders": ["*"],
  "exposedHeaders": ["ETag", "x-amz-meta-custom-header"],
  "maxAge": 3000
}
```

## 📊 **Lifecycle Policies**

### **1. Move to Infrequent Access (IA)**
- **Trigger**: 30 days after creation
- **Storage Class**: S3-IA
- **Cost Savings**: ~40% compared to Standard

### **2. Move to Glacier**
- **Trigger**: 90 days after creation
- **Storage Class**: S3 Glacier
- **Cost Savings**: ~70% compared to Standard

### **3. Move to Deep Archive**
- **Trigger**: 365 days after creation
- **Storage Class**: S3 Glacier Deep Archive
- **Cost Savings**: ~95% compared to Standard

### **4. Incomplete Multipart Upload Cleanup**
- **Trigger**: 7 days after initiation
- **Action**: Abort incomplete uploads
- **Cost Savings**: Prevents storage charges for incomplete uploads

### **5. Version Management**
- **Non-current Versions**: Move to Glacier after 90 days
- **Version Expiration**: Delete after 3 years (1095 days)

## 🚀 **CloudFront Integration**

### **Distribution Configuration:**
- **Price Class**: North America and Europe only
- **Compression**: Enabled for better performance
- **Logging**: Enabled with 90-day retention

### **Behaviors:**

#### **Default Behavior:**
- **Origin**: S3 bucket with OAI
- **Methods**: GET, HEAD, OPTIONS
- **Caching**: Optimized caching policy
- **Compression**: Enabled

#### **Uploads Path (`/uploads/*`):**
- **Methods**: All methods allowed
- **Caching**: Disabled (real-time access)
- **Use Case**: File uploads and management

#### **Submissions Path (`/submissions/*`):**
- **Methods**: GET, HEAD, OPTIONS
- **Caching**: Optimized caching
- **Use Case**: Student submission files

### **Error Handling:**
- **403/404 Errors**: Redirect to index.html for SPA support
- **Custom Error Pages**: Configurable error responses

## 📁 **Folder Structure**

### **Organized by Content Type:**
```
/
├── avatars/           # User profile pictures
├── assignments/       # Assignment materials and attachments
├── submissions/       # Student submission files
├── uploads/          # General file uploads
├── temp/             # Temporary files (auto-cleanup)
└── inventory/        # S3 inventory reports
```

### **File Naming Convention:**
```
{folder}/{sanitized-name}_{userId}_{timestamp}.{extension}
```

**Example:**
```
assignments/introduction_to_algorithms_user123_1705123456789.pdf
```

## 💰 **Cost Optimization**

### **Storage Class Transitions:**
1. **Standard** (0-30 days): $0.023 per GB
2. **IA** (30-90 days): $0.0125 per GB
3. **Glacier** (90-365 days): $0.004 per GB
4. **Deep Archive** (365+ days): $0.00099 per GB

### **Intelligent Tiering:**
- **Automatic**: Moves objects between access tiers
- **Monitoring**: Tracks access patterns
- **Optimization**: Reduces costs without manual intervention

### **Lifecycle Savings:**
- **Year 1**: ~40% cost reduction
- **Year 2**: ~70% cost reduction
- **Year 3+**: ~95% cost reduction

## 🔧 **API Integration**

### **File Upload Endpoint:**
```typescript
POST /api/upload
Content-Type: multipart/form-data

Body:
- file: File object
- folder: string (optional)
- userId: string (optional)
- metadata: JSON string (optional)
```

### **Presigned URL Generation:**
```typescript
GET /api/upload?fileName=example.pdf&contentType=application/pdf&folder=assignments&userId=user123
```

### **Response Format:**
```json
{
  "success": true,
  "data": {
    "fileKey": "assignments/example_user123_1705123456789.pdf",
    "fileUrl": "https://cdn.example.com/assignments/...",
    "fileName": "example.pdf",
    "fileSize": 1024000,
    "contentType": "application/pdf",
    "metadata": {
      "original-name": "example.pdf",
      "uploaded-by": "user123",
      "upload-timestamp": "2024-01-16T10:00:00Z"
    }
  }
}
```

## 🛡️ **File Validation**

### **Size Limits:**
- **Maximum**: 10MB per file
- **Recommended**: 5MB for optimal performance

### **Allowed File Types:**
- **Images**: JPEG, PNG, GIF, WebP
- **Documents**: PDF, DOC, DOCX, TXT
- **Spreadsheets**: XLS, XLSX, CSV
- **Archives**: ZIP, RAR

### **Security Measures:**
- **Content Type Validation**: Strict MIME type checking
- **File Extension Validation**: Whitelist approach
- **Size Validation**: Prevents abuse
- **Metadata Sanitization**: Clean user input

## 📈 **Monitoring & Analytics**

### **CloudWatch Metrics:**
- **Request Count**: Total requests to bucket
- **Bytes Downloaded**: Data transfer volume
- **4xx/5xx Errors**: Error rate monitoring
- **Latency**: Response time tracking

### **S3 Analytics:**
- **Storage Class Analysis**: Usage patterns
- **Data Transfer Analysis**: Bandwidth usage
- **Replication Metrics**: Cross-region performance

### **Access Logging:**
- **Request Logs**: Detailed access information
- **Log Retention**: 90 days
- **Log Analysis**: Security and performance insights

## 🚀 **Performance Optimization**

### **Caching Strategies:**
- **Static Assets**: 1 year cache for images
- **Documents**: 1 hour cache for PDFs
- **Dynamic Content**: 5 minutes cache for uploads

### **CDN Benefits:**
- **Global Distribution**: 200+ edge locations
- **Compression**: Automatic gzip compression
- **HTTP/2**: Modern protocol support
- **Edge Computing**: Lambda@Edge support

## 🔄 **Backup & Recovery**

### **Versioning:**
- **File History**: All versions preserved
- **Rollback Capability**: Restore previous versions
- **Accidental Deletion**: Protection against data loss

### **Cross-Region Replication:**
- **Disaster Recovery**: Geographic redundancy
- **Compliance**: Regional data requirements
- **Performance**: Local access optimization

## 🛠️ **Deployment Commands**

### **Deploy Storage Stack:**
```bash
# Deploy only the storage infrastructure
npm run infra:deploy:storage

# Or deploy everything
npm run infra:deploy
```

### **Check Stack Status:**
```bash
# View stack outputs
npm run infra:status

# View CloudFormation outputs
cd cdk && npm run outputs
```

### **Test File Upload:**
```bash
# Test direct upload
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test.pdf" \
  -F "folder=test" \
  -F "userId=test123"

# Test presigned URL generation
curl "http://localhost:3000/api/upload?fileName=test.pdf&contentType=application/pdf&folder=test&userId=test123"
```

## 📚 **Best Practices**

### **File Management:**
1. **Use Presigned URLs**: For secure client-side uploads
2. **Implement Retry Logic**: Handle temporary failures
3. **Validate File Types**: Prevent malicious uploads
4. **Set Appropriate TTL**: Balance cost and accessibility

### **Security:**
1. **Never Expose S3 URLs**: Use CloudFront for public access
2. **Implement Access Controls**: Restrict by user and role
3. **Monitor Access Patterns**: Detect unusual activity
4. **Regular Security Reviews**: Audit permissions and policies

### **Performance:**
1. **Use Appropriate Storage Classes**: Match access patterns
2. **Implement Caching**: Reduce origin requests
3. **Optimize File Sizes**: Compress when possible
4. **Monitor Metrics**: Track performance indicators

## 🆘 **Troubleshooting**

### **Common Issues:**

#### **CORS Errors:**
- Verify CORS configuration in S3
- Check allowed origins and methods
- Ensure proper headers are set

#### **Upload Failures:**
- Check file size limits
- Validate file types
- Verify IAM permissions

#### **Performance Issues:**
- Monitor CloudWatch metrics
- Check CloudFront cache hit rates
- Optimize storage class transitions

### **Debug Commands:**
```bash
# Check S3 bucket status
aws s3 ls s3://demoproject-storage-{ACCOUNT}-{REGION}

# Verify CORS configuration
aws s3api get-bucket-cors --bucket demoproject-storage-{ACCOUNT}-{REGION}

# Check CloudFront distribution
aws cloudfront get-distribution --id {DISTRIBUTION_ID}
```

---

## 🎯 **Next Steps**

1. **Deploy Infrastructure**: Run `npm run infra:deploy`
2. **Test File Uploads**: Use the `/api/upload` endpoint
3. **Configure Monitoring**: Set up CloudWatch alarms
4. **Implement Frontend**: Create file upload components
5. **Add Authentication**: Secure file access by user

---

**Your S3 storage infrastructure is now ready for secure, scalable file management! 🎉**
