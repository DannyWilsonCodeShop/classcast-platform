const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing Frontend Performance Issues\n');
console.log('='.repeat(60));

// Common performance issues to check for
const performanceIssues = [];

function analyzeFile(filePath, fileName) {
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  console.log(`\n📄 Analyzing: ${fileName}`);
  
  // Check for performance issues
  let issues = [];
  
  // 1. Multiple useEffect calls without dependencies
  const useEffectMatches = content.match(/useEffect\(/g);
  if (useEffectMatches && useEffectMatches.length > 5) {
    issues.push(`⚠️  ${useEffectMatches.length} useEffect calls (potential over-fetching)`);
  }
  
  // 2. Fetch calls without caching
  const fetchMatches = content.match(/fetch\(/g);
  if (fetchMatches && fetchMatches.length > 3) {
    issues.push(`⚠️  ${fetchMatches.length} fetch calls (no caching)`);
  }
  
  // 3. Large components (over 500 lines)
  if (lines.length > 500) {
    issues.push(`⚠️  Large component (${lines.length} lines - should split)`);
  }
  
  // 4. Inline functions in JSX
  const inlineFunctionMatches = content.match(/onClick=\{[^}]*=>/g);
  if (inlineFunctionMatches && inlineFunctionMatches.length > 5) {
    issues.push(`⚠️  ${inlineFunctionMatches.length} inline functions (causes re-renders)`);
  }
  
  // 5. Missing React.memo or useMemo
  const hasMemo = content.includes('React.memo') || content.includes('useMemo');
  const hasExpensiveOperations = content.includes('.map(') || content.includes('.filter(') || content.includes('.reduce(');
  if (hasExpensiveOperations && !hasMemo) {
    issues.push(`⚠️  Expensive operations without memoization`);
  }
  
  // 6. Synchronous operations in useEffect
  const hasAsyncInEffect = content.match(/useEffect\([^}]*async/g);
  if (hasAsyncInEffect) {
    issues.push(`⚠️  Async operations in useEffect (blocking)`);
  }
  
  // 7. Large state objects
  const stateMatches = content.match(/useState\([^)]*\{[^}]{50,}\}/g);
  if (stateMatches) {
    issues.push(`⚠️  Large state objects (causes unnecessary re-renders)`);
  }
  
  // 8. No loading states
  const hasLoading = content.includes('loading') || content.includes('Loading');
  if (fetchMatches && fetchMatches.length > 0 && !hasLoading) {
    issues.push(`⚠️  No loading states (poor UX)`);
  }
  
  if (issues.length === 0) {
    console.log('   ✅ No major performance issues detected');
  } else {
    issues.forEach(issue => console.log(`   ${issue}`));
    performanceIssues.push({ file: fileName, issues });
  }
}

// Analyze key pages
const filesToAnalyze = [
  { path: 'src/app/student/dashboard/page.tsx', name: 'Student Dashboard' },
  { path: 'src/app/instructor/dashboard/page.tsx', name: 'Instructor Dashboard' },
  { path: 'src/app/student/assignments/[assignmentId]/page.tsx', name: 'Assignment Detail' },
  { path: 'src/app/instructor/grading/assignment/[assignmentId]/page.tsx', name: 'Grading Page' },
  { path: 'src/app/student/peer-reviews/page.tsx', name: 'Peer Reviews' },
  { path: 'src/components/student/VideoReels.tsx', name: 'Video Reels' },
  { path: 'src/components/student/VideoInteractionPanel.tsx', name: 'Video Interactions' },
];

console.log('\n🔍 Scanning for Performance Issues...');

filesToAnalyze.forEach(({ path: filePath, name }) => {
  analyzeFile(filePath, name);
});

// Check Next.js config
console.log('\n\n⚙️  Next.js Configuration Analysis:');
console.log('-'.repeat(60));

const nextConfigPath = 'next.config.ts';
if (fs.existsSync(nextConfigPath)) {
  const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
  
  console.log('\n📄 next.config.ts:');
  
  // Check for optimizations
  const hasCompression = nextConfig.includes('compress');
  const hasImageOptimization = nextConfig.includes('images');
  const hasBundleAnalyzer = nextConfig.includes('bundleAnalyzer');
  const hasExperimental = nextConfig.includes('experimental');
  
  console.log(`   Compression: ${hasCompression ? '✅' : '❌'}`);
  console.log(`   Image Optimization: ${hasImageOptimization ? '✅' : '❌'}`);
  console.log(`   Bundle Analyzer: ${hasBundleAnalyzer ? '✅' : '❌'}`);
  console.log(`   Experimental Features: ${hasExperimental ? '✅' : '❌'}`);
  
  if (!hasCompression) {
    performanceIssues.push({ 
      file: 'next.config.ts', 
      issues: ['❌ No compression enabled'] 
    });
  }
} else {
  console.log('   ⚠️  next.config.ts not found');
}

// Check package.json for heavy dependencies
console.log('\n\n📦 Dependency Analysis:');
console.log('-'.repeat(60));

const packageJsonPath = 'package.json';
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const heavyDeps = [];
  const unnecessaryDeps = [];
  
  // Check for heavy libraries
  Object.keys(dependencies).forEach(dep => {
    if (dep.includes('lodash') && !dep.includes('lodash-es')) {
      heavyDeps.push(`${dep} (use lodash-es for tree shaking)`);
    }
    if (dep.includes('moment') && !dep.includes('dayjs')) {
      heavyDeps.push(`${dep} (use dayjs instead - 2KB vs 67KB)`);
    }
    if (dep.includes('axios') && dependencies['fetch']) {
      unnecessaryDeps.push(`${dep} (use native fetch)`);
    }
  });
  
  console.log(`   Total Dependencies: ${Object.keys(dependencies).length}`);
  
  if (heavyDeps.length > 0) {
    console.log('\n   ⚠️  Heavy Dependencies:');
    heavyDeps.forEach(dep => console.log(`      - ${dep}`));
  }
  
  if (unnecessaryDeps.length > 0) {
    console.log('\n   ⚠️  Unnecessary Dependencies:');
    unnecessaryDeps.forEach(dep => console.log(`      - ${dep}`));
  }
  
  if (heavyDeps.length === 0 && unnecessaryDeps.length === 0) {
    console.log('   ✅ No heavy dependencies detected');
  }
}

