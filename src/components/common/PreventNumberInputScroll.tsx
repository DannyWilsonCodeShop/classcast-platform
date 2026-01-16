'use client';

import { useEffect } from 'react';

/**
 * Global component to prevent mouse wheel from changing number input values
 * This prevents accidental changes when scrolling over number/date inputs
 */
export function PreventNumberInputScroll() {
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if the target is a number input and is focused
      if (
        target.tagName === 'INPUT' &&
        (target as HTMLInputElement).type === 'number' &&
        document.activeElement === target
      ) {
        // Prevent the default scroll behavior that changes the value
        e.preventDefault();
      }
    };

    // Add event listener with passive: false to allow preventDefault
    document.addEventListener('wheel', handleWheel, { passive: false });

    // Cleanup on unmount
    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // This component doesn't render anything
  return null;
}
