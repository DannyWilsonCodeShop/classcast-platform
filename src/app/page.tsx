'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();

  // Redirect authenticated users to their dashboard, others to login
  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && user) {
      if (user.role === 'instructor' || user.role === 'admin') {
        router.replace('/instructor/dashboard');
      } else {
        router.replace('/student/dashboard');
      }
    } else {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, user, isLoading, router]);

  // White loading screen while checking auth / redirecting
  return (
    <div className="min-h-screen h-dvh bg-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#005587] border-t-transparent"></div>
    </div>
  );
}
