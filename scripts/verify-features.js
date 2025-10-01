#!/usr/bin/env node

/**
 * Feature Verification Script
 * Automatically checks if features are properly implemented
 */

const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.blue}${msg}${colors.reset}`)
};

// Feature verification checks
const checks = {
  // Fall+Spring Semester Feature
  fallSpringSemester: () => {
    const results = [];
    
    // Check constants file
    const constantsPath = 'src/constants/semesters.ts';
    if (fs.existsSync(constantsPath)) {
      const content = fs.readFileSync(constantsPath, 'utf8');
      if (content.includes('Fall+Spring') && content.includes('Full Year')) {
        results.push({ status: 'pass', message: 'Semester constants include Fall+Spring option' });
      } else {
        results.push({ status: 'fail', message: 'Semester constants missing Fall+Spring option' });
      }
    } else {
      results.push({ status: 'fail', message: 'Semester constants file not found' });
    }

    // Check wizard component
    const wizardPath = 'src/components/wizards/InstructorOnboardingWizard.tsx';
    if (fs.existsSync(wizardPath)) {
      const content = fs.readFileSync(wizardPath, 'utf8');
      if (content.includes('SEMESTER_OPTIONS') && content.includes('constants/semesters')) {
        results.push({ status: 'pass', message: 'Instructor wizard includes Fall+Spring option' });
      } else {
        results.push({ status: 'fail', message: 'Instructor wizard missing Fall+Spring option' });
      }
    }

    // Check course form
    const courseFormPath = 'src/components/instructor/CourseForm.tsx';
    if (fs.existsSync(courseFormPath)) {
      const content = fs.readFileSync(courseFormPath, 'utf8');
      if (content.includes('SEMESTER_OPTIONS') && content.includes('constants/semesters')) {
        results.push({ status: 'pass', message: 'Course form includes Fall+Spring option' });
      } else {
        results.push({ status: 'fail', message: 'Course form missing Fall+Spring option' });
      }
    }

    return results;
  },

  // Section Management Feature
  sectionManagement: () => {
    const results = [];
    
    // Check database schema
    const schemaPath = 'database/sections-schema.sql';
    if (fs.existsSync(schemaPath)) {
      const content = fs.readFileSync(schemaPath, 'utf8');
      if (content.includes('CREATE TABLE IF NOT EXISTS sections') && content.includes('section_enrollments')) {
        results.push({ status: 'pass', message: 'Database schema includes sections tables' });
      } else {
        results.push({ status: 'fail', message: 'Database schema missing sections tables' });
      }
    } else {
      results.push({ status: 'fail', message: 'Database schema file not found' });
    }

    // Check API endpoints
    const apiPaths = [
      'src/app/api/sections/route.ts',
      'src/app/api/sections/[sectionId]/route.ts',
      'src/app/api/sections/[sectionId]/enrollments/route.ts'
    ];
    
    apiPaths.forEach(apiPath => {
      if (fs.existsSync(apiPath)) {
        results.push({ status: 'pass', message: `API endpoint exists: ${apiPath}` });
      } else {
        results.push({ status: 'fail', message: `API endpoint missing: ${apiPath}` });
      }
    });

    // Check frontend components
    const componentPaths = [
      'src/components/sections/SectionForm.tsx',
      'src/components/sections/SectionManagement.tsx'
    ];
    
    componentPaths.forEach(componentPath => {
      if (fs.existsSync(componentPath)) {
        results.push({ status: 'pass', message: `Component exists: ${componentPath}` });
      } else {
        results.push({ status: 'fail', message: `Component missing: ${componentPath}` });
      }
    });

    // Check types
    const typesPath = 'types/sections.ts';
    if (fs.existsSync(typesPath)) {
      const content = fs.readFileSync(typesPath, 'utf8');
      if (content.includes('interface Section') && content.includes('CreateSectionRequest')) {
        results.push({ status: 'pass', message: 'Section types are defined' });
      } else {
        results.push({ status: 'fail', message: 'Section types are incomplete' });
      }
    } else {
      results.push({ status: 'fail', message: 'Section types file not found' });
    }

    return results;
  },

  // Assignment Section Targeting (TODO)
  assignmentSectionTargeting: () => {
    const results = [];
    
    // Check if assignment creation includes section targeting
    const assignmentCreatePath = 'src/app/instructor/assignments/create/page.tsx';
    if (fs.existsSync(assignmentCreatePath)) {
      const content = fs.readFileSync(assignmentCreatePath, 'utf8');
      if (content.includes('courseId') && content.includes('searchParams')) {
        results.push({ status: 'pass', message: 'Assignment creation includes courseId parameter' });
      } else {
        results.push({ status: 'fail', message: 'Assignment creation missing courseId parameter' });
      }
    } else {
      results.push({ status: 'fail', message: 'Assignment creation page not found' });
    }

    // Check if assignment form includes section targeting
    const assignmentFormPath = 'src/components/instructor/AssignmentCreationForm.tsx';
    if (fs.existsSync(assignmentFormPath)) {
      const content = fs.readFileSync(assignmentFormPath, 'utf8');
      if (content.includes('targetSections') && content.includes('Target Sections')) {
        results.push({ status: 'pass', message: 'Assignment form includes section targeting UI' });
      } else {
        results.push({ status: 'fail', message: 'Assignment form missing section targeting UI' });
      }
    } else {
      results.push({ status: 'fail', message: 'Assignment form not found' });
    }

    return results;
  }
};

// Run all checks
function runVerification() {
  log.header('🔍 Feature Verification Report');
  log.info('Checking implementation status...\n');

  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;

  // Run Fall+Spring Semester checks
  log.header('📚 Fall+Spring Semester Feature');
  const semesterResults = checks.fallSpringSemester();
  semesterResults.forEach(result => {
    totalChecks++;
    if (result.status === 'pass') {
      log.success(result.message);
      passedChecks++;
    } else {
      log.error(result.message);
      failedChecks++;
    }
  });

  // Run Section Management checks
  log.header('🏫 Section Management Feature');
  const sectionResults = checks.sectionManagement();
  sectionResults.forEach(result => {
    totalChecks++;
    if (result.status === 'pass') {
      log.success(result.message);
      passedChecks++;
    } else {
      log.error(result.message);
      failedChecks++;
    }
  });

  // Run Assignment Section Targeting checks
  log.header('📝 Assignment Section Targeting');
  const assignmentResults = checks.assignmentSectionTargeting();
  assignmentResults.forEach(result => {
    totalChecks++;
    if (result.status === 'pass') {
      log.success(result.message);
      passedChecks++;
    } else {
      log.error(result.message);
      failedChecks++;
    }
  });

  // Summary
  log.header('📊 Summary');
  console.log(`Total checks: ${totalChecks}`);
  console.log(`${colors.green}Passed: ${passedChecks}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedChecks}${colors.reset}`);
  
  const successRate = ((passedChecks / totalChecks) * 100).toFixed(1);
  console.log(`Success rate: ${successRate}%`);

  if (failedChecks === 0) {
    log.success('🎉 All features are properly implemented!');
    process.exit(0);
  } else {
    log.warning(`⚠️  ${failedChecks} checks failed. Please review and fix the issues above.`);
    process.exit(1);
  }
}

// Run verification
runVerification();
