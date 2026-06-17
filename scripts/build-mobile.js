#!/usr/bin/env node
/**
 * Build script for Capacitor iOS/mobile builds.
 * Swaps next.config.ts to the mobile (static export) version,
 * runs the build, then restores the original config.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const configPath = path.join(root, 'next.config.ts');
const mobileConfigPath = path.join(root, 'next.config.mobile.ts');
const backupPath = path.join(root, 'next.config.ts.bak');

function run() {
  console.log('📱 Building ClassCast for mobile...\n');

  // Backup original config
  console.log('1. Backing up next.config.ts...');
  fs.copyFileSync(configPath, backupPath);

  // Swap in mobile config
  console.log('2. Applying mobile config (static export)...');
  fs.copyFileSync(mobileConfigPath, configPath);

  try {
    // Run the build
    console.log('3. Running next build...\n');
    execSync('npx next build', { cwd: root, stdio: 'inherit' });
    console.log('\n✅ Mobile build complete! Output in ./out/');
  } catch (err) {
    console.error('\n❌ Build failed:', err.message);
    process.exitCode = 1;
  } finally {
    // Restore original config
    console.log('\n4. Restoring original next.config.ts...');
    fs.copyFileSync(backupPath, configPath);
    fs.unlinkSync(backupPath);
    console.log('   Done.');
  }
}

run();
