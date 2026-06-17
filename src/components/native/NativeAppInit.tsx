'use client';

import { useEffect } from 'react';
import { initializeNativeApp, isNativePlatform, onAppStateChange } from '@/lib/capacitor';

/**
 * Component that initializes native app features when running on a device.
 * Include this in your root layout. It's a no-op on web.
 */
export function NativeAppInit() {
  useEffect(() => {
    let cleanupAppState: (() => void) | undefined;

    const init = async () => {
      // Initialize native plugins (status bar, splash screen, keyboard)
      await initializeNativeApp();

      // Listen for app state changes to refresh data when app returns to foreground
      cleanupAppState = await onAppStateChange((isActive) => {
        if (isActive) {
          // App came to foreground - could trigger data refresh
          console.log('[Native] App returned to foreground');
        }
      });
    };

    if (isNativePlatform()) {
      init();
    }

    return () => {
      cleanupAppState?.();
    };
  }, []);

  // Add safe area CSS custom properties for native devices
  if (typeof window !== 'undefined' && isNativePlatform()) {
    return (
      <style jsx global>{`
        :root {
          --sat: env(safe-area-inset-top);
          --sab: env(safe-area-inset-bottom);
          --sal: env(safe-area-inset-left);
          --sar: env(safe-area-inset-right);
        }
        body {
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
        }
      `}</style>
    );
  }

  return null;
}
