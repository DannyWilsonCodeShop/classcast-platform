'use client';

import React, { useState } from 'react';

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
  status: 'draft' | 'published' | 'grading' | 'completed';
  submissionType: 'text' | 'file' | 'video';
  submissionsCount: number;
  gradedCount: number;
  averageGrade?: number;
  createdAt: string;
}

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

interface InstructorCourseDetailsProps {
  course: Course;
  assignments: Assignment[];
  students: Student[];
  onCourseUpdate: (updateData: Partial<Course>) => Promise<{ success: boolean; message: string }>;
}

export const InstructorCourseDetails: React.FC<InstructorCourseDetailsProps> = ({ 
  course, 
  assignments, 
  students, 
  onCourseUpdate 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Course>>({});
  const [saving, setSaving] = useState(false);

  const handleEdit = () => {
    setEditData({
      courseName: course.courseName,
      courseCode: course.courseCode,
      description: course.description,
      credits: course.credits,
      maxEnrollment: course.maxEnrollment,
      schedule: course.schedule,
      prerequisites: course.prerequisites,
      learningObjectives: course.learningObjectives,
      gradingPolicy: course.gradingPolicy,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await onCourseUpdate(editData);
      if (result.success) {
        setIsEditing(false);
        setEditData({});
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  const activeStudents = students.filter(s => s.status === 'active').length;
  const totalAssignments = assignments.length;
  const publishedAssignments = assignments.filter(a => a.status === 'published').length;
  const averageGrade = assignments
    .filter(a => a.averageGrade !== undefined)
    .reduce((sum, a) => sum + (a.averageGrade || 0), 0) / assignments.filter(a => a.averageGrade !== undefined).length;

  return (
    <div className="space-y-8">
      {/* Course Overview */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 border-gray-200/30">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Course Information</h2>
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Edit Course
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Info */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.courseName || course.courseName}
                    onChange={(e) => setEditData(prev => ({ ...prev, courseName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-800 font-semibold">{course.courseName}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Course Code</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.courseCode || course.courseCode}
                      onChange={(e) => setEditData(prev => ({ ...prev, courseCode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-800">{course.courseCode}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Credits</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData.credits || course.credits}
                      onChange={(e) => setEditData(prev => ({ ...prev, credits: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-800">{course.credits} credits</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                {isEditing ? (
                  <textarea
                    value={editData.description || course.description}
                    onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-600 leading-relaxed">{course.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Schedule</label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Days (e.g., Mon, Wed, Fri)"
                        value={editData.schedule?.days?.join(', ') || course.schedule.days.join(', ')}
                        onChange={(e) => setEditData(prev => ({ 
                          ...prev, 
                          schedule: { 
                            ...prev.schedule || course.schedule, 
                            days: e.target.value.split(',').map(d => d.trim()) 
                          } 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Time (e.g., 10:00 AM - 11:30 AM)"
                        value={editData.schedule?.time || course.schedule.time}
                        onChange={(e) => setEditData(prev => ({ 
                          ...prev, 
                          schedule: { 
                            ...prev.schedule || course.schedule, 
                            time: e.target.value 
                          } 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Location"
                        value={editData.schedule?.location || course.schedule.location}
                        onChange={(e) => setEditData(prev => ({ 
                          ...prev, 
                          schedule: { 
                            ...prev.schedule || course.schedule, 
                            location: e.target.value 
                          } 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ) : (
                    <p className="text-gray-800">
                      {course.schedule.days.join(', ')}<br />
                      {course.schedule.time}<br />
                      {course.schedule.location}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Enrollment</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData.maxEnrollment || course.maxEnrollment || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, maxEnrollment: parseInt(e.target.value) || undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-800">{course.maxEnrollment || 'No limit'}</p>
                  )}
                </div>
              </div>

              {isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prerequisites</label>
                  <input
                    type="text"
                    placeholder="Enter prerequisites separated by commas"
                    value={editData.prerequisites?.join(', ') || course.prerequisites.join(', ')}
                    onChange={(e) => setEditData(prev => ({ 
                      ...prev, 
                      prerequisites: e.target.value.split(',').map(p => p.trim()).filter(p => p) 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Learning Objectives</label>
                  <textarea
                    placeholder="Enter learning objectives, one per line"
                    value={editData.learningObjectives?.join('\n') || course.learningObjectives.join('\n')}
                    onChange={(e) => setEditData(prev => ({ 
                      ...prev, 
                      learningObjectives: e.target.value.split('\n').filter(o => o.trim()) 
                    }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Stats & Actions */}
          <div className="space-y-6">
            {/* Course Stats */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-700 mb-4">Course Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Students:</span>
                  <span className="font-semibold">{activeStudents}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Assignments:</span>
                  <span className="font-semibold">{totalAssignments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Published:</span>
                  <span className="font-semibold">{publishedAssignments}</span>
                </div>
                {averageGrade && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Grade:</span>
                    <span className="font-semibold">{averageGrade.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <button className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                📝 Create Assignment
              </button>
              <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                👥 Manage Students
              </button>
              <button className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                📊 View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grading Policy */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 border-gray-200/30">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Grading Policy</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isEditing ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assignments (%)</label>
                <input
                  type="number"
                  value={editData.gradingPolicy?.assignments || course.gradingPolicy.assignments}
                  onChange={(e) => setEditData(prev => ({ 
                    ...prev, 
                    gradingPolicy: { 
                      ...prev.gradingPolicy || course.gradingPolicy, 
                      assignments: parseInt(e.target.value) 
                    } 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Exams (%)</label>
                <input
                  type="number"
                  value={editData.gradingPolicy?.exams || course.gradingPolicy.exams}
                  onChange={(e) => setEditData(prev => ({ 
                    ...prev, 
                    gradingPolicy: { 
                      ...prev.gradingPolicy || course.gradingPolicy, 
                      exams: parseInt(e.target.value) 
                    } 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Participation (%)</label>
                <input
                  type="number"
                  value={editData.gradingPolicy?.participation || course.gradingPolicy.participation}
                  onChange={(e) => setEditData(prev => ({ 
                    ...prev, 
                    gradingPolicy: { 
                      ...prev.gradingPolicy || course.gradingPolicy, 
                      participation: parseInt(e.target.value) 
                    } 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Final Exam (%)</label>
                <input
                  type="number"
                  value={editData.gradingPolicy?.final || course.gradingPolicy.final}
                  onChange={(e) => setEditData(prev => ({ 
                    ...prev, 
                    gradingPolicy: { 
                      ...prev.gradingPolicy || course.gradingPolicy, 
                      final: parseInt(e.target.value) 
                    } 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};
