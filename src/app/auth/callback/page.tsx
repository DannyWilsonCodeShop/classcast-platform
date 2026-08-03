'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'enrolling' | 'success' | 'error'>('processing');
  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      router.replace('/auth/login');
      return;
    }

    const pendingJoinCode = localStorage.getItem('classcast_pending_join_code');
    handleAuth(code, pendingJoinCode || undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuth = async (authCode: string, classCode?: string) => {
    setStatus(classCode ? 'enrolling' : 'processing');
    try {
      const redirectUri = window.location.origin + '/auth/callback';
      const res = await fetch('/api/auth/google-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authCode, redirectUri, classCode }),
      });

      const data = await res.json();

      if (!data.success) {
        setStatus('error');
        setError(data.error || 'Authentication failed. Please try again.');
        return;
      }

      // Store tokens
      if (data.tokens?.accessToken) {
        localStorage.setItem('accessToken', data.tokens.accessToken);
      }
      if (data.tokens?.idToken) {
        localStorage.setItem('idToken', data.tokens.idToken);
      }
      if (data.tokens?.refreshToken) {
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
      }

      // Store user - fetch full user details
      let userObj: any = { id: data.userId, userId: data.userId, role: data.role || 'student' };
      try {
        const userRes = await fetch(`/api/users/${data.userId}`);
        const userData = await userRes.json();
        if (userData.success && userData.data) {
          userObj = {
            id: userData.data.userId,
            userId: userData.data.userId,
            email: userData.data.email,
            firstName: userData.data.firstName,
            lastName: userData.data.lastName,
            role: userData.data.role || data.role || 'student',
            schoolLogo: userData.data.schoolLogo || '',
            schoolName: userData.data.schoolName || '',
            enrolledCourses: userData.data.enrolledCourses || [],
          };
        }
      } catch {}

      localStorage.setItem('user', JSON.stringify(userObj));

      // Clean up
      localStorage.removeItem('classcast_pending_join_code');
      localStorage.removeItem('classcast_google_return_path');

      setStatus('success');

      // Use window.location for a full page reload so AuthContext picks up localStorage
      const destination = (userObj.role === 'instructor' || userObj.role === 'admin')
        ? '/instructor/dashboard'
        : '/student/dashboard';

      window.location.href = destination;
    } catch (err) {
      console.error('Auth callback error:', err);
      setStatus('error');
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      {status === 'error' ? (
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✕</span>
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/auth/login'}
            className="px-6 py-2.5 bg-[#005587] text-white rounded-xl text-sm font-medium"
          >
            Go to Login
          </button>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#005587] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">
            {status === 'enrolling' ? 'Enrolling you in the class...' : status === 'success' ? 'Redirecting...' : 'Signing you in...'}
          </p>
        </div>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#005587] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
