# DemoProject Data Transformation and Sanitization Utilities

This document describes the comprehensive data transformation and sanitization utilities available in the DemoProject types package.

## 📁 File Structure

```
types/
├── transform-utils.ts      # Data transformation and sanitization utilities
├── TRANSFORMATION_README.md # This documentation file
└── ...                     # Other type files
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { transformation } from './types';

// Transform and sanitize user data
const userData = {
  firstName: '  john  ',
  lastName: 'DOE',
  email: 'JOHN@EXAMPLE.COM',
  bio: '<script>alert("xss")</script>Bio content'
};

const result = transformation.transformCreateUser(userData, {
  sanitize: true,
  sanitizationOptions: {
    removeHtml: true,
    trimWhitespace: true,
    normalizeCase: 'title'
  }
});

if (result.success) {
  console.log('Transformed user:', result.data);
  // Output: { firstName: 'John', lastName: 'Doe', email: 'john@example.com', bio: 'Bio content' }
}
```

## 🔧 Core Transformation Functions

### `transformData<T>(data, schema, options?)`

Main transformation function that applies schema validation with optional sanitization.

```typescript
import { schemas, transformation } from './types';

const result = transformation.transformData(
  rawData,
  schemas.createUserSchema,
  {
    sanitize: true,
    validate: true
  }
);

if (result.success) {
  const validatedData = result.data; // Fully typed and validated
} else {
  console.error('Transformation failed:', result.errors);
}
```

### `transformAndValidate<T>(data, schema, options?)`

Comprehensive transformation with built-in validation.

```typescript
const result = transformation.transformAndValidate(
  userData,
  schemas.updateUserSchema,
  {
    sanitize: true,
    sanitizationOptions: {
      removeHtml: true,
      trimWhitespace: true
    }
  }
);
```

## 🧹 Sanitization Functions

### `sanitizeData(data, options?)`

Remove potentially harmful content from data.

```typescript
const sanitized = transformation.sanitizeData(userData, {
  removeHtml: true,           // Remove HTML tags
  trimWhitespace: true,       // Trim leading/trailing spaces
  normalizeCase: 'title',     // Title case normalization
  maxLength: 100,             // Truncate long strings
  allowedTags: ['b', 'i'],    // Allow specific HTML tags
  preserveNewlines: true      // Convert newlines to <br> tags
});
```

### Sanitization Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `removeHtml` | boolean | true | Remove HTML tags |
| `trimWhitespace` | boolean | true | Trim whitespace |
| `normalizeCase` | 'lower' \| 'upper' \| 'title' \| 'none' | 'none' | Case normalization |
| `maxLength` | number | undefined | Maximum string length |
| `allowedTags` | string[] | [] | Allowed HTML tags |
| `preserveNewlines` | boolean | false | Convert newlines to `<br>` |

## 🎯 Entity-Specific Transformations

### User Transformations

```typescript
// Transform user creation data
const userResult = transformation.transformCreateUser(userData, {
  sanitize: true,
  sanitizationOptions: {
    normalizeCase: 'title',
    removeHtml: true
  }
});

// Transform user update data
const updateResult = transformation.transformUpdateUser(updateData, {
  sanitize: true,
  validate: true
});
```

### Assignment Transformations

```typescript
// Transform assignment creation data
const assignmentResult = transformation.transformCreateAssignment(assignmentData, {
  sanitize: true,
  sanitizationOptions: {
    removeHtml: true,
    trimWhitespace: true
  }
});

// Transform assignment update data
const updateAssignmentResult = transformation.transformUpdateAssignment(updateData);
```

### Submission Transformations

```typescript
// Transform submission creation data
const submissionResult = transformation.transformCreateSubmission(submissionData, {
  sanitize: true,
  sanitizationOptions: {
    removeHtml: true,
    preserveNewlines: true
  }
});

// Transform submission update data
const updateSubmissionResult = transformation.transformUpdateSubmission(updateData);
```

