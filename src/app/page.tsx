import React from 'react';
import Link from 'next/link';
import Navigation from '@/components/layout/Navigation';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0065a3]/5 via-[#6cc3d3]/5 to-[#9940b6]/5 backdrop-blur-sm">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%230065a3%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Text Content */}
              <div>
                <div className="mb-4">
                  <h2 className="text-lg font-medium text-[#6cc3d3] uppercase tracking-wider">
                    Watch, Record, Learn, Repeat.
                  </h2>
                </div>
                
                <h1 className="text-3xl font-bold text-[#0065a3] mb-7 leading-tight text-left">
                  Where Learning Goes Live!
                </h1>
                
                <p className="text-lg font-normal text-gray-700 mb-11 max-w-2xl leading-relaxed text-left">
                  A comprehensive educational platform for students, instructors, and administrators. 
                  Manage assignments, submit videos, and track progress with our advanced learning management system.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <Link 
                    href="/auth/signup"
                    className="px-7 py-3 bg-[#f1b313] hover:bg-[#d4a012] text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 text-base"
                  >
                    Get Started Free
                  </Link>
                  <Link 
                    href="/auth/login"
                    className="px-7 py-3 bg-white/80 hover:bg-white text-[#0065a3] font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 text-base border-2 border-[#0065a3]"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
              
              {/* Right Column - Log In Page Image */}
              <div className="flex justify-center lg:justify-end">
                <div className="relative">
                  <div className="w-full max-w-[200px] lg:max-w-[250px]">
                    <img
                      src="/Log In Page.png"
                      alt="ClassCast Login Interface"
                      className="w-full h-auto rounded-2xl shadow-2xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/60 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#0065a3] mb-4">
              Powerful Features for Modern Education
            </h2>
            <p className="text-xl font-normal text-gray-600 max-w-2xl mx-auto">
              Everything you need to create an engaging learning experience
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Assignment Management */}
            <div className="group p-8 bg-white/80 backdrop-blur-sm rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-[#0065a3]/20">
              <div className="w-16 h-16 bg-[#0065a3] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#0065a3] mb-4">Assignment Management</h3>
              <p className="text-gray-600 font-normal leading-relaxed">
                Create, distribute, and grade assignments with ease. Support for multiple file types and automated grading.
              </p>
            </div>

            {/* Video Submissions */}
            <div className="group p-8 bg-white/80 backdrop-blur-sm rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-[#9940b6]/20">
              <div className="w-16 h-16 bg-[#9940b6] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#0065a3] mb-4">Video Submissions</h3>
              <p className="text-gray-600 font-normal leading-relaxed">
                Students can submit video assignments, presentations, and demonstrations with built-in video processing.
              </p>
            </div>

            {/* Progress Tracking */}
            <div className="group p-8 bg-white/80 backdrop-blur-sm rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-[#6cc3d3]/20">
              <div className="w-16 h-16 bg-[#6cc3d3] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#0065a3] mb-4">Progress Tracking</h3>
              <p className="text-gray-600 font-normal leading-relaxed">
                Real-time analytics and progress tracking for both students and instructors with detailed insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Based Sections */}
      <section className="py-20 bg-white/60 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#0065a3] mb-4">
              Designed for Every Role
            </h2>
            <p className="text-xl font-normal text-gray-600 max-w-2xl mx-auto">
              Tailored experiences for students, instructors, and administrators
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Student Section */}
            <div className="relative">
              <div className="relative p-8 bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-[#0065a3]/20">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-[#0065a3] rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-[#0065a3]">
                    For Students
                  </h3>
                </div>
                <ul className="space-y-4 text-gray-700 font-normal">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-[#0065a3] rounded-full mr-3"></div>
                    Submit assignments and video presentations
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-[#0065a3] rounded-full mr-3"></div>
                    Track your progress and grades
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-[#0065a3] rounded-full mr-3"></div>
                    Access course materials anytime
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-[#0065a3] rounded-full mr-3"></div>
                    Collaborate with classmates
                  </li>
                </ul>
                <Link 
                  href="/auth/signup?role=student"
                  className="inline-block mt-6 px-6 py-3 bg-[#f1b313] text-white font-semibold rounded-xl hover:bg-[#d4a012] transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Join as Student
                </Link>
              </div>
            </div>

            {/* Instructor Section */}
            <div className="relative">
              <div className="relative p-8 bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-[#9940b6]/20">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-[#9940b6] rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-[#0065a3]">
                    For Instructors
                  </h3>
                </div>
                <ul className="space-y-4 text-gray-700 font-normal">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-[#9940b6] rounded-full mr-3"></div>
                    Create and manage assignments
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-[#9940b6] rounded-full mr-3"></div>
                    Grade submissions efficiently
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-[#9940b6] rounded-full mr-3"></div>
                    Monitor student progress
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-[#9940b6] rounded-full mr-3"></div>
                    Build engaging course content
                  </li>
                </ul>
                <Link 
                  href="/auth/signup?role=instructor"
                  className="inline-block mt-6 px-6 py-3 bg-[#f1b313] text-white font-semibold rounded-xl hover:bg-[#d4a012] transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Join as Instructor
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#003366] relative overflow-hidden">
        <div className="relative z-10 container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Learning Experience?
          </h2>
          <p className="text-xl font-normal text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students and instructors already using ClassCast
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/auth/signup"
              className="px-8 py-4 bg-white text-[#003366] font-bold rounded-xl hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Start Your Free Trial
            </Link>
            <Link 
              href="/auth/login"
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-[#003366] rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="text-2xl font-bold text-white">ClassCast</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md font-normal">
                Empowering educators and learners with modern technology to create engaging, effective learning experiences.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 font-normal">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 font-normal">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400 font-normal">&copy; 2024 ClassCast. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
