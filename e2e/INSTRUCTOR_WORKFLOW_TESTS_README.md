# Instructor Workflow Tests

This directory contains comprehensive end-to-end tests for instructor workflows in the learning management system. The tests cover all major instructor functionalities including assignment creation, grading, community feed management, and administrative operations.

## Test Files Overview

### 1. `instructor-workflow.spec.ts` - Main Instructor Workflow Tests
Comprehensive tests covering the core instructor experience:
- **Assignment Creation and Management**: Dashboard loading, form validation, assignment management
- **Grading Workflow**: Individual and batch grading, rubric-based grading, workflow management
- **Community Feed Management**: Feed display, search, filtering, and interaction
- **Bulk Operations**: Bulk actions toolbar, status updates, export operations
- **Error Handling**: Network errors, empty states, malformed data
- **Performance**: Load times, responsive design, different screen sizes

### 2. `instructor-assignment-workflow.spec.ts` - Assignment-Specific Tests
Focused tests for assignment creation and management:
- **Assignment Creation Form**: Field validation, assignment types, file upload requirements
- **Assignment Management Interface**: List display, editing, deletion, statistics
- **Assignment Status Management**: Status changes, visibility control
- **Assignment Scheduling**: Due dates, multiple deadlines, extensions
- **Assignment Templates**: Template creation, reuse, consistency

### 3. `instructor-grading-workflow.spec.ts` - Grading and Assessment Tests
Comprehensive grading workflow tests:
- **Individual Submission Grading**: Interface loading, form validation, feedback saving
- **Batch Grading Operations**: Mode activation, selection, consistent feedback, batch saving
- **Rubric-Based Grading**: Criteria display, score calculation, criterion-specific feedback
- **Grading Workflow Management**: Progress tracking, queue management, history
- **Grading Quality Assurance**: Consistency monitoring, conflict resolution, standards enforcement
- **Grading Notifications**: Student notifications, comment delivery, dispute resolution

### 4. `instructor-bulk-operations.spec.ts` - Bulk Operations and Administration
Tests for bulk operations and administrative functions:
- **Bulk Actions Toolbar**: Visibility, available operations, selection state management
- **Bulk Status Updates**: Multiple submission updates, priority setting, note addition
- **Bulk Export Operations**: Data format generation, filter respect, multiple formats
- **Administrative User Management**: Student roster, enrollment management, progress analytics
- **Course Management**: Course creation, enrollment management, policy settings
- **System Administration**: Settings access, notification preferences, help resources
- **Data Management**: Backup, restore, export, analysis
- **Security and Access Control**: Authentication, role-based access, confirmation requirements

### 5. `instructor-community-feed.spec.ts` - Community Feed Management
Tests for community feed functionality:
- **Community Feed Display**: Page loading, submission cards, metadata display
- **Search and Filtering**: Student name, assignment title, course name, status, date range
- **Submission Interaction**: Detail viewing, feedback provision, rating, content flagging
- **Community Management**: Content moderation, guidelines, member management, analytics
- **Content Discovery**: Trending content, category browsing, following, recommendations
- **Collaboration Features**: Instructor collaboration, study groups, events, peer learning
- **Performance and Responsiveness**: Load efficiency, responsive design, search speed

## Test Structure

Each test file follows a consistent structure:

```typescript
test.describe('Feature Category', () => {
  test.beforeEach(async ({ page }) => {
    // Setup authentication and monitoring
  });

  test.describe('Sub-feature', () => {
    test('specific test case', async ({ page }) => {
      // Test implementation
    });
  });
});
```

## Key Testing Patterns

### 1. Authentication Mocking
All tests mock instructor authentication to ensure consistent test environment:

```typescript
const mockInstructor = {
  sub: 'instructor-123',
  email: 'professor.smith@university.edu',
  firstName: 'Professor',
  lastName: 'Smith',
  role: 'instructor',
  emailVerified: true,
  accessToken: 'mock-instructor-token-123'
};

await page.route('**/api/auth/me', async route => {
  await route.fulfill({
    status: 200,
    body: JSON.stringify({ user: mockInstructor })
  });
});
```

### 2. API Mocking
Tests mock API endpoints to provide consistent test data:

