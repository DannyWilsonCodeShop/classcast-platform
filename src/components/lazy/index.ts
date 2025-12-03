import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/common/Skeleton';

// Lazy load heavy components with loading states
export const VideoPlayer = dynamic(
  () => import('@/components/student/VideoPlayer').then(mod => ({ default: mod.VideoPlayer })),
  {
    loading: () => (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    ),
    ssr: false,
  }
);

export const YouTubePlayer = dynamic(
  () => import('@/components/common/YouTubePlayer').then(mod => ({ default: mod.YouTubePlayer })),
  {
    loading: () => (
      <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    ),
    ssr: false,
  }
);

export const VideoReels = dynamic(
  () => import('@/components/student/VideoReels'),
  {
    loading: () => <Skeleton height={400} />,
    ssr: false,
  }
);

export const AssignmentCreationForm = dynamic(
  () => import('@/components/instructor/AssignmentCreationForm'),
  {
    loading: () => <Skeleton height={600} />,
    ssr: false,
  }
);

export const BugReportModal = dynamic(
  () => import('@/components/common/BugReportModal'),
  {
    loading: () => null,
    ssr: false,
  }
);

export const InteractiveTour = dynamic(
  () => import('@/components/student/InteractiveTour'),
  {
    loading: () => null,
    ssr: false,
  }
);

export const WelcomeTour = dynamic(
  () => import('@/components/student/WelcomeTour'),
  {
    loading: () => null,
    ssr: false,
  }
);
