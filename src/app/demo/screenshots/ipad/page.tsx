'use client';

import React, { useState } from 'react';
import { getAssignmentColor, getAssignmentTitleColor } from '@/lib/assignmentColors';
import { getDemoAssignments, getDemoFeed, DEMO_STUDENT, DEMO_PEERS } from '@/lib/demo-screenshot-data';

/**
 * iPad Demo Screenshot — Wide layout with sidebar + two-column dashboard
 * Access: /demo/screenshots/ipad
 * 
 * This renders the full iPad experience with mock data for App Store screenshots.
 * No auth required.
 */
export default function DemoScreenshotIpad() {
  const assignments = getDemoAssignments();
  const feed = getDemoFeed();

  const now = new Date();
  const displayAssignments = [...assignments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter(a => !a.isSubmitted)
    .slice(0, 6);

  const getDueBadge = (d: string) => {
    const diff = Math.ceil((new Date(d).getTime() - now.getTime()) / 86400000);
    if (diff < 0) return `${Math.abs(diff)}d late`;
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `${diff}d`;
  };
  const getBadgeStyle = (d: string) => {
    const diff = Math.ceil((new Date(d).getTime() - now.getTime()) / 86400000);
    if (diff < 0) return 'bg-red-100 text-red-700';
    if (diff <= 1) return 'bg-orange-100 text-orange-700';
    return 'bg-white/90 text-gray-700';
  };

  const dueThisWeek = assignments.filter(a => {
    const d = new Date(a.dueDate);
    return d >= now && d <= new Date(now.getTime() + 7 * 86400000) && !a.isSubmitted;
  }).length;
  const submitted = assignments.filter(a => a.isSubmitted).length;

  const navItems = [
    { label: 'Dashboard', active: true, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { label: 'Courses', active: false, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
    { label: 'Assignments', active: false, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> },
    { label: 'Grades', active: false, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
    { label: 'Profile', active: false, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
    { label: 'Settings', active: false, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&family=Oswald:wght@300;700&display=swap" rel="stylesheet" />

      {/* Sidebar */}
      <aside className="w-[220px] h-full bg-white border-r border-gray-100 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-4 pt-5 pb-4 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: "'Grand Hotel', cursive", color: '#005587' }} className="text-xl">ClassCast</span>
            <img src="/UpdatedCCLogo.png" alt="" className="w-7 h-7 object-contain" />
          </div>
          <div className="mt-2">
            <img src="/Demo1Logo.png" alt="" className="h-10 object-contain" />
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-3 space-y-1">
          {navItems.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg min-h-[44px] ${
                item.active
                  ? 'bg-[#005587]/10 text-[#005587] border-l-[3px] border-[#005587]'
                  : 'text-gray-600'
              }`}
            >
              <span className={item.active ? 'text-[#005587]' : 'text-gray-400'}>{item.icon}</span>
              <span className={`text-sm font-medium ${item.active ? 'text-[#005587]' : 'text-gray-700'}`}>{item.label}</span>
            </div>
          ))}

          {/* Record button */}
          <div className="pt-3">
            <div className="flex items-center gap-2 bg-[#FFC72C] text-[#005587] font-bold rounded-xl px-3 py-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              <span className="text-sm">Record</span>
            </div>
          </div>
        </nav>

        {/* User */}
        <div className="border-t border-gray-50 p-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full border-2 border-[#FFC72C] overflow-hidden">
              <img src={DEMO_STUDENT.avatar} alt="" className="w-full h-full object-cover" />
            </div>
            <span className="text-sm font-medium text-gray-700">{DEMO_STUDENT.firstName}</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-[#e8f4f8] via-white to-[#f0f9fc]">
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-3 shrink-0 border-b border-gray-100">
          <h1 className="text-lg font-bold uppercase text-[#005587]" style={{ fontFamily: "'Oswald', sans-serif" }}>Dashboard</h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="bg-blue-50 text-[#005587] px-3 py-1 rounded-full font-medium">📋 {dueThisWeek} due this week</span>
            <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium">✅ {submitted} submitted</span>
          </div>
        </div>

        {/* Two column grid */}
        <div className="flex-1 grid grid-cols-[55fr_45fr] gap-5 p-5 min-h-0 overflow-hidden">
          {/* Left — Assignments */}
          <div className="flex flex-col min-h-0 bg-gray-50 rounded-2xl overflow-hidden">
            <div className="px-4 pt-3 pb-2 shrink-0 flex items-center justify-between">
              <h2 className="text-base font-bold uppercase text-[#005587]" style={{ fontFamily: "'Oswald', sans-serif" }}>Assignments</h2>
              <span className="text-xs text-[#005587] font-medium">View All →</span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-2">
              {displayAssignments.map((a) => (
                <div key={a.assignmentId} className="rounded-xl p-4" style={{ backgroundColor: getAssignmentColor(a.assignmentId) }}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold uppercase truncate" style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: '0.02em', color: getAssignmentTitleColor(a.assignmentId) }}>{a.title}</h3>
                      <p className="text-xs mt-0.5 opacity-70" style={{ color: getAssignmentTitleColor(a.assignmentId) }}>{a.courseName} • {a.maxScore} pts</p>
                    </div>
                    <span className={`text-[11px] font-semibold px-3 py-1 rounded-full ml-3 shrink-0 ${getBadgeStyle(a.dueDate)}`}>{getDueBadge(a.dueDate)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Videos */}
          <div className="flex flex-col min-h-0 bg-gray-50 rounded-2xl overflow-hidden">
            <div className="px-4 pt-3 pb-2 shrink-0">
              <h2 className="text-base font-bold uppercase text-[#005587]" style={{ fontFamily: "'Oswald', sans-serif" }}>Recent Videos</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-3">
              <div className="grid grid-cols-2 gap-3">
                {feed.map(item => (
                  <div key={item.id} className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-8 h-8 rounded-full border-2 border-[#FFC72C] overflow-hidden bg-gray-300 shrink-0">
                        <img src={item.author.avatar} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-xs font-semibold text-gray-900 truncate">{item.author.name}</span>
                    </div>
                    <div className="relative rounded-xl overflow-hidden bg-gray-800 aspect-[4/5]">
                      <div className="w-full h-full bg-gradient-to-br from-[#005587] to-[#0077aa] flex items-center justify-center">
                        <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center"><div className="w-9 h-9 bg-white/80 rounded-full flex items-center justify-center shadow"><svg className="w-4 h-4 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></div></div>
                    </div>
                    <p className="text-xs text-gray-900 truncate font-medium uppercase mt-1.5" style={{ fontFamily: "'Oswald', sans-serif" }}>{item.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                      <span>❤️ {item.likes}</span>
                      <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <svg key={s} className={`w-2.5 h-2.5 ${s <= item.rating ? 'text-[#FFC72C]' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
