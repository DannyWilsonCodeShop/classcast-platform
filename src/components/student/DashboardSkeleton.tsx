'use client';

import React from 'react';

/** Pulsing placeholder block */
function Bone({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />;
}

/** Skeleton shown while dashboard data loads */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-4 py-3 bg-white flex-1">
      {/* Stats row skeleton */}
      <div className="flex gap-2">
        <Bone className="h-6 w-32 rounded-full" />
        <Bone className="h-6 w-28 rounded-full" />
      </div>
      {/* Assignment cards skeleton */}
      <div className="space-y-2 mt-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl p-4 bg-gray-100">
            <Bone className="h-4 w-3/4 mb-2" />
            <Bone className="h-3 w-1/2" />
          </div>
        ))}
      </div>
      {/* Feed skeleton */}
      <div className="mt-3">
        <Bone className="h-4 w-24 mb-3" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2].map(i => (
            <div key={i} className="w-44 shrink-0">
              <Bone className="h-5 w-20 mb-2 rounded-full" />
              <Bone className="h-48 w-full rounded-xl" />
              <Bone className="h-3 w-3/4 mt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Skeleton for the assignments list page */
export function AssignmentsSkeleton() {
  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="rounded-xl p-4 bg-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Bone className="h-4 w-3/4 mb-2" />
              <Bone className="h-3 w-1/3" />
            </div>
            <Bone className="h-5 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton for the courses grid */
export function CoursesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 px-4 py-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-xl p-4 bg-gray-100">
          <Bone className="h-5 w-2/3 mb-2" />
          <Bone className="h-3 w-1/2 mb-3" />
          <Bone className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}
