import { useMemo, useRef } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { galleryDays } from './galleryModel';

export default function MomentsTimeline({ clips, selectedDay, onSelectDay }) {
  const railRef = useRef(null);
  const days = useMemo(() => galleryDays(clips), [clips]);
  const move = (direction) => railRef.current?.scrollBy({ left: direction * 360, behavior: 'smooth' });
  return <div className="gallery-timeline">
    <CalendarDays size={15} className="gallery-timeline-icon" /><button type="button" className="gallery-icon-button" aria-label="Scroll dates left" onClick={() => move(-1)}><ChevronLeft size={16} /></button>
    <div ref={railRef} className="gallery-date-rail" aria-label="Filter moments by date"><button type="button" aria-pressed={selectedDay === 'all'} className={selectedDay === 'all' ? 'is-active' : ''} onClick={() => onSelectDay('all')}><span>All dates</span><small>{clips.length} moments</small></button>{days.map((day) => <button key={day.key} type="button" aria-label={`${day.label}, ${day.count} moments`} aria-pressed={selectedDay === day.key} className={selectedDay === day.key ? 'is-active' : ''} onClick={() => onSelectDay(day.key)}><span>{day.label} <small>{day.weekday}</small></span><span className="gallery-day-dots" aria-hidden="true">{day.categories.map((category) => <i key={category} title={category} />)}</span></button>)}</div>
    <button type="button" className="gallery-icon-button" aria-label="Scroll dates right" onClick={() => move(1)}><ChevronRight size={16} /></button>
  </div>;
}
