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
import { StudentTabBar } from '@/components/student/StudentTabBar';

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
      <div className="h-full flex flex-col bg-white overflow-hidden">
        <DemoModeBanner />

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

        {/* Bottom Nav */}
        <StudentTabBar />
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