### Course Transformations

```typescript
// Transform course creation data
const courseResult = transformation.transformCreateCourse(courseData, {
  sanitize: true,
  sanitizationOptions: {
    normalizeCase: 'title',
    removeHtml: true
  }
});

// Transform course update data
const updateCourseResult = transformation.transformUpdateCourse(updateData);
```

## 🔄 Data Normalization Functions

### Field-Specific Normalization

```typescript
// Normalize names (Title Case)
const firstName = transformation.normalizeName('  john  '); // "John"
const lastName = transformation.normalizeName('DOE'); // "Doe"

// Normalize emails (lowercase)
const email = transformation.normalizeEmail('JOHN@EXAMPLE.COM'); // "john@example.com"

// Normalize titles (Title Case)
const title = transformation.normalizeTitle('  final project  '); // "Final Project"

// Normalize text content
const text = transformation.normalizeText('  Multiple   newlines\n\n\nhere  '); // "Multiple newlines\n\nhere"

// Normalize department names
const dept = transformation.normalizeDepartment('computer science'); // "Computer Science"

// Normalize course codes
const code = transformation.normalizeCourseCode('cs101'); // "CS101"

// Normalize dates to ISO format
const date = transformation.normalizeDate('2024-01-15'); // "2024-01-15T00:00:00.000Z"
```

### Entity Normalization

```typescript
// Normalize entire user object
const normalizedUser = transformation.normalizeUserData({
  firstName: '  john  ',
  lastName: 'DOE',
  email: 'JOHN@EXAMPLE.COM',
  department: 'computer science',
  bio: '  Software engineer  '
});

// Normalize entire assignment object
const normalizedAssignment = transformation.normalizeAssignmentData({
  title: '  final project  ',
  description: '  Project description  ',
  dueDate: '2024-05-15',
  startDate: '2024-04-01'
});

// Normalize entire course object
const normalizedCourse = transformation.normalizeCourseData({
  title: '  advanced software engineering  ',
  description: '  Course description  ',
  code: 'cs401',
  department: 'computer science',
  startDate: '2024-01-15',
  endDate: '2024-05-15'
});
```

## 🧽 Data Cleaning Functions

### Security-Focused Cleaning

```typescript
// Remove sensitive user information for public display
const publicUser = transformation.sanitizeUserForPublic({
  userId: '123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  password: 'hashedPassword123',
  cognitoSub: 'cognito-sub-123'
});
// Result: { userId: '123', firstName: 'John', lastName: 'Doe', email: 'john@example.com' }

// Remove sensitive assignment information for students
const publicAssignment = transformation.sanitizeAssignmentForStudents({
  assignmentId: '456',
  title: 'Final Project',
  description: 'Project description',
  instructorNotes: 'Internal notes for instructors',
  rubric: { /* grading rubric */ },
  submissions: [/* student submissions */]
});
// Result: { assignmentId: '456', title: 'Final Project', description: 'Project description' }

// Clean file metadata for security
const publicFile = transformation.sanitizeFileMetadata({
  fileId: '789',
  fileName: 'document.pdf',
  fileSize: 1024,
  internalPath: '/internal/path',
  accessKey: 'AKIA...',
  secretKey: 'secret...'
});
// Result: { fileId: '789', fileName: 'document.pdf', fileSize: 1024 }
```

## 🔗 Data Merging Functions

### Smart Data Merging

```typescript
// Merge user data with updates
const existingUser = {
  userId: '123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  updatedAt: '2024-01-01T00:00:00Z'
};

const updates = {
  firstName: '  Jonathan  ',
  bio: '<script>alert("xss")</script>New bio'
};

const mergedResult = transformation.mergeUserData(existingUser, updates, {
  sanitize: true,
  sanitizationOptions: {
    removeHtml: true,
    trimWhitespace: true,
    normalizeCase: 'title'
  }
});

if (mergedResult.success) {
  console.log(mergedResult.data);
  // Output: { userId: '123', firstName: 'Jonathan', lastName: 'Doe', email: 'john@example.com', bio: 'New bio', updatedAt: '2024-01-15T...' }
}
```

