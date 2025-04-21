/**
 * Utility functions to detect device capabilities for better cross-device compatibility
 */

/**
 * Detects if the current device is a touch-enabled device
 * @returns boolean indicating if the device supports touch events
 */
export const isTouchDevice = (): boolean => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return false;
  
  // Primary check: presence of navigator.maxTouchPoints
  if (navigator.maxTouchPoints > 0) return true;
  
  // Fallback method: checking for touch event support
  if ('ontouchstart' in window) return true;
  
  // Last resort: check media queries
  return window.matchMedia('(pointer: coarse)').matches;
};

/**
 * Detects if the current device is a mobile device based on screen size
 * @returns boolean indicating if the device is likely a mobile device
 */
export const isMobileDevice = (): boolean => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return false;
  
  // Use screen width as a simple heuristic
  return window.innerWidth <= 768;
};

/**
 * Get information about the current device type
 * @returns an object with device capability information
 */
export const getDeviceInfo = () => {
  const isTouch = isTouchDevice();
  const isMobile = isMobileDevice();
  
  return {
    isTouch,
    isMobile,
    isDesktop: !isMobile,
    hasMouse: !isTouch || (isTouch && window.matchMedia('(pointer: fine)').matches),
  };
};