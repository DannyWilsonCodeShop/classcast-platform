'use client';

import React from 'react';

interface Course {
  courseId: string;
  courseName: string;
  courseCode: string;
  description: string;
  instructor: {
    name: string;
    email: string;
    avatar?: string;
  };
  semester: string;
  year: number;
  status: 'draft' | 'published' | 'archived';
  enrollmentCount: number;
  maxEnrollment?: number;
  credits: number;
  schedule: {
    days: string[];
    time: string;
    location: string;
  };
  prerequisites: string[];
  learningObjectives: string[];
  gradingPolicy: {
    assignments: number;
    exams: number;
    participation: number;
    final: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface Assignment {
  assignmentId: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
  status: 'not-started' | 'in-progress' | 'submitted' | 'graded';
  grade?: number;
  feedback?: string;
  submissionType: 'text' | 'file' | 'video';
  createdAt: string;
}

interface Student {
  studentId: string;
  name: string;
  email: string;
  avatar?: string;
  enrollmentDate: string;
  status: 'active' | 'dropped' | 'completed';
  grade?: string;
}

interface CourseDetailsProps {
  course: Course;
  assignments: Assignment[];
  students: Student[];
}

export const CourseDetails: React.FC<CourseDetailsProps> = ({ course, assignments, students }) => {
  const upcomingAssignments = assignments
    .filter(a => a.status === 'not-started' || a.status === 'in-progress')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  const recentAssignments = assignments
    .filter(a => a.status === 'graded')
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
    .slice(0, 3);

  const averageGrade = assignments
    .filter(a => a.grade !== undefined)
    .reduce((sum, a) => sum + (a.grade || 0), 0) / assignments.filter(a => a.grade !== undefined).length;

  return (
    <div className="space-y-8">
      {/* Course Overview */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 border-gray-200/30">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Info */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Course Information</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{course.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Schedule</h3>
                  <p className="text-gray-600">
                    {course.schedule.days.join(', ')}<br />
                    {course.schedule.time}<br />
                    {course.schedule.location}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Credits</h3>
                  <p className="text-gray-600">{course.credits} credits</p>
                </div>
              </div>

              {course.prerequisites.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Prerequisites</h3>
                  <div className="flex flex-wrap gap-2">
                    {course.prerequisites.map((prereq, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {prereq}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Learning Objectives</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  {course.learningObjectives.map((objective, index) => (
                    <li key={index}>{objective}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Instructor & Stats */}
          <div className="space-y-6">
            {/* Instructor */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-700 mb-4">Instructor</h3>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {course.instructor.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{course.instructor.name}</p>
                  <p className="text-sm text-gray-600">{course.instructor.email}</p>
                </div>
              </div>
            </div>

            {/* Course Stats */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{course.enrollmentCount}</div>
                  <div className="text-sm text-gray-600">Students Enrolled</div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{assignments.length}</div>
                  <div className="text-sm text-gray-600">Total Assignments</div>
                </div>
              </div>

              {averageGrade && (
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-500">{averageGrade.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Average Grade</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grading Policy */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 border-gray-200/30">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Grading Policy</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-500 mb-2">{course.gradingPolicy.assignments}%</div>
            <div className="text-sm text-gray-600">Assignments</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500 mb-2">{course.gradingPolicy.exams}%</div>
            <div className="text-sm text-gray-600">Exams</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-500 mb-2">{course.gradingPolicy.participation}%</div>
            <div className="text-sm text-gray-600">Participation</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-500 mb-2">{course.gradingPolicy.final}%</div>
            <div className="text-sm text-gray-600">Final Exam</div>
          </div>
        </div>
      </div>

      {/* Upcoming Assignments */}
      {upcomingAssignments.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 border-gray-200/30">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Upcoming Assignments</h2>
          <div className="space-y-4">
            {upcomingAssignments.map((assignment) => (
              <div key={assignment.assignmentId} className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                <div>
                  <h3 className="font-semibold text-gray-800">{assignment.title}</h3>
                  <p className="text-sm text-gray-600">{assignment.points} points</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">
                    Due {new Date(assignment.dueDate).toLocaleDateString()}
                  </p>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    assignment.status === 'not-started' ? 'bg-gray-100 text-gray-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {assignment.status === 'not-started' ? 'Not Started' : 'In Progress'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Grades */}
      {recentAssignments.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 border-gray-200/30">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Grades</h2>
          <div className="space-y-4">
            {recentAssignments.map((assignment) => (
              <div key={assignment.assignmentId} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                <div>
                  <h3 className="font-semibold text-gray-800">{assignment.title}</h3>
                  <p className="text-sm text-gray-600">{assignment.points} points</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">{assignment.grade}%</p>
                  <p className="text-sm text-gray-600">
                    Graded {new Date(assignment.dueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
