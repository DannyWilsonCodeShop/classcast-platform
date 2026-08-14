'use client';

import React, { useState } from 'react';

interface Submission {
  submissionId: string;
  videoUrl: string;
  thumbnailUrl?: string;
  studentName?: string;
}

export default function GenerateThumbnailsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [results, setResults] = useState<Array<{ id: string; success: boolean }>>([]);

  const fetchMissing = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/thumbnails-missing');
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.submissions || []);
      }
    } catch (err) {
      alert('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const generateAll = async () => {
    setProcessing(true);
    setProgress(0);
    setTotal(submissions.length);
    const newResults: Array<{ id: string; success: boolean }> = [];

    for (let i = 0; i < submissions.length; i++) {
      const sub = submissions[i];
      setProgress(i + 1);

      try {
        const dataUrl = await captureFrame(sub.videoUrl);
        if (dataUrl) {
          // Upload thumbnail
          const uploadRes = await fetch('/api/upload/thumbnail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: dataUrl, userId: 'bulk-gen', submissionId: sub.submissionId }),
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            const thumbUrl = uploadData.url || uploadData.thumbnailUrl;
            if (thumbUrl) {
              // Save to submission record
              await fetch(`/api/video-submissions/${sub.submissionId}/thumbnail`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ thumbnailUrl: thumbUrl }),
              });
              newResults.push({ id: sub.submissionId, success: true });
            } else {
              newResults.push({ id: sub.submissionId, success: false });
            }
          } else {
            newResults.push({ id: sub.submissionId, success: false });
          }
        } else {
          newResults.push({ id: sub.submissionId, success: false });
        }
      } catch {
        newResults.push({ id: sub.submissionId, success: false });
      }
    }

    setResults(newResults);
    setProcessing(false);
  };

  const captureFrame = (src: string): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!src || src.includes('youtube') || src.includes('youtu.be') || src.includes('drive.google')) {
        resolve(null);
        return;
      }

      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.src = src;

      video.onloadeddata = () => {
        video.currentTime = Math.min(2, video.duration * 0.1 || 0.5);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(video.videoWidth || 640, 640);
          canvas.height = Math.round(canvas.width * ((video.videoHeight || 360) / (video.videoWidth || 640)));
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
        video.src = '';
      };

      video.onerror = () => resolve(null);
      setTimeout(() => { video.src = ''; resolve(null); }, 15000);
    });
  };

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Bulk Generate Video Thumbnails</h1>
        <p className="text-sm text-gray-500 mb-6">This will find all video submissions without thumbnails and generate them.</p>

        {/* Step 1: Find missing */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Step 1: Find videos without thumbnails</h2>
          <button
            onClick={fetchMissing}
            disabled={loading}
            className="px-4 py-2 bg-[#005587] text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Scanning...' : 'Scan Submissions'}
          </button>
          {submissions.length > 0 && (
            <p className="mt-3 text-sm text-gray-600">Found <strong>{submissions.length}</strong> videos without thumbnails.</p>
          )}
        </div>

        {/* Step 2: Generate */}
        {submissions.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Step 2: Generate thumbnails</h2>
            <button
              onClick={generateAll}
              disabled={processing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {processing ? `Processing ${progress}/${total}...` : `Generate ${submissions.length} Thumbnails`}
            </button>
            {processing && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${(progress / total) * 100}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{progress} of {total} processed</p>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Results</h2>
            <div className="flex gap-4">
              <span className="text-sm text-green-600 font-medium">✓ {successCount} generated</span>
              <span className="text-sm text-red-500 font-medium">✕ {failCount} failed (YouTube/Drive or CORS)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
