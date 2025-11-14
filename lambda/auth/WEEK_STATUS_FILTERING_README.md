# Week Number and Status Filtering

## Overview

The Fetch Assignments Handler now supports advanced filtering by week number and multiple statuses, providing powerful academic planning and course management capabilities. These features allow users to filter assignments based on specific weeks of the academic year and multiple assignment statuses simultaneously.

## 🗓️ Week Number Filtering

### What is Week Number Filtering?

Week number filtering allows you to retrieve assignments that are due within a specific week of the year. This is particularly useful for:
- **Academic Planning**: View all assignments due in a specific week
- **Course Scheduling**: Plan course workload distribution
- **Student Planning**: Help students organize their weekly tasks
- **Instructor Workload Management**: Balance assignment distribution across weeks

### How Week Numbers are Calculated

The system uses the **ISO 8601 week numbering standard**:
- **Week 1**: The week containing January 1st
- **Week Start**: Monday (Day 1)
- **Week End**: Sunday (Day 7)
- **Year Boundary**: Weeks can span across year boundaries

### Week Number Calculation Algorithm

```typescript
function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}
```

### Week Date Range Calculation

```typescript
function getWeekDates(weekNumber: number, year: number): { weekStart: Date; weekEnd: Date } {
  const startOfYear = new Date(year, 0, 1);
  const firstWeekStart = new Date(startOfYear);
  
  // Adjust to first Monday of the year
  const dayOfWeek = startOfYear.getDay();
  const daysToAdd = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
  firstWeekStart.setDate(startOfYear.getDate() + daysToAdd);
  
  // Calculate target week start
  const weekStart = new Date(firstWeekStart);
  weekStart.setDate(firstWeekStart.getDate() + (weekNumber - 1) * 7);
  
  // Calculate week end (Sunday)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return { weekStart, weekEnd };
}
```

## 📊 Status Filtering

### Single Status vs Multiple Statuses

The system supports two approaches to status filtering:

#### 1. Single Status Filter
```typescript
// Filter by a single status
GET /assignments?status=published
```

#### 2. Multiple Statuses Filter
```typescript
// Filter by multiple statuses
GET /assignments?statuses=published,active,draft
```

### Status Priority

When both `status` and `statuses` parameters are provided:
- **`statuses` takes precedence** over `status`
- The single `status` parameter is ignored
- This ensures consistent behavior and prevents conflicts

### Available Status Values

| Status | Description | Use Case |
|--------|-------------|----------|
| `draft` | Assignment is in draft mode | Instructor preparation |
| `published` | Assignment is published and visible | Student viewing |
| `active` | Assignment is currently active | Ongoing submissions |
| `completed` | Assignment period has ended | Grading phase |
| `archived` | Assignment is archived | Historical reference |

## 🚀 API Usage Examples

### Week Number Filtering

#### Filter by Week Number
```bash
# Get assignments due in week 26
GET /assignments?courseId=CS101&weekNumber=26

# Get assignments due in week 1
GET /assignments?courseId=CS101&weekNumber=1

# Get assignments due in week 52 (end of year)
GET /assignments?courseId=CS101&weekNumber=52
```

#### Filter by Week Date Range
```bash
# Get assignments due between specific dates (alternative to week number)
GET /assignments?courseId=CS101&weekStart=2024-06-24T00:00:00.000Z&weekEnd=2024-06-30T23:59:59.999Z
```

### Status Filtering

#### Single Status
```bash
# Get only published assignments
GET /assignments?courseId=CS101&status=published

# Get only active assignments
GET /assignments?courseId=CS101&status=active

# Get only draft assignments (instructors only)
GET /assignments?courseId=CS101&status=draft
```

#### Multiple Statuses
```bash
# Get published and active assignments
GET /assignments?courseId=CS101&statuses=published,active

# Get assignments in preparation phase
GET /assignments?courseId=CS101&statuses=draft,published

# Get all non-archived assignments
GET /assignments?courseId=CS101&statuses=draft,published,active,completed
```

### Combined Filtering

#### Week + Status Combination
```bash
# Get published assignments due in week 26
GET /assignments?courseId=CS101&weekNumber=26&status=published

# Get active assignments due in week 1
GET /assignments?courseId=CS101&weekNumber=1&status=active

# Get multiple status assignments due in specific week
GET /assignments?courseId=CS101&weekNumber=26&statuses=published,active
```

#### Advanced Combinations
```bash
# Get essay assignments due in week 26 with published status
GET /assignments?courseId=CS101&weekNumber=26&type=essay&status=published

# Get multiple status assignments due in week range with difficulty filter
GET /assignments?courseId=CS101&weekStart=2024-06-24T00:00:00.000Z&weekEnd=2024-06-30T23:59:59.999Z&statuses=published,active&difficulty=medium

# Get assignments due in week 26 with tags and multiple statuses
GET /assignments?courseId=CS101&weekNumber=26&statuses=published,active&tags=essay,writing&includeStats=true
```

## 🔧 Implementation Details

### Query Parameter Schema

```typescript
const fetchAssignmentsSchema = z.object({
  // ... existing parameters ...
  status: z.enum(['draft', 'published', 'active', 'completed', 'archived']).optional(),
  statuses: z.array(z.enum(['draft', 'published', 'active', 'completed', 'archived'])).optional(),
  weekNumber: z.number().int().min(1).max(53).optional(),
  weekStart: z.string().optional(), // ISO date for week start
  weekEnd: z.string().optional(),   // ISO date for week end
  // ... existing parameters ...
});
```

