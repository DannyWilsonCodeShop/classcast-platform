'use client';

import React from 'react';
import Link from 'next/link';
import Navigation from '@/components/layout/Navigation';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%2220%22%20r%3D%222%22/%3E%3C/g%3E%3C/svg%3E')]"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl font-black text-white mb-6">
              About <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">ClassCast</span>
            </h1>
            <p className="text-xl text-indigo-100 max-w-3xl mx-auto leading-relaxed">
              Born from 12+ years of teaching experience, ClassCast transforms education through peer-to-peer video learning and AI-enhanced assessment.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            
            {/* Founder Story */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
              {/* Photo */}
              <div className="relative">
                <div className="relative w-full max-w-md mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl transform rotate-3"></div>
                  <div className="relative bg-white rounded-2xl p-4 shadow-2xl">
                    <Image
                      src="/headshot.jpeg"
                      alt="Danny Wilson - ClassCast Founder"
                      width={400}
                      height={500}
                      className="w-full h-auto rounded-xl object-cover"
                      priority
                    />
                  </div>
                </div>
              </div>

              {/* Story */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    Meet Danny Wilson
                  </h2>
                  <p className="text-lg text-indigo-600 font-semibold mb-6">
                    Founder, Educator, and Visionary
                  </p>
                </div>

                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <p className="text-lg">
                    For over <strong>12 years</strong>, Danny has dedicated his life to teaching and inspiring students across multiple disciplines. His journey spans teaching <strong>Math, Computer Science, and Music</strong> to both <strong>soldiers and students</strong>, developing a deep understanding of how people learn best.
                  </p>
                  
                  <p className="text-lg">
                    Throughout his teaching career, Danny observed a fundamental truth: <strong>students who teach others reach the highest levels of learning</strong>. This insight aligns perfectly with <strong>Bloom's Taxonomy</strong>, where "Create" and "Teach" represent the pinnacle of cognitive development.
                  </p>
                  
                  <p className="text-lg">
                    However, traditional educational platforms were missing this crucial peer-to-peer teaching component. Students were consuming content but rarely creating and teaching others. Danny recognized this gap and set out to build a solution.
                  </p>
                </div>
              </div>
            </div>

            {/* Development Journey */}
            <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-3xl shadow-xl border border-indigo-100 p-8 mb-20">
              <div className="max-w-5xl mx-auto">
                <h3 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                  Built by an Educator, Powered by Innovation
                </h3>
                
                <div className="space-y-6 text-gray-700 leading-relaxed">
                  <p className="text-lg text-center max-w-3xl mx-auto">
                    ClassCast isn't just an idea - it's a <strong>fully-functional, production-grade platform</strong> built from the ground up by Danny Wilson, combining his deep educational expertise with modern software development.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    {/* From Teacher to Developer */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-indigo-100">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-2xl">👨‍💻</span>
                        </div>
                        <h4 className="text-xl font-bold text-gray-900">From Teacher to Full-Stack Developer</h4>
                      </div>
                      <p className="text-gray-700">
                        With 12+ years of teaching experience, Danny identified a critical gap in educational technology and decided to build the solution himself. What started as a vision became a complete, production-ready platform serving real students today.
                      </p>
                    </div>

                    {/* Technical Achievement */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-2xl">⚡</span>
                        </div>
                        <h4 className="text-xl font-bold text-gray-900">Enterprise-Grade Technology</h4>
                      </div>
                      <p className="text-gray-700">
                        ClassCast is built on modern cloud infrastructure (AWS), featuring real-time video processing, AI-powered content moderation, secure authentication, and a responsive design that works seamlessly across all devices.
                      </p>
                    </div>
                  </div>

                  {/* Tech Stack Highlights */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg mt-6">
                    <h4 className="text-xl font-bold text-gray-900 mb-4 text-center">Platform Capabilities</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <span className="text-2xl">🎥</span>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">Video Recording & Upload</p>
                          <p className="text-xs text-gray-600">Webcam, file upload, YouTube integration</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <span className="text-2xl">🤖</span>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">AI-Powered Features</p>
                          <p className="text-xs text-gray-600">Content moderation, grading assistance</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                        <span className="text-2xl">⚡</span>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">Real-Time Interactions</p>
                          <p className="text-xs text-gray-600">Live notifications, instant feedback</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                        <span className="text-2xl">📊</span>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">Advanced Analytics</p>
                          <p className="text-xs text-gray-600">Engagement tracking, performance insights</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                        <span className="text-2xl">🔒</span>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">Enterprise Security</p>
                          <p className="text-xs text-gray-600">JWT auth, encrypted data, PII protection</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                        <span className="text-2xl">☁️</span>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">Cloud Infrastructure</p>
                          <p className="text-xs text-gray-600">Scalable, reliable, globally distributed</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Development Approach */}
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white mt-6">
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">💡</span>
                      <div>
                        <h4 className="text-xl font-bold mb-3">A New Era of Development</h4>
                        <p className="text-indigo-100 mb-3">
                          ClassCast represents a new paradigm in software development - where <strong>domain expertise</strong> meets <strong>AI-augmented coding</strong>. Danny leveraged cutting-edge AI tools to accelerate development while maintaining complete control over architecture, features, and user experience.
                        </p>
                        <p className="text-indigo-100 text-sm">
                          <strong>Result:</strong> A production-ready platform that would typically require a team of developers and months of work - built by one educator with a clear vision and the determination to make it real.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* The Problem & Solution */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-20">
              <div className="max-w-4xl mx-auto">
                <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                  The Vision Behind ClassCast
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* The Problem */}
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                        <span className="text-2xl">⚠️</span>
                      </div>
                      <h4 className="text-xl font-bold text-red-800">The Problem</h4>
                    </div>
                    <ul className="space-y-3 text-red-700">
                      <li className="flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        Students passively consume content without deep engagement
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        Limited opportunities for peer-to-peer teaching
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        Traditional assessments don't reach Bloom's highest levels
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        Creating, distributing, and grading video content is complex and time-consuming
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        Difficult to encourage students to watch and engage with peer videos
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        Video grading workflows are scattered across multiple tools
                      </li>
                    </ul>
                  </div>

                  {/* The Solution */}
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                        <span className="text-2xl">✅</span>
                      </div>
                      <h4 className="text-xl font-bold text-green-800">ClassCast Solution</h4>
                    </div>
                    <ul className="space-y-3 text-green-700">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        <strong>All-in-one platform</strong> for video creation, distribution, and grading
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        <strong>Seamless workflow</strong> that flows from video to video, assignment to assignment
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        <strong>Speed controls & navigation</strong> make watching peer videos engaging and efficient
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        <strong>AI-assisted grading</strong> and feedback generation saves time and improves quality
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        <strong>Comprehensive peer review</strong> system encourages student engagement
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        <strong>Makes creating, grading, and providing feedback easy and fun!</strong>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloom's Taxonomy */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 mb-20">
              <div className="max-w-5xl mx-auto">
                <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                  Why Teaching Others Matters: Bloom's Taxonomy
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Remember */}
                  <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">📚</span>
                      </div>
                      <h4 className="font-bold text-gray-800 mb-2">Remember</h4>
                      <p className="text-sm text-gray-600">Basic recall of information</p>
                    </div>
                  </div>

                  {/* Understand */}
                  <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-200">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">💭</span>
                      </div>
                      <h4 className="font-bold text-gray-800 mb-2">Understand</h4>
                      <p className="text-sm text-gray-600">Comprehending meaning</p>
                    </div>
                  </div>

                  {/* Apply */}
                  <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-200">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🔧</span>
                      </div>
                      <h4 className="font-bold text-gray-800 mb-2">Apply</h4>
                      <p className="text-sm text-gray-600">Using knowledge in new situations</p>
                    </div>
                  </div>

                  {/* Analyze */}
                  <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-yellow-200">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🔍</span>
                      </div>
                      <h4 className="font-bold text-gray-800 mb-2">Analyze</h4>
                      <p className="text-sm text-gray-600">Breaking down complex information</p>
                    </div>
                  </div>

                  {/* Evaluate */}
                  <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-orange-200">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">⚖️</span>
                      </div>
                      <h4 className="font-bold text-gray-800 mb-2">Evaluate</h4>
                      <p className="text-sm text-gray-600">Making judgments about value</p>
                    </div>
                  </div>

                  {/* Create/Teach - Highlighted */}
                  <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl p-6 shadow-lg border-2 border-purple-400 transform scale-105">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl text-white">🎯</span>
                      </div>
                      <h4 className="font-bold text-purple-800 mb-2">Create & Teach</h4>
                      <p className="text-sm text-purple-700 font-semibold">The pinnacle of learning - ClassCast's focus</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                    ClassCast specifically targets the <strong>highest levels of Bloom's Taxonomy</strong> by requiring students to create video content and teach their peers. This approach transforms passive learners into active educators, achieving deep, lasting understanding.
                  </p>
                </div>
              </div>
            </div>

            {/* Mission Statement */}
            <div className="text-center mb-20">
              <div className="max-w-4xl mx-auto">
                <h3 className="text-3xl font-bold text-gray-900 mb-6">
                  Our Mission
                </h3>
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                  <p className="text-xl text-gray-700 leading-relaxed mb-6">
                    To revolutionize education by empowering students to become teachers, creating a learning environment where peer-to-peer instruction drives mastery and deep understanding.
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-indigo-600">
                    <span className="text-2xl">🎓</span>
                    <span className="text-lg font-semibold">Teaching Others is the Highest Form of Learning</span>
                    <span className="text-2xl">🚀</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white">
                <h3 className="text-3xl font-bold mb-4">
                  Ready to Transform Learning?
                </h3>
                <p className="text-xl mb-8 opacity-90">
                  Join the educational revolution where students become teachers
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/auth/signup"
                    className="px-8 py-4 bg-white text-indigo-600 font-bold rounded-full hover:bg-gray-100 transition-colors duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    🚀 Get Started Today
                  </Link>
                  <Link
                    href="/products"
                    className="px-8 py-4 border-2 border-white text-white font-bold rounded-full hover:bg-white hover:text-indigo-600 transition-colors duration-300"
                  >
                    📚 Learn More
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-gray-400">
              © 2024 ClassCast. Created with ❤️ by Danny Wilson to transform education through peer-to-peer learning.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