### Deep Merging

```typescript
// Deep merge objects
const target = {
  user: {
    profile: { name: 'John', age: 30 },
    settings: { theme: 'dark' }
  }
};

const source = {
  user: {
    profile: { age: 31 },
    settings: { language: 'en' }
  }
};

const merged = transformation.deepMerge(target, source);
// Result: { user: { profile: { name: 'John', age: 31 }, settings: { theme: 'dark', language: 'en' } } }
```

## 🔍 Data Validation Helpers

### Transformation Detection

```typescript
// Check if data needs transformation
const needsTransform = transformation.needsTransformation({
  firstName: '  john  ',
  bio: '<script>alert("xss")</script>Content'
}); // true

// Get transformation recommendations
const recommendations = transformation.getTransformationRecommendations({
  firstName: '  john  ',
  bio: '<script>alert("xss")</script>Content',
  birthDate: new Date('invalid-date')
});
// Result: [
//   "firstName: Contains leading/trailing whitespace",
//   "bio: Contains HTML-like content",
//   "birthDate: Invalid date value"
// ]
```

## 📊 Advanced Usage Examples

### Batch Processing with Transformation

```typescript
import { validation, transformation } from './types';

// Process multiple users with transformation
const userDataArray = [
  { firstName: '  john  ', lastName: 'DOE', email: 'JOHN@EXAMPLE.COM' },
  { firstName: '  jane  ', lastName: 'SMITH', email: 'JANE@EXAMPLE.COM' }
];

const processedUsers = userDataArray.map(userData => {
  const result = transformation.transformCreateUser(userData, {
    sanitize: true,
    sanitizationOptions: {
      normalizeCase: 'title',
      trimWhitespace: true
    }
  });
  
  if (result.success) {
    return result.data;
  } else {
    console.error('Failed to process user:', result.errors);
    return null;
  }
}).filter(Boolean);

console.log('Processed users:', processedUsers);
```

### Conditional Transformation

```typescript
// Apply different transformations based on user role
function transformUserData(userData: any, userRole: string) {
  const baseOptions = {
    sanitize: true,
    trimWhitespace: true
  };

  if (userRole === 'admin') {
    // Admins can see all data, minimal sanitization
    return transformation.transformCreateUser(userData, {
      ...baseOptions,
      sanitizationOptions: {
        removeHtml: false,
        normalizeCase: 'none'
      }
    });
  } else {
    // Regular users get full sanitization
    return transformation.transformCreateUser(userData, {
      ...baseOptions,
      sanitizationOptions: {
        removeHtml: true,
        normalizeCase: 'title',
        maxLength: 500
      }
    });
  }
}
```

### Error Handling and Recovery

```typescript
// Robust transformation with error recovery
function safeTransformUserData(userData: any) {
  try {
    // First attempt: full transformation
    const result = transformation.transformCreateUser(userData, {
      sanitize: true,
      validate: true
    });

    if (result.success) {
      return { success: true, data: result.data, warnings: [] };
    }

    // Second attempt: sanitize without validation
    const sanitizedResult = transformation.transformCreateUser(userData, {
      sanitize: true,
      validate: false
    });

    if (sanitizedResult.success) {
      return {
        success: true,
        data: sanitizedResult.data,
        warnings: ['Data was sanitized but validation failed']
      };
    }

    // Final attempt: basic normalization
    const normalizedData = transformation.normalizeUserData(userData);
    return {
      success: true,
      data: normalizedData,
      warnings: ['Data was normalized but not fully processed']
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    };
  }
}
```

## ⚙️ Configuration Best Practices

### Recommended Sanitization Configurations

