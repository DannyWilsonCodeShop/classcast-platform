const fs = require('fs');
const path = require('path');

// Fix invalid Tailwind classes created by the color replacement script
const classMappings = {
  'text-[gray-800]': 'text-gray-800',
  'text-[gray-700]': 'text-gray-700',
  'text-[gray-600]': 'text-gray-600',
  'text-[gray-500]': 'text-gray-500',
  'text-[gray-400]': 'text-gray-400',
  'text-[gray-300]': 'text-gray-300',
  'text-[gray-200]': 'text-gray-200',
  'text-[gray-100]': 'text-gray-100',
  'text-[gray-50]': 'text-gray-50',
  'bg-[gray-800]': 'bg-gray-800',
  'bg-[gray-700]': 'bg-gray-700',
  'bg-[gray-600]': 'bg-gray-600',
  'bg-[gray-500]': 'bg-gray-500',
  'bg-[gray-400]': 'bg-gray-400',
  'bg-[gray-300]': 'bg-gray-300',
  'bg-[gray-200]': 'bg-gray-200',
  'bg-[gray-100]': 'bg-gray-100',
  'bg-[gray-50]': 'bg-gray-50',
  'border-[gray-800]': 'border-gray-800',
  'border-[gray-700]': 'border-gray-700',
  'border-[gray-600]': 'border-gray-600',
  'border-[gray-500]': 'border-gray-500',
  'border-[gray-400]': 'border-gray-400',
  'border-[gray-300]': 'border-gray-300',
  'border-[gray-200]': 'border-gray-200',
  'border-[gray-100]': 'border-gray-100',
  'border-[gray-50]': 'border-gray-50',
  'text-[indigo-600]': 'text-indigo-600',
  'text-[indigo-500]': 'text-indigo-500',
  'text-[indigo-400]': 'text-indigo-400',
  'text-[indigo-300]': 'text-indigo-300',
  'text-[indigo-200]': 'text-indigo-200',
  'text-[indigo-100]': 'text-indigo-100',
  'text-[indigo-50]': 'text-indigo-50',
  'bg-[indigo-600]': 'bg-indigo-600',
  'bg-[indigo-500]': 'bg-indigo-500',
  'bg-[indigo-400]': 'bg-indigo-400',
  'bg-[indigo-300]': 'bg-indigo-300',
  'bg-[indigo-200]': 'bg-indigo-200',
  'bg-[indigo-100]': 'bg-indigo-100',
  'bg-[indigo-50]': 'bg-indigo-50',
  'border-[indigo-600]': 'border-indigo-600',
  'border-[indigo-500]': 'border-indigo-500',
  'border-[indigo-400]': 'border-indigo-400',
  'border-[indigo-300]': 'border-indigo-300',
  'border-[indigo-200]': 'border-indigo-200',
  'border-[indigo-100]': 'border-indigo-100',
  'border-[indigo-50]': 'border-indigo-50',
  'text-[purple-600]': 'text-purple-600',
  'text-[purple-500]': 'text-purple-500',
  'text-[purple-400]': 'text-purple-400',
  'text-[purple-300]': 'text-purple-300',
  'text-[purple-200]': 'text-purple-200',
  'text-[purple-100]': 'text-purple-100',
  'text-[purple-50]': 'text-purple-50',
  'bg-[purple-600]': 'bg-purple-600',
  'bg-[purple-500]': 'bg-purple-500',
  'bg-[purple-400]': 'bg-purple-400',
  'bg-[purple-300]': 'bg-purple-300',
  'bg-[purple-200]': 'bg-purple-200',
  'bg-[purple-100]': 'bg-purple-100',
  'bg-[purple-50]': 'bg-purple-50',
  'border-[purple-600]': 'border-purple-600',
  'border-[purple-500]': 'border-purple-500',
  'border-[purple-400]': 'border-purple-400',
  'border-[purple-300]': 'border-purple-300',
  'border-[purple-200]': 'border-purple-200',
  'border-[purple-100]': 'border-purple-100',
  'border-[purple-50]': 'border-purple-50',
  'text-[emerald-600]': 'text-emerald-600',
  'text-[emerald-500]': 'text-emerald-500',
  'text-[emerald-400]': 'text-emerald-400',
  'text-[emerald-300]': 'text-emerald-300',
  'text-[emerald-200]': 'text-emerald-200',
  'text-[emerald-100]': 'text-emerald-100',
  'text-[emerald-50]': 'text-emerald-50',
  'bg-[emerald-600]': 'bg-emerald-600',
  'bg-[emerald-500]': 'bg-emerald-500',
  'bg-[emerald-400]': 'bg-emerald-400',
  'bg-[emerald-300]': 'bg-emerald-300',
  'bg-[emerald-200]': 'bg-emerald-200',
  'bg-[emerald-100]': 'bg-emerald-100',
  'bg-[emerald-50]': 'bg-emerald-50',
  'border-[emerald-600]': 'border-emerald-600',
  'border-[emerald-500]': 'border-emerald-500',
  'border-[emerald-400]': 'border-emerald-400',
  'border-[emerald-300]': 'border-emerald-300',
  'border-[emerald-200]': 'border-emerald-200',
  'border-[emerald-100]': 'border-emerald-100',
  'border-[emerald-50]': 'border-emerald-50',
  'text-[slate-800]': 'text-slate-800',
  'text-[slate-700]': 'text-slate-700',
  'text-[slate-600]': 'text-slate-600',
  'text-[slate-500]': 'text-slate-500',
  'text-[slate-400]': 'text-slate-400',
  'text-[slate-300]': 'text-slate-300',
  'text-[slate-200]': 'text-slate-200',
  'text-[slate-100]': 'text-slate-100',
  'text-[slate-50]': 'text-slate-50',
  'bg-[slate-800]': 'bg-slate-800',
  'bg-[slate-700]': 'bg-slate-700',
  'bg-[slate-600]': 'bg-slate-600',
  'bg-[slate-500]': 'bg-slate-500',
  'bg-[slate-400]': 'bg-slate-400',
  'bg-[slate-300]': 'bg-slate-300',
  'bg-[slate-200]': 'bg-slate-200',
  'bg-[slate-100]': 'bg-slate-100',
  'bg-[slate-50]': 'bg-slate-50',
  'border-[slate-800]': 'border-slate-800',
  'border-[slate-700]': 'border-slate-700',
  'border-[slate-600]': 'border-slate-600',
  'border-[slate-500]': 'border-slate-500',
  'border-[slate-400]': 'border-slate-400',
  'border-[slate-300]': 'border-slate-300',
  'border-[slate-200]': 'border-slate-200',
  'border-[slate-100]': 'border-slate-100',
  'border-[slate-50]': 'border-slate-50',
  'text-[teal-500]': 'text-teal-500',
  'text-[teal-400]': 'text-teal-400',
  'text-[teal-300]': 'text-teal-300',
  'text-[teal-200]': 'text-teal-200',
  'text-[teal-100]': 'text-teal-100',
  'text-[teal-50]': 'text-teal-50',
  'bg-[teal-500]': 'bg-teal-500',
  'bg-[teal-400]': 'bg-teal-400',
  'bg-[teal-300]': 'bg-teal-300',
  'bg-[teal-200]': 'bg-teal-200',
  'bg-[teal-100]': 'bg-teal-100',
  'bg-[teal-50]': 'bg-teal-50',
  'border-[teal-500]': 'border-teal-500',
  'border-[teal-400]': 'border-teal-400',
  'border-[teal-300]': 'border-teal-300',
  'border-[teal-200]': 'border-teal-200',
  'border-[teal-100]': 'border-teal-100',
  'border-[teal-50]': 'border-teal-50',
};

function fixFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Fix invalid Tailwind classes
    for (const [invalidClass, validClass] of Object.entries(classMappings)) {
      const regex = new RegExp(invalidClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (content.includes(invalidClass)) {
        content = content.replace(regex, validClass);
        updated = true;
        console.log(`  Fixed ${invalidClass} -> ${validClass}`);
      }
    }

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed ${filePath}`);
    } else {
      console.log(`⏭️  No fixes needed for ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// Find all files with invalid classes
const { execSync } = require('child_process');
const filesWithInvalidClasses = execSync('find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "text-\\[.*\\]\\|bg-\\[.*\\]\\|border-\\[.*\\]"', { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(file => file.length > 0);

console.log('🔧 Fixing invalid Tailwind classes...\n');

filesWithInvalidClasses.forEach(filePath => {
  console.log(`\n📁 Processing ${filePath}:`);
  fixFile(filePath);
});

console.log('\n🎉 Tailwind class fixes completed!');
