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
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      // Demo mode: use the working demo account that goes through real auth
      const emailLower = email.toLowerCase().trim();
      if (emailLower === 'demo@classcast.ai') {
        // Use the real demo account credentials that work through the full auth flow
        await login('student@cc.app', 'demo123');
        return;
      }
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen relative flex flex-col items-center overflow-hidden">
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
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 z-[1] bg-white/20" />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center px-6 pt-4 pb-4 h-screen border border-gray-200 rounded-3xl bg-white/80 backdrop-blur-sm">
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
              onClick={() => { router.push('/'); setMenuOpen(false); }}
              className="block w-full text-left px-3 py-2 text-[#005587] font-medium hover:bg-gray-100 rounded-lg"
            >
              Home
            </button>
            <button
              onClick={() => { router.push('/auth/login'); setMenuOpen(false); }}
              className="block w-full text-left px-3 py-2 text-[#005587] font-medium hover:bg-gray-100 rounded-lg"
            >
              Login
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
        <div className="w-full relative mb-1 -mx-6" style={{ width: 'calc(100% + 3rem)' }}>
          <div className="bg-[#b3d9f2]/70 border-y-4 border-white" style={{ paddingTop: '0', paddingBottom: '0', marginTop: '-0.25rem', marginBottom: '-0.25rem' }}>
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
        <div className="flex justify-center mb-20">
          <img
            src="/UpdatedCCLogo.png"
            alt="ClassCast Logo"
            className="object-contain drop-shadow-lg"
            style={{ width: '10rem', height: '10rem' }}
          />
        </div>

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
        </form>

        {/* Student profile photos */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <div className="rounded-full border-4 border-[#FFC72C] overflow-hidden shadow-lg bg-white p-1" style={{ width: '6.5rem', height: '6.5rem' }}>
            <img
              src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face"
              alt="Student 1"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div className="rounded-full border-4 border-[#FFC72C] overflow-hidden shadow-lg bg-white p-1" style={{ width: '6.5rem', height: '6.5rem' }}>
            <img
              src="https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=200&h=200&fit=crop&crop=face"
              alt="Student 2"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div className="rounded-full border-4 border-[#FFC72C] overflow-hidden shadow-lg bg-white p-1" style={{ width: '6.5rem', height: '6.5rem' }}>
            <img
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face"
              alt="Student 3"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
