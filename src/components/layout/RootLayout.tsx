'use client';

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { Navigation } from './Navigation';

interface RootLayoutProps {
  children: React.ReactNode;
}

export const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
};






