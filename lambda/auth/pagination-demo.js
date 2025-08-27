// Pagination Demo Script
// Run with: node pagination-demo.js

console.log('🚀 Assignment Pagination Demo\n');

// Mock assignment data for demonstration
const mockAssignments = Array.from({ length: 150 }, (_, i) => ({
  assignmentId: `assignment_${i + 1}`,
  title: `Assignment ${i + 1}`,
  courseId: 'CS101',
  status: ['draft', 'published', 'active', 'completed'][i % 4],
  dueDate: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)).toISOString(),
  points: 50 + (i % 50),
  type: ['essay', 'quiz', 'project', 'presentation', 'lab'][i % 5],
  createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString()
}));

// Pagination functions (simplified versions from the Lambda)
function generatePageNumbers(currentPage, totalPages) {
  if (totalPages <= 1) return [1];
  
  const pageNumbers = [];
  const maxVisiblePages = 5;
  
  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
  }
  
  return pageNumbers;
}

function buildPagination(page = 1, limit = 20, totalCount) {
  page = Math.max(1, page);
  limit = Math.min(100, Math.max(1, limit));
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  
  const currentPage = Math.min(page, totalPages);
  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalCount);
  
  const pageNumbers = generatePageNumbers(currentPage, totalPages);
  
  return {
    currentPage,
    pageSize: limit,
    totalPages,
    totalCount,
    startItem: totalCount > 0 ? startItem : 0,
    endItem: totalCount > 0 ? endItem : 0,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    previousPage: currentPage > 1 ? currentPage - 1 : null,
    pageNumbers,
    firstPage: 1,
    lastPage: totalPages,
    canGoToFirst: currentPage > 1,
    canGoToLast: currentPage < totalPages,
    showingItems: totalCount > 0 ? `${startItem}-${endItem} of ${totalCount}` : '0 items'
  };
}

function applyPagination(assignments, pagination) {
  const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
  const endIndex = startIndex + pagination.pageSize;
  return assignments.slice(startIndex, endIndex);
}

// Demo 1: Basic Pagination
console.log('📄 Demo 1: Basic Pagination (Page 1, 20 items)');
const pagination1 = buildPagination(1, 20, mockAssignments.length);
const page1Assignments = applyPagination(mockAssignments, pagination1);

console.log(`📊 Pagination Info:`);
console.log(`   Current Page: ${pagination1.currentPage}`);
console.log(`   Page Size: ${pagination1.pageSize}`);
console.log(`   Total Pages: ${pagination1.totalPages}`);
console.log(`   Total Items: ${pagination1.totalCount}`);
console.log(`   Showing: ${pagination1.showingItems}`);
console.log(`   Page Numbers: [${pagination1.pageNumbers.join(', ')}]`);
console.log(`   Navigation: ${pagination1.hasPreviousPage ? '← Previous' : ''} ${pagination1.hasNextPage ? 'Next →' : ''}`);
console.log(`   First 3 Assignments: ${page1Assignments.slice(0, 3).map(a => a.title).join(', ')}`);
console.log('');

// Demo 2: Middle Page
console.log('📄 Demo 2: Middle Page (Page 4, 15 items)');
const pagination2 = buildPagination(4, 15, mockAssignments.length);
const page4Assignments = applyPagination(mockAssignments, pagination2);

console.log(`📊 Pagination Info:`);
console.log(`   Current Page: ${pagination2.currentPage}`);
console.log(`   Page Size: ${pagination2.pageSize}`);
console.log(`   Total Pages: ${pagination2.totalPages}`);
console.log(`   Total Items: ${pagination2.totalCount}`);
console.log(`   Showing: ${pagination2.showingItems}`);
console.log(`   Page Numbers: [${pagination2.pageNumbers.join(', ')}]`);
console.log(`   Navigation: ${pagination2.hasPreviousPage ? '← Previous' : ''} ${pagination2.hasNextPage ? 'Next →' : ''}`);
console.log(`   First 3 Assignments: ${page4Assignments.slice(0, 3).map(a => a.title).join(', ')}`);
console.log('');

// Demo 3: Last Page
console.log('📄 Demo 3: Last Page (Page 10, 20 items)');
const pagination3 = buildPagination(10, 20, mockAssignments.length);
const page10Assignments = applyPagination(mockAssignments, pagination3);

console.log(`📊 Pagination Info:`);
console.log(`   Current Page: ${pagination3.currentPage}`);
console.log(`   Page Size: ${pagination3.pageSize}`);
console.log(`   Total Pages: ${pagination3.totalPages}`);
console.log(`   Total Items: ${pagination3.totalCount}`);
console.log(`   Showing: ${pagination3.showingItems}`);
console.log(`   Page Numbers: [${pagination3.pageNumbers.join(', ')}]`);
console.log(`   Navigation: ${pagination3.hasPreviousPage ? '← Previous' : ''} ${pagination3.hasNextPage ? 'Next →' : ''}`);
console.log(`   First 3 Assignments: ${page10Assignments.slice(0, 3).map(a => a.title).join(', ')}`);
console.log('');

