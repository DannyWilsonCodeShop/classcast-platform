/**
 * Device Detection Utilities
 * Helps determine device type and capabilities for optimal user experience
 */

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  userAgent: string;
  platform: string;
  supportsFileAPI: boolean;
  supportsDragDrop: boolean;
}

/**
 * Detect if the current device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check user agent
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    'mobile', 'android', 'iphone', 'ipad', 'ipod', 
    'blackberry', 'windows phone', 'opera mini'
  ];
  
  const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
  
  // Check screen size
  const isSmallScreen = window.innerWidth <= 768;
  
  // Check touch capability
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return isMobileUA || (isSmallScreen && isTouchDevice);
}

/**
 * Detect if the current device is a tablet
 */
export function isTabletDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const tabletKeywords = ['ipad', 'tablet', 'kindle'];
  
  const isTabletUA = tabletKeywords.some(keyword => userAgent.includes(keyword));
  const isMediumScreen = window.innerWidth > 768 && window.innerWidth <= 1024;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return isTabletUA || (isMediumScreen && isTouchDevice);
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
      userAgent: '',
      platform: 'server',
      supportsFileAPI: false,
      supportsDragDrop: false,
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
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    supportsFileAPI: typeof File !== 'undefined' && typeof FileReader !== 'undefined',
    supportsDragDrop: 'draggable' in document.createElement('div') && !isMobile,
  };
}

/**
 * Check if the browser supports large file uploads
 */
export function supportsLargeFileUploads(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for required APIs
  const hasFileAPI = typeof File !== 'undefined';
  const hasXHR = typeof XMLHttpRequest !== 'undefined';
  const hasFormData = typeof FormData !== 'undefined';
  
  return hasFileAPI && hasXHR && hasFormData;
}

/**
 * Get recommended upload method based on device
 */
export function getRecommendedUploadMethod(): 'mobile' | 'desktop' | 'fallback' {
  const deviceInfo = getDeviceInfo();
  
  if (!deviceInfo.supportsFileAPI) {
    return 'fallback';
  }
  
  if (deviceInfo.isMobile) {
    return 'mobile';
  }
  
  return 'desktop';
}

/**
 * Check if the device has known file upload issues
 */
export function hasKnownFileUploadIssues(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Known problematic browsers/devices
  const problematicPatterns = [
    /android.*4\./,  // Android 4.x has file API issues
    /iphone.*os [89]_/, // iOS 8-9 has file size issues
    /safari.*version\/[89]\./, // Safari 8-9 has upload issues
  ];
  
  return problematicPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * Get mobile-specific file input attributes
 */
export function getMobileFileInputAttributes(): Record<string, string> {
  const deviceInfo = getDeviceInfo();
  
  if (!deviceInfo.isMobile) {
    return {};
  }
  
  const attributes: Record<string, string> = {};
  
  // iOS-specific attributes
  if (deviceInfo.userAgent.toLowerCase().includes('iphone') || 
      deviceInfo.userAgent.toLowerCase().includes('ipad')) {
    attributes.capture = 'environment'; // Prefer rear camera
  }
  
  // Android-specific attributes
  if (deviceInfo.userAgent.toLowerCase().includes('android')) {
    attributes.capture = 'camera'; // Enable camera capture
  }
  
  return attributes;
}

/**
 * Log device information for debugging
 */
export function logDeviceInfo(): void {
  if (typeof window === 'undefined') return;
  
  const deviceInfo = getDeviceInfo();
  
  console.log('📱 Device Information:', {
    ...deviceInfo,
    screenSize: `${window.innerWidth}x${window.innerHeight}`,
    pixelRatio: window.devicePixelRatio,
    hasKnownIssues: hasKnownFileUploadIssues(),
    recommendedMethod: getRecommendedUploadMethod(),
  });
}