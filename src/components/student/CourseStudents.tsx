'use client';

import React, { useState } from 'react';

interface Student {
  studentId: string;
  name: string;
  email: string;
  avatar?: string;
  enrollmentDate: string;
  status: 'active' | 'dropped' | 'completed';
  grade?: string;
}

interface Course {
  courseId: string;
  courseName: string;
  courseCode: string;
  enrollmentCount: number;
  maxEnrollment?: number;
}

interface CourseStudentsProps {
  students: Student[];
  course: Course;
}

export const CourseStudents: React.FC<CourseStudentsProps> = ({ students, course }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'enrollmentDate' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'enrollmentDate':
        comparison = new Date(a.enrollmentDate).getTime() - new Date(b.enrollmentDate).getTime();
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'dropped':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'dropped':
        return 'Dropped';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const activeStudents = students.filter(s => s.status === 'active').length;
  const completedStudents = students.filter(s => s.status === 'completed').length;
  const droppedStudents = students.filter(s => s.status === 'dropped').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Classmates</h2>
          <p className="text-gray-600">
            {activeStudents} active students in {course.courseName}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-green-200/30">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500 mb-2">{activeStudents}</div>
            <div className="text-gray-600 font-medium">Active Students</div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-blue-200/30">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-500 mb-2">{completedStudents}</div>
            <div className="text-gray-600 font-medium">Completed</div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-red-200/30">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-500 mb-2">{droppedStudents}</div>
            <div className="text-gray-600 font-medium">Dropped</div>
          </div>
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
          <option value="name">Name</option>
          <option value="enrollmentDate">Enrollment Date</option>
          <option value="status">Status</option>
        </select>
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      {/* Students List */}
      {sortedStudents.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Students Found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'No students match your search criteria.' : 'No students are enrolled in this course.'}
          </p>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-200/30">
          <div className="space-y-4">
            {sortedStudents.map((student) => (
              <div
                key={student.studentId}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{student.name}</h3>
                    <p className="text-sm text-gray-600">{student.email}</p>
                    <p className="text-xs text-gray-500">
                      Enrolled {new Date(student.enrollmentDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {student.grade && (
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">Grade: {student.grade}</p>
                    </div>
                  )}
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(student.status)}`}>
                    {getStatusText(student.status)}
                  </span>
                  <button className="text-gray-500 hover:text-gray-700 transition-colors">
                    <span className="text-xl">💬</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Enrollment Info */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-200/30">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Course Enrollment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Enrollment Capacity</h4>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-purple-500 h-3 rounded-full"
                  style={{ 
                    width: `${course.maxEnrollment 
                      ? (activeStudents / course.maxEnrollment) * 100 
                      : 0
                    }%` 
                  }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-600">
                {activeStudents}{course.maxEnrollment ? `/${course.maxEnrollment}` : ''}
              </span>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Enrollment Status</h4>
            <p className="text-sm text-gray-600">
              {course.maxEnrollment && activeStudents >= course.maxEnrollment
                ? 'Course is full'
                : course.maxEnrollment
                ? `${course.maxEnrollment - activeStudents} spots remaining`
                : 'No enrollment limit'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
