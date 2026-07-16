'use client';

import React, { useState, useEffect } from 'react';
import { SEMESTER_OPTIONS } from '@/constants/semesters';

interface Section {
  sectionId: string;
  courseId: string;
  sectionName: string;
  sectionCode?: string;
  classCode?: string;
  description?: string;
  maxEnrollment?: number;
  currentEnrollment: number;
  instructorId: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface Course {
  courseId: string;
  title: string;
  code: string;
  description: string;
  semester: string;
  year: number;
  status: 'draft' | 'published' | 'archived';
  currentEnrollment: number;
  maxStudents?: number;
  instructorId: string;
  settings?: {
    privacy?: 'public' | 'private';
    allowLateSubmissions?: boolean;
    latePenalty?: number;
    allowResubmissions?: boolean;
    enableDiscussions?: boolean;
    enableAnnouncements?: boolean;
    enrollmentOpen?: boolean;
  };
  sections?: Section[];
  createdAt: string;
  updatedAt: string;
}

interface CourseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  onUpdate: (updateData: Partial<Course>) => Promise<{ success: boolean; message: string }>;
  onDelete?: (courseId: string) => Promise<{ success: boolean; message: string }>;
  instructorId?: string;
}

const CourseSettingsModal: React.FC<CourseSettingsModalProps> = ({
  isOpen,
  onClose,
  course,
  onUpdate,
  onDelete,
  instructorId
}) => {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [semester, setSemester] = useState('');
  const [year, setYear] = useState(2025);
  const [enrollmentOpen, setEnrollmentOpen] = useState(true);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSections, setIsLoadingSections] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // New section inline state
  const [addingSectionName, setAddingSectionName] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);

  useEffect(() => {
    if (course && isOpen) {
      setTitle(course.title || '');
      setCode(course.code || '');
      setDescription(course.description || '');
      setSemester(course.semester || '');
      setYear(course.year || 2025);
      setEnrollmentOpen(course.settings?.enrollmentOpen !== false);
      setError(null);
      setShowDeleteConfirm(false);
      loadSections();
    }
  }, [course, isOpen]);

  const loadSections = async () => {
    if (!course?.courseId) return;
    setIsLoadingSections(true);
    try {
      const response = await fetch(`/api/sections?courseId=${course.courseId}`);
      if (response.ok) {
        const data = await response.json();
        setSections(data.data || []);
      }
    } catch (err) {
      console.error('Error loading sections:', err);
    } finally {
      setIsLoadingSections(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await onUpdate({
        title,
        code,
        description,
        semester,
        year,
        settings: { ...course.settings, enrollmentOpen },
      });
      if (result.success) {
        onClose();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to save changes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSection = async () => {
    if (!course?.courseId || !addingSectionName.trim()) return;
    const finalInstructorId = instructorId || course.instructorId;
    if (!finalInstructorId) return;

    setIsAddingSection(true);
    try {
      const response = await fetch('/api/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.courseId,
          sectionName: addingSectionName.trim(),
          instructorId: finalInstructorId
        })
      });
      if (response.ok) {
        setAddingSectionName('');
        loadSections();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add section');
      }
    } catch (err) {
      setError('Failed to add section');
    } finally {
      setIsAddingSection(false);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Delete this section?')) return;
    try {
      const response = await fetch(`/api/sections?sectionId=${sectionId}`, { method: 'DELETE' });
      if (response.ok) {
        loadSections();
      }
    } catch (err) {
      setError('Failed to delete section');
    }
  };

  const handleDeleteCourse = async () => {
    if (!course || !onDelete) return;
    setIsDeleting(true);
    try {
      const result = await onDelete(course.courseId);
      if (result.success) {
        window.location.href = '/instructor/dashboard';
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to delete course');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isOpen || !course) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
      <div className="bg-white w-full max-w-[440px] rounded-2xl p-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-[#005587]">Course Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Course Name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Course Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
            />
          </div>

          {/* Code + Semester row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Course Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
              >
                {SEMESTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Year */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value) || 2025)}
              min={2020}
              max={2030}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587] resize-none"
            />
          </div>

          {/* Enrollment Toggle */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
            <div>
              <span className="text-xs font-bold text-[#005587]">Enrollment</span>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {enrollmentOpen ? 'Students can join with the class code' : 'New students cannot join this course'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEnrollmentOpen(!enrollmentOpen)}
              className={`relative w-10 h-5.5 rounded-full transition-colors ${enrollmentOpen ? 'bg-green-500' : 'bg-gray-300'}`}
              style={{ width: '40px', height: '22px' }}
            >
              <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white transition-transform ${enrollmentOpen ? 'left-[20px]' : 'left-[3px]'}`} />
            </button>
          </div>

          {/* Sections */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">Sections</label>
              <span className="text-[10px] text-gray-400">{sections.length} total</span>
            </div>

            {isLoadingSections ? (
              <div className="text-xs text-gray-400 text-center py-3">Loading...</div>
            ) : (
              <div className="space-y-1.5">
                {sections.map((section) => (
                  <div key={section.sectionId} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <span className="flex-1 text-xs font-medium text-gray-700 truncate">{section.sectionName}</span>
                    {(section.sectionCode || section.classCode) && (
                      <span className="px-1.5 py-0.5 bg-[#005587]/10 text-[#005587] text-[10px] font-mono font-bold rounded">
                        {section.classCode || section.sectionCode}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">{section.currentEnrollment} enrolled</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSection(section.sectionId)}
                      className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}

                {/* Add section inline */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={addingSectionName}
                    onChange={(e) => setAddingSectionName(e.target.value)}
                    placeholder="New section name..."
                    className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#005587] focus:border-[#005587]"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSection())}
                  />
                  <button
                    type="button"
                    onClick={handleAddSection}
                    disabled={!addingSectionName.trim() || isAddingSection}
                    className="px-2.5 py-1.5 bg-[#005587] text-white text-xs font-bold rounded-lg disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-[#005587] text-white rounded-xl text-sm font-bold hover:bg-[#004470] transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Delete zone */}
          {onDelete && (
            <div className="pt-3 border-t border-gray-100">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full text-center text-xs text-red-500 font-medium hover:text-red-700 py-2"
                >
                  Delete this course...
                </button>
              ) : (
                <div className="bg-red-50 rounded-xl p-3 space-y-2">
                  <p className="text-xs text-red-700">This will permanently delete the course and all data. This cannot be undone.</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteCourse}
                      disabled={isDeleting}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Forever'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CourseSettingsModal;
