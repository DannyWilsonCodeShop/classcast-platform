'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Demo credentials — hardcoded directly to avoid any module import issues
const DEMO_EMAIL = 'demo@classcast.ai';
const DEMO_PASSWORD = 'Demo2026!';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }
    setIsLoading(true);
    setError('');
    // Show loading modal after 1.5 seconds if still loading
    const loadingTimer = setTimeout(() => setShowLoadingModal(true), 1500);
    try {
      // Demo mode: use the working demo account that goes through real auth
      const emailLower = email.toLowerCase().trim();
      if (emailLower === 'demo@classcast.ai') {
        // Use the real demo account credentials that work through the full auth flow
        await login('student@cc.app', 'demo123');
        clearTimeout(loadingTimer);
        return;
      }
      await login(email, password);
      clearTimeout(loadingTimer);
    } catch (err) {
      clearTimeout(loadingTimer);
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
      setIsLoading(false);
      setShowLoadingModal(false);
    } finally {
      setIsLoading(false);
      setShowLoadingModal(false);
    }
  };

  return (
    <div className="min-h-screen min-h-dvh relative flex flex-col items-center overflow-auto">
      {/* Load Grand Hotel font from Google Fonts */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Grand+Hotel&display=swap"
        rel="stylesheet"
      />
      {/* Background image with blur */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/pexels-yankrukov-8197532.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(6px)',
          transform: 'scale(1.05)',
        }}
      />
      {/* Main content */}
      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center px-6 pt-4 pb-4 min-h-screen min-h-dvh">
        {/* Top bar - hamburger menu */}
        <div className="w-full flex items-center justify-start mb-1">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 focus:outline-none"
            aria-label="Menu"
          >
            <div className="space-y-1.5">
              <div className="w-8 h-1 bg-[#FFC72C] rounded" />
              <div className="w-8 h-1 bg-[#FFC72C] rounded" />
              <div className="w-6 h-1 bg-[#FFC72C] rounded" />
            </div>
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="absolute top-16 left-4 bg-white/95 backdrop-blur-md rounded-xl shadow-xl p-4 z-50 min-w-[180px]">
            <button
              onClick={() => { router.push('/about'); setMenuOpen(false); }}
              className="block w-full text-left px-3 py-2 text-[#005587] font-medium hover:bg-gray-100 rounded-lg"
            >
              About Us
            </button>
            <button
              onClick={() => { router.push('/auth/signup'); setMenuOpen(false); }}
              className="block w-full text-left px-3 py-2 text-[#005587] font-medium hover:bg-gray-100 rounded-lg"
            >
              Sign Up
            </button>
          </div>
        )}

        {/* ClassCast header with blue banner - full width with white border */}
        <div className="w-full relative mb-0 -mx-6" style={{ width: 'calc(100% + 3rem)' }}>
          <div className="bg-[#b3d9f2]/70 border-4 border-white" style={{ paddingTop: '0', paddingBottom: '0', marginTop: '-0.25rem', marginBottom: '-0.25rem' }}>
            <h1
              className="text-center"
              style={{
                fontFamily: "'Grand Hotel', cursive",
                fontSize: '5.8rem',
                color: '#005587',
                fontWeight: 400,
                textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                lineHeight: 1,
                margin: 0,
                padding: 0,
              }}
            >
              ClassCast
            </h1>
          </div>
        </div>

        {/* Logo - Camera with lightbulb */}
        <div className="flex justify-center mb-4">
          <img
            src="/UpdatedCCLogo.png"
            alt="ClassCast Logo"
            className="object-contain drop-shadow-lg"
            style={{ width: '8rem', height: '8rem' }}
          />
        </div>

        {/* Spacer to push form toward bottom */}
        <div className="flex-1" />

        {/* Login form */}
        <form onSubmit={handleSubmit} className="w-full space-y-3 mb-2">
          {/* Error message */}
          {error && (
            <div className="bg-red-50/90 border border-red-200 rounded-full px-4 py-2 text-center animate-shake">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Username field */}
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="Username"
              disabled={isLoading}
              className="w-full px-6 py-3 rounded-full border-2 border-gray-300 bg-white/90 backdrop-blur-sm text-gray-800 placeholder-gray-400 text-base focus:outline-none focus:border-[#005587] focus:ring-2 focus:ring-[#005587]/20 transition-all duration-200 shadow-sm"
              autoComplete="email"
              aria-label="Username or email"
            />
          </div>

          {/* Password field */}
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Password"
              disabled={isLoading}
              className="w-full px-6 py-3 rounded-full border-2 border-gray-300 bg-white/90 backdrop-blur-sm text-gray-800 placeholder-gray-400 text-base focus:outline-none focus:border-[#005587] focus:ring-2 focus:ring-[#005587]/20 transition-all duration-200 shadow-sm"
              autoComplete="current-password"
              aria-label="Password"
            />
          </div>

          {/* Forgot Password link */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/auth/forgot-password')}
              className="text-sm text-white hover:text-white/80 transition-colors duration-200 italic"
            >
              Forgot Password?
            </button>
          </div>

          {/* Login button */}
          <div className="flex justify-center pt-1">
            <button
              type="submit"
              disabled={isLoading}
              className="px-12 py-2.5 bg-[#2196C9] hover:bg-[#1a7fa8] text-white font-bold text-xl rounded-full shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 border-2 border-[#1a7fa8]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Login'
              )}
            </button>
          </div>

          {/* Sign Up link */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => router.push('/auth/signup')}
              className="text-sm text-white font-medium hover:text-white/80 transition-colors"
            >
              Don&apos;t have an account? <span className="underline">Sign Up</span>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex-1 h-px bg-white/40" />
            <span className="text-xs text-white/70">or</span>
            <div className="flex-1 h-px bg-white/40" />
          </div>

          {/* Google Sign-In button */}
          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={() => {
                const cognitoDomain = 'classcast-verification.auth.us-east-1.amazoncognito.com';
                const clientId = '7tbaq74itv3gdda1bt25iqafvh';
                const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');
                const url = `https://${cognitoDomain}/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&identity_provider=Google&scope=openid+email+profile`;
                window.location.href = url;
              }}
              disabled={isLoading}
              className="flex items-center gap-3 px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 border border-gray-200"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>
          </div>
        </form>

        {/* Student profile photos at bottom */}
        <div className="flex justify-center items-center gap-4 mt-4 mb-2">
          <div className="rounded-full border-4 border-[#FFC72C] overflow-hidden shadow-lg bg-white p-1" style={{ width: '6.9rem', height: '6.9rem' }}>
            <img src="/student1.jpg" alt="Student 1" className="w-full h-full object-cover rounded-full" />
          </div>
          <div className="rounded-full border-4 border-[#FFC72C] overflow-hidden shadow-lg bg-white p-1" style={{ width: '6.9rem', height: '6.9rem' }}>
            <img src="/student2.jpg" alt="Student 2" className="w-full h-full object-cover rounded-full" />
          </div>
          <div className="rounded-full border-4 border-[#FFC72C] overflow-hidden shadow-lg bg-white p-1" style={{ width: '6.9rem', height: '6.9rem' }}>
            <img src="/student3.jpg" alt="Student 3" className="w-full h-full object-cover rounded-full" />
          </div>
        </div>

        {/* Bottom spacer */}
        <div className="h-2" />
      </div>

      {/* Loading Modal */}
      {showLoadingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-8 shadow-xl flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-[#005587] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-700 font-medium">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
}
