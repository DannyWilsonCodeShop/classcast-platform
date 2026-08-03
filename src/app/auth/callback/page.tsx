'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'enrolling' | 'error'>('processing');
  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const pendingJoinCode = localStorage.getItem('classcast_pending_join_code');
    const returnPath = localStorage.getItem('classcast_google_return_path');

    if (!code) {
      // No auth code — redirect to login
      router.replace('/auth/login');
      return;
    }

    if (pendingJoinCode) {
      // User came from /join/[classCode] — enroll them
      handleEnroll(code, pendingJoinCode);
    } else if (returnPath) {
      // Has a return path but no join code — just redirect
      localStorage.removeItem('classcast_google_return_path');
      router.replace(returnPath);
    } else {
      // Regular Google sign-in — exchange token and go to dashboard
      handleRegularSignIn(code);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnroll = async (authCode: string, classCode: string) => {
    setStatus('enrolling');
    try {
      const redirectUri = window.location.origin + '/auth/callback';
      const res = await fetch('/api/auth/google-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authCode, classCode, redirectUri }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.removeItem('classcast_pending_join_code');
        localStorage.removeItem('classcast_google_return_path');
        // Store tokens in the format the app expects
        if (data.tokens?.accessToken) {
          localStorage.setItem('accessToken', data.tokens.accessToken);
          localStorage.setItem('idToken', data.tokens.idToken);
          if (data.tokens.refreshToken) {
            localStorage.setItem('refreshToken', data.tokens.refreshToken);
          }
        }
        // Fetch and store user data
        if (data.userId) {
          try {
            const userRes = await fetch(`/api/users/${data.userId}`);
            const userData = await userRes.json();
            if (userData.success && userData.data) {
              const userObj = {
                id: userData.data.userId,
                userId: userData.data.userId,
                email: userData.data.email,
                firstName: userData.data.firstName,
                lastName: userData.data.lastName,
                role: userData.data.role || 'student',
                schoolLogo: userData.data.schoolLogo,
                schoolName: userData.data.schoolName,
                enrolledCourses: userData.data.enrolledCourses,
              };
              localStorage.setItem('user', JSON.stringify(userObj));
            }
          } catch {
            localStorage.setItem('user', JSON.stringify({ id: data.userId, userId: data.userId, role: 'student' }));
          }
        }
        // Redirect to student dashboard
        router.replace('/student/dashboard');
      } else {
        setStatus('error');
        setError(data.error || 'Enrollment failed');
      }
    } catch {
      setStatus('error');
      setError('Something went wrong. Please try again.');
    }
  };

  const handleRegularSignIn = async (authCode: string) => {
    // Exchange code for tokens via Cognito token endpoint
    try {
      const redirectUri = window.location.origin + '/auth/callback';
      const res = await fetch('/api/auth/google-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authCode, redirectUri }),
      });
      const data = await res.json();
      if (data.success && data.tokens) {
        // Store tokens in the format the app expects
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('idToken', data.tokens.idToken);
        if (data.tokens.refreshToken) {
          localStorage.setItem('refreshToken', data.tokens.refreshToken);
        }
        // Store user data
        if (data.userId) {
          // Fetch user details to populate the user object
          try {
            const userRes = await fetch(`/api/users/${data.userId}`);
            const userData = await userRes.json();
            if (userData.success && userData.data) {
              const userObj = {
                id: userData.data.userId,
                userId: userData.data.userId,
                email: userData.data.email,
                firstName: userData.data.firstName,
                lastName: userData.data.lastName,
                role: userData.data.role || data.role,
                schoolLogo: userData.data.schoolLogo,
                schoolName: userData.data.schoolName,
                enrolledCourses: userData.data.enrolledCourses,
              };
              localStorage.setItem('user', JSON.stringify(userObj));
            }
          } catch {
            // Fallback: store minimal user
            localStorage.setItem('user', JSON.stringify({ id: data.userId, userId: data.userId, role: data.role }));
          }
        }
        // Redirect based on role
        if (data.role === 'instructor' || data.role === 'admin') {
          router.replace('/instructor/dashboard');
        } else {
          router.replace('/student/dashboard');
        }
      } else {
        setStatus('error');
        setError(data.error || 'Sign-in failed');
      }
    } catch {
      setStatus('error');
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen min-h-dvh bg-white flex items-center justify-center px-6">
      {status === 'error' ? (
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✕</span>
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-6 py-2.5 bg-[#005587] text-white rounded-xl text-sm font-medium"
          >
            Go to Login
          </button>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#005587] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">
            {status === 'enrolling' ? 'Enrolling you in the class...' : 'Signing you in...'}
          </p>
        </div>
      )}
    </div>
  );
}
