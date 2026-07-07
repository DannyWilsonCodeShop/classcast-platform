'use client';

import React, { useState, useRef } from 'react';
import { ProblemInput, ParsedSpreadsheet } from '@/types/problemBank';
import { parseSpreadsheet } from '@/lib/spreadsheetParser';

interface ProblemBankBuilderProps {
  bankId?: string;
  courseId: string;
  sectionId?: string;
  enrollmentCount?: number;
  onSave: (data: { title: string; description: string; problems: { content: string; imageUrl?: string }[] }) => void;
  onCancel: () => void;
  initialTitle?: string;
  initialDescription?: string;
  initialProblems?: ProblemInput[];
}

type TabType = 'paste' | 'image' | 'camera' | 'spreadsheet';

export function ProblemBankBuilder({
  bankId,
  courseId,
  sectionId,
  enrollmentCount = 0,
  onSave,
  onCancel,
  initialTitle = '',
  initialDescription = '',
  initialProblems = [],
}: ProblemBankBuilderProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [activeTab, setActiveTab] = useState<TabType>('paste');
  const [problems, setProblems] = useState<ProblemInput[]>(
    initialProblems.length > 0
      ? initialProblems
      : [{ id: crypto.randomUUID(), content: '', orderIndex: 0 }]
  );
  const [uploading, setUploading] = useState(false);
  const [spreadsheetPreview, setSpreadsheetPreview] = useState<ParsedSpreadsheet | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const spreadsheetInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const problemCount = problems.filter(p => p.content.trim() || p.imageUrl).length;

  const getIndicatorColor = () => {
    if (enrollmentCount === 0) return 'bg-gray-100 text-gray-600';
    if (problemCount === enrollmentCount) return 'bg-green-100 text-green-700';
    if (problemCount > enrollmentCount) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  // Paste Text tab handlers
  const addProblemRow = () => {
    setProblems([...problems, { id: crypto.randomUUID(), content: '', orderIndex: problems.length }]);
  };

  const removeProblemRow = (id: string) => {
    if (problems.length <= 1) return;
    setProblems(problems.filter(p => p.id !== id).map((p, i) => ({ ...p, orderIndex: i })));
  };

  const updateProblemContent = (id: string, content: string) => {
    setProblems(problems.map(p => p.id === id ? { ...p, content } : p));
  };

  const handlePasteMultiline = (id: string, text: string) => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length <= 1) {
      updateProblemContent(id, text);
      return;
    }
    // Multi-line paste: replace current row and add new rows
    const idx = problems.findIndex(p => p.id === id);
    const before = problems.slice(0, idx);
    const after = problems.slice(idx + 1);
    const newProblems = lines.map((line, i) => ({
      id: crypto.randomUUID(),
      content: line.trim(),
      orderIndex: idx + i,
    }));
    setProblems([...before, ...newProblems, ...after].map((p, i) => ({ ...p, orderIndex: i })));
  };

  // Image upload handler
  const handleImageUpload = async (files: FileList) => {
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await fetch('/api/upload/presigned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            folder: `problem-banks/${bankId || 'new'}`,
          }),
        });
        const data = await res.json();
        if (data.success) {
          await fetch(data.data.presignedUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type },
          });
          setProblems(prev => [...prev, {
            id: crypto.randomUUID(),
            content: '',
            imageUrl: data.data.fileUrl,
            orderIndex: prev.length,
          }]);
        }
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  // Camera capture handler
  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await handleImageUpload(files);
  };

  // Spreadsheet handler
  const handleSpreadsheetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const parsed = await parseSpreadsheet(file);
    setSpreadsheetPreview(parsed);
  };

  const confirmSpreadsheet = () => {
    if (!spreadsheetPreview) return;
    const newProblems: ProblemInput[] = spreadsheetPreview.rows.map((row, i) => ({
      id: crypto.randomUUID(),
      content: row,
      orderIndex: problems.length + i,
    }));
    setProblems([...problems.filter(p => p.content.trim() || p.imageUrl), ...newProblems].map((p, i) => ({ ...p, orderIndex: i })));
    setSpreadsheetPreview(null);
  };

  const handleSave = () => {
    const validProblems = problems
      .filter(p => p.content.trim() || p.imageUrl)
      .map(p => ({ content: p.content, imageUrl: p.imageUrl }));
    if (!title.trim()) return;
    if (validProblems.length === 0) return;
    onSave({ title: title.trim(), description: description.trim(), problems: validProblems });
  };

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'paste', label: 'Paste Text', icon: '📝' },
    { key: 'image', label: 'Upload Image', icon: '🖼️' },
    { key: 'camera', label: 'Take Photo', icon: '📷' },
    { key: 'spreadsheet', label: 'Spreadsheet', icon: '📊' },
  ];

  return (
    <div className="space-y-4">
      {/* Title & Description */}
      <div className="space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Problem Bank Title"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold text-[#005587] focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587] resize-none"
        />
      </div>

      {/* Enrollment Indicator */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${getIndicatorColor()}`}>
        <span>📋 {problemCount} / {enrollmentCount || '?'} students</span>
        {enrollmentCount > 0 && problemCount < enrollmentCount && (
          <span className="text-[10px]">({enrollmentCount - problemCount} more needed)</span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 text-xs font-medium text-center transition-colors border-b-2 ${
              activeTab === tab.key
                ? 'border-[#005587] text-[#005587]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="block text-base mb-0.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {/* Paste Text Tab */}
        {activeTab === 'paste' && (
          <div className="space-y-2">
            {problems.map((problem, idx) => (
              <div key={problem.id} className="flex items-start gap-2">
                <span className="text-xs text-gray-400 mt-3 w-5 text-right">{idx + 1}</span>
                <textarea
                  value={problem.content}
                  onChange={(e) => updateProblemContent(problem.id, e.target.value)}
                  onPaste={(e) => {
                    const text = e.clipboardData.getData('text');
                    if (text.includes('\n')) {
                      e.preventDefault();
                      handlePasteMultiline(problem.id, text);
                    }
                  }}
                  placeholder={`Problem ${idx + 1}...`}
                  rows={2}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#005587] focus:outline-none resize-none"
                />
                <button
                  onClick={() => removeProblemRow(problem.id)}
                  className="mt-2 text-gray-400 hover:text-red-500 transition-colors"
                  disabled={problems.length <= 1}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={addProblemRow}
              className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-[#005587] hover:text-[#005587] transition-colors"
            >
              + Add Problem
            </button>
          </div>
        )}

        {/* Upload Image Tab */}
        {activeTab === 'image' && (
          <div className="space-y-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full py-8 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-[#005587] transition-colors"
            >
              {uploading ? (
                <span className="text-sm text-gray-500">Uploading...</span>
              ) : (
                <>
                  <span className="block text-2xl mb-1">🖼️</span>
                  <span className="text-sm text-gray-600">Tap to select images (PNG, JPG, HEIC)</span>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/heic"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
            />
            {/* Image thumbnails */}
            {problems.filter(p => p.imageUrl).length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {problems.filter(p => p.imageUrl).map(p => (
                  <div key={p.id} className="relative rounded-lg overflow-hidden border border-gray-200">
                    <img src={p.imageUrl} alt="" className="w-full h-24 object-cover" />
                    <button
                      onClick={() => setProblems(problems.filter(pr => pr.id !== p.id))}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Take Photo Tab */}
        {activeTab === 'camera' && (
          <div className="space-y-3">
            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploading}
              className="w-full py-8 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-[#005587] transition-colors"
            >
              {uploading ? (
                <span className="text-sm text-gray-500">Uploading...</span>
              ) : (
                <>
                  <span className="block text-2xl mb-1">📷</span>
                  <span className="text-sm text-gray-600">Tap to open camera</span>
                </>
              )}
            </button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleCameraCapture}
            />
            {/* Photo thumbnails */}
            {problems.filter(p => p.imageUrl).length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {problems.filter(p => p.imageUrl).map(p => (
                  <div key={p.id} className="relative rounded-lg overflow-hidden border border-gray-200">
                    <img src={p.imageUrl} alt="" className="w-full h-24 object-cover" />
                    <button
                      onClick={() => setProblems(problems.filter(pr => pr.id !== p.id))}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Spreadsheet Tab */}
        {activeTab === 'spreadsheet' && (
          <div className="space-y-3">
            {!spreadsheetPreview ? (
              <>
                <button
                  onClick={() => spreadsheetInputRef.current?.click()}
                  className="w-full py-8 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-[#005587] transition-colors"
                >
                  <span className="block text-2xl mb-1">📊</span>
                  <span className="text-sm text-gray-600">Upload CSV, XLS, or XLSX file</span>
                  <span className="block text-xs text-gray-400 mt-1">First column = problem text</span>
                </button>
                <input
                  ref={spreadsheetInputRef}
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  className="hidden"
                  onChange={handleSpreadsheetUpload}
                />
              </>
            ) : (
              <div className="space-y-3">
                {spreadsheetPreview.errors.length > 0 && (
                  <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg">
                    {spreadsheetPreview.errors.join(', ')}
                  </div>
                )}
                <div className="text-sm font-medium text-gray-700">
                  Preview: {spreadsheetPreview.totalRows} problems found
                </div>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-2 py-1 text-left w-8">#</th>
                        <th className="px-2 py-1 text-left">Problem Text</th>
                      </tr>
                    </thead>
                    <tbody>
                      {spreadsheetPreview.rows.slice(0, 20).map((row, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-2 py-1 text-gray-400">{i + 1}</td>
                          <td className="px-2 py-1 truncate max-w-[200px]">{row}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {spreadsheetPreview.rows.length > 20 && (
                    <div className="text-xs text-gray-400 text-center py-1">
                      ...and {spreadsheetPreview.rows.length - 20} more
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={confirmSpreadsheet}
                    className="flex-1 py-2 bg-[#005587] text-white rounded-lg text-sm font-medium"
                  >
                    Import {spreadsheetPreview.totalRows} Problems
                  </button>
                  <button
                    onClick={() => setSpreadsheetPreview(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!title.trim() || problemCount === 0}
          className="flex-1 py-2.5 bg-[#005587] text-white rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {bankId ? 'Update Bank' : 'Save Bank'}
        </button>
      </div>
    </div>
  );
}
