'use client';

import { useState } from 'react';

interface VideoUploadFormProps {
  assignmentId: string;
  assignmentTitle: string;
  onSubmit: (data: VideoUploadData) => void;
  onCancel: () => void;
}

interface VideoUploadData {
  title: string;
  description: string;
  isPublic: boolean;
  file: File | null;
}

export default function VideoUploadForm({ assignmentId, assignmentTitle, onSubmit, onCancel }: VideoUploadFormProps) {
  const [formData, setFormData] = useState<VideoUploadData>({
    title: '',
    description: '',
    isPublic: true,
    file: null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleInputChange = (field: keyof VideoUploadData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (file: File | null) => {
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        alert('Please select a video file');
        return;
      }
      
      // Validate file size (max 500MB)
      if (file.size > 500 * 1024 * 1024) {
        alert('File size must be less than 500MB');
        return;
      }
      
      handleInputChange('file', file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter a video title');
      return;
    }
    
    if (!formData.file) {
      alert('Please select a video file');
      return;
    }

    setIsUploading(true);
    
    // Mock upload - in real app, this would upload to your storage service
    setTimeout(() => {
      onSubmit(formData);
      setIsUploading(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Upload Video</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Assignment Info */}
          <div className="bg-blue-50 rounded-xl p-4">
            <h3 className="font-bold text-blue-800 mb-1">Assignment: {assignmentTitle}</h3>
            <p className="text-sm text-blue-600">Assignment ID: {assignmentId}</p>
          </div>

          {/* Video Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter a descriptive title for your video..."
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none"
              required
            />
          </div>

          {/* Video Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what your video covers..."
              rows={3}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none resize-none"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video File *
            </label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              {formData.file ? (
                <div className="space-y-2">
                  <div className="text-4xl">📹</div>
                  <p className="font-bold text-gray-800">{formData.file.name}</p>
                  <p className="text-sm text-gray-600">
                    {(formData.file.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                  <button
                    type="button"
                    onClick={() => handleFileChange(null)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Remove File
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-4xl">📤</div>
                  <p className="font-bold text-gray-800">Drop your video here</p>
                  <p className="text-sm text-gray-600">or click to browse</p>
                  <p className="text-xs text-gray-500">Max file size: 100MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Privacy Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Privacy Settings
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  checked={formData.isPublic}
                  onChange={() => handleInputChange('isPublic', true)}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🌍</span>
                  <div>
                    <p className="font-medium text-gray-800">Public</p>
                    <p className="text-sm text-gray-600">Visible to all students and teachers</p>
                  </div>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  checked={!formData.isPublic}
                  onChange={() => handleInputChange('isPublic', false)}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🔒</span>
                  <div>
                    <p className="font-medium text-gray-800">Private</p>
                    <p className="text-sm text-gray-600">Only visible to you and your teacher</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                <div>
                  <p className="font-medium text-blue-800">Uploading video...</p>
                  <p className="text-sm text-blue-600">This may take a few minutes</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isUploading}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !formData.title.trim() || !formData.file}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Upload Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
