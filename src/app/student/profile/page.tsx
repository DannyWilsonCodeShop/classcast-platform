'use client';

import React, { useState, useEffect } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import Avatar from '@/components/common/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { PasswordReset } from '@/components/PasswordReset';
import { NotificationPreferences } from '@/components/NotificationPreferences';
import DemoModeBanner from '@/components/common/DemoModeBanner';

const StudentProfilePage: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showNotificationPrefs, setShowNotificationPrefs] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editFields, setEditFields] = useState({
    firstName: '', lastName: '', bio: '', favoriteSubject: '', hobbies: '', avatar: ''
  });

  useEffect(() => {
    if (user) {
      setEditFields({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        bio: user.bio || '',
        favoriteSubject: user.favoriteSubject || '',
        hobbies: user.hobbies || '',
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const updatedUser = await api.updateUserProfile(user.id!, editFields);
      updateUser(updatedUser);
      setIsEditing(false);
    } catch (e) { console.error('Save error:', e); }
    finally { setIsLoading(false); }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) return;
    setIsUploading(true);
    try {
      const res = await fetch('/api/upload/presigned', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, userId: user.email || 'anon', folder: 'profile-pictures' }),
      });
      if (!res.ok) throw new Error('Failed');
      const { data } = await res.json();
      await fetch(data.presignedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      setEditFields(prev => ({ ...prev, avatar: data.fileUrl }));
    } catch (e) { console.error('Upload error:', e); }
    finally { setIsUploading(false); }
  };

  if (!user) {
    return <StudentRoute><div className="h-full flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005587]" /></div></StudentRoute>;
  }

  return (
    <StudentRoute>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@300;700&display=swap" rel="stylesheet" />
      <div className="h-full flex flex-col bg-gradient-to-br from-[#e8f4f8] via-white to-[#f0f9fc] overflow-hidden">
        <DemoModeBanner />
        {/* Header */}
        <div className="flex items-center px-3 py-2.5 border-b border-gray-100 shrink-0">
          <button onClick={() => router.push('/student/dashboard')} className="p-1.5 -ml-1 text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="flex-1 text-base font-bold uppercase text-[#005587] mx-2 tracking-normal" style={{ fontFamily: "'Oswald', sans-serif" }}>Profile</h1>
          {!isEditing ? (
            <div className="flex items-center gap-2">
              <button onClick={() => setIsEditing(true)} className="text-[#005587] text-xs font-medium">Edit</button>
              <img src="/CristoReyLogo.png" alt="" className="w-12 h-12 object-contain" />
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(false)} className="text-gray-400 text-xs">Cancel</button>
              <button onClick={handleSave} disabled={isLoading} className="text-[#005587] text-xs font-bold">{isLoading ? '...' : 'Save'}</button>
            </div>
          )}
        </div>

        {/* Scrollable content - everything fits on one screen */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Profile card */}
          <div className="px-4 py-4 bg-gradient-to-r from-[#005587] to-[#0077aa] flex items-center gap-3">
            <div className="relative">
              <Avatar user={isEditing ? { ...user, avatar: editFields.avatar } : user} size="lg" showBorder={true} className="border-white" />
              {isEditing && (
                <div className="absolute -bottom-1 -right-1 flex gap-0.5">
                  <label className="w-6 h-6 bg-[#FFC72C] rounded-full flex items-center justify-center cursor-pointer shadow">
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={isUploading} />
                    {isUploading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> :
                      <svg className="w-3 h-3 text-[#005587]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    }
                  </label>
                  <button onClick={() => setShowEmojiPicker(true)} className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow text-xs">😊</button>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="flex gap-2">
                  <input value={editFields.firstName} onChange={e => setEditFields(p => ({ ...p, firstName: e.target.value }))}
                    className="flex-1 text-white text-sm font-bold bg-white/20 border border-white/30 rounded px-2 py-0.5 placeholder-white/60" placeholder="First" />
                  <input value={editFields.lastName} onChange={e => setEditFields(p => ({ ...p, lastName: e.target.value }))}
                    className="flex-1 text-white text-sm font-bold bg-white/20 border border-white/30 rounded px-2 py-0.5 placeholder-white/60" placeholder="Last" />
                </div>
              ) : (
                <>
                  <h2 className="text-white text-lg font-bold truncate">{user.firstName} {user.lastName}</h2>
                  <p className="text-white/70 text-xs truncate">{user.email}</p>
                  {user.schoolName && <p className="text-white/50 text-[10px]">{user.schoolName}</p>}
                </>
              )}
            </div>
          </div>

          {/* Quick info fields */}
          <div className="px-4 py-3 space-y-2.5">
            <EditableField label="Bio" value={isEditing ? editFields.bio : user.bio} isEditing={isEditing}
              onChange={v => setEditFields(p => ({ ...p, bio: v }))} placeholder="Tell us about yourself" />
            <EditableField label="Favorite Subject" value={isEditing ? editFields.favoriteSubject : user.favoriteSubject} isEditing={isEditing}
              onChange={v => setEditFields(p => ({ ...p, favoriteSubject: v }))} placeholder="e.g. Math, Science" />
            <EditableField label="Hobbies" value={isEditing ? editFields.hobbies : user.hobbies} isEditing={isEditing}
              onChange={v => setEditFields(p => ({ ...p, hobbies: v }))} placeholder="What do you enjoy?" />
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 mx-4" />

          {/* Action buttons - all visible on one screen */}
          <div className="px-4 py-3 space-y-1.5">
            <ActionRow icon="🔔" label="Notification Preferences" onClick={() => setShowNotificationPrefs(true)} />
            <ActionRow icon="🔑" label="Change Password" onClick={() => setShowPasswordReset(true)} />
            <ActionRow icon="⚙️" label="Settings" onClick={() => router.push('/student/settings')} />
            <ActionRow icon="📊" label="My Grades" onClick={() => router.push('/student/grades')} />
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 mx-4" />

          {/* Logout - always visible */}
          <div className="px-4 py-3">
            <button onClick={logout} className="w-full py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium active:bg-red-50 transition-colors">
              Log Out
            </button>
          </div>
        </div>

        {/* Bottom Nav - 3 buttons */}
        <nav className="shrink-0 bg-white border-t border-gray-200 px-2 py-2 native-bottom-nav">
          <div className="flex items-center justify-around">
            <button className="flex flex-col items-center" onClick={() => router.push('/student/dashboard')}>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span className="text-[10px] text-gray-400 mt-0.5">Home</span>
            </button>
            <button className="flex flex-col items-center" onClick={() => router.push('/student/courses')}>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              <span className="text-[10px] text-gray-400 mt-0.5">Courses</span>
            </button>
            <button className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full border-2 border-[#FFC72C] overflow-hidden bg-[#005587]">
                {user.avatar && user.avatar.startsWith('http') ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : user.avatar && user.avatar.length <= 4 ? (
                  <span className="w-full h-full flex items-center justify-center text-sm">{user.avatar}</span>
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-white text-[9px] font-bold">{(user.firstName || '?')[0]}</span>
                )}
              </div>
              <span className="text-[10px] text-[#005587] font-medium mt-0.5">Profile</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowEmojiPicker(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white w-full max-w-[340px] mx-4 rounded-2xl p-4 max-h-[50vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-gray-900 mb-3">Choose Avatar</h3>
            <div className="overflow-y-auto flex-1 grid grid-cols-8 gap-2">
              {['😀','😎','🤓','🧐','🥳','🤠','👦','👧','🧑','👨','👩','👱','🧔','👼','🦸','🧙','💃','🕺','🏄','🏊','🚴','🧘','🎓','📚'].map((emoji, i) => (
                <button key={i} onClick={() => { setEditFields(p => ({ ...p, avatar: emoji })); setShowEmojiPicker(false); }}
                  className="w-9 h-9 text-xl hover:bg-gray-100 rounded-lg flex items-center justify-center">{emoji}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showPasswordReset && <PasswordReset onClose={() => setShowPasswordReset(false)} />}
      {showNotificationPrefs && user && (
        <NotificationPreferences userId={user.id} isOpen={showNotificationPrefs} onClose={() => setShowNotificationPrefs(false)} />
      )}
    </StudentRoute>
  );
};

export default StudentProfilePage;

/* Helper components */
function EditableField({ label, value, isEditing, onChange, placeholder }: {
  label: string; value?: string; isEditing: boolean; onChange: (v: string) => void; placeholder: string;
}) {
  if (isEditing) {
    return (
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">{label}</label>
        <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full mt-0.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#005587]" />
      </div>
    );
  }
  if (!value) return null;
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2">
      <span className="text-[10px] font-bold text-gray-400 uppercase">{label}</span>
      <p className="text-sm text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}

function ActionRow({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg active:bg-gray-50 transition-colors text-left">
      <span className="text-base">{icon}</span>
      <span className="text-sm text-gray-700 flex-1">{label}</span>
      <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
    </button>
  );
}
