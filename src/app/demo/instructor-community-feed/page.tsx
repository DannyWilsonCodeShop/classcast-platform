'use client';
import React from 'react';
import { InstructorCommunityFeed } from '@/components/instructor/InstructorCommunityFeed';

export default function InstructorCommunityFeedDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <InstructorCommunityFeed
          instructorId="demo-instructor-001"
          className="py-4"
        />
      </div>
    </div>
  );
}






