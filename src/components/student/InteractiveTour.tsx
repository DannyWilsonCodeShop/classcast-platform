'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface TourStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector or element ID
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    label: string;
    onClick: () => void;
  };
  highlight?: boolean;
}

interface InteractiveTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  userFirstName?: string;
}

const InteractiveTour: React.FC<InteractiveTourProps> = ({
  isOpen,
  onClose,
  onComplete,
  userFirstName = 'Student'
}) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentTourStep = tourSteps[currentStep];

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
    localStorage.setItem('classcast-interactive-tour-completed', 'true');
  };

  const completeTour = () => {
    onComplete();
    localStorage.setItem('classcast-interactive-tour-completed', 'true');
    setCurrentStep(0);
  };

  const tourSteps: TourStep[] = [
    {
      id: 'welcome',
      title: `Welcome to the New ClassCast! 🎉`,
      content: `Hi ${userFirstName}! We've redesigned ClassCast to make it easier and more intuitive. Let's take a quick tour to show you where everything is.`,
      position: 'center'
    },
    {
      id: 'dashboard-overview',
      title: 'Your Dashboard Home 🏠',
      content: `This is your main dashboard where you can see everything at a glance: your courses, upcoming assignments, recent videos from classmates, and important notifications.`,
      target: '.dashboard-container',
      position: 'center',
      highlight: true
    },
    {
      id: 'course-navigation',
      title: 'Course Quick Access 📚',
      content: `These course buttons at the bottom give you instant access to each of your classes. Click any course button to see assignments and content for that specific course.`,
      target: '.course-buttons, .bottom-nav',
      position: 'top',
      highlight: true
    },
    {
      id: 'assignments-section',
      title: 'Your Assignments 📝',
      content: `All your assignments are displayed here with clear due dates and status indicators. Green means completed, yellow means due soon, and red means overdue.`,
      target: '.assignments-grid, .assignment-card',
      position: 'left',
      highlight: true
    },
    {
      id: 'video-submissions',
      title: 'How to Submit Work 🎥',
      content: `To submit an assignment: 1) Click on the assignment card, 2) Click the "Submit Assignment" button, 3) Choose to record live, upload a file, or paste a YouTube URL.`,
      position: 'center',
      action: {
        label: 'Show Me How',
        onClick: () => {
          // Find an assignment to demonstrate with
          const assignmentCards = document.querySelectorAll('.assignment-card');
          if (assignmentCards.length > 0) {
            (assignmentCards[0] as HTMLElement).scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => {
              (assignmentCards[0] as HTMLElement).click();
            }, 1000);
          }
        }
      }
    },
    {
      id: 'community-feed',
      title: 'Community & Peer Learning 👥',
      content: `The video feed shows submissions from your classmates. You can watch, like, comment, and provide peer responses. This collaborative learning helps everyone improve!`,
      target: '.video-feed, .community-section',
      position: 'right',
      highlight: true
    },
    {
      id: 'navigation-menu',
      title: 'Main Navigation 🧭',
      content: `Use these buttons to navigate: Home (dashboard), Community (all peer videos), Assignments (your work), and Profile (account settings). Everything is just one click away!`,
      target: '.main-nav, .nav-buttons',
      position: 'top',
      highlight: true
    },
    {
      id: 'grades-feedback',
      title: 'Grades & Feedback 📊',
      content: `Check your grades by clicking on completed assignments. You'll see your score, instructor feedback, and peer responses all in one place.`,
      target: '.grade-display, .assignment-status',
      position: 'bottom',
      highlight: true
    },
    {
      id: 'help-support',
      title: 'Need Help? 💡',
      content: `If you ever get stuck, click your profile picture in the top right corner for help options, or look for the "?" help icons throughout the interface.`,
      target: '.profile-menu, .user-avatar',
      position: 'bottom',
      highlight: true
    },
    {
      id: 'complete',
      title: 'You\'re Ready to Go! 🚀',
      content: `That's everything! You now know how to navigate ClassCast, submit assignments, and engage with your classmates. Remember: when in doubt, start from the dashboard. Happy learning!`,
      position: 'center'
    }
  ];

  useEffect(() => {
    if (isOpen && currentStep < tourSteps.length) {
      const step = tourSteps[currentStep];
      
      if (step.target) {
        // Find target element
        const element = document.querySelector(step.target) as HTMLElement;
        if (element) {
          setTargetElement(element);
          
          // Scroll element into view
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'center'
          });
          
          // Calculate tooltip position
          setTimeout(() => {
            const rect = element.getBoundingClientRect();
            const tooltipRect = tooltipRef.current?.getBoundingClientRect();
            
            let top = 0;
            let left = 0;
            
            switch (step.position) {
              case 'top':
                top = rect.top - (tooltipRect?.height || 200) - 20;
                left = rect.left + rect.width / 2 - (tooltipRect?.width || 300) / 2;
                break;
              case 'bottom':
                top = rect.bottom + 20;
                left = rect.left + rect.width / 2 - (tooltipRect?.width || 300) / 2;
                break;
              case 'left':
                top = rect.top + rect.height / 2 - (tooltipRect?.height || 200) / 2;
                left = rect.left - (tooltipRect?.width || 300) - 20;
                break;
              case 'right':
                top = rect.top + rect.height / 2 - (tooltipRect?.height || 200) / 2;
                left = rect.right + 20;
                break;
              default:
                top = window.innerHeight / 2 - (tooltipRect?.height || 200) / 2;
                left = window.innerWidth / 2 - (tooltipRect?.width || 300) / 2;
            }
            
            // Keep tooltip within viewport
            top = Math.max(20, Math.min(top, window.innerHeight - (tooltipRect?.height || 200) - 20));
            left = Math.max(20, Math.min(left, window.innerWidth - (tooltipRect?.width || 300) - 20));
            
            setTooltipPosition({ top, left });
          }, 100);
        } else {
          setTargetElement(null);
        }
      } else {
        setTargetElement(null);
        // Center the tooltip for non-targeted steps
        setTooltipPosition({
          top: window.innerHeight / 2 - 150,
          left: window.innerWidth / 2 - 200
        });
      }
    }
  }, [currentStep, isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-50" />
      
      {/* Highlight Spotlight */}
      {targetElement && tourSteps[currentStep].highlight && (
        <div 
          className="fixed z-51 pointer-events-none"
          style={{
            top: targetElement.getBoundingClientRect().top - 8,
            left: targetElement.getBoundingClientRect().left - 8,
            width: targetElement.getBoundingClientRect().width + 16,
            height: targetElement.getBoundingClientRect().height + 16,
            boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.8), 0 0 0 8px rgba(59, 130, 246, 0.4), 0 0 0 9999px rgba(0, 0, 0, 0.6)',
            borderRadius: '12px',
            transition: 'all 0.3s ease'
          }}
        />
      )}

      {/* Tour Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-52 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 max-w-sm w-full mx-4"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transform: tourSteps[currentStep].position === 'center' ? 'translate(-50%, -50%)' : 'none'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">{currentStep + 1}</span>
            </div>
            <span className="text-xs font-medium text-gray-500">
              {currentStep + 1} of {tourSteps.length}
            </span>
          </div>
          <button
            onClick={skipTour}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            {currentTourStep.title}
          </h3>
          <p className="text-gray-700 text-sm leading-relaxed">
            {currentTourStep.content}
          </p>
        </div>

        {/* Action Button */}
        {currentTourStep.action && (
          <div className="mb-4">
            <button
              onClick={currentTourStep.action.onClick}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
            >
              {currentTourStep.action.label}
            </button>
          </div>
        )}

        {/* Progress Dots */}
        <div className="flex items-center justify-center space-x-2 mb-4">
          {tourSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep ? 'bg-blue-600' : 
                index < currentStep ? 'bg-blue-300' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Back
          </button>
          
          <button
            onClick={skipTour}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip Tour
          </button>

          <button
            onClick={nextStep}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            {currentStep === tourSteps.length - 1 ? 'Finish 🎉' : 'Next →'}
          </button>
        </div>
      </div>
    </>
  );
};

export default InteractiveTour;