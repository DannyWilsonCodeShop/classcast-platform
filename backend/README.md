# ClassCast Platform - Clean Backend Architecture

## 🎯 **Overview**

This is a completely fresh, clean backend architecture built from the ground up to match your beautiful frontend. No more mock data, no more complex state management issues, no more base64 problems!

## 🏗️ **Architecture**

```
Backend (AWS Serverless)
├── src/
│   ├── types/              # Shared TypeScript types
│   ├── services/           # Business logic services
│   └── utils/              # Helper functions
├── functions/              # Lambda functions
│   ├── auth/               # Authentication
│   ├── users/              # User management
│   └── courses/            # Course management
├── infrastructure/         # CDK infrastructure
└── database/               # DynamoDB schemas
```

## 🚀 **Quick Start**

### **1. Prerequisites**
- Node.js 18+
- AWS CLI configured
- AWS CDK installed (`npm install -g aws-cdk`)

### **2. Deploy Backend**
```bash
cd backend
./deploy.sh
```

### **3. Get API Endpoints**
After deployment, check the CDK outputs for:
- API Gateway URL
- Cognito User Pool ID
- S3 Bucket Name

## 📊 **Database Design**

### **DynamoDB Tables**

1. **Users Table** (`ClassCastUsers`)
   - PK: `USER#{userId}`
   - SK: `PROFILE`
   - GSI1: `EMAIL#{email}` (for email lookups)

2. **Courses Table** (`ClassCastCourses`)
   - PK: `COURSE#{courseId}`
   - SK: `METADATA`
   - GSI1: `INSTRUCTOR#{instructorId}` (for instructor's courses)

3. **Assignments Table** (`ClassCastAssignments`)
   - PK: `COURSE#{courseId}`
   - SK: `ASSIGNMENT#{assignmentId}`
   - GSI1: `DUE_DATE#{dueDate}` (for due date queries)

4. **Submissions Table** (`ClassCastSubmissions`)
   - PK: `ASSIGNMENT#{assignmentId}`
   - SK: `SUBMISSION#{submissionId}`
   - GSI1: `STUDENT#{studentId}` (for student's submissions)

## 🔐 **Authentication**

- **Cognito User Pools** for user management
- **JWT tokens** for API authorization
- **Role-based access** (Student, Instructor, Admin)
- **Secure password policies**

## 📡 **API Endpoints**

### **Authentication**
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh token

### **Users**
- `GET /users/{userId}/profile` - Get user profile
- `PUT /users/{userId}/profile` - Update user profile

### **Courses**
- `GET /courses` - List all courses
- `POST /courses` - Create course
- `GET /courses/{id}` - Get course details
- `PUT /courses/{id}` - Update course
- `DELETE /courses/{id}` - Delete course

## 🛠️ **Development**

### **Local Development**
```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### **Adding New Features**

1. **Define Types** in `src/types/index.ts`
2. **Create Service** in `src/services/`
3. **Build Lambda** in `functions/`
4. **Add API Route** in infrastructure
5. **Test & Deploy**

## 🧪 **Testing**

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- --testNamePattern="UserService"
```

## 📈 **Monitoring**

- **CloudWatch Logs** for all Lambda functions
- **CloudWatch Metrics** for performance monitoring
- **X-Ray Tracing** for distributed tracing
- **Custom metrics** for business KPIs

## 🔧 **Configuration**

### **Environment Variables**
- `USERS_TABLE_NAME` - DynamoDB users table
- `COURSES_TABLE_NAME` - DynamoDB courses table
- `ASSIGNMENTS_TABLE_NAME` - DynamoDB assignments table
- `SUBMISSIONS_TABLE_NAME` - DynamoDB submissions table
- `COGNITO_USER_POOL_ID` - Cognito user pool ID
- `COGNITO_CLIENT_ID` - Cognito client ID
- `S3_BUCKET_NAME` - S3 bucket for file storage

## 🚀 **Deployment**

### **Staging**
```bash
cd infrastructure
cdk deploy --context environment=staging
```

### **Production**
```bash
cd infrastructure
cdk deploy --context environment=production
```

## 📋 **Best Practices**

### **1. Data Management**
- ✅ Always use services for business logic
- ✅ Validate all inputs
- ✅ Handle errors gracefully
- ✅ Use proper TypeScript types

### **2. Security**
- ✅ Validate JWT tokens
- ✅ Check user permissions
- ✅ Sanitize inputs
- ✅ Use HTTPS only

### **3. Performance**
- ✅ Use DynamoDB efficiently
- ✅ Implement proper caching
- ✅ Optimize Lambda cold starts
- ✅ Monitor performance metrics

## 🎯 **Key Benefits**

- ✅ **Clean Architecture** - Separation of concerns
- ✅ **Type Safety** - Full TypeScript support
- ✅ **Scalable** - Serverless architecture
- ✅ **Secure** - Cognito + IAM
- ✅ **Maintainable** - Clear code structure
- ✅ **Testable** - Unit and integration tests
- ✅ **No Mock Data** - Real data only
- ✅ **No Base64 Issues** - S3 URLs only

## 🔄 **Migration from Old Backend**

1. **Deploy new backend** using this architecture
2. **Update frontend** to use new API endpoints
3. **Migrate data** from old database (if needed)
4. **Test thoroughly** with real data
5. **Switch DNS** to new endpoints
6. **Decommission** old backend

## 📞 **Support**

If you encounter any issues:

1. Check the CloudWatch logs
2. Verify environment variables
3. Test API endpoints manually
4. Check DynamoDB permissions
5. Review IAM roles

## 🎉 **Success!**

You now have a clean, scalable, maintainable backend that perfectly matches your frontend! No more mock data, no more complex state management, no more base64 issues. Just clean, professional code that works! 🚀