### Filter Application Order

1. **Primary Query**: DynamoDB index-based filtering
2. **Status Filtering**: Apply status or statuses filter
3. **Week Filtering**: Apply week number or week date range filter
4. **Secondary Filtering**: Apply other filters (type, difficulty, etc.)
5. **Sorting**: Apply sorting to filtered results
6. **Pagination**: Apply pagination to sorted results

### Week Number Validation

```typescript
// Week number must be between 1 and 53
weekNumber: z.number().int().min(1).max(53).optional()

// Week dates must be valid ISO dates
weekStart: z.string().optional(), // ISO date for week start
weekEnd: z.string().optional(),   // ISO date for week end
```

## 📈 Performance Considerations

### Week Number Calculation

- **Efficient Calculation**: Week numbers are calculated using mathematical operations
- **Caching**: Week date calculations can be cached for repeated queries
- **Index Optimization**: Consider creating a week-based GSI for high-volume queries

### Status Filtering

- **Multiple Status Queries**: When using `statuses`, the system applies in-memory filtering
- **Index Usage**: Single `status` queries can leverage DynamoDB indexes
- **Combination Queries**: Week + status combinations may require custom indexes

### Recommended DynamoDB Indexes

```yaml
# Week-based queries
WeekStatusIndex:
  PartitionKey: weekNumber
  SortKey: status

# Status-based queries
StatusWeekIndex:
  PartitionKey: status
  SortKey: weekNumber

# Combined queries
WeekStatusTypeIndex:
  PartitionKey: weekNumber
  SortKey: status#type
```

## 🧪 Testing

### Unit Tests

The system includes comprehensive unit tests for:
- **Week Number Calculation**: `getWeekNumber()` function
- **Week Date Calculation**: `getWeekDates()` function
- **Week Membership Check**: `isDateInWeek()` function
- **Status Filtering**: Single and multiple status scenarios
- **Combined Filtering**: Week + status combinations

### Test Scenarios

#### Week Number Tests
- ✅ Correct week number for January 1st
- ✅ Correct week number for middle of year
- ✅ Correct week number for December 31st
- ✅ Leap year handling
- ✅ Week boundary calculations
- ✅ Year boundary handling

#### Status Filtering Tests
- ✅ Single status filtering
- ✅ Multiple statuses filtering
- ✅ Status priority (statuses over status)
- ✅ Invalid status handling
- ✅ Empty statuses array handling

#### Integration Tests
- ✅ Week + status combinations
- ✅ Week + other filter combinations
- ✅ Status + other filter combinations
- ✅ Complex multi-parameter queries

## 🚨 Error Handling

### Week Number Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `Invalid week number` | Week number < 1 or > 53 | Use valid week number (1-53) |
| `Invalid week dates` | Invalid ISO date format | Use valid ISO date format |
| `Week date mismatch` | weekStart > weekEnd | Ensure weekStart ≤ weekEnd |

### Status Filtering Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `Invalid status` | Unknown status value | Use valid status from enum |
| `Empty statuses` | Empty statuses array | Provide at least one status |
| `Status conflict` | Both status and statuses provided | Use only statuses for multiple |

### Validation Examples

```typescript
// ❌ Invalid week number
GET /assignments?weekNumber=0      // Error: Week number must be ≥ 1
GET /assignments?weekNumber=54     // Error: Week number must be ≤ 53

// ❌ Invalid status
GET /assignments?status=invalid    // Error: Invalid status value
GET /assignments?statuses=invalid  // Error: Invalid status value

// ❌ Invalid week dates
GET /assignments?weekStart=invalid-date  // Error: Invalid date format
GET /assignments?weekEnd=invalid-date    // Error: Invalid date format

// ✅ Valid combinations
GET /assignments?weekNumber=26&status=published
GET /assignments?weekNumber=26&statuses=published,active
GET /assignments?weekStart=2024-06-24T00:00:00.000Z&weekEnd=2024-06-30T23:59:59.999Z
```

## 🔮 Future Enhancements

### Planned Features

- **Academic Calendar Integration**: Support for academic year weeks
- **Semester-based Week Numbers**: Support for semester-specific week numbering
- **Week Range Queries**: Query assignments across multiple weeks
- **Holiday Awareness**: Exclude holidays from week calculations
- **Time Zone Support**: Handle different time zones for week boundaries

### Performance Improvements

- **Week-based Indexes**: Optimize DynamoDB queries for week filtering
- **Caching Strategy**: Cache week calculations for frequently accessed weeks
- **Batch Processing**: Support for bulk week-based queries
- **Real-time Updates**: WebSocket support for week-based notifications

## 📚 Additional Resources

### Related Documentation
- [Fetch Assignments Handler](./FETCH_ASSIGNMENTS_README.md)
- [Assignment Creation Handler](./ASSIGNMENT_HANDLER_README.md)
- [Instructor Access Control](./INSTRUCTOR_ACCESS_CONTROL_README.md)

### Standards and References
- [ISO 8601 Week Date System](https://en.wikipedia.org/wiki/ISO_week_date)
- [Academic Calendar Standards](https://www.education.gov/academic-calendar)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)

### Support and Training
- **Technical Issues**: Contact development team
- **Week Number Calculations**: Review ISO 8601 documentation
- **Status Filtering**: Check status enum values
- **Performance Issues**: Review DynamoDB index configuration

---

*This comprehensive week number and status filtering system provides powerful academic planning capabilities while maintaining excellent performance and user experience.*

