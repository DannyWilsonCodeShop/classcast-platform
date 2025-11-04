'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Course, CreateCourseData } from '@/types/course';
import { Assignment } from '@/types/dynamodb';
import { SEMESTER_OPTIONS } from '@/constants/semesters';
// import { Section, CreateSectionRequest } from '@/types/sections';

// Local interfaces for now
interface Section {
  sectionId: string;
  courseId: string;
  sectionName: string;
  sectionCode?: string;
  classCode?: string;
  description?: string;
  maxEnrollment?: number;
  currentEnrollment: number;
  schedule?: {
    days: string[];
    time: string;
    location: string;
  };
  location?: string;
  instructorId: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface CreateSectionRequest {
  courseId: string;
  sectionName: string;
  sectionCode?: string;
  description?: string;
  maxEnrollment?: number;
  schedule?: {
    days: string[];
    time: string;
    location: string;
  };
  location?: string;
  instructorId: string;
}
import { SectionForm } from '@/components/sections/SectionForm';
import { useAuth } from '@/contexts/AuthContext';

interface InstructorOnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  isFirstTime?: boolean;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
}

const InstructorOnboardingWizard: React.FC<InstructorOnboardingWizardProps> = ({
  isOpen,
  onClose,
  onComplete,
  isFirstTime = false
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [courseData, setCourseData] = useState<Partial<CreateCourseData>>({});
  const [assignmentData, setAssignmentData] = useState<Partial<Assignment>>({});
  const [students, setStudents] = useState<Array<{email: string, name: string}>>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [hasMultipleSections, setHasMultipleSections] = useState<boolean | null>(null);

  // Set instructor ID when user is available
  useEffect(() => {
    if (user?.id && !courseData.instructorId) {
      setCourseData(prev => ({ ...prev, instructorId: user.id }));
    }
  }, [user?.id, courseData.instructorId]);

  // Debug assignment data changes
  useEffect(() => {
    console.log('Assignment data changed:', assignmentData);
  }, [assignmentData]);

  const steps: WizardStep[] = [
    {
      id: 'welcome',
      title: isFirstTime ? 'Welcome to ClassCast! 🎉' : 'Create New Class 📚',
      description: isFirstTime 
        ? 'Let\'s set up your first course and get you started teaching.'
        : 'Let\'s create a new class for your students.',
      component: <WelcomeStep isFirstTime={isFirstTime} />
    },
    {
      id: 'course-setup',
      title: isFirstTime ? 'Create Your First Course 📚' : 'Set Up Your Class 📚',
      description: 'Set up your course with basic information and settings.',
      component: <CourseSetupStep 
        data={courseData} 
        onChange={setCourseData} 
      />
    },
    {
      id: 'sections-question',
      title: 'Course Structure 🏫',
      description: 'Tell us about your course structure to set up the best experience.',
      component: <SectionsQuestionStep 
        hasMultipleSections={hasMultipleSections}
        setHasMultipleSections={setHasMultipleSections}
      />
    },
    {
      id: 'sections-setup',
      title: 'Create Course Sections 🏫',
      description: 'Set up different sections for your course (e.g., Period 1, 2, 3 or Section A, B, C).',
      component: <SectionsSetupStep 
        sections={sections} 
        onChange={setSections}
        courseId={courseData.courseId}
        instructorId={courseData.instructorId}
        showSectionForm={showSectionForm}
        setShowSectionForm={setShowSectionForm}
        hasMultipleSections={hasMultipleSections}
        courseName={courseData.courseName}
      />
    },
    {
      id: 'add-students',
      title: 'Share Class Code 👥',
      description: 'Share your class code with students or add them manually.',
      component: <AddStudentsStep 
        students={students} 
        onChange={setStudents} 
      />
    },
    {
      id: 'create-assignment',
      title: isFirstTime ? 'Create Your First Assignment 📝' : 'Create Assignment 📝',
      description: 'Set up an assignment for your students to complete.',
      component: <CreateAssignmentStep 
        data={assignmentData} 
        onChange={setAssignmentData}
        courseId={courseData.courseId}
      />
    },
    {
      id: 'publish-course',
      title: isFirstTime ? 'Publish Your Course 🚀' : 'Publish Your Class 🚀',
      description: isFirstTime 
        ? 'Review and publish your course to make it live.'
        : 'Review and publish your new class.',
        component: <PublishCourseStep 
          courseData={courseData}
          assignmentData={assignmentData}
          students={students}
          isFirstTime={isFirstTime}
          hasMultipleSections={hasMultipleSections}
          sections={sections}
        />
    },
    {
      id: 'complete',
      title: isFirstTime ? 'You\'re All Set! 🎯' : 'Class Created! 🎯',
      description: isFirstTime 
        ? 'Your course is live and ready for students.'
        : 'Your new class is ready for students.',
      component: <CompleteStep 
        isFirstTime={isFirstTime} 
        courseData={courseData}
        sections={sections}
        students={students}
        assignmentData={assignmentData}
        hasMultipleSections={hasMultipleSections}
      />
    }
  ];

  const handleNext = useCallback(async () => {
    if (currentStep < steps.length - 1) {
      setIsLoading(true);
      
      try {
        // Save current step data
        await saveStepData(currentStep);
        
        setCurrentStep(prev => prev + 1);
      } catch (error) {
        console.error('Error saving step data:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      onComplete();
    }
  }, [currentStep, steps.length]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const saveStepData = async (stepIndex: number) => {
    // Implement API calls to save data at each step
    switch (stepIndex) {
      case 1: // Course setup
        console.log('Course setup step - courseData:', courseData);
        console.log('Course setup step - title:', courseData.title, 'code:', courseData.code);
        console.log('Course setup step - instructorId:', courseData.instructorId);
        
        // Skip saving if required fields are not filled - this is normal during wizard navigation
        if (!courseData.title || !courseData.code) {
          console.log('Course setup step - skipping save, fields not yet filled:', { title: courseData.title, code: courseData.code });
          return; // Don't throw error, just skip saving
        }
        
        if (!courseData.instructorId) {
          console.error('Missing instructor ID:', courseData.instructorId);
          throw new Error('Instructor ID is required');
        }
        
        if (courseData.title && courseData.code) {
          // Create course
          try {
            const courseResponse = await fetch('/api/courses', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title: courseData.title,
                description: courseData.description,
                code: courseData.code,
                classCode: courseData.classCode,
                department: courseData.department,
                semester: courseData.semester,
                year: courseData.year,
                instructorId: courseData.instructorId,
                maxStudents: courseData.maxStudents,
                startDate: courseData.startDate,
                endDate: courseData.endDate,
                prerequisites: courseData.prerequisites,
                learningObjectives: courseData.learningObjectives,
                gradingPolicy: courseData.gradingPolicy,
                resources: courseData.resources,
                settings: courseData.settings
              })
            });

            if (courseResponse.ok) {
              const courseResult = await courseResponse.json();
              console.log('Course creation response:', courseResult);
              const createdCourse = courseResult.data;
              setCourseData(prev => ({ ...prev, courseId: createdCourse.courseId }));
              console.log('Course created successfully:', createdCourse);
            } else {
              const errorData = await courseResponse.json();
              console.error('Course creation failed:', errorData);
              throw new Error(`Failed to create course: ${errorData.error || 'Unknown error'}`);
            }
          } catch (error) {
            console.error('Error creating course:', error);
            throw error;
          }
        }
        break;
      case 3: // Sections setup
        if (sections.length > 0 && courseData.courseId) {
          // Create sections
          try {
            const createdSections = [];
            for (const section of sections) {
              // Generate a unique section code for this section
              const sectionCodeResponse = await fetch('/api/classes/generate-code', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  existingCodes: createdSections.map(s => s.sectionCode).filter(Boolean),
                  options: {
                    length: 6,
                    includeLetters: true,
                    includeNumbers: true,
                    excludeSimilar: true
                  }
                })
              });

              let sectionCode = '';
              if (sectionCodeResponse.ok) {
                const sectionCodeData = await sectionCodeResponse.json();
                if (sectionCodeData.success) {
                  sectionCode = sectionCodeData.code;
                }
              }

              const sectionResponse = await fetch('/api/sections', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  courseId: courseData.courseId,
                  sectionName: section.sectionName,
                  sectionCode: sectionCode,
                  maxEnrollment: section.maxEnrollment,
                  instructorId: courseData.instructorId
                })
              });

              if (sectionResponse.ok) {
                const sectionResult = await sectionResponse.json();
                createdSections.push(sectionResult.data);
              }
            }
            console.log('Sections created:', createdSections);
          } catch (error) {
            console.error('Error creating sections:', error);
            throw error;
          }
        }
        break;
      case 4: // Add students
        if (students.length > 0) {
          // Invite students
          console.log('Inviting students:', students);
        }
        break;
      case 5: // Create assignment
        console.log('Assignment creation step - assignmentData:', assignmentData);
        console.log('Assignment creation step - courseData.courseId:', courseData.courseId);
        console.log('Assignment creation step - courseData.instructorId:', courseData.instructorId);
        
        // Validate assignment data
        console.log('Assignment creation step - assignmentData after delay:', assignmentData);
        
        if (!assignmentData.title || assignmentData.title.trim().length < 3) {
          console.error('Missing or invalid assignment title:', assignmentData.title);
          throw new Error('Assignment title is required and must be at least 3 characters long');
        }

        if (!assignmentData.description || assignmentData.description.trim().length < 10) {
          console.error('Missing or invalid assignment description:', assignmentData.description);
          throw new Error('Assignment description is required and must be at least 10 characters long');
        }

        // Validate peer review due date if peer review is enabled
        if (assignmentData.peerReview && assignmentData.peerReviewDueDate) {
          if (assignmentData.dueDate && new Date(assignmentData.peerReviewDueDate) <= new Date(assignmentData.dueDate)) {
            console.error('Peer review due date must be after assignment due date');
            throw new Error('Peer review due date must be after the assignment due date');
          }
        }
        
        if (!courseData.courseId) {
          console.error('Missing course ID');
          throw new Error('Course ID is required');
        }
        
        if (!courseData.instructorId) {
          console.error('Missing instructor ID for assignment');
          throw new Error('Instructor ID is required');
        }
        
        if (assignmentData.title && courseData.courseId && courseData.instructorId) {
          // Create assignment
          try {
            const assignmentResponse = await fetch('/api/assignments', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title: assignmentData.title,
                description: assignmentData.description,
                assignmentType: assignmentData.assignmentType || 'video',
                dueDate: assignmentData.dueDate,
                maxScore: assignmentData.maxScore || 100,
                weight: assignmentData.weight || 10,
                requirements: assignmentData.requirements || [],
                allowLateSubmission: assignmentData.allowLateSubmission || false,
                latePenalty: assignmentData.latePenalty || 0,
                maxSubmissions: assignmentData.maxSubmissions || 1,
                groupAssignment: assignmentData.groupAssignment || false,
                maxGroupSize: assignmentData.maxGroupSize || 4,
                allowedFileTypes: assignmentData.allowedFileTypes || ['mp4', 'mov', 'avi'],
                maxFileSize: assignmentData.maxFileSize || 2048 * 1024 * 1024, // 2GB
                status: assignmentData.status || 'draft',
                courseId: courseData.courseId,
                instructorId: courseData.instructorId,
                rubric: assignmentData.rubric,
                // Peer Review Settings
                peerReview: assignmentData.peerReview || false,
                peerReviewScope: assignmentData.peerReviewScope || 'section',
                peerReviewCount: assignmentData.peerReviewCount || 3,
                peerReviewDueDate: assignmentData.peerReviewDueDate || null,
                anonymousReview: assignmentData.anonymousReview || true,
                allowSelfReview: assignmentData.allowSelfReview || false,
                instructorReview: assignmentData.instructorReview || true,
                peerReviewInstructions: assignmentData.peerReviewInstructions || '',
                targetSections: assignmentData.targetSections || [],
                resources: assignmentData.resources || []
              })
            });

            if (assignmentResponse.ok) {
              const assignmentResult = await assignmentResponse.json();
              console.log('Assignment creation response:', assignmentResult);
              const createdAssignment = assignmentResult.data;
              setAssignmentData(prev => ({ ...prev, assignmentId: createdAssignment.assignmentId }));
              console.log('Assignment created successfully:', createdAssignment);
            } else {
              const errorData = await assignmentResponse.json();
              console.error('Assignment creation failed:', errorData);
              throw new Error(`Failed to create assignment: ${errorData.error || 'Unknown error'}`);
            }
          } catch (error) {
            console.error('Error creating assignment:', error);
            throw error;
          }
        }
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-[#4A90E2] text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{steps[currentStep].title}</h2>
              <p className="text-blue-100 mt-1">{steps[currentStep].description}</p>
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
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 flex-1 rounded-full ${
                    index <= currentStep ? 'bg-white' : 'bg-white bg-opacity-30'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-blue-100 mt-2">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {steps[currentStep].component}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Exit Wizard
            </button>
            <button
              onClick={handleNext}
              disabled={isLoading}
              className="px-6 py-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#9B5DE5] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? 'Saving...' : currentStep === steps.length - 1 ? 'Complete' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Step Components
interface WelcomeStepProps {
  isFirstTime?: boolean;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ isFirstTime = false }) => (
  <div className="text-center space-y-6">
    <div className="w-24 h-24 bg-[#4A90E2] rounded-full flex items-center justify-center mx-auto">
      <span className="text-4xl">🎓</span>
    </div>
    <div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">
        {isFirstTime ? 'Welcome to ClassCast!' : 'Create New Class'}
      </h3>
      <p className="text-gray-600 text-lg leading-relaxed">
        {isFirstTime 
          ? 'This wizard will help you set up your first course, add students, and create assignments. It only takes a few minutes to get everything ready!'
          : 'This wizard will help you create a new class with all the details, generate a class code, and optionally set up an assignment. It only takes a few minutes!'
        }
      </p>
    </div>
    <div className="bg-[#4A90E2]/10 rounded-lg p-4">
      <h4 className="font-semibold text-[#4A90E2] mb-2">What we'll cover:</h4>
      <ul className="text-[#4A90E2] space-y-1 text-left">
        <li>• {isFirstTime ? 'Create your first course' : 'Set up your new class'} with all the details</li>
        <li>• Generate a class code for students to join</li>
        <li>• {isFirstTime ? 'Set up your first assignment' : 'Optionally create an assignment'}</li>
        <li>• Publish everything and {isFirstTime ? 'start teaching!' : 'make it available to students!'}</li>
      </ul>
    </div>
  </div>
);

interface CourseSetupStepProps {
  data: Partial<CreateCourseData>;
  onChange: (data: Partial<CreateCourseData>) => void;
}

const CourseSetupStep: React.FC<CourseSetupStepProps> = ({ data, onChange }) => {
  const handleChange = (field: keyof CreateCourseData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  // Generate course code and class code when component mounts or course name changes
  React.useEffect(() => {
    if (data.title) {
      // Generate course code (e.g., "CS101" from "Computer Science 101")
      if (!data.code) {
        const courseCode = data.title
          .split(' ')
          .map(word => word.charAt(0).toUpperCase())
          .join('')
          .substring(0, 3);
        const randomNum = Math.floor(Math.random() * 90) + 10;
        const generatedCourseCode = `${courseCode}${randomNum}`;
        handleChange('code', generatedCourseCode);
      }
      
      // Generate class code (e.g., "CS1011234" for students to join)
      if (!data.classCode) {
        const courseCode = data.title
          .split(' ')
          .map(word => word.charAt(0).toUpperCase())
          .join('')
          .substring(0, 3);
        const randomNum = Math.floor(Math.random() * 9000) + 1000;
        const generatedClassCode = `${courseCode}${randomNum}`;
        handleChange('classCode', generatedClassCode);
      }
    }
  }, [data.title]);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Course Name *
        </label>
        <input
          type="text"
          value={data.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
          placeholder="e.g., Introduction to Computer Science"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Class Code (for students to join) *
        </label>
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-mono text-lg text-gray-800">
                {data.classCode || 'Generating...'}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Students will use this code to join your class
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const courseCode = (data.title || 'COURSE')
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase())
                  .join('')
                  .substring(0, 3);
                
                // Regenerate course code
                const courseCodeNum = Math.floor(Math.random() * 90) + 10;
                const generatedCourseCode = `${courseCode}${courseCodeNum}`;
                handleChange('code', generatedCourseCode);
                
                // Regenerate class code
                const randomNum = Math.floor(Math.random() * 9000) + 1000;
                const generatedClassCode = `${courseCode}${randomNum}`;
                handleChange('classCode', generatedClassCode);
              }}
              className="px-3 py-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#9B5DE5] transition-colors"
            >
              🔄 Regenerate
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          value={data.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Describe what students will learn in this course..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Department
          </label>
          <select
            value={data.department || ''}
            onChange={(e) => handleChange('department', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
          >
            <option value="">Select Department</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Biology">Biology</option>
            <option value="English">English</option>
            <option value="History">History</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Semester
          </label>
          <select
            value={data.semester || ''}
            onChange={(e) => handleChange('semester', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
          >
            <option value="">Select Semester</option>
            {SEMESTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Year
          </label>
          <input
            type="number"
            value={data.year || new Date().getFullYear()}
            onChange={(e) => handleChange('year', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
            min="2020"
            max="2030"
          />
        </div>
      </div>

      {/* Course Privacy Setting */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Course Visibility
        </label>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              id="privacy-public"
              name="privacy"
              value="public"
              checked={data.settings?.privacy === 'public' || !data.settings?.privacy}
              onChange={(e) => {
                const newSettings = {
                  ...data.settings,
                  privacy: e.target.value as 'public' | 'private'
                };
                handleChange('settings', newSettings);
              }}
              className="h-4 w-4 text-[#4A90E2] focus:ring-[#4A90E2] border-gray-300"
            />
            <label htmlFor="privacy-public" className="flex-1">
              <div className="font-medium text-gray-900">Public Course</div>
              <div className="text-sm text-gray-500">
                Students can search and discover this course in the course directory
              </div>
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              id="privacy-private"
              name="privacy"
              value="private"
              checked={data.settings?.privacy === 'private'}
              onChange={(e) => {
                const newSettings = {
                  ...data.settings,
                  privacy: e.target.value as 'public' | 'private'
                };
                handleChange('settings', newSettings);
              }}
              className="h-4 w-4 text-[#4A90E2] focus:ring-[#4A90E2] border-gray-300"
            />
            <label htmlFor="privacy-private" className="flex-1">
              <div className="font-medium text-gray-900">Private Course</div>
              <div className="text-sm text-gray-500">
                Only students with the class code can join this course
              </div>
            </label>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          You can change this setting later in your course settings.
        </p>
      </div>

      {/* Course Color Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Course Color Theme
        </label>
        <div className="grid grid-cols-6 gap-3">
          {[
            { name: 'Sky Blue', value: '#4A90E2' },
            { name: 'Coral', value: '#FF6F61' },
            { name: 'Golden Yellow', value: '#FFD166' },
            { name: 'Mint Green', value: '#06D6A0' },
            { name: 'Lavender', value: '#9B5DE5' },
            { name: 'Charcoal', value: '#333333' }
          ].map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => handleChange('backgroundColor', color.value)}
              className={`w-12 h-12 rounded-lg border-2 transition-all duration-200 ${
                data.backgroundColor === color.value
                  ? 'border-gray-800 scale-110 shadow-lg'
                  : 'border-gray-300 hover:scale-105'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Choose a color theme for your course. This will help students easily identify your class.
        </p>
      </div>
    </div>
  );
};

interface AddStudentsStepProps {
  students: Array<{email: string, name: string}>;
  onChange: (students: Array<{email: string, name: string}>) => void;
}

const AddStudentsStep: React.FC<AddStudentsStepProps> = ({ students, onChange }) => {
  const [newStudent, setNewStudent] = useState({ email: '', name: '' });

  const addStudent = () => {
    if (newStudent.email && newStudent.name) {
      onChange([...students, newStudent]);
      setNewStudent({ email: '', name: '' });
    }
  };

  const removeStudent = (index: number) => {
    onChange(students.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#4A90E2]/10 rounded-lg p-4">
        <h4 className="font-semibold text-[#4A90E2] mb-2">Share Your Class Code</h4>
        <p className="text-[#4A90E2] text-sm">
          Students can join your class using the class code you generated. You can also add students manually now or they can join later using the code.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Student Name
          </label>
          <input
            type="text"
            value={newStudent.name}
            onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
            placeholder="Enter student's full name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={newStudent.email}
            onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
            placeholder="student@example.com"
          />
        </div>
      </div>

      <button
        onClick={addStudent}
        disabled={!newStudent.email || !newStudent.name}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Add Student
      </button>

      {students.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Added Students ({students.length})</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {students.map((student, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{student.name}</p>
                  <p className="text-sm text-gray-600">{student.email}</p>
                </div>
                <button
                  onClick={() => removeStudent(index)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface CreateAssignmentStepProps {
  data: Partial<Assignment>;
  onChange: (data: Partial<Assignment>) => void;
  courseId?: string;
}

const CreateAssignmentStep: React.FC<CreateAssignmentStepProps> = ({ data, onChange, courseId }) => {
  const handleChange = (field: keyof Assignment, value: any) => {
    console.log('CreateAssignmentStep - handleChange:', field, value);
    const updatedData = { ...data, [field]: value };
    
    // Auto-set peer review due date when peer review is enabled and no due date is set
    if (field === 'peerReview' && value === true && !updatedData.peerReviewDueDate && updatedData.dueDate) {
      const assignmentDueDate = new Date(updatedData.dueDate);
      const peerReviewDueDate = new Date(assignmentDueDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later
      updatedData.peerReviewDueDate = peerReviewDueDate.toISOString().slice(0, 16); // Format for datetime-local input
    }
    
    // Auto-update peer review due date when assignment due date changes (if peer review is enabled)
    if (field === 'dueDate' && updatedData.peerReview && updatedData.dueDate) {
      const assignmentDueDate = new Date(updatedData.dueDate);
      const peerReviewDueDate = new Date(assignmentDueDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later
      updatedData.peerReviewDueDate = peerReviewDueDate.toISOString().slice(0, 16); // Format for datetime-local input
    }
    
    console.log('CreateAssignmentStep - updatedData:', updatedData);
    onChange(updatedData);
  };

  console.log('CreateAssignmentStep - data:', data);
  console.log('CreateAssignmentStep - peerReview:', data.peerReview);
  console.log('CreateAssignmentStep - title:', data.title);
  console.log('CreateAssignmentStep - title length:', data.title?.length);

  // Validation for immediate feedback
  const isTitleValid = data.title && data.title.trim().length >= 3;
  const isDescriptionValid = data.description && data.description.trim().length >= 10;
  
  // Peer review due date validation
  const isPeerReviewDueDateValid = !data.peerReview || !data.peerReviewDueDate || 
    (data.dueDate && data.peerReviewDueDate && new Date(data.peerReviewDueDate) > new Date(data.dueDate));

  return (
    <div className="space-y-6">
      <div className="bg-green-50 rounded-lg p-4">
        <h4 className="font-semibold text-green-900 mb-2">Create Your First Assignment</h4>
        <p className="text-green-800 text-sm">
          This will be the first assignment your students see when they join the course.
        </p>
      </div>

      {/* Validation feedback */}
      {data.title && !isTitleValid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">
            ⚠️ Assignment title must be at least 3 characters long.
          </p>
        </div>
      )}

      {data.description && !isDescriptionValid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">
            ⚠️ Description must be at least 10 characters long.
          </p>
        </div>
      )}

      {data.peerReview && data.peerReviewDueDate && !isPeerReviewDueDateValid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">
            ⚠️ Peer review due date must be after the assignment due date.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Assignment Title *
        </label>
        <input
          type="text"
          value={data.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Introduction Video Assignment"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          value={data.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Describe what students need to do for this assignment..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Due Date
          </label>
          <input
            type="datetime-local"
            value={data.dueDate || ''}
            onChange={(e) => handleChange('dueDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Points
          </label>
          <input
            type="number"
            value={data.maxScore || 100}
            onChange={(e) => handleChange('maxScore', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
            min="1"
            max="1000"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Assignment Type
        </label>
        <select
          value={data.assignmentType || 'video'}
          onChange={(e) => handleChange('assignmentType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="video">Video Submission</option>
          <option value="text">Text Submission</option>
          <option value="file">File Upload</option>
          <option value="quiz">Quiz</option>
        </select>
      </div>

      {/* Peer Review Section */}
      <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
          <span className="mr-2">🔍</span>
          Peer Review Settings
          <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">NEW</span>
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="peerReview"
              checked={data.peerReview || false}
              onChange={(e) => handleChange('peerReview', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="peerReview" className="text-sm font-medium text-blue-900">
              Enable peer review for this assignment
            </label>
          </div>

          {data.peerReview && (
            <div className="ml-7 space-y-4 bg-blue-100 p-4 rounded-lg border border-blue-300">
              <div className="flex items-center text-blue-800 font-medium mb-3">
                <span className="mr-2">✅</span>
                Peer Review Enabled - Configure Settings Below
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-2">
                  Peer Review Scope
                </label>
                <select
                  value={data.peerReviewScope || 'section'}
                  onChange={(e) => handleChange('peerReviewScope', e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="section">Within Section Only</option>
                  <option value="course">Entire Course</option>
                  <option value="random">Random Assignment</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">
                    Reviews per Submission
                  </label>
                  <input
                    type="number"
                    value={data.peerReviewCount || 3}
                    onChange={(e) => handleChange('peerReviewCount', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    min="1"
                    max="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">
                    Peer Review Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={data.peerReviewDueDate || ''}
                    onChange={(e) => handleChange('peerReviewDueDate', e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    min={data.dueDate || ''}
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    Reviews must be completed by this date and time
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="anonymousReview"
                    checked={data.anonymousReview || true}
                    onChange={(e) => handleChange('anonymousReview', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="anonymousReview" className="text-sm font-medium text-blue-800">
                    Anonymous peer reviews
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="selfReview"
                    checked={data.allowSelfReview || false}
                    onChange={(e) => handleChange('allowSelfReview', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="selfReview" className="text-sm font-medium text-blue-800">
                    Allow students to review their own submissions
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="instructorReview"
                    checked={data.instructorReview || true}
                    onChange={(e) => handleChange('instructorReview', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="instructorReview" className="text-sm font-medium text-blue-800">
                    Instructor reviews peer feedback
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-800 mb-2">
                  Peer Review Instructions
                </label>
                <textarea
                  value={data.peerReviewInstructions || ''}
                  onChange={(e) => handleChange('peerReviewInstructions', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Provide specific instructions for peer reviewers..."
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Assignment Settings */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Additional Settings</h4>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="allowLateSubmission"
              checked={data.allowLateSubmission || false}
              onChange={(e) => handleChange('allowLateSubmission', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="allowLateSubmission" className="text-sm font-medium text-gray-700">
              Allow late submissions
            </label>
          </div>

          {data.allowLateSubmission && (
            <div className="ml-7">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Late Penalty (% per day)
              </label>
              <input
                type="number"
                value={data.latePenalty || 0}
                onChange={(e) => handleChange('latePenalty', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          )}

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="groupAssignment"
              checked={data.groupAssignment || false}
              onChange={(e) => handleChange('groupAssignment', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="groupAssignment" className="text-sm font-medium text-gray-700">
              Group assignment
            </label>
          </div>

          {data.groupAssignment && (
            <div className="ml-7">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Group Size
              </label>
              <input
                type="number"
                value={data.maxGroupSize || 4}
                onChange={(e) => handleChange('maxGroupSize', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                min="2"
                max="10"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Submissions
            </label>
            <input
              type="number"
              value={data.maxSubmissions || 1}
              onChange={(e) => handleChange('maxSubmissions', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              min="1"
              max="10"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface PublishCourseStepProps {
  courseData: Partial<CreateCourseData>;
  assignmentData: Partial<Assignment>;
  students: Array<{email: string, name: string}>;
  isFirstTime?: boolean;
  hasMultipleSections: boolean | null;
  sections: Section[];
}

const PublishCourseStep: React.FC<PublishCourseStepProps> = ({ 
  courseData, 
  assignmentData, 
  students, 
  isFirstTime = false,
  hasMultipleSections,
  sections
}) => (
  <div className="space-y-6">
    <div className="bg-yellow-50 rounded-lg p-4">
      <h4 className="font-semibold text-yellow-900 mb-2">
        {isFirstTime ? 'Review Your Course' : 'Review Your Class'}
      </h4>
      <p className="text-yellow-800 text-sm">
        {isFirstTime 
          ? 'Review all the information below before publishing your course.'
          : 'Review all the information below before publishing your new class.'
        }
      </p>
    </div>

    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="font-semibold text-gray-900 mb-2">Course Information</h5>
        <div className="space-y-1 text-sm">
          <p><span className="font-medium">Name:</span> {courseData.title}</p>
          <p><span className="font-medium">Course Code:</span> {courseData.code}</p>
          <p><span className="font-medium">Class Code:</span> {courseData.classCode}</p>
          <p><span className="font-medium">Department:</span> {courseData.department}</p>
          <p><span className="font-medium">Semester:</span> {courseData.semester} {courseData.year}</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="font-semibold text-gray-900 mb-2">Course Structure</h5>
        <div className="space-y-3 text-sm">
          <p><span className="font-medium">Structure:</span> {hasMultipleSections ? 'Multiple Sections' : 'Single Section'}</p>
          <p><span className="font-medium">Peer Reviews:</span> Configured per assignment</p>
          
          {sections.length > 0 && (
            <div className="mt-3">
              <p className="font-medium mb-2">Sections & Class Codes:</p>
              {sections.map((section, index) => (
                <div key={index} className="ml-2 mb-1">
                  <span className="font-medium">{section.sectionName}</span>
                  {section.sectionCode && ` (${section.sectionCode})`}
                  {section.classCode && (
                    <span className="ml-2 text-blue-600 font-mono font-semibold">
                      Code: {section.classCode}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="font-semibold text-gray-900 mb-2">Assignment</h5>
        <div className="space-y-1 text-sm">
          <p><span className="font-medium">Title:</span> {assignmentData.title}</p>
          <p><span className="font-medium">Type:</span> {assignmentData.assignmentType}</p>
          <p><span className="font-medium">Points:</span> {assignmentData.maxScore}</p>
          <p><span className="font-medium">Due Date:</span> {assignmentData.dueDate}</p>
          {assignmentData.peerReview && (
            <div className="mt-2 pt-2 border-t border-gray-300">
              <p className="font-medium text-blue-700">Peer Review Settings:</p>
              <p><span className="font-medium">Scope:</span> {assignmentData.peerReviewScope}</p>
              <p><span className="font-medium">Reviews per submission:</span> {assignmentData.peerReviewCount}</p>
              <p><span className="font-medium">Review deadline:</span> {assignmentData.peerReviewDueDate ? new Date(assignmentData.peerReviewDueDate).toLocaleString() : 'Not set'}</p>
              <p><span className="font-medium">Anonymous:</span> {assignmentData.anonymousReview ? 'Yes' : 'No'}</p>
              {assignmentData.peerReviewInstructions && (
                <p><span className="font-medium">Instructions:</span> {assignmentData.peerReviewInstructions.substring(0, 100)}...</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="font-semibold text-gray-900 mb-2">Students ({students.length})</h5>
        {students.length > 0 ? (
          <div className="space-y-1 text-sm">
            {students.map((student, index) => (
              <p key={index}>{student.name} ({student.email})</p>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No students added yet</p>
        )}
      </div>
    </div>
  </div>
);

interface CompleteStepProps {
  isFirstTime?: boolean;
  courseData: Partial<CreateCourseData>;
  sections: Section[];
  students: Array<{email: string, name: string}>;
  assignmentData: Partial<Assignment>;
  hasMultipleSections: boolean | null;
}

const CompleteStep: React.FC<CompleteStepProps> = ({ 
  isFirstTime = false, 
  courseData, 
  sections, 
  students, 
  assignmentData, 
  hasMultipleSections
}) => (
  <div className="text-center space-y-6">
    <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
      <span className="text-4xl">🎉</span>
    </div>
    <div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">
        {isFirstTime ? 'Congratulations!' : 'Class Created!'}
      </h3>
      <p className="text-gray-600 text-lg leading-relaxed">
        {isFirstTime 
          ? 'Your course is now live and ready for students! You can start teaching and managing your class right away.'
          : 'Your new class is now live and ready for students! You can start managing it right away.'
        }
      </p>
    </div>
    <div className="bg-green-50 rounded-lg p-4">
      <h4 className="font-semibold text-green-900 mb-2">What's next?</h4>
      <ul className="text-green-800 space-y-1 text-left">
        <li>• {isFirstTime ? 'Students will receive email invitations to join your course' : 'Share the class code with students to join'}</li>
        <li>• You can create more assignments from your dashboard</li>
        <li>• Monitor student progress and submissions in real-time</li>
        <li>• Use AI tools to help with grading and feedback</li>
      </ul>
    </div>
  </div>
);

// Sections Question Step Component
interface SectionsQuestionStepProps {
  hasMultipleSections: boolean | null;
  setHasMultipleSections: (value: boolean) => void;
}

const SectionsQuestionStep: React.FC<SectionsQuestionStepProps> = ({
  hasMultipleSections,
  setHasMultipleSections
}) => {
  return (
    <div className="space-y-8">
      {/* Multiple Sections Question */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Will there be more than one section of this class?
        </h3>
        <p className="text-gray-600 mb-6">
          This helps us set up the right structure for grading and student interactions.
        </p>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setHasMultipleSections(false)}
            className={`px-8 py-4 rounded-lg border-2 transition-all ${
              hasMultipleSections === false
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="text-2xl mb-2">📚</div>
            <div className="font-medium">Single Section</div>
            <div className="text-sm text-gray-600">One class, all students together</div>
          </button>
          
          <button
            onClick={() => setHasMultipleSections(true)}
            className={`px-8 py-4 rounded-lg border-2 transition-all ${
              hasMultipleSections === true
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="text-2xl mb-2">🏫</div>
            <div className="font-medium">Multiple Sections</div>
            <div className="text-sm text-gray-600">Period 1, 2, 3 or Section A, B, C</div>
          </button>
        </div>
      </div>


      {/* Benefits Explanation */}
      {hasMultipleSections !== null && (
        <div className="bg-blue-50 rounded-lg p-6">
          <h5 className="font-semibold text-blue-900 mb-3">What this means:</h5>
          <ul className="text-blue-800 space-y-2 text-sm">
            {hasMultipleSections ? (
              <>
                <li>• You'll create separate class codes for each section</li>
                <li>• You can grade sections individually or all together</li>
                <li>• You can assign work to specific sections or all sections</li>
              </>
            ) : (
              <>
                <li>• You'll have one class code for all students</li>
                <li>• All students will be in the same group</li>
                <li>• Students can review videos from all classmates</li>
                <li>• Simpler setup for single-class courses</li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

// Sections Setup Step Component
interface SectionsSetupStepProps {
  sections: Section[];
  onChange: (sections: Section[]) => void;
  courseId?: string;
  instructorId?: string;
  showSectionForm: boolean;
  setShowSectionForm: (show: boolean) => void;
  hasMultipleSections: boolean | null;
  courseName?: string;
}

const SectionsSetupStep: React.FC<SectionsSetupStepProps> = ({
  sections,
  onChange,
  courseId,
  instructorId,
  showSectionForm,
  setShowSectionForm,
  hasMultipleSections,
  courseName
}) => {
  const generateClassCode = (sectionName: string, sectionIndex: number) => {
    const courseCode = (courseName || 'COURSE')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 3);
    
    if (hasMultipleSections) {
      // Generate unique class code for each section
      const sectionCode = sectionName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 2);
      const randomNum = Math.floor(Math.random() * 900) + 100;
      return `${courseCode}${sectionCode}${randomNum}`;
    } else {
      // Single class code for all sections
      const randomNum = Math.floor(Math.random() * 9000) + 1000;
      return `${courseCode}${randomNum}`;
    }
  };

  const handleCreateSection = async (sectionData: CreateSectionRequest) => {
    try {
      const classCode = generateClassCode(sectionData.sectionName, sections.length);
      
      // For the wizard, we'll create a temporary section object
      const newSection: Section = {
        sectionId: `temp-${Date.now()}`,
        courseId: courseId || 'temp-course',
        sectionName: sectionData.sectionName,
        sectionCode: sectionData.sectionCode,
        classCode: classCode, // Add class code to section
        maxEnrollment: sectionData.maxEnrollment || 30,
        currentEnrollment: 0,
        instructorId: instructorId || 'temp-instructor',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      };
      
      onChange([...sections, newSection]);
      setShowSectionForm(false);
    } catch (error) {
      console.error('Error creating section:', error);
    }
  };

  const handleEditSection = async (sectionId: string, updates: Partial<Section>) => {
    const updatedSections = sections.map(section =>
      section.sectionId === sectionId ? { ...section, ...updates } : section
    );
    onChange(updatedSections);
  };

  const handleDeleteSection = (sectionId: string) => {
    const updatedSections = sections.filter(section => section.sectionId !== sectionId);
    onChange(updatedSections);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Course Sections
        </h3>
        <p className="text-gray-600 text-sm">
          Create different sections for your course. This is useful if you teach the same course to multiple groups of students.
        </p>
      </div>

      {/* Sections List */}
      {sections.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <div className="text-4xl mb-4">🏫</div>
          <p className="text-gray-500 mb-2">No sections created yet</p>
          <p className="text-sm text-gray-400 mb-4">
            Create sections to organize your students into different class periods
          </p>
          <button
            onClick={() => setShowSectionForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create First Section
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-900">
              Sections ({sections.length})
            </h4>
            <button
              onClick={() => setShowSectionForm(true)}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Add Section
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sections.map((section) => (
              <div key={section.sectionId} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-gray-900">{section.sectionName}</h5>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => {
                        // For wizard, we'll just remove the section
                        handleDeleteSection(section.sectionId);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                
                {section.sectionCode && (
                  <p className="text-sm text-gray-600 mb-1">Section Code: {section.sectionCode}</p>
                )}
                
                {section.classCode && (
                  <p className="text-sm text-blue-600 mb-1 font-mono font-semibold">
                    Class Code: {section.classCode}
                  </p>
                )}
                
                <p className="text-sm text-gray-500 mb-1">
                  {section.currentEnrollment} / {section.maxEnrollment} students
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Form Modal */}
      {showSectionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <SectionForm
              courseId={courseId || 'temp-course'}
              instructorId={instructorId || 'temp-instructor'}
              onSave={handleCreateSection}
              onCancel={() => setShowSectionForm(false)}
              isEditing={false}
            />
          </div>
        </div>
      )}

      {/* Optional: Skip sections or create default */}
      {sections.length === 0 && (
        <div className="text-center">
          <button
            onClick={() => {
              // Create a default section with appropriate class code
              const classCode = generateClassCode('Main Section', 0);
              const defaultSection: Section = {
                sectionId: `default-${Date.now()}`,
                courseId: courseId || 'temp-course',
                sectionName: 'Main Section',
                sectionCode: 'A',
                classCode: classCode,
                maxEnrollment: 50,
                currentEnrollment: 0,
                instructorId: instructorId || 'temp-instructor',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isActive: true
              };
              onChange([defaultSection]);
            }}
            className="text-gray-500 hover:text-gray-700 text-sm underline"
          >
            {hasMultipleSections === false ? 'Create single section' : 'Skip and use single section'}
          </button>
        </div>
      )}
    </div>
  );
};

export default InstructorOnboardingWizard;
