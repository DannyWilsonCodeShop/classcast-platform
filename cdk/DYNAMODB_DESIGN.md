# DynamoDB Table Design for DemoProject

## 🏗️ **Overview**

This document describes the DynamoDB table design for the DemoProject application, including table structures, Global Secondary Indexes (GSIs), and access patterns.

## 📊 **Table Architecture**

### **1. Users Table (`DemoProject-Users`)**

#### **Primary Key Structure:**
- **Partition Key (PK)**: `userId` (String) - Unique identifier for each user
- **Sort Key (SK)**: `email` (String) - User's email address

#### **Global Secondary Indexes (GSIs):**

##### **EmailIndex**
- **Partition Key**: `email`
- **Sort Key**: `userId`
- **Projection**: ALL
- **Use Case**: Look up users by email address

##### **RoleIndex**
- **Partition Key**: `role`
- **Sort Key**: `createdAt`
- **Projection**: INCLUDE (userId, email, firstName, lastName, status)
- **Use Case**: Find all users with a specific role, sorted by creation date

##### **StatusIndex**
- **Partition Key**: `status`
- **Sort Key**: `lastLoginAt`
- **Projection**: INCLUDE (userId, email, role, firstName, lastName)
- **Use Case**: Find users by status (active, inactive, suspended) sorted by last login

##### **TTLIndex**
- **Partition Key**: `ttl`
- **Sort Key**: `userId`
- **Projection**: KEYS_ONLY
- **Use Case**: Automatic cleanup of expired user sessions/tokens

#### **Sample User Item:**
```json
{
  "userId": "user_12345",
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student",
  "status": "active",
  "createdAt": "2024-01-16T10:00:00Z",
  "lastLoginAt": "2024-01-16T15:30:00Z",
  "profile": {
    "avatar": "https://example.com/avatar.jpg",
    "bio": "Computer Science student"
  },
  "ttl": 1737129600
}
```

---

### **2. Assignments Table (`DemoProject-Assignments`)**

#### **Primary Key Structure:**
- **Partition Key (PK)**: `assignmentId` (String) - Unique identifier for each assignment
- **Sort Key (SK)**: `courseId` (String) - Course identifier

#### **Global Secondary Indexes (GSIs):**

##### **CourseIndex**
- **Partition Key**: `courseId`
- **Sort Key**: `dueDate`
- **Projection**: ALL
- **Use Case**: Find all assignments for a course, sorted by due date

##### **InstructorIndex**
- **Partition Key**: `instructorId`
- **Sort Key**: `createdAt`
- **Projection**: INCLUDE (assignmentId, title, courseId, dueDate, status)
- **Use Case**: Find all assignments created by a specific instructor

##### **StatusIndex**
- **Partition Key**: `status`
- **Sort Key**: `dueDate`
- **Projection**: INCLUDE (assignmentId, title, courseId, instructorId)
- **Use Case**: Find assignments by status (draft, published, closed) sorted by due date

##### **TypeIndex**
- **Partition Key**: `assignmentType`
- **Sort Key**: `dueDate`
- **Projection**: INCLUDE (assignmentId, title, courseId, instructorId, status)
- **Use Case**: Find assignments by type (essay, quiz, project) sorted by due date

##### **TTLIndex**
- **Partition Key**: `ttl`
- **Sort Key**: `assignmentId`
- **Projection**: KEYS_ONLY
- **Use Case**: Automatic cleanup of old assignments

#### **Sample Assignment Item:**
```json
{
  "assignmentId": "assign_67890",
  "courseId": "course_cs101",
  "title": "Introduction to Algorithms",
  "description": "Implement basic sorting algorithms",
  "assignmentType": "project",
  "instructorId": "user_98765",
  "status": "published",
  "dueDate": "2024-02-01T23:59:59Z",
  "createdAt": "2024-01-16T09:00:00Z",
  "maxScore": 100,
  "requirements": [
    "Bubble Sort implementation",
    "Quick Sort implementation",
    "Performance analysis"
  ],
  "ttl": 1737129600
}
```

---

### **3. Submissions Table (`DemoProject-Submissions`)**

#### **Primary Key Structure:**
- **Partition Key (PK)**: `submissionId` (String) - Unique identifier for each submission
- **Sort Key (SK)**: `assignmentId` (String) - Assignment identifier

#### **Global Secondary Indexes (GSIs):**

##### **AssignmentIndex**
- **Partition Key**: `assignmentId`
- **Sort Key**: `submittedAt`
- **Projection**: ALL
- **Use Case**: Find all submissions for an assignment, sorted by submission time

##### **StudentIndex**
- **Partition Key**: `studentId`
- **Sort Key**: `submittedAt`
- **Projection**: INCLUDE (submissionId, assignmentId, status, score, feedback)
- **Use Case**: Find all submissions by a specific student

##### **StatusIndex**
- **Partition Key**: `status`
- **Sort Key**: `submittedAt`
- **Projection**: INCLUDE (submissionId, assignmentId, studentId, score)
- **Use Case**: Find submissions by status (submitted, graded, late) sorted by submission time

##### **CourseIndex**
- **Partition Key**: `courseId`
- **Sort Key**: `submittedAt`
- **Projection**: INCLUDE (submissionId, assignmentId, studentId, status, score)
- **Use Case**: Find all submissions for a course, sorted by submission time

##### **TTLIndex**
- **Partition Key**: `ttl`
- **Sort Key**: `submissionId`
- **Projection**: KEYS_ONLY
- **Use Case**: Automatic cleanup of old submissions

