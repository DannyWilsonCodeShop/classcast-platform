'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PeerSubmissionCard } from './PeerSubmissionCard';
import { SearchBar } from '../common/SearchBar';
import { FilterDropdown } from '../common/FilterDropdown';
import { Pagination } from '../common/Pagination';

// Types for peer submission data
export interface PeerSubmissionData {
  submissionId: string;
  studentId: string;
  studentName: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseName: string;
  status: 'submitted' | 'graded' | 'late' | 'returned';
  submittedAt: string;
  processedAt?: string;
  sharedAt?: string;
  grade?: number;
  maxScore?: number;
  feedback?: string;
  videoDuration?: number;
  videoResolution?: {
    width: number;
    height: number;
  };
  processingDuration?: number;
  files: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: string;
  }>;
  likes: Array<{
    userId: string;
    userName: string;
    createdAt: string;
  }>;
  comments: Array<{
    id: string;
    text: string;
    authorId: string;
    authorName: string;
    createdAt: string;
    isEdited?: boolean;
  }>;
  peerReviews?: Array<{
    reviewerId: string;
    reviewerName: string;
    score: number;
    maxScore: number;
    feedback: string;
    submittedAt: string;
  }>;
}

export interface StudentCommunityFeedProps {
  currentUserId?: string;
  className?: string;
}

// TODO: Replace with actual API data
const mockPeerSubmissions: PeerSubmissionData[] = [];

export const StudentCommunityFeed: React.FC<StudentCommunityFeedProps> = ({
  currentUserId,
  className = '',
}) => {
  const [submissions, setSubmissions] = useState<PeerSubmissionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredSubmissions, setFilteredSubmissions] = useState<PeerSubmissionData[]>([]);

  // Load submissions data
  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        setIsLoading(true);
        
        // TODO: Replace with actual API call
        // const response = await fetch('/api/student/community/submissions');
        // const data = await response.json();
        
        // For now, set empty array until API is implemented
        setSubmissions([]);
        
      } catch (error) {
        console.error('Error loading submissions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubmissions();
  }, [currentUserId]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [isLoading, setIsLoading] = useState(false);

  // Filter and sort submissions
  const processedSubmissions = useMemo(() => {
    let filtered = [...submissions];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(submission =>
        submission.assignmentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.courseName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(submission => submission.status === statusFilter);
    }

    // Apply course filter
    if (courseFilter !== 'all') {
      filtered = filtered.filter(submission => submission.courseId === courseFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        case 'oldest':
          return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        case 'grade':
          if (a.grade && b.grade) {
            return b.grade - a.grade;
          }
          return 0;
        case 'likes':
          return b.likes.length - a.likes.length;
        case 'comments':
          return b.comments.length - a.comments.length;
        default:
          return 0;
      }
    });

    return filtered;
  }, [submissions, searchQuery, statusFilter, courseFilter, sortBy]);

  // Paginate results
  const paginatedSubmissions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedSubmissions.slice(startIndex, startIndex + itemsPerPage);
  }, [processedSubmissions, currentPage, itemsPerPage]);

  // Get unique courses for filter
  const uniqueCourses = useMemo(() => {
    const courses = submissions.map(sub => ({ id: sub.courseId, name: sub.courseName }));
    return Array.from(new Map(courses.map(course => [course.id, course])).values());
  }, [submissions]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  // Handle status filter
  const handleStatusFilter = useCallback((status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  }, []);

  // Handle course filter
  const handleCourseFilter = useCallback((courseId: string) => {
    setCourseFilter(courseId);
    setCurrentPage(1);
  }, []);

  // Handle sorting
  const handleSort = useCallback((sortOption: string) => {
    setSortBy(sortOption);
    setCurrentPage(1);
  }, []);

  // Handle like
  const handleLike = useCallback(async (submissionId: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSubmissions(prev => prev.map(sub => {
        if (sub.submissionId === submissionId) {
          const isLiked = sub.likes.some(like => like.userId === currentUserId);
          if (isLiked) {
            return {
              ...sub,
              likes: sub.likes.filter(like => like.userId !== currentUserId)
            };
          } else {
            return {
              ...sub,
              likes: [...sub.likes, {
                userId: currentUserId || 'anonymous',
                userName: 'You',
                createdAt: new Date().toISOString()
              }]
            };
          }
        }
        return sub;
      }));
    } catch (error) {
      console.error('Failed to like submission:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  // Handle comment
  const handleComment = useCallback(async (submissionId: string, commentText: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newComment = {
        id: `comment-${Date.now()}`,
        text: commentText,
        authorId: currentUserId || 'anonymous',
        authorName: 'You',
        createdAt: new Date().toISOString()
      };

      setSubmissions(prev => prev.map(sub => {
        if (sub.submissionId === submissionId) {
          return {
            ...sub,
            comments: [...sub.comments, newComment]
          };
        }
        return sub;
      }));
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setCourseFilter('all');
    setSortBy('recent');
    setCurrentPage(1);
  }, []);

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Peer Submissions Feed</h1>
        <p className="text-gray-600">
          Explore and interact with your classmates' work. Learn from each other and build a collaborative learning community.
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <SearchBar
              placeholder="Search assignments, students, or courses..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full"
            />
          </div>

          {/* Status Filter */}
          <FilterDropdown
            label="Status"
            value={statusFilter}
            onChange={handleStatusFilter}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'submitted', label: 'Submitted' },
              { value: 'graded', label: 'Graded' },
              { value: 'late', label: 'Late' },
              { value: 'returned', label: 'Returned' }
            ]}
          />

          {/* Course Filter */}
          <FilterDropdown
            label="Course"
            value={courseFilter}
            onChange={handleCourseFilter}
            options={[
              { value: 'all', label: 'All Courses' },
              ...uniqueCourses.map(course => ({
                value: course.id,
                label: course.name
              }))
            ]}
          />
        </div>

        {/* Additional Controls */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <FilterDropdown
              label="Sort by"
              value={sortBy}
              onChange={handleSort}
              options={[
                { value: 'recent', label: 'Most Recent' },
                { value: 'oldest', label: 'Oldest First' },
                { value: 'grade', label: 'Highest Grade' },
                { value: 'likes', label: 'Most Liked' },
                { value: 'comments', label: 'Most Commented' }
              ]}
            />

            <button
              onClick={handleResetFilters}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              Reset Filters
            </button>
          </div>

          <div className="text-sm text-gray-500">
            {processedSubmissions.length} submission{processedSubmissions.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Submissions Grid */}
      {!isLoading && (
        <>
          {paginatedSubmissions.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {paginatedSubmissions.map((submission) => (
                <PeerSubmissionCard
                  key={submission.submissionId}
                  submission={submission}
                  onLike={handleLike}
                  onComment={handleComment}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or filters to find what you're looking for.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {processedSubmissions.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(processedSubmissions.length / itemsPerPage)}
              onPageChange={handlePageChange}
              className="mt-8"
            />
          )}
        </>
      )}

      {/* Community Guidelines */}
      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Community Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">Be Respectful</h4>
            <p>Provide constructive feedback and maintain a positive learning environment.</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Learn Together</h4>
            <p>Share insights, ask questions, and help each other grow academically.</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Give Credit</h4>
            <p>Always acknowledge sources and respect intellectual property.</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Stay On Topic</h4>
            <p>Keep discussions relevant to the course material and assignments.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
