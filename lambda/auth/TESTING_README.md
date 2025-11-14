# Testing Guide for Authentication Lambda Functions

This document provides comprehensive guidance for testing the authentication Lambda functions in the DemoProject.

## 🧪 Test Structure

```
lambda/auth/
├── __tests__/
│   ├── setup.ts                 # Global test setup and configuration
│   ├── test-utils.ts            # Common test utilities and helpers
│   ├── signup-handler.test.ts   # Tests for basic signup functionality
│   ├── role-based-signup.test.ts # Tests for role-based signup
│   └── signup-confirmation.test.ts # Tests for signup confirmation
├── jest.config.js               # Jest configuration
├── package.json                 # Dependencies and test scripts
└── TESTING_README.md           # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- TypeScript knowledge

### Installation

```bash
cd lambda/auth
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with verbose output
npm run test:verbose

# Run only unit tests
npm run test:unit

# Debug tests (useful for troubleshooting)
npm run test:debug
```

## 📋 Test Coverage

Our test suite covers the following areas:

### 1. **Signup Handler Tests** (`signup-handler.test.ts`)
- ✅ **Request Validation**
  - Valid signup requests
  - Missing required fields
  - Invalid email formats
  - Weak passwords
  - Invalid username formats
  - Invalid phone number formats

- ✅ **Role-Specific Validation**
  - Student ID requirements
  - Instructor ID requirements
  - Admin department validation

- ✅ **Duplicate User Detection**
  - Duplicate email detection
  - Duplicate username detection

- ✅ **Cognito Integration**
  - User creation in Cognito
  - Custom attributes handling
  - Error handling for Cognito failures

- ✅ **DynamoDB Integration**
  - User profile creation
  - Graceful handling of DynamoDB failures

- ✅ **Confirmation Email**
  - Email sending process
  - Graceful handling of email failures

### 2. **Role-Based Signup Tests** (`role-based-signup.test.ts`)
- ✅ **Student Signup Validation**
  - Student ID requirements
  - Enrollment year validation
  - GPA validation
  - Academic level validation

- ✅ **Instructor Signup Validation**
  - Instructor ID requirements
  - Hire date validation
  - Qualifications validation

- ✅ **Business Rule Validation**
  - Unique ID enforcement
  - Date range validation
  - Role-specific requirements

- ✅ **Group Assignment**
  - Correct Cognito group assignment
  - Role-based group membership

### 3. **Signup Confirmation Tests** (`signup-confirmation.test.ts`)
- ✅ **Confirmation Code Validation**
  - Valid confirmation requests
  - Invalid confirmation codes
  - Expired codes
  - Code mismatch handling

- ✅ **User Status Updates**
  - Account activation
  - Attribute updates
  - Status synchronization

## 🛠️ Test Utilities

### Common Test Helpers

The `test-utils.ts` file provides reusable utilities:

```typescript
import { 
  createMockAPIGatewayEvent,
  createMockLambdaContext,
  createMockStudentSignupRequest,
  createMockInstructorSignupRequest,
  assertSuccessResponse,
  assertErrorResponse,
  assertValidationErrors
} from './test-utils';

// Create mock requests
const studentRequest = createMockStudentSignupRequest();
const instructorRequest = createMockInstructorSignupRequest();

// Create mock events
const event = createMockAPIGatewayEvent(studentRequest);
const context = createMockLambdaContext();

// Assert response formats
const result = await handler(event, context);
assertSuccessResponse(result, 201);
```

### Mock Data Creation

```typescript
// Mock Cognito user
const mockUser = createMockCognitoUser('testuser', {
  'custom:role': 'student',
  'custom:department': 'Computer Science'
});

// Mock DynamoDB item
const mockItem = createMockDynamoDBItem('testuser', {
  role: 'student',
  status: 'active'
});
```

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  preset: 'ts-jest',                    // TypeScript support
  testEnvironment: 'node',              // Node.js environment
  roots: ['<rootDir>/__tests__'],      // Test directory
  coverageThreshold: {                  // Coverage requirements
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Environment Variables

Tests automatically mock environment variables:

```typescript
// Automatically set in setup.ts
process.env.USER_POOL_ID = 'test-user-pool-id';
process.env.USER_POOL_CLIENT_ID = 'test-client-id';
process.env.USERS_TABLE = 'test-users-table';
```

## 📊 Coverage Reports

### Running Coverage

```bash
npm run test:coverage
```

This generates:
- **Console output** with coverage summary
- **HTML report** in `coverage/` directory
- **LCOV report** for CI/CD integration

### Coverage Requirements

- **Branches**: 80% (conditional logic coverage)
- **Functions**: 80% (function execution coverage)
- **Lines**: 80% (line-by-line coverage)
- **Statements**: 80% (statement execution coverage)

## 🧩 Mocking Strategy

### AWS SDK Mocking

```typescript
// Mock Cognito instance
const mockCognitoInstance = {
  listUsers: jest.fn(),
  adminCreateUser: jest.fn(),
  adminAddUserToGroup: jest.fn()
};

