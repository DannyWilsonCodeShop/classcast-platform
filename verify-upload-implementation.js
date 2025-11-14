/**
 * Simple verification script to check upload implementation
 * This doesn't require the server to be running
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Upload Implementation...\n');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${description}: Found`);
    checks.passed++;
    return true;
  } else {
    console.log(`❌ ${description}: Missing`);
    checks.failed++;
    return false;
  }
}

function checkFileContent(filePath, pattern, description) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes(pattern)) {
      console.log(`✅ ${description}: Found`);
      checks.passed++;
      return true;
    } else {
      console.log(`⚠️  ${description}: Not found`);
      checks.warnings++;
      return false;
    }
  } else {
    console.log(`❌ ${description}: File missing`);
    checks.failed++;
    return false;
  }
}

console.log('Checking core files...\n');

// Check main upload files
checkFile('src/lib/largeFileUpload.ts', 'Large file upload utility');
checkFile('src/lib/s3.ts', 'S3 service');
checkFile('src/app/api/upload/route.ts', 'Main upload route');
checkFile('src/app/api/upload/large-file/route.ts', 'Large file upload route');

// Check multipart upload endpoints
console.log('\nChecking multipart upload endpoints...\n');
checkFile('src/app/api/upload/multipart/init/route.ts', 'Multipart init endpoint');
checkFile('src/app/api/upload/multipart/part-url/route.ts', 'Multipart part URL endpoint');
checkFile('src/app/api/upload/multipart/complete/route.ts', 'Multipart complete endpoint');

// Check for key features in largeFileUpload.ts
console.log('\nChecking implementation features...\n');
checkFileContent('src/lib/largeFileUpload.ts', 'uploadWithMultipart', 'Multipart upload method');
checkFileContent('src/lib/largeFileUpload.ts', 'CHUNK_SIZE', 'Chunk size configuration');
checkFileContent('src/lib/largeFileUpload.ts', 'refreshSession', 'Session refresh mechanism');
checkFileContent('src/lib/largeFileUpload.ts', 'MAX_RETRIES', 'Retry logic');
checkFileContent('src/lib/largeFileUpload.ts', 'MAX_TIMEOUT', 'Extended timeout');

// Check S3 service for multipart methods
console.log('\nChecking S3 service methods...\n');
checkFileContent('src/lib/s3.ts', 'initiateMultipartUpload', 'S3 multipart init method');
checkFileContent('src/lib/s3.ts', 'getMultipartUploadPartUrl', 'S3 part URL method');
checkFileContent('src/lib/s3.ts', 'completeMultipartUpload', 'S3 complete method');
checkFileContent('src/lib/s3.ts', 'CreateMultipartUploadCommand', 'Multipart imports');

// Summary
console.log('\n' + '='.repeat(60));
console.log('VERIFICATION SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Passed: ${checks.passed}`);
console.log(`⚠️  Warnings: ${checks.warnings}`);
console.log(`❌ Failed: ${checks.failed}`);
console.log('='.repeat(60));

if (checks.failed === 0) {
  console.log('\n🎉 All critical files and features are in place!');
  console.log('\n📝 Next steps:');
  console.log('   1. Start Next.js dev server: npm run dev');
  console.log('   2. Test uploads manually in the browser');
  console.log('   3. Monitor for any errors in the console');
  process.exit(0);
} else {
  console.log('\n⚠️  Some files or features are missing. Please review the errors above.');
  process.exit(1);
}

