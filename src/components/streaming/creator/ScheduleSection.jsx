import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Bell, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3,
  Gamepad2, Pencil, Plus, Radio, Save, ShieldCheck, Trash2, X
} from 'lucide-react';
import { addDays, format, isSameDay, startOfWeek, subDays } from 'date-fns';
import { base44 } from '@/api/base44Client';

const blankDraft = () => ({
  id: '',
  title: '',
  game_id: '',
  scheduled_start: '',
  scheduled_end: '',
  send_notification: true,
});

const localInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const toIso = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : '';
};

const displayTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

const displayDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

export default function ScheduleSection({
  ownerId,
  profile,
  scheduledStreams = [],
  games = [],
  editable = false,
  initialDate,
  onRefresh,
}) {
  const client = useQueryClient();
  const [baseDate, setBaseDate] = useState(() => initialDate ? new Date(initialDate) : new Date());
  const [draft, setDraft] = useState(blankDraft);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rulesEditing, setRulesEditing] = useState(false);
  const [rules, setRules] = useState(() => Array.isArray(profile?.channel_rules) ? profile.channel_rules : []);
  const [scheduleNote, setScheduleNote] = useState(profile?.schedule_note || '');
  const [ruleDraft, setRuleDraft] = useState('');
  const [error, setError] = useState('');
  const [ownerGames, setOwnerGames] = useState([]);

  useEffect(() => {
    setRules(Array.isArray(profile?.channel_rules) ? profile.channel_rules : []);
    setScheduleNote(profile?.schedule_note || '');
  }, [profile?.channel_rules, profile?.schedule_note]);

  useEffect(() => {
    if (!editable) {
      setOwnerGames([]);
      return undefined;
    }
    let cancelled = false;
    base44.entities.Game.list('title', 500, 0, ['id', 'title', 'genre', 'cover_image'])
      .then((rows) => {
        const data = Array.isArray(rows) ? rows : rows?.data || [];
        if (!cancelled) setOwnerGames(data);
      })
      .catch(() => {
        if (!cancelled) setOwnerGames([]);
      });
    return () => { cancelled = true; };
  }, [editable]);

  useEffect(() => {
    if (initialDate) setBaseDate(new Date(initialDate));
  }, [initialDate]);

  const availableGames = useMemo(() => {
    const merged = new Map();
    for (const game of [...(games || []), ...(ownerGames || [])]) if (game?.id) merged.set(String(game.id), game);
    return [...merged.values()].sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')));
  }, [games, ownerGames]);
  const gameMap = useMemo(() => new Map(availableGames.map((game) => [String(game.id), game])), [availableGames]);
  const entries = useMemo(
    () => [...(scheduledStreams || [])]
      .filter((row) => row.status === 'scheduled' && Number.isFinite(Date.parse(row.scheduled_start)))
      .sort((a, b) => Date.parse(a.scheduled_start) - Date.parse(b.scheduled_start)),
    [scheduledStreams]
  );

  const startDate = startOfWeek(baseDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 14 }, (_, index) => addDays(startDate, index));
  const next = entries.find((entry) => Date.parse(entry.scheduled_start) >= Date.now()) || entries[0] || null;

  const invalidate = async () => {
    if (ownerId) await client.invalidateQueries({ queryKey: ['channel-home-content', ownerId] });
    await client.invalidateQueries({ queryKey: ['live-discovery-directory'] });
    onRefresh?.();
  };

  const openNew = (day = new Date()) => {
    const start = new Date(day);
    start.setHours(19, 0, 0, 0);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    setDraft({
      ...blankDraft(),
      scheduled_start: localInput(start),
      scheduled_end: localInput(end),
    });
    setError('');
    setEditing(true);
  };

  const openEdit = (entry) => {
    setDraft({
      id: entry.id,
      title: entry.title || '',
      game_id: entry.game_id || '',
      scheduled_start: localInput(entry.scheduled_start),
      scheduled_end: localInput(entry.scheduled_end),
      send_notification: entry.send_notification !== false,
    });
    setError('');
    setEditing(true);
  };

  const saveEntry = async (event) => {
    event?.preventDefault?.();
    if (!draft.title.trim() || !draft.scheduled_start || saving) return;
    setSaving(true);
    setError('');
    try {
      const response = await base44.functions.invoke('channelSchedule', {
        action: draft.id ? 'update' : 'create',
        data: {
          ...draft,
          scheduled_start: toIso(draft.scheduled_start),
          scheduled_end: toIso(draft.scheduled_end),
        },
      });
      const body = response?.data || response;
      if (body?.error) throw new Error(body.error);
      setEditing(false);
      setDraft(blankDraft());
      await invalidate();
    } catch (err) {
      setError(err?.message || 'Schedule could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const cancelEntry = async (entry) => {
    if (!entry?.id || saving) return;
    setSaving(true);
    setError('');
    try {
      const response = await base44.functions.invoke('channelSchedule', { action: 'cancel', data: { id: entry.id } });
      const body = response?.data || response;
      if (body?.error) throw new Error(body.error);
      await invalidate();
    } catch (err) {
      setError(err?.message || 'Schedule could not be cancelled.');
    } finally {
      setSaving(false);
    }
  };

  const saveRules = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const response = await base44.functions.invoke('channelSchedule', {
        action: 'updateRules',
        data: { rules, schedule_note: scheduleNote },
      });
      const body = response?.data || response;
      if (body?.error) throw new Error(body.error);
      setRulesEditing(false);
      await invalidate();
    } catch (err) {
      setError(err?.message || 'Channel rules could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const addRule = () => {
    const value = ruleDraft.trim();
    if (!value || rules.length >= 12) return;
    setRules((current) => [...current, value]);
    setRuleDraft('');
  };

  return (
    <section id="channel-page-schedule" className="channel-page-schedule" aria-label="Channel schedule">
      <div className="channel-schedule-diamond-glow" aria-hidden="true" />

      <header className="channel-schedule-header">
        <div>
          <span className="channel-schedule-kicker"><CalendarDays size={14} /> CHANNEL SCHEDULE</span>
          <h2>When this channel goes live.</h2>
          <p>{scheduleNote || 'Upcoming sessions, games, start times and community expectations — all in one place.'}</p>
        </div>
        <div className="channel-schedule-header-actions">
          <span>{entries.length} upcoming</span>
          {editable && <button type="button" onClick={() => openNew()}><Plus size={14} />Add stream</button>}
        </div>
      </header>

      {error && <div className="channel-schedule-error" role="alert">{error}</div>}

      <div className="channel-schedule-layout">
        <div className="channel-schedule-main">
          <section className="channel-schedule-next">
            <div className="channel-schedule-next-mark"><Radio size={18} /></div>
            <div className="channel-schedule-next-copy">
              <span>NEXT SESSION</span>
              <h3>{next?.title || 'Nothing announced yet'}</h3>
              {next ? (
                <>
                  <p>{displayDate(next.scheduled_start)} · {displayTime(next.scheduled_start)}{next.scheduled_end ? ' – ' + displayTime(next.scheduled_end) : ''}</p>
                  <small><Gamepad2 size={12} />{gameMap.get(String(next.game_id))?.title || 'Game to be announced'}</small>
                </>
              ) : <p>The creator has room for the next live session.</p>}
            </div>
            {next?.send_notification && <div className="channel-schedule-notify"><Bell size={14} />Followers notified</div>}
          </section>

          <div className="channel-schedule-calendar-head">
            <div>
              <strong>{format(startDate, 'MMM d')} – {format(days[13], 'MMM d, yyyy')}</strong>
              <span>Times display in your local timezone</span>
            </div>
            <div>
              <button type="button" onClick={() => setBaseDate((date) => subDays(date, 14))} aria-label="Previous two weeks"><ChevronLeft size={14} /></button>
              <button type="button" onClick={() => setBaseDate(new Date())}>Today</button>
              <button type="button" onClick={() => setBaseDate((date) => addDays(date, 14))} aria-label="Next two weeks"><ChevronRight size={14} /></button>
            </div>
          </div>

          <div className="channel-schedule-calendar">
            {days.map((day) => {
              const dayEntries = entries.filter((entry) => isSameDay(new Date(entry.scheduled_start), day));
              const today = isSameDay(day, new Date());
              return (
                <div key={day.toISOString()} className={today ? 'is-today' : ''}>
                  <div className="channel-schedule-day-head">
                    <span>{format(day, 'EEE')}</span>
                    <strong>{format(day, 'd')}</strong>
                  </div>
                  <div className="channel-schedule-day-body">
                    {dayEntries.length ? dayEntries.map((entry) => {
                      const game = gameMap.get(String(entry.game_id));
                      return <article key={entry.id}>
                        <time>{displayTime(entry.scheduled_start)}</time>
                        <strong>{entry.title}</strong>
                        <span>{game?.title || 'Game TBA'}</span>
                        {editable && <div>
                          <button type="button" onClick={() => openEdit(entry)} aria-label={'Edit ' + entry.title}><Pencil size={11} /></button>
                          <button type="button" onClick={() => cancelEntry(entry)} aria-label={'Cancel ' + entry.title}><Trash2 size={11} /></button>
                        </div>}
                      </article>;
                    }) : (
                      <button type="button" className="channel-schedule-empty-day" disabled={!editable} onClick={() => editable && openNew(day)}>
                        {editable ? <><Plus size={11} />Add</> : <span>—</span>}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="channel-schedule-rules">
          <div className="channel-schedule-rules-title">
            <div><ShieldCheck size={17} /><span><strong>Channel rules</strong><small>How we keep the room welcoming</small></span></div>
            {editable && !rulesEditing && <button type="button" onClick={() => setRulesEditing(true)}><Pencil size={12} />Edit</button>}
          </div>

          {rulesEditing && editable ? (
            <div className="channel-rules-editor">
              <label>Schedule note<textarea value={scheduleNote} maxLength={800} onChange={(event) => setScheduleNote(event.target.value)} placeholder="Tell viewers what to expect from your schedule." /></label>
              <div className="channel-rule-add">
                <input value={ruleDraft} maxLength={240} onChange={(event) => setRuleDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addRule(); } }} placeholder="Add a channel rule" />
                <button type="button" onClick={addRule}><Plus size={13} /></button>
              </div>
              <ol>
                {rules.map((rule, index) => <li key={rule + index}><span>{String(index + 1).padStart(2, '0')}</span><input value={rule} onChange={(event) => setRules((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} /><button type="button" onClick={() => setRules((current) => current.filter((_, itemIndex) => itemIndex !== index))}><X size={12} /></button></li>)}
              </ol>
              <div className="channel-rules-actions">
                <button type="button" onClick={() => setRulesEditing(false)}>Cancel</button>
                <button type="button" onClick={saveRules} disabled={saving}><Save size={13} />Save rules</button>
              </div>
            </div>
          ) : rules.length ? (
            <ol className="channel-rules-list">
              {rules.map((rule, index) => <li key={rule + index}><span>{String(index + 1).padStart(2, '0')}</span><p>{rule}</p><Check size={13} /></li>)}
            </ol>
          ) : (
            <div className="channel-rules-empty"><ShieldCheck size={22} /><p>{editable ? 'Add your channel rules so visitors know the room.' : 'This creator has not published channel rules yet.'}</p></div>
          )}

          <div className="channel-schedule-system-status">
            <span><Clock3 size={13} />Live schedule sync</span>
            <strong>Connected</strong>
          </div>
        </aside>
      </div>

      {editing && editable && (
        <div className="channel-schedule-editor-shell" role="dialog" aria-modal="true" aria-label={draft.id ? 'Edit scheduled stream' : 'Add scheduled stream'}>
          <form className="channel-schedule-editor" onSubmit={saveEntry}>
            <header><div><span>{draft.id ? 'EDIT SESSION' : 'NEW SESSION'}</span><h3>{draft.id ? 'Update scheduled stream' : 'Schedule a stream'}</h3></div><button type="button" onClick={() => setEditing(false)} aria-label="Close schedule editor"><X size={16} /></button></header>
            <label>Stream title<input value={draft.title} maxLength={180} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="What are you streaming?" required /></label>
            <label>Game<select value={draft.game_id} onChange={(event) => setDraft((current) => ({ ...current, game_id: event.target.value }))}><option value="">Game to be announced</option>{availableGames.map((game) => <option key={game.id} value={game.id}>{game.title}</option>)}</select></label>
            <div className="channel-schedule-editor-times"><label>Starts<input type="datetime-local" value={draft.scheduled_start} onChange={(event) => setDraft((current) => ({ ...current, scheduled_start: event.target.value }))} required /></label><label>Ends<input type="datetime-local" value={draft.scheduled_end} onChange={(event) => setDraft((current) => ({ ...current, scheduled_end: event.target.value }))} /></label></div>
            <label className="channel-schedule-toggle"><input type="checkbox" checked={draft.send_notification} onChange={(event) => setDraft((current) => ({ ...current, send_notification: event.target.checked }))} /><Bell size={14} /><span>Notify followers when this stream is scheduled</span></label>
            <footer><button type="button" onClick={() => setEditing(false)}>Cancel</button><button type="submit" disabled={saving || !draft.title.trim() || !draft.scheduled_start}><Save size={14} />{saving ? 'Saving…' : 'Save schedule'}</button></footer>
          </form>
        </div>
      )}
    </section>
  );
}
