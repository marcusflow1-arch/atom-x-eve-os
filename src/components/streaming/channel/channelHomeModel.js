const time = (value) => Date.parse(value) || 0;
const localDay = (value) => { const date = new Date(value); return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-'); };

export function channelScheduleCalendar(scheduleData = {}, broadcasts = []) {
  const calendar = { ...scheduleData };
  for (const broadcast of broadcasts) {
    const date = time(broadcast.scheduled_start);
    if (!date || broadcast.status !== 'scheduled') continue;
    const key = localDay(date), title = broadcast.title || 'Scheduled stream';
    const existing = calendar[key];
    if (existing?.title?.includes(title)) continue;
    const label = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
    calendar[key] = { ...existing, title: [existing?.title, title].filter(Boolean).join(' · '), time: [existing?.time, label].filter(Boolean).join(' / ') };
  }
  return calendar;
}

export function publicChatMessages(rows, streamId) {
  return rows.filter((row) => row.stream_id === streamId && !row.is_deleted && ['text', 'system'].includes(row.message_type || 'text') && typeof row.content === 'string' && row.content.trim()).sort((a, b) => time(a.created_date) - time(b.created_date)).slice(-30);
}
