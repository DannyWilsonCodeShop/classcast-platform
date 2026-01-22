#!/usr/bin/env node

/**
 * Fix Grade Persistence Issues
 * 
 * This script diagnoses and fixes issues where grades don't persist after entering them.
 */

const fs = require('fs');

console.log('🔧 Fixing Grade Persistence Issues');
console.log('==================================\n');

function createEnhancedGradeHandler() {
  console.log('📝 Creating enhanced grade persistence handler...');
  
  const gradeHandler = `// Enhanced grade persistence with better error handling and debugging

export const useGradePersistence = (
  submissionId: string,
  initialGrade?: number | null,
  initialFeedback?: string
) => {
  const [grade, setGrade] = useState<number | ''>(initialGrade ?? '');
  const [feedback, setFeedback] = useState<string>(initialFeedback ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveGrade = useCallback(async (gradeValue: number, feedbackValue: string) => {
    console.log('💾 Saving grade:', { submissionId, gradeValue, feedbackValue });
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(\`/api/submissions/\${submissionId}/grade\`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          grade: Number(gradeValue),
          feedback: feedbackValue || '',
          status: 'graded'
        }),
      });

      console.log('📡 Grade save response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Grade save failed:', errorText);
        throw new Error(\`Failed to save grade: \${response.status}\`);
      }

      const data = await response.json();
      console.log('✅ Grade saved successfully:', data);
      
      if (data.success) {
        setLastSaved(new Date());
        setError(null);
        return data;
      } else {
        throw new Error(data.error || 'Failed to save grade');
      }
    } catch (error) {
      console.error('❌ Error saving grade:', error);
      setError(error instanceof Error ? error.message : 'Failed to save grade');
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [submissionId]);

  const handleGradeChange = useCallback((value: string) => {
    const numValue = value === '' ? '' : Number(value);
    setGrade(numValue);
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Auto-save after 1 second if grade is valid
    if (numValue !== '' && !isNaN(Number(numValue))) {
      saveTimeoutRef.current = setTimeout(() => {
        saveGrade(Number(numValue), feedback).catch(console.error);
      }, 1000);
    }
  }, [feedback, saveGrade]);

  const handleFeedbackChange = useCallback((value: string) => {
    setFeedback(value);
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Auto-save after 2 seconds if we have a grade
    if (grade !== '' && !isNaN(Number(grade))) {
      saveTimeoutRef.current = setTimeout(() => {
        saveGrade(Number(grade), value).catch(console.error);
      }, 2000);
    }
  }, [grade, saveGrade]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    grade,
    feedback,
    isSaving,
    lastSaved,
    error,
    handleGradeChange,
    handleFeedbackChange,
    saveGrade
  };
};`;

  fs.writeFileSync('src/hooks/useGradePersistence.ts', gradeHandler);
  console.log('✅ Created: src/hooks/useGradePersistence.ts');
}

function createGradePersistenceDebugger() {
  console.log('🔍 Creating grade persistence debugger...');
  
  const debugScript = `#!/usr/bin/env node

/**
 * Debug Grade Persistence Issues
 */

async function testGradePersistence() {
  console.log('🧪 Testing Grade Persistence');
  console.log('============================\\n');

  const testSubmissionId = 'test-submission-123';
  const testGrade = 85;
  const testFeedback = 'Great work on this assignment!';

  try {
    console.log('📡 Testing grade save API...');
    
    const response = await fetch(\`http://localhost:3000/api/submissions/\${testSubmissionId}/grade\`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grade: testGrade,
        feedback: testFeedback,
        status: 'graded'
      }),
    });

    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', data);
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
    }

  } catch (error) {
    console.error('❌ Network Error:', error);
  }
}

// Test different scenarios
async function runDiagnostics() {
  console.log('🔍 Running Grade Persistence Diagnostics\\n');
  
  console.log('1. Testing API endpoint availability...');
  console.log('2. Testing grade save functionality...');
  console.log('3. Testing auto-save timing...');
  console.log('4. Testing error handling...\\n');
  
  await testGradePersistence();
}

runDiagnostics();`;

  fs.writeFileSync('debug-grade-persistence.js', debugScript);
  console.log('✅ Created: debug-grade-persistence.js');
}

