# Pagination Features for Assignment Lists

## Overview

The fetch assignments handler provides comprehensive pagination capabilities to efficiently handle large lists of assignments. This document outlines all available pagination features, including both traditional offset-based pagination and modern cursor-based pagination.

## Pagination Types

### 1. Offset-Based Pagination (Default)

Traditional page-based navigation using page numbers and limits.

**Parameters:**
- `page`: Page number (1-based, default: 1)
- `limit`: Items per page (1-100, default: 20)

**Example Request:**
```
GET /assignments?page=3&limit=25
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "assignments": [...],
    "pagination": {
      "currentPage": 3,
      "pageSize": 25,
      "totalPages": 8,
      "totalCount": 200,
      "startItem": 51,
      "endItem": 75,
      "hasNextPage": true,
      "hasPreviousPage": true,
      "nextPage": 4,
      "previousPage": 2,
      "pageNumbers": [1, 2, 3, 4, 5],
      "firstPage": 1,
      "lastPage": 8,
      "canGoToFirst": true,
      "canGoToLast": true,
      "showingItems": "51-75 of 200"
    }
  }
}
```

### 2. Cursor-Based Pagination

Modern pagination approach using opaque cursors for better performance with large datasets.

**Parameters:**
- `paginationType`: Set to "cursor"
- `cursor`: Base64-encoded cursor for navigation
- `limit`: Items per page (1-100, default: 20)

**Example Request:**
```
GET /assignments?paginationType=cursor&limit=25
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "assignments": [...],
    "pagination": {
      "currentPage": 1,
      "pageSize": 25,
      "totalPages": null,
      "totalCount": null,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    "cursors": {
      "first": "eyJpdGVtSWQiOiJhc3NpZ25tZW50XzEiLCJ0aW1lc3RhbXAiOiIyMDI0LTAxLTAxVDAwOjAwOjAwLjAwMFoifQ==",
      "last": "eyJpdGVtSWQiOiJhc3NpZ25tZW50XzI1IiwidGltZXN0YW1wIjoiMjAyNC0wMS0wMVQwMDowMDowMC4wMDBaIn0=",
      "next": "eyJpdGVtSWQiOiJhc3NpZ25tZW50XzI1IiwidGltZXN0YW1wIjoiMjAyNC0wMS0wMVQwMDowMDowMC4wMDBaIn0=",
      "previous": null
    }
  }
}
```

## Navigation Features

### Page Numbers Display
- Shows up to 5 page numbers around the current page
- Automatically adjusts when near boundaries
- Provides intuitive navigation for users

### Navigation Helpers
- `canGoToFirst`: Whether user can jump to first page
- `canGoToLast`: Whether user can jump to last page
- `firstPage`: Always 1
- `lastPage`: Total number of pages

### Item Range Information
- `startItem`: First item number on current page
- `endItem`: Last item number on current page
- `showingItems`: Human-readable range (e.g., "51-75 of 200")

## Performance Optimizations

### Early Termination
The system automatically stops collecting results when:
- Sufficient items are collected for pagination (3x the requested limit)
- Maximum safety limit is reached (10,000 items)
- All available results are retrieved

### Memory Management
- Efficient slicing of results
- No unnecessary data retention
- Optimized for large result sets

## Usage Examples

### Basic Pagination
```javascript
// Get first page with 20 items
const response = await fetch('/assignments?page=1&limit=20');

// Get second page with 50 items
const response = await fetch('/assignments?page=2&limit=50');
```

### Cursor-Based Navigation
```javascript
// Get first page
const response = await fetch('/assignments?paginationType=cursor&limit=25');
const { cursors } = response.data;

// Get next page using cursor
const nextResponse = await fetch(`/assignments?paginationType=cursor&limit=25&cursor=${cursors.next}`);

// Get previous page
const prevResponse = await fetch(`/assignments?paginationType=cursor&limit=25&cursor=${cursors.previous}`);
```

### Combined with Other Filters
```javascript
// Get published assignments for CS101, page 2, 30 items per page
const response = await fetch('/assignments?courseId=CS101&status=published&page=2&limit=30');

// Get assignments due in week 26 using cursor pagination
const response = await fetch('/assignments?weekNumber=26&paginationType=cursor&limit=40');
```

## Best Practices

### For Small to Medium Datasets (< 1000 items)
- Use offset-based pagination
- Set reasonable page sizes (20-50 items)
- Provide page number navigation

### For Large Datasets (> 1000 items)
- Use cursor-based pagination
- Set larger page sizes (50-100 items)
- Implement infinite scroll or "Load More" buttons

### Performance Considerations
- Avoid very large page sizes (> 100 items)
- Use appropriate pagination type for your use case
- Consider caching strategies for frequently accessed pages

## Error Handling

### Invalid Page Numbers
- Page numbers are automatically clamped to valid ranges
- Invalid pages default to page 1
- Negative page numbers are treated as 1

### Invalid Limits
- Limits are automatically clamped to 1-100 range
- Invalid limits default to 20
- Zero or negative limits are treated as 20

### Invalid Cursors
- Invalid cursors fall back to first page
- Malformed cursor data is logged for debugging
- Graceful degradation to offset-based pagination

## Configuration

### Environment Variables
- `MAX_PAGE_SIZE`: Maximum items per page (default: 100)
- `DEFAULT_PAGE_SIZE`: Default items per page (default: 20)
- `MAX_TOTAL_ITEMS`: Maximum total items to process (default: 10,000)

### Schema Validation
All pagination parameters are validated using Zod schema:
- Page numbers: 1 to 10,000
- Limits: 1 to 100
- Cursors: Base64-encoded strings
- Pagination types: "offset" or "cursor"

## Future Enhancements

### Planned Features
- Elasticsearch-style search pagination
- GraphQL-style cursor pagination
- Real-time pagination updates
- Pagination analytics and metrics

### Performance Improvements
- Database-level pagination optimization
- Caching layer for pagination metadata
- Lazy loading of pagination data
- Background pagination calculation

