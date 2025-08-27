# Assignment Queries Unit Tests

## Overview

This document describes the comprehensive unit test suite for the assignment query functionality in the `fetch-assignments.ts` Lambda handler. The tests cover all aspects of assignment retrieval, filtering, sorting, pagination, and access control.

## Test Coverage

### 🧪 **Test Categories**

#### 1. **Query Parameter Building** (`describe('Query Parameter Building')`)
- **Course-based queries**: Tests DynamoDB query construction using `CourseStatusIndex`
- **Instructor-based queries**: Tests queries using `InstructorCreatedIndex`
- **General queries**: Tests scan operations with filters for students

#### 2. **Filtering Operations** (`describe('Filtering Operations')`)
- **Status filtering**: Single status and multiple statuses
- **Type filtering**: Assignment type (essay, quiz, project, etc.)
- **Week filtering**: Week number and date range filtering
- **Date filtering**: Due date range filtering
- **Difficulty filtering**: Based on assignment points
- **Submission type**: Individual vs. group submissions
- **Tags filtering**: Multiple tag matching
- **Search filtering**: Text search across multiple fields

#### 3. **Sorting Operations** (`describe('Sorting Operations')`)
- **Due date sorting**: Ascending and descending
- **Title sorting**: Alphabetical ordering
- **Points sorting**: Numerical ordering
- **Created date sorting**: Chronological ordering
- **Status sorting**: Status-based ordering

#### 4. **Pagination Operations** (`describe('Pagination Operations')`)
- **Default pagination**: Page 1, 20 items
- **Custom page sizes**: Various limit values
- **Page navigation**: Specific page requests
- **Smart page numbers**: 5-page window around current
- **Edge case handling**: Invalid page numbers
- **Cursor-based pagination**: Modern pagination approach

#### 5. **Query Execution and Error Handling** (`describe('Query Execution and Error Handling')`)
- **DynamoDB errors**: ResourceNotFoundException, AccessDeniedException
- **Pagination with LastEvaluatedKey**: Multi-query handling
- **Result limits**: Safety limits for large result sets
- **Query optimization**: Early termination for performance

#### 6. **Assignment Enrichment** (`describe('Assignment Enrichment')`)
- **Statistics inclusion**: When `includeStats=true`
- **Submission information**: When `includeSubmissions=true`
- **Course information**: Always included for context

#### 7. **Access Control** (`describe('Access Control')`)
- **Student restrictions**: Only published assignments, course ID required
- **Instructor permissions**: Department and course access
- **Admin privileges**: Full access to all assignments
- **Role validation**: Proper permission checking

#### 8. **Response Formatting** (`describe('Response Formatting')`)
- **Request ID generation**: Unique tracking identifiers
- **Filter summary**: Comprehensive parameter tracking
- **CORS headers**: Proper cross-origin support

## 🚀 **Running the Tests**

### **Prerequisites**
```bash
npm install
npm run build
```

### **Run All Tests**
```bash
npm test
```

### **Run Only Assignment Query Tests**
```bash
npm test -- --testPathPattern="assignment-queries.test.ts"
```

### **Run with Coverage**
```bash
npm test -- --coverage --testPathPattern="assignment-queries.test.ts"
```

### **Run in Watch Mode**
```bash
npm test -- --watch --testPathPattern="assignment-queries.test.ts"
```

## 📊 **Test Data and Mocking**

### **Mock DynamoDB Client**
```typescript
const mockDynamoClient = {
  query: jest.fn(),
  get: jest.fn(),
  scan: jest.fn()
};
```

### **Mock JWT Verifier**
```typescript
jest.mock('../jwt-verifier', () => ({
  verifyJwtToken: jest.fn()
}));
```

### **Mock User Types**
- **Instructor**: Full access to department courses
- **Student**: Limited to enrolled courses, published assignments only
- **Admin**: Full access to all assignments

### **Mock Event Structure**
```typescript
const mockEvent = {
  queryStringParameters: {},
  headers: { Authorization: 'Bearer mock-token' },
  body: null,
  // ... other APIGatewayProxyEvent properties
};
```

## 🔍 **Key Test Scenarios**

### **Filtering Tests**
1. **Status Filtering**
   - Single status: `?status=published`
   - Multiple statuses: `?statuses=published,active`
   - Status priority: Multiple statuses override single status

2. **Week Number Filtering**
   - ISO 8601 week calculation
   - Year boundary handling
   - Date range validation

3. **Search Functionality**
   - Text search across title, description, searchableText
   - Case-insensitive matching
   - Partial word matching

