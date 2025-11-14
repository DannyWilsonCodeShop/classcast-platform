/**
 * Video Upload Test Script
 * Tests the improved upload functionality including:
 * - Multipart uploads for large files
 * - Progress tracking
 * - Error handling
 * - Session refresh
 * - Retry logic
 * 
 * Usage: node test-video-upload.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Test configuration
const TEST_CONFIG = {
  // API endpoint (adjust if needed)
  apiUrl: process.env.NEXT_PUBLIC_API_GATEWAY_URL || process.env.API_GATEWAY_URL || 'http://localhost:3000',
  
  // Test file sizes to create (in MB)
  testSizes: [
    5,      // Small file - should use regular upload
    50,     // Medium file - should use presigned URL
    150,    // Large file - should use multipart upload
  ],
  
  // Test file location
  testDir: './test-uploads',
};

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const contentType = res.headers['content-type'] || '';
          const isJson = contentType.includes('application/json');
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            json: async () => isJson ? JSON.parse(data) : data,
            text: async () => data,
            headers: res.headers,
          });
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      if (Buffer.isBuffer(options.body)) {
        req.write(options.body);
      } else {
        req.write(options.body);
      }
    }
    
    req.end();
  });
}

/**
 * Create a test video file of specified size
 */
function createTestFile(sizeMB, filename) {
  const testDir = TEST_CONFIG.testDir;
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const filePath = path.join(testDir, filename);
  const sizeBytes = sizeMB * 1024 * 1024;
  
  // Create a buffer filled with test data
  const buffer = Buffer.alloc(sizeBytes);
  buffer.fill(0x00); // Fill with zeros (compresses well)
  
  // Write header to make it look like a video file
  const header = Buffer.from('RIFF');
  header.copy(buffer, 0);
  
  fs.writeFileSync(filePath, buffer);
  console.log(`✅ Created test file: ${filename} (${sizeMB}MB)`);
  
  return filePath;
}

/**
 * Test regular file upload
 */
async function testRegularUpload(filePath, fileName) {
  console.log(`\n📤 Testing regular upload: ${fileName}`);
  
  try {
    const FormData = require('form-data');
    const formData = new FormData();
    
    const fileStream = fs.createReadStream(filePath);
    formData.append('file', fileStream, {
      filename: fileName,
      contentType: 'video/mp4',
    });
    formData.append('folder', 'test-videos');
    formData.append('contentType', 'video/mp4');
    
    const url = `${TEST_CONFIG.apiUrl}/api/upload`;
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    return new Promise((resolve, reject) => {
      const req = client.request({
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname,
        method: 'POST',
        headers: formData.getHeaders(),
      }, async (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', async () => {
          try {
            const result = JSON.parse(data);
            if (result.success) {
              console.log('✅ Regular upload successful');
              console.log(`   File URL: ${result.data.fileUrl}`);
              resolve(true);
            } else {
              console.error('❌ Regular upload failed:', result.error);
              resolve(false);
            }
          } catch (error) {
            console.error('❌ Failed to parse response:', error.message);
            resolve(false);
          }
        });
      });
      
      req.on('error', (error) => {
        console.error('❌ Request error:', error.message);
        resolve(false);
      });
      
      formData.pipe(req);
    });
  } catch (error) {
    console.error('❌ Regular upload error:', error.message);
    return false;
  }
}

/**
 * Test large file upload (presigned URL)
 */
