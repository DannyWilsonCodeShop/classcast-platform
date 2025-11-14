'use client';

import React, { useState, useCallback } from 'react';
import InstructorOnboardingWizard from '../wizards/InstructorOnboardingWizard';
import StudentOnboardingWizard from '../wizards/StudentOnboardingWizard';

interface HelpSystemProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: 'student' | 'instructor' | 'admin';
}

interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  items: HelpItem[];
}

interface HelpItem {
  id: string;
  title: string;
  description: string;
  type: 'wizard' | 'tutorial' | 'faq' | 'video' | 'guide';
  action: () => void;
  isNew?: boolean;
}

const HelpSystem: React.FC<HelpSystemProps> = ({
  isOpen,
  onClose,
  userRole = 'student'
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showInstructorWizard, setShowInstructorWizard] = useState(false);
  const [showStudentWizard, setShowStudentWizard] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const helpCategories: HelpCategory[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'New to ClassCast? Start here!',
      icon: '🚀',
      color: 'blue',
      items: [
        {
          id: 'instructor-wizard',
          title: 'Instructor Setup Wizard',
          description: 'Complete guide to setting up your first course, students, and assignments',
          type: 'wizard',
          action: () => setShowInstructorWizard(true),
          isNew: true
        },
        {
          id: 'student-wizard',
          title: 'Student Onboarding Tour',
          description: 'Learn how to find courses, submit assignments, and track your progress',
          type: 'wizard',
          action: () => setShowStudentWizard(true),
          isNew: true
        },
        {
          id: 'account-setup',
          title: 'Account Setup Guide',
          description: 'How to create and configure your ClassCast account',
          type: 'guide',
          action: () => console.log('Account setup guide')
        },
        {
          id: 'first-login',
          title: 'First Login Walkthrough',
          description: 'Step-by-step guide for your first time logging in',
          type: 'tutorial',
          action: () => console.log('First login tutorial')
        }
      ]
    },
    {
      id: 'courses',
      title: 'Courses & Learning',
      description: 'Everything about courses and assignments',
      icon: '📚',
      color: 'green',
      items: [
        {
          id: 'find-courses',
          title: 'How to Find and Join Courses',
          description: 'Discover and enroll in courses that interest you',
          type: 'guide',
          action: () => console.log('Find courses guide')
        },
        {
          id: 'create-course',
          title: 'Creating Your First Course',
          description: 'Step-by-step guide for instructors to create courses',
          type: 'tutorial',
          action: () => console.log('Create course tutorial')
        },
        {
          id: 'manage-students',
          title: 'Managing Students',
          description: 'How to add, remove, and manage students in your courses',
          type: 'guide',
          action: () => console.log('Manage students guide')
        },
        {
          id: 'course-settings',
          title: 'Course Settings & Configuration',
          description: 'Customize your course settings and preferences',
          type: 'guide',
          action: () => console.log('Course settings guide')
        }
      ]
    },
    {
      id: 'assignments',
      title: 'Assignments & Submissions',
      description: 'Working with assignments and submissions',
      icon: '📝',
      color: 'purple',
      items: [
        {
          id: 'submit-video',
          title: 'How to Submit Video Assignments',
          description: 'Complete guide to recording and submitting video assignments',
          type: 'video',
          action: () => console.log('Video submission guide')
        },
        {
          id: 'create-assignment',
          title: 'Creating Assignments',
          description: 'How instructors can create and configure assignments',
          type: 'tutorial',
          action: () => console.log('Create assignment tutorial')
        },
        {
          id: 'grade-assignments',
          title: 'Grading Assignments',
          description: 'Tools and techniques for grading student work',
          type: 'guide',
          action: () => console.log('Grading guide')
        },
        {
          id: 'ai-grading',
          title: 'Using AI for Grading',
          description: 'Leverage AI tools to help with assignment grading',
          type: 'tutorial',
          action: () => console.log('AI grading tutorial')
        }
      ]
    },
    {
      id: 'ai-features',
      title: 'AI Features',
      description: 'Make the most of our AI-powered tools',
      icon: '🤖',
      color: 'indigo',
      items: [
        {
          id: 'ai-tutoring',
          title: 'AI Tutoring Assistant',
          description: 'Get personalized help with your studies using our AI tutor',
          type: 'tutorial',
          action: () => console.log('AI tutoring tutorial')
        },
        {
          id: 'plagiarism-check',
          title: 'Plagiarism Detection',
          description: 'How to use our AI-powered plagiarism detection tools',
          type: 'guide',
          action: () => console.log('Plagiarism check guide')
        },
        {
          id: 'smart-recommendations',
          title: 'Smart Recommendations',
          description: 'Discover content and study materials tailored to you',
          type: 'guide',
          action: () => console.log('Smart recommendations guide')
        },
        {
          id: 'predictive-analytics',
          title: 'Predictive Analytics',
          description: 'Understand student performance predictions and insights',
          type: 'tutorial',
          action: () => console.log('Predictive analytics tutorial')
        }
      ]
    },
    {
      id: 'community',
      title: 'Community & Collaboration',
      description: 'Connect with peers and instructors',
      icon: '👥',
      color: 'orange',
      items: [
        {
          id: 'community-feed',
          title: 'Using the Community Feed',
          description: 'Share updates, ask questions, and connect with others',
          type: 'guide',
          action: () => console.log('Community feed guide')
        },
        {
          id: 'study-groups',
          title: 'Creating Study Groups',
          description: 'Form study groups and collaborate with classmates',
          type: 'tutorial',
          action: () => console.log('Study groups tutorial')
        },
        {
          id: 'peer-review',
          title: 'Peer Review Process',
          description: 'How to participate in peer review activities',
          type: 'guide',
          action: () => console.log('Peer review guide')
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      description: 'Common issues and solutions',
      icon: '🔧',
      color: 'red',
      items: [
        {
          id: 'login-issues',
          title: 'Login Problems',
          description: 'Solutions for common login and authentication issues',
          type: 'faq',
          action: () => console.log('Login issues FAQ')
        },
        {
          id: 'video-upload',
          title: 'Video Upload Issues',
          description: 'Troubleshooting video recording and upload problems',
          type: 'faq',
          action: () => console.log('Video upload FAQ')
        },
        {
          id: 'mobile-app',
          title: 'Mobile App Issues',
          description: 'Common problems with the mobile application',
          type: 'faq',
          action: () => console.log('Mobile app FAQ')
        },
        {
          id: 'contact-support',
          title: 'Contact Support',
          description: 'Get help from our support team',
          type: 'guide',
          action: () => console.log('Contact support')
        }
      ]
    }
  ];

  const filteredCategories = helpCategories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.items.some(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleItemClick = useCallback((item: HelpItem) => {
    item.action();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'wizard': return '🧙‍♂️';
      case 'tutorial': return '📖';
      case 'faq': return '❓';
      case 'video': return '🎥';
      case 'guide': return '📋';
      default: return '📄';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'wizard': return 'bg-purple-100 text-purple-800';
      case 'tutorial': return 'bg-blue-100 text-blue-800';
      case 'faq': return 'bg-yellow-100 text-yellow-800';
      case 'video': return 'bg-red-100 text-red-800';
      case 'guide': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Help & Support Center</h2>
                <p className="text-blue-100 mt-1">
                  Find tutorials, guides, and get help with ClassCast
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Search */}
            <div className="mt-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search help articles, tutorials, and guides..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-white text-opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {searchQuery ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Search Results for "{searchQuery}"
                </h3>
                {filteredCategories.map(category => (
                  <div key={category.id} className="space-y-2">
                    <h4 className="font-medium text-gray-700">{category.title}</h4>
                    <div className="space-y-2">
                      {category.items
                        .filter(item =>
                          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map(item => (
                          <div
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                          >
                            <div className="flex items-start space-x-3">
                              <span className="text-lg">{getTypeIcon(item.type)}</span>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h5 className="font-medium text-gray-900">{item.title}</h5>
                                  {item.isNew && (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                      New
                                    </span>
                                  )}
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(item.type)}`}>
                                    {item.type}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {helpCategories.map(category => (
                  <div
                    key={category.id}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-2xl">{category.icon}</span>
                      <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{category.description}</p>
                    
                    {selectedCategory === category.id && (
                      <div className="space-y-2">
                        {category.items.map(item => (
                          <div
                            key={item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleItemClick(item);
                            }}
                            className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                          >
                            <div className="flex items-start space-x-3">
                              <span className="text-sm">{getTypeIcon(item.type)}</span>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h5 className="font-medium text-gray-900 text-sm">{item.title}</h5>
                                  {item.isNew && (
                                    <span className="px-1 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                                      New
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm text-gray-500">
                        {category.items.length} {category.items.length === 1 ? 'item' : 'items'}
                      </span>
                      <svg 
                        className={`w-4 h-4 text-gray-400 transition-transform ${
                          selectedCategory === category.id ? 'rotate-180' : ''
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Can't find what you're looking for? 
              <button className="text-blue-600 hover:text-blue-800 ml-1 font-medium">
                Contact Support
              </button>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Wizards */}
      <InstructorOnboardingWizard
        isOpen={showInstructorWizard}
        onClose={() => setShowInstructorWizard(false)}
        onComplete={() => {
          setShowInstructorWizard(false);
          onClose();
        }}
      />

      <StudentOnboardingWizard
        isOpen={showStudentWizard}
        onClose={() => setShowStudentWizard(false)}
        onComplete={() => {
          setShowStudentWizard(false);
          onClose();
        }}
      />
    </>
  );
};

export default HelpSystem;
