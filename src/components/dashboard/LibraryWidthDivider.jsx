import { useEffect, useRef } from 'react';
import { GripVertical } from 'lucide-react';
import { constrainLibraryWidth, LIBRARY_DEFAULT_WIDTH, LIBRARY_MIN_WIDTH, LIBRARY_MAX_WIDTH } from './libraryResize';
import './library-divider.css';

/**
 * Steam-like resize rail shared by the card/game library and main dashboard.
 * The parent applies the actual width to BOTH panes.
 */
export default function LibraryWidthDivider({ width, onResize, containerRef }) {
  const handleRef = useRef(null);
  const dragging = useRef(false);
  const previousBodyStyle = useRef(null);

  const stop = (event) => {
    if (!dragging.current) return;
    dragging.current = false;
    if (event?.pointerId != null && handleRef.current?.hasPointerCapture?.(event.pointerId)) {
      handleRef.current.releasePointerCapture(event.pointerId);
    }
    if (previousBodyStyle.current) {
      document.body.style.userSelect = previousBodyStyle.current.select;
      document.body.style.cursor = previousBodyStyle.current.cursor;
      previousBodyStyle.current = null;
    }
  };

  // Restore global cursor and selection even if the dashboard unmounts mid-drag.
  useEffect(() => () => {
    if (previousBodyStyle.current) {
      document.body.style.userSelect = previousBodyStyle.current.select;
      document.body.style.cursor = previousBodyStyle.current.cursor;
    }
  }, []);

  const setWidth = (rawWidth) => {
    const rootWidth = containerRef.current?.getBoundingClientRect().width || window.innerWidth;
    onResize(constrainLibraryWidth(rawWidth, rootWidth));
  };
  const move = (event) => {
    if (!dragging.current) return;
    const root = containerRef.current?.getBoundingClientRect();
    if (!root) return;
    setWidth(event.clientX - root.left);
  };
  const keys = (event) => {
    const step = event.shiftKey ? 32 : 12;
    if (event.key === 'ArrowLeft') setWidth(width - step);
    else if (event.key === 'ArrowRight') setWidth(width + step);
    else if (event.key === 'Home') setWidth(LIBRARY_DEFAULT_WIDTH);
    else if (event.key === 'Escape') stop();
    else return;
    event.preventDefault();
  };
  return (
    <div className="luna-library-divider-track" style={{ left: width - 6 }}>
      <div
        ref={handleRef}
        className="luna-library-divider"
        role="separator"
        aria-label="Resize game and card library"
        aria-orientation="vertical"
        aria-controls="luna-resizable-library luna-resizable-main"
        aria-valuemin={LIBRARY_MIN_WIDTH}
        aria-valuemax={LIBRARY_MAX_WIDTH}
        aria-valuenow={width}
        tabIndex={0}
        title="Drag left or right to resize · Double-click to reset"
        data-dragging={dragging.current || undefined}
        onPointerDown={event => {
          if (event.button !== 0) return;
          event.preventDefault();
          dragging.current = true;
          previousBodyStyle.current = { select: document.body.style.userSelect, cursor: document.body.style.cursor };
          document.body.style.userSelect = 'none';
          document.body.style.cursor = 'col-resize';
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={move}
        onPointerUp={stop}
        onPointerCancel={stop}
        onLostPointerCapture={stop}
        onDoubleClick={() => setWidth(LIBRARY_DEFAULT_WIDTH)}
        onKeyDown={keys}
      >
        <GripVertical size={14} strokeWidth={1.8} aria-hidden="true" />
      </div>
    </div>
  );
}
