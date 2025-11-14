'use client';
import React from 'react';
import { StudentCommunityFeed } from '@/components/student/StudentCommunityFeed';

export default function CommunityFeedDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <StudentCommunityFeed
          currentUserId="demo-user-001"
          className="py-4"
        />
      </div>
    </div>
  );
}






