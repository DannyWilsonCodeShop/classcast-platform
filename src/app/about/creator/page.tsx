'use client';

import React from 'react';
import Link from 'next/link';

export default function AboutCreatorPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&display=swap" rel="stylesheet" />

      {/* Header */}
      <div className="bg-[#0065a3] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/MyClassCast36.png" alt="" className="w-8 h-8 object-contain brightness-200" />
          <span className="text-xl" style={{ fontFamily: "'Grand Hotel', cursive" }}>ClassCast</span>
        </div>
        <Link href="/auth/login" className="px-4 py-2 bg-[#FFC72C] text-[#0065a3] rounded-full text-sm font-bold">
          Sign In
        </Link>
      </div>

      {/* Creator Profile */}
      <div className="px-6 py-14 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-36 h-36 rounded-full overflow-hidden mx-auto mb-6 border-4 border-[#0065a3]/20 shadow-lg">
            <img
              src="/headshot.jpeg"
              alt="Danny Wilson"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold text-[#0065a3] mb-2">Danny Wilson</h1>
          <p className="text-gray-600 text-lg">Software Developer and Founder of ClassCast</p>
        </div>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <p>
            Danny Wilson is a software developer with five years of experience building mission-based networks,
            tactical operating bases and card processing systems. He is an AWS Cloud App Development graduate and
            AWS Certified, and he leads staff development training, including AI.
          </p>
          <p>
            Danny also teaches in the classroom, and that is where he saw the problem ClassCast solves. Students were
            watching and reading instead of engaging. When they explained concepts to each other on camera, their
            understanding got deeper. He set out to build a platform that makes video-based peer learning simple for
            teachers and worthwhile for students.
          </p>
          <p>
            ClassCast brings together his development background and his teaching experience. Creating an assignment
            takes seconds, students learn by teaching, and AI assists with grading while the teacher stays in charge.
          </p>

          <div className="bg-gray-50 rounded-2xl p-6 mt-8">
            <h3 className="font-bold text-[#0065a3] mb-3">The Mission</h3>
            <p className="text-gray-700 italic">
              &ldquo;Every student has something to teach. ClassCast gives them the stage, the audience, 
              and the feedback loop to become deeper thinkers by becoming teachers themselves.&rdquo;
            </p>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-10 text-center">
          <Link href="/about" className="text-[#0065a3] font-medium hover:underline">
            ← Back to About ClassCast
          </Link>
        </div>
      </div>
    </div>
  );
}
