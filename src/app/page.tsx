'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/layout/Navigation';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();

  // Redirect authenticated users to their appropriate dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === 'instructor') {
        router.push('/instructor/dashboard');
      } else if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        // Default to student dashboard
        router.push('/student/dashboard');
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render the landing page if user is authenticated
  if (isAuthenticated && user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navigation />
      
      {/* Sophisticated Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 overflow-hidden">
        {/* Playful Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22%23fbbf24%22%20fill-opacity%3D%220.3%22%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%2220%22%20r%3D%222%22/%3E%3C/g%3E%3C/svg%3E')] animate-pulse"></div>
        </div>
        
        {/* Floating Fun Shapes */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-yellow-300/30 rounded-full blur-xl animate-bounce"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-blue-300/30 rounded-full blur-xl animate-bounce delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-purple-300/30 rounded-full blur-xl animate-bounce delay-2000"></div>
        <div className="absolute top-60 right-1/4 w-20 h-20 bg-pink-300/30 rounded-full blur-xl animate-bounce delay-500"></div>
        
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
              {/* Left Column - Kid-Friendly Content */}
              <div className="space-y-8">
                {/* Fun Status Badge */}
              <div className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm border-2 border-amber-300 rounded-full shadow-lg">
                <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3 animate-bounce"></div>
                <span className="text-gray-700 text-sm font-bold">🎓 Learning Made Engaging! 🎓</span>
              </div>
                
                {/* Main Heading */}
                <div className="space-y-4">
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-800 leading-tight">
                    <span className="block">AI-Enhanced</span>
                    <span className="block bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      Video Learning
                    </span>
                  </h1>
                  <div className="w-24 h-2 bg-gradient-to-r from-amber-500 to-indigo-600 rounded-full"></div>
                </div>
                
              {/* Subtitle */}
              <p className="text-xl text-gray-600 max-w-lg leading-relaxed font-medium">
                Create video assignments, engage in peer discussions, and get AI-powered feedback! 
                Transform education with collaborative video learning and intelligent assessment! 🚀
              </p>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    href="/auth/signup"
                    className="group relative px-8 py-4 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-bold rounded-full shadow-2xl hover:shadow-amber-500/25 transform hover:-translate-y-1 transition-all duration-300 text-lg"
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      🚀 Get Started!
                      <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </Link>
                  <Link 
                    href="/auth/login"
                    className="px-8 py-4 bg-white/80 backdrop-blur-sm border-2 border-blue-300 text-blue-600 font-bold rounded-full hover:bg-blue-50 transition-all duration-300 text-lg shadow-lg"
                  >
                    🔑 Sign In
                  </Link>
                </div>
                
              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8">
                <div className="text-center bg-white/60 rounded-2xl p-4 shadow-lg">
                  <div className="text-3xl font-bold text-amber-500">3</div>
                  <div className="text-gray-600 text-sm font-medium">Assignment Types! 📝</div>
                </div>
                <div className="text-center bg-white/60 rounded-2xl p-4 shadow-lg">
                  <div className="text-3xl font-bold text-indigo-600">AI</div>
                  <div className="text-gray-600 text-sm font-medium">Auto-Grading! 🤖</div>
                </div>
                <div className="text-center bg-white/60 rounded-2xl p-4 shadow-lg">
                  <div className="text-3xl font-bold text-purple-600">Live</div>
                  <div className="text-gray-600 text-sm font-medium">Recording! 🎥</div>
                </div>
              </div>
              </div>
              
              {/* Right Column - Video Learning Interface */}
              <div className="flex justify-center lg:justify-end">
                <div className="relative">
                  {/* Kid-Friendly Video Player Interface */}
                  <div className="w-96 h-96 bg-white/90 backdrop-blur-sm rounded-3xl border-4 border-yellow-300 shadow-2xl overflow-hidden">
                    {/* Video Player Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-yellow-100 to-blue-100 border-b-2 border-yellow-300">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                      <div className="text-gray-700 text-sm font-bold">🎥 ClassCast Video</div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                        <span className="text-emerald-600 text-xs font-bold">LIVE</span>
                      </div>
                    </div>
                    
                    {/* Video Content Area */}
                    <div className="relative h-64 bg-gradient-to-br from-amber-200 to-indigo-200 flex items-center justify-center">
                      {/* Mock Video Thumbnail */}
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-300/40 to-indigo-400/40 flex items-center justify-center">
                        <div className="w-20 h-20 bg-white/80 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg">
                          <svg className="w-10 h-10 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                      
                      {/* Video Overlay Info */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg border-2 border-amber-300">
                          <div className="text-gray-800 text-sm font-bold mb-1">"AI-Graded Video Assignment 📚"</div>
                          <div className="text-gray-600 text-xs">by @sarah_math • 2.3K views • 2 hours ago</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Kid-Friendly Social Controls */}
                    <div className="p-4 space-y-3 bg-gradient-to-r from-yellow-50 to-blue-50">
                      {/* Engagement Stats */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <span className="text-2xl">❤️</span>
                            <span className="text-gray-700 font-bold">247</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-2xl">💬</span>
                            <span className="text-gray-700 font-bold">89</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-2xl">⭐</span>
                            <span className="text-gray-700 font-bold">4.8</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center hover:bg-amber-500 transition-colors shadow-lg">
                            <span className="text-lg">⭐</span>
                          </button>
                          <button className="w-8 h-8 bg-indigo-400 rounded-full flex items-center justify-center hover:bg-indigo-500 transition-colors shadow-lg">
                            <span className="text-lg">💖</span>
                          </button>
                        </div>
                      </div>
                      
                      {/* Creator Info */}
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white text-sm font-bold">SM</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-gray-800 text-sm font-bold">Sarah Math 👩‍🏫</div>
                          <div className="text-gray-600 text-xs">2.1K friends following!</div>
                        </div>
                        <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-indigo-600 text-white text-xs font-bold rounded-full hover:from-amber-600 hover:to-indigo-700 transition-all shadow-lg">
                          👋 Follow
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating Fun Elements */}
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400/50 rounded-full blur-sm animate-bounce">🌟</div>
                  <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-blue-400/50 rounded-full blur-sm animate-bounce delay-1000">⭐</div>
                  
                  {/* Mini Video Thumbnails */}
                  <div className="absolute -right-8 top-8 space-y-2">
                    <div className="w-16 h-12 bg-gradient-to-br from-green-300 to-blue-400 rounded-xl opacity-80 shadow-lg">📚</div>
                    <div className="w-16 h-12 bg-gradient-to-br from-purple-300 to-pink-400 rounded-xl opacity-80 shadow-lg">🎨</div>
                    <div className="w-16 h-12 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-xl opacity-80 shadow-lg">🔬</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kid-Friendly Features Section */}
      <section className="py-20 bg-gradient-to-br from-yellow-50 to-blue-50 relative overflow-hidden">
        {/* Fun Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22%23fbbf24%22%20fill-opacity%3D%220.3%22%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%2220%22%20r%3D%222%22/%3E%3C/g%3E%3C/svg%3E')]"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-6 py-3 bg-white text-gray-700 rounded-full text-sm font-bold mb-8 shadow-lg border-2 border-amber-300">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3 animate-bounce"></div>
              ✨ Super Cool Features! ✨
            </div>
            <h2 className="text-5xl sm:text-6xl font-black text-gray-800 mb-6">
              Video-First
              <span className="block bg-gradient-to-r from-amber-500 to-indigo-600 bg-clip-text text-transparent">
                Learning Platform! 🎉
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium">
              Transform education with AI-powered video assignments, peer discussions, and intelligent feedback! 🌟
            </p>
          </div>
          
          {/* Card Stack Layout */}
          <div className="relative max-w-6xl mx-auto">
            {/* Main Feature Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {/* Card 1 - AI Tutor */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-indigo-600 rounded-3xl transform rotate-2 group-hover:rotate-3 transition-transform duration-500"></div>
                <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-gray-200 transform group-hover:-translate-y-2 transition-all duration-500">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">01</div>
                      <div className="text-sm text-gray-500">VIDEOS</div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Video Assignments & Discussions</h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Create video assignments, discussions, and assessments. Students record live videos, engage in peer reviews, and participate in threaded discussions.
                  </p>
                  <div className="flex items-center text-yellow-600 font-semibold group-hover:text-yellow-700">
                    <span>Explore</span>
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card 2 - Video Analysis */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-teal-500 rounded-3xl transform -rotate-1 group-hover:-rotate-2 transition-transform duration-500"></div>
                <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-gray-200 transform group-hover:-translate-y-2 transition-all duration-500">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">02</div>
                      <div className="text-sm text-gray-500">SOCIAL</div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Peer Interactions & Community</h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Like, rate, and comment on peer videos. Build learning communities with threaded discussions, peer responses, and collaborative feedback.
                  </p>
                  <div className="flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
                    <span>Explore</span>
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card 3 - Analytics */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-indigo-700 rounded-3xl transform rotate-1 group-hover:rotate-2 transition-transform duration-500"></div>
                <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-gray-200 transform group-hover:-translate-y-2 transition-all duration-500">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">03</div>
                      <div className="text-sm text-gray-500">AI FEEDBACK</div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Grading & Rubric System</h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    AI-powered grading with rubric-based scoring, auto-generated feedback, content moderation, and intelligent peer response analysis.
                  </p>
                  <div className="flex items-center text-cyan-600 font-semibold group-hover:text-cyan-700">
                    <span>Explore</span>
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200">
                <div className="text-3xl font-bold text-yellow-500 mb-2">Live</div>
                <div className="text-gray-600 text-sm">Video Recording</div>
              </div>
              <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200">
                <div className="text-3xl font-bold text-blue-500 mb-2">Mobile</div>
                <div className="text-gray-600 text-sm">Responsive</div>
              </div>
              <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200">
                <div className="text-3xl font-bold text-cyan-500 mb-2">Auto</div>
                <div className="text-gray-600 text-sm">Save & Sync</div>
              </div>
              <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200">
                <div className="text-3xl font-bold text-blue-600 mb-2">Email</div>
                <div className="text-gray-600 text-sm">Verification</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Role-Based Sections */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2 animate-pulse"></span>
              Role-Based Experience
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Designed for
              <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Every Learner
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tailored AI-powered experiences that adapt to your role and learning style
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Student Card */}
            <div className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-blue-200/50 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Students</h3>
                    <p className="text-blue-600 font-medium">AI-Powered Learning</p>
                  </div>
                </div>
                <ul className="space-y-4 text-gray-600 mb-8">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span>Video assignments, discussions & assessments</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span>Live video recording with compression</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span>Peer video reviews and interactions</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span>To-do list with pending assignments</span>
                  </li>
                </ul>
                <Link 
                  href="/auth/signup?role=student"
                  className="group/btn w-full inline-flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <span>Start Learning Free</span>
                  <svg className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Instructor Card */}
            <div className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-purple-200/50 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 to-pink-600"></div>
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Instructors</h3>
                    <p className="text-purple-600 font-medium">AI-Enhanced Teaching</p>
                  </div>
                </div>
                <ul className="space-y-4 text-gray-600 mb-8">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span>AI-powered grading with rubrics</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span>Assignment creation with visual elements</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span>Peer response analytics & moderation</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span>Class management with unique codes</span>
                  </li>
                </ul>
                <Link 
                  href="/auth/signup?role=instructor"
                  className="group/btn w-full inline-flex items-center justify-center px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <span>Start Teaching</span>
                  <svg className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Admin Card */}
            <div className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-green-200/50 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-500 to-emerald-600"></div>
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Administrators</h3>
                    <p className="text-green-600 font-medium">AI-Driven Insights</p>
                  </div>
                </div>
                <ul className="space-y-4 text-gray-600 mb-8">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span>Advanced analytics dashboard</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span>AI-powered risk detection</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span>Automated system optimization</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span>Comprehensive reporting tools</span>
                  </li>
                </ul>
                <Link 
                  href="/auth/signup?role=admin"
                  className="group/btn w-full inline-flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <span>Manage Platform</span>
                  <svg className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern CTA Section */}
      <section className="relative py-20 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30 animate-pulse"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-pink-500/20 to-yellow-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white/90 text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Join 10,000+ Educators & Students
            </div>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Ready to Transform
              <span className="block bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
                Video Learning?
              </span>
            </h2>
            
            <p className="text-xl text-purple-100 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join the future of education with AI-powered video assignments, peer discussions, live recording, and intelligent grading that makes learning engaging and effective.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
              <Link 
                href="/auth/signup"
                className="group relative px-10 py-5 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold rounded-2xl shadow-2xl hover:shadow-yellow-500/25 transform hover:-translate-y-1 transition-all duration-300 text-lg"
              >
                <span className="relative z-10 flex items-center">
                  Start Free Trial
                  <svg className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <Link 
                href="/auth/login"
                className="px-10 py-5 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-semibold rounded-2xl hover:bg-white/20 hover:border-white/50 transition-all duration-300 text-lg"
              >
                Sign In
              </Link>
            </div>
            
            {/* Trust Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">10K+</div>
                <div className="text-purple-200 text-sm">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">99.9%</div>
                <div className="text-purple-200 text-sm">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">4.9★</div>
                <div className="text-purple-200 text-sm">User Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">ClassCast</span>
              </div>
              <p className="text-gray-300 mb-8 max-w-md leading-relaxed">
                The complete AI-enhanced video learning platform for modern education. Create video assignments, engage in peer discussions, and get intelligent feedback that transforms how students learn and instructors teach.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-12 h-12 bg-gray-700/50 hover:bg-blue-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                  </svg>
                </a>
                <a href="#" className="w-12 h-12 bg-gray-700/50 hover:bg-blue-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"></path>
                  </svg>
                </a>
                <a href="#" className="w-12 h-12 bg-gray-700/50 hover:bg-blue-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"></path>
                  </svg>
                </a>
                <a href="#" className="w-12 h-12 bg-gray-700/50 hover:bg-blue-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"></path>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Product Links */}
            <div>
              <h4 className="text-xl font-bold mb-6 text-white">Product</h4>
              <ul className="space-y-4">
                <li><Link href="/products" className="text-gray-300 hover:text-blue-400 transition-colors duration-300">Features</Link></li>
                <li><Link href="/products" className="text-gray-300 hover:text-blue-400 transition-colors duration-300">AI Tools</Link></li>
                <li><Link href="/products" className="text-gray-300 hover:text-blue-400 transition-colors duration-300">Pricing</Link></li>
                <li><Link href="/resources" className="text-gray-300 hover:text-blue-400 transition-colors duration-300">API</Link></li>
                <li><Link href="/resources" className="text-gray-300 hover:text-blue-400 transition-colors duration-300">Documentation</Link></li>
              </ul>
            </div>
            
            {/* Support Links */}
            <div>
              <h4 className="text-xl font-bold mb-6 text-white">Support</h4>
              <ul className="space-y-4">
                <li><Link href="/support" className="text-gray-300 hover:text-blue-400 transition-colors duration-300">Help Center</Link></li>
                <li><Link href="/support" className="text-gray-300 hover:text-blue-400 transition-colors duration-300">Contact Us</Link></li>
                <li><Link href="/support" className="text-gray-300 hover:text-blue-400 transition-colors duration-300">Status</Link></li>
                <li><Link href="/community" className="text-gray-300 hover:text-blue-400 transition-colors duration-300">Community</Link></li>
                <li><Link href="/customers" className="text-gray-300 hover:text-blue-400 transition-colors duration-300">Success Stories</Link></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="border-t border-gray-700 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 md:mb-0">
                © 2025 ClassCast. All rights reserved. Built with ❤️ for education.
              </p>
              <div className="flex space-x-6">
                <Link href="/privacy" className="text-gray-400 hover:text-blue-400 transition-colors duration-300 text-sm">Privacy Policy</Link>
                <Link href="/terms" className="text-gray-400 hover:text-blue-400 transition-colors duration-300 text-sm">Terms of Service</Link>
                <Link href="/support" className="text-gray-400 hover:text-blue-400 transition-colors duration-300 text-sm">Cookie Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
