import { Gamepad2, Layers } from 'lucide-react';

export default function LibraryBrowseControls({ genres, genre, scope = 'games', onGenreChange, onScopeChange }) {
  return <div className="ll-filters">
    <label className="ll-genre"><span>Genre</span><select aria-label="Filter library by genre" value={genre} onChange={(event) => onGenreChange(event.target.value)}>
      <option value="all">All genres</option>{(genre !== 'all' && !genres.includes(genre) ? [genre, ...genres] : genres).map((name) => <option key={name} value={name}>{name}</option>)}
    </select></label>
    <nav className="ll-kind-switch" aria-label="Library result type">
      <button type="button" aria-label="Browse by game" title="Browse by game" aria-pressed={scope === 'games'} onClick={() => onScopeChange('games')}><Gamepad2 size={16} /></button>
      <button type="button" aria-label="Browse by card" title="Browse by card" aria-pressed={scope === 'cards'} onClick={() => onScopeChange('cards')}><Layers size={16} /></button>
    </nav>
  </div>;
}
