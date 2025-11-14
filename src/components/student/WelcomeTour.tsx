'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TourStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector for highlighting
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface WelcomeTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  userFirstName?: string;
}

const WelcomeTour: React.FC<WelcomeTourProps> = ({
  isOpen,
  onClose,
  onComplete,
  userFirstName = 'Student'
}) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const tourSteps: TourStep[] = [
    {
      id: 'welcome',
      title: `Welcome to ClassCast, ${userFirstName}! 👋`,
      content: `We've made some exciting updates to make your learning experience even better. Let's take a quick tour to show you where everything is located.`,
      position: 'center'
    },
    {
      id: 'dashboard',
      title: 'Your Dashboard 🏠',
      content: `This is your home base! Here you can see all your courses, upcoming assignments, and recent activity. The dashboard gives you a quick overview of everything you need to know.`,
      target: '.dashboard-main',
      position: 'center'
    },
    {
      id: 'courses',
      title: 'Your Courses 📚',
      content: `These colorful buttons represent your enrolled courses. Click on any course button to view assignments, submit work, and see your grades for that specific course.`,
      target: '.course-buttons',
      position: 'top'
    },
    {
      id: 'assignments',
      title: 'Assignments & Due Dates 📝',
      content: `Your upcoming assignments are displayed here with due dates and status. Click on any assignment to view details, submit your work, or check your grade.`,
      target: '.assignments-section',
      position: 'left'
    },
    {
      id: 'video-feed',
      title: 'Community Video Feed 🎥',
      content: `See videos from your classmates here! You can watch, like, comment, and respond to peer submissions. This is where the collaborative learning happens.`,
      target: '.video-feed',
      position: 'right'
    },
    {
      id: 'navigation',
      title: 'Quick Navigation 🧭',
      content: `Use these navigation buttons to quickly access different areas: Community for peer videos, Assignments for all your work, and Profile for your account settings.`,
      target: '.bottom-nav',
      position: 'top'
    },
    {
      id: 'submit-work',
      title: 'How to Submit Work 📤',
      content: `To submit an assignment: 1) Click on the assignment card, 2) Click "Submit Assignment", 3) Choose to record, upload, or use a YouTube URL. It's that easy!`,
      position: 'center',
      action: {
        label: 'Show Me Assignments',
        onClick: () => router.push('/student/assignments')
      }
    },
    {
      id: 'complete',
      title: 'You\'re All Set! 🎉',
      content: `That's it! You now know how to navigate ClassCast. Remember, you can always find help by clicking your profile picture in the top right corner. Happy learning!`,
      position: 'center'
    }
  ];

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Add tour overlay class to body
      document.body.classList.add('tour-active');
    } else {
      setIsVisible(false);
      document.body.classList.remove('tour-active');
    }

    return () => {
      document.body.classList.remove('tour-active');
    };
  }, [isOpen]);

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    onClose();
    // Mark tour as completed so it doesn't show again
    localStorage.setItem('classcast-tour-completed', 'true');
  };

  const completeTour = () => {
    onComplete();
    localStorage.setItem('classcast-tour-completed', 'true');
    setCurrentStep(0);
  };

  const currentTourStep = tourSteps[currentStep];

  if (!isOpen || !isVisible) return null;

  return (
    <>
      {/* Tour Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 tour-overlay">
        {/* Highlight Target Element */}
        {currentTourStep.target && (
          <style jsx global>{`
            .tour-active ${currentTourStep.target} {
              position: relative;
              z-index: 51;
              box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.2);
              border-radius: 8px;
            }
          `}</style>
        )}

        {/* Tour Modal */}
        <div className={`fixed transform -translate-x-1/2 -translate-y-1/2 ${
          currentTourStep.position === 'center' ? 'top-1/2 left-1/2' :
          currentTourStep.position === 'top' ? 'top-1/4 left-1/2' :
          currentTourStep.position === 'bottom' ? 'top-3/4 left-1/2' :
          currentTourStep.position === 'left' ? 'top-1/2 left-1/4' :
          'top-1/2 left-3/4'
        } z-52`}>
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 max-w-md w-full mx-4">
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">
                  Step {currentStep + 1} of {tourSteps.length}
                </span>
                <button
                  onClick={skipTour}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Skip Tour
                </button>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {currentTourStep.title}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {currentTourStep.content}
              </p>
            </div>

            {/* Action Button */}
            {currentTourStep.action && (
              <div className="mb-4">
                <button
                  onClick={currentTourStep.action.onClick}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  {currentTourStep.action.label}
                </button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              
              <div className="flex items-center space-x-2">
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep ? 'bg-blue-600' : 
                      index < currentStep ? 'bg-blue-300' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextStep}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WelcomeTour;