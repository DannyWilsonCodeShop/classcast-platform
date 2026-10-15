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
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    <svg className="w-3/4 h-3/4 text-gray-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z" />
                    </svg>
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

    </div>
  );
};
