import { useEffect, useRef, useState } from 'react';
export const STATUS_HOLD_MS = 1000;

export default function StatusFeedButton({ label, children, onPreview, onOpen, expanded, unread, helpId }) {
  const timer = useRef(null);
  const fired = useRef(false);
  const startPoint = useRef(null);
  const [holding, setHolding] = useState(false);
  const cancel = () => {
    window.clearTimeout(timer.current); timer.current = null; startPoint.current = null; setHolding(false);
  };
  useEffect(() => {
    const stop = () => { window.clearTimeout(timer.current); timer.current = null; startPoint.current = null; setHolding(false); };
    window.addEventListener('blur', stop);
    document.addEventListener('visibilitychange', stop);
    return () => { window.clearTimeout(timer.current); window.removeEventListener('blur', stop); document.removeEventListener('visibilitychange', stop); };
  }, []);
  const start = event => {
    if (event.button !== 0 || event.isPrimary === false) return;
    cancel(); fired.current = false; startPoint.current = { x: event.clientX, y: event.clientY }; setHolding(true);
    timer.current = window.setTimeout(() => {
      fired.current = true; timer.current = null; setHolding(false); onOpen();
    }, STATUS_HOLD_MS);
  };
  return <button type="button" className="luna-status-icon" aria-label={label}
    aria-describedby={helpId} aria-haspopup="dialog" aria-expanded={expanded}
    title={label + ' · hold 1 second to open'} data-holding={holding || undefined} data-unread={unread || undefined}
    onPointerDown={start} onPointerUp={cancel} onPointerCancel={cancel} onPointerLeave={cancel} onBlur={cancel}
    onPointerMove={event => {
      const point = startPoint.current;
      if (point && Math.hypot(event.clientX - point.x, event.clientY - point.y) > 8) cancel();
    }}
    onContextMenu={event => event.preventDefault()}
    onClick={event => {
      if (fired.current) { fired.current = false; event.preventDefault(); return; }
      // Enter, Space and assistive activation provide immediate keyboard access.
      if (event.detail === 0) onOpen(); else onPreview();
    }}>
    {children}
  </button>;
}
