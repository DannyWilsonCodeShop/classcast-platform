'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Assignment } from '@/types/assignment';

interface CourseAssignmentsProps {
  courseId: string;
  assignments: Assignment[];
  onAssignmentUpdate: () => void;
}

export const CourseAssignments: React.FC<CourseAssignmentsProps> = ({ 
  courseId, 
  assignments, 
  onAssignmentUpdate 
}) => {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'submitted' | 'graded'>('upcoming');
  const [sortBy, setSortBy] = useState<'dueDate' | 'title' | 'points'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredAssignments = assignments.filter(assignment => {
    switch (filter) {
      case 'upcoming':
        return assignment.status === 'not-started' || assignment.status === 'in-progress';
      case 'submitted':
        return assignment.status === 'submitted';
      case 'graded':
        return assignment.status === 'graded';
      default:
        return true;
    }
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
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not-started':
        return 'bg-gray-100 text-gray-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'graded':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'not-started':
        return 'Not Started';
      case 'in-progress':
        return 'In Progress';
      case 'submitted':
        return 'Submitted';
      case 'graded':
        return 'Graded';
      default:
        return status;
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && status !== 'submitted' && status !== 'graded';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Video Assignments</h2>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All Assignments</option>
            <option value="upcoming">Upcoming</option>
            <option value="submitted">Submitted</option>
            <option value="graded">Graded</option>
          </select>
        </div>
      </div>

      {/* Sort Controls */}
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
        </select>
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      {/* Assignments List */}
      {sortedAssignments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Assignments Found</h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'No assignments have been posted yet.' 
              : `No ${filter} assignments found.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedAssignments.map((assignment) => (
            <div
              key={assignment.assignmentId}
              onClick={() => router.push(`/student/assignments/${assignment.assignmentId}`)}
              className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 transition-all duration-300 hover:shadow-xl cursor-pointer hover:scale-105 ${
                isOverdue(assignment.dueDate, assignment.status)
                  ? 'border-red-200 bg-red-50/50'
                  : 'border-gray-200/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
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
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Instructions:</h4>
                    <p className="text-gray-600 line-clamp-3">{assignment.description}</p>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
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
                  </div>

                  {assignment.grade !== undefined && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-green-800">Grade: {assignment.grade}%</span>
                        <span className="text-sm text-green-600">
                          {assignment.feedback ? 'Feedback available' : 'No feedback'}
                        </span>
                      </div>
                      {assignment.feedback && (
                        <p className="mt-2 text-sm text-green-700">{assignment.feedback}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {assignment.status === 'not-started' || assignment.status === 'in-progress' ? (
                    <button className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300">
                      {assignment.status === 'not-started' ? 'Start Assignment' : 'Continue'}
                    </button>
                  ) : assignment.status === 'submitted' ? (
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold cursor-not-allowed">
                      Submitted
                    </button>
                  ) : (
                    <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold">
                      View Grade
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assignment Stats */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-200/30">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Assignment Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">
              {assignments.filter(a => a.status === 'not-started' || a.status === 'in-progress').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">
              {assignments.filter(a => a.status === 'submitted').length}
            </div>
            <div className="text-sm text-gray-600">Submitted</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">
              {assignments.filter(a => a.status === 'graded').length}
            </div>
            <div className="text-sm text-gray-600">Graded</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500">
              {assignments.filter(a => a.grade !== undefined).length > 0 
                ? (assignments.filter(a => a.grade !== undefined).reduce((sum, a) => sum + (a.grade || 0), 0) / assignments.filter(a => a.grade !== undefined).length).toFixed(1)
                : '0'
              }%
            </div>
            <div className="text-sm text-gray-600">Average Video Assignment Grade</div>
          </div>
        </div>
      </div>
    </div>
  );
};
