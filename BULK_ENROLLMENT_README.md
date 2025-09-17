# Bulk Student Enrollment Feature

## 🎓 Overview

The Bulk Student Enrollment feature allows instructors to efficiently add multiple students to their courses through a user-friendly wizard interface. Students receive welcome emails with login credentials and are automatically enrolled in the specified course.

## ✨ Features

### 📝 Multiple Input Methods
- **Text Input**: Paste email addresses directly (one per line)
- **CSV Upload**: Upload CSV files with student information
- **Flexible Format**: Support for email, firstName, lastName columns
- **Validation**: Automatic email format validation

### 📧 Email Notifications
- **Welcome Emails**: Beautiful HTML emails sent to new students
- **Login Credentials**: Temporary passwords for first-time login
- **Course Information**: Details about the enrolled course
- **Professional Design**: Branded email templates

### 🔐 User Management
- **Cognito Integration**: Automatic user account creation
- **Role Assignment**: Students automatically assigned to 'students' group
- **Password Management**: Secure temporary passwords
- **Duplicate Prevention**: Check for existing users before creation

### 📊 Enrollment Tracking
- **Real-time Progress**: Live updates during enrollment process
- **Detailed Results**: Success/failure status for each student
- **Error Reporting**: Clear error messages for failed enrollments
- **Export Results**: Download CSV with enrollment results

## 🏗️ Architecture

### Database Tables

#### `classcast-enrollments`
Stores student course enrollments:
```json
{
  "enrollmentId": "enrollment_123",
  "userId": "user_456",
  "courseId": "course_789",
  "status": "active",
  "enrolledAt": "2024-12-10T10:30:00Z",
  "courseName": "CS 101",
  "courseCode": "CS-101",
  "instructorId": "instructor_123",
  "instructorName": "Dr. Smith"
}
```

#### `classcast-users`
Enhanced user records with enrollment data:
```json
{
  "userId": "user_456",
  "email": "student@university.edu",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student",
  "status": "active",
  "createdAt": "2024-12-10T10:30:00Z"
}
```

### API Endpoints

#### Bulk Enrollment API
- `POST /api/courses/bulk-enroll` - Process bulk student enrollment
- Request body includes courseId and students array
- Returns detailed results with success/failure status

### React Components

#### `BulkEnrollmentWizard`
Main wizard component with multi-step interface:
- Step 1: Choose input method (text/CSV)
- Step 2: Review parsed students
- Step 3: Display enrollment results

#### `CourseCard` (Enhanced)
Added "Add Students" button for published courses:
- Only visible for published courses
- Opens bulk enrollment wizard
- Integrated with course management

## 🚀 Setup Instructions

### 1. Deploy Infrastructure
```bash
# Deploy the CDK stack with enrollment tables
./scripts/setup-bulk-enrollment.sh
```