// Summary and recommendations
console.log('\n\n' + '='.repeat(60));
console.log('📊 PERFORMANCE ANALYSIS SUMMARY');
console.log('='.repeat(60));

if (performanceIssues.length === 0) {
  console.log('\n✅ No major performance issues detected!');
  console.log('   Your frontend code looks well-optimized.');
} else {
  console.log(`\n⚠️  Found ${performanceIssues.length} files with performance issues:`);
  
  performanceIssues.forEach(({ file, issues }) => {
    console.log(`\n📄 ${file}:`);
    issues.forEach(issue => console.log(`   ${issue}`));
  });
}

console.log('\n🚀 RECOMMENDED OPTIMIZATIONS:');
console.log('-'.repeat(60));

console.log('\n1. 🎯 Immediate Wins (5 minutes):');
console.log('   - Add React.memo to components that receive props');
console.log('   - Use useMemo for expensive calculations');
console.log('   - Add loading states to all fetch operations');
console.log('   - Enable Next.js compression');

console.log('\n2. 📱 Client-Side Caching (15 minutes):');
console.log('   - Install React Query: npm install @tanstack/react-query');
console.log('   - Cache API responses for 5 minutes');
console.log('   - Reduce network requests by 70%');

console.log('\n3. 🖼️  Image Optimization (10 minutes):');
console.log('   - Use Next.js Image component');
console.log('   - Add image compression');
console.log('   - Lazy load images');

console.log('\n4. 📦 Bundle Optimization (20 minutes):');
console.log('   - Enable tree shaking');
console.log('   - Split large components');
console.log('   - Dynamic imports for heavy features');

console.log('\n5. 🔄 Code Splitting (30 minutes):');
console.log('   - Lazy load routes');
console.log('   - Split vendor bundles');
console.log('   - Preload critical resources');

console.log('\n💡 Expected Results:');
console.log('   - Page load time: 3-5s → 1-2s');
console.log('   - Time to interactive: 5-8s → 2-3s');
console.log('   - Bundle size: -30-50%');
console.log('   - Network requests: -70%');

console.log('\n🎯 Priority Order:');
console.log('   1. Client-side caching (biggest impact)');
console.log('   2. React.memo optimization');
console.log('   3. Next.js config optimization');
console.log('   4. Image optimization');
console.log('   5. Code splitting');

console.log('\n' + '='.repeat(60));