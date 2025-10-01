'use client';

import React, { useState, useCallback } from 'react';
import { Course, CreateCourseData } from '@/types/course';
import { Assignment } from '@/types/dynamodb';
import { SEMESTER_OPTIONS } from '@/constants/semesters';
import { Section, CreateSectionRequest } from '@/types/sections';
import { SectionForm } from '@/components/sections/SectionForm';

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
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [courseData, setCourseData] = useState<Partial<CreateCourseData>>({});
  const [assignmentData, setAssignmentData] = useState<Partial<Assignment>>({});
  const [students, setStudents] = useState<Array<{email: string, name: string}>>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [hasMultipleSections, setHasMultipleSections] = useState<boolean | null>(null);
  const [peerReviewScope, setPeerReviewScope] = useState<'section' | 'course'>('section');

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
        peerReviewScope={peerReviewScope}
        setPeerReviewScope={setPeerReviewScope}
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
        peerReviewScope={peerReviewScope}
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
        console.log('Course setup step - courseName:', courseData.courseName, 'courseCode:', courseData.courseCode);
        if (courseData.courseName && courseData.courseCode) {
          // Create course
          try {
            const courseResponse = await fetch('/api/courses', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title: courseData.courseName,
                description: courseData.description,
                code: courseData.courseCode,
                classCode: courseData.classCode,
                department: courseData.department,
                credits: courseData.credits,
                semester: courseData.semester,
                year: courseData.year,
                instructorId: courseData.instructorId,
                maxStudents: courseData.maxStudents,
                startDate: courseData.startDate,
                endDate: courseData.endDate,
                prerequisites: courseData.prerequisites,
                learningObjectives: courseData.learningObjectives,
                gradingPolicy: courseData.gradingPolicy,
                schedule: courseData.schedule,
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
              const sectionResponse = await fetch('/api/sections', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  courseId: courseData.courseId,
                  sectionName: section.sectionName,
                  sectionCode: section.sectionCode,
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
        if (assignmentData.assignmentId) {
          // Save assignment
          console.log('Saving assignment:', assignmentData);
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
              Skip for now
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
    if (data.courseName) {
      // Generate course code (e.g., "CS101" from "Computer Science 101")
      if (!data.courseCode) {
        const courseCode = data.courseName
          .split(' ')
          .map(word => word.charAt(0).toUpperCase())
          .join('')
          .substring(0, 3);
        const randomNum = Math.floor(Math.random() * 90) + 10;
        const generatedCourseCode = `${courseCode}${randomNum}`;
        handleChange('courseCode', generatedCourseCode);
      }
      
      // Generate class code (e.g., "CS1011234" for students to join)
      if (!data.classCode) {
        const courseCode = data.courseName
          .split(' ')
          .map(word => word.charAt(0).toUpperCase())
          .join('')
          .substring(0, 3);
        const randomNum = Math.floor(Math.random() * 9000) + 1000;
        const generatedClassCode = `${courseCode}${randomNum}`;
        handleChange('classCode', generatedClassCode);
      }
    }
  }, [data.courseName]);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Course Name *
        </label>
        <input
          type="text"
          value={data.courseName || ''}
          onChange={(e) => handleChange('courseName', e.target.value)}
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
                const courseCode = (data.courseName || 'COURSE')
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase())
                  .join('')
                  .substring(0, 3);
                
                // Regenerate course code
                const courseCodeNum = Math.floor(Math.random() * 90) + 10;
                const generatedCourseCode = `${courseCode}${courseCodeNum}`;
                handleChange('courseCode', generatedCourseCode);
                
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
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="bg-green-50 rounded-lg p-4">
        <h4 className="font-semibold text-green-900 mb-2">Create Your First Assignment</h4>
        <p className="text-green-800 text-sm">
          This will be the first assignment your students see when they join the course.
        </p>
      </div>

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
          value={data.type || 'video'}
          onChange={(e) => handleChange('type', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="video">Video Submission</option>
          <option value="text">Text Submission</option>
          <option value="file">File Upload</option>
          <option value="quiz">Quiz</option>
        </select>
      </div>
    </div>
  );
};

interface PublishCourseStepProps {
  courseData: Partial<CreateCourseData>;
  assignmentData: Partial<Assignment>;
  students: Array<{email: string, name: string}>;
  isFirstTime?: boolean;
}

const PublishCourseStep: React.FC<PublishCourseStepProps> = ({ courseData, assignmentData, students, isFirstTime = false }) => (
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
          <p><span className="font-medium">Name:</span> {courseData.courseName}</p>
          <p><span className="font-medium">Course Code:</span> {courseData.courseCode}</p>
          <p><span className="font-medium">Class Code:</span> {courseData.classCode}</p>
          <p><span className="font-medium">Department:</span> {courseData.department}</p>
          <p><span className="font-medium">Semester:</span> {courseData.semester} {courseData.year}</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="font-semibold text-gray-900 mb-2">Course Structure</h5>
        <div className="space-y-3 text-sm">
          <p><span className="font-medium">Structure:</span> {hasMultipleSections ? 'Multiple Sections' : 'Single Section'}</p>
          <p><span className="font-medium">Peer Reviews:</span> {peerReviewScope === 'section' ? 'Section Only' : 'Course Wide'}</p>
          
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
          <p><span className="font-medium">Type:</span> {assignmentData.type}</p>
          <p><span className="font-medium">Points:</span> {assignmentData.maxScore}</p>
          <p><span className="font-medium">Due Date:</span> {assignmentData.dueDate}</p>
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
  peerReviewScope: 'section' | 'course';
}

const CompleteStep: React.FC<CompleteStepProps> = ({ 
  isFirstTime = false, 
  courseData, 
  sections, 
  students, 
  assignmentData,
  hasMultipleSections,
  peerReviewScope
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
  peerReviewScope: 'section' | 'course';
  setPeerReviewScope: (scope: 'section' | 'course') => void;
}

const SectionsQuestionStep: React.FC<SectionsQuestionStepProps> = ({
  hasMultipleSections,
  setHasMultipleSections,
  peerReviewScope,
  setPeerReviewScope
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

      {/* Peer Review Scope Question */}
      {hasMultipleSections !== null && (
        <div className="border-t pt-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            How should students review each other's work?
          </h4>
          <p className="text-gray-600 mb-6 text-center">
            Choose whether students can review videos from their section only or from the entire course.
          </p>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setPeerReviewScope('section')}
              className={`px-6 py-3 rounded-lg border-2 transition-all ${
                peerReviewScope === 'section'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="text-xl mb-2">👥</div>
              <div className="font-medium">Section Only</div>
              <div className="text-sm text-gray-600">Students review peers in their section</div>
            </button>
            
            <button
              onClick={() => setPeerReviewScope('course')}
              className={`px-6 py-3 rounded-lg border-2 transition-all ${
                peerReviewScope === 'course'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="text-xl mb-2">🌐</div>
              <div className="font-medium">Course Wide</div>
              <div className="text-sm text-gray-600">Students review peers from all sections</div>
            </button>
          </div>
        </div>
      )}

      {/* Benefits Explanation */}
      {hasMultipleSections !== null && (
        <div className="bg-blue-50 rounded-lg p-6">
          <h5 className="font-semibold text-blue-900 mb-3">What this means:</h5>
          <ul className="text-blue-800 space-y-2 text-sm">
            {hasMultipleSections ? (
              <>
                <li>• You'll create separate class codes for each section</li>
                <li>• You can grade sections individually or all together</li>
                <li>• Students will only see videos from {peerReviewScope === 'section' ? 'their section' : 'all sections'}</li>
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
