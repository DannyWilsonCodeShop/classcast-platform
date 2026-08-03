'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function JoinClassPage() {
  const params = useParams();
  const router = useRouter();
  const classCode = params.classCode as string;
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Store the class code so we can use it after Google sign-in
    if (classCode) {
      localStorage.setItem('classcast_pending_join_code', classCode);
    }
  }, [classCode]);

  // Check if user just came back from Google sign-in (has auth code in URL)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    const pendingCode = localStorage.getItem('classcast_pending_join_code');

    if (authCode && pendingCode) {
      // User just authenticated via Google — exchange code and enroll
      handlePostGoogleEnroll(authCode, pendingCode);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePostGoogleEnroll = async (authCode: string, joinCode: string) => {
    setEnrolling(true);
    try {
      const res = await fetch('/api/auth/google-enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authCode, classCode: joinCode, redirectUri: window.location.origin + `/join/${joinCode}` }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.removeItem('classcast_pending_join_code');
        setSuccess(true);
        // Redirect to student dashboard after a moment
        setTimeout(() => {
          router.push('/student/dashboard');
        }, 2000);
      } else {
        setError(data.error || 'Failed to enroll. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleGoogleSignIn = () => {
    const cognitoDomain = 'classcast-verification.auth.us-east-1.amazoncognito.com';
    const clientId = '7tbaq74itv3gdda1bt25iqafvh';
    // Use /auth/callback as redirect URI (registered in Cognito)
    localStorage.setItem('classcast_google_return_path', `/join/${classCode}`);
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');
    const url = `https://${cognitoDomain}/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&identity_provider=Google&scope=openid+email+profile`;
    window.location.href = url;
  };

  const handleRegularSignIn = () => {
    // Store the join code, then go to regular login — after login the app will check for pending join
    localStorage.setItem('classcast_pending_join_code', classCode);
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen min-h-dvh bg-gradient-to-b from-[#005587] to-[#003d5c] flex flex-col items-center justify-center px-6">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&display=swap" rel="stylesheet" />

      <div className="w-full max-w-sm">
        {/* Logo + branding */}
        <div className="text-center mb-8">
          <img src="/UpdatedCCLogo.png" alt="ClassCast" className="w-16 h-16 mx-auto mb-3 drop-shadow-lg" />
          <h1 style={{ fontFamily: "'Grand Hotel', cursive" }} className="text-4xl text-white mb-2">ClassCast</h1>
          <p className="text-white/70 text-sm">You&apos;ve been invited to join a class</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          {success ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✓</span>
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-1">You&apos;re enrolled!</h2>
              <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
            </div>
          ) : enrolling ? (
            <div className="text-center py-4">
              <div className="w-10 h-10 border-3 border-[#005587] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-600">Enrolling you in the class...</p>
            </div>
          ) : (
            <>
              {/* Class code badge */}
              <div className="text-center mb-5">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Class Code</span>
                <div className="mt-1 inline-block px-4 py-2 bg-[#005587]/10 rounded-xl">
                  <span className="text-lg font-mono font-bold text-[#005587] tracking-wider">{classCode}</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 text-center">
                  {error}
                </div>
              )}

              {/* Google sign-in button */}
              <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors mb-3"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-sm font-medium text-gray-700">Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[10px] text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Regular sign-in */}
              <button
                onClick={handleRegularSignIn}
                className="w-full py-3 bg-[#005587] text-white rounded-xl text-sm font-bold hover:bg-[#004470] transition-colors"
              >
                Sign in with ClassCast account
              </button>

              <p className="text-center text-[10px] text-gray-400 mt-4">
                Don&apos;t have an account? Signing in with Google will create one for you.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
