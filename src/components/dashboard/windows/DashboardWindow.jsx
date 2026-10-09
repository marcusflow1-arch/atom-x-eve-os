import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Grip, Maximize2, Minimize2, Minus, X } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { createWindowStack, fitWindow, moveWindow, resizeWindow } from './windowGeometry';
import './dashboard-windows.css';

const stack = createWindowStack();
export const activeDashboardWindow = () => stack.top();
export function focusDashboardWindow(id) {
  window.dispatchEvent(new CustomEvent('lunaWindowFocus', { detail: { id } }));
}
function workArea() {
  const top = Math.max(0, document.querySelector('.glass-page-top-bar')?.getBoundingClientRect().bottom ?? 64);
  const bottom = Math.min(window.innerHeight, document.querySelector('.glass-page-bottom-bar')?.getBoundingClientRect().top ?? window.innerHeight - 48);
  return { x: 0, y: top, width: window.innerWidth, height: Math.max(40, bottom - top) };
}
export default function DashboardWindow({ id, title, children, onClose, onMinimizedChange, width = 720, height = 560, index = 0 }) {
  const { user } = useAuth();
  const storageKey = 'luna-window-v1:' + (user?.id || 'guest') + ':' + id;
  const initialRect = (key) => {
    const area = workArea();
    let saved;
    try { saved = JSON.parse(sessionStorage.getItem(key) || 'null'); } catch { /* fresh position */ }
    return fitWindow(saved || { x: area.width / 2 - width / 2 + index * 24, y: area.y + 28 + index * 22, width, height }, area);
  };
  const [rect, setRect] = useState(() => initialRect(storageKey));
  // Authentication may complete after this window opens. Never overwrite
  // the signed-in player's saved geometry with a guest window position.
  const [rectOwnerKey, setRectOwnerKey] = useState(storageKey);
  const [maximized, setMaximized] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [z, setZ] = useState(1500);
  useEffect(() => { onMinimizedChange?.(minimized); }, [minimized, onMinimizedChange]);
  const [area, setArea] = useState(workArea);
  const shell = useRef(null);
  const gesture = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const bringForward = () => setZ(stack.focus(id));
  useEffect(() => {
    bringForward();
    const focus = event => {
      if (event.detail?.id !== id) return;
      setMinimized(false);
      bringForward();
      shell.current?.focus({ preventScroll: true });
    };
    const escape = event => {
      if (event.key !== 'Escape' || stack.top() !== id) return;
      // Nested editor dialogs (such as Calendar event creation) handle
      // their own first Escape; only a second Escape closes the window.
      if (shell.current?.querySelector('[data-window-dismiss-layer]')) return;
      // Window-level Escape never fans out to every dashboard panel.
      event.preventDefault();
      event.stopImmediatePropagation();
      closeRef.current?.();
    };
    window.addEventListener('lunaWindowFocus', focus);
    window.addEventListener('keydown', escape, true);
    return () => {
      stack.remove(id);
      window.removeEventListener('lunaWindowFocus', focus);
      window.removeEventListener('keydown', escape, true);
    };
  }, [id]);
  useLayoutEffect(() => {
    const update = () => {
      const next = workArea();
      setArea(next);
      setRect(previous => fitWindow(previous, next));
    };
    const observer = new ResizeObserver(update);
    for (const selector of ['.glass-page-top-bar', '.glass-page-bottom-bar']) {
      const node = document.querySelector(selector);
      if (node) observer.observe(node);
    }
    window.addEventListener('resize', update);
    return () => { observer.disconnect(); window.removeEventListener('resize', update); };
  }, []);
  useLayoutEffect(() => {
    if (rectOwnerKey === storageKey) return;
    setRect(initialRect(storageKey));
    setRectOwnerKey(storageKey);
  }, [storageKey, rectOwnerKey]);
  useEffect(() => {
    if (rectOwnerKey !== storageKey) return;
    try { sessionStorage.setItem(storageKey, JSON.stringify(rect)); } catch { /* storage is optional */ }
  }, [rect, storageKey, rectOwnerKey]);

  const start = (event, kind) => {
    if (event.button !== 0 || maximized) return;
    event.preventDefault();
    bringForward();
    gesture.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, rect, kind };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = event => {
    const drag = gesture.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    setRect(drag.kind === 'resize' ? resizeWindow(drag.rect, dx, dy, workArea()) : moveWindow(drag.rect, dx, dy, workArea()));
  };
  const end = (event) => {
    const pointerId = gesture.current?.pointerId;
    gesture.current = null;
    // Release a completed gesture instead of holding pointer capture while
    // another floating window is being moved or clicked.
    if (pointerId != null && event?.currentTarget?.hasPointerCapture?.(pointerId)) {
      event.currentTarget.releasePointerCapture(pointerId);
    }
  };
  const keyboardAdjust = (event, kind) => {
    const delta = { ArrowLeft: [-16,0], ArrowRight: [16,0], ArrowUp: [0,-16], ArrowDown: [0,16] }[event.key];
    if (!delta || maximized) return;
    event.preventDefault(); event.stopPropagation();
    setRect(previous => kind === 'resize' ? resizeWindow(previous, ...delta, area) : moveWindow(previous, ...delta, area));
  };
  const shown = maximized ? { x: area.x, y: area.y, width: area.width, height: area.height } : rect;
  return createPortal(
    <section ref={shell} tabIndex={-1} role="dialog" aria-modal="false" aria-label={title + ' window'}
      data-luna-window={id} data-minimized={minimized || undefined}
      className="luna-window" onPointerDownCapture={bringForward} onFocusCapture={bringForward}
      style={{ left: shown.x, top: shown.y, width: shown.width, height: minimized ? 40 : shown.height, zIndex: z }}>
      <header className="luna-window__bar">
        <div className="luna-window__drag" role="button" tabIndex={0} aria-label={'Move ' + title + ' window'}
          title="Drag to move. Arrow keys also move this window."
          onPointerDown={event => start(event, 'move')} onPointerMove={move}
          onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
          onKeyDown={event => keyboardAdjust(event, 'move')}
          onDoubleClick={() => { setMinimized(false); setMaximized(value => !value); }}>
          <Grip size={14} aria-hidden="true" /><span>{title}</span>
        </div>
        <button type="button" aria-label={(minimized ? 'Restore ' : 'Minimize ') + title} onClick={() => setMinimized(value => !value)}><Minus size={14} /></button>
        <button type="button" aria-label={(maximized ? 'Restore size of ' : 'Maximize ') + title}
          onClick={() => { setMinimized(false); setMaximized(value => !value); }}>{maximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}</button>
        <button type="button" aria-label={'Close ' + title + ' window'} onClick={onClose}><X size={15} /></button>
      </header>
      <div className="luna-window__body" hidden={minimized}>{children}</div>
      {!minimized && !maximized && <button type="button" className="luna-window__resize" aria-label={'Resize ' + title + ' window'}
        title="Drag to resize. Arrow keys also resize this window."
        onPointerDown={event => start(event, 'resize')} onPointerMove={move}
        onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
        onKeyDown={event => keyboardAdjust(event, 'resize')} />}
    </section>, document.body);
}