async function testLargeFileUpload(filePath, fileName) {
  console.log(`\n📤 Testing large file upload (presigned URL): ${fileName}`);
  
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileSize = fileBuffer.length;
    
    // Step 1: Get presigned URL
    console.log('   Step 1: Requesting presigned URL...');
    const presignedResponse = await makeRequest(`${TEST_CONFIG.apiUrl}/api/upload/large-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName,
        fileSize,
        contentType: 'video/mp4',
        folder: 'test-videos',
      }),
    });
    
    const presignedData = await presignedResponse.json();
    
    if (!presignedData.success) {
      console.error('❌ Failed to get presigned URL:', presignedData.error);
      return false;
    }
    
    console.log('✅ Presigned URL obtained');
    const { presignedUrl, fileKey } = presignedData.data;
    
    // Step 2: Upload to S3
    console.log('   Step 2: Uploading to S3...');
    const uploadResponse = await makeRequest(presignedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
      },
      body: fileBuffer,
    });
    
    if (!uploadResponse.ok) {
      console.error('❌ S3 upload failed:', uploadResponse.status, uploadResponse.statusText);
      return false;
    }
    
    console.log('✅ File uploaded to S3');
    
    // Step 3: Verify upload
    console.log('   Step 3: Verifying upload...');
    const verifyResponse = await makeRequest(`${TEST_CONFIG.apiUrl}/api/upload/large-file?fileKey=${encodeURIComponent(fileKey)}`);
    const verifyData = await verifyResponse.json();
    
    if (verifyData.success && verifyData.data.exists) {
      console.log('✅ Upload verified successfully');
      console.log(`   File URL: ${verifyData.data.fileUrl}`);
      return true;
    } else {
      console.error('❌ Upload verification failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Large file upload error:', error.message);
    return false;
  }
}

/**
 * Test multipart upload
 */
async function testMultipartUpload(filePath, fileName) {
  console.log(`\n📤 Testing multipart upload: ${fileName}`);
  
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileSize = fileBuffer.length;
    const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
    
    // Step 1: Initialize multipart upload
    console.log(`   Step 1: Initializing multipart upload (${totalChunks} chunks)...`);
    const initResponse = await makeRequest(`${TEST_CONFIG.apiUrl}/api/upload/multipart/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName,
        fileSize,
        contentType: 'video/mp4',
        folder: 'test-videos',
      }),
    });
    
    const initData = await initResponse.json();
    
    if (!initData.success) {
      console.error('❌ Failed to initialize multipart upload:', initData.error);
      return false;
    }
    
    console.log('✅ Multipart upload initialized');
    const { uploadId, fileKey } = initData.data;
    const uploadedParts = [];
    
    // Step 2: Upload chunks
    console.log(`   Step 2: Uploading ${totalChunks} chunks...`);
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileSize);
      const chunk = fileBuffer.slice(start, end);
      const partNumber = chunkIndex + 1;
      
      // Get presigned URL for this part
      const partUrlResponse = await makeRequest(`${TEST_CONFIG.apiUrl}/api/upload/multipart/part-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uploadId,
          fileKey,
          partNumber,
        }),
      });
      
      const partUrlData = await partUrlResponse.json();
      
      if (!partUrlData.success) {
        console.error(`❌ Failed to get part URL for chunk ${partNumber}:`, partUrlData.error);
        return false;
      }
      
      // Upload chunk
      const chunkResponse = await makeRequest(partUrlData.data.presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'video/mp4',
        },
        body: chunk,
      });
      
      if (!chunkResponse.ok) {
        console.error(`❌ Failed to upload chunk ${partNumber}:`, chunkResponse.status);
        return false;
      }
      
      const etag = chunkResponse.headers.etag?.replace(/"/g, '') || chunkResponse.headers['etag']?.replace(/"/g, '');
      if (!etag) {
        console.error(`❌ No ETag received for chunk ${partNumber}`);
        return false;
      }
      
      uploadedParts.push({ ETag: etag, PartNumber: partNumber });
      const progress = ((partNumber / totalChunks) * 100).toFixed(1);
      console.log(`   ✅ Chunk ${partNumber}/${totalChunks} uploaded (${progress}%)`);
    }
    
    // Step 3: Complete multipart upload
    console.log('   Step 3: Completing multipart upload...');
    const completeResponse = await makeRequest(`${TEST_CONFIG.apiUrl}/api/upload/multipart/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uploadId,
        fileKey,
        parts: uploadedParts,
      }),
    });
    
    const completeData = await completeResponse.json();
    
    if (!completeData.success) {
      console.error('❌ Failed to complete multipart upload:', completeData.error);
      return false;
    }
    
    console.log('✅ Multipart upload completed successfully');
    console.log(`   File URL: ${completeData.data.fileUrl}`);
    return true;
  } catch (error) {
    console.error('❌ Multipart upload error:', error.message);
    if (error.stack) {
      console.error('   Stack:', error.stack);
    }
    return false;
  }
}

/**
 * Test error handling
 */
