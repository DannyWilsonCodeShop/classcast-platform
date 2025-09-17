'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Link from 'next/link';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  grade: string;
  major: string;
  bio: string;
  profilePicture: string | null;
  personalInfo: {
    birthday: string;
    hometown: string;
    hobbies: string[];
    favoriteSubject: string;
    careerGoal: string;
    funFacts: string[];
  };
  socialLinks: {
    instagram: string;
    twitter: string;
    linkedin: string;
  };
}

export default function EditProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    grade: '',
    major: '',
    bio: '',
    profilePicture: null,
    personalInfo: {
      birthday: '',
      hometown: '',
      hobbies: [],
      favoriteSubject: '',
      careerGoal: '',
      funFacts: []
    },
    socialLinks: {
      instagram: '',
      twitter: '',
      linkedin: ''
    }
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newHobby, setNewHobby] = useState('');
  const [newFunFact, setNewFunFact] = useState('');

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    // Load existing profile data
    setProfileData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      grade: '11th Grade', // Default value
      major: 'Computer Science', // Default value
      bio: 'Love learning and helping others!',
      profilePicture: null,
      personalInfo: {
        birthday: '',
        hometown: '',
        hobbies: ['Coding', 'Reading', 'Sports'],
        favoriteSubject: 'Mathematics',
        careerGoal: 'Software Engineer',
        funFacts: ['I can solve a Rubik\'s cube in under 2 minutes', 'I speak 3 languages']
      },
      socialLinks: {
        instagram: '',
        twitter: '',
        linkedin: ''
      }
    });
  }, [user, isAuthenticated, isLoading, router]);

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    
    // Mock upload - in real app, this would upload to your storage service
    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData(prev => ({
          ...prev,
          profilePicture: e.target?.result as string
        }));
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }, 1000);
  };

  const handleInputChange = (field: string, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePersonalInfoChange = (field: string, value: any) => {
    setProfileData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

  const addHobby = () => {
    if (newHobby.trim() && !profileData.personalInfo.hobbies.includes(newHobby.trim())) {
      handlePersonalInfoChange('hobbies', [...profileData.personalInfo.hobbies, newHobby.trim()]);
      setNewHobby('');
    }
  };

  const removeHobby = (hobby: string) => {
    handlePersonalInfoChange('hobbies', profileData.personalInfo.hobbies.filter(h => h !== hobby));
  };

  const addFunFact = () => {
    if (newFunFact.trim() && !profileData.personalInfo.funFacts.includes(newFunFact.trim())) {
      handlePersonalInfoChange('funFacts', [...profileData.personalInfo.funFacts, newFunFact.trim()]);
      setNewFunFact('');
    }
  };

  const removeFunFact = (fact: string) => {
    handlePersonalInfoChange('funFacts', profileData.personalInfo.funFacts.filter(f => f !== fact));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Mock save - in real app, this would save to your backend
    setTimeout(() => {
      setIsSaving(false);
      alert('Profile saved successfully!');
      router.push('/dashboard');
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <LoadingSpinner text="Loading profile editor..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link 
              href="/dashboard"
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">Edit Profile</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Picture Section */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-yellow-300/30 sticky top-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📸 Profile Picture</h3>
              
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                    {profileData.profilePicture ? (
                      <img 
                        src={profileData.profilePicture} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-4xl font-bold">
                        {profileData.firstName?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  
                  <label className="absolute bottom-0 right-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  Click the + button to upload a new photo
                </p>
                
                {isUploading && (
                  <div className="flex items-center justify-center text-blue-600">
                    <LoadingSpinner size="sm" text="Uploading..." />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-blue-300/30">
              <h3 className="text-lg font-bold text-gray-800 mb-4">👤 Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                  <select
                    value={profileData.grade}
                    onChange={(e) => handleInputChange('grade', e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none"
                  >
                    <option value="9th Grade">9th Grade</option>
                    <option value="10th Grade">10th Grade</option>
                    <option value="11th Grade">11th Grade</option>
                    <option value="12th Grade">12th Grade</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Major/Interest</label>
                  <input
                    type="text"
                    value={profileData.major}
                    onChange={(e) => handleInputChange('major', e.target.value)}
                    placeholder="e.g., Computer Science, Mathematics, Engineering..."
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-green-300/30">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🌟 Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Birthday</label>
                  <input
                    type="date"
                    value={profileData.personalInfo.birthday}
                    onChange={(e) => handlePersonalInfoChange('birthday', e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hometown</label>
                  <input
                    type="text"
                    value={profileData.personalInfo.hometown}
                    onChange={(e) => handlePersonalInfoChange('hometown', e.target.value)}
                    placeholder="e.g., San Francisco, CA"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Favorite Subject</label>
                  <input
                    type="text"
                    value={profileData.personalInfo.favoriteSubject}
                    onChange={(e) => handlePersonalInfoChange('favoriteSubject', e.target.value)}
                    placeholder="e.g., Mathematics, Science, English..."
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Career Goal</label>
                  <input
                    type="text"
                    value={profileData.personalInfo.careerGoal}
                    onChange={(e) => handlePersonalInfoChange('careerGoal', e.target.value)}
                    placeholder="e.g., Software Engineer, Doctor, Teacher..."
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Hobbies */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Hobbies & Interests</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {profileData.personalInfo.hobbies.map((hobby, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {hobby}
                      <button
                        onClick={() => removeHobby(hobby)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newHobby}
                    onChange={(e) => setNewHobby(e.target.value)}
                    placeholder="Add a hobby..."
                    className="flex-1 p-2 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && addHobby()}
                  />
                  <button
                    onClick={addHobby}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Fun Facts */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Fun Facts About Me</label>
                <div className="space-y-2 mb-3">
                  {profileData.personalInfo.funFacts.map((fact, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg"
                    >
                      <span className="text-sm text-gray-700">{fact}</span>
                      <button
                        onClick={() => removeFunFact(fact)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newFunFact}
                    onChange={(e) => setNewFunFact(e.target.value)}
                    placeholder="Add a fun fact..."
                    className="flex-1 p-2 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && addFunFact()}
                  />
                  <button
                    onClick={addFunFact}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-purple-300/30">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🔗 Social Links</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                  <input
                    type="text"
                    value={profileData.socialLinks.instagram}
                    onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                    placeholder="@username"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
                  <input
                    type="text"
                    value={profileData.socialLinks.twitter}
                    onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                    placeholder="@username"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                  <input
                    type="text"
                    value={profileData.socialLinks.linkedin}
                    onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                    placeholder="linkedin.com/in/username"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end space-x-4">
              <Link
                href="/dashboard"
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300"
              >
                Cancel
              </Link>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Saving...</span>
                  </div>
                ) : (
                  'Save Profile'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
