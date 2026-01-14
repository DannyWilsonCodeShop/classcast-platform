'use client';

import React, { useState, useRef } from 'react';
import { isValidYouTubeUrl, extractYouTubeVideoId, getYouTubeEmbedUrl } from '@/lib/youtube';
import { isValidGoogleDriveUrl, extractGoogleDriveFileId, getGoogleDrivePreviewUrl } from '@/lib/googleDrive';

interface InstructionalVideoUploaderProps {
  value: string; // Current video URL
  onChange: (url: string) => void; // Callback when URL changes
  onError?: (error: string) => void; // Optional error callback
}

const InstructionalVideoUploader: React.FC<InstructionalVideoUploaderProps> = ({
  value,
  onChange,
  onError
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');
  const [videoUrl, setVideoUrl] = useState(value || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate URL
  const isValidUrl = (url: string) => {
    if (!url) return false;
    const trimmed = url.trim();
    return isValidYouTubeUrl(trimmed) || isValidGoogleDriveUrl(trimmed);
  };

  const trimmedUrl = videoUrl.trim();
  const isYouTube = isValidYouTubeUrl(trimmedUrl);
  const isGoogleDrive = isValidGoogleDriveUrl(trimmedUrl);
  const isValid = isValidUrl(trimmedUrl);

  // Handle URL input change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setVideoUrl(newUrl);
    
    // Only update parent if URL is valid or empty
    if (!newUrl || isValidUrl(newUrl)) {
      onChange(newUrl);
      if (onError) onError('');
    }
  };

  // Handle URL paste
  const handleUrlPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedUrl = e.clipboardData.getData('text');
    if (pastedUrl && isValidUrl(pastedUrl)) {
      setVideoUrl(pastedUrl);
      onChange(pastedUrl);
      if (onError) onError('');
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/quicktime'];
      if (!validTypes.includes(file.type)) {
        if (onError) onError('Please select a valid video file (MP4, WebM, or MOV)');
        return;
      }

      // Validate file size (max 2GB)
      const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
      if (file.size > maxSize) {
        if (onError) onError('File size must be less than 2GB. Consider using YouTube or Google Drive for large files.');
        return;
      }

      setSelectedFile(file);
      if (onError) onError('');
    }
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('type', 'instructional');

      const response = await fetch('/api/upload/instructional-video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      
      if (data.success && data.videoUrl) {
        setUploadProgress(100);
        onChange(data.videoUrl);
        setVideoUrl(data.videoUrl);
        if (onError) onError('');
        
        // Show success message
        alert('✅ Video uploaded successfully!');
      } else {
        throw new Error('Upload failed: No video URL returned');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      if (onError) onError(errorMessage);
      
      // Show helpful error message
      alert(
        '❌ Video upload failed.\n\n' +
        '✅ RECOMMENDED: Use YouTube or Google Drive instead:\n' +
        '1. Upload your video to YouTube or Google Drive\n' +
        '2. Get the share link\n' +
        '3. Use the "Video URL" tab\n' +
        '4. Paste the link\n\n' +
        'This is faster and more reliable!'
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Clear video
  const handleClear = () => {
    setVideoUrl('');
    setSelectedFile(null);
    setUploadProgress(0);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'url'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          🔗 Video URL (Recommended)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'upload'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          📤 Upload File
        </button>
      </div>

      {/* URL Tab */}
      {activeTab === 'url' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              YouTube or Google Drive URL
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={handleUrlChange}
              onPaste={handleUrlPaste}
              placeholder="https://www.youtube.com/watch?v=... or https://drive.google.com/file/d/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            {videoUrl && !isValid && (
              <p className="mt-1 text-sm text-red-600">
                Please enter a valid YouTube or Google Drive URL
              </p>
            )}
            {isValid && (
              <p className="mt-1 text-sm text-green-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Valid {isYouTube ? 'YouTube' : 'Google Drive'} URL
              </p>
            )}
          </div>

          {/* URL Examples */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">📝 URL Examples:</h4>
            <div className="space-y-1 text-xs text-blue-800">
              <p><strong>YouTube:</strong> https://www.youtube.com/watch?v=VIDEO_ID</p>
              <p><strong>YouTube Short:</strong> https://youtu.be/VIDEO_ID</p>
              <p><strong>Google Drive:</strong> https://drive.google.com/file/d/FILE_ID/view</p>
            </div>
            <div className="mt-3 text-xs text-blue-700">
              <p className="font-medium mb-1">💡 Tips:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>YouTube videos can be "Unlisted" (students can view but not searchable)</li>
                <li>Google Drive files must be shared with "Anyone with the link"</li>
                <li>URLs are faster and more reliable than file uploads</li>
              </ul>
            </div>
          </div>

          {/* Video Preview */}
          {isValid && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
              <div className="aspect-video bg-black">
                {isYouTube ? (
                  <iframe
                    src={getYouTubeEmbedUrl(trimmedUrl) || trimmedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : isGoogleDrive ? (
                  <iframe
                    src={getGoogleDrivePreviewUrl(trimmedUrl) || trimmedUrl}
                    className="w-full h-full"
                    allow="autoplay"
                    allowFullScreen
                  />
                ) : null}
              </div>
              <div className="p-3 bg-white flex items-center justify-between">
                <p className="text-sm text-gray-600">Preview of your instructional video</p>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          {/* Warning Banner */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-yellow-800 mb-1">
                  ⚠️ File Uploads May Experience Issues
                </h4>
                <p className="text-sm text-yellow-700 mb-2">
                  Direct video uploads are experiencing reliability issues. We strongly recommend using YouTube or Google Drive instead.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('url')}
                  className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                >
                  Switch to Video URL (Recommended)
                </button>
              </div>
            </div>
          </div>

          {/* File Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Video File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/mov,video/quicktime"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">
              Supported formats: MP4, WebM, MOV (max 2GB)
            </p>
          </div>

          {/* Selected File Info */}
          {selectedFile && !isUploading && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              </div>
              <button
                type="button"
                onClick={handleFileUpload}
                className="mt-3 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Upload Video
              </button>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">Uploading...</span>
                <span className="text-sm font-medium text-blue-900">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-blue-700">
                Please wait while your video is being uploaded...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InstructionalVideoUploader;
