'use client';

import React from 'react';
import Link from 'next/link';

export default function AboutCreatorPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&display=swap" rel="stylesheet" />

      {/* Header */}
      <div className="bg-[#005587] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/UpdatedCCLogo.png" alt="" className="w-8 h-8 object-contain" />
          <span className="text-xl" style={{ fontFamily: "'Grand Hotel', cursive" }}>ClassCast</span>
        </div>
        <Link href="/auth/login" className="px-4 py-2 bg-[#FFC72C] text-[#005587] rounded-full text-sm font-bold">
          Sign In
        </Link>
      </div>

      {/* Creator Profile */}
      <div className="px-6 py-14 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-36 h-36 rounded-full overflow-hidden mx-auto mb-6 border-4 border-[#005587]/20 shadow-lg">
            <img
              src="/headshot.jpeg"
              alt="Danny Wilson"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold text-[#005587] mb-2">Danny Wilson</h1>
          <p className="text-gray-600 text-lg">Founder & Creator of ClassCast</p>
        </div>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <p>
            Danny Wilson is an educator and technologist who built ClassCast to solve a problem he saw 
            every day in the classroom: students passively consuming content instead of actively engaging with it.
          </p>
          <p>
            After years of teaching and seeing the transformative power of having students explain concepts 
            to each other on camera, Danny set out to build a platform that makes video-based peer learning 
            effortless for teachers and engaging for students.
          </p>
          <p>
            ClassCast combines Danny&apos;s background in education with modern AI and cloud technology to create 
            a platform where creating assignments takes seconds, students learn by teaching, and grading 
            is assisted by artificial intelligence — all without sacrificing pedagogical rigor.
          </p>

          <div className="bg-gray-50 rounded-2xl p-6 mt-8">
            <h3 className="font-bold text-[#005587] mb-3">The Mission</h3>
            <p className="text-gray-700 italic">
              &ldquo;Every student has something to teach. ClassCast gives them the stage, the audience, 
              and the feedback loop to become deeper thinkers by becoming teachers themselves.&rdquo;
            </p>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-10 text-center">
          <Link href="/about" className="text-[#005587] font-medium hover:underline">
            ← Back to About ClassCast
          </Link>
        </div>
      </div>
    </div>
  );
}
