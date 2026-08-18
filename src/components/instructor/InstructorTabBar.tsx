'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LiquidGlassIndicator } from '@/components/student/LiquidGlassIndicator';
import { useLiquidGlass } from '@/hooks/useLiquidGlass';
import { useSwipeNavigationContext } from '@/components/transitions/SwipeNavigationProvider';
import { CreateModal } from '@/components/instructor/CreateModal';
import { useSchoolTheme } from '@/hooks/useSchoolTheme';

/**
 * Floating glass bottom navigation bar for instructor mobile pages.
 * Mirrors StudentTabBar structure with instructor-specific tabs:
 * Dashboard | Grading | Create (center action) | Courses | Profile
 */
export function InstructorTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  // Prefetch routes on mount
  useEffect(() => {
    router.prefetch('/instructor/dashboard');
    router.prefetch('/instructor/grading');
    router.prefetch('/instructor/courses');
    router.prefetch('/instructor/profile');
  }, [router]);
  const theme = useSchoolTheme();

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Track the previous active tab to return indicator after modal close
  const previousActiveRef = useRef<number>(0);

  const isActive = (path: string) => {
    if (path === '/instructor/dashboard') return pathname === '/instructor/dashboard';
    if (path === '/instructor/grading') return pathname?.startsWith('/instructor/grading');
    if (path === '/instructor/courses') return pathname?.startsWith('/instructor/courses');
    if (path === '/instructor/profile') return pathname?.startsWith('/instructor/profile');
    return false;
  };

  const inactiveColor = 'text-gray-400';
  const activeColor = 'text-[color:var(--theme-primary)]';
  const avatarUrl = user?.avatar || user?.profileImage || null;
  const userInitial = (user?.firstName || user?.email || '?')[0]?.toUpperCase();

  // Determine active tab visual index
  const getActiveIndex = (): number => {
    if (isActive('/instructor/dashboard')) return 0;
    if (isActive('/instructor/grading')) return 1;
    if (isActive('/instructor/courses')) return 3;
    if (isActive('/instructor/profile')) return 4;
    return -1;
  };
  const activeIdx = getActiveIndex();

  // Liquid glass indicator hooks
  const { indicatorRef, animateToTab, syncWithSwipeProgress, snapBack } = useLiquidGlass();
  const swipeContext = useSwipeNavigationContext();

  // Sync liquid glass indicator with swipe progress via rAF loop
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!swipeContext) return;

    const { progressRef, isSwipingRef, targetTabIndexRef } = swipeContext;

    // Map swipe tab indices to visual indices for the indicator
    // Dashboard=0, Grading=1, Courses=3, Profile=4
    const SWIPE_TO_VISUAL = [0, 1, 3, 4];

    const tick = () => {
      if (isSwipingRef.current && targetTabIndexRef.current !== null) {
        const sourceVisual = activeIdx;
        const targetVisual = SWIPE_TO_VISUAL[targetTabIndexRef.current] ?? activeIdx;
        syncWithSwipeProgress(progressRef.current, sourceVisual, targetVisual);
      }
      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [swipeContext, activeIdx, syncWithSwipeProgress]);

  // Mounted state guard to prevent SSR portal issues
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Prefetch tab routes on mount for instant navigation
  useEffect(() => {
    router.prefetch('/instructor/dashboard');
    router.prefetch('/instructor/grading');
    router.prefetch('/instructor/courses');
    router.prefetch('/instructor/profile');
  }, [router]);

  // Create button handler
  const handleCreateClick = () => {
    previousActiveRef.current = activeIdx >= 0 ? activeIdx : 0;
    animateToTab(2);
    setTimeout(() => {
      setShowCreateModal(true);
    }, 450);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    // After modal exits, slide indicator back to previous active tab
    setTimeout(() => {
      animateToTab(previousActiveRef.current);
    }, 280);
  };

  return (
    <>
      {/* Spacer to prevent content from hiding behind fixed nav */}
      <div className="shrink-0 h-[80px] native-bottom-nav" />

      {mounted && createPortal(
        <nav
          className="fixed bottom-4 left-4 right-4 z-40 px-2 py-2 rounded-2xl native-bottom-nav"
          style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.25)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.3)',
          }}
        >
          <div className="relative flex items-center">
            {/* Active tab indicator */}
            {activeIdx >= 0 && (
              <LiquidGlassIndicator activeIndex={activeIdx} indicatorRef={indicatorRef} />
            )}

            {/* Dashboard tab */}
            <button
              className="relative flex flex-col items-center w-1/5 py-1 z-10"
              onClick={() => { animateToTab(0); router.push('/instructor/dashboard'); }}
            >
              <svg className={`w-6 h-6 ${isActive('/instructor/dashboard') ? activeColor : inactiveColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className={`text-[9px] ${isActive('/instructor/dashboard') ? activeColor + ' font-medium' : inactiveColor}`}>Dashboard</span>
            </button>

            {/* Grading tab */}
            <button
              className="relative flex flex-col items-center w-1/5 py-1 z-10"
              onClick={() => { animateToTab(1); router.push('/instructor/grading'); }}
            >
              <svg className={`w-6 h-6 ${isActive('/instructor/grading') ? activeColor : inactiveColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className={`text-[9px] ${isActive('/instructor/grading') ? activeColor + ' font-medium' : inactiveColor}`}>Grading</span>
            </button>

            {/* Create (center action button) */}
            <button
              className="relative flex flex-col items-center w-1/5 py-1 z-10"
              onClick={handleCreateClick}
            >
              <svg className={`w-6 h-6 ${inactiveColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-[9px] text-gray-400">Create</span>
            </button>

            {/* Courses tab */}
            <button
              className="relative flex flex-col items-center w-1/5 py-1 z-10"
              onClick={() => { animateToTab(3); router.push('/instructor/courses'); }}
            >
              <svg className={`w-6 h-6 ${isActive('/instructor/courses') ? activeColor : inactiveColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className={`text-[9px] ${isActive('/instructor/courses') ? activeColor + ' font-medium' : inactiveColor}`}>Courses</span>
            </button>

            {/* Profile tab (avatar) */}
            <button
              className="relative flex flex-col items-center w-1/5 py-1 z-10"
              onClick={() => { animateToTab(4); router.push('/instructor/profile'); }}
            >
              <div className="w-6 h-6 rounded-full overflow-hidden bg-[#005587] flex items-center justify-center">
                {avatarUrl && avatarUrl.startsWith('http') ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : avatarUrl && avatarUrl.length <= 4 ? (
                  <span className="text-xs">{avatarUrl}</span>
                ) : (
                  <span className="text-white text-[10px] font-bold">{userInitial}</span>
                )}
              </div>
              <span className={`text-[9px] ${isActive('/instructor/profile') ? activeColor + ' font-medium' : inactiveColor}`}>Profile</span>
            </button>
          </div>
        </nav>,
        document.body
      )}

      {/* Create Modal */}
      <CreateModal isOpen={showCreateModal} onClose={closeCreateModal} />
    </>
  );
}
