/**
 * Mobile Detection Utilities
 * 
 * Simple, reliable mobile device detection for upload optimization
 */

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  platform: string;
  userAgent: string;
}

/**
 * Detect if the current device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check user agent for mobile indicators
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    'android', 'webos', 'iphone', 'ipad', 'ipod', 
    'blackberry', 'iemobile', 'opera mini', 'mobile'
  ];
  
  const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
  
  // Check screen size (mobile-like dimensions)
  const isMobileScreen = window.innerWidth <= 768;
  
  // Check for touch capability
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return isMobileUA || (isMobileScreen && isTouchDevice);
}

/**
 * Detect if the current device is a tablet
 */
export function isTabletDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const isTabletUA = userAgent.includes('ipad') || 
    (userAgent.includes('android') && !userAgent.includes('mobile'));
  
  const isTabletScreen = window.innerWidth > 768 && window.innerWidth <= 1024;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return isTabletUA || (isTabletScreen && isTouchDevice);
}

/**
 * Get comprehensive device information
 */
export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isTouchDevice: false,
      platform: 'server',
      userAgent: ''
    };
  }
  
  const isMobile = isMobileDevice();
  const isTablet = isTabletDevice();
  const isDesktop = !isMobile && !isTablet;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    platform: navigator.platform || 'unknown',
    userAgent: navigator.userAgent || ''
  };
}

/**
 * Check if device should use mobile-optimized upload
 */
export function shouldUseMobileUpload(): boolean {
  const deviceInfo = getDeviceInfo();
  
  // Use mobile upload for:
  // - Mobile devices
  // - Touch-enabled tablets
  // - Small screens regardless of device type
  return deviceInfo.isMobile || 
         (deviceInfo.isTablet && deviceInfo.isTouchDevice) ||
         (typeof window !== 'undefined' && window.innerWidth <= 768);
}

/**
 * Get recommended upload method based on device
 */
export function getRecommendedUploadMethod(): 'mobile' | 'desktop' | 'hybrid' {
  const deviceInfo = getDeviceInfo();
  
  if (deviceInfo.isMobile) {
    return 'mobile';
  } else if (deviceInfo.isTablet) {
    return 'hybrid';
  } else {
    return 'desktop';
  }
}

/**
 * Log device information for debugging
 */
export function logDeviceInfo(): void {
  const deviceInfo = getDeviceInfo();
  console.log('📱 Device Detection:', {
    ...deviceInfo,
    screenSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown',
    recommendedUpload: getRecommendedUploadMethod(),
    shouldUseMobile: shouldUseMobileUpload()
  });
}