/**
 * STUDENT DASHBOARD LAYOUT REFERENCE
 * Use this as a template to recreate similar layouts
 * This is the EXACT structure from src/app/student/dashboard/page.tsx
 */

import React from 'react';

const StudentDashboardLayoutReference = () => {
  return (
    <DashboardLayout 
      title="Good morning, Danny!" 
      subtitle="Ready to continue your learning journey?"
    >
      <div className="pb-8">
        {/* Main Content Grid - 4 columns, 3/4 left, 1/4 right */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* LEFT COLUMN - Social Feed (3/4 width) */}
          <div className="lg:col-span-3 flex flex-col">
            
            {/* Post Composer Bar - Sticky at top */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-lg border border-blue-200 p-4 mb-4 flex-shrink-0">
              <div className="flex items-center space-x-3">
                {/* Avatar */}
                <Avatar 
                  user={user}
                  size="md"
                  className="w-10 h-10 ring-2 ring-blue-300"
                />
                
                {/* Expandable Post Button */}
                <button
                  onClick={() => setShowPostComposer(!showPostComposer)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-white to-blue-50 rounded-full text-left text-gray-700 text-sm hover:from-blue-50 hover:to-purple-50 transition-all border-2 border-blue-200 shadow-sm"
                >
                  ✨ Share a funny moment from your day!
                </button>
                
                {/* Explore Toggle */}
                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-2 text-sm text-blue-700 cursor-pointer bg-white px-3 py-2 rounded-full border border-blue-200 hover:bg-blue-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={includeAllPublicVideos}
                      onChange={(e) => setIncludeAllPublicVideos(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="whitespace-nowrap flex items-center font-medium">
                      <FireIcon className="w-4 h-4 mr-1 text-orange-500" />
                      Explore
                    </span>
                  </label>
                </div>
              </div>

              {/* Expanded Post Composer */}
              {showPostComposer && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Share a funny moment from your day!"
                    className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300 text-sm bg-white shadow-sm"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex items-center justify-end space-x-3 mt-3">
                    <button
                      onClick={() => {
                        setShowPostComposer(false);
                        setPostContent('');
                      }}
                      className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePostSubmit}
                      disabled={!postContent.trim()}
                      className="px-6 py-2 text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md font-medium"
                    >
                      Post ✨
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Explore Mode Banner (conditional) */}
            {includeAllPublicVideos && (
              <div className="bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 rounded-xl p-4 flex items-center justify-between shadow-lg mb-4 flex-shrink-0">
                <div className="flex items-center space-x-3 text-white">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <FireIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">🔥 Explore Mode Active</p>
                    <p className="text-sm opacity-90">Discovering amazing content from all courses</p>
                  </div>
                </div>
                <button
                  onClick={() => setIncludeAllPublicVideos(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Feed Container */}
            <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-xl shadow-lg border border-blue-200">
              {/* Feed Header */}
              <div className="p-4 border-b border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white mr-3">
                    🎥
                  </span>
                  Student Videos & Community
                </h3>
                <p className="text-sm text-gray-600 ml-11">See what your classmates are sharing</p>
              </div>
              
              {/* Scrollable Feed */}
              <div className="max-h-[600px] overflow-y-auto">
                {filteredFeedItems.length === 0 ? (
                  // Empty State
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <VideoCameraIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">No Posts Yet</h3>
                    <p className="text-sm text-gray-600">
                      Student videos and community posts will appear here.
                    </p>
                  </div>
                ) : (
                  // Virtualized Feed
                  <VirtualizedFeed
                    feedItems={filteredFeedItems}
                    renderItem={(item, index) => (
                      <FeedItemCard 
                        key={item.id} 
                        item={item}
                      />
                    )}
                  />
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Sidebar Widgets (1/4 width) */}
          <div className="space-y-4">
            
            {/* Widget 1: Recent Grades */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-gray-900">Recent Grades</h3>
                <button
                  onClick={() => router.push('/student/grades')}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All
                </button>
              </div>
              
              {/* Average Grade Display */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average</span>
                  <span className="text-2xl font-bold text-blue-600">92%</span>
                </div>
              </div>

              {/* Recent Grades List */}
              <div className="space-y-2">
                {grades.map((grade) => (
                  <div key={grade.id} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-900">{grade.courseName}</span>
                      <span className="text-sm font-bold text-blue-600">{grade.grade}%</span>
                    </div>
                    <div className="text-xs text-gray-500">{grade.assignmentTitle}</div>
                    <div className="text-xs text-gray-400">{grade.date}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 2: Upcoming Assignments */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-lg">
                    ⏰
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Upcoming Assignments</h3>
                </div>
              </div>
              
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <div 
                    key={assignment.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => router.push(`/student/courses/${assignment.courseId}`)}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs font-medium text-gray-900">{assignment.courseName}</span>
                      <span className={`text-xs font-bold ${
                        assignment.daysUntilDue <= 2 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {assignment.daysUntilDue}d
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 font-medium">{assignment.title}</div>
                    <div className="text-xs text-gray-500 mt-1">Due: {assignment.dueDate}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 3: Study Modules (Coming Soon) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-gray-900">Study Modules</h3>
                <button
                  onClick={() => router.push('/student/study-modules')}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All
                </button>
              </div>
              <div className="text-center py-4">
                <AcademicCapIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-medium">Coming Soon</p>
                <p className="text-xs text-gray-400 mt-1">Interactive study modules will be available soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

/**
 * FEED ITEM CARD STRUCTURE
 * This is how each video/post card is structured
 */
const FeedItemCard = ({ item }) => {
  return (
    <div className="border-b border-gray-100 p-4 hover:bg-gray-50/50 transition-colors">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Avatar 
            src={item.author?.avatar}
            name={item.author?.name}
            size="sm"
            className="w-6 h-6"
          />
          <div>
            <p className="font-medium text-xs text-gray-900">{item.author?.name}</p>
            <p className="text-xs text-gray-500">{item.timestamp}</p>
          </div>
        </div>
        <button className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-200">
          Study Buddy
        </button>
      </div>

      {/* Video Player */}
      <div className="bg-black relative aspect-video w-full rounded-lg overflow-hidden mb-3">
        <video
          className="w-full h-full object-contain"
          controls
          src={item.videoUrl}
        />
      </div>

      {/* Card Content */}
      <div className="mb-3">
        <h4 className="font-semibold text-sm text-gray-900 mb-1">{item.title}</h4>
        <p className="text-xs text-gray-600">{item.description}</p>
        <div className="flex items-center space-x-2 mt-2">
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            {item.courseName}
          </span>
        </div>
      </div>

      {/* Interaction Bar */}
      <div className="flex items-center space-x-4 text-sm text-gray-600">
        <button className="flex items-center space-x-1 hover:text-red-500">
          <span>❤️</span>
          <span>{item.likes}</span>
        </button>
        <button className="flex items-center space-x-1 hover:text-blue-500">
          <span>💬</span>
          <span>{item.comments}</span>
        </button>
        <button className="flex items-center space-x-1 hover:text-green-500">
          <span>👁️</span>
          <span>{item.views}</span>
        </button>
      </div>
    </div>
  );
};

/**
 * KEY LAYOUT CLASSES TO USE:
 * 
 * Main Grid:
 * - grid grid-cols-1 lg:grid-cols-4 gap-6
 * 
 * Left Column (Feed):
 * - lg:col-span-3 flex flex-col
 * 
 * Right Column (Sidebar):
 * - space-y-4 (no col-span needed, takes remaining 1 column)
 * 
 * Post Composer:
 * - bg-gradient-to-r from-blue-50 to-purple-50
 * - rounded-xl shadow-lg border border-blue-200 p-4
 * 
 * Feed Container:
 * - bg-gradient-to-br from-white to-blue-50/30
 * - rounded-xl shadow-lg border border-blue-200
 * - max-h-[600px] overflow-y-auto (for scrollable area)
 * 
 * Sidebar Widgets:
 * - bg-white rounded-xl shadow-sm border border-gray-200 p-4
 * 
 * Mobile Responsive:
 * - grid-cols-1 (single column on mobile)
 * - lg:grid-cols-4 (4 columns on desktop)
 * - lg:col-span-3 (feed takes 3 columns on desktop)
 */

export default StudentDashboardLayoutReference;
