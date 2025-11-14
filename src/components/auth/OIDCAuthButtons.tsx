'use client';

import React from 'react';
import { useAuth } from 'react-oidc-context';

export function OIDCAuthButtons() {
  const auth = useAuth();

  const signOutRedirect = () => {
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const logoutUri = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const cognitoDomain = "https://classcast-verification.auth.us-east-1.amazoncognito.com";
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">
          <strong>Authentication Error:</strong> {auth.error.message}
        </div>
      </div>
    );
  }

  if (auth.isAuthenticated) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <h3 className="text-lg font-medium text-green-800">Welcome!</h3>
          <p className="text-green-700">Email: {auth.user?.profile.email}</p>
        </div>
        
        <div className="space-y-2">
          <button
            onClick={() => auth.removeUser()}
            className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => auth.signinRedirect()}
        className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
      >
        Sign In with Cognito
      </button>
      
      <button
        onClick={() => signOutRedirect()}
        className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
