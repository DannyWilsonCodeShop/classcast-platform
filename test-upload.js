const FormData = require('form-data');
const fs = require('fs');

async function testUpload() {
  try {
    console.log('Testing file upload...');
    
    // Create a test image file
    const testImagePath = 'test-image.png';
    if (!fs.existsSync(testImagePath)) {
      console.log('Creating test image...');
      // Create a simple 1x1 pixel PNG
      const pngData = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // bit depth, color type, etc.
        0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
        0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
        0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND chunk
      ]);
      fs.writeFileSync(testImagePath, pngData);
    }
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testImagePath));
    formData.append('folder', 'profile-pictures');
    formData.append('userId', 'test-user-123');
    
    const response = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    console.log('Upload response status:', response.status);
    console.log('Upload response:', result);
    
    if (response.ok) {
      console.log('Upload successful!');
    } else {
      console.log('Upload failed:', result.error);
    }
    
  } catch (error) {
    console.error('Upload test error:', error.message);
  }
}

testUpload();
