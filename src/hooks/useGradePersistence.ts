// Enhanced grade persistence with better error handling and debugging

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
      const response = await fetch(`/api/submissions/${submissionId}/grade`, {
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
        throw new Error(`Failed to save grade: ${response.status}`);
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
};