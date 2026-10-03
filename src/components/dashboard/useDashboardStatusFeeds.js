import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { useSocialNotifications } from '@/components/social/SocialNotifications';

const EMPTY = [];
const reminderTime = item => item.occurrence_start || item.start_time;
const dateLabel = value => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Scheduled reminder';

export default function useDashboardStatusFeeds() {
  const { user } = useAuth();
  const queries = useQueryClient();
  const updatesQuery = useQuery({
    queryKey: ['dashboard-status-updates', user?.id], enabled: Boolean(user?.id),
    staleTime: 60000, retry: false,
    queryFn: () => base44.entities.PlatformUpdate.filter({ published: true }, '-created_date', 100),
  });
  const remindersQuery = useQuery({
    queryKey: ['dashboard-status-reminders', user?.id], enabled: Boolean(user?.id),
    staleTime: 60000, retry: false,
    queryFn: async () => {
      const now = new Date();
      const response = await base44.functions.invoke('calendarAgent', { action: 'getState', payload: {
        range_start: now.toISOString(), range_end: new Date(now.getTime() + 180 * 86400000).toISOString(),
      } });
      const data = response?.data || response || {};
      if (data.error) throw new Error(data.error);
      return (Array.isArray(data.occurrences) ? data.occurrences : [])
        .filter(item => item.status !== 'cancelled' && ((item.reminders || []).length || item.event_type === 'reminder'))
        .sort((a, b) => new Date(reminderTime(a)) - new Date(reminderTime(b)));
    },
  });
  const social = useSocialNotifications();
  useEffect(() => {
    if (!user?.id) return undefined;
    const refresh = name => queries.invalidateQueries({ queryKey: [name, user.id] });
    const reminders = () => { void refresh('dashboard-status-reminders'); };
    const updates = () => { void refresh('dashboard-status-updates'); };
    const notifications = event => {
      const recipient = event?.data?.recipient_id;
      if (recipient && String(recipient) !== String(user.id)) return;
      void refresh('system-social-notifications');
    };
    window.addEventListener('atom:calendar-data-changed', reminders);
    window.addEventListener('lunaSocialChanged', notifications);
    const subscriptions = [
      base44.entities.UserEvent?.subscribe?.(reminders),
      base44.entities.PlatformUpdate?.subscribe?.(updates),
      base44.entities.SocialNotification?.subscribe?.(notifications),
    ];
    return () => {
      window.removeEventListener('atom:calendar-data-changed', reminders);
      window.removeEventListener('lunaSocialChanged', notifications);
      subscriptions.forEach(unsubscribe => unsubscribe?.());
    };
  }, [queries, user?.id]);

  const updates = useMemo(() => (updatesQuery.data || EMPTY).map(item => ({
    id: 'update:' + item.id, sourceId: item.id, kind: 'updates', type: 'update',
    title: item.title || item.version || 'System update',
    detail: item.description || item.summary || item.release_notes || 'Platform news and releases',
    created: item.created_date, announce: true, raw: item,
  })), [updatesQuery.data]);
  const reminders = useMemo(() => (remindersQuery.data || EMPTY).map(item => ({
    id: 'reminder:' + (item.occurrence_key || item.id + ':' + reminderTime(item)),
    sourceId: item.occurrence_key || item.id, kind: 'notifications', type: 'reminder',
    title: item.title || 'Reminder', detail: dateLabel(reminderTime(item)),
    created: item.created_date, announce: true, raw: item,
  })), [remindersQuery.data]);
  const notifications = useMemo(() => (social.notifications || EMPTY).map(item => ({
    // A pending request can later acquire a notification row. It is still one arrival.
    id: 'notice:' + (item.related_entity_id ? item.type + ':' + item.related_entity_id : item.id),
    sourceId: item.id, kind: 'notifications', type: 'social',
    title: item.title || 'Notification', detail: item.body || '',
    created: item.created_date, announce: item.status === 'unread', raw: item,
  })), [social.notifications]);
  const sources = useMemo(() => [
    { key: 'updates', ready: updatesQuery.isSuccess, items: updates },
    { key: 'reminders', ready: remindersQuery.isSuccess, items: reminders },
    { key: 'notifications', ready: social.isSuccess, items: notifications },
  ], [updatesQuery.isSuccess, remindersQuery.isSuccess, social.isSuccess, updates, reminders, notifications]);
  return {
    identity: user?.id || 'guest', signedIn: Boolean(user?.id), sources,
    updates, reminders, notifications,
    feeds: { updates, notifications: [...notifications, ...reminders], reminders },
    unread: notifications.filter(item => item.announce).length,
    loading: { updates: updatesQuery.isLoading, notifications: social.isLoading || remindersQuery.isLoading, reminders: remindersQuery.isLoading },
    errors: { updates: updatesQuery.isError, notifications: social.isError || remindersQuery.isError, reminders: remindersQuery.isError },
    retry: kind => kind === 'updates' ? updatesQuery.refetch() : Promise.allSettled([social.refetch(), remindersQuery.refetch()]),
  };
}
