import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

type AnyObj = Record<string, any>;

const EVENT_TYPES = new Set(['raid','tournament','meeting','gaming_session','personal','reminder','life','story','clan','task']);
const REMINDER_TYPES = new Set(['notification','email','ai_voice']);
const TASK_PRIORITIES = new Set(['low','medium','high']);

const clamp = (value: any, min: number, max: number) => Math.max(min, Math.min(max, Number(value || 0)));
const iso = (value: any, fallback?: string) => {
  const date = value ? new Date(value) : (fallback ? new Date(fallback) : null);
  if (!date || Number.isNaN(date.getTime())) return fallback || new Date().toISOString();
  return date.toISOString();
};
const safeString = (value: any, max = 4000) => String(value ?? '').trim().slice(0, max);
const localDateKey = (value: any) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

function normalizeRecurrence(value: any) {
  if (!value || value === 'none') return undefined;
  if (typeof value === 'string') {
    if (!['daily','weekly','monthly','yearly'].includes(value)) return undefined;
    return { frequency: value, interval: 1, days_of_week: [] };
  }
  const frequency = String(value.frequency || '').toLowerCase();
  if (!['daily','weekly','monthly','yearly'].includes(frequency)) return undefined;
  return {
    frequency,
    interval: Math.max(1, Math.floor(Number(value.interval || 1))),
    days_of_week: Array.isArray(value.days_of_week) ? value.days_of_week.map(Number).filter((n: number) => n >= 0 && n <= 6) : [],
    ...(value.end_date ? { end_date: iso(value.end_date) } : {}),
  };
}

function normalizeReminders(value: any, eventType = 'personal') {
  const raw = Array.isArray(value) ? value : [];
  const cleaned = raw.map((item: AnyObj) => ({
    time_before: Math.max(0, Math.floor(Number(item?.time_before || 0))),
    type: REMINDER_TYPES.has(item?.type) ? item.type : 'notification',
  }));
  const dedup = new Map(cleaned.map((item: AnyObj) => [`${item.time_before}:${item.type}`, item]));
  if (!dedup.size && eventType === 'reminder') dedup.set('0:notification', { time_before: 0, type: 'notification' });
  return Array.from(dedup.values()).slice(0, 6);
}

function normalizeEvent(input: AnyObj, userId: string, source = 'user') {
  const eventType = EVENT_TYPES.has(input.event_type) ? input.event_type : 'personal';
  const start = iso(input.start_time);
  const startMs = new Date(start).getTime();
  let end = input.end_time ? iso(input.end_time) : undefined;
  if (end && new Date(end).getTime() <= startMs) end = new Date(startMs + 60 * 60 * 1000).toISOString();
  const recurrence = normalizeRecurrence(input.recurrence);
  const reminders = normalizeReminders(input.reminders, eventType);
  return {
    user_id: userId,
    title: safeString(input.title || (eventType === 'reminder' ? 'Reminder' : 'Scheduled event'), 180),
    description: safeString(input.description, 5000),
    event_type: eventType,
    source: ['user','ai','game','clan'].includes(source) ? source : 'user',
    status: ['scheduled','completed','cancelled'].includes(input.status) ? input.status : 'scheduled',
    game: safeString(input.game, 160),
    start_time: start,
    ...(end ? { end_time: end } : {}),
    all_day: Boolean(input.all_day),
    timezone: safeString(input.timezone || 'local', 100),
    ...(recurrence ? { recurrence } : {}),
    reminders,
    reminder_state: [],
    reminder_sent: false,
    participants: Array.isArray(input.participants) ? input.participants.map((x: any) => safeString(x, 128)).filter(Boolean).slice(0, 100) : [],
    linked_game_id: safeString(input.linked_game_id, 128),
    linked_story_id: safeString(input.linked_story_id, 128),
    linked_task_id: safeString(input.linked_task_id, 128),
    metadata: input.metadata && typeof input.metadata === 'object' ? input.metadata : {},
    memory_flag: Boolean(input.memory_flag),
  };
}

