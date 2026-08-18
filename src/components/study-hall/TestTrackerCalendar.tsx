'use client';

import React, { useState, useEffect } from 'react';

interface TestEntry {
  entryId: string;
  teacherName: string;
  subject: string;
  testType: 'summative' | 'formative';
  testDate: string;
}

const TEACHERS = [
  'Dr. Diaz', 'Ms. Marlar', 'Ms. Tate', 'Ms. Alvarado', 'Mr. Wilson',
  'Mr. Barrow', 'Mr. Gordon', 'Ms. King', 'Ms. Brown', 'Ms. Pollitzer',
  'Dean Stevens', 'Mr. Johnson (CWS)', 'IT Service Desk', 'Other',
];

export function TestTrackerCalendar() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [tests, setTests] = useState<TestEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDayTests, setSelectedDayTests] = useState<TestEntry[]>([]);

  // Add form state
  const [teacherName, setTeacherName] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('classcast_studyhall_teacher') || '';
    return '';
  });
  const [subject, setSubject] = useState('');
  const [testType, setTestType] = useState<'summative' | 'formative'>('summative');
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState('');
  const [addWarning, setAddWarning] = useState('');
  const [suggestedDate, setSuggestedDate] = useState('');

  // Fetch tests for current month
  useEffect(() => {
    fetchTests();
  }, [currentMonth]);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const monthStr = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}`;
      const res = await fetch(`/api/test-calendar?month=${monthStr}`);
      const data = await res.json();
      if (data.success) setTests(data.tests || []);
    } catch {} finally { setLoading(false); }
  };

  // Calendar helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const prevMonth = () => {
    setCurrentMonth(prev => prev.month === 0 ? { year: prev.year - 1, month: 11 } : { ...prev, month: prev.month - 1 });
  };
  const nextMonth = () => {
    setCurrentMonth(prev => prev.month === 11 ? { year: prev.year + 1, month: 0 } : { ...prev, month: prev.month + 1 });
  };

  // Get tests for a specific date
  const getTestsForDate = (day: number) => {
    const dateStr = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tests.filter(t => t.testDate === dateStr);
  };

  // Handle day click
  const handleDayClick = (day: number) => {
    const dateStr = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = new Date(currentMonth.year, currentMonth.month, day).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return; // Can't add tests on weekends

    const dayTests = getTestsForDate(day);
    setSelectedDate(dateStr);
    setSelectedDayTests(dayTests);
    setAddError('');
    setAddWarning('');
    setSuggestedDate('');

    if (dayTests.length >= 2) {
      // Show blocked state with suggestion
      setAddError('This day already has 2 assessments. Choose another day.');
      findNextAvailable(dateStr);
    } else if (dayTests.length === 1) {
      setAddWarning(`There is already 1 assessment on this day (${dayTests[0].teacherName} - ${dayTests[0].subject}). Adding yours will be the 2nd (maximum).`);
    }

    setShowAddModal(true);
  };

  const findNextAvailable = async (fromDate: string) => {
    const date = new Date(fromDate + 'T12:00:00');
    for (let i = 1; i <= 14; i++) {
      date.setDate(date.getDate() + 1);
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      const candidate = date.toISOString().split('T')[0];
      const dayTests = tests.filter(t => t.testDate === candidate);
      if (dayTests.length < 2) {
        setSuggestedDate(candidate);
        return;
      }
    }
  };

  const handleSubmit = async () => {
    if (!teacherName || !subject || !selectedDate) return;
    setSubmitting(true);
    setAddError('');

    try {
      const res = await fetch('/api/test-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherName, subject, testType, testDate: selectedDate }),
      });
      const data = await res.json();

      if (data.success) {
        // Optimistically add to local state immediately (no waiting for refetch)
        const newEntry: TestEntry = {
          entryId: data.entry?.entryId || `temp_${Date.now()}`,
          teacherName,
          subject,
          testType,
          testDate: selectedDate!,
        };
        setTests(prev => [...prev, newEntry]);
        setShowAddModal(false);
        setSubject('');
      } else if (data.blocked) {
        setAddError(data.error);
        if (data.suggestedDate) setSuggestedDate(data.suggestedDate);
      } else {
        setAddError(data.error || 'Failed to add test');
      }
    } catch {
      setAddError('Network error');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (entryId: string) => {
    // Optimistically remove from local state
    setTests(prev => prev.filter(t => t.entryId !== entryId));
    try {
      await fetch(`/api/test-calendar?entryId=${entryId}`, { method: 'DELETE' });
    } catch {}
  };

  const handleUseSuggested = () => {
    if (suggestedDate) {
      setSelectedDate(suggestedDate);
      setAddError('');
      setAddWarning('');
      setSuggestedDate('');
      // Check if suggested date has 1 test
      const dayTests = tests.filter(t => t.testDate === suggestedDate);
      if (dayTests.length === 1) {
        setAddWarning(`There is 1 assessment on this day. Yours will be the 2nd.`);
      }
    }
  };

  // Render calendar grid
  const daysInMonth = getDaysInMonth(currentMonth.year, currentMonth.month);
  const firstDay = getFirstDayOfMonth(currentMonth.year, currentMonth.month);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-md mx-auto px-4 py-5">
      {/* Month header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 active:bg-gray-200">‹</button>
        <h2 className="text-lg font-bold text-stone-900" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>{monthNames[currentMonth.month]} {currentMonth.year}</h2>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 active:bg-gray-200">›</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-[10px] font-medium text-gray-400 text-center py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayTests = getTestsForDate(day);
          const count = dayTests.length;
          const isToday = dateStr === today;
          const dayOfWeek = new Date(currentMonth.year, currentMonth.month, day).getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          return (
            <button
              key={day}
              onClick={() => !isWeekend && handleDayClick(day)}
              disabled={isWeekend}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center relative transition-colors
                ${isWeekend ? 'bg-gray-50 text-gray-300 cursor-default' : 'hover:bg-gray-100 active:scale-95 cursor-pointer'}
                ${isToday ? 'ring-2 ring-[#005587]' : ''}
                ${count === 0 ? '' : count === 1 ? 'bg-amber-50' : 'bg-red-50'}
              `}
            >
              <span className={`text-xs font-medium ${isToday ? 'text-[#005587] font-bold' : isWeekend ? 'text-gray-300' : 'text-gray-700'}`}>{day}</span>
              {/* Indicators */}
              {count > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {count >= 1 && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                  {count >= 2 && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-gray-500">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-200" /> 0 tests</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> 1 test</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> 2 tests (max)</div>
      </div>

      {/* Upcoming tests list for this month */}
      {tests.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-bold text-stone-700 mb-2">This Month&apos;s Assessments</h3>
          <div className="space-y-1.5">
            {tests.sort((a, b) => a.testDate.localeCompare(b.testDate)).map(test => (
              <div key={test.entryId} className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-stone-200/60 shadow-sm">
                <div className={`w-2 h-full min-h-[32px] rounded-full shrink-0 ${test.testType === 'summative' ? 'bg-red-400' : 'bg-blue-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{test.subject}</p>
                  <p className="text-[10px] text-gray-400">{test.teacherName} · {new Date(test.testDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${test.testType === 'summative' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                  {test.testType === 'summative' ? 'Sum' : 'Form'}
                </span>
                <button onClick={() => handleDelete(test.entryId)} className="text-gray-300 hover:text-red-400 text-sm shrink-0">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Test Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40" onClick={() => setShowAddModal(false)}>
          <div className="bg-white w-full max-w-sm rounded-2xl p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#005587]">Add Assessment</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400">✕</button>
            </div>

            {/* Date display */}
            <div className="mb-3 p-2.5 bg-gray-50 rounded-xl text-center">
              <span className="text-sm font-medium text-gray-700">
                {selectedDate && new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            {/* Error / Warning */}
            {addError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-xs text-red-700 font-medium">{addError}</p>
                {suggestedDate && (
                  <button onClick={handleUseSuggested} className="mt-2 text-xs text-[#005587] font-bold underline">
                    Use {new Date(suggestedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} instead →
                  </button>
                )}
              </div>
            )}
            {addWarning && !addError && (
              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs text-amber-700">{addWarning}</p>
              </div>
            )}

            {/* Existing tests on this day */}
            {selectedDayTests.length > 0 && !addError && (
              <div className="mb-3">
                <p className="text-[10px] text-gray-500 mb-1">Already scheduled:</p>
                {selectedDayTests.map(t => (
                  <div key={t.entryId} className="text-xs text-gray-600 pl-2 border-l-2 border-amber-300 mb-1">
                    {t.teacherName} — {t.subject} ({t.testType})
                  </div>
                ))}
              </div>
            )}

            {/* Form (hidden when blocked) */}
            {(!addError || suggestedDate) && (
              <>
                <div className="space-y-3">
                  {/* Teacher */}
                  <div>
                    <label className="block text-[10px] font-medium text-gray-600 mb-1">Your Name</label>
                    <select value={teacherName} onChange={(e) => setTeacherName(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-[#005587]">
                      <option value="">Select...</option>
                      {TEACHERS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-[10px] font-medium text-gray-600 mb-1">Subject / Test Name</label>
                    <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., Unit 3 Test, Midterm Exam"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587]" />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-[10px] font-medium text-gray-600 mb-1">Assessment Type</label>
                    <div className="flex gap-2">
                      <button onClick={() => setTestType('summative')}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${testType === 'summative' ? 'bg-red-100 text-red-700 border-2 border-red-300' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                        Summative
                      </button>
                      <button onClick={() => setTestType('formative')}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${testType === 'formative' ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                        Formative
                      </button>
                    </div>
                  </div>
                </div>

                <button onClick={handleSubmit} disabled={!teacherName || !subject || submitting || !!addError}
                  className="w-full mt-4 py-3 bg-[#005587] text-white rounded-xl text-sm font-bold disabled:opacity-50 active:scale-[0.98] transition-transform">
                  {submitting ? 'Adding...' : 'Add to Calendar'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
