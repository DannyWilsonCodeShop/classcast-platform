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

      {/* Hero with stock image */}
      <div className="relative">
        <div className="absolute inset-0 z-0">
          <img
            src="/pexels-julia-m-cameron-8841615.jpg"
            alt="Students collaborating"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#005587]/75" />
        </div>
        <div className="relative z-10 px-6 py-16 text-center max-w-3xl mx-auto text-white">
          <h1 className="text-4xl font-bold mb-4">Learning by Teaching</h1>
          <p className="text-lg text-white/90 leading-relaxed">
            Research shows that when students explain concepts to others, they achieve the highest 
            levels of understanding. ClassCast makes this effortless for teachers and transformative for students.
          </p>
        </div>
      </div>

      {/* Bloom's Taxonomy Section */}
      <div className="px-6 py-14 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-[#005587] mb-3">Rooted in Proven Pedagogy</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            ClassCast is built on Bloom&apos;s Taxonomy — the gold standard framework for deeper learning. 
            Video assignments naturally push students to the highest cognitive levels.
          </p>
        </div>

        {/* Bloom's pyramid visualization */}
        <div className="max-w-lg mx-auto mb-10">
          <div className="space-y-2">
            <div className="bg-[#005587] text-white text-center py-3 px-4 rounded-xl font-bold text-sm">
              CREATE — Students produce original video explanations
            </div>
            <div className="bg-[#005587]/85 text-white text-center py-3 px-6 rounded-xl font-bold text-sm">
              EVALUATE — Peer responses require critical analysis
            </div>
            <div className="bg-[#005587]/70 text-white text-center py-3 px-8 rounded-xl font-bold text-sm">
              ANALYZE — Breaking down concepts to explain clearly
            </div>
            <div className="bg-[#005587]/55 text-white text-center py-3 px-10 rounded-xl font-bold text-sm">
              APPLY — Demonstrating understanding through examples
            </div>
            <div className="bg-[#005587]/40 text-white text-center py-3 px-12 rounded-xl font-bold text-sm">
              UNDERSTAND — Grasping material deeply enough to teach it
            </div>
            <div className="bg-[#005587]/25 text-[#005587] text-center py-3 px-14 rounded-xl font-bold text-sm">
              REMEMBER — Recalling information (traditional tests stop here)
            </div>
          </div>
          <p className="text-center text-xs text-gray-500 mt-3">
            Bloom&apos;s Taxonomy — ClassCast engages the top 4 levels
          </p>
        </div>

        {/* The Science */}
        <div className="bg-gray-50 rounded-2xl p-8 mb-10">
          <h3 className="text-xl font-bold text-[#005587] mb-4 text-center">The Protege Effect</h3>
          <p className="text-gray-700 leading-relaxed text-center max-w-2xl mx-auto mb-6">
            Students who teach others work harder to understand material, recall it more accurately, 
            and apply it more effectively. This is known as the &ldquo;Protege Effect&rdquo; — preparing to 
            teach creates deeper encoding than preparing for a test.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 text-center shadow-sm">
              <div className="text-3xl mb-2">📈</div>
              <div className="text-2xl font-bold text-[#005587]">2.5x</div>
              <p className="text-xs text-gray-600 mt-1">Better retention when students explain vs. listen</p>
            </div>
            <div className="bg-white rounded-xl p-5 text-center shadow-sm">
              <div className="text-3xl mb-2">🧠</div>
              <div className="text-2xl font-bold text-[#005587]">87%</div>
              <p className="text-xs text-gray-600 mt-1">Of students report deeper understanding through video creation</p>
            </div>
            <div className="bg-white rounded-xl p-5 text-center shadow-sm">
              <div className="text-3xl mb-2">🎯</div>
              <div className="text-2xl font-bold text-[#005587]">94%</div>
              <p className="text-xs text-gray-600 mt-1">Of teachers say peer teaching improves class engagement</p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits for Students section with image */}
      <div className="bg-gray-50 px-6 py-14">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <img
                src="/pexels-yankrukov-8197532.jpg"
                alt="Students recording video"
                className="rounded-2xl shadow-lg w-full object-cover aspect-[4/3]"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#005587] mb-4">Why Students Teach Better</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">🎥</span>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Recording forces clarity</h4>
                    <p className="text-sm text-gray-600">You can&apos;t explain something on camera if you don&apos;t truly understand it. The act of recording exposes gaps.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">👀</span>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Peer audiences motivate effort</h4>
                    <p className="text-sm text-gray-600">Students put in more effort when classmates will see their work — not just the teacher.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">💬</span>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Responses build community</h4>
                    <p className="text-sm text-gray-600">Watching and responding to peers creates connections and surfaces diverse perspectives.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">🔄</span>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Metacognition through review</h4>
                    <p className="text-sm text-gray-600">Students can watch their own recordings and self-assess — a powerful metacognitive practice.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Easy for Teachers section with image */}
      <div className="px-6 py-14">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="order-2 md:order-1">
              <h2 className="text-2xl font-bold text-[#005587] mb-4">Effortless for Teachers</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">✨</span>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">AI does the heavy lifting</h4>
                    <p className="text-sm text-gray-600">Type an assignment title, click AI Fill, and get complete instructions, rubric, and due date generated instantly.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">⚡</span>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Create assignments in seconds</h4>
                    <p className="text-sm text-gray-600">Our streamlined creation flow means no more 20-minute setup. Title, type, done.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">📊</span>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">AI-assisted grading</h4>
                    <p className="text-sm text-gray-600">Rubric-based grading with AI feedback suggestions. Grade faster without sacrificing quality.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">🏫</span>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Multi-section management</h4>
                    <p className="text-sm text-gray-600">Teach 5 periods? One course, multiple sections, individual class codes. Students self-enroll.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <img
                src="/pexels-eduardo-barrientos-140939364-17664360.jpg"
                alt="Teacher using technology"
                className="rounded-2xl shadow-lg w-full object-cover aspect-[4/3]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Types */}
      <div className="bg-gray-50 px-6 py-14">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#005587] text-center mb-8">5 Assignment Types, One Platform</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="text-2xl mb-2">🎥</div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Video Submissions</h3>
              <p className="text-xs text-gray-600">Record on camera or upload. Live recording with anti-cheat safeguards for assessments.</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="text-2xl mb-2">💬</div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Discussion Boards</h3>
              <p className="text-xs text-gray-600">Whole-class or small-group conversations with minimum participation and word count rules.</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="text-2xl mb-2">📋</div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Timed Assessments</h3>
              <p className="text-xs text-gray-600">On-camera timed exams. Questions appear on screen. Full body visible. Auto-advances.</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="text-2xl mb-2">🎬</div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Group Projects</h3>
              <p className="text-xs text-gray-600">Collaborative video production. Flexible group formation and grading options.</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="text-2xl mb-2">📖</div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Study Modules</h3>
              <p className="text-xs text-gray-600">Self-paced lessons with embedded videos, quizzes, and progress tracking.</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="text-2xl mb-2">🤖</div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">AI-Powered</h3>
              <p className="text-xs text-gray-600">Generate assignments, rubrics, and feedback with one click. Built-in AI grading assistance.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Platforms */}
      <div className="px-6 py-12 max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-[#005587] mb-4">Available Everywhere</h2>
        <p className="text-gray-600 mb-6 text-sm">
          Students and teachers can access ClassCast from any device — phone, tablet, or computer.
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

      {/* CTA */}
      <div className="bg-[#005587] text-white px-6 py-10 text-center">
        <h3 className="text-xl font-bold mb-2">Ready to transform your classroom?</h3>
        <p className="text-white/70 text-sm mb-6">Start for free. No credit card required.</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/auth/signup" className="px-6 py-3 bg-[#FFC72C] text-[#005587] rounded-xl font-bold">
            Get Started Free
          </Link>
          <a href="mailto:dwilson1919@gmail.com" className="px-6 py-3 border-2 border-white text-white rounded-xl font-bold">
            Contact Sales
          </a>
        </div>
      </div>
    </div>
  );
}
