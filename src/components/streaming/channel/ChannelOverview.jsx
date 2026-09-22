import { ArrowUpRight, CalendarDays, Radio } from 'lucide-react';

export default function ChannelOverview({ profile, schedules = [], loading, error, onRetry, onOpenSchedule, isEditMode = false, onUpdateProfile }) {
  const next = schedules.filter((item) => Number.isFinite(Date.parse(item.scheduled_start)) && Date.parse(item.scheduled_start) > Date.now()).sort((a, b) => Date.parse(a.scheduled_start) - Date.parse(b.scheduled_start))[0];
  const when = next ? new Date(next.scheduled_start) : null;
  return <div className="channel-overview">
    <section className="channel-about-panel" aria-labelledby="channel-about-title"><span className="channel-small-label"><Radio size={14} />BEHIND THE STREAM</span><h2 id="channel-about-title">Meet the channel</h2>
      {isEditMode ? <label className="channel-bio-editor">About your channel<textarea value={profile?.bio || ''} maxLength={3000} onChange={(event) => onUpdateProfile?.('bio', event.target.value)} placeholder="Tell visitors what you play and what your community is about." /></label>
        : <p>{profile?.bio || 'Welcome in. Settle into the stream, join the conversation, and explore the games and moments that make this channel.'}</p>}
    </section>
    <section className="channel-next-panel" aria-labelledby="channel-next-title"><span className="channel-small-label"><CalendarDays size={14} />NEXT ON STREAM</span>
      {loading ? <p role="status">Loading the schedule…</p> : error ? <div role="alert"><h2 id="channel-next-title">Schedule unavailable</h2><p>Please try again to see what’s coming up.</p><button type="button" onClick={onRetry}>Retry schedule</button></div>
        : <><h2 id="channel-next-title">{next?.title || 'Good things are coming'}</h2>{when ? <time dateTime={next.scheduled_start}>{when.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}<span>·</span>{when.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}</time> : <p>The next session hasn’t been announced yet. Check the schedule for channel plans.</p>}<button type="button" onClick={() => onOpenSchedule?.('schedule', next?.scheduled_start)}>View schedule <ArrowUpRight size={15} /></button></>}
    </section>
  </div>;
}
