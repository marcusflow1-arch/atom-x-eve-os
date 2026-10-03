import { useCallback, useEffect, useState } from 'react';
import { Bell, Calendar as CalendarIcon, ChevronRight, RefreshCw, Settings } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import SystemUpdatesRemindersOverlay from './SystemUpdatesRemindersOverlay';
import './dashboard-status.css';

export default function DateTimeTile({ onCalendarClick = () => {} }) {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date());
  const [feeds, setFeeds] = useState({ updates: [], reminders: [] });
  const [feed, setFeed] = useState('updates');
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [overlayMode, setOverlayMode] = useState(null);

  const load = useCallback(async () => {
    if (!user?.id) { setFeeds({ updates: [], reminders: [] }); return; }
    setLoading(true);
    const now = new Date();
    const [schedule, updates] = await Promise.allSettled([
      base44.functions.invoke('calendarAgent', { action: 'getState', payload: { range_start: now.toISOString(), range_end: new Date(now.getTime() + 90 * 86400000).toISOString() } }),
      base44.entities.PlatformUpdate.filter({ published: true }, '-created_date', 12),
    ]);
    const data = schedule.status === 'fulfilled' ? (schedule.value?.data || schedule.value || {}) : {};
    setFeeds({
      updates: updates.status === 'fulfilled' && Array.isArray(updates.value) ? updates.value : [],
      reminders: (Array.isArray(data.occurrences) ? data.occurrences : [])
        .filter(event => event.status !== 'cancelled' && ((event.reminders || []).length || event.event_type === 'reminder'))
        .sort((a, b) => new Date(a.occurrence_start || a.start_time) - new Date(b.occurrence_start || b.start_time)),
    });
    setErrors({ updates: updates.status === 'rejected', reminders: schedule.status === 'rejected' || Boolean(data.error) });
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const refresh = () => load();
    window.addEventListener('atom:calendar-data-changed', refresh);
    const calendar = base44.entities.UserEvent?.subscribe?.(refresh);
    const updates = base44.entities.PlatformUpdate?.subscribe?.(refresh);
    return () => { window.removeEventListener('atom:calendar-data-changed', refresh); calendar?.(); updates?.(); };
  }, [load]);
  useEffect(() => {
    const clock = window.setInterval(() => setTime(new Date()), 1000);
    const rotate = window.setInterval(() => setIndex(i => i + 1), 8000);
    return () => { window.clearInterval(clock); window.clearInterval(rotate); };
  }, []);
  const items = feeds[feed];
  const item = items[index % (items.length || 1)];
  const label = item?.title || item?.version || (loading ? 'Loading…' : errors[feed] ? 'Feed unavailable · retry' : !user?.id ? 'Sign in for your updates' : feed === 'updates' ? 'No new system updates' : 'No reminders scheduled');
  const detail = feed === 'reminders' && item ? new Date(item.occurrence_start || item.start_time).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : item?.description || item?.summary || (feed === 'updates' ? 'Platform news and releases' : 'Your upcoming calendar reminders');
  const openFeed = () => errors[feed] ? load() : setOverlayMode(feed);

  return <>
    <section className="luna-status" aria-label="Dashboard status">
      <div className="luna-status-selectors" role="group" aria-label="Choose status feed">
        <button type="button" aria-label="Show system updates" aria-pressed={feed === 'updates'} title="System updates" onClick={() => { setFeed('updates'); setIndex(0); }}><RefreshCw size={15} /></button>
        <button type="button" aria-label="Show reminders" aria-pressed={feed === 'reminders'} title="Reminders" onClick={() => { setFeed('reminders'); setIndex(0); }}><Bell size={15} /></button>
      </div>
      <button type="button" className="luna-status-feed" aria-label={`Open ${feed === 'updates' ? 'system updates' : 'reminders'} feed`} onClick={openFeed}>
        <span className="luna-status-feed-copy"><strong>{label}</strong><span>{detail}</span></span><ChevronRight size={14} />
      </button>
      <span className="luna-status-divider" aria-hidden="true" />
      <button type="button" className="luna-status-quick" aria-label="Open all system updates" title="All system updates" onClick={() => setOverlayMode('updates')}><Settings size={18} /></button>
      <button type="button" className="luna-status-clock" aria-label="Open calendar" onClick={onCalendarClick}>
        <CalendarIcon size={21} /><span><time dateTime={time.toISOString()}>{time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</time><small>{time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</small></span>
      </button>
    </section>
    {overlayMode && <SystemUpdatesRemindersOverlay mode={overlayMode} onClose={() => setOverlayMode(null)} />}
  </>;
}
