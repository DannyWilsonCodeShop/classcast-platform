'use client';

import React, { useState } from 'react';

interface Student {
  studentId: string;
  name: string;
  email: string;
  avatar?: string;
  enrollmentDate: string;
  status: 'active' | 'dropped' | 'completed';
  currentGrade?: number;
  assignmentsSubmitted: number;
  assignmentsTotal: number;
  lastActivity: string;
}

interface Course {
  courseId: string;
  courseName: string;
  courseCode: string;
  enrollmentCount: number;
  maxEnrollment?: number;
}

interface InstructorCourseStudentsProps {
  students: Student[];
  course: Course;
  onStudentUpdate: () => void;
}

export const InstructorCourseStudents: React.FC<InstructorCourseStudentsProps> = ({ 
  students, 
  course, 
  onStudentUpdate 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'enrollmentDate' | 'status' | 'currentGrade' | 'lastActivity'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filter, setFilter] = useState<'all' | 'active' | 'dropped' | 'completed'>('all');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const filteredStudents = students.filter(student => {
    const matchesFilter = filter === 'all' || student.status === filter;
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

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
      case 'currentGrade':
        comparison = (a.currentGrade || 0) - (b.currentGrade || 0);
        break;
      case 'lastActivity':
        comparison = new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime();
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

  const getGradeColor = (grade?: number) => {
    if (grade === undefined) return 'text-gray-500';
    if (grade >= 90) return 'text-green-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.studentId));
    }
  };

  const handleBulkAction = async (action: 'activate' | 'drop' | 'complete' | 'message') => {
    if (selectedStudents.length === 0) return;
    
    // In a real implementation, this would make API calls
    console.log(`Bulk action: ${action} for students:`, selectedStudents);
    setSelectedStudents([]);
    onStudentUpdate();
  };

  const activeStudents = students.filter(s => s.status === 'active').length;
  const completedStudents = students.filter(s => s.status === 'completed').length;
  const droppedStudents = students.filter(s => s.status === 'dropped').length;
  const averageGrade = students
    .filter(s => s.currentGrade !== undefined)
    .reduce((sum, s) => sum + (s.currentGrade || 0), 0) / students.filter(s => s.currentGrade !== undefined).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Course Students</h2>
          <p className="text-gray-600">
            Manage {activeStudents} active students in {course.courseName}
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-purple-200/30">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-500 mb-2">
              {averageGrade ? averageGrade.toFixed(1) : 'N/A'}%
            </div>
            <div className="text-gray-600 font-medium">Average Grade</div>
          </div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Students</option>
            <option value="active">Active</option>
            <option value="dropped">Dropped</option>
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
            <option value="name">Name</option>
            <option value="enrollmentDate">Enrollment Date</option>
            <option value="status">Status</option>
            <option value="currentGrade">Grade</option>
            <option value="lastActivity">Last Activity</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedStudents.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">
              {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('message')}
                className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
              >
                Send Message
              </button>
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition-colors"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('drop')}
                className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
              >
                Drop
              </button>
              <button
                onClick={() => setSelectedStudents([])}
                className="px-3 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

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
            {/* Header Row */}
            <div className="flex items-center p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3 flex-1">
                <input
                  type="checkbox"
                  checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="font-semibold text-gray-700">Select All</span>
              </div>
              <div className="grid grid-cols-5 gap-4 flex-1 text-sm font-semibold text-gray-700">
                <div>Student</div>
                <div>Status</div>
                <div>Grade</div>
                <div>Progress</div>
                <div>Last Activity</div>
              </div>
              <div className="w-20"></div>
            </div>

            {sortedStudents.map((student) => (
              <div
                key={student.studentId}
                className="flex items-center p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.studentId)}
                    onChange={() => handleSelectStudent(student.studentId)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{student.name}</h3>
                    <p className="text-sm text-gray-600">{student.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-5 gap-4 flex-1 text-sm">
                  <div></div>
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(student.status)}`}>
                      {getStatusText(student.status)}
                    </span>
                  </div>
                  <div>
                    <span className={`font-semibold ${getGradeColor(student.currentGrade)}`}>
                      {student.currentGrade !== undefined ? `${student.currentGrade}%` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full"
                          style={{ 
                            width: `${student.assignmentsTotal > 0 
                              ? (student.assignmentsSubmitted / student.assignmentsTotal) * 100 
                              : 0
                            }%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">
                        {student.assignmentsSubmitted}/{student.assignmentsTotal}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">
                      {new Date(student.lastActivity).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-20">
                  <button className="text-gray-500 hover:text-gray-700 transition-colors">
                    <span className="text-xl">💬</span>
                  </button>
                  <button className="text-gray-500 hover:text-gray-700 transition-colors">
                    <span className="text-xl">⚙️</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Enrollment Info */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-200/30">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Enrollment Management</h3>
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
            <h4 className="font-medium text-gray-700 mb-2">Enrollment Actions</h4>
            <div className="flex items-center space-x-2">
              <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm">
                Add Students
              </button>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
                Export List
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