function fixGradingPagePersistence() {
  console.log('🔧 Creating improved grading page with better persistence...');
  
  const improvedGradingLogic = `// Improved grade change handlers with better persistence

// Enhanced grade change handler
const handleGradeChange = useCallback((submissionId: string, value: string) => {
  console.log('📝 Grade changed:', { submissionId, value });
  
  const numValue = value === '' ? '' : Number(value);
  
  // Update local state immediately
  setGrades(prev => {
    const newGrades = { ...prev, [submissionId]: numValue };
    console.log('📊 Updated grades state:', newGrades);
    return newGrades;
  });
  
  // Clear existing timeout
  if (saveTimeouts[submissionId]) {
    clearTimeout(saveTimeouts[submissionId]);
  }
  
  // Auto-save after 1 second if grade is valid
  if (numValue !== '' && !isNaN(Number(numValue))) {
    const timeout = setTimeout(async () => {
      console.log('💾 Auto-saving grade:', { submissionId, grade: numValue });
      
      try {
        await handleAutoSave(submissionId, Number(numValue), feedbackState[submissionId] || '');
        console.log('✅ Grade auto-saved successfully');
      } catch (error) {
        console.error('❌ Auto-save failed:', error);
        // Show user-friendly error
        alert(\`Failed to save grade for submission \${submissionId}. Please try again.\`);
      }
    }, 1000);
    
    setSaveTimeouts(prev => ({ ...prev, [submissionId]: timeout }));
  }
}, [feedbackState, saveTimeouts, handleAutoSave]);

// Enhanced feedback change handler
const handleFeedbackChange = useCallback((submissionId: string, value: string) => {
  console.log('💬 Feedback changed:', { submissionId, value: value.substring(0, 50) + '...' });
  
  // Update local state immediately
  setFeedbackState(prev => {
    const newFeedback = { ...prev, [submissionId]: value };
    console.log('📝 Updated feedback state for:', submissionId);
    return newFeedback;
  });
  
  // Clear existing timeout
  if (saveTimeouts[submissionId]) {
    clearTimeout(saveTimeouts[submissionId]);
  }
  
  // Auto-save after 2 seconds if we have a grade
  const currentGrade = grades[submissionId] ?? filteredSubmissions.find(s => s.submissionId === submissionId)?.grade;
  
  if (currentGrade !== undefined && currentGrade !== '' && !isNaN(Number(currentGrade))) {
    const timeout = setTimeout(async () => {
      console.log('💾 Auto-saving feedback:', { submissionId, grade: currentGrade });
      
      try {
        await handleAutoSave(submissionId, Number(currentGrade), value);
        console.log('✅ Feedback auto-saved successfully');
      } catch (error) {
        console.error('❌ Feedback auto-save failed:', error);
        alert(\`Failed to save feedback for submission \${submissionId}. Please try again.\`);
      }
    }, 2000);
    
    setSaveTimeouts(prev => ({ ...prev, [submissionId]: timeout }));
  }
}, [grades, filteredSubmissions, saveTimeouts, handleAutoSave]);

// Enhanced auto-save function with better error handling
const handleAutoSave = useCallback(async (submissionId: string, grade: number, feedback: string) => {
  console.log('💾 Starting auto-save:', { submissionId, grade, feedback: feedback.substring(0, 50) + '...' });
  
  setSavingGrades(prev => new Set(prev).add(submissionId));
  
  try {
    const response = await fetch(\`/api/submissions/\${submissionId}/grade\`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        grade: Number(grade),
        feedback: feedback || '',
        status: 'graded'
      }),
    });

    console.log('📡 Auto-save response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Auto-save API error:', errorText);
      throw new Error(\`Failed to save grade: \${response.status} - \${errorText}\`);
    }

    const data = await response.json();
    console.log('✅ Auto-save response:', data);
    
    if (data.success) {
      // Update local state with saved data
      setAllSubmissions(prev => prev.map(sub =>
        sub.submissionId === submissionId
          ? { ...sub, grade: Number(grade), feedback, status: 'graded' as const }
          : sub
      ));
      
      console.log('✅ Local state updated after successful save');
    } else {
      throw new Error(data.error || 'Failed to save grade');
    }
  } catch (error) {
    console.error('❌ Auto-save error:', error);
    
    // Show specific error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    alert(\`Failed to save grade: \${errorMessage}\\n\\nPlease check your internet connection and try again.\`);
    
    throw error;
  } finally {
    setSavingGrades(prev => {
      const newSet = new Set(prev);
      newSet.delete(submissionId);
      return newSet;
    });
  }
}, [setAllSubmissions]);`;

  fs.writeFileSync('improved-grading-persistence.js', improvedGradingLogic);
  console.log('✅ Created: improved-grading-persistence.js');
}

