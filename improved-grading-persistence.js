// Improved grade change handlers with better persistence

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
        alert(`Failed to save grade for submission ${submissionId}. Please try again.`);
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
        alert(`Failed to save feedback for submission ${submissionId}. Please try again.`);
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
    const response = await fetch(`/api/submissions/${submissionId}/grade`, {
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
      throw new Error(`Failed to save grade: ${response.status} - ${errorText}`);
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
    alert(`Failed to save grade: ${errorMessage}\n\nPlease check your internet connection and try again.`);
    
    throw error;
  } finally {
    setSavingGrades(prev => {
      const newSet = new Set(prev);
      newSet.delete(submissionId);
      return newSet;
    });
  }
}, [setAllSubmissions]);