// Demo 4: Large Page Size
console.log('📄 Demo 4: Large Page Size (Page 1, 50 items)');
const pagination4 = buildPagination(1, 50, mockAssignments.length);
const page50Assignments = applyPagination(mockAssignments, pagination4);

console.log(`📊 Pagination Info:`);
console.log(`   Current Page: ${pagination4.currentPage}`);
console.log(`   Page Size: ${pagination4.pageSize}`);
console.log(`   Total Pages: ${pagination4.totalPages}`);
console.log(`   Total Items: ${pagination4.totalCount}`);
console.log(`   Showing: ${pagination4.showingItems}`);
console.log(`   Page Numbers: [${pagination4.pageNumbers.join(', ')}]`);
console.log(`   Navigation: ${pagination4.hasPreviousPage ? '← Previous' : ''} ${pagination4.hasNextPage ? 'Next →' : ''}`);
console.log(`   First 3 Assignments: ${page50Assignments.slice(0, 3).map(a => a.title).join(', ')}`);
console.log('');

// Demo 5: Edge Cases
console.log('📄 Demo 5: Edge Cases');
console.log('   Invalid page (0):', buildPagination(0, 20, mockAssignments.length).currentPage);
console.log('   Invalid page (negative):', buildPagination(-5, 20, mockAssignments.length).currentPage);
console.log('   Invalid page (too high):', buildPagination(999, 20, mockAssignments.length).currentPage);
console.log('   Invalid limit (0):', buildPagination(1, 0, mockAssignments.length).pageSize);
console.log('   Invalid limit (negative):', buildPagination(1, -10, mockAssignments.length).pageSize);
console.log('   Invalid limit (too high):', buildPagination(1, 150, mockAssignments.length).pageSize);
console.log('');

// Demo 6: Navigation Examples
console.log('📄 Demo 6: Navigation Examples');
console.log('   Page 1:');
console.log(`     canGoToFirst: ${pagination1.canGoToFirst}`);
console.log(`     canGoToLast: ${pagination1.canGoToLast}`);
console.log(`     hasPreviousPage: ${pagination1.hasPreviousPage}`);
console.log(`     hasNextPage: ${pagination1.hasNextPage}`);

console.log('   Page 4:');
console.log(`     canGoToFirst: ${pagination2.canGoToFirst}`);
console.log(`     canGoToLast: ${pagination2.canGoToLast}`);
console.log(`     hasPreviousPage: ${pagination2.hasPreviousPage}`);
console.log(`     hasNextPage: ${pagination2.hasNextPage}`);

console.log('   Page 10:');
console.log(`     canGoToFirst: ${pagination3.canGoToFirst}`);
console.log(`     canGoToLast: ${pagination3.canGoToLast}`);
console.log(`     hasPreviousPage: ${pagination3.hasPreviousPage}`);
console.log(`     hasNextPage: ${pagination3.hasNextPage}`);
console.log('');

// Demo 7: API Response Format
console.log('📄 Demo 7: API Response Format (Page 2, 25 items)');
const pagination5 = buildPagination(2, 25, mockAssignments.length);
const page2Assignments = applyPagination(mockAssignments, pagination5);

const apiResponse = {
  success: true,
  data: {
    assignments: page2Assignments,
    pagination: pagination5,
    filters: {
      page: 2,
      limit: 25
    },
    totalCount: mockAssignments.length,
    requestId: 'demo_123'
  },
  message: 'Assignments retrieved successfully',
  timestamp: new Date().toISOString()
};

console.log('📊 API Response Structure:');
console.log(`   Status: ${apiResponse.success ? '✅ Success' : '❌ Error'}`);
console.log(`   Message: ${apiResponse.message}`);
console.log(`   Assignments Count: ${apiResponse.data.assignments.length}`);
console.log(`   Pagination: Page ${apiResponse.data.pagination.currentPage} of ${apiResponse.data.pagination.totalPages}`);
console.log(`   Showing: ${apiResponse.data.pagination.showingItems}`);
console.log(`   Request ID: ${apiResponse.data.requestId}`);
console.log('');

console.log('🎉 Pagination Demo Complete!');
console.log('\n💡 Key Features Demonstrated:');
console.log('   ✅ Smart page number generation (shows 5 pages around current)');
console.log('   ✅ Automatic validation and clamping of invalid values');
console.log('   ✅ Rich navigation metadata (first/last, next/previous)');
console.log('   ✅ Human-readable item ranges');
console.log('   ✅ Flexible page sizes (1-100 items)');
console.log('   ✅ Edge case handling');
console.log('   ✅ API response formatting');
console.log('\n🚀 Ready for production use!');

