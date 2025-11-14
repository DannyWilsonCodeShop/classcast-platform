# DemoProject Types and Validation

This directory contains TypeScript interfaces, Zod validation schemas, and validation utilities for the DemoProject application.

## 📁 File Structure

```
types/
├── entities.ts           # Core entity interfaces
├── validation.ts         # Custom validation functions
├── zod-schemas.ts        # Zod validation schemas
├── validation-utils.ts   # Validation utility functions
├── transform-utils.ts    # Data transformation and sanitization utilities
├── services.ts           # Service layer interfaces
├── index.ts             # Main export file
├── package.json         # Dependencies
├── README.md            # This file
└── TRANSFORMATION_README.md # Transformation utilities documentation
```

## 🚀 Quick Start

### Installation

```bash
cd types
npm install
```

### Basic Usage

```typescript
import { 
  schemas, 
  validation,
  type CreateUser,
  type User 
} from './types';

// Validate user creation data
const userData = {
  username: 'john_doe',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'student',
  studentId: 'STU123'
};

const result = validation.validateCreateUser(userData);

if (result.success) {
  const validatedUser: CreateUser = result.data;
  console.log('User data is valid:', validatedUser);
} else {
  console.error('Validation failed:', result.errorMessage);
}
```

## 🔧 Zod Validation Schemas

### Available Schemas

#### User Schemas
- `userSchema` - Complete user entity
- `createUserSchema` - User creation validation
- `updateUserSchema` - User update validation

#### Assignment Schemas
- `assignmentSchema` - Complete assignment entity
- `createAssignmentSchema` - Assignment creation validation
- `updateAssignmentSchema` - Assignment update validation

#### Submission Schemas
- `assignmentSubmissionSchema` - Complete submission entity
- `createSubmissionSchema` - Submission creation validation
- `updateSubmissionSchema` - Submission update validation
- `gradeSubmissionSchema` - Submission grading validation

#### Course Schemas
- `courseSchema` - Complete course entity
- `createCourseSchema` - Course creation validation
- `updateCourseSchema` - Course update validation

#### Filter Schemas
- `userFiltersSchema` - User search filters
- `assignmentFiltersSchema` - Assignment search filters
- `submissionFiltersSchema` - Submission search filters
- `courseFiltersSchema` - Course search filters
- `paginationSchema` - Pagination parameters

### Schema Features

- **Type Safety**: Full TypeScript type inference
- **Runtime Validation**: Comprehensive data validation
- **Custom Error Messages**: Clear, user-friendly error messages
- **Business Logic**: Complex validation rules (e.g., start date < end date)
- **Default Values**: Sensible defaults for optional fields
- **Regex Patterns**: Strict format validation for IDs, emails, etc.

## 🛠️ Validation Utilities

### Core Functions

#### `validateData<T>(schema, data, options?)`
Main validation function that throws errors on failure.

```typescript
import { validation } from './types';

try {
  const user = validation.validateData(schemas.createUserSchema, userData);
  // user is fully typed and validated
} catch (error) {
  // Handle validation error
}
```

#### `safeValidate<T>(schema, data, options?)`
Safe validation function that returns a result object.

```typescript
const result = validation.safeValidate(schemas.createUserSchema, userData);

if (result.success) {
  const user = result.data; // Fully typed
} else {
  console.error(result.errorMessage);
}
```

### Entity-Specific Functions

```typescript
// User validation
const userResult = validation.validateCreateUser(userData);
const updateResult = validation.validateUpdateUser(updateData);

// Assignment validation
const assignmentResult = validation.validateCreateAssignment(assignmentData);
const updateAssignmentResult = validation.validateUpdateAssignment(updateData);

// Submission validation
const submissionResult = validation.validateCreateSubmission(submissionData);
const gradeResult = validation.validateGradeSubmission(gradeData);

// Course validation
const courseResult = validation.validateCreateCourse(courseData);
const updateCourseResult = validation.validateUpdateCourse(updateData);
```

### Filter Validation

```typescript
// Validate search filters
const userFilters = validation.validateUserFilters({
  role: 'student',
  department: 'Computer Science'
});

const assignmentFilters = validation.validateAssignmentFilters({
  courseId: 'CS101',
  type: 'essay',
  dueDateRange: {
    start: '2024-01-01T00:00:00Z',
    end: '2024-12-31T23:59:59Z'
  }
});

// Validate pagination
const pagination = validation.validatePagination({
  page: 1,
  limit: 20
});
```

### Utility Functions

```typescript
// Email validation
const isValidEmail = validation.validateEmail('user@example.com');

// Username validation
const isValidUsername = validation.validateUsername('john_doe');

// Password strength validation
const passwordResult = validation.validatePassword('MySecurePass123!');
if (passwordResult.success) {
  console.log('Password strength:', passwordResult.data.strength);
}

// File validation
const isValidFileType = validation.validateFileType('application/pdf', ['application/pdf', 'text/plain']);
const isValidFileSize = validation.validateFileSize(1024 * 1024, 10 * 1024 * 1024); // 1MB vs 10MB

// Date range validation
const isValidRange = validation.validateDateRange(new Date('2024-01-01'), new Date('2024-12-31'));
```

### Batch Validation

```typescript
// Validate multiple items
const batchResult = validation.validateBatch(schemas.createUserSchema, userDataArray);

if (batchResult.success) {
  const validUsers = batchResult.data;
} else {
  console.error('Batch validation failed:', batchResult.errorMessage);
}

// Partial batch validation
const partialResult = validation.validateBatchPartial(schemas.createUserSchema, userDataArray);
console.log('Valid users:', partialResult.valid.length);
console.log('Invalid users:', partialResult.invalid.length);
```

