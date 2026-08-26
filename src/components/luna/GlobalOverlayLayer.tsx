import React, { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

type GlobalOverlayLayerProps = {
  open: boolean;
  children: ReactNode;
  onEscape?: () => void;
};

/** Root-level modal host. Use this wrapper for every Luna Dashboard overlay. */
export default function GlobalOverlayLayer({ open, children, onEscape }: GlobalOverlayLayerProps) {
  useEffect(() => {
    if (!open || !onEscape) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onEscape();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onEscape]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      data-luna-global-overlay="true"
      className="fixed inset-0 isolate"
      style={{ zIndex: 99999, isolation: 'isolate' }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/55 backdrop-blur-md"
        style={{ zIndex: 0 }}
      />
      <div className="relative h-full w-full" style={{ zIndex: 1 }}>
        {children}
      </div>
    </div>,
    document.body
  );
}
