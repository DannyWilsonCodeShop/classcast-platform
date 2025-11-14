const fs = require('fs');
const path = require('path');

// Color mapping from old bright colors to new sophisticated colors
const colorMappings = {
  // Primary brand colors
  '#4A90E2': 'indigo-600',      // Bright blue -> Sophisticated indigo
  '#9B5DE5': 'purple-600',      // Bright purple -> Refined purple
  '#06D6A0': 'emerald-600',     // Bright green -> Professional emerald
  '#003366': 'slate-800',       // Dark blue -> Sophisticated slate
  
  // Background colors
  '#F5F5F5': 'gray-50',         // Light gray -> Clean gray
  '#333333': 'gray-800',        // Dark gray -> Professional gray
  
  // Accent colors
  '#FF6B6B': 'rose-500',        // Bright red -> Sophisticated rose
  '#4ECDC4': 'teal-500',        // Bright teal -> Refined teal
  '#45B7D1': 'sky-500',         // Bright sky blue -> Professional sky
  '#96CEB4': 'green-400',       // Bright green -> Muted green
  '#FFEAA7': 'amber-300',       // Bright yellow -> Refined amber
  '#DDA0DD': 'purple-300',      // Bright purple -> Soft purple
  '#98D8C8': 'emerald-300',     // Bright mint -> Soft emerald
  '#F7DC6F': 'yellow-400',      // Bright yellow -> Professional yellow
  '#BB8FCE': 'purple-400',      // Bright lavender -> Refined purple
  '#85C1E9': 'blue-400',        // Bright blue -> Professional blue
  '#F8C471': 'orange-400',      // Bright orange -> Refined orange
  '#82E0AA': 'green-400',       // Bright green -> Professional green
  '#F1948A': 'red-400',         // Bright red -> Sophisticated red
  '#85C1E9': 'blue-400',        // Bright blue -> Professional blue
  '#D7BDE2': 'purple-300',      // Bright lavender -> Soft purple
  '#A9DFBF': 'green-300',       // Bright mint -> Soft green
  '#F9E79F': 'yellow-300',      // Bright yellow -> Soft yellow
  '#D5DBDB': 'gray-300',        // Light gray -> Professional gray
  '#E8F8F5': 'emerald-50',      // Light mint -> Soft emerald
  '#FEF9E7': 'yellow-50',       // Light yellow -> Soft yellow
  '#F4F6F7': 'gray-50',         // Light gray -> Clean gray
  '#EBF5FB': 'blue-50',         // Light blue -> Soft blue
  '#F8F9FA': 'gray-50',         // Light gray -> Clean gray
  '#E8F4FD': 'blue-50',         // Light blue -> Soft blue
  '#F0F8FF': 'blue-50',         // Light blue -> Soft blue
  '#F5F5DC': 'yellow-50',       // Light beige -> Soft yellow
  '#FFF8DC': 'yellow-50',       // Light cream -> Soft yellow
  '#F0FFF0': 'green-50',        // Light mint -> Soft green
  '#FFF0F5': 'pink-50',         // Light pink -> Soft pink
  '#F0F8FF': 'blue-50',         // Light blue -> Soft blue
  '#F5FFFA': 'emerald-50',      // Light mint -> Soft emerald
  '#FFF5EE': 'orange-50',       // Light cream -> Soft orange
  '#FDF5E6': 'yellow-50',       // Light cream -> Soft yellow
  '#FAF0E6': 'orange-50',       // Light linen -> Soft orange
  '#F0E68C': 'yellow-400',      // Khaki -> Professional yellow
  '#DDA0DD': 'purple-300',      // Plum -> Soft purple
  '#98FB98': 'green-300',       // Pale green -> Soft green
  '#F0E68C': 'yellow-400',      // Khaki -> Professional yellow
  '#DDA0DD': 'purple-300',      // Plum -> Soft purple
  '#98FB98': 'green-300',       // Pale green -> Soft green
  '#F0E68C': 'yellow-400',      // Khaki -> Professional yellow
  '#DDA0DD': 'purple-300',      // Plum -> Soft purple
  '#98FB98': 'green-300',       // Pale green -> Soft green
};

