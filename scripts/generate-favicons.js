const fs = require('fs');
const path = require('path');

// This script creates symbolic links to your ClassCastLogo.png for different favicon sizes
// In a real project, you'd use ImageMagick or similar to resize the image

const publicDir = path.join(__dirname, '..', 'public');
const logoFile = path.join(publicDir, 'ClassCastLogo.png');

// Create symbolic links for different favicon sizes
const faviconSizes = [
  { name: 'favicon-16x16.png', size: '16x16' },
  { name: 'favicon-32x32.png', size: '32x32' },
  { name: 'apple-touch-icon.png', size: '180x180' },
  { name: 'favicon.ico', size: '32x32' }
];

console.log('Creating favicon files...');

faviconSizes.forEach(({ name, size }) => {
  const targetPath = path.join(publicDir, name);
  
  try {
    // Create a copy of the logo for each favicon size
    // In production, you'd resize the image to the specific dimensions
    fs.copyFileSync(logoFile, targetPath);
    console.log(`✅ Created ${name} (${size})`);
  } catch (error) {
    console.error(`❌ Failed to create ${name}:`, error.message);
  }
});

console.log('\n🎉 Favicon generation complete!');
console.log('Note: In production, resize images to exact dimensions for optimal performance.');
