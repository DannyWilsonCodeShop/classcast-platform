'use client';

import { useState } from 'react';

interface Student {
  id: string;
  name: string;
  avatar: string;
  grade: string;
  course: string;
  isOnline: boolean;
}

interface StudentShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  onShare: (studentIds: string[]) => void;
}

export default function StudentShareModal({ isOpen, onClose, videoTitle, onShare }: StudentShareModalProps) {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock student data
  const students: Student[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      avatar: 'SC',
      grade: '11th Grade',
      course: 'Mathematics',
      isOnline: true
    },
    {
      id: '2',
      name: 'Marcus Rodriguez',
      avatar: 'MR',
      grade: '11th Grade',
      course: 'Engineering',
      isOnline: true
    },
    {
      id: '3',
      name: 'Emma Thompson',
      avatar: 'ET',
      grade: '11th Grade',
      course: 'Science',
      isOnline: false
    },
    {
      id: '4',
      name: 'Alex Johnson',
      avatar: 'AJ',
      grade: '11th Grade',
      course: 'English',
      isOnline: true
    },
    {
      id: '5',
      name: 'Maya Patel',
      avatar: 'MP',
      grade: '11th Grade',
      course: 'History',
      isOnline: false
    },
    {
      id: '6',
      name: 'David Lee',
      avatar: 'DL',
      grade: '11th Grade',
      course: 'Mathematics',
      isOnline: true
    }
  ];

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleShare = () => {
    onShare(selectedStudents);
    setSelectedStudents([]);
    onClose();
  };

  const handleSelectAll = () => {
    setSelectedStudents(filteredStudents.map(student => student.id));
  };

  const handleDeselectAll = () => {
    setSelectedStudents([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Share with Classmates</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-xl">
          <p className="text-sm text-blue-800">
            <span className="font-bold">Sharing:</span> {videoTitle}
          </p>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search students or courses..."
            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none"
          />
        </div>

        {/* Select All/Deselect All */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={handleSelectAll}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold text-sm hover:bg-blue-200 transition-colors"
          >
            Select All
          </button>
          <button
            onClick={handleDeselectAll}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors"
          >
            Deselect All
          </button>
        </div>

        {/* Students List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              onClick={() => handleStudentToggle(student.id)}
              className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-colors ${
                selectedStudents.includes(student.id)
                  ? 'bg-blue-100 border-2 border-blue-300'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">{student.avatar}</span>
                </div>
                {student.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-gray-800">{student.name}</h4>
                  {selectedStudents.includes(student.id) && (
                    <span className="text-blue-500 text-lg">✓</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{student.grade} • {student.course}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${
                    student.isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                  <span className="text-xs text-gray-500">
                    {student.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={selectedStudents.length === 0}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Share ({selectedStudents.length})
          </button>
        </div>
      </div>
    </div>
  );
}
