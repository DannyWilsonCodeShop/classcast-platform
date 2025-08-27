'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function TestAuthPage() {
  const { user, login, logout, checkAuthStatus } = useAuth();
  const [message, setMessage] = useState('');
  const [testResults, setTestResults] = useState('');

  const testMockAuth = async () => {
    setMessage('Testing mock authentication...');
    try {
      // Test login with known credentials
      const result = await login('instructor@classcast.com', 'password123');
      setTestResults(`Login successful: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      setTestResults(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testLogout = async () => {
    try {
      await logout();
      setMessage('Logout successful');
    } catch (error) {
      setMessage(`Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testAuthStatus = async () => {
    try {
      await checkAuthStatus();
      setMessage('Auth status check completed');
    } catch (error) {
      setMessage(`Auth status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const debugMockService = () => {
    // Access the mock service directly to debug
    const mockService = (window as any).mockAuthService;
    if (mockService && mockService.debugState) {
      mockService.debugState();
      setMessage('Debug info logged to console');
    } else {
      setMessage('Mock service not accessible from window');
    }
  };

  const reinitializeMockService = () => {
    const mockService = (window as any).mockAuthService;
    if (mockService && mockService.reinitialize) {
      mockService.reinitialize();
      setMessage('Mock service reinitialized');
    } else {
      setMessage('Mock service not accessible from window');
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-[#0065a3] mb-8 text-center">
            Authentication Test Page
          </h1>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-xl font-bold text-[#0065a3] mb-4">Current Auth Status</h2>
            <div className="mb-4 p-4 bg-gray-100 rounded-lg">
              <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'Not logged in'}</p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={testMockAuth}
                className="w-full px-4 py-2 bg-[#0065a3] text-white rounded-lg hover:bg-[#005a8f]"
              >
                Test Mock Login (instructor@classcast.com / password123)
              </button>
              
              <button
                onClick={testLogout}
                className="w-full px-4 py-2 bg-[#f96464] text-white rounded-lg hover:bg-[#e55a5a]"
              >
                Test Logout
              </button>
              
              <button
                onClick={testAuthStatus}
                className="w-full px-4 py-2 bg-[#6cc3d3] text-white rounded-lg hover:bg-[#5bb2c2]"
              >
                Test Auth Status Check
              </button>
              
              <button
                onClick={debugMockService}
                className="w-full px-4 py-2 bg-[#9940b6] text-white rounded-lg hover:bg-[#8830a6]"
              >
                Debug Mock Service
              </button>
              
              <button
                onClick={reinitializeMockService}
                className="w-full px-4 py-2 bg-[#f1b313] text-white rounded-lg hover:bg-[#d4a012]"
              >
                Reinitialize Mock Service
              </button>
            </div>

            {message && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800">{message}</p>
              </div>
            )}
          </div>

          {testResults && (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8">
              <h2 className="text-xl font-bold text-[#0065a3] mb-4">Test Results</h2>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
                {testResults}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