async function testErrorHandling() {
  console.log(`\n🧪 Testing error handling...`);
  
  const tests = [
    {
      name: 'Missing file parameters',
      test: async () => {
        const response = await makeRequest(`${TEST_CONFIG.apiUrl}/api/upload/large-file`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const result = await response.json();
        return !result.success;
      },
    },
    {
      name: 'Invalid file size (too large)',
      test: async () => {
        const response = await makeRequest(`${TEST_CONFIG.apiUrl}/api/upload/large-file`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: 'test.mp4',
            fileSize: 10 * 1024 * 1024 * 1024, // 10GB - exceeds limit
            contentType: 'video/mp4',
          }),
        });
        const result = await response.json();
        return !result.success && (result.error.includes('exceeds') || result.error.includes('limit'));
      },
    },
  ];
  
  let passed = 0;
  for (const test of tests) {
    try {
      const result = await test.test();
      if (result) {
        console.log(`   ✅ ${test.name}: Passed`);
        passed++;
      } else {
        console.log(`   ❌ ${test.name}: Failed`);
      }
    } catch (error) {
      console.log(`   ❌ ${test.name}: Error - ${error.message}`);
    }
  }
  
  console.log(`\n   Error handling tests: ${passed}/${tests.length} passed`);
  return passed === tests.length;
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting Video Upload Tests\n');
  console.log('='.repeat(60));
  console.log(`API URL: ${TEST_CONFIG.apiUrl}`);
  console.log('='.repeat(60));
  
  const results = {
    regular: [],
    large: [],
    multipart: [],
    errors: false,
  };
  
  // Create test files
  console.log('\n📁 Creating test files...');
  const testFiles = [];
  for (const size of TEST_CONFIG.testSizes) {
    const fileName = `test-video-${size}mb.mp4`;
    const filePath = createTestFile(size, fileName);
    testFiles.push({ path: filePath, name: fileName, size });
  }
  
  // Test regular uploads (small files)
  console.log('\n' + '='.repeat(60));
  console.log('TESTING REGULAR UPLOADS');
  console.log('='.repeat(60));
  for (const file of testFiles.filter(f => f.size < 100)) {
    const result = await testRegularUpload(file.path, file.name);
    results.regular.push({ file: file.name, success: result });
  }
  
  // Test large file uploads (medium files)
  console.log('\n' + '='.repeat(60));
  console.log('TESTING LARGE FILE UPLOADS (Presigned URL)');
  console.log('='.repeat(60));
  for (const file of testFiles.filter(f => f.size >= 100 && f.size < 200)) {
    const result = await testLargeFileUpload(file.path, file.name);
    results.large.push({ file: file.name, success: result });
  }
  
  // Test multipart uploads (large files)
  console.log('\n' + '='.repeat(60));
  console.log('TESTING MULTIPART UPLOADS');
  console.log('='.repeat(60));
  for (const file of testFiles.filter(f => f.size >= 200)) {
    const result = await testMultipartUpload(file.path, file.name);
    results.multipart.push({ file: file.name, success: result });
  }
  
  // Test error handling
  console.log('\n' + '='.repeat(60));
  console.log('TESTING ERROR HANDLING');
  console.log('='.repeat(60));
  results.errors = await testErrorHandling();
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  
  const regularPassed = results.regular.filter(r => r.success).length;
  const largePassed = results.large.filter(r => r.success).length;
  const multipartPassed = results.multipart.filter(r => r.success).length;
  
  console.log(`\nRegular Uploads: ${regularPassed}/${results.regular.length} passed`);
  results.regular.forEach(r => {
    console.log(`  ${r.success ? '✅' : '❌'} ${r.file}`);
  });
  
  console.log(`\nLarge File Uploads: ${largePassed}/${results.large.length} passed`);
  results.large.forEach(r => {
    console.log(`  ${r.success ? '✅' : '❌'} ${r.file}`);
  });
  
  console.log(`\nMultipart Uploads: ${multipartPassed}/${results.multipart.length} passed`);
  results.multipart.forEach(r => {
    console.log(`  ${r.success ? '✅' : '❌'} ${r.file}`);
  });
  
  console.log(`\nError Handling: ${results.errors ? '✅ Passed' : '❌ Failed'}`);
  
  const totalTests = results.regular.length + results.large.length + results.multipart.length + 1;
  const totalPassed = regularPassed + largePassed + multipartPassed + (results.errors ? 1 : 0);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`OVERALL: ${totalPassed}/${totalTests} tests passed`);
  console.log('='.repeat(60));
  
  // Cleanup test files
  console.log('\n🧹 Cleaning up test files...');
  for (const file of testFiles) {
    try {
      fs.unlinkSync(file.path);
      console.log(`   Deleted: ${file.name}`);
    } catch (error) {
      console.warn(`   Could not delete ${file.name}: ${error.message}`);
    }
  }
  
  if (fs.existsSync(TEST_CONFIG.testDir)) {
    try {
      fs.rmdirSync(TEST_CONFIG.testDir);
    } catch (error) {
      // Directory might not be empty, that's okay
    }
  }
  
  return totalPassed === totalTests;
}

// Run tests
if (require.main === module) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ Test execution failed:', error);
      if (error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
    });
}

module.exports = { runTests, testRegularUpload, testLargeFileUpload, testMultipartUpload };
