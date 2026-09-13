import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, CalendarDays, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

export default function CalendarReminderBridge() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const seen = useRef(new Set());

  const check = useCallback(async () => {
    if (!user?.id || document.visibilityState === 'hidden') return;
    try {
      const response = await base44.functions.invoke('calendarAgent', {
        action: 'dueReminders',
        payload: { now: new Date().toISOString() },
      });
      const data = response?.data || response || {};
      const reminders = Array.isArray(data.reminders) ? data.reminders : [];
      const fresh = reminders.filter((item) => item?.id && !seen.current.has(item.id));
      if (!fresh.length) return;
      fresh.forEach((item) => seen.current.add(item.id));
      setItems((current) => [...fresh, ...current].slice(0, 5));
      fresh.forEach((item) => {
        window.dispatchEvent(new CustomEvent('atom:calendar-reminder', { detail: item }));
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          try { new Notification(item.title || 'Calendar reminder', { body: item.description || new Date(item.start_time).toLocaleString() }); } catch {}
        }
      });
      window.dispatchEvent(new Event('atom:calendar-data-changed'));
    } catch (error) {
      console.warn('[Calendar Reminder] check failed', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return undefined;
    check();
    const timer = window.setInterval(check, 60000);
    const onFocus = () => check();
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user?.id, check]);

  if (!items.length || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed right-5 top-20 z-[45000] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2 pointer-events-none">
      {items.map((item) => (
        <div key={item.id} className="pointer-events-auto overflow-hidden border border-white/[0.08] bg-[#071018]/95 shadow-2xl backdrop-blur-3xl">
          <div className="flex items-start gap-3 p-4">
            <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cyan-300/[0.08] text-cyan-100/70"><Bell className="h-4 w-4" /></div>
            <div className="min-w-0 flex-1">
              <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-cyan-200/45">Calendar Reminder</div>
              <div className="mt-1 text-sm font-semibold text-white/90">{item.title}</div>
              <div className="mt-1 text-[10px] leading-4 text-white/38">{new Date(item.start_time).toLocaleString()}{item.game ? ` · ${item.game}` : ''}</div>
              {item.description && <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-white/45">{item.description}</p>}
              <button type="button" onClick={() => window.dispatchEvent(new Event('openAtomCalendar'))} className="mt-3 inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-cyan-200/65 hover:text-cyan-100"><CalendarDays className="h-3 w-3" /> Open Calendar</button>
            </div>
            <button type="button" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} className="grid h-7 w-7 shrink-0 place-items-center text-white/25 hover:text-white" aria-label="Dismiss reminder"><X className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      ))}
    </div>,
    document.body,
  );
}
