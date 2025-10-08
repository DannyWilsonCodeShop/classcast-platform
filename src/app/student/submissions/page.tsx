'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface VideoSubmission {
  id: string;
  url: string;
  blobUrl?: string;
  fileName: string;
  uploadedAt: string;
  userId: string;
  assignmentId: string;
  size: number;
  type: string;
}

const StudentSubmissionsPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<VideoSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoSubmission | null>(null);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = () => {
    try {
      // Try localStorage first, then sessionStorage as fallback
      let storedVideos = localStorage.getItem('uploadedVideos');
      if (!storedVideos) {
        storedVideos = sessionStorage.getItem('uploadedVideos');
      }
      
      if (storedVideos) {
        const videos = JSON.parse(storedVideos);
        setSubmissions(videos);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const deleteSubmission = (id: string) => {
    if (confirm('Are you sure you want to delete this video submission?')) {
      const updatedSubmissions = submissions.filter(sub => sub.id !== id);
      setSubmissions(updatedSubmissions);
      
      // Update both localStorage and sessionStorage
      try {
        localStorage.setItem('uploadedVideos', JSON.stringify(updatedSubmissions));
      } catch (error) {
        console.warn('localStorage full, using sessionStorage');
        sessionStorage.setItem('uploadedVideos', JSON.stringify(updatedSubmissions));
      }
      
      // Also delete from IndexedDB
      deleteVideoFromIndexedDB(id);
    }
  };

  const deleteVideoFromIndexedDB = async (videoId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('VideoStorage', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['videos'], 'readwrite');
        const store = transaction.objectStore('videos');
        const deleteRequest = store.delete(videoId);
        
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      };
    });
  };

  if (loading) {
    return (
      <StudentRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
          <LoadingSpinner />
        </div>
      </StudentRoute>
    );
  }

  return (
    <StudentRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 px-4 py-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/student/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <span className="text-xl">&lt;</span>
            </button>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              🎥
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900">
                My Video Submissions
              </h1>
              <p className="text-xs text-gray-600">
                View and manage your video submissions
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <img
                src="/MyClassCast (800 x 200 px).png"
                alt="MyClassCast"
                className="h-6 w-auto object-contain"
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            {submissions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📹</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Video Submissions</h3>
                <p className="text-gray-600 mb-6">
                  You haven't submitted any videos yet. Start by recording a video assignment.
                </p>
                <button
                  onClick={() => router.push('/student/video-submission')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                >
                  Record New Video
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Video Submissions ({submissions.length})
                  </h2>
                  <button
                    onClick={() => router.push('/student/video-submission')}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                  >
                    + New Video
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-200/30 hover:shadow-xl transition-all duration-300"
                    >
                      <div className="aspect-video w-full mb-4 bg-black rounded-lg overflow-hidden">
                        <video
                          src={submission.blobUrl || submission.url}
                          controls
                          className="w-full h-full object-cover"
                          onError={() => {
                            // Fallback to data URL if blob URL fails
                            const video = document.querySelector(`video[src="${submission.blobUrl || submission.url}"]`) as HTMLVideoElement;
                            if (video && submission.url !== submission.blobUrl) {
                              video.src = submission.url;
                            }
                          }}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {submission.fileName}
                        </h3>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>📅 {formatDate(submission.uploadedAt)}</p>
                          <p>📁 {formatFileSize(submission.size)}</p>
                          <p>🎬 {submission.type}</p>
                        </div>

                        <div className="flex space-x-2 pt-2">
                          <button
                            onClick={() => setSelectedVideo(submission)}
                            className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => deleteSubmission(submission.id)}
                            className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Video Detail Modal */}
        {selectedVideo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Video Details</h2>
                  <button
                    onClick={() => setSelectedVideo(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                    <video
                      src={selectedVideo.blobUrl || selectedVideo.url}
                      controls
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">File Information</h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p><strong>Name:</strong> {selectedVideo.fileName}</p>
                        <p><strong>Size:</strong> {formatFileSize(selectedVideo.size)}</p>
                        <p><strong>Type:</strong> {selectedVideo.type}</p>
                        <p><strong>Uploaded:</strong> {formatDate(selectedVideo.uploadedAt)}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Assignment Details</h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p><strong>Assignment ID:</strong> {selectedVideo.assignmentId}</p>
                        <p><strong>User ID:</strong> {selectedVideo.userId}</p>
                        <p><strong>Submission ID:</strong> {selectedVideo.id}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentRoute>
  );
};

export default StudentSubmissionsPage;