```typescript
// For user input (forms, API requests)
const USER_INPUT_OPTIONS: SanitizationOptions = {
  removeHtml: true,
  trimWhitespace: true,
  normalizeCase: 'title',
  maxLength: 1000,
  preserveNewlines: false
};

// For display content (user-generated content)
const DISPLAY_CONTENT_OPTIONS: SanitizationOptions = {
  removeHtml: true,
  trimWhitespace: true,
  normalizeCase: 'none',
  allowedTags: ['b', 'i', 'u', 'em', 'strong'],
  preserveNewlines: true
};

// For search/indexing
const SEARCH_INDEX_OPTIONS: SanitizationOptions = {
  removeHtml: true,
  trimWhitespace: true,
  normalizeCase: 'lower',
  maxLength: undefined,
  preserveNewlines: false
};
```

### Performance Optimization

```typescript
// Cache transformation results for repeated operations
const transformationCache = new Map();

function cachedTransform<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  options: TransformationOptions = {}
): TransformationResult<T> {
  const cacheKey = JSON.stringify({ data, options });
  
  if (transformationCache.has(cacheKey)) {
    return transformationCache.get(cacheKey);
  }
  
  const result = transformation.transformData(data, schema, options);
  transformationCache.set(cacheKey, result);
  
  return result;
}
```

## 🔒 Security Considerations

### XSS Prevention

```typescript
// Always remove HTML for user input
const secureOptions: SanitizationOptions = {
  removeHtml: true,
  allowedTags: [], // No exceptions
  trimWhitespace: true
};

// For rich text editors, use a whitelist approach
const richTextOptions: SanitizationOptions = {
  removeHtml: true,
  allowedTags: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
  preserveNewlines: true
};
```

### Data Leakage Prevention

```typescript
// Always sanitize before sending to client
function prepareUserForClient(user: any, userRole: string) {
  if (userRole === 'admin') {
    return transformation.sanitizeUserForPublic(user);
  } else {
    // Remove additional fields for non-admin users
    const { internalNotes, auditLog, ...publicUser } = user;
    return transformation.sanitizeUserForPublic(publicUser);
  }
}
```

## 🧪 Testing

### Unit Tests

```typescript
import { transformation } from './types';

describe('Data Transformation', () => {
  it('should sanitize HTML content', () => {
    const result = transformation.sanitizeData({
      bio: '<script>alert("xss")</script>Content'
    }, { removeHtml: true });
    
    expect(result.success).toBe(true);
    expect(result.data.bio).toBe('Content');
  });

  it('should normalize case', () => {
    const result = transformation.sanitizeData({
      firstName: '  john  '
    }, { normalizeCase: 'title', trimWhitespace: true });
    
    expect(result.success).toBe(true);
    expect(result.data.firstName).toBe('John');
  });
});
```

## 📚 Integration with Other Utilities

### With Validation

```typescript
import { validation, transformation } from './types';

// Validate first, then transform
const validationResult = validation.validateCreateUser(userData);
if (validationResult.success) {
  const transformResult = transformation.transformCreateUser(validationResult.data, {
    sanitize: true
  });
  // Use transformed data
}
```

### With API Gateway

```typescript
// In Lambda function
export const handler = async (event: any) => {
  try {
    const userData = JSON.parse(event.body);
    
    // Transform and validate incoming data
    const result = transformation.transformCreateUser(userData, {
      sanitize: true,
      validate: true
    });
    
    if (!result.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({ errors: result.errors })
      };
    }
    
    // Process validated and sanitized data
    const user = await createUser(result.data);
    
    return {
      statusCode: 201,
      body: JSON.stringify(user)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
```

## 🤝 Contributing

When adding new transformation functions:

1. Follow the existing naming conventions
2. Add comprehensive error handling
3. Include security considerations
4. Add corresponding tests
5. Update this documentation
6. Consider performance implications

## 📄 License

MIT License - see LICENSE file for details.
