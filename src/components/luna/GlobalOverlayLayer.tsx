import React, { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

type GlobalOverlayLayerProps = {
  open: boolean;
  children: ReactNode;
  onEscape?: () => void;
};

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
    <div data-luna-global-overlay="true" className="fixed inset-0 z-[99999] isolate pointer-events-auto" style={{ zIndex: 99999 }}>
      <div aria-hidden="true" className="absolute inset-0 bg-black/55 backdrop-blur-md" />
      <div className="relative z-[100000] h-full w-full">{children}</div>
    </div>,
    document.body
  );
}