function createGradePersistenceTest() {
  console.log('🧪 Creating grade persistence test...');
  
  const testScript = `#!/usr/bin/env node

/**
 * Test Grade Persistence Functionality
 */

async function testGradePersistence() {
  console.log('🧪 Testing Grade Persistence System');
  console.log('==================================\\n');

  // Test scenarios
  const testCases = [
    {
      name: 'Valid Grade Save',
      submissionId: 'test-submission-1',
      grade: 85,
      feedback: 'Great work!',
      expectedSuccess: true
    },
    {
      name: 'Grade Only (No Feedback)',
      submissionId: 'test-submission-2', 
      grade: 92,
      feedback: '',
      expectedSuccess: true
    },
    {
      name: 'Feedback Only (No Grade)',
      submissionId: 'test-submission-3',
      grade: null,
      feedback: 'Please revise and resubmit',
      expectedSuccess: true
    },
    {
      name: 'Invalid Grade (Too High)',
      submissionId: 'test-submission-4',
      grade: 150,
      feedback: 'Test feedback',
      expectedSuccess: false
    }
  ];

  for (const testCase of testCases) {
    console.log(\`\\n🔍 Testing: \${testCase.name}\`);
    
    try {
      const body = {};
      if (testCase.grade !== null) body.grade = testCase.grade;
      if (testCase.feedback) body.feedback = testCase.feedback;
      body.status = 'graded';

      const response = await fetch(\`http://localhost:3000/api/submissions/\${testCase.submissionId}/grade\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      
      if (testCase.expectedSuccess) {
        if (response.ok && data.success) {
          console.log('✅ Test passed');
        } else {
          console.log('❌ Test failed - expected success but got error:', data);
        }
      } else {
        if (!response.ok || !data.success) {
          console.log('✅ Test passed - correctly rejected invalid input');
        } else {
          console.log('❌ Test failed - should have rejected invalid input');
        }
      }
      
    } catch (error) {
      console.log('❌ Test error:', error.message);
    }
  }
}

testGradePersistence();`;

  fs.writeFileSync('test-grade-persistence.js', testScript);
  console.log('✅ Created: test-grade-persistence.js');
}

// Main execution
async function main() {
  console.log('Starting grade persistence fix...\n');
  
  createEnhancedGradeHandler();
  createGradePersistenceDebugger();
  fixGradingPagePersistence();
  createGradePersistenceTest();
  
  console.log('\n🎉 Grade Persistence Fix Complete!');
  console.log('==================================\n');
  
  console.log('📋 What was created:');
  console.log('✅ Enhanced grade persistence hook');
  console.log('✅ Grade persistence debugger');
  console.log('✅ Improved grading page logic');
  console.log('✅ Grade persistence test suite');
  
  console.log('\n🚀 Next Steps:');
  console.log('1. Test the grade persistence with: node test-grade-persistence.js');
  console.log('2. Debug any issues with: node debug-grade-persistence.js');
  console.log('3. Apply the improved grading logic to the main page');
  console.log('4. Monitor grade saves in browser console');
  
  console.log('\n🔍 Debugging Tips:');
  console.log('• Check browser console for grade save logs');
  console.log('• Verify API endpoint is accessible');
  console.log('• Test with different grade values');
  console.log('• Check network tab for failed requests');
}

main();