mockCognito.mockImplementation(() => mockCognitoInstance);

// Mock responses
mockCognitoInstance.adminCreateUser.mockResolvedValue({
  User: { Username: 'testuser' }
});

// Mock errors
mockCognitoInstance.adminCreateUser.mockRejectedValue(
  new Error('UsernameExistsException')
);
```

### Environment Mocking

```typescript
// Before each test
beforeEach(() => {
  process.env = {
    ...originalEnv,
    USER_POOL_ID: 'test-user-pool-id',
    USER_POOL_CLIENT_ID: 'test-client-id'
  };
});

// After each test
afterEach(() => {
  process.env = originalEnv;
});
```

## 🚨 Common Test Patterns

### Testing Success Cases

```typescript
test('should create user successfully', async () => {
  // Arrange
  const request = createMockStudentSignupRequest();
  const event = createMockAPIGatewayEvent(request);
  
  // Mock successful AWS operations
  mockCognitoInstance.adminCreateUser.mockResolvedValue({
    User: { Username: 'student123' }
  });
  
  // Act
  const result = await handler(event, {} as any, {} as any);
  
  // Assert
  assertSuccessResponse(result, 201);
  expect(JSON.parse(result.body).data.userId).toBe('student123');
});
```

### Testing Validation Errors

```typescript
test('should reject invalid email', async () => {
  // Arrange
  const request = createMockStudentSignupRequest({ email: 'invalid-email' });
  const event = createMockAPIGatewayEvent(request);
  
  // Act
  const result = await handler(event, {} as any, {} as any);
  
  // Assert
  assertValidationErrors(result, 1);
  const body = JSON.parse(result.body);
  expect(body.details.errors).toContainEqual(
    expect.objectContaining({
      field: 'email',
      message: 'Invalid email format'
    })
  );
});
```

### Testing AWS Errors

```typescript
test('should handle Cognito user creation failure', async () => {
  // Arrange
  const request = createMockStudentSignupRequest();
  const event = createMockAPIGatewayEvent(request);
  
  // Mock AWS error
  mockCognitoInstance.adminCreateUser.mockRejectedValue(
    new Error('UsernameExistsException')
  );
  
  // Act
  const result = await handler(event, {} as any, {} as any);
  
  // Assert
  assertErrorResponse(result, 500, 'Failed to create user in Cognito');
  expect(JSON.parse(result.body).details.error).toBe('Username already exists');
});
```

## 🔍 Debugging Tests

### Verbose Output

```bash
npm run test:verbose
```

### Debug Mode

```bash
npm run test:debug
```

### Individual Test Debugging

```typescript
// Add debug statements
test('should handle complex scenario', async () => {
  console.log('Test data:', testData);
  
  // Your test code here
  
  console.log('Result:', result);
});
```

### Breakpoint Debugging

```typescript
test('should handle edge case', async () => {
  // Set breakpoint here
  debugger;
  
  const result = await handler(event, context);
  // Continue debugging
});
```

## 📝 Writing New Tests

### Test File Structure

```typescript
import { handler } from '../your-handler';
import { 
  createMockAPIGatewayEvent,
  assertSuccessResponse,
  assertErrorResponse 
} from './test-utils';

describe('Your Handler', () => {
  beforeEach(() => {
    // Setup mocks and environment
  });

  afterEach(() => {
    // Cleanup
  });

  describe('Feature Group', () => {
    test('should handle valid case', async () => {
      // Arrange, Act, Assert
    });

    test('should handle error case', async () => {
      // Arrange, Act, Assert
    });
  });
});
```

### Test Naming Convention

```typescript
// Good test names
test('should accept valid signup request', async () => {});
test('should reject duplicate email', async () => {});
test('should handle Cognito user creation failure', async () => {});

// Avoid vague names
test('should work', async () => {});
test('test case 1', async () => {});
```

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run Tests
  run: |
    cd lambda/auth
    npm install
    npm run test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: lambda/auth/coverage/lcov.info
```

### Coverage Badge

Add to your README:

```markdown
[![Test Coverage](https://codecov.io/gh/your-repo/branch/main/graph/badge.svg)](https://codecov.io/gh/your-repo)
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [TypeScript Testing](https://www.typescriptlang.org/docs/handbook/testing.html)
- [AWS Lambda Testing](https://docs.aws.amazon.com/lambda/latest/dg/testing.html)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## 🤝 Contributing

When adding new tests:

1. **Follow existing patterns** in the test files
2. **Use test utilities** from `test-utils.ts`
3. **Maintain coverage** above 80%
4. **Add descriptive test names**
5. **Test both success and failure cases**
6. **Mock external dependencies** properly

## 📞 Support

For testing questions or issues:

1. Check the existing test examples
2. Review the test utilities documentation
3. Consult the Jest configuration
4. Ask the development team

---

**Happy Testing! 🎯**
