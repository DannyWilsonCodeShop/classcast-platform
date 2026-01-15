'use client';

import React, { useState } from 'react';
import { SimpleMobileUpload } from '@/components/student/SimpleMobileUpload';
import { MobileAssignmentUpload } from '@/components/student/MobileAssignmentUpload';

export default function TestMobileUploadPage() {
  const [testMode, setTestMode] = useState<'simple' | 'assignment'>('simple');
  const [uploadResults, setUploadResults] = useState<any[]>([]);

  const handleFileSelect = (file: File) => {
    console.log('📱 Test - File selected:', file);
    setUploadResults(prev => [...prev, {
      timestamp: new Date().toISOString(),
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      status: 'selected'
    }]);
  };

  const handleUploadComplete = (submissionId: string) => {
    console.log('📱 Test - Upload completed:', submissionId);
    setUploadResults(prev => [...prev, {
      timestamp: new Date().toISOString(),
      submissionId,
      status: 'completed'
    }]);
  };

  const clearResults = () => {
    setUploadResults([]);
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(2)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">
            📱 Mobile Upload Test Page
          </h1>
          <p className="text-gray-600 mt-2">
            Test the mobile upload components in different scenarios
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Test Mode Selector */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Test Mode</h2>
          <div className="flex space-x-4">
            <button
              onClick={() => setTestMode('simple')}
              className={`px-4 py-2 rounded-lg font-medium ${
                testMode === 'simple'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Simple Upload
            </button>
            <button
              onClick={() => setTestMode('assignment')}
              className={`px-4 py-2 rounded-lg font-medium ${
                testMode === 'assignment'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Assignment Upload
            </button>
          </div>
        </div>

        {/* Test Component */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">
            {testMode === 'simple' ? 'Simple Upload Component' : 'Assignment Upload Component'}
          </h2>
          
          {testMode === 'simple' ? (
            <SimpleMobileUpload
              onFileSelect={handleFileSelect}
              maxFileSize={100 * 1024 * 1024} // 100MB for testing
            />
          ) : (
            <MobileAssignmentUpload
              assignmentId="test-assignment-123"
              courseId="test-course-456"
              assignmentTitle="Mobile Upload Test Assignment"
              maxFileSize={100 * 1024 * 1024} // 100MB for testing
              onUploadComplete={handleUploadComplete}
              onCancel={() => console.log('📱 Test - Upload cancelled')}
            />
          )}
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Test Results</h2>
            <button
              onClick={clearResults}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Clear
            </button>
          </div>
          
          {uploadResults.length === 0 ? (
            <p className="text-gray-500 italic">No test results yet. Try uploading a file above.</p>
          ) : (
            <div className="space-y-3">
              {uploadResults.map((result, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      result.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {result.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="text-sm space-y-1">
                    {result.fileName && (
                      <div><strong>File:</strong> {result.fileName}</div>
                    )}
                    {result.fileSize && (
                      <div><strong>Size:</strong> {formatFileSize(result.fileSize)}</div>
                    )}
                    {result.fileType && (
                      <div><strong>Type:</strong> {result.fileType}</div>
                    )}
                    {result.submissionId && (
                      <div><strong>Submission ID:</strong> {result.submissionId}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Test Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            📱 Mobile Testing Instructions
          </h3>
          <div className="text-blue-800 space-y-2">
            <p><strong>Desktop Testing:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Use browser dev tools to simulate mobile devices</li>
              <li>Test with different file sizes and types</li>
              <li>Check console for detailed logging</li>
            </ul>
            
            <p className="mt-4"><strong>Mobile Device Testing:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Access this page on your mobile device</li>
              <li>Test with camera-recorded videos</li>
              <li>Test with existing videos from gallery</li>
              <li>Test with poor network conditions</li>
            </ul>
            
            <p className="mt-4"><strong>Test Scenarios:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Small video files (&lt; 10MB)</li>
              <li>Large video files (&gt; 50MB)</li>
              <li>Files that exceed size limit</li>
              <li>Non-video files (should be rejected)</li>
              <li>Network interruption during upload</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}