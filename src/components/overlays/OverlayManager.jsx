import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const OverlayContext = createContext(null);

export const useOverlay = () => {
  const context = useContext(OverlayContext);
  if (!context) {
    // FIXED: Return a safe default instead of throwing error
    return {
      openOverlay: () => console.warn('OverlayProvider not found'),
      closeOverlay: () => console.warn('OverlayProvider not found'),
      closeAllOverlays: () => console.warn('OverlayProvider not found'),
      overlayStack: []
    };
  }
  return context;
};

export const OverlayProvider = ({ children }) => {
  const [overlayStack, setOverlayStack] = useState([]);

  const openOverlay = useCallback((overlayConfig) => {
    setOverlayStack((prev) => [...prev, { ...overlayConfig, id: Date.now() }]);
    
    // Update URL with fragment if provided
    if (overlayConfig.urlFragment) {
      window.history.pushState(null, '', `#${overlayConfig.urlFragment}`);
    }
  }, []);

  const closeOverlay = useCallback((overlayId) => {
    setOverlayStack((prev) => {
      const newStack = overlayId 
        ? prev.filter(o => o.id !== overlayId)
        : prev.slice(0, -1);
      
      // Update URL
      if (newStack.length === 0) {
        window.history.pushState(null, '', window.location.pathname);
      } else {
        const topOverlay = newStack[newStack.length - 1];
        if (topOverlay.urlFragment) {
          window.history.pushState(null, '', `#${topOverlay.urlFragment}`);
        }
      }
      
      return newStack;
    });
  }, []);

  const closeAllOverlays = useCallback(() => {
    setOverlayStack([]);
    window.history.pushState(null, '', window.location.pathname);
  }, []);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      closeOverlay();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [closeOverlay]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && overlayStack.length > 0) {
        closeOverlay();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [overlayStack.length, closeOverlay]);

  return (
    <OverlayContext.Provider value={{ openOverlay, closeOverlay, closeAllOverlays, overlayStack }}>
      {children}
      <OverlayRenderer overlayStack={overlayStack} closeOverlay={closeOverlay} />
    </OverlayContext.Provider>
  );
};

const OverlayWrapper = ({ overlay, zIndex, onClose }) => {
  const overlayRef = React.useRef(null);

  // Focus trap
  useEffect(() => {
    const currentOverlay = overlayRef.current;
    
    if (currentOverlay) {
      const focusableElements = currentOverlay.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }

      const handleTab = (e) => {
        if (e.key === 'Tab' && focusableElements.length > 0) {
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      currentOverlay.addEventListener('keydown', handleTab);
      return () => {
        if (currentOverlay) {
          currentOverlay.removeEventListener('keydown', handleTab);
        }
      };
    }
  }, []);

  return (
    <motion.div
      ref={overlayRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ zIndex }}
      onClick={() => overlay.closeOnBackdropClick !== false && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`relative bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden ${overlay.className || ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        {overlay.showCloseButton !== false && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 bg-slate-800/80 hover:bg-slate-700 text-white p-2 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Overlay Header */}
        {overlay.title && (
          <div className="border-b border-slate-700 p-6">
            <h2 className="text-2xl font-bold text-white">{overlay.title}</h2>
            {overlay.subtitle && (
              <p className="text-slate-400 mt-1">{overlay.subtitle}</p>
            )}
          </div>
        )}

        {/* Overlay Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {typeof overlay.content === 'function' ? overlay.content({ onClose }) : overlay.content}
        </div>
      </motion.div>
    </motion.div>
  );
};

const OverlayRenderer = ({ overlayStack, closeOverlay }) => {
  return (
    <AnimatePresence>
      {overlayStack.map((overlay, index) => (
        <OverlayWrapper
          key={overlay.id}
          overlay={overlay}
          zIndex={1000 + index * 10}
          onClose={() => closeOverlay(overlay.id)}
        />
      ))}
    </AnimatePresence>
  );
};