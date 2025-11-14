'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export interface EmptyStateAdvancedProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  illustration?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  suggestions?: string[];
  className?: string;
}

export const EmptyStateAdvanced: React.FC<EmptyStateAdvancedProps> = ({
  title,
  description,
  icon,
  illustration,
  primaryAction,
  secondaryAction,
  suggestions = [],
  className = '',
}) => {
  const getActionButtonClasses = (variant: 'primary' | 'secondary' | 'outline' = 'primary') => {
    const baseClasses = 'inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200';
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;
      case 'secondary':
        return `${baseClasses} bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500`;
      case 'outline':
        return `${baseClasses} bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-blue-500`;
      default:
        return baseClasses;
    }
  };

  return (
    <div className={`text-center py-16 px-4 ${className}`}>
      {/* Illustration or Icon */}
      <div className="mx-auto max-w-md">
        {illustration ? (
          <img
            src={illustration}
            alt=""
            className="mx-auto h-48 w-48 object-contain"
          />
        ) : (
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-100">
            {icon || (
              <svg
                className="h-12 w-12 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mt-8 max-w-2xl mx-auto">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">{description}</p>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="mb-8">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Here are some things you can do:</h4>
            <ul className="space-y-2 text-left max-w-md mx-auto">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  </div>
                  <span className="text-sm text-gray-600">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        {(primaryAction || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {primaryAction && (
              <button
                type="button"
                onClick={primaryAction.onClick}
                className={getActionButtonClasses(primaryAction.variant)}
              >
                {primaryAction.label}
              </button>
            )}
            {secondaryAction && (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className={getActionButtonClasses(secondaryAction.variant)}
              >
                {secondaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Specialized empty state components for common scenarios
export const EmptyAssignmentsState: React.FC<{ onExploreCourses?: () => void; onContactInstructor?: () => void }> = ({
  onExploreCourses,
  onContactInstructor
}) => {
  const router = useRouter();

  return (
    <EmptyStateAdvanced
      title="No Assignments Yet"
      description="It looks like you don't have any assignments at the moment. This could mean your instructor hasn't posted any assignments yet, or you might not be enrolled in any courses."
      icon={
        <svg className="h-12 w-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      }
      suggestions={[
        "Check if you're enrolled in any courses",
        "Contact your instructor if you're expecting assignments",
        "Explore available courses to enroll in",
        "Check back later as assignments may be posted soon"
      ]}
      primaryAction={{
        label: "Explore Courses",
        onClick: onExploreCourses || (() => router.push('/student/courses')),
        variant: 'primary'
      }}
      secondaryAction={{
        label: "Contact Instructor",
        onClick: onContactInstructor || (() => router.push('/student/support')),
        variant: 'outline'
      }}
    />
  );
};

export const EmptyCommunityState: React.FC<{ onCreatePost?: () => void }> = ({ onCreatePost }) => {
  return (
    <EmptyStateAdvanced
      title="Welcome to the Community!"
      description="Be the first to start a conversation! Share your thoughts, ask questions, or help your classmates by creating the first post."
      icon={
        <svg className="h-12 w-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      }
      suggestions={[
        "Share study tips and resources",
        "Ask questions about assignments",
        "Start a study group discussion",
        "Share interesting course-related content"
      ]}
      primaryAction={{
        label: "Create First Post",
        onClick: onCreatePost || (() => {}),
        variant: 'primary'
      }}
    />
  );
};
