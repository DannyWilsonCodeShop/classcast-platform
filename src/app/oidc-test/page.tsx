'use client';

import React from 'react';
import { OIDCAuthButtons } from '@/components/auth/OIDCAuthButtons';
import { useAuth } from 'react-oidc-context';

export default function OIDCTestPage() {
  const auth = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            OIDC Authentication Test
          </h1>
          
          <OIDCAuthButtons />
          
          {auth.isAuthenticated && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium text-gray-900">User Information</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <pre className="text-sm text-gray-700 overflow-auto">
                  {JSON.stringify(auth.user, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

