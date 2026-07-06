'use client';

import React from 'react';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';

interface AIFeatureCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: 'available' | 'coming_soon';
}

const AI_FEATURES: AIFeatureCard[] = [
  {
    id: 'auto-grade-videos',
    title: 'Auto-Grade Videos',
    description: 'AI analyzes student videos against your rubric and suggests grades',
    icon: '🎬',
    status: 'available',
  },
  {
    id: 'assignment-ideas',
    title: 'Assignment Ideas',
    description: 'Get AI-generated assignment ideas for your subject area',
    icon: '💡',
    status: 'available',
  },
  {
    id: 'ai-rubric-maker',
    title: 'AI Rubric Maker',
    description: 'Generate a complete rubric from just an assignment description',
    icon: '📋',
    status: 'coming_soon',
  },
  {
    id: 'ai-assignment-maker',
    title: 'AI Assignment Maker',
    description: 'Create full assignments with instructions, rubrics, and resources',
    icon: '✨',
    status: 'coming_soon',
  },
  {
    id: 'ai-assignment-grader',
    title: 'AI Assignment Grader',
    description: 'Automatically grade all submissions for an assignment at once',
    icon: '🤖',
    status: 'coming_soon',
  },
];

const AIToolsPage: React.FC = () => {
  return (
    <InstructorRoute>
      <link
        href="https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Page Header */}
          <div className="mb-10">
            <h1
              className="text-3xl md:text-4xl font-bold uppercase text-[#005587]"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              AI TOOLS
            </h1>
            <p className="mt-2 text-gray-600 text-lg">
              Powerful AI features to help you create and grade faster
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AI_FEATURES.map((feature) => (
              <div
                key={feature.id}
                className={`bg-gray-50 rounded-2xl p-6 ${
                  feature.status === 'coming_soon' ? 'opacity-70' : ''
                }`}
              >
                {/* Icon */}
                <div className="text-4xl mb-4">{feature.icon}</div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-gray-500 text-sm mb-4">{feature.description}</p>

                {/* Status Badge */}
                {feature.status === 'available' ? (
                  <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                    Available
                  </span>
                ) : (
                  <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-[#FFC72C]/20 text-[#005587]">
                    Coming Soon
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </InstructorRoute>
  );
};

export default AIToolsPage;
