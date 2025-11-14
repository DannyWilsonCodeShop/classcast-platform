'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircleIcon, XCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  required: boolean;
  completed: boolean;
}

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onSkip }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Onboarding steps
  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to ClassCast!',
      description: 'Let\'s get you set up for success in your learning journey.',
      component: WelcomeStep,
      required: true,
      completed: completedSteps.has('welcome')
    },
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Tell us about yourself to personalize your experience.',
      component: ProfileStep,
      required: true,
      completed: completedSteps.has('profile')
    },
    {
      id: 'preferences',
      title: 'Set Your Preferences',
      description: 'Configure your notification and learning preferences.',
      component: PreferencesStep,
      required: false,
      completed: completedSteps.has('preferences')
    },
    {
      id: 'tutorial',
      title: 'Quick Tutorial',
      description: 'Learn how to navigate and use ClassCast effectively.',
      component: TutorialStep,
      required: false,
      completed: completedSteps.has('tutorial')
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'Welcome to ClassCast! You\'re ready to start learning.',
      component: CompleteStep,
      required: true,
      completed: completedSteps.has('complete')
    }
  ];

  const currentStepData = steps[currentStep];
  const CurrentComponent = currentStepData.component;

  const markStepComplete = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const skipOnboarding = async () => {
    setIsLoading(true);
    try {
      // Mark all steps as completed
      const allStepIds = steps.map(step => step.id);
      setCompletedSteps(new Set(allStepIds));
      
      // Save onboarding completion status
      await fetch('/api/user/onboarding-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true })
      });
      
      onSkip();
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Progress Bar */}
        <div className="h-2 bg-gray-200">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {currentStepData.title}
            </h1>
            <p className="text-gray-600">
              {currentStepData.description}
            </p>
          </div>

          <CurrentComponent
            user={user}
            onComplete={() => {
              markStepComplete(currentStepData.id);
              nextStep();
            }}
            onSkip={currentStepData.required ? undefined : nextStep}
          />

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex space-x-3">
              {currentStep < steps.length - 1 && (
                <button
                  onClick={skipOnboarding}
                  disabled={isLoading}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm"
                >
                  {isLoading ? 'Skipping...' : 'Skip Onboarding'}
                </button>
              )}

              <button
                onClick={nextStep}
                disabled={isLoading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <span>
                  {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                </span>
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Welcome Step Component
const WelcomeStep: React.FC<{
  user: any;
  onComplete: () => void;
  onSkip?: () => void;
}> = ({ user, onComplete }) => {
  return (
    <div className="text-center">
      <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">🎓</span>
      </div>
      
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        Welcome, {user?.firstName || 'Student'}!
      </h2>
      
      <p className="text-gray-600 mb-8 leading-relaxed">
        ClassCast is your platform for interactive video learning, peer collaboration, 
        and academic success. Let's set up your account to get the most out of your experience.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl mb-2">📹</div>
          <h3 className="font-semibold text-gray-900 mb-1">Video Learning</h3>
          <p className="text-sm text-gray-600">Submit video assignments and presentations</p>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-2xl mb-2">👥</div>
          <h3 className="font-semibold text-gray-900 mb-1">Peer Review</h3>
          <p className="text-sm text-gray-600">Collaborate and learn from classmates</p>
        </div>
        
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl mb-2">📊</div>
          <h3 className="font-semibold text-gray-900 mb-1">Track Progress</h3>
          <p className="text-sm text-gray-600">Monitor your academic performance</p>
        </div>
      </div>

      <button
        onClick={onComplete}
        className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Let's Get Started
      </button>
    </div>
  );
};

// Profile Step Component
const ProfileStep: React.FC<{
  user: any;
  onComplete: () => void;
  onSkip?: () => void;
}> = ({ user, onComplete }) => {
  const [profile, setProfile] = useState({
    bio: user?.bio || '',
    schoolName: user?.schoolName || '',
    classOf: user?.classOf || '',
    favoriteSubject: user?.favoriteSubject || '',
    hobbies: user?.hobbies || '',
    careerGoals: user?.careerGoals || ''
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/profile/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          id: user?.id
        })
      });
      onComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Tell us about yourself
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={3}
            placeholder="Tell us a bit about yourself..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            School Name
          </label>
          <input
            type="text"
            value={profile.schoolName}
            onChange={(e) => setProfile(prev => ({ ...prev, schoolName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Your school or university"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Graduation Year
          </label>
          <input
            type="text"
            value={profile.classOf}
            onChange={(e) => setProfile(prev => ({ ...prev, classOf: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., 2025"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Favorite Subject
          </label>
          <input
            type="text"
            value={profile.favoriteSubject}
            onChange={(e) => setProfile(prev => ({ ...prev, favoriteSubject: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Computer Science, Mathematics"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hobbies
          </label>
          <input
            type="text"
            value={profile.hobbies}
            onChange={(e) => setProfile(prev => ({ ...prev, hobbies: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Reading, Sports, Music"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Career Goals
          </label>
          <input
            type="text"
            value={profile.careerGoals}
            onChange={(e) => setProfile(prev => ({ ...prev, careerGoals: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Software Engineer, Data Scientist"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save Profile'}
      </button>
    </div>
  );
};

// Preferences Step Component
const PreferencesStep: React.FC<{
  user: any;
  onComplete: () => void;
  onSkip?: () => void;
}> = ({ user, onComplete }) => {
  const [preferences, setPreferences] = useState({
    email: true,
    push: false,
    sms: false,
    grade_received: true,
    assignment_created: true,
    assignment_reminder: true,
    submission_received: true
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          preferences
        })
      });
      onComplete();
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Notification Preferences
      </h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Email Notifications</h3>
            <p className="text-sm text-gray-600">Receive updates via email</p>
          </div>
          <input
            type="checkbox"
            checked={preferences.email}
            onChange={(e) => setPreferences(prev => ({ ...prev, email: e.target.checked }))}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Push Notifications</h3>
            <p className="text-sm text-gray-600">Receive browser notifications</p>
          </div>
          <input
            type="checkbox"
            checked={preferences.push}
            onChange={(e) => setPreferences(prev => ({ ...prev, push: e.target.checked }))}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h3 className="font-medium text-gray-900 mb-3">What would you like to be notified about?</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Grade received</span>
              <input
                type="checkbox"
                checked={preferences.grade_received}
                onChange={(e) => setPreferences(prev => ({ ...prev, grade_received: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">New assignment created</span>
              <input
                type="checkbox"
                checked={preferences.assignment_created}
                onChange={(e) => setPreferences(prev => ({ ...prev, assignment_created: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Assignment reminders</span>
              <input
                type="checkbox"
                checked={preferences.assignment_reminder}
                onChange={(e) => setPreferences(prev => ({ ...prev, assignment_reminder: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Submission received</span>
              <input
                type="checkbox"
                checked={preferences.submission_received}
                onChange={(e) => setPreferences(prev => ({ ...prev, submission_received: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex space-x-3 mt-6">
        <button
          onClick={onComplete}
          disabled={isSaving}
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>
        
        {onSkip && (
          <button
            onClick={onSkip}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
};

// Tutorial Step Component
const TutorialStep: React.FC<{
  user: any;
  onComplete: () => void;
  onSkip?: () => void;
}> = ({ user, onComplete }) => {
  const [currentTip, setCurrentTip] = useState(0);

  const tips = [
    {
      title: 'Dashboard Overview',
      description: 'Your dashboard shows your courses, assignments, and progress at a glance.',
      icon: '📊'
    },
    {
      title: 'Video Submissions',
      description: 'Record and submit video assignments directly through the platform.',
      icon: '📹'
    },
    {
      title: 'Peer Review',
      description: 'Review and provide feedback on your classmates\' work.',
      icon: '👥'
    },
    {
      title: 'Progress Tracking',
      description: 'Monitor your grades and academic performance over time.',
      icon: '📈'
    }
  ];

  const nextTip = () => {
    if (currentTip < tips.length - 1) {
      setCurrentTip(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const prevTip = () => {
    if (currentTip > 0) {
      setCurrentTip(prev => prev - 1);
    }
  };

  const currentTipData = tips[currentTip];

  return (
    <div className="max-w-md mx-auto text-center">
      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-3xl">{currentTipData.icon}</span>
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {currentTipData.title}
      </h2>

      <p className="text-gray-600 mb-8">
        {currentTipData.description}
      </p>

      {/* Tip Progress */}
      <div className="flex justify-center space-x-2 mb-8">
        {tips.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full ${
              index === currentTip ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      <div className="flex space-x-3">
        <button
          onClick={prevTip}
          disabled={currentTip === 0}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <button
          onClick={nextTip}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          {currentTip === tips.length - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
};

// Complete Step Component
const CompleteStep: React.FC<{
  user: any;
  onComplete: () => void;
  onSkip?: () => void;
}> = ({ user, onComplete }) => {
  return (
    <div className="text-center">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircleIcon className="w-12 h-12 text-green-600" />
      </div>

      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        You're All Set!
      </h2>

      <p className="text-gray-600 mb-8">
        Welcome to ClassCast! You're now ready to start your learning journey. 
        Explore your dashboard, join courses, and begin submitting video assignments.
      </p>

      <div className="bg-indigo-50 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-2">What's Next?</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Explore your dashboard to see your courses</li>
          <li>• Check out available assignments</li>
          <li>• Start recording your first video submission</li>
          <li>• Connect with your classmates</li>
        </ul>
      </div>

      <button
        onClick={onComplete}
        className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Go to Dashboard
      </button>
    </div>
  );
};

export default OnboardingFlow;