function addOccurrence(start: Date, recurrence: AnyObj, index: number) {
  const next = new Date(start);
  const interval = Math.max(1, Number(recurrence?.interval || 1));
  if (recurrence.frequency === 'daily') next.setDate(next.getDate() + index * interval);
  if (recurrence.frequency === 'weekly') next.setDate(next.getDate() + index * 7 * interval);
  if (recurrence.frequency === 'monthly') next.setMonth(next.getMonth() + index * interval);
  if (recurrence.frequency === 'yearly') next.setFullYear(next.getFullYear() + index * interval);
  return next;
}

function expandEvent(event: AnyObj, rangeStart: Date, rangeEnd: Date, max = 400) {
  const start = new Date(event.start_time);
  if (Number.isNaN(start.getTime()) || event.status === 'cancelled') return [];
  const duration = event.end_time ? Math.max(0, new Date(event.end_time).getTime() - start.getTime()) : 60 * 60 * 1000;
  const recurrence = event.recurrence;
  if (!recurrence?.frequency) {
    if (start <= rangeEnd && new Date(start.getTime() + duration) >= rangeStart) {
      return [{ ...event, parent_event_id: event.id, occurrence_start: start.toISOString(), occurrence_end: new Date(start.getTime() + duration).toISOString(), occurrence_key: `${event.id}:${start.toISOString()}` }];
    }
    return [];
  }

  const out: AnyObj[] = [];
  const recurrenceEnd = recurrence.end_date ? new Date(recurrence.end_date) : null;
  const allowedDays = Array.isArray(recurrence.days_of_week) ? recurrence.days_of_week.map(Number) : [];
  let guard = 0;

  // Weekly rules with explicit weekdays are expanded day-by-day from the original week.
  if (recurrence.frequency === 'weekly' && allowedDays.length) {
    const cursor = new Date(start);
    cursor.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), start.getMilliseconds());
    const firstWeekStart = new Date(start);
    firstWeekStart.setDate(firstWeekStart.getDate() - firstWeekStart.getDay());
    while (cursor <= rangeEnd && guard++ < 4000 && out.length < max) {
      if (cursor >= start && cursor >= rangeStart && allowedDays.includes(cursor.getDay())) {
        const weeks = Math.floor((cursor.getTime() - firstWeekStart.getTime()) / (7 * 86400000));
        if (weeks % Math.max(1, Number(recurrence.interval || 1)) === 0 && (!recurrenceEnd || cursor <= recurrenceEnd)) {
          out.push({ ...event, parent_event_id: event.id, occurrence_start: cursor.toISOString(), occurrence_end: new Date(cursor.getTime() + duration).toISOString(), occurrence_key: `${event.id}:${cursor.toISOString()}` });
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return out;
  }

  for (let i = 0; guard++ < 4000 && out.length < max; i++) {
    const occurrence = addOccurrence(start, recurrence, i);
    if (recurrenceEnd && occurrence > recurrenceEnd) break;
    if (occurrence > rangeEnd) break;
    const occurrenceEnd = new Date(occurrence.getTime() + duration);
    if (occurrenceEnd >= rangeStart) out.push({ ...event, parent_event_id: event.id, occurrence_start: occurrence.toISOString(), occurrence_end: occurrenceEnd.toISOString(), occurrence_key: `${event.id}:${occurrence.toISOString()}` });
  }
  return out;
}

async function ownedRecord(base44: any, entity: string, id: string, userId: string) {
  const row = await base44.asServiceRole.entities[entity].get(id).catch(() => null);
  if (!row || row.user_id !== userId) throw new Error(`${entity} not found`);
  return row;
}

async function getState(base44: any, userId: string, payload: AnyObj = {}) {
  const rangeStart = new Date(payload.range_start || new Date(Date.now() - 40 * 86400000).toISOString());
  const rangeEnd = new Date(payload.range_end || new Date(Date.now() + 400 * 86400000).toISOString());
  const [events, tasks, notes] = await Promise.all([
    base44.asServiceRole.entities.UserEvent.filter({ user_id: userId }, 'start_time', 1000),
    base44.asServiceRole.entities.UserTask.filter({ user_id: userId }, '-created_date', 1000),
    base44.asServiceRole.entities.UserNote.filter({ user_id: userId }, '-created_date', 1000),
  ]);
  const occurrences = (events || []).flatMap((event: AnyObj) => expandEvent(event, rangeStart, rangeEnd));
  occurrences.sort((a: AnyObj, b: AnyObj) => new Date(a.occurrence_start).getTime() - new Date(b.occurrence_start).getTime());
  return { events: events || [], occurrences, tasks: tasks || [], notes: notes || [] };
}

async function createEvent(base44: any, userId: string, payload: AnyObj = {}, source = 'user') {
  const event = normalizeEvent(payload, userId, source);
  const created = await base44.asServiceRole.entities.UserEvent.create(event);
  return created;
}

async function buildAiPlan(base44: any, userId: string, payload: AnyObj) {
  const prompt = safeString(payload.prompt, 10000);
  if (!prompt) throw new Error('Tell the calendar assistant what you want to schedule.');
  const scope = ['day','week','month','custom'].includes(payload.scope) ? payload.scope : 'day';
  const anchor = iso(payload.anchor || new Date().toISOString());
  const offset = Number(payload.timezone_offset_minutes || 0);
  const tz = safeString(payload.timezone || 'local', 100);
  const startDate = new Date(payload.range_start || anchor);
  const endDate = new Date(payload.range_end || new Date(startDate.getTime() + (scope === 'month' ? 32 : scope === 'week' ? 8 : 2) * 86400000).toISOString());
  const existing = await getState(base44, userId, { range_start: startDate.toISOString(), range_end: endDate.toISOString() });
  const busy = existing.occurrences.slice(0, 120).map((e: AnyObj) => ({ title: e.title, start: e.occurrence_start, end: e.occurrence_end, type: e.event_type }));

  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are the private Atom X Eve calendar scheduling agent. Turn the user's natural language request into a concrete ${scope} schedule.
Current anchor: ${anchor}
Browser timezone: ${tz}
Timezone offset minutes from UTC: ${offset}
Requested planning range: ${startDate.toISOString()} through ${endDate.toISOString()}
Existing busy schedule (do not create obvious conflicts unless the user explicitly requests one): ${JSON.stringify(busy)}
User request: ${JSON.stringify(prompt)}

Rules:
- Return actual ISO 8601 timestamps for every event and task due date.
- You may create multiple events for day/week/month requests.
- Preserve what the user asked for; do not invent appointments or people.
- If a time is omitted, choose a reasonable daytime/evening time and mention the assumption in summary.
- Use reminder offsets in minutes. Default important scheduled events to a notification 30 minutes before. A plain reminder can use 0 minutes before.
- For recurring routines, use recurrence frequency daily/weekly/monthly/yearly and interval 1.
- Tasks are for to-dos without a fixed time. Notes are supporting text, not events.
- Event types: raid, tournament, meeting, gaming_session, personal, reminder, life, story, clan, task.
- Keep titles short and descriptions useful.
`,
    response_json_schema: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        events: { type: 'array', items: { type: 'object', properties: {
          title: { type: 'string' }, description: { type: 'string' }, event_type: { type: 'string' }, game: { type: 'string' },
          start_time: { type: 'string' }, end_time: { type: 'string' }, all_day: { type: 'boolean' },
          recurrence: { type: 'object', properties: { frequency: { type: 'string' }, interval: { type: 'number' }, days_of_week: { type: 'array', items: { type: 'number' } }, end_date: { type: 'string' } } },
          reminders: { type: 'array', items: { type: 'object', properties: { time_before: { type: 'number' }, type: { type: 'string' } } } }
        }, required: ['title','start_time'] } },
        tasks: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' }, due_date: { type: 'string' }, priority: { type: 'string' } }, required: ['title'] } },
        notes: { type: 'array', items: { type: 'object', properties: { content: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } }, required: ['content'] } },
      },
      required: ['summary','events','tasks','notes']
    }
  });

  const parsed = result?.result || result || {};
  const plan = {
    summary: safeString(parsed.summary || `Prepared a ${scope} schedule.`, 1500),
    events: (Array.isArray(parsed.events) ? parsed.events : []).slice(0, 100).map((event: AnyObj) => ({ ...normalizeEvent({ ...event, timezone: tz }, userId, 'ai'), user_id: undefined, reminder_state: undefined, reminder_sent: undefined })),
    tasks: (Array.isArray(parsed.tasks) ? parsed.tasks : []).slice(0, 100).map((task: AnyObj) => ({ title: safeString(task.title, 180), description: safeString(task.description, 4000), ...(task.due_date ? { due_date: iso(task.due_date) } : {}), priority: TASK_PRIORITIES.has(task.priority) ? task.priority : 'medium', created_by: 'ai' })),
    notes: (Array.isArray(parsed.notes) ? parsed.notes : []).slice(0, 50).map((note: AnyObj) => ({ content: safeString(note.content, 10000), tags: Array.isArray(note.tags) ? note.tags.map((tag: any) => safeString(tag, 60)).filter(Boolean).slice(0, 20) : ['ai-plan'] })),
  };

  const run = await base44.asServiceRole.entities.CalendarAgentRun.create({
    user_id: userId, prompt, scope, range_start: startDate.toISOString(), range_end: endDate.toISOString(), timezone_offset_minutes: offset,
    status: 'preview', summary: plan.summary, plan_snapshot: plan,
  });
  return { run_id: run.id, plan };
}

async function applyPlan(base44: any, userId: string, runId: string) {
  const run = await ownedRecord(base44, 'CalendarAgentRun', runId, userId);
  if (run.status === 'applied') return { run, already_applied: true, created_event_ids: run.created_event_ids || [], created_task_ids: run.created_task_ids || [], created_note_ids: run.created_note_ids || [] };
  const plan = run.plan_snapshot || {};
  const eventIds: string[] = [];
  const taskIds: string[] = [];
  const noteIds: string[] = [];

  for (const raw of Array.isArray(plan.events) ? plan.events : []) {
    const created = await createEvent(base44, userId, raw, 'ai');
    eventIds.push(created.id);
  }
  for (const task of Array.isArray(plan.tasks) ? plan.tasks : []) {
    const created = await base44.asServiceRole.entities.UserTask.create({ user_id: userId, title: safeString(task.title, 180), description: safeString(task.description, 4000), ...(task.due_date ? { due_date: iso(task.due_date) } : {}), priority: TASK_PRIORITIES.has(task.priority) ? task.priority : 'medium', status: 'pending', created_by: 'ai' });
    taskIds.push(created.id);
  }
  for (const note of Array.isArray(plan.notes) ? plan.notes : []) {
    const created = await base44.asServiceRole.entities.UserNote.create({ user_id: userId, content: safeString(note.content, 10000), tags: Array.isArray(note.tags) ? note.tags : ['ai-plan'] });
    noteIds.push(created.id);
  }

  const updated = await base44.asServiceRole.entities.CalendarAgentRun.update(run.id, { status: 'applied', created_event_ids: eventIds, created_task_ids: taskIds, created_note_ids: noteIds });
  return { run: updated, created_event_ids: eventIds, created_task_ids: taskIds, created_note_ids: noteIds };
}

async function dueReminders(base44: any, userId: string, payload: AnyObj = {}) {
  const nowDate = new Date(payload.now || new Date().toISOString());
  const windowStart = new Date(nowDate.getTime() - 2 * 60 * 1000);
  const windowEnd = new Date(nowDate.getTime() + 36 * 60 * 60 * 1000);
  const events = await base44.asServiceRole.entities.UserEvent.filter({ user_id: userId }, 'start_time', 1000);
  const due: AnyObj[] = [];

  for (const event of events || []) {
    if (event.status === 'cancelled') continue;
    const reminders = normalizeReminders(event.reminders, event.event_type);
    if (!reminders.length) continue;
    const occurrences = expandEvent(event, windowStart, windowEnd, 30);
    const delivered = Array.isArray(event.reminder_state) ? [...event.reminder_state] : [];
    let changed = false;

    for (const occurrence of occurrences) {
      const occurrenceMs = new Date(occurrence.occurrence_start).getTime();
      for (const reminder of reminders) {
        const dueAt = occurrenceMs - reminder.time_before * 60000;
        const keyMatch = delivered.some((entry: AnyObj) => entry.occurrence_start === occurrence.occurrence_start && Number(entry.time_before) === Number(reminder.time_before) && entry.type === reminder.type);
        if (keyMatch) continue;
        if (dueAt <= nowDate.getTime() && dueAt >= nowDate.getTime() - 2 * 60 * 1000) {
          due.push({ id: `${event.id}:${occurrence.occurrence_start}:${reminder.time_before}:${reminder.type}`, event_id: event.id, title: event.title, description: event.description || '', event_type: event.event_type, game: event.game || '', start_time: occurrence.occurrence_start, reminder_type: reminder.type, time_before: reminder.time_before });
          delivered.push({ occurrence_start: occurrence.occurrence_start, time_before: reminder.time_before, type: reminder.type, sent_at: nowDate.toISOString() });
          changed = true;
        }
      }
    }

    if (changed) {
      const allNonRecurringSent = !event.recurrence?.frequency && reminders.every((reminder: AnyObj) => delivered.some((entry: AnyObj) => Number(entry.time_before) === Number(reminder.time_before) && entry.type === reminder.type));
      await base44.asServiceRole.entities.UserEvent.update(event.id, { reminder_state: delivered.slice(-120), reminder_sent: allNonRecurringSent });
    }
  }
  return due;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const payload = body.payload || {};

    if (action === 'getState') return Response.json({ success: true, ...(await getState(base44, user.id, payload)) });
    if (action === 'createEvent') return Response.json({ success: true, event: await createEvent(base44, user.id, payload, payload.source || 'user') });
    if (action === 'updateEvent') {
      const current = await ownedRecord(base44, 'UserEvent', payload.id, user.id);
      const normalized = normalizeEvent({ ...current, ...payload.patch, user_id: user.id }, user.id, current.source || 'user');
      const event = await base44.asServiceRole.entities.UserEvent.update(current.id, { ...normalized, reminder_state: [], reminder_sent: false });
      return Response.json({ success: true, event });
    }
    if (action === 'deleteEvent') {
      await ownedRecord(base44, 'UserEvent', payload.id, user.id);
      await base44.asServiceRole.entities.UserEvent.delete(payload.id);
      return Response.json({ success: true });
    }
    if (action === 'toggleTask') {
      const task = await ownedRecord(base44, 'UserTask', payload.id, user.id);
      const status = payload.status || (task.status === 'completed' ? 'pending' : 'completed');
      const updated = await base44.asServiceRole.entities.UserTask.update(task.id, { status: ['pending','in_progress','completed','cancelled'].includes(status) ? status : 'pending' });
      return Response.json({ success: true, task: updated });
    }
    if (action === 'createTask') {
      const task = await base44.asServiceRole.entities.UserTask.create({ user_id: user.id, title: safeString(payload.title, 180), description: safeString(payload.description, 4000), ...(payload.due_date ? { due_date: iso(payload.due_date) } : {}), priority: TASK_PRIORITIES.has(payload.priority) ? payload.priority : 'medium', status: 'pending', created_by: payload.created_by === 'ai' ? 'ai' : 'user' });
      return Response.json({ success: true, task });
    }
    if (action === 'createNote') {
      const note = await base44.asServiceRole.entities.UserNote.create({ user_id: user.id, content: safeString(payload.content, 10000), tags: Array.isArray(payload.tags) ? payload.tags.map((x: any) => safeString(x, 60)).filter(Boolean).slice(0, 20) : [] });
      return Response.json({ success: true, note });
    }
    if (action === 'aiPlan') return Response.json({ success: true, ...(await buildAiPlan(base44, user.id, payload)) });
    if (action === 'applyPlan') return Response.json({ success: true, ...(await applyPlan(base44, user.id, payload.run_id)) });
    if (action === 'dueReminders') return Response.json({ success: true, reminders: await dueReminders(base44, user.id, payload) });

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[calendarAgent]', error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});
