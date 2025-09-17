'use client';

import React, { useState, useCallback } from 'react';

interface StudentOnboardingWizardProps {
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

const StudentOnboardingWizard: React.FC<StudentOnboardingWizardProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  const steps: WizardStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to ClassCast! 🎓',
      description: 'Let\'s get you set up and ready to start learning.',
      component: <WelcomeStep />
    },
    {
      id: 'find-courses',
      title: 'Find Your Courses 📚',
      description: 'Discover and join courses you\'re enrolled in.',
      component: <FindCoursesStep 
        selectedCourse={selectedCourse}
        onSelectCourse={setSelectedCourse}
      />
    },
    {
      id: 'view-assignments',
      title: 'View Your Assignments 📝',
      description: 'See what assignments are available and their due dates.',
      component: <ViewAssignmentsStep 
        course={selectedCourse}
        selectedAssignment={selectedAssignment}
        onSelectAssignment={setSelectedAssignment}
      />
    },
    {
      id: 'submit-video',
      title: 'Submit Your First Video 🎥',
      description: 'Learn how to record and submit video assignments.',
      component: <SubmitVideoStep 
        assignment={selectedAssignment}
        course={selectedCourse}
      />
    },
    {
      id: 'track-progress',
      title: 'Track Your Progress 📊',
      description: 'Learn how to view your grades and track your learning.',
      component: <TrackProgressStep />
    },
    {
      id: 'complete',
      title: 'You\'re Ready to Learn! 🚀',
      description: 'Everything is set up and you\'re ready to start your learning journey.',
      component: <CompleteStep />
    }
  ];

  const handleNext = useCallback(async () => {
    if (currentStep < steps.length - 1) {
      setIsLoading(true);
      
      try {
        // Simulate any necessary API calls
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setCurrentStep(prev => prev + 1);
      } catch (error) {
        console.error('Error in step transition:', error);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{steps[currentStep].title}</h2>
              <p className="text-green-100 mt-1">{steps[currentStep].description}</p>
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
            <p className="text-sm text-green-100 mt-2">
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
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? 'Loading...' : currentStep === steps.length - 1 ? 'Complete' : 'Next'}
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
    <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
      <span className="text-4xl">🎓</span>
    </div>
    <div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">Welcome to ClassCast!</h3>
      <p className="text-gray-600 text-lg leading-relaxed">
        This quick tour will help you get familiar with the platform and start your learning journey. 
        Let's explore how to find courses, submit assignments, and track your progress!
      </p>
    </div>
    <div className="bg-green-50 rounded-lg p-4">
      <h4 className="font-semibold text-green-900 mb-2">What we'll cover:</h4>
      <ul className="text-green-800 space-y-1 text-left">
        <li>• Find and join your courses</li>
        <li>• View assignments and due dates</li>
        <li>• Learn to submit video assignments</li>
        <li>• Track your progress and grades</li>
      </ul>
    </div>
  </div>
);

interface FindCoursesStepProps {
  selectedCourse: any;
  onSelectCourse: (course: any) => void;
}

const FindCoursesStep: React.FC<FindCoursesStepProps> = ({ selectedCourse, onSelectCourse }) => {
  // Mock courses data - in real app, this would come from API
  const mockCourses = [
    {
      id: '1',
      name: 'Introduction to Computer Science',
      code: 'CS101',
      instructor: 'Dr. Sarah Johnson',
      description: 'Learn the fundamentals of programming and computer science.',
      enrolled: true
    },
    {
      id: '2',
      name: 'Advanced Mathematics',
      code: 'MATH301',
      instructor: 'Prof. Michael Chen',
      description: 'Advanced calculus and linear algebra concepts.',
      enrolled: true
    },
    {
      id: '3',
      name: 'Creative Writing',
      code: 'ENG201',
      instructor: 'Dr. Emily Rodriguez',
      description: 'Develop your creative writing skills and storytelling.',
      enrolled: false
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Your Courses</h4>
        <p className="text-blue-800 text-sm">
          Here are the courses you're enrolled in. Click on a course to select it for the next step.
        </p>
      </div>

      <div className="space-y-3">
        {mockCourses.map((course) => (
          <div
            key={course.id}
            onClick={() => onSelectCourse(course)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedCourse?.id === course.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900">{course.name}</h5>
                <p className="text-sm text-gray-600">{course.code} • {course.instructor}</p>
                <p className="text-sm text-gray-500 mt-1">{course.description}</p>
              </div>
              <div className="ml-4">
                {course.enrolled ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Enrolled
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Not Enrolled
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedCourse && (
        <div className="bg-green-50 rounded-lg p-4">
          <h5 className="font-semibold text-green-900 mb-2">Selected Course</h5>
          <p className="text-green-800 text-sm">
            Great! You've selected <strong>{selectedCourse.name}</strong>. 
            In the next step, we'll look at the assignments for this course.
          </p>
        </div>
      )}
    </div>
  );
};

interface ViewAssignmentsStepProps {
  course: any;
  selectedAssignment: any;
  onSelectAssignment: (assignment: any) => void;
}

const ViewAssignmentsStep: React.FC<ViewAssignmentsStepProps> = ({ 
  course, 
  selectedAssignment, 
  onSelectAssignment 
}) => {
  // Mock assignments data
  const mockAssignments = [
    {
      id: '1',
      title: 'Introduction Video Assignment',
      description: 'Record a 2-minute video introducing yourself and your goals for this course.',
      type: 'video',
      dueDate: '2024-02-15T23:59:00Z',
      points: 100,
      status: 'not_submitted'
    },
    {
      id: '2',
      title: 'Programming Exercise 1',
      description: 'Complete the basic programming exercises in Python.',
      type: 'text',
      dueDate: '2024-02-20T23:59:00Z',
      points: 50,
      status: 'not_submitted'
    },
    {
      id: '3',
      title: 'Midterm Project',
      description: 'Create a small application demonstrating the concepts learned.',
      type: 'file',
      dueDate: '2024-03-01T23:59:00Z',
      points: 200,
      status: 'not_submitted'
    }
  ];

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 rounded-lg p-4">
        <h4 className="font-semibold text-purple-900 mb-2">
          Assignments for {course?.name || 'Selected Course'}
        </h4>
        <p className="text-purple-800 text-sm">
          Here are the assignments for this course. Click on an assignment to learn how to submit it.
        </p>
      </div>

      <div className="space-y-3">
        {mockAssignments.map((assignment) => (
          <div
            key={assignment.id}
            onClick={() => onSelectAssignment(assignment)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedAssignment?.id === assignment.id
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h5 className="font-semibold text-gray-900">{assignment.title}</h5>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {assignment.points} pts
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>Due: {formatDueDate(assignment.dueDate)}</span>
                  <span className="capitalize">{assignment.type} submission</span>
                </div>
              </div>
              <div className="ml-4">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  assignment.status === 'submitted' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {assignment.status === 'submitted' ? 'Submitted' : 'Not Submitted'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedAssignment && (
        <div className="bg-green-50 rounded-lg p-4">
          <h5 className="font-semibold text-green-900 mb-2">Selected Assignment</h5>
          <p className="text-green-800 text-sm">
            Perfect! You've selected <strong>{selectedAssignment.title}</strong>. 
            In the next step, we'll learn how to submit this assignment.
          </p>
        </div>
      )}
    </div>
  );
};

interface SubmitVideoStepProps {
  assignment: any;
  course: any;
}

const SubmitVideoStep: React.FC<SubmitVideoStepProps> = ({ assignment, course }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);

  const startRecording = () => {
    setIsRecording(true);
    // Simulate recording
    setTimeout(() => {
      setIsRecording(false);
      setHasRecorded(true);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-orange-50 rounded-lg p-4">
        <h4 className="font-semibold text-orange-900 mb-2">How to Submit Video Assignments</h4>
        <p className="text-orange-800 text-sm">
          Video assignments are a great way to demonstrate your understanding. Let's learn how to record and submit them.
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h5 className="font-semibold text-gray-900 mb-2">Assignment Details</h5>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Title:</span> {assignment?.title}</p>
            <p><span className="font-medium">Description:</span> {assignment?.description}</p>
            <p><span className="font-medium">Points:</span> {assignment?.points}</p>
            <p><span className="font-medium">Due Date:</span> {assignment?.dueDate}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h5 className="font-semibold text-gray-900">Step-by-Step Guide</h5>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <p className="font-medium text-gray-900">Prepare Your Content</p>
                <p className="text-sm text-gray-600">Think about what you want to say and prepare any materials you need.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <p className="font-medium text-gray-900">Record Your Video</p>
                <p className="text-sm text-gray-600">Click the record button below to start recording. Make sure you have a good internet connection.</p>
                <div className="mt-2">
                  <button
                    onClick={startRecording}
                    disabled={isRecording || hasRecorded}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isRecording
                        ? 'bg-red-500 text-white cursor-not-allowed'
                        : hasRecorded
                        ? 'bg-green-500 text-white cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isRecording ? 'Recording...' : hasRecorded ? 'Video Recorded!' : 'Start Recording'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <p className="font-medium text-gray-900">Review and Submit</p>
                <p className="text-sm text-gray-600">Watch your video, make sure you're happy with it, then submit it for grading.</p>
              </div>
            </div>
          </div>
        </div>

        {hasRecorded && (
          <div className="bg-green-50 rounded-lg p-4">
            <h5 className="font-semibold text-green-900 mb-2">Great Job! 🎉</h5>
            <p className="text-green-800 text-sm">
              You've successfully recorded your video! In a real assignment, you would now be able to review and submit it.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const TrackProgressStep: React.FC = () => (
  <div className="space-y-6">
    <div className="bg-indigo-50 rounded-lg p-4">
      <h4 className="font-semibold text-indigo-900 mb-2">Track Your Learning Progress</h4>
      <p className="text-indigo-800 text-sm">
        Keep track of your assignments, grades, and overall progress in your courses.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="font-semibold text-gray-900 mb-3">Your Dashboard</h5>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Total Assignments:</span>
            <span className="font-medium">12</span>
          </div>
          <div className="flex justify-between">
            <span>Completed:</span>
            <span className="font-medium text-green-600">8</span>
          </div>
          <div className="flex justify-between">
            <span>Average Grade:</span>
            <span className="font-medium text-blue-600">B+</span>
          </div>
          <div className="flex justify-between">
            <span>Upcoming Due:</span>
            <span className="font-medium text-orange-600">3</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="font-semibold text-gray-900 mb-3">Recent Activity</h5>
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Submitted: Introduction Video</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Grade received: Programming Exercise 1</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>Due soon: Midterm Project</span>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-blue-50 rounded-lg p-4">
      <h5 className="font-semibold text-blue-900 mb-2">Tips for Success</h5>
      <ul className="text-blue-800 space-y-1 text-sm">
        <li>• Check your dashboard regularly for new assignments</li>
        <li>• Submit assignments before the due date to avoid late penalties</li>
        <li>• Review feedback from instructors to improve your work</li>
        <li>• Use the AI tutoring features if you need help understanding concepts</li>
      </ul>
    </div>
  </div>
);

const CompleteStep: React.FC = () => (
  <div className="text-center space-y-6">
    <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
      <span className="text-4xl">🚀</span>
    </div>
    <div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">You're Ready to Learn!</h3>
      <p className="text-gray-600 text-lg leading-relaxed">
        You now know how to navigate ClassCast, find your courses, submit assignments, and track your progress. 
        You're all set to start your learning journey!
      </p>
    </div>
    <div className="bg-green-50 rounded-lg p-4">
      <h4 className="font-semibold text-green-900 mb-2">What you can do now:</h4>
      <ul className="text-green-800 space-y-1 text-left">
        <li>• Access your courses from the dashboard</li>
        <li>• Submit assignments and track your progress</li>
        <li>• Use AI tools to get help with difficult concepts</li>
        <li>• Connect with classmates in the community feed</li>
        <li>• Access this tutorial anytime from the help section</li>
      </ul>
    </div>
  </div>
);

export default StudentOnboardingWizard;
