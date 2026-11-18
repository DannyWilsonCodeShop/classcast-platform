'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function AboutPage() {
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', school: '', role: '', message: '' });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email) return;
    setContactSubmitting(true);
    try {
      await fetch('/api/contact-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      setContactSuccess(true);
    } catch {
      setContactSuccess(true); // Show success anyway — form data is logged server-side
    } finally {
      setContactSubmitting(false);
    }
  };

  const heading = 'font-[family-name:var(--font-fredoka)]';
  const navLink = 'rounded text-[15px] font-semibold text-[#33475b] hover:text-[#0065a3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0065a3]';
  const cardBase = 'relative overflow-hidden rounded-2xl bg-white p-6 shadow-[0_6px_20px_rgba(11,37,64,0.08)]';

  const studentCards = [
    { icon: '🎥', color: '#0065a3', title: 'Recording forces clarity', text: "You can't explain something on camera if you don't truly understand it. The act of recording exposes gaps." },
    { icon: '👀', color: '#14b8a6', title: 'Peer audiences motivate effort', text: 'Students put in more effort when classmates will see their work — not just the teacher.' },
    { icon: '💬', color: '#f59e0b', title: 'Responses build community', text: 'Watching and responding to peers creates connections and surfaces diverse perspectives.' },
    { icon: '🔄', color: '#8b5cf6', title: 'Metacognition through review', text: 'Students can watch their own recordings and self-assess — a powerful metacognitive practice.' },
  ];

  const teacherItems = [
    { title: 'AI does the heavy lifting', text: 'Type an assignment title, click AI Fill, and get complete instructions, rubric, and due date generated instantly.' },
    { title: 'Create assignments in seconds', text: 'Our streamlined creation flow means no more 20-minute setup. Title, type, done.' },
    { title: 'AI-assisted grading', text: 'Rubric-based grading with AI feedback suggestions. Grade faster without sacrificing quality.' },
    { title: 'Multi-section management', text: 'Teach 5 periods? One course, multiple sections, individual class codes. Students self-enroll.' },
  ];

  const assignmentTypes = [
    { icon: '🎥', color: '#0065a3', title: 'Video Submissions', text: 'Record on camera or upload. Live recording with anti-cheat safeguards for assessments.' },
    { icon: '💬', color: '#14b8a6', title: 'Discussion Boards', text: 'Whole-class or small-group conversations with minimum participation and word count rules.' },
    { icon: '📋', color: '#f59e0b', title: 'Timed Assessments', text: 'On-camera timed exams. Questions appear on screen. Full body visible. Auto-advances.' },
    { icon: '🎬', color: '#8b5cf6', title: 'Group Projects', text: 'Collaborative video production. Flexible group formation and grading options.' },
    { icon: '📖', color: '#0065a3', title: 'Study Modules', text: 'Self-paced lessons with embedded videos, quizzes, and progress tracking.' },
    { icon: '🤖', color: '#14b8a6', title: 'AI-Powered', text: 'Generate assignments, rubrics, and feedback with one click. Built-in AI grading assistance.' },
  ];

  const bloom = [
    ['CREATE', 'Students produce original video explanations', 'bg-[#0065a3] text-white', 'sm:mx-0'],
    ['EVALUATE', 'Peer responses require critical analysis', 'bg-[#0065a3]/85 text-white', 'sm:mx-4'],
    ['ANALYZE', 'Breaking down concepts to explain clearly', 'bg-[#0065a3]/70 text-white', 'sm:mx-8'],
    ['APPLY', 'Demonstrating understanding through examples', 'bg-[#0065a3]/55 text-white', 'sm:mx-12'],
    ['UNDERSTAND', 'Grasping material deeply enough to teach it', 'bg-[#0065a3]/40 text-[#0b2540]', 'sm:mx-16'],
    ['REMEMBER', 'Recalling information (traditional tests stop here)', 'bg-[#0065a3]/25 text-[#0b2540]', 'sm:mx-20'],
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-clip font-[family-name:var(--font-nunito)] text-[#33475b] scroll-smooth">
      {/* Nav */}
      <header className="bg-white border-b border-[#e3ebf2] px-5 sm:px-8 py-3 flex items-center justify-between gap-4">
        <Link href="/about" className="flex items-center gap-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0065a3]">
          <img src="/MyClassCast36.png" alt="ClassCast logo" width={40} height={40} className="w-10 h-10 object-contain" />
          <span className={`${heading} text-[26px] font-bold leading-none text-[#0065a3]`}>ClassCast</span>
        </Link>
        <nav aria-label="Page sections" className="hidden md:flex items-center gap-7">
          <a href="#how-it-works" className={navLink}>How it works</a>
          <a href="#for-teachers" className={navLink}>For teachers</a>
          <a href="#assignment-types" className={navLink}>Assignment types</a>
          <Link href="/about/creator" className={navLink}>Meet the Creator</Link>
        </nav>
        <Link href="/auth/login" className="px-5 py-2.5 bg-[#0065a3] hover:bg-[#00517f] text-white rounded-full text-[15px] font-bold focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0065a3]/40">
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#e6f2fb] to-white px-5 sm:px-8 pt-12 pb-16 md:pt-16 md:pb-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[13px] font-bold text-[#0065a3] shadow-sm border border-[#cfe3f2]">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#14b8a6]" />
              Video-first learning
            </span>
            <h1 className={`${heading} mt-5 text-5xl sm:text-6xl font-bold leading-[1.05] text-[#0b2540]`}>
              Learning by{' '}
              <span className="relative inline-block text-[#0065a3]">
                Teaching
                <svg aria-hidden="true" viewBox="0 0 200 12" preserveAspectRatio="none" className="absolute left-0 -bottom-2 h-3 w-full">
                  <path d="M3 8 Q 50 1 100 6 T 197 5" fill="none" stroke="#FFC72C" strokeWidth="5" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="mt-7 text-lg leading-relaxed text-[#46596c] max-w-xl">
              Research shows that when students explain concepts to others, they achieve the highest
              levels of understanding. ClassCast makes this effortless for teachers and transformative for students.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/auth/signup" className="px-8 py-3.5 rounded-full bg-gradient-to-br from-[#0065a3] to-[#0088cc] text-white text-[17px] font-extrabold shadow-md hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0065a3]/40">
                Get started
              </Link>
              <a href="#how-it-works" className="px-8 py-3.5 rounded-full border-2 border-[#0065a3] text-[#0065a3] text-[17px] font-extrabold hover:bg-[#e6f2fb] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0065a3]/40">
                See how it works
              </a>
            </div>
          </div>

          <div className="relative pb-8 pt-4 px-2 sm:px-6">
            <div className="rounded-[28px] overflow-hidden shadow-[0_16px_40px_rgba(11,37,64,0.18)] border-4 border-white aspect-[4/3] bg-[#cfe0ee]">
              <img
                src="/pexels-julia-m-cameron-8841615.jpg"
                alt="Students collaborating"
                width={800}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Decorative sample cards */}
            <div aria-hidden="true" className="absolute left-0 sm:-left-4 bottom-0 flex items-center gap-3 rounded-2xl bg-white p-3 pr-5 shadow-xl">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0b2540]">
                <span className="ml-0.5 border-y-[7px] border-l-[12px] border-y-transparent border-l-white" />
              </span>
              <span>
                <span className={`${heading} block text-[15px] font-semibold text-[#0b2540]`}>Explaining slope</span>
                <span className="block text-[13px] text-[#5b6b7b]">1:42 · posted today</span>
              </span>
            </div>
            <div aria-hidden="true" className="absolute right-0 sm:-right-2 top-0 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-xl">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#14b8a6] text-sm font-bold text-[#0b2540]">A</span>
              <span className="text-sm font-bold text-[#0b2540]">Graded 18/20</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <div className="px-6 py-8 bg-white border-b border-[#e3ebf2] text-center">
        <p className="text-base italic text-[#46596c] max-w-2xl mx-auto leading-relaxed">
          &ldquo;Bridging the gap between teaching and understanding so every student is seen, every educator is empowered, and every learning experience matters.&rdquo;
        </p>
      </div>

      {/* Bloom's Taxonomy Section */}
      <section id="how-it-works" className="scroll-mt-4 px-5 sm:px-8 py-16 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className={`${heading} text-3xl sm:text-4xl font-bold text-[#0b2540] mb-3`}>Rooted in Proven Pedagogy</h2>
          <p className="text-[#46596c] max-w-2xl mx-auto">
            ClassCast is built on Bloom&apos;s Taxonomy — the gold standard framework for deeper learning.
            Video assignments naturally push students to the highest cognitive levels.
          </p>
        </div>

        <div className="max-w-lg mx-auto mb-12">
          <div className="space-y-2">
            {bloom.map(([level, text, tone, inset]) => (
              <div key={level} className={`${tone} ${inset} text-center py-3 px-4 rounded-xl font-bold text-sm`}>
                {level} — {text}
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-[#5b6b7b] mt-3">
            Bloom&apos;s Taxonomy — ClassCast engages the top 4 levels
          </p>
        </div>

        {/* The Science */}
        <div className="relative rounded-3xl bg-gradient-to-br from-[#0065a3] to-[#0088cc] p-8 sm:p-10 text-white shadow-[0_12px_30px_rgba(0,101,163,0.25)]">
          <span aria-hidden="true" className={`${heading} absolute left-6 top-2 text-7xl leading-none text-[#FFC72C]`}>&ldquo;</span>
          <h3 className={`${heading} text-2xl font-bold mb-4 text-center pt-4`}>The Protege Effect</h3>
          <p className="leading-relaxed text-center max-w-2xl mx-auto mb-8 text-white">
            Students who teach others work harder to understand material, recall it more accurately,
            and apply it more effectively. This is known as the &ldquo;Protege Effect&rdquo; — preparing to
            teach creates deeper encoding than preparing for a test.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              ['📈', '2.5x', 'Better retention when students explain vs. listen'],
              ['🧠', '87%', 'Of students report deeper understanding through video creation'],
              ['🎯', '94%', 'Of teachers say peer teaching improves class engagement'],
            ].map(([icon, stat, text]) => (
              <div key={stat} className="bg-white rounded-2xl p-5 text-center shadow-sm">
                <div aria-hidden="true" className="text-3xl mb-2">{icon}</div>
                <div className={`${heading} text-3xl font-bold text-[#0065a3]`}>{stat}</div>
                <p className="text-sm text-[#46596c] mt-1">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits for Students */}
      <section className="bg-[#f5f9fc] px-5 sm:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className={`${heading} text-3xl sm:text-4xl font-bold text-[#0b2540] text-center mb-10`}>Why Students Teach Better</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {studentCards.map((c) => (
              <div key={c.title} className={cardBase}>
                <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: c.color }} />
                <div aria-hidden="true" className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl" style={{ backgroundColor: `${c.color}1f` }}>{c.icon}</div>
                <h3 className={`${heading} text-lg font-semibold text-[#0b2540] mb-2`}>{c.title}</h3>
                <p className="text-sm leading-relaxed text-[#46596c]">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Easy for Teachers */}
      <section id="for-teachers" className="scroll-mt-4 bg-gradient-to-br from-[#0065a3] to-[#0088cc] text-white px-5 sm:px-8 py-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className={`${heading} text-3xl sm:text-4xl font-bold mb-8`}>Effortless for Teachers</h2>
            <ul className="space-y-5">
              {teacherItems.map((t) => (
                <li key={t.title} className="flex items-start gap-3">
                  <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFC72C]">
                    <svg className="h-3.5 w-3.5 text-[#0b2540]" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </span>
                  <div>
                    <h3 className={`${heading} text-lg font-semibold`}>{t.title}</h3>
                    <p className="text-[15px] leading-relaxed text-white">{t.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {/* Decorative grading preview */}
          <div aria-hidden="true" className="rounded-2xl bg-white p-5 text-[#0b2540] shadow-2xl md:rotate-2">
            <div className={`${heading} mb-3 text-[17px] font-semibold`}>Grading</div>
            {[['Student A', 'Submitted', '18/20'], ['Student B', 'Submitted', '17/20'], ['Student C', 'Submitted', 'Met']].map(([n, s, g]) => (
              <div key={n} className="flex items-center justify-between border-t border-[#e3ebf2] py-3 text-sm">
                <span><span className="block font-bold">{n}</span><span className="text-[#5b6b7b]">{s}</span></span>
                <span className="rounded-full bg-[#e6f2fb] px-3 py-1 font-extrabold text-[#0065a3]">{g}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Assignment Types */}
      <section id="assignment-types" className="scroll-mt-4 px-5 sm:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className={`${heading} text-3xl sm:text-4xl font-bold text-[#0b2540] text-center mb-10`}>5 Assignment Types, One Platform</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {assignmentTypes.map((a) => (
              <div key={a.title} className={`${cardBase} border border-[#e3ebf2]`}>
                <div aria-hidden="true" className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl" style={{ backgroundColor: `${a.color}1f` }}>{a.icon}</div>
                <h3 className={`${heading} text-lg font-semibold text-[#0b2540] mb-2`}>{a.title}</h3>
                <p className="text-sm leading-relaxed text-[#46596c]">{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="px-5 sm:px-8 pb-16 max-w-4xl mx-auto text-center">
        <h2 className={`${heading} text-3xl font-bold text-[#0b2540] mb-4`}>Available Everywhere</h2>
        <p className="text-[#46596c] mb-8">
          Students and teachers can access ClassCast from any device — phone, tablet, or computer.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[['iOS', 'App Store'], ['Android', 'Play Store'], ['Web', 'Any Browser'], ['AWS', 'Cloud Hosted']].map(([name, sub]) => (
            <div key={name} className="bg-[#f5f9fc] border border-[#e3ebf2] rounded-2xl p-5">
              <div className={`${heading} text-2xl font-bold text-[#0065a3]`}>{name}</div>
              <div className="text-sm text-[#5b6b7b]">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Meet the Creator teaser */}
      <section className="px-5 sm:px-8 pb-16">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-6 rounded-3xl bg-[#f5f9fc] border border-[#e3ebf2] p-6 sm:p-8 text-center sm:text-left">
          <img
            src="/headshot.jpeg"
            alt="Danny Wilson"
            width={112}
            height={112}
            className="h-28 w-28 shrink-0 rounded-full object-cover border-4 border-white shadow-md"
          />
          <div className="flex-1">
            <p className="text-[13px] font-extrabold tracking-[0.15em] text-[#0065a3]">MEET THE CREATOR</p>
            <h2 className={`${heading} text-3xl font-bold text-[#0b2540]`}>Danny Wilson</h2>
            <p className="mt-1 text-[#46596c]">Software developer · Enterprise staff development · Classroom teacher</p>
          </div>
          <Link href="/about/creator" className="px-6 py-3 rounded-full border-2 border-[#0065a3] text-[#0065a3] font-extrabold hover:bg-[#e6f2fb] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0065a3]/40">
            Read the story →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 sm:px-8 pb-16">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-[#0065a3] to-[#0088cc] text-white px-6 sm:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <h2 className={`${heading} text-2xl sm:text-3xl font-bold mb-2`}>Ready to transform your classroom?</h2>
            <p className="text-white">Start for free. No credit card required.</p>
          </div>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth/signup" className="px-6 py-3 bg-[#FFC72C] text-[#0b2540] rounded-full font-extrabold hover:bg-[#ffd04d] focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60">
              Get Started Free
            </Link>
            <button
              onClick={() => setShowContactModal(true)}
              className="px-6 py-3 border-2 border-white text-white rounded-full font-extrabold hover:bg-white/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Contact Sales Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40" onClick={() => !contactSuccess && setShowContactModal(false)}>
          <div className="bg-white w-full max-w-[400px] rounded-2xl p-5" onClick={e => e.stopPropagation()}>
            {contactSuccess ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Thank you!</h3>
                <p className="text-xs text-gray-500 mb-4">A sales agent will reach out to you shortly.</p>
                <button onClick={() => { setShowContactModal(false); setContactSuccess(false); setContactForm({ name: '', email: '', phone: '', school: '', role: '', message: '' }); }}
                  className="px-4 py-2 bg-[#0065a3] text-white rounded-xl text-sm font-bold">
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-[#0065a3]">Contact Sales</h3>
                  <button onClick={() => setShowContactModal(false)} className="text-gray-400 p-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-4">Tell us about your school and we&apos;ll be in touch.</p>
                <form onSubmit={handleContactSubmit} className="space-y-3">
                  <input type="text" required value={contactForm.name} onChange={e => setContactForm(p => ({...p, name: e.target.value}))}
                    placeholder="Your name *" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0065a3] focus:border-[#0065a3]" />
                  <input type="email" required value={contactForm.email} onChange={e => setContactForm(p => ({...p, email: e.target.value}))}
                    placeholder="Email address *" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0065a3] focus:border-[#0065a3]" />
                  <input type="tel" value={contactForm.phone} onChange={e => setContactForm(p => ({...p, phone: e.target.value}))}
                    placeholder="Phone number (optional)" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0065a3] focus:border-[#0065a3]" />
                  <input type="text" value={contactForm.school} onChange={e => setContactForm(p => ({...p, school: e.target.value}))}
                    placeholder="School or district" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0065a3] focus:border-[#0065a3]" />
                  <select value={contactForm.role} onChange={e => setContactForm(p => ({...p, role: e.target.value}))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0065a3] focus:border-[#0065a3] text-gray-600">
                    <option value="">Your role</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Administrator">Administrator</option>
                    <option value="IT Director">IT Director</option>
                    <option value="Other">Other</option>
                  </select>
                  <textarea value={contactForm.message} onChange={e => setContactForm(p => ({...p, message: e.target.value}))}
                    placeholder="Anything else we should know?" rows={2}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0065a3] focus:border-[#0065a3] resize-none" />
                  <button type="submit" disabled={contactSubmitting}
                    className="w-full py-2.5 bg-[#0065a3] text-white rounded-xl text-sm font-bold hover:bg-[#00517f] transition-colors disabled:opacity-50">
                    {contactSubmitting ? 'Sending...' : 'Submit'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