```typescript
await page.route('**/api/submissions**', async route => {
  await route.fulfill({
    status: 200,
    body: JSON.stringify({ submissions: mockSubmissions })
  });
});
```

### 3. Error Monitoring
Console errors are monitored and logged for debugging:

```typescript
page.on('console', msg => {
  if (msg.type() === 'error') {
    console.log('Page error:', msg.text());
  }
});
```

## Running the Tests

### Prerequisites
- Node.js and npm installed
- Playwright installed: `npm install -D @playwright/test`
- Application running on `http://localhost:3000` (or set `E2E_BASE_URL` environment variable)

### Run All Instructor Tests
```bash
npx playwright test e2e/instructor-*.spec.ts
```

### Run Specific Test Files
```bash
# Assignment workflow tests
npx playwright test e2e/instructor-assignment-workflow.spec.ts

# Grading workflow tests
npx playwright test e2e/instructor-grading-workflow.spec.ts

# Bulk operations tests
npx playwright test e2e/instructor-bulk-operations.spec.ts

# Community feed tests
npx playwright test e2e/instructor-community-feed.spec.ts
```

### Run Tests in Different Browsers
```bash
# Run in specific browser
npx playwright test e2e/instructor-workflow.spec.ts --project=chromium
npx playwright test e2e/instructor-workflow.spec.ts --project=firefox
npx playwright test e2e/instructor-workflow.spec.ts --project=webkit

# Run in all browsers
npx playwright test e2e/instructor-workflow.spec.ts
```

### Run Tests with UI
```bash
npx playwright test e2e/instructor-workflow.spec.ts --ui
```

### Run Tests in Headed Mode
```bash
npx playwright test e2e/instructor-workflow.spec.ts --headed
```

## Test Configuration

The tests use the configuration from `playwright.config.ts`:
- **Timeout**: 30 seconds for tests, 10 seconds for expectations
- **Parallel Execution**: Tests run in parallel for efficiency
- **Retries**: 2 retries in CI environments
- **Video Recording**: Retained on failure for debugging
- **Screenshots**: Captured on failure

## Test Data and Mocking

### Mock Data Structure
Tests use realistic mock data that matches the expected API responses:

```typescript
const mockSubmission = {
  submissionId: 'sub-1',
  assignmentId: 'assign-1',
  courseId: 'course-1',
  studentId: 'student-1',
  studentName: 'Sarah Johnson',
  submittedAt: '2024-01-15T10:00:00Z',
  status: 'submitted',
  files: [...],
  metadata: {...}
};
```

### API Endpoint Mocking
Common endpoints that are mocked:
- `**/api/auth/me` - Authentication status
- `**/api/submissions**` - Submission data
- `**/api/assignments**` - Assignment data
- `**/api/community-feed**` - Community feed data
- `**/api/students**` - Student roster data

## Best Practices

### 1. Test Isolation
Each test is independent and doesn't rely on the state of other tests.

### 2. Realistic Scenarios
Tests cover real-world use cases that instructors would encounter.

### 3. Comprehensive Coverage
Tests cover happy paths, error cases, edge cases, and performance scenarios.

### 4. Maintainable Tests
Tests use descriptive names and clear structure for easy maintenance.

### 5. Responsive Testing
Tests verify functionality across different screen sizes and devices.

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Ensure mock authentication is properly set up
2. **API Mocking Failures**: Check that route patterns match actual API calls
3. **Element Not Found**: Verify that selectors match the actual DOM structure
4. **Timeout Issues**: Increase timeout values for slower operations

### Debug Mode
Run tests with debug information:
```bash
npx playwright test e2e/instructor-workflow.spec.ts --debug
```

### Verbose Output
Get detailed test output:
```bash
npx playwright test e2e/instructor-workflow.spec.ts --reporter=verbose
```

## Contributing

When adding new instructor workflow tests:

1. **Follow the existing structure** and naming conventions
2. **Add comprehensive test coverage** for new features
3. **Include error handling** and edge case testing
4. **Test responsive design** across different screen sizes
5. **Document new test patterns** in this README

## Related Documentation

- [Playwright Testing Guide](https://playwright.dev/docs/intro)
- [E2E Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Test Configuration](https://playwright.dev/docs/test-configuration)
- [API Mocking](https://playwright.dev/docs/network)