### Error Handling

```typescript
import { validation } from './types';

const result = validation.validateCreateUser(invalidData);

if (!result.success) {
  // Get first error
  const firstError = validation.getFirstError(result);
  console.error('First error:', firstError);
  
  // Get all errors
  const allErrors = validation.getAllErrors(result);
  console.error('All errors:', allErrors);
  
  // Format Zod error
  if (result.errors) {
    const formattedError = validation.formatZodError(result.errors);
    console.error('Formatted error:', formattedError);
  }
}
```

## 📝 Schema Examples

### User Creation

```typescript
const validUserData = {
  username: 'jane_smith',
  email: 'jane.smith@university.edu',
  firstName: 'Jane',
  lastName: 'Smith',
  role: 'instructor',
  instructorId: 'INS456',
  department: 'Computer Science',
  bio: 'Experienced software engineering instructor'
};

const result = validation.validateCreateUser(validUserData);
```

### Assignment Creation

```typescript
const validAssignmentData = {
  title: 'Final Project Implementation',
  description: 'Implement a full-stack web application using modern technologies',
  courseId: 'CS401',
  type: 'project',
  points: 100,
  weight: 25,
  dueDate: '2024-05-15T23:59:59Z',
  startDate: '2024-04-01T00:00:00Z',
  allowLateSubmission: true,
  latePenalty: 10,
  maxSubmissions: 3,
  allowedFileTypes: ['application/pdf', 'application/zip'],
  maxFileSize: 50 * 1024 * 1024, // 50MB
  individualSubmission: true,
  autoGrade: false,
  peerReview: true
};

const result = validation.validateCreateAssignment(validAssignmentData);
```

### Course Creation

```typescript
const validCourseData = {
  title: 'Advanced Software Engineering',
  description: 'Advanced concepts in software engineering including design patterns, architecture, and testing',
  code: 'CS401',
  department: 'Computer Science',
  credits: 3,
  level: 'undergraduate',
  learningOutcomes: [
    'Apply design patterns to solve complex software problems',
    'Design and implement scalable software architectures',
    'Write comprehensive test suites for software applications'
  ],
  startDate: '2024-01-15T00:00:00Z',
  endDate: '2024-05-15T23:59:59Z',
  semester: 'Spring 2024',
  academicYear: '2024',
  maxEnrollment: 30
};

const result = validation.validateCreateCourse(validCourseData);
```

## ⚙️ Configuration Options

### Validation Options

```typescript
const options = {
  stripUnknown: true,    // Remove unknown fields
  abortEarly: false      // Collect all errors instead of stopping at first
};

const result = validation.validateData(schemas.createUserSchema, userData, options);
```

### Custom Error Messages

The schemas include custom error messages for better user experience:

- Field-specific validation messages
- Business logic validation messages
- Format requirement messages
- Character limit messages

## 🔒 Security Features

- **Input Sanitization**: Built-in sanitization for user inputs
- **Type Safety**: Prevents type-related vulnerabilities
- **Regex Validation**: Strict format validation for sensitive fields
- **Size Limits**: File size and content length restrictions
- **Business Rules**: Prevents invalid business logic

## 📊 Performance Considerations

- **Lazy Validation**: Schemas are only compiled when used
- **Efficient Parsing**: Zod uses optimized parsing algorithms
- **Memory Efficient**: Minimal memory overhead for validation
- **Batch Processing**: Support for validating multiple items efficiently

## 🧪 Testing

```typescript
import { schemas, validation } from './types';

describe('User Validation', () => {
  it('should validate valid user data', () => {
    const validData = { /* valid user data */ };
    const result = validation.validateCreateUser(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid user data', () => {
    const invalidData = { /* invalid user data */ };
    const result = validation.validateCreateUser(invalidData);
    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeDefined();
  });
});
```

## 🔄 Migration from Custom Validation

If you're migrating from the custom validation functions in `validation.ts`:

```typescript
// Old way
import { validateUser } from './validation';
const result = validateUser(userData);

// New way
import { validation } from './types';
const result = validation.validateCreateUser(userData);
```

## 🔄 Data Transformation and Sanitization

The package includes comprehensive utilities for data transformation, sanitization, and normalization:

### Core Features
- **Data Sanitization**: Remove HTML, normalize case, trim whitespace
- **Entity Transformation**: Transform data using Zod schemas with sanitization
- **Data Normalization**: Consistent formatting for names, emails, dates, etc.
- **Security Cleaning**: Remove sensitive information for public display
- **Smart Merging**: Merge data with transformation and validation

### Quick Example
```typescript
import { transformation } from './types';

const result = transformation.transformCreateUser(userData, {
  sanitize: true,
  sanitizationOptions: {
    removeHtml: true,
    normalizeCase: 'title',
    trimWhitespace: true
  }
});
```

For detailed documentation, see [TRANSFORMATION_README.md](./TRANSFORMATION_README.md).

## 📚 Additional Resources

- [Zod Documentation](https://zod.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [DemoProject API Documentation](../API_GATEWAY_README.md)
- [Data Transformation Guide](./TRANSFORMATION_README.md)

## 🤝 Contributing

When adding new schemas or validation rules:

1. Follow the existing naming conventions
2. Add comprehensive error messages
3. Include business logic validation where appropriate
4. Add corresponding validation utility functions
5. Update this README with examples
6. Add tests for new functionality

## 📄 License

MIT License - see LICENSE file for details.
