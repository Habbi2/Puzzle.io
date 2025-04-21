import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { isTouchDevice } from '../utils/deviceDetection';

interface CustomDndProviderProps {
  children: React.ReactNode;
}

/**
 * Custom DnD Provider that selects the appropriate backend based on device capabilities
 */
const CustomDndProvider: React.FC<CustomDndProviderProps> = ({ children }) => {
  // Determine which backend to use based on device capabilities
  const isTouch = isTouchDevice();
  
  // Configure TouchBackend options for better mobile experience
  const touchBackendOptions = {
    enableMouseEvents: true, // Allow mouse events for hybrid devices
    delayTouchStart: 2, // Reduced delay for more responsive feel
    enableTouchEvents: true, // Explicitly enable touch events
    touchSlop: 10, // Reduced distance for quicker drag recognition
    ignoreContextMenu: true, // Prevents context menu from interfering with dragging
    scrollAngleRanges: [
      { start: 30, end: 150 },
      { start: 210, end: 330 }
    ] // Improve horizontal vs vertical drag detection
  };
  
  // Configure HTML5 options for desktop
  const html5Options = {
    enableMouseEvents: true,
    enableKeyboardEvents: true, // Enable keyboard navigation
    enableTouchEvents: false // Don't use touch events with HTML5 backend
  };
  
  return (
    <DndProvider 
      backend={isTouch ? TouchBackend : HTML5Backend} 
      options={isTouch ? touchBackendOptions : html5Options}
    >
      {children}
    </DndProvider>
  );
};

export default CustomDndProvider;