// Files to update
const filesToUpdate = [
  'src/app/student/dashboard/page.tsx',
  'src/app/instructor/dashboard/page.tsx',
  'src/app/student/courses/page.tsx',
  'src/app/instructor/courses/page.tsx',
  'src/components/auth/SignupForm.tsx',
  'src/components/auth/LoginForm.tsx',
  'src/components/student/AssignmentCard.tsx',
  'src/components/instructor/CourseCard.tsx',
  'src/components/instructor/AssignmentCreationForm.tsx',
  'src/app/student/peer-reviews/page.tsx',
  'src/app/instructor/grading/bulk/page.tsx',
  'src/app/instructor/submissions/page.tsx',
  'src/components/student/VideoSubmission.tsx',
  'src/components/student/CommunityInteractions.tsx',
  'src/components/student/PeerInteractionStats.tsx',
  'src/components/auth/EmailVerificationModal.tsx'
];

function updateFileColors(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Replace hex colors with Tailwind classes
    for (const [oldColor, newClass] of Object.entries(colorMappings)) {
      const regex = new RegExp(oldColor.replace('#', '\\#'), 'g');
      if (content.includes(oldColor)) {
        content = content.replace(regex, newClass);
        updated = true;
        console.log(`  Replaced ${oldColor} with ${newClass}`);
      }
    }

    // Replace specific patterns
    const patterns = [
      // Replace text-[#color] with text-color
      { from: /text-\[#([0-9A-Fa-f]{6})\]/g, to: (match, color) => {
        const mappedColor = colorMappings[`#${color}`];
        return mappedColor ? `text-${mappedColor}` : match;
      }},
      // Replace bg-[#color] with bg-color
      { from: /bg-\[#([0-9A-Fa-f]{6})\]/g, to: (match, color) => {
        const mappedColor = colorMappings[`#${color}`];
        return mappedColor ? `bg-${mappedColor}` : match;
      }},
      // Replace border-[#color] with border-color
      { from: /border-\[#([0-9A-Fa-f]{6})\]/g, to: (match, color) => {
        const mappedColor = colorMappings[`#${color}`];
        return mappedColor ? `border-${mappedColor}` : match;
      }},
      // Replace ring-[#color] with ring-color
      { from: /ring-\[#([0-9A-Fa-f]{6})\]/g, to: (match, color) => {
        const mappedColor = colorMappings[`#${color}`];
        return mappedColor ? `ring-${mappedColor}` : match;
      }},
      // Replace hover:bg-[#color] with hover:bg-color
      { from: /hover:bg-\[#([0-9A-Fa-f]{6})\]/g, to: (match, color) => {
        const mappedColor = colorMappings[`#${color}`];
        return mappedColor ? `hover:bg-${mappedColor}` : match;
      }},
      // Replace hover:text-[#color] with hover:text-color
      { from: /hover:text-\[#([0-9A-Fa-f]{6})\]/g, to: (match, color) => {
        const mappedColor = colorMappings[`#${color}`];
        return mappedColor ? `hover:text-${mappedColor}` : match;
      }},
    ];

    patterns.forEach(pattern => {
      if (typeof pattern.to === 'function') {
        content = content.replace(pattern.from, pattern.to);
        updated = true;
      } else {
        content = content.replace(pattern.from, pattern.to);
        updated = true;
      }
    });

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated ${filePath}`);
    } else {
      console.log(`⏭️  No changes needed for ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

console.log('🎨 Starting color palette update...\n');

filesToUpdate.forEach(filePath => {
  console.log(`\n📁 Processing ${filePath}:`);
  updateFileColors(filePath);
});

console.log('\n🎉 Color palette update completed!');