### 2. Configure Environment Variables
Update `.env.local` with your AWS configuration:
```bash
# AWS Configuration
AWS_REGION=us-east-1

# DynamoDB Tables
ENROLLMENTS_TABLE=classcast-enrollments
USERS_TABLE=classcast-users
COURSES_TABLE=classcast-courses

# Cognito Configuration
COGNITO_USER_POOL_ID=your_user_pool_id

# SES Configuration
SES_FROM_EMAIL=noreply@yourdomain.com

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Configure AWS SES
1. Go to AWS SES Console
2. Verify your sending domain or email address
3. Request production access if needed
4. Set up DKIM records for your domain
5. Update `SES_FROM_EMAIL` in environment variables

### 4. Start Development Server
```bash
npm run dev
```

### 5. Test the Feature
```bash
# Run the test suite
node scripts/test-bulk-enrollment.js
```

## 📱 User Experience

### Instructor Workflow
1. **Access**: Navigate to instructor portal → Courses
2. **Select Course**: Click "Add Students" on any published course
3. **Choose Method**: Select text input or CSV upload
4. **Add Students**: Paste emails or upload CSV file
5. **Review**: Verify student list before processing
6. **Process**: Click "Enroll Students" to start enrollment
7. **Results**: View detailed enrollment results
8. **Export**: Download results CSV if needed

### Student Experience
1. **Receive Email**: Get welcome email with course details
2. **Login**: Use provided credentials to access platform
3. **Set Password**: Change temporary password on first login
4. **Access Course**: Automatically enrolled in the course

## 🧪 Testing

### Manual Testing
1. Create a course and publish it
2. Navigate to instructor portal
3. Click "Add Students" on the course
4. Test both text input and CSV upload methods
5. Verify email notifications are sent
6. Check student accounts are created

### Automated Testing
The test suite verifies:
- Database table connectivity
- Email parsing functionality
- CSV parsing functionality
- API endpoint functionality
- Integration with Cognito

## 🔧 Configuration

### Email Templates
Email templates are defined in the API endpoint and include:
- Course information
- Login credentials
- Welcome message
- Professional styling
- Responsive design

### CSV Format
Supported CSV format:
```csv
email,firstName,lastName
student1@university.edu,John,Doe
student2@university.edu,Jane,Smith
student3@university.edu,Bob,Johnson
```

### Text Input Format
Supported text input format:
```
student1@university.edu
student2@university.edu,John,Doe
student3@university.edu,Jane,Smith
```

## 🚨 Troubleshooting

### Common Issues

#### "No courses found"
- Ensure you have created and published at least one course
- Check course status in the instructor portal

#### "Email sending failed"
- Verify SES configuration and domain verification
- Check `SES_FROM_EMAIL` environment variable
- Ensure SES is in production mode for unverified emails

#### "User creation failed"
- Verify Cognito User Pool configuration
- Check `COGNITO_USER_POOL_ID` environment variable
- Ensure proper IAM permissions for Cognito operations

#### "Database errors"
- Check DynamoDB table names in environment variables
- Verify AWS credentials and region settings
- Ensure tables exist and are accessible

### Debug Mode
Enable detailed logging by setting:
```bash
NODE_ENV=development
```

## 🔮 Future Enhancements

### Planned Features
- **Batch Processing**: Process large student lists in batches
- **Email Templates**: Customizable email templates
- **Student Groups**: Organize students into groups
- **Import History**: Track previous bulk enrollments
- **Advanced Validation**: More sophisticated email validation
- **Integration**: Connect with student information systems

### Performance Optimizations
- **Async Processing**: Process enrollments asynchronously
- **Progress Tracking**: Real-time progress updates
- **Error Recovery**: Resume failed enrollments
- **Caching**: Cache course and user data

## 📊 Analytics & Reporting

### Tracked Metrics
- **Enrollment Success Rate**: Percentage of successful enrollments
- **Email Delivery Rate**: Percentage of emails delivered
- **User Activation Rate**: Percentage of users who log in
- **Course Popularity**: Most enrolled courses

### Business Intelligence
- Identify enrollment patterns
- Track student engagement
- Monitor instructor usage
- Measure feature adoption

## 🤝 Contributing

### Adding New Input Formats
1. Update the parsing functions in `BulkEnrollmentWizard.tsx`
2. Add validation logic
3. Update the UI to support new format
4. Add tests for the new format

### Customizing Email Templates
1. Modify the email template in the API endpoint
2. Add template variables as needed
3. Update the email styling
4. Test with different course types

### Code Style
- Use TypeScript for type safety
- Follow React best practices
- Write comprehensive tests
- Document all public APIs

## 📄 Security Considerations

### Data Protection
- **Email Privacy**: Student emails are handled securely
- **Password Security**: Temporary passwords are generated securely
- **Access Control**: Only instructors can bulk enroll students
- **Audit Trail**: All enrollments are logged

### Best Practices
- Validate all input data
- Sanitize email addresses
- Use secure password generation
- Implement rate limiting
- Monitor for abuse

## 📄 License

This feature is part of the ClassCast Platform and follows the same licensing terms.

---

**Happy Teaching! 🎓✨**