#### **Sample Submission Item:**
```json
{
  "submissionId": "sub_11111",
  "assignmentId": "assign_67890",
  "studentId": "user_12345",
  "courseId": "course_cs101",
  "status": "submitted",
  "submittedAt": "2024-01-31T22:30:00Z",
  "score": null,
  "feedback": null,
  "files": [
    {
      "name": "bubble_sort.py",
      "url": "https://s3.amazonaws.com/submissions/bubble_sort.py",
      "size": 2048
    },
    {
      "name": "quick_sort.py",
      "url": "https://s3.amazonaws.com/submissions/quick_sort.py",
      "size": 3072
    }
  ],
  "metadata": {
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "submissionMethod": "web"
  },
  "ttl": 1737129600
}
```

---

## 🔍 **Access Patterns & Query Examples**

### **User Management:**
```typescript
// Find user by ID
const user = await dynamoDB.get({
  TableName: 'DemoProject-Users',
  Key: { userId: 'user_12345', email: 'john.doe@example.com' }
});

// Find user by email
const userByEmail = await dynamoDB.query({
  TableName: 'DemoProject-Users',
  IndexName: 'EmailIndex',
  KeyConditionExpression: 'email = :email',
  ExpressionAttributeValues: { ':email': 'john.doe@example.com' }
});

// Find all active students
const activeStudents = await dynamoDB.query({
  TableName: 'DemoProject-Users',
  IndexName: 'StatusIndex',
  KeyConditionExpression: 'status = :status',
  ExpressionAttributeValues: { ':status': 'active' }
});
```

### **Assignment Management:**
```typescript
// Find all assignments for a course
const courseAssignments = await dynamoDB.query({
  TableName: 'DemoProject-Assignments',
  IndexName: 'CourseIndex',
  KeyConditionExpression: 'courseId = :courseId',
  ExpressionAttributeValues: { ':courseId': 'course_cs101' }
});

// Find assignments by instructor
const instructorAssignments = await dynamoDB.query({
  TableName: 'DemoProject-Assignments',
  IndexName: 'InstructorIndex',
  KeyConditionExpression: 'instructorId = :instructorId',
  ExpressionAttributeValues: { ':instructorId': 'user_98765' }
});

// Find published assignments due soon
const dueAssignments = await dynamoDB.query({
  TableName: 'DemoProject-Assignments',
  IndexName: 'StatusIndex',
  KeyConditionExpression: 'status = :status AND dueDate <= :dueDate',
  ExpressionAttributeValues: { 
    ':status': 'published',
    ':dueDate': '2024-02-01T23:59:59Z'
  }
});
```

### **Submission Management:**
```typescript
// Find all submissions for an assignment
const assignmentSubmissions = await dynamoDB.query({
  TableName: 'DemoProject-Submissions',
  IndexName: 'AssignmentIndex',
  KeyConditionExpression: 'assignmentId = :assignmentId',
  ExpressionAttributeValues: { ':assignmentId': 'assign_67890' }
});

// Find student's submission history
const studentSubmissions = await dynamoDB.query({
  TableName: 'DemoProject-Submissions',
  IndexName: 'StudentIndex',
  KeyConditionExpression: 'studentId = :studentId',
  ExpressionAttributeValues: { ':studentId': 'user_12345' }
});

// Find ungraded submissions
const ungradedSubmissions = await dynamoDB.query({
  TableName: 'DemoProject-Submissions',
  IndexName: 'StatusIndex',
  KeyConditionExpression: 'status = :status',
  ExpressionAttributeValues: { ':status': 'submitted' }
});
```

---

## 🚀 **Performance Considerations**

### **Partition Key Design:**
- **Users**: `userId` provides even distribution across partitions
- **Assignments**: `assignmentId` ensures unique distribution
- **Submissions**: `submissionId` provides unique distribution

### **Sort Key Benefits:**
- **Users**: `email` allows efficient email lookups
- **Assignments**: `courseId` enables course-based queries
- **Submissions**: `assignmentId` enables assignment-based queries

### **GSI Optimization:**
- **Projection Types**: Use `INCLUDE` for frequently accessed attributes
- **TTL Indexes**: Enable automatic cleanup without additional queries
- **Composite Keys**: Combine partition and sort keys for efficient queries

---

## 🔒 **Security & Compliance**

### **Encryption:**
- **At Rest**: AWS managed encryption (AES-256)
- **In Transit**: TLS 1.2+ for all API calls

### **Access Control:**
- **IAM Policies**: Least privilege access
- **VPC Endpoints**: Secure access from VPC
- **CloudTrail**: Audit logging for compliance

### **Data Protection:**
- **Point-in-Time Recovery**: 35-day recovery window
- **Streams**: Change data capture for analytics
- **TTL**: Automatic data lifecycle management

---

## 📈 **Scaling Considerations**

### **Capacity Planning:**
- **On-Demand Billing**: Pay per request for variable workloads
- **Auto Scaling**: Automatic scaling based on demand
- **Partition Management**: Monitor partition distribution

### **Monitoring:**
- **CloudWatch Metrics**: Track table performance
- **Contributor Insights**: Identify hot keys
- **DynamoDB Streams**: Real-time change monitoring

---

## 🛠️ **Deployment Commands**

### **Deploy Database Stack:**
```bash
# Deploy only the database infrastructure
npm run infra:deploy:database

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

---

## 📚 **Additional Resources**

- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Global Secondary Indexes](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html)
- [DynamoDB Streams](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html)
- [TTL for DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html)

---

**Your DynamoDB tables are now ready for high-performance, scalable data operations! 🎉**
