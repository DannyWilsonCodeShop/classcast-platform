'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState<'student' | 'instructor'>('student');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [instructorCode, setInstructorCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError('All fields are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (role === 'instructor' && instructorCode !== '5555') {
      setError('Invalid instructor code.');
      return;
    }

    setIsLoading(true);
    try {
      await signup({
        email,
        firstName,
        lastName,
        password,
        role,
        ...(role === 'instructor' && { department, instructorCode }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-dvh relative flex flex-col items-center overflow-auto">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&display=swap" rel="stylesheet" />

      {/* Background */}
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

      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center px-6 py-6 min-h-screen min-h-dvh">
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <img src="/UpdatedCCLogo.png" alt="" className="w-8 h-8 object-contain" />
            <span style={{ fontFamily: "'Grand Hotel', cursive" }} className="text-2xl text-[#005587]">
              ClassCast
            </span>
          </div>
          <button
            onClick={() => router.push('/auth/login')}
            className="text-sm text-white/90 hover:text-white font-medium"
          >
            Sign In
          </button>
        </div>

        {/* Form card */}
        <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-xl">
          <h2 className="text-lg font-bold text-[#005587] mb-1">Create Account</h2>
          <p className="text-xs text-gray-500 mb-4">Join ClassCast as a student or instructor</p>

          {error && (
            <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Role toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                  role === 'student' ? 'bg-[#005587] text-white' : 'text-gray-600'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole('instructor')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                  role === 'instructor' ? 'bg-[#005587] text-white' : 'text-gray-600'
                }`}
              >
                Instructor
              </button>
            </div>

            {/* Name row */}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
                disabled={isLoading}
              />
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
              disabled={isLoading}
            />

            {/* Password */}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (8+ characters)"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
              disabled={isLoading}
            />

            {/* Confirm password */}
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
              disabled={isLoading}
            />

            {/* Instructor-only fields */}
            {role === 'instructor' && (
              <div className="space-y-3 pt-1">
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Department"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
                  disabled={isLoading}
                />
                <input
                  type="text"
                  value={instructorCode}
                  onChange={(e) => setInstructorCode(e.target.value)}
                  placeholder="Instructor code"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#005587] text-white rounded-xl text-sm font-bold hover:bg-[#004470] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 mt-4">
            Already have an account?{' '}
            <button onClick={() => router.push('/auth/login')} className="text-[#005587] font-medium">
              Sign In
            </button>
          </p>
        </div>

        {/* Terms note */}
        <p className="text-[10px] text-white/60 text-center mt-3">
          By creating an account you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
