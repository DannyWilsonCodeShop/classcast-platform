'use client';

import { useEffect } from 'react';
import { initializeNativeApp, isNativePlatform, onAppStateChange } from '@/lib/capacitor';

/**
 * Component that initializes native app features when running on a device.
 * Include this in your root layout. It's a no-op on web.
 * 
 * Safe area strategy: We set CSS custom properties and mark the html element
 * with [data-native] so individual components can consume safe area insets.
 * We do NOT apply body padding here — that causes double-padding when
 * child elements also use env(safe-area-inset-*).
 */
export function NativeAppInit() {
  useEffect(() => {
    let cleanupAppState: (() => void) | undefined;

    const init = async () => {
      // Mark document as native for CSS targeting
      document.documentElement.setAttribute('data-native', 'true');

      // Initialize native plugins (status bar, splash screen, keyboard)
      await initializeNativeApp();

      // Listen for app state changes to refresh data when app returns to foreground
      cleanupAppState = await onAppStateChange((isActive) => {
        if (isActive) {
          console.log('[Native] App returned to foreground');
        }
      });
    };

    if (isNativePlatform()) {
      init();
    }

    return () => {
      cleanupAppState?.();
      document.documentElement.removeAttribute('data-native');
    };
  }, []);

  // Inject safe area CSS variables — NO body padding (handled per-element)
  if (typeof window !== 'undefined' && isNativePlatform()) {
    return (
      <style jsx global>{`
        :root {
          --sat: env(safe-area-inset-top, 0px);
          --sab: env(safe-area-inset-bottom, 0px);
          --sal: env(safe-area-inset-left, 0px);
          --sar: env(safe-area-inset-right, 0px);
        }
      `}</style>
    );
  }

  return null;
}
