'use client';

import React, { useState, useCallback } from 'react';
import { Course, CreateCourseData } from '@/types/course';
import { Assignment } from '@/types/dynamodb';

interface InstructorOnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
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
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [courseData, setCourseData] = useState<Partial<CreateCourseData>>({});
  const [assignmentData, setAssignmentData] = useState<Partial<Assignment>>({});
  const [students, setStudents] = useState<Array<{email: string, name: string}>>([]);

  const steps: WizardStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to ClassCast! 🎉',
      description: 'Let\'s set up your first course and get you started teaching.',
      component: <WelcomeStep />
    },
    {
      id: 'course-setup',
      title: 'Create Your First Course 📚',
      description: 'Set up your course with basic information and settings.',
      component: <CourseSetupStep 
        data={courseData} 
        onChange={setCourseData} 
      />
    },
    {
      id: 'add-students',
      title: 'Add Your Students 👥',
      description: 'Invite students to join your course.',
      component: <AddStudentsStep 
        students={students} 
        onChange={setStudents} 
      />
    },
    {
      id: 'create-assignment',
      title: 'Create Your First Assignment 📝',
      description: 'Set up an assignment for your students to complete.',
      component: <CreateAssignmentStep 
        data={assignmentData} 
        onChange={setAssignmentData}
        courseId={courseData.courseId}
      />
    },
    {
      id: 'publish-course',
      title: 'Publish Your Course 🚀',
      description: 'Review and publish your course to make it live.',
      component: <PublishCourseStep 
        courseData={courseData}
        assignmentData={assignmentData}
        students={students}
      />
    },
    {
      id: 'complete',
      title: 'You\'re All Set! 🎯',
      description: 'Your course is live and ready for students.',
      component: <CompleteStep />
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
        if (courseData.courseId) {
          // Save course
          console.log('Saving course:', courseData);
        }
        break;
      case 2: // Add students
        if (students.length > 0) {
          // Invite students
          console.log('Inviting students:', students);
        }
        break;
      case 3: // Create assignment
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
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
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
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
const WelcomeStep: React.FC = () => (
  <div className="text-center space-y-6">
    <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
      <span className="text-4xl">🎓</span>
    </div>
    <div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">Welcome to ClassCast!</h3>
      <p className="text-gray-600 text-lg leading-relaxed">
        This wizard will help you set up your first course, add students, and create assignments. 
        It only takes a few minutes to get everything ready!
      </p>
    </div>
    <div className="bg-blue-50 rounded-lg p-4">
      <h4 className="font-semibold text-blue-900 mb-2">What we'll cover:</h4>
      <ul className="text-blue-800 space-y-1 text-left">
        <li>• Create your first course with all the details</li>
        <li>• Add students and send them invitations</li>
        <li>• Set up your first assignment</li>
        <li>• Publish everything and start teaching!</li>
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Name *
          </label>
          <input
            type="text"
            value={data.courseName || ''}
            onChange={(e) => handleChange('courseName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Introduction to Computer Science"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Code *
          </label>
          <input
            type="text"
            value={data.courseCode || ''}
            onChange={(e) => handleChange('courseCode', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., CS101"
          />
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Semester</option>
            <option value="Fall">Fall</option>
            <option value="Spring">Spring</option>
            <option value="Summer">Summer</option>
            <option value="Winter">Winter</option>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="2020"
            max="2030"
          />
        </div>
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
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Add Students to Your Course</h4>
        <p className="text-blue-800 text-sm">
          You can add students now or invite them later. Students will receive an email invitation to join your course.
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
}

const PublishCourseStep: React.FC<PublishCourseStepProps> = ({ courseData, assignmentData, students }) => (
  <div className="space-y-6">
    <div className="bg-yellow-50 rounded-lg p-4">
      <h4 className="font-semibold text-yellow-900 mb-2">Review Your Course</h4>
      <p className="text-yellow-800 text-sm">
        Review all the information below before publishing your course.
      </p>
    </div>

    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="font-semibold text-gray-900 mb-2">Course Information</h5>
        <div className="space-y-1 text-sm">
          <p><span className="font-medium">Name:</span> {courseData.courseName}</p>
          <p><span className="font-medium">Code:</span> {courseData.courseCode}</p>
          <p><span className="font-medium">Department:</span> {courseData.department}</p>
          <p><span className="font-medium">Semester:</span> {courseData.semester} {courseData.year}</p>
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

const CompleteStep: React.FC = () => (
  <div className="text-center space-y-6">
    <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
      <span className="text-4xl">🎉</span>
    </div>
    <div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">Congratulations!</h3>
      <p className="text-gray-600 text-lg leading-relaxed">
        Your course is now live and ready for students! You can start teaching and managing your class right away.
      </p>
    </div>
    <div className="bg-green-50 rounded-lg p-4">
      <h4 className="font-semibold text-green-900 mb-2">What's next?</h4>
      <ul className="text-green-800 space-y-1 text-left">
        <li>• Students will receive email invitations to join your course</li>
        <li>• You can create more assignments from your dashboard</li>
        <li>• Monitor student progress and submissions in real-time</li>
        <li>• Use AI tools to help with grading and feedback</li>
      </ul>
    </div>
  </div>
);

export default InstructorOnboardingWizard;
