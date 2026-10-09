import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import LunaLightEdge from './LunaLightEdge';
import './dashboard-status.css';

// Dedicated clock beside the five party portraits. The bell/update feed
// is a separate strip on the far right, aligned to the AI Attribute rail.
export default function DashboardClockTile({ onCalendarClick = () => {} }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="luna-calendar-tile" aria-label="Calendar, time and date" data-luna-calendar-tile>
      <LunaLightEdge variant="clock" />
      <button type="button" className="luna-calendar-launch" aria-label="Open calendar" onClick={onCalendarClick}>
        <CalendarDays size={22} aria-hidden="true" className="luna-calendar-launch__icon" />
        <span className="luna-calendar-launch__time">
          <time dateTime={now.toISOString()}>{now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</time>
          <small title={now.toLocaleDateString('en-US', { dateStyle: 'full' })}>
            {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </small>
        </span>
      </button>
    </section>
  );
}
