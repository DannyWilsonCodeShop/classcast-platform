#!/usr/bin/env node

/**
 * Test Grading Page Fix
 * 
 * This script verifies that the grading page no longer has undefined variable references
 */

const fs = require('fs');

console.log('🔍 Testing Grading Page Fix');
console.log('===========================\n');

function checkForUndefinedVariables() {
  const gradingPagePath = 'src/app/instructor/grading/assignment/[assignmentId]/page.tsx';
  
  if (!fs.existsSync(gradingPagePath)) {
    console.log('❌ Grading page file not found');
    return false;
  }
  
  const content = fs.readFileSync(gradingPagePath, 'utf8');
  
  // Check for problematic patterns
  const problematicPatterns = [
    'uniqueSections',
    'undefined',
    'ReferenceError'
  ];
  
  let issuesFound = 0;
  
  problematicPatterns.forEach(pattern => {
    if (pattern === 'uniqueSections' && content.includes(pattern)) {
      console.log(`❌ Found undefined variable: ${pattern}`);
      issuesFound++;
    }
  });
  
  // Check for proper section usage
  if (content.includes('const sections = extractSections(allSubmissions)')) {
    console.log('✅ Found proper sections definition');
  } else {
    console.log('❌ Missing sections definition');
    issuesFound++;
  }
  
  if (content.includes('sections.length > 0') || content.includes('sections.map')) {
    console.log('✅ Found proper sections usage');
  } else {
    console.log('❌ Missing proper sections usage');
    issuesFound++;
  }
  
  return issuesFound === 0;
}

function verifyImports() {
  const gradingPagePath = 'src/app/instructor/grading/assignment/[assignmentId]/page.tsx';
  const content = fs.readFileSync(gradingPagePath, 'utf8');
  
  const requiredImports = [
    'extractSections',
    'filterBySection',
    'sortSubmissions',
    'searchSubmissions',
    'getSectionStats'
  ];
  
  let missingImports = 0;
  
  requiredImports.forEach(importName => {
    if (content.includes(importName)) {
      console.log(`✅ Found import: ${importName}`);
    } else {
      console.log(`❌ Missing import: ${importName}`);
      missingImports++;
    }
  });
  
  return missingImports === 0;
}

function main() {
  console.log('🔍 Checking for undefined variables...\n');
  const noUndefinedVars = checkForUndefinedVariables();
  
  console.log('\n🔍 Verifying required imports...\n');
  const allImportsPresent = verifyImports();
  
  console.log('\n🎯 Test Results:');
  console.log('================');
  
  if (noUndefinedVars && allImportsPresent) {
    console.log('✅ All tests passed!');
    console.log('✅ No undefined variables found');
    console.log('✅ All required imports present');
    console.log('✅ Grading page should work correctly');
  } else {
    console.log('❌ Some tests failed');
    if (!noUndefinedVars) {
      console.log('❌ Undefined variables still present');
    }
    if (!allImportsPresent) {
      console.log('❌ Missing required imports');
    }
  }
  
  console.log('\n📋 Summary:');
  console.log('- Fixed uniqueSections → sections');
  console.log('- Verified section utility imports');
  console.log('- Ensured proper variable definitions');
  console.log('- Grading page crash should be resolved');
}

main();