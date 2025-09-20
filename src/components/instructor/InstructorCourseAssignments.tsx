'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Assignment {
  assignmentId: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
  status: 'draft' | 'published' | 'grading' | 'completed';
  submissionType: 'text' | 'file' | 'video';
  submissionsCount: number;
  gradedCount: number;
  averageGrade?: number;
  createdAt: string;
}

interface InstructorCourseAssignmentsProps {
  courseId: string;
  assignments: Assignment[];
  onAssignmentUpdate: (assignmentId: string, updateData: Partial<Assignment>) => Promise<{ success: boolean; message: string }>;
  onAssignmentCreate: () => void;
}

export const InstructorCourseAssignments: React.FC<InstructorCourseAssignmentsProps> = ({ 
  courseId, 
  assignments, 
  onAssignmentUpdate,
  onAssignmentCreate 
}) => {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'grading' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'title' | 'points' | 'createdAt'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [editingAssignment, setEditingAssignment] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Assignment>>({});

  const filteredAssignments = assignments.filter(assignment => {
    return filter === 'all' || assignment.status === filter;
  });

  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'dueDate':
        comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'points':
        comparison = a.points - b.points;
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'published':
        return 'bg-blue-100 text-blue-800';
      case 'grading':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'published':
        return 'Published';
      case 'grading':
        return 'Grading';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const handleEdit = (assignment: Assignment) => {
    setEditData({
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate,
      points: assignment.points,
      submissionType: assignment.submissionType,
    });
    setEditingAssignment(assignment.assignmentId);
  };

  const handleSave = async (assignmentId: string) => {
    try {
      const result = await onAssignmentUpdate(assignmentId, editData);
      if (result.success) {
        setEditingAssignment(null);
        setEditData({});
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Failed to update assignment');
    }
  };

  const handleCancel = () => {
    setEditingAssignment(null);
    setEditData({});
  };

  const handleGradeSubmissions = (assignmentId: string) => {
    // Navigate to grading interface with assignment filter
    router.push(`/instructor/grading/bulk?assignment=${assignmentId}&course=${courseId}`);
  };

  const handleStatusChange = async (assignmentId: string, newStatus: Assignment['status']) => {
    try {
      const result = await onAssignmentUpdate(assignmentId, { status: newStatus });
      if (!result.success) {
        alert(result.message);
      }
    } catch (error) {
      alert('Failed to update assignment status');
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && status !== 'completed';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Course Assignments</h2>
          <p className="text-gray-600">Manage assignments for this course</p>
        </div>
        <button
          onClick={onAssignmentCreate}
          className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-blue-500 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300"
        >
          + Create Assignment
        </button>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Assignments</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="grading">Grading</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="dueDate">Due Date</option>
            <option value="title">Title</option>
            <option value="points">Points</option>
            <option value="createdAt">Created Date</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Assignments List */}
      {sortedAssignments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Assignments Found</h3>
          <p className="text-gray-600 mb-6">
            {filter === 'all' 
              ? 'No assignments have been created yet.' 
              : `No ${filter} assignments found.`
            }
          </p>
          <button
            onClick={onAssignmentCreate}
            className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-blue-500 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300"
          >
            Create Your First Assignment
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedAssignments.map((assignment) => (
            <div
              key={assignment.assignmentId}
              className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                isOverdue(assignment.dueDate, assignment.status)
                  ? 'border-red-200 bg-red-50/50'
                  : 'border-gray-200/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {editingAssignment === assignment.assignmentId ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                        <input
                          type="text"
                          value={editData.title || assignment.title}
                          onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          value={editData.description || assignment.description}
                          onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                          <input
                            type="datetime-local"
                            value={editData.dueDate || assignment.dueDate}
                            onChange={(e) => setEditData(prev => ({ ...prev, dueDate: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Points</label>
                          <input
                            type="number"
                            value={editData.points || assignment.points}
                            onChange={(e) => setEditData(prev => ({ ...prev, points: parseInt(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSave(assignment.assignmentId)}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{assignment.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(assignment.status)}`}>
                          {getStatusText(assignment.status)}
                        </span>
                        {isOverdue(assignment.dueDate, assignment.status) && (
                          <span className="px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800">
                            Overdue
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">{assignment.description}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                        <div className="flex items-center space-x-1">
                          <span>📅</span>
                          <span>Due {new Date(assignment.dueDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>⭐</span>
                          <span>{assignment.points} points</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>📄</span>
                          <span className="capitalize">{assignment.submissionType}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>👥</span>
                          <span>{assignment.submissionsCount} submissions</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>✅</span>
                          <span>{assignment.gradedCount} graded</span>
                        </div>
                      </div>

                      {assignment.averageGrade !== undefined && (
                        <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-green-800">Average Grade: {assignment.averageGrade.toFixed(1)}%</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {editingAssignment !== assignment.assignmentId && (
                  <div className="flex items-center space-x-2 ml-4">
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleEdit(assignment)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition-colors"
                      >
                        Edit
                      </button>
                      
                      {assignment.status === 'draft' && (
                        <button
                          onClick={() => handleStatusChange(assignment.assignmentId, 'published')}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm hover:bg-green-200 transition-colors"
                        >
                          Publish
                        </button>
                      )}
                      
                      {assignment.status === 'published' && (
                        <button
                          onClick={() => handleStatusChange(assignment.assignmentId, 'grading')}
                          className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-md text-sm hover:bg-yellow-200 transition-colors"
                        >
                          Start Grading
                        </button>
                      )}
                      
                      {assignment.status === 'grading' && (
                        <button
                          onClick={() => handleStatusChange(assignment.assignmentId, 'completed')}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md text-sm hover:bg-purple-200 transition-colors"
                        >
                          Complete
                        </button>
                      )}
                      
                      {/* Grade Submissions Button - Show for assignments with submissions */}
                      {assignment.submissionsCount > 0 && (
                        <button
                          onClick={() => handleGradeSubmissions(assignment.assignmentId)}
                          className="px-3 py-1 bg-orange-100 text-orange-700 rounded-md text-sm hover:bg-orange-200 transition-colors"
                        >
                          Grade Submissions ({assignment.submissionsCount - assignment.gradedCount} pending)
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assignment Stats */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-200/30">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Assignment Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{assignments.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-500">
              {assignments.filter(a => a.status === 'draft').length}
            </div>
            <div className="text-sm text-gray-600">Draft</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">
              {assignments.filter(a => a.status === 'published').length}
            </div>
            <div className="text-sm text-gray-600">Published</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">
              {assignments.filter(a => a.status === 'grading').length}
            </div>
            <div className="text-sm text-gray-600">Grading</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500">
              {assignments.filter(a => a.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
};
