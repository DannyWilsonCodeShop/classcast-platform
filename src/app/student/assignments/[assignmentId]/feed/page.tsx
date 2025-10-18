'use client';

import React, { useState, useEffect } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { getYouTubeVideoId, getYouTubeEmbedUrl } from '@/lib/youtube';

interface VideoSubmission {
  submissionId: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  studentAvatar?: string;
  videoUrl: string;
  videoTitle: string;
  submittedAt: string;
  likes?: number;
  commentCount?: number;
}

interface AssignmentDetails {
  assignmentId: string;
  title: string;
  description: string;
  dueDate: string;
  courseId: string;
  courseName?: string;
  courseInitials?: string;
}

const AssignmentFeedPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const assignmentId = params?.assignmentId as string;

  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<AssignmentDetails | null>(null);
  const [videos, setVideos] = useState<VideoSubmission[]>([]);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentFeed();
    }
  }, [assignmentId]);

  const fetchAssignmentFeed = async () => {
    try {
      // Fetch assignment details
      const assignmentRes = await fetch(`/api/assignments/${assignmentId}`);
      const assignmentData = await assignmentRes.json();

      if (assignmentData.success) {
        setAssignment(assignmentData.assignment);
      }

      // Fetch video submissions for this assignment
      const videosRes = await fetch(`/api/video-submissions?assignmentId=${assignmentId}`);
      const videosData = await videosRes.json();

      if (videosData.success) {
        // Sort by most recent first
        const sorted = (videosData.submissions || []).sort((a: VideoSubmission, b: VideoSubmission) => 
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );
        setVideos(sorted);
      }
    } catch (error) {
      console.error('Error fetching assignment feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <StudentRoute>
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Top Bar */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Back</span>
            </button>

            {/* Assignment Title */}
            <div className="flex-1 text-center">
              <h1 className="text-sm font-semibold text-gray-900 truncate">
                {assignment?.title || 'Assignment'}
              </h1>
              {assignment?.courseInitials && (
                <span className="text-xs text-gray-500">{assignment.courseInitials}</span>
              )}
            </div>

            {/* School Logo */}
            <div className="w-8 h-8 flex-shrink-0">
              <Image
                src="/CRAJSmallLogo.png"
                alt="Cristo Rey Atlanta"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

        </div>

        {/* Assignment Details & Recording Options */}
        <div className="max-w-2xl mx-auto">
          {assignment && (
            <div className="bg-white border-b border-gray-200">
              {/* Assignment Details */}
              <div className="px-4 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-2">{assignment.title}</h2>
                <p className="text-sm text-gray-700 mb-3">{assignment.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm">
                    {assignment.dueDate && (
                      <div className="flex items-center space-x-1 text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1 text-blue-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">{videos.length} {videos.length === 1 ? 'submission' : 'submissions'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recording Options */}
              <div className="px-4 py-4 bg-gradient-to-b from-blue-50 to-white">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">📹 Submit Your Video</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => router.push(`/student/video-submission?assignmentId=${assignmentId}&mode=record`)}
                    className="flex flex-col items-center p-4 bg-white border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                  >
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mb-2">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="8" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Record Now</span>
                    <span className="text-xs text-gray-500">Live recording</span>
                  </button>
                  <button
                    onClick={() => router.push(`/student/video-submission?assignmentId=${assignmentId}&mode=upload`)}
                    className="flex flex-col items-center p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                  >
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-2">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Upload File</span>
                    <span className="text-xs text-gray-500">Pre-recorded</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Student Submissions Header */}
          {!loading && videos.length > 0 && (
            <div className="bg-white border-b border-gray-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                🎬 Student Submissions
              </h3>
            </div>
          )}
        </div>

        {/* Video Feed */}
        <div className="max-w-2xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-8 px-4 bg-white">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-500">No submissions yet. Be the first to submit!</p>
            </div>
          ) : (
            <div className="space-y-0">
              {videos.map((video) => (
                <VideoSubmissionCard key={video.submissionId} video={video} formatTimestamp={formatTimestamp} />
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentRoute>
  );
};

// Video Submission Card Component
const VideoSubmissionCard: React.FC<{ video: VideoSubmission; formatTimestamp: (timestamp: string) => string }> = ({ video, formatTimestamp }) => {
  const [imageError, setImageError] = React.useState(false);
  const videoId = getYouTubeVideoId(video.videoUrl);
  const isYouTube = !!videoId;
  
  // Check if avatar is emoji
  const isEmoji = video.studentAvatar && video.studentAvatar.length <= 4 && !video.studentAvatar.startsWith('http');
  const hasValidAvatar = video.studentAvatar && !video.studentAvatar.includes('placeholder') && !imageError;

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
            {isEmoji ? (
              <span className="text-2xl">{video.studentAvatar}</span>
            ) : hasValidAvatar ? (
              <Image
                src={video.studentAvatar}
                alt={`${video.studentFirstName} ${video.studentLastName}`}
                width={40}
                height={40}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-gray-600 font-semibold text-sm">
                {video.studentFirstName[0]}{video.studentLastName[0]}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">
              {video.studentFirstName} {video.studentLastName}
            </p>
            <p className="text-xs text-gray-500">{formatTimestamp(video.submittedAt)}</p>
          </div>
        </div>
      </div>

      {/* Video Player - Mobile Optimized */}
      <div className="relative w-full bg-black" style={{ aspectRatio: '16/9' }}>
        {isYouTube ? (
          <iframe
            src={getYouTubeEmbedUrl(video.videoUrl)}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            src={video.videoUrl}
            controls
            className="w-full h-full object-contain"
            playsInline
          />
        )}
      </div>

      {/* Title & Actions */}
      <div className="px-4 py-3">
        <p className="font-medium text-gray-900 mb-2">{video.videoTitle}</p>
        <div className="flex items-center space-x-4 text-gray-600">
          <button className="flex items-center space-x-1 hover:text-red-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-sm">{video.likes || 0}</span>
          </button>
          <div className="flex items-center space-x-1 text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm">{video.commentCount || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentFeedPage;

