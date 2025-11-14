'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Assignment, AssignmentStatus, AssignmentType } from '@/types/dynamodb';
import AssignmentCreationForm from './AssignmentCreationForm';
import InstructorStats from './InstructorStats';
import InstructorSubmissionCard from './InstructorSubmissionCard';
import InstructorCommunityFeed from './InstructorCommunityFeed';
import AIGradingInterface from '@/components/ai/AIGradingInterface';
import PlagiarismChecker from '@/components/ai/PlagiarismChecker';
import { useAuth } from '@/contexts/AuthContext';
import { apiHelpers } from '@/lib/apiConfig';

interface InstructorDashboardProps {
  className?: string;
}

interface DashboardView {
  id: 'overview' | 'assignments' | 'submissions' | 'community' | 'ai-grading' | 'ai-tools';
  label: string;
  icon: string;
}

const InstructorDashboard: React.FC<InstructorDashboardProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<DashboardView['id']>('overview');
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [assignmentsError, setAssignmentsError] = useState<string | null>(null);

  const dashboardViews: DashboardView[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'assignments', label: 'Assignments', icon: '📝' },
    { id: 'submissions', label: 'Submissions', icon: '📤' },
    { id: 'community', label: 'Community', icon: '👥' },
    { id: 'ai-grading', label: 'AI Grading', icon: '🤖' },
    { id: 'ai-tools', label: 'AI Tools', icon: '🔧' }
  ];

  // Fetch assignments when component mounts or when assignments view is selected
  const fetchAssignments = useCallback(async () => {
    if (!user?.instructorId) return;
    
    setIsLoadingAssignments(true);
    setAssignmentsError(null);
    
    try {
      const response = await apiHelpers.getAssignments({
        instructorId: user.instructorId
      });
      
      if (response.success) {
        setAssignments(response.data || []);
      } else {
        setAssignmentsError(response.error || 'Failed to fetch assignments');
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setAssignmentsError('Failed to fetch assignments. Please try again.');
    } finally {
      setIsLoadingAssignments(false);
    }
  }, [user?.instructorId]);

  // Load assignments when component mounts
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Load assignments when assignments view is selected
  useEffect(() => {
    if (activeView === 'assignments') {
      fetchAssignments();
    }
  }, [activeView, fetchAssignments]);

  const handleCreateAssignment = useCallback(async (assignmentData: Partial<Assignment>) => {
    setIsCreatingAssignment(true);
    try {
      const response = await apiHelpers.createAssignment({
        ...assignmentData,
        instructorId: user?.instructorId,
        courseId: assignmentData.courseId || 'default-course' // You might want to get this from a course selection
      });
      
      if (response.success) {
        // Close form and refresh assignments list
        setShowAssignmentForm(false);
        await fetchAssignments();
        // TODO: Show success notification
      } else {
        throw new Error(response.error || 'Failed to create assignment');
      }
      
    } catch (error) {
      console.error('Failed to create assignment:', error);
      setAssignmentsError(error instanceof Error ? error.message : 'Failed to create assignment');
    } finally {
      setIsCreatingAssignment(false);
    }
  }, [user?.instructorId, fetchAssignments]);

  const handleCancelAssignment = useCallback(() => {
    setShowAssignmentForm(false);
  }, []);

  const renderOverview = () => (
    <div className="space-y-6">
      <InstructorStats />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">New submission received for "Essay Assignment"</span>
              <span className="text-xs text-gray-400 ml-auto">2 min ago</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Assignment "Quiz 3" published</span>
              <span className="text-xs text-gray-400 ml-auto">1 hour ago</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Grade submitted for "Project Report"</span>
              <span className="text-xs text-gray-400 ml-auto">3 hours ago</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => setShowAssignmentForm(true)}
              className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📝</span>
                <div>
                  <div className="font-medium text-blue-900">Create Assignment</div>
                  <div className="text-sm text-blue-700">Set up a new assignment for your students</div>
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => setActiveView('ai-tools')}
              className="w-full text-left p-3 bg-green-50 hover:bg-green-100 active:bg-green-200 rounded-lg transition-colors touch-manipulation"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📊</span>
                <div>
                  <div className="font-medium text-green-900">View Analytics</div>
                  <div className="text-sm text-green-700">Check student performance and engagement</div>
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => setActiveView('submissions')}
              className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 active:bg-purple-200 rounded-lg transition-colors touch-manipulation"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">👥</span>
                <div>
                  <div className="font-medium text-purple-900">Manage Students</div>
                  <div className="text-sm text-purple-700">Add, remove, or update student information</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAssignments = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Assignments</h2>
        <button
          onClick={() => setShowAssignmentForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Create Assignment</span>
        </button>
      </div>

      {/* Error State */}
      {assignmentsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800">{assignmentsError}</p>
            <button
              onClick={fetchAssignments}
              className="ml-auto text-red-600 hover:text-red-800 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoadingAssignments && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading assignments...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoadingAssignments && !assignmentsError && assignments.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
          <p className="text-gray-600 mb-4">Create your first assignment to get started.</p>
          <button
            onClick={() => setShowAssignmentForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Assignment
          </button>
        </div>
      )}

      {/* Assignments Grid */}
      {!isLoadingAssignments && !assignmentsError && assignments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => {
            const getStatusColor = (status: string) => {
              switch (status) {
                case 'published': return 'bg-green-100 text-green-800';
                case 'draft': return 'bg-yellow-100 text-yellow-800';
                case 'archived': return 'bg-gray-100 text-gray-800';
                default: return 'bg-gray-100 text-gray-800';
              }
            };

            const getBorderColor = (status: string) => {
              switch (status) {
                case 'published': return 'border-green-500';
                case 'draft': return 'border-yellow-500';
                case 'archived': return 'border-gray-500';
                default: return 'border-gray-500';
              }
            };

            const formatDate = (dateString?: string) => {
              if (!dateString) return 'No due date';
              return new Date(dateString).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });
            };

            return (
              <div key={assignment.assignmentId} className={`bg-white rounded-lg shadow p-6 border-l-4 ${getBorderColor(assignment.status || 'draft')}`}>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900 truncate">{assignment.title}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.status || 'draft')}`}>
                    {assignment.status || 'Draft'}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{assignment.description}</p>
                
                <div className="space-y-2 text-sm text-gray-500">
                  <div>Due: {formatDate(assignment.dueDate)}</div>
                  <div>Max Score: {assignment.maxScore || 100}</div>
                  <div>Type: {assignment.type || 'Assignment'}</div>
                  {assignment.submissionCount !== undefined && (
                    <div>Submissions: {assignment.submissionCount}</div>
                  )}
                </div>
                
                <div className="mt-4 flex space-x-2">
                  <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                    Edit
                  </button>
                  <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                    View
                  </button>
                  {assignment.status === 'draft' && (
                    <button className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors">
                      Publish
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderSubmissions = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Submissions</h2>
        <div className="flex space-x-2">
          <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Assignments</option>
            <option value="essay">Essay Assignment</option>
            <option value="project">Project Report</option>
            <option value="quiz">Quiz 3</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="graded">Graded</option>
            <option value="late">Late</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {/* Sample submissions - replace with real data */}
        <InstructorSubmissionCard
          submission={{
            id: 'sub1',
            studentId: 'student1',
            studentName: 'John Doe',
            studentEmail: 'john.doe@example.com',
            assignmentId: 'assign1',
            assignmentTitle: 'Essay Assignment',
            courseId: 'course1',
            courseName: 'Introduction to Technology',
            status: 'submitted',
            submittedAt: '2024-12-14T10:30:00Z',
            dueDate: '2024-12-15T23:59:00Z',
            isLate: false,
            maxScore: 100,
            priority: 'medium',
            reviewStatus: 'pending',
            tags: ['essay', 'technology'],
            files: [
              {
                name: 'essay.pdf',
                url: '#',
                type: 'application/pdf',
                size: 1024 * 1024,
                uploadedAt: '2024-12-14T10:30:00Z'
              }
            ],
            likes: [],
            comments: []
          }}
          onGrade={() => console.log('Grade submission')}
          onView={() => console.log('View submission')}
        />

        <InstructorSubmissionCard
          submission={{
            id: 'sub2',
            studentId: 'student2',
            studentName: 'Jane Smith',
            studentEmail: 'jane.smith@example.com',
            assignmentId: 'assign1',
            assignmentTitle: 'Essay Assignment',
            courseId: 'course1',
            courseName: 'Introduction to Technology',
            status: 'submitted',
            submittedAt: '2024-12-14T09:15:00Z',
            dueDate: '2024-12-15T23:59:00Z',
            isLate: false,
            maxScore: 100,
            priority: 'high',
            reviewStatus: 'in_progress',
            tags: ['essay', 'technology'],
            files: [
              {
                name: 'essay.docx',
                url: '#',
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                size: 2 * 1024 * 1024,
                uploadedAt: '2024-12-14T09:15:00Z'
              }
            ],
            likes: [],
            comments: []
          }}
          onGrade={() => console.log('Grade submission')}
          onView={() => console.log('View submission')}
        />
      </div>
    </div>
  );

  const renderAIGrading = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🤖 AI-Powered Essay Grading</h3>
        <p className="text-gray-600 mb-6">
          Use AI to automatically grade student essays with detailed feedback and rubric-based scoring.
        </p>
        <AIGradingInterface
          submissionId="sample-submission-123"
          assignmentId="sample-assignment-456"
          studentId="student-789"
          essay="This is a sample essay that would be graded by AI. The AI will analyze content, structure, grammar, and style to provide comprehensive feedback and scoring."
          onGradeComplete={(result) => {
            console.log('AI grading completed:', result);
          }}
        />
      </div>
    </div>
  );

  const renderAITools = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 AI Tools & Utilities</h3>
        <p className="text-gray-600 mb-6">
          Access powerful AI tools to enhance your teaching and streamline your workflow.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plagiarism Detection */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">🔍 Plagiarism Detection</h4>
            <p className="text-sm text-gray-600 mb-4">
              Check student submissions for originality and academic integrity.
            </p>
            <PlagiarismChecker
              submissionId="instructor-check-123"
              assignmentId="assignment-456"
              text="Enter student text to check for plagiarism..."
              onCheckComplete={(result) => {
                console.log('Plagiarism check completed:', result);
              }}
            />
          </div>

          {/* AI Recommendations */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">💡 Smart Recommendations</h4>
            <p className="text-sm text-gray-600 mb-4">
              Get AI-powered suggestions for content, study groups, and resources.
            </p>
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
              Get Recommendations
            </button>
          </div>

          {/* Predictive Analytics */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">📊 Predictive Analytics</h4>
            <p className="text-sm text-gray-600 mb-4">
              Analyze student performance and predict success outcomes.
            </p>
            <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
              View Analytics
            </button>
          </div>

          {/* AI Transcription */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">🎤 AI Transcription</h4>
            <p className="text-sm text-gray-600 mb-4">
              Convert video submissions to text for easier review and analysis.
            </p>
            <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
              Transcribe Videos
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return renderOverview();
      case 'assignments':
        return renderAssignments();
      case 'submissions':
        return renderSubmissions();
      case 'community':
        return <InstructorCommunityFeed />;
      case 'ai-grading':
        return renderAIGrading();
      case 'ai-tools':
        return renderAITools();
      default:
        return renderOverview();
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
              <p className="text-gray-600">Manage your courses, assignments, and student submissions</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">
                🔔
              </button>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                I
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-2 sm:space-x-8 overflow-x-auto">
            {dashboardViews.map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`py-4 px-2 sm:px-1 border-b-2 font-medium text-sm transition-colors touch-manipulation whitespace-nowrap ${
                  activeView === view.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-1 sm:mr-2">{view.icon}</span>
                <span className="hidden sm:inline">{view.label}</span>
                <span className="sm:hidden">{view.label.split(' ')[0]}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>

      {/* Assignment Creation Modal */}
      {showAssignmentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <AssignmentCreationForm
              onSubmit={handleCreateAssignment}
              onCancel={handleCancelAssignment}
              isLoading={isCreatingAssignment}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorDashboard;
