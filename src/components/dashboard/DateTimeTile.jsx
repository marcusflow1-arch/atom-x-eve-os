import { useEffect, useId, useRef, useState } from 'react';
import { Bell, RefreshCw } from 'lucide-react';
import SystemUpdatesRemindersOverlay from './SystemUpdatesRemindersOverlay';
import useDashboardStatusFeeds from './useDashboardStatusFeeds';
import useStatusPreview from './useStatusPreview';
import StatusFeedButton from './StatusFeedButton';
import LunaLightEdge from './LunaLightEdge';
import './dashboard-status.css';

export default function DateTimeTile() {
  const [overlay, setOverlay] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(() => document.hidden);
  const dock = useRef(null);
  const returnFocus = useRef(null);
  const helpId = useId();
  const data = useDashboardStatusFeeds();
  const latestStatus = data.feeds.notifications[0] || data.feeds.updates[0] || null;
  const preview = useStatusPreview({
    sources: data.sources, identity: data.identity,
    paused: hovered || focused || hidden || Boolean(overlay),
  });
  useEffect(() => {
    const visibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, []);
  const open = (mode, item) => {
    returnFocus.current = document.activeElement;
    preview.dismiss(); setHovered(false); setFocused(false);
    setOverlay({ mode, itemId: item?.id || null });
  };
  const peek = kind => {
    const items = data.feeds[kind];
    const item = items.find(entry => entry.announce) || items[0] || {
      id: 'empty:' + kind, kind,
      title: !data.signedIn ? 'Sign in for your notifications' : data.loading[kind] ? 'Loading…'
        : data.errors[kind] ? 'Feed unavailable' : kind === 'updates' ? 'No new system updates' : 'You’re all caught up',
      detail: data.errors[kind] ? 'Open this feed to retry.' : kind === 'updates' ? 'Platform news and releases' : 'Notifications and calendar reminders',
    };
    preview.peek(item);
  };
  const close = () => {
    setOverlay(null);
    const previous = returnFocus.current;
    if (previous?.isConnected && !previous.closest('.luna-status-preview')) previous.focus?.();
    else dock.current?.querySelector('[aria-label="Notifications"]')?.focus();
  };

  return <>
    <section ref={dock} className="luna-status" aria-label="System notifications" data-luna-notification-dock>
      <LunaLightEdge variant="clock" />
      <div className="luna-status-announcements">
        <button type="button" className="luna-status-summary"
          aria-label="Open system updates and reminders"
          onClick={() => open(latestStatus?.kind === 'updates' ? 'updates' : 'notifications', latestStatus)}>
          <strong>System notifications</strong>
          <span>{latestStatus?.title || (data.signedIn ? 'No new notifications or reminders' : 'Sign in to see your updates')}</span>
        </button>
        <div className="luna-status-preview" data-expanded={preview.expanded || undefined}
          aria-hidden={!preview.expanded} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
          onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
          <button type="button" className="luna-status-feed" tabIndex={preview.expanded ? 0 : -1}
            aria-label={preview.current ? 'Open ' + preview.current.title : 'Open notification'}
            onClick={() => preview.current && open(preview.current.kind, preview.current)}>
            <span className="luna-status-feed-copy">
              <small>{preview.current?.kind === 'updates' ? 'System update' : preview.current?.type === 'reminder' ? 'Reminder' : 'Notification'}</small>
              <strong>{preview.current?.title}</strong><span>{preview.current?.detail}</span>
            </span>
          </button>
        </div>
        <div className="luna-status-selectors" role="group" aria-label="Updates and notifications">
          <StatusFeedButton label="System updates" onPreview={() => peek('updates')} onOpen={() => open('updates')}
            expanded={overlay?.mode === 'updates' || (preview.expanded && preview.current?.kind === 'updates')} helpId={helpId}>
            <RefreshCw size={15} />
          </StatusFeedButton>
          <StatusFeedButton label="Notifications" onPreview={() => peek('notifications')} onOpen={() => open('notifications')}
            expanded={overlay?.mode === 'notifications' || (preview.expanded && preview.current?.kind === 'notifications')} unread={data.unread > 0} helpId={helpId}>
            <Bell size={15} />
          </StatusFeedButton>
        </div>
      </div>
      <span id={helpId} className="sr-only">Click for a brief preview. Hold for one second to open the full feed, or press Enter or Space.</span>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{preview.expanded ? [preview.current?.title, preview.current?.detail].filter(Boolean).join('. ') : ''}</span>
    </section>
    {overlay && <SystemUpdatesRemindersOverlay mode={overlay.mode} initialItemId={overlay.itemId} onClose={close} />}
  </>;
}
