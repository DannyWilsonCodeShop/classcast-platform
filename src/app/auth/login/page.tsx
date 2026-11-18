'use client';

import React, { useState } from 'react';
import { useTransitionRouter as useRouter } from '@/hooks/useTransitionRouter';
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
  const [showPassword, setShowPassword] = useState(false);

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

  const fredoka = 'font-[family-name:var(--font-fredoka)]';
  const inputClass =
    'w-full px-4 py-3 rounded-2xl border-2 border-[#d8e3ec] bg-[#f5f9fc] text-[#0b2540] placeholder-[#6b7c8c] text-base focus:outline-none focus:border-[#0065a3] focus:ring-4 focus:ring-[#0065a3]/20 transition-colors disabled:opacity-60';

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row bg-[#f5f9fc] font-[family-name:var(--font-nunito)]">
      {/* Brand panel: short header on phones, full panel on desktop */}
      <aside className="relative bg-gradient-to-br from-[#0065a3] to-[#0088cc] text-white px-6 py-5 lg:w-[46%] lg:px-14 lg:py-14 lg:min-h-dvh lg:flex lg:flex-col">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">
            <img src="/MyClassCast36.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
          </span>
          <span className={`${fredoka} text-[28px] font-bold leading-none`}>ClassCast</span>
        </div>

        <div className="hidden lg:block mt-24">
          <h2 className={`${fredoka} text-5xl font-bold leading-tight`}>
            Learning by<br />
            <span className="text-[#FFC72C]">Teaching</span>
          </h2>
          <p className="mt-4 text-lg text-white">Record it. Share it. Learn from each other.</p>
        </div>

        {/* Decorative stacked video tiles and reply bubble */}
        <div aria-hidden="true" className="hidden lg:block relative mt-16 h-80">
          <div className="absolute left-0 top-10 h-60 w-48 -rotate-6 overflow-hidden rounded-[20px] bg-[#0b2540] shadow-2xl">
            <div className="absolute left-1/2 top-24 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-white/90">
              <span className="ml-1 border-y-[10px] border-l-[17px] border-y-transparent border-l-[#0065a3]" />
            </div>
            <div className="absolute inset-x-0 bottom-0 h-12 bg-[#14b8a6]" />
          </div>
          <div className="absolute left-48 top-0 h-60 w-48 rotate-[4deg] rounded-[20px] bg-white p-4 shadow-2xl">
            <div className="flex h-36 items-center justify-center rounded-2xl bg-[#cfe0ee]">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0065a3]">
                <span className="ml-1 border-y-[8px] border-l-[13px] border-y-transparent border-l-white" />
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-[#8b5cf6]" />
              <span className="flex-1 space-y-1.5">
                <span className="block h-2 w-full rounded bg-[#0b2540]/80" />
                <span className="block h-2 w-3/4 rounded bg-[#9aabbc]" />
              </span>
            </div>
            <span className="mt-3 inline-block rounded-full bg-[#e3f0fa] px-3 py-1 text-[10px] font-bold text-[#0065a3]">3 replies</span>
          </div>
          <div className="absolute left-56 top-64 flex items-center gap-2 rounded-full bg-white py-3 pl-3 pr-5 shadow-2xl">
            <span className="h-7 w-7 rounded-full bg-[#f59e0b]" />
            <span className="text-sm font-bold text-[#0b2540]">Great explanation!</span>
          </div>
        </div>
      </aside>

      {/* Sign-in card */}
      <main className="relative z-10 -mt-3 flex flex-1 items-start justify-center rounded-t-3xl bg-[#f5f9fc] px-5 pb-8 pt-8 lg:mt-0 lg:items-center lg:rounded-none lg:px-10 lg:py-12">
        <div className="w-full max-w-[400px] rounded-3xl bg-white p-6 sm:p-10 shadow-[0_8px_28px_rgba(11,37,64,0.12)]">
          <h1 className={`${fredoka} text-[32px] font-bold leading-tight text-[#0b2540]`}>Welcome back</h1>
          <p className="mt-1 text-[15px] text-[#5b6b7b]">Sign in to your ClassCast account</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div role="alert" className="bg-red-50 border border-red-200 rounded-2xl px-4 py-2 text-center animate-shake">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="login-username" className="mb-1.5 block text-sm font-bold text-[#33475b]">Username</label>
              <input
                id="login-username"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="Username"
                disabled={isLoading}
                className={inputClass}
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-sm font-bold text-[#33475b]">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Password"
                  disabled={isLoading}
                  className={`${inputClass} pr-16`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1.5 text-[13px] font-bold text-[#0065a3] hover:bg-[#e3f0fa] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0065a3]"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => router.push('/auth/forgot-password')}
                className="rounded text-sm font-bold text-[#0065a3] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0065a3]"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-gradient-to-br from-[#0065a3] to-[#0088cc] py-3.5 text-[19px] font-extrabold text-white shadow-md transition hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0065a3]/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-6 space-y-2 text-center text-[15px] text-[#46596c]">
            <p>
              New to ClassCast?{' '}
              <button
                type="button"
                onClick={() => router.push('/auth/signup')}
                className="rounded font-extrabold text-[#0065a3] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0065a3]"
              >
                Sign up
              </button>
            </p>
            <p>
              <button
                type="button"
                onClick={() => router.push('/about')}
                className="rounded text-sm font-bold text-[#0065a3] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0065a3]"
              >
                About ClassCast
              </button>
            </p>
          </div>
        </div>
      </main>

      {/* Loading Modal */}
      {showLoadingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-8 shadow-xl flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-[#0065a3] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-700 font-medium">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
}