### **Pagination Tests**
1. **Offset-based Pagination**
   - Page number validation and clamping
   - Page size limits (1-100)
   - Navigation metadata generation

2. **Cursor-based Pagination**
   - Base64-encoded cursor generation
   - Bidirectional navigation
   - Performance optimization

### **Access Control Tests**
1. **Student Access**
   - Course enrollment requirement
   - Published assignment restriction
   - Proper error messages

2. **Instructor Access**
   - Department-based course access
   - Assignment ownership validation
   - Course teaching permissions

## 🧪 **Test Assertions and Validation**

### **Response Structure Validation**
```typescript
expect(response?.statusCode).toBe(200);
expect(body.success).toBe(true);
expect(body.data.assignments).toBeDefined();
expect(body.data.pagination).toBeDefined();
```

### **DynamoDB Query Validation**
```typescript
expect(mockDynamoClient.query).toHaveBeenCalledWith(
  expect.objectContaining({
    TableName: 'DemoProject-Assignments',
    IndexName: 'CourseStatusIndex',
    KeyConditionExpression: 'courseId = :courseId AND #status = :status'
  })
);
```

### **Data Integrity Validation**
```typescript
// Verify filtering works correctly
expect(body.data.assignments.every((a: any) => a.status === 'published')).toBe(true);

// Verify sorting works correctly
const dueDates = body.data.assignments.map((a: any) => new Date(a.dueDate).getTime());
expect(dueDates).toEqual([...dueDates].sort((a, b) => a - b));
```

## 🚨 **Error Handling Tests**

### **DynamoDB Errors**
- **ResourceNotFoundException**: Table doesn't exist
- **AccessDeniedException**: Insufficient permissions
- **Generic errors**: Unknown DynamoDB errors

### **Validation Errors**
- **Invalid query parameters**: Malformed requests
- **Missing required fields**: Course ID for students
- **Access denied**: Insufficient permissions

### **Edge Cases**
- **Large result sets**: Safety limits and optimization
- **Invalid pagination**: Page number clamping
- **Empty results**: Proper handling of no data

## 📈 **Performance Testing**

### **Query Optimization**
- **Early termination**: Stop when sufficient items collected
- **Result limits**: Prevent memory issues with large datasets
- **Index usage**: Proper GSI selection for different query types

### **Pagination Performance**
- **Cursor-based pagination**: Better performance for large datasets
- **Smart page generation**: Efficient navigation display
- **Memory management**: Controlled result set sizes

## 🔧 **Test Maintenance**

### **Adding New Tests**
1. **Identify the feature** to test
2. **Create appropriate mock data** for the test scenario
3. **Add test case** in the relevant describe block
4. **Validate assertions** cover the feature behavior
5. **Update documentation** if needed

### **Updating Existing Tests**
1. **Check test data** matches current implementation
2. **Verify mock setup** is still correct
3. **Update assertions** if behavior changes
4. **Maintain test isolation** and independence

### **Test Data Management**
- **Mock data consistency**: Ensure realistic test scenarios
- **Edge case coverage**: Include boundary conditions
- **Performance scenarios**: Test with large datasets
- **Error conditions**: Cover all error paths

## 📚 **Related Documentation**

- **`fetch-assignments.ts`**: Main handler implementation
- **`PAGINATION_FEATURES_README.md`**: Pagination feature documentation
- **`FETCH_ASSIGNMENTS_README.md`**: General handler documentation
- **`WEEK_NUMBER_STATUS_FILTERING_README.md`**: Week and status filtering

## 🎯 **Test Goals**

### **Primary Objectives**
1. **Ensure correctness** of all query operations
2. **Validate access control** for different user roles
3. **Test pagination** with various scenarios
4. **Verify filtering** and sorting functionality
5. **Cover error handling** comprehensively

### **Secondary Objectives**
1. **Performance validation** of query operations
2. **Edge case coverage** for robust operation
3. **API contract validation** for consistent responses
4. **Security testing** of access controls

## 🚀 **Next Steps**

### **Immediate Actions**
1. **Run the test suite** to verify current functionality
2. **Review test coverage** for any missing scenarios
3. **Add integration tests** for end-to-end validation
4. **Performance testing** with realistic data volumes

### **Future Enhancements**
1. **Load testing** with high-volume scenarios
2. **Security testing** for vulnerability assessment
3. **API contract testing** for backward compatibility
4. **Monitoring integration** for production insights

---

**Total Test Count**: 50+ comprehensive test cases  
**Coverage Areas**: Query building, filtering, sorting, pagination, access control, error handling  
**Test Framework**: Jest with comprehensive mocking  
**Maintenance**: Regular updates as features evolve

