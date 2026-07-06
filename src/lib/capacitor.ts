/**
 * Capacitor native bridge utilities for ClassCast iOS app
 * These utilities provide safe access to native device features
 * and gracefully degrade when running in a browser.
 */

import { Capacitor } from '@capacitor/core';

// Platform detection
export const isNativePlatform = () => Capacitor.isNativePlatform();
export const isIOS = () => Capacitor.getPlatform() === 'ios';
export const isAndroid = () => Capacitor.getPlatform() === 'android';
export const isWeb = () => Capacitor.getPlatform() === 'web';

/**
 * Initialize native plugins when running on a device.
 * Call this once at app startup (e.g., in layout or _app).
 */
export async function initializeNativeApp() {
  if (!isNativePlatform()) return;

  try {
    // Status bar setup - transparent, overlays web view
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#ffffff' });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (e) {
    console.warn('StatusBar plugin not available:', e);
  }

  try {
    // Hide splash screen after a brief delay
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch (e) {
    console.warn('SplashScreen plugin not available:', e);
  }

  try {
    // Keyboard configuration for iOS
    const { Keyboard } = await import('@capacitor/keyboard');
    if (isIOS()) {
      await Keyboard.setAccessoryBarVisible({ isVisible: true });
      await Keyboard.setScroll({ isDisabled: false });
    }
  } catch (e) {
    console.warn('Keyboard plugin not available:', e);
  }
}

/**
 * Register push notification handlers.
 * Returns a cleanup function to unregister listeners.
 */
export async function registerPushNotifications(
  onToken?: (token: string) => void,
  onNotification?: (notification: any) => void
) {
  if (!isNativePlatform()) return () => {};

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // Request permission
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') {
      console.log('Push notification permission not granted');
      return () => {};
    }

    // Register with APNS
    await PushNotifications.register();

    // Listen for registration success
    const regListener = await PushNotifications.addListener('registration', (token) => {
      console.log('Push registration token:', token.value);
      onToken?.(token.value);
    });

    // Listen for registration errors
    const errListener = await PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });

    // Listen for incoming notifications
    const recvListener = await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
      onNotification?.(notification);
    });

    // Listen for notification tap
    const tapListener = await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push notification tapped:', action);
      onNotification?.(action.notification);
    });

    // Return cleanup function
    return () => {
      regListener.remove();
      errListener.remove();
      recvListener.remove();
      tapListener.remove();
    };
  } catch (e) {
    console.warn('PushNotifications plugin not available:', e);
    return () => {};
  }
}

/**
 * Trigger haptic feedback on native devices.
 */
export async function hapticFeedback(style: 'light' | 'medium' | 'heavy' = 'light') {
  if (!isNativePlatform()) return;

  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    const styleMap = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: styleMap[style] });
  } catch (e) {
    // Silently fail - haptics are optional
  }
}

/**
 * Handle app state changes (foreground/background).
 */
export async function onAppStateChange(
  callback: (isActive: boolean) => void
) {
  if (!isNativePlatform()) return () => {};

  try {
    const { App } = await import('@capacitor/app');
    const listener = await App.addListener('appStateChange', (state) => {
      callback(state.isActive);
    });
    return () => listener.remove();
  } catch (e) {
    console.warn('App plugin not available:', e);
    return () => {};
  }
}

/**
 * Handle hardware back button (Android, but included for completeness).
 */
export async function onBackButton(callback: () => void) {
  if (!isNativePlatform()) return () => {};

  try {
    const { App } = await import('@capacitor/app');
    const listener = await App.addListener('backButton', () => {
      callback();
    });
    return () => listener.remove();
  } catch (e) {
    return () => {};
  }
}

/**
 * Safe area insets helper for iOS notch/dynamic island.
 */
export function getSafeAreaInsets(): { top: number; bottom: number; left: number; right: number } {
  if (typeof window === 'undefined') {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }

  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue('--sat') || '0', 10) || (isIOS() ? 47 : 0),
    bottom: parseInt(style.getPropertyValue('--sab') || '0', 10) || (isIOS() ? 34 : 0),
    left: parseInt(style.getPropertyValue('--sal') || '0', 10),
    right: parseInt(style.getPropertyValue('--sar') || '0', 10),
  };
}
