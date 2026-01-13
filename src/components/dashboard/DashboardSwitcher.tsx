'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { EyeIcon, ArrowPathIcon, SparklesIcon } from '@heroicons/react/24/outline';

const DashboardSwitcher: React.FC = () => {
  const router = useRouter();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Dashboard Preview</h3>
        <div className="space-y-2">
          <button
            onClick={() => router.push('/student/dashboard')}
            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
          >
            <EyeIcon className="w-4 h-4" />
            <span>Original Dashboard</span>
          </button>
          <button
            onClick={() => router.push('/student/dashboard-hybrid')}
            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-md"
          >
            <SparklesIcon className="w-4 h-4" />
            <span>Hybrid Dashboard</span>
          </button>
          <button
            onClick={() => router.push('/student/dashboard-udemy')}
            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>Udemy-Style Dashboard</span>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Switch between dashboard styles for comparison
        </p>
      </div>
    </div>
  );
};

export default DashboardSwitcher;