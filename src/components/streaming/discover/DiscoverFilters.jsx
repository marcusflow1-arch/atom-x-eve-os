import { CameraOff, Check, ChevronDown, Compass, GraduationCap, Heart, MessageCircle, MicOff, Radio, SlidersHorizontal, Swords, Users, X } from 'lucide-react';
import { STYLE_FILTERS } from '../hub/discoveryModel';
import { DISCOVERY_FOCUS } from './creatorDiscoveryModel';

const styleIcons = { 'no commentary': MicOff, 'no camera': CameraOff, talkative: MessageCircle, 'active chill': Heart, competitive: Swords, educational: GraduationCap, interactive: Users };

export default function DiscoverFilters({ filters, genres, genreCounts, activeCount, onChange, onReset, open, onToggle }) {
  return <aside className={`discover-filter-rail ${open ? 'is-open' : ''}`} aria-label="Discover preferences">
    <button type="button" className="discover-mobile-refine" aria-expanded={open} aria-controls="discover-filter-options" onClick={onToggle}><SlidersHorizontal size={16} />Refine your discovery{activeCount > 0 && <span>{activeCount}</span>}<ChevronDown size={15} /></button>
    <div id="discover-filter-options" className="discover-filter-options">
      <div className="discover-filter-intro"><Compass size={21} /><span>Make it your kind<br /><strong>of live.</strong></span></div>
      <fieldset><legend>Room to be discovered</legend><label className="discover-select"><span className="sr-only">Creator community</span><select aria-label="Creator community" value={filters.focus} onChange={(event) => onChange({ focus: event.target.value })}>{DISCOVERY_FOCUS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select><ChevronDown size={13} /></label><p className="discover-filter-help">New here: joined in the last 30 days.<br />Small communities: up to 100 watching.</p></fieldset>
      <fieldset><legend>Your worlds</legend><div className="discover-genre-options" role="group" aria-label="Game genres">{genres.map((genre) => <button type="button" key={genre} aria-pressed={filters.genre === genre} onClick={() => onChange({ genre, gameId: '' })}><span>{genre}</span><small>{genreCounts.get(genre) || 0}</small></button>)}</div></fieldset>
      <fieldset><legend>Stream style</legend><p className="discover-filter-help">Combine styles. Match every preference.</p><div className="discover-style-options" role="group" aria-label="Streamer Style Preferences">{STYLE_FILTERS.map(([id, label]) => {
        const active = id === 'all' ? filters.styles.length === 0 : filters.styles.includes(id);
        const Icon = styleIcons[id] || Radio;
        return <button type="button" key={id} aria-pressed={active} onClick={() => onChange({ styles: id === 'all' ? [] : active ? filters.styles.filter((style) => style !== id) : [...filters.styles, id] })}><Icon size={13} /><span>{label}</span>{active && <Check size={11} className="discover-style-check" />}</button>;
      })}</div></fieldset>
      {activeCount > 0 && <button type="button" className="discover-reset" onClick={onReset}><X size={12} />Reset preferences</button>}
    </div>
  </aside>;
}
