'use client';

import React, { useState, useRef } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { VideoUploadZone } from '@/components/student/VideoUploadZone';
import { VideoUploadProgress } from '@/components/student/VideoUploadProgress';
import { ArrowLeftIcon, CloudArrowUpIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function VideoUploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadedVideo, setUploadedVideo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file');
      return;
    }

    // Validate file size (max 500MB)
    if (file.size > 500 * 1024 * 1024) {
      setError('Video file must be less than 500MB');
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');
    setError(null);
    setUploadProgress(0);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'videos');
      formData.append('userId', user?.id || '');
      formData.append('metadata', JSON.stringify({
        fileType: 'video',
        uploadedAt: new Date().toISOString(),
        originalName: file.name,
        size: file.size
      }));

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 200);

      // Upload file
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      setUploadedVideo(result.data);
      setUploadStatus('success');
      setUploadProgress(100);

      // Redirect to dashboard after successful upload
      setTimeout(() => {
        router.push('/student/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetry = () => {
    setUploadStatus('idle');
    setError(null);
    setUploadedVideo(null);
    setUploadProgress(0);
  };

  return (
    <StudentRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <VideoCameraIcon className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Upload Video</h1>
                <p className="text-gray-600 mt-1">Share your video content with the class</p>
              </div>
            </div>
          </div>

          {/* Upload Area */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            {uploadStatus === 'idle' && (
              <VideoUploadZone
                onFileSelect={handleFileSelect}
                isUploading={isUploading}
              />
            )}

            {uploadStatus === 'uploading' && (
              <VideoUploadProgress
                progress={uploadProgress}
                fileName={uploadedVideo?.fileName || 'Uploading...'}
              />
            )}

            {uploadStatus === 'success' && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CloudArrowUpIcon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Successful!</h3>
                <p className="text-gray-600 mb-6">Your video has been uploaded successfully.</p>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push('/student/dashboard')}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={handleRetry}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors ml-3"
                  >
                    Upload Another
                  </button>
                </div>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CloudArrowUpIcon className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Failed</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                  onClick={handleRetry}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* Upload Guidelines */}
          <div className="mt-8 bg-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Upload Guidelines</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-2">Supported Formats:</h4>
                <ul className="space-y-1">
                  <li>• MP4, MOV, AVI, WMV</li>
                  <li>• WebM, OGG, 3GP</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">File Requirements:</h4>
                <ul className="space-y-1">
                  <li>• Maximum size: 500MB</li>
                  <li>• Recommended resolution: 1080p</li>
                  <li>• Duration: 5-60 minutes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentRoute>
  );
}
