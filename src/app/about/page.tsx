'use client';

import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#005587] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/UpdatedCCLogo.png" alt="" className="w-8 h-8 object-contain" />
          <span className="text-xl font-bold">ClassCast</span>
        </div>
        <Link href="/auth/login" className="px-4 py-2 bg-[#FFC72C] text-[#005587] rounded-full text-sm font-bold">
          Sign In
        </Link>
      </div>

      {/* Hero */}
      <div className="px-6 py-12 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-[#005587] mb-4">AI-Enhanced Video Learning</h1>
        <p className="text-lg text-gray-600 mb-8">
          ClassCast transforms education with collaborative video assignments, peer discussions, 
          and AI-powered feedback. Built for K-12 and higher education.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/signup" className="px-6 py-3 bg-[#005587] text-white rounded-xl font-bold">
            Get Started Free
          </Link>
          <Link href="/auth/login" className="px-6 py-3 border-2 border-[#005587] text-[#005587] rounded-xl font-bold">
            Sign In
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="bg-gray-50 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#005587] text-center mb-8">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-3xl mb-3">🎥</div>
              <h3 className="font-bold text-gray-900 mb-2">Video Assignments</h3>
              <p className="text-sm text-gray-600">Students record and submit videos. Live recording with anti-cheat safeguards. Upload or link YouTube/Drive videos.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-3xl mb-3">💬</div>
              <h3 className="font-bold text-gray-900 mb-2">Discussion Boards</h3>
              <p className="text-sm text-gray-600">Whole-class or small-group discussions. Text and video responses. Peer engagement with minimum participation rules.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-3xl mb-3">📋</div>
              <h3 className="font-bold text-gray-900 mb-2">Timed Assessments</h3>
              <p className="text-sm text-gray-600">On-camera timed video exams. Questions appear on screen. Full body required. Auto-advances on timer.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="font-bold text-gray-900 mb-2">AI Grading</h3>
              <p className="text-sm text-gray-600">Rubric-based grading with AI assistance. Customizable templates. Auto-generated feedback suggestions.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-3xl mb-3">🎬</div>
              <h3 className="font-bold text-gray-900 mb-2">Group Projects</h3>
              <p className="text-sm text-gray-600">Collaborative video production. Random, teacher, or student-formed groups. Shared or individual grading.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-3xl mb-3">📖</div>
              <h3 className="font-bold text-gray-900 mb-2">Study Modules</h3>
              <p className="text-sm text-gray-600">Self-paced learning with videos, quizzes, and progress tracking. Completion-based grading.</p>
            </div>
          </div>
        </div>
      </div>

      {/* For Schools */}
      <div className="px-6 py-12 max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-[#005587] mb-4">Built for Schools</h2>
        <p className="text-gray-600 mb-6">
          ClassCast is designed for K-12 and higher education institutions. Multi-section course management, 
          enrollment via class codes, individualized question banks, peer review, and comprehensive grade tracking.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-[#005587]">iOS</div>
            <div className="text-xs text-gray-500">App Store</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-[#005587]">Android</div>
            <div className="text-xs text-gray-500">Play Store</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-[#005587]">Web</div>
            <div className="text-xs text-gray-500">Any Browser</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-[#005587]">AWS</div>
            <div className="text-xs text-gray-500">Cloud Hosted</div>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-[#005587] text-white px-6 py-8 text-center">
        <h3 className="text-lg font-bold mb-2">Interested in ClassCast for your school?</h3>
        <p className="text-white/70 text-sm mb-4">Contact us to schedule a demo and learn about pricing.</p>
        <a href="mailto:dwilson1919@gmail.com" className="inline-block px-6 py-3 bg-[#FFC72C] text-[#005587] rounded-xl font-bold">
          Contact Sales
        </a>
      </div>
    </div>
  );
}
