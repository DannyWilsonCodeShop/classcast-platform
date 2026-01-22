'use client';

import { useState, useCallback, useRef } from 'react';

export interface UploadState {
  stage: 'idle' | 'preparing' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  fileName?: string;
  fileSize?: number;
  error?: string;
  uploadSpeed?: number;
  timeRemaining?: number;
  retryCount: number;
  uploadId?: string;
}

export interface UploadOptions {
  maxRetries?: number;
  retryDelay?: number;
  onProgress?: (progress: number) => void;
  onStageChange?: (stage: UploadState['stage']) => void;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

export const useEnhancedUploadState = (options: UploadOptions = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 2000,
    onProgress,
    onStageChange,
    onComplete,
    onError,
  } = options;

  const [uploadState, setUploadState] = useState<UploadState>({
    stage: 'idle',
    progress: 0,
    retryCount: 0,
  });

  const uploadStartTime = useRef<number>(0);
  const lastProgressTime = useRef<number>(0);
  const lastProgressBytes = useRef<number>(0);
  const abortController = useRef<AbortController | null>(null);

  const updateState = useCallback((updates: Partial<UploadState>) => {
    setUploadState(prev => {
      const newState = { ...prev, ...updates };
      
      // Trigger callbacks
      if (updates.stage && updates.stage !== prev.stage) {
        onStageChange?.(updates.stage);
      }
      if (updates.progress !== undefined && updates.progress !== prev.progress) {
        onProgress?.(updates.progress);
      }
      
      return newState;
    });
  }, [onProgress, onStageChange]);

  const calculateUploadSpeed = useCallback((bytesUploaded: number) => {
    const now = Date.now();
    
    if (lastProgressTime.current === 0) {
      lastProgressTime.current = now;
      lastProgressBytes.current = bytesUploaded;
      return 0;
    }

    const timeDiff = (now - lastProgressTime.current) / 1000; // seconds
    const bytesDiff = bytesUploaded - lastProgressBytes.current;
    
    if (timeDiff > 0) {
      const speed = bytesDiff / timeDiff;
      lastProgressTime.current = now;
      lastProgressBytes.current = bytesUploaded;
      return speed;
    }
    
    return 0;
  }, []);

  const calculateTimeRemaining = useCallback((progress: number, uploadSpeed: number, fileSize: number) => {
    if (progress >= 100 || uploadSpeed === 0) return 0;
    
    const remainingBytes = fileSize * ((100 - progress) / 100);
    return remainingBytes / uploadSpeed;
  }, []);

  const startUpload = useCallback((file: File) => {
    uploadStartTime.current = Date.now();
    lastProgressTime.current = 0;
    lastProgressBytes.current = 0;
    abortController.current = new AbortController();

    updateState({
      stage: 'preparing',
      progress: 0,
      fileName: file.name,
      fileSize: file.size,
      error: undefined,
      uploadSpeed: 0,
      timeRemaining: 0,
      uploadId: crypto.randomUUID(),
    });
  }, [updateState]);

  const updateProgress = useCallback((progress: number, bytesUploaded?: number) => {
    const currentState = uploadState;
    
    if (currentState.stage !== 'uploading') {
      updateState({ stage: 'uploading' });
    }

    let uploadSpeed = currentState.uploadSpeed || 0;
    let timeRemaining = currentState.timeRemaining || 0;

    if (bytesUploaded && currentState.fileSize) {
      uploadSpeed = calculateUploadSpeed(bytesUploaded);
      timeRemaining = calculateTimeRemaining(progress, uploadSpeed, currentState.fileSize);
    }

    updateState({
      progress: Math.min(progress, 100),
      uploadSpeed,
      timeRemaining,
    });
  }, [uploadState, updateState, calculateUploadSpeed, calculateTimeRemaining]);

  const setProcessing = useCallback(() => {
    updateState({
      stage: 'processing',
      progress: 100,
      uploadSpeed: 0,
      timeRemaining: 0,
    });
  }, [updateState]);

  const setCompleted = useCallback((result?: any) => {
    updateState({
      stage: 'completed',
      progress: 100,
      error: undefined,
      uploadSpeed: 0,
      timeRemaining: 0,
    });
    
    onComplete?.(result);
  }, [updateState, onComplete]);

  const setError = useCallback((error: string, canRetry: boolean = true) => {
    const newRetryCount = uploadState.retryCount + (canRetry ? 1 : 0);
    
    updateState({
      stage: 'error',
      error,
      retryCount: newRetryCount,
    });
    
    onError?.(error);
  }, [uploadState.retryCount, updateState, onError]);

  const retry = useCallback(async (uploadFunction: () => Promise<void>) => {
    if (uploadState.retryCount >= maxRetries) {
      setError('Maximum retry attempts exceeded. Please try again later.', false);
      return;
    }

    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, retryDelay));
    
    try {
      updateState({
        stage: 'preparing',
        progress: 0,
        error: undefined,
      });
      
      await uploadFunction();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Retry failed');
    }
  }, [uploadState.retryCount, maxRetries, retryDelay, updateState, setError]);

  const cancel = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
    }
    
    updateState({
      stage: 'idle',
      progress: 0,
      error: undefined,
      uploadSpeed: 0,
      timeRemaining: 0,
      retryCount: 0,
    });
  }, [updateState]);

  const reset = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
    }
    
    setUploadState({
      stage: 'idle',
      progress: 0,
      retryCount: 0,
    });
    
    uploadStartTime.current = 0;
    lastProgressTime.current = 0;
    lastProgressBytes.current = 0;
    abortController.current = null;
  }, []);

  // Enhanced upload function with automatic retry logic
  const uploadWithRetry = useCallback(async (
    file: File,
    uploadFunction: (
      file: File,
      onProgress: (progress: number, bytesUploaded?: number) => void,
      signal: AbortSignal
    ) => Promise<any>
  ) => {
    const attemptUpload = async (): Promise<any> => {
      startUpload(file);
      
      try {
        // Small delay to show preparing stage
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!abortController.current) {
          throw new Error('Upload was cancelled');
        }

        const result = await uploadFunction(
          file,
          updateProgress,
          abortController.current.signal
        );
        
        setProcessing();
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setCompleted(result);
        return result;
        
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Upload was cancelled, don't treat as error
          return;
        }
        
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        
        if (uploadState.retryCount < maxRetries) {
          console.log(`Upload attempt ${uploadState.retryCount + 1} failed, retrying...`);
          await retry(attemptUpload);
        } else {
          setError(errorMessage, false);
          throw error;
        }
      }
    };

    return attemptUpload();
  }, [startUpload, updateProgress, setProcessing, setCompleted, setError, retry, uploadState.retryCount, maxRetries]);

  return {
    uploadState,
    startUpload,
    updateProgress,
    setProcessing,
    setCompleted,
    setError,
    retry,
    cancel,
    reset,
    uploadWithRetry,
    canRetry: uploadState.retryCount < maxRetries,
    abortSignal: abortController.current?.signal,
  };
};