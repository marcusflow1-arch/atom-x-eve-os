import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const json = (body: unknown, status = 200) => Response.json(body, { status });
const text = (value: unknown, max = 4000) => String(value || '').trim().slice(0, max);
const iso = (value: unknown) => {
  const date = new Date(String(value || ''));
  return Number.isFinite(date.getTime()) ? date.toISOString() : '';
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || '');
    const data = body?.data || {};
    const svc = base44.asServiceRole.entities;

    if (action === 'create') {
      const title = text(data.title, 180);
      const start = iso(data.scheduled_start);
      const end = data.scheduled_end ? iso(data.scheduled_end) : '';
      if (!title || !start) return json({ error: 'Title and start time are required.' }, 400);
      if (end && Date.parse(end) <= Date.parse(start)) return json({ error: 'End time must be after the start time.' }, 400);

      const row = await svc.AuraStreamSchedule.create({
        user_id: user.id,
        title,
        game_id: text(data.game_id, 160),
        scheduled_start: start,
        ...(end ? { scheduled_end: end } : {}),
        send_notification: data.send_notification !== false,
        notification_sent: false,
        status: 'scheduled',
      });
      return json({ success: true, schedule: row });
    }

    if (action === 'update') {
      const id = text(data.id, 160);
      const existing = id ? await svc.AuraStreamSchedule.get(id).catch(() => null) : null;
      if (!existing || String(existing.user_id) !== String(user.id)) return json({ error: 'Schedule entry not found.' }, 404);

      const title = text(data.title ?? existing.title, 180);
      const start = iso(data.scheduled_start ?? existing.scheduled_start);
      const end = data.scheduled_end === '' || data.scheduled_end === null
        ? ''
        : iso(data.scheduled_end ?? existing.scheduled_end);
      if (!title || !start) return json({ error: 'Title and start time are required.' }, 400);
      if (end && Date.parse(end) <= Date.parse(start)) return json({ error: 'End time must be after the start time.' }, 400);

      const patch: Record<string, unknown> = {
        title,
        game_id: text(data.game_id ?? existing.game_id, 160),
        scheduled_start: start,
        send_notification: data.send_notification ?? existing.send_notification ?? true,
        status: ['scheduled', 'live', 'completed', 'cancelled'].includes(String(data.status))
          ? data.status
          : existing.status || 'scheduled',
      };
      if (end) patch.scheduled_end = end;
      const row = await svc.AuraStreamSchedule.update(id, patch);
      return json({ success: true, schedule: row });
    }

    if (action === 'cancel') {
      const id = text(data.id, 160);
      const existing = id ? await svc.AuraStreamSchedule.get(id).catch(() => null) : null;
      if (!existing || String(existing.user_id) !== String(user.id)) return json({ error: 'Schedule entry not found.' }, 404);
      const row = await svc.AuraStreamSchedule.update(id, { status: 'cancelled', send_notification: false });
      return json({ success: true, schedule: row });
    }

    if (action === 'delete') {
      const id = text(data.id, 160);
      const existing = id ? await svc.AuraStreamSchedule.get(id).catch(() => null) : null;
      if (!existing || String(existing.user_id) !== String(user.id)) return json({ error: 'Schedule entry not found.' }, 404);
      await svc.AuraStreamSchedule.delete(id);
      return json({ success: true });
    }

    if (action === 'updateRules') {
      const profiles = await svc.StreamerProfile.filter({ user_id: user.id }, '-created_date', 1);
      const profile = profiles?.[0];
      const rules = Array.isArray(data.rules)
        ? data.rules.map((rule: unknown) => text(rule, 240)).filter(Boolean).slice(0, 12)
        : [];
      const scheduleNote = text(data.schedule_note, 800);
      const payload = { channel_rules: rules, schedule_note: scheduleNote };
      const row = profile
        ? await svc.StreamerProfile.update(profile.id, payload)
        : await svc.StreamerProfile.create({
            user_id: user.id,
            display_name: user.full_name || user.username || 'My Channel',
            ...payload,
          });
      return json({ success: true, profile: row });
    }

    return json({ error: 'Unknown schedule action.' }, 400);
  } catch (error) {
    console.error('channelSchedule failed', error);
    return json({ error: error instanceof Error ? error.message : 'Channel schedule request failed.' }, 500);
  }
});
