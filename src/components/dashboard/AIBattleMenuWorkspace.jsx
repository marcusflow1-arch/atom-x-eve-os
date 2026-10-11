import { useState } from 'react';
import { ArrowRight, BookOpen, Check, ChevronRight, Crown, Crosshair, Flag, Gamepad2, Layers, Loader2, Orbit, Search, Shield, Sparkles, Swords, Trophy, X } from 'lucide-react';
import useLunaStore from '@/components/luna/useLunaStore';
import { BATTLE_GENRES, BATTLE_MODES } from '@/components/battle/battleMenuCatalog';
import './ai-battle-menu.css';

const ICONS = { swords: Swords, flag: Flag, orbit: Orbit, sparkles: Sparkles, crosshair: Crosshair, book: BookOpen, layers: Layers, trophy: Trophy, gamepad: Gamepad2 };
const MODE_ICONS = { pvp: Swords, pve: Shield, world_boss: Crown };
function ArenaDiagram({ view = '3D' }) {
  const planar = view === '2D';
  return <svg viewBox="0 0 280 128" className="ai-battle-menu__diagram" role="img" aria-label={view + ' arena schematic, not gameplay'}>
    <defs><linearGradient id={'battle-floor-' + view} x2="0" y2="1"><stop stopColor="#8adcf5" stopOpacity=".25"/><stop offset="1" stopColor="#8adcf5" stopOpacity=".02"/></linearGradient></defs>
    {view === 'TRACK' ? <><path d="M53 84C9 21 187 2 233 45S140 132 92 96" fill="none" stroke="#8adcf5" strokeWidth="18" opacity=".15"/><path d="M53 84C9 21 187 2 233 45S140 132 92 96" fill="none" stroke="#8adcf5" strokeDasharray="4 7"/><path d="m67 78 10 10-15 4Z" fill="#c7f2ff"/><path d="m212 43 8 10-15 1Z" fill="#8e9fe9"/></>
    : <><path d={planar ? 'M27 93H253V99H27Z' : 'm140 30 114 54-114 35L26 84Z'} fill={'url(#battle-floor-' + view + ')'} stroke="#78c9e2" strokeOpacity=".45"/>
      {!planar && <g stroke="#80cce0" strokeOpacity=".15"><path d="m65 65 117 41M104 47l116 48M65 96l115-47M104 108l115-42"/></g>}
      <path d={planar ? 'M80 75H200' : 'm81 78 117-13'} stroke="#91dff5" strokeDasharray="3 5" opacity=".6"/>
      <g fill="#b9edfa"><circle cx="81" cy={planar ? 55 : 42} r="5"/><path d={planar ? 'm81 62-8 16m8-16 8 16m-8-14v18m0-2-7 13m7-13 7 13' : 'm81 49-8 16m8-16 8 16m-8-14v18m0-2-7 13m7-13 7 13'} stroke="#b9edfa" strokeWidth="2" fill="none"/></g>
      <g fill="#9caef4"><circle cx="198" cy={view === 'AIR' ? 15 : planar ? 55 : 30} r="5"/><path d={view === 'AIR' ? 'm198 22-8 12m8-12 8 12m-8-10v15m0-2-7 11m7-11 7 11' : planar ? 'm198 62-8 16m8-16 8 16m-8-14v18m0-2-7 13m7-13 7 13' : 'm198 37-8 16m8-16 8 16m-8-14v18m0-2-7 13m7-13 7 13'} stroke="#9caef4" strokeWidth="2" fill="none"/></g>
      {view === 'AIR' && <path d="M226 70V15m-5 6 5-6 5 6" stroke="#a4b6f4" fill="none" strokeDasharray="3 3"/>}
    </>}
  </svg>;
}
function GenreDetail({ genre, mode }) {
  const [styleIndex, setStyleIndex] = useState(0);
  const selected = genre.styles[styleIndex];
  const Icon = ICONS[genre.icon] || Swords;
  return <>
    <div className="ai-battle-menu__hero">
      <div><span className="ai-battle-menu__eyebrow">{genre.family}</span><h3><Icon size={23}/>{genre.label}</h3><p className="ai-battle-menu__tagline">{genre.tagline}</p><div className="ai-battle-menu__tags">{genre.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div>
      <div className="ai-battle-menu__visual"><ArenaDiagram view={selected?.view}/><span>Schematic · {selected?.view || 'avatar arena'}</span></div>
    </div>
    <p className="ai-battle-menu__description">{genre.description}</p>
    {genre.styles.length > 0 && <section aria-label="Arena style previews" className="ai-battle-menu__styles">
      <div className="ai-battle-menu__section-label"><h4>Three styles. One arena.</h4><span>Concept preview</span></div>
      <div className="ai-battle-menu__style-grid">{genre.styles.map((style, index) => <button key={style.id} type="button" aria-pressed={styleIndex === index} onClick={() => setStyleIndex(index)} className={styleIndex === index ? 'is-selected' : ''}>
        <span className="ai-battle-menu__style-number">0{index + 1}<span>{style.view}</span></span><strong>{style.name}</strong><small>{style.description}</small>
      </button>)}</div>
      <div className="ai-battle-menu__shift"><Sparkles size={19}/><div><strong>Arena Shift <span>Proposed ability</span></strong><p>Change the active style during the same match. Your opponent, progress and spent resources stay with you.</p></div></div>
      <p className="ai-battle-menu__objective"><Flag size={14}/>{genre.objective}</p>
      <details className="ai-battle-menu__references"><summary>Creative references & match rules</summary><p>{genre.styles.map(style => style.reference).join(' · ')}</p><p>These are design references for an original Atom XE arena. Styles are not separate queues. A shift requires a shared ruleset, fair warning and compatible controls for both players. This preview does not change gameplay.</p></details>
    </section>}
    {mode !== 'pvp' && <div className="ai-battle-menu__encounter"><h4>{mode === 'pve' ? 'Short sessions. Steady progress.' : 'A shared challenge, when you want one.'}</h4><p>{BATTLE_MODES.find(item => item.id === mode)?.goal}</p><span>{mode === 'pve' ? 'AI encounters and reward tables are not connected yet.' : 'No live events to display. Schedules and rewards are not connected yet.'}</span></div>}
  </>;
}
export default function AIBattleMenuWorkspace({ embedded, onClose, mode, genreId, chooseMode, chooseGenre, locked, availability, battle, waiting, reserved, connecting, ready, enterQueue, leaveQueue, onlineSummary, statusText, openSkillBook }) {
  const [search, setSearch] = useState('');
  const hotbar = useLunaStore(state => state.hotbar);
  const activeRow = useLunaStore(state => state.activeSkillRow);
  const genre = BATTLE_GENRES.find(item => item.id === genreId) || BATTLE_GENRES[0];
  const normalizedSearch = search.trim().toLowerCase();
  const genres = BATTLE_GENRES.filter(item => item.id !== 'core' && [item.label, item.family, ...item.styles.map(style => style.reference)].join(' ').toLowerCase().includes(normalizedSearch));
  const queueActive = waiting || reserved || connecting || ready;
  const stateLabel = reserved ? 'Opponent found' : connecting ? 'Connecting players' : waiting ? 'Finding an opponent' : ready ? 'Match in progress' : battle.busy ? 'Joining queue' : availability.label;
  return <div className={embedded ? 'luna-window__embedded luna-window__battle ai-battle-menu' : 'ai-battle-menu ai-battle-menu--floating'} data-dashboard-utility-workspace>
    <section className="ai-battle-menu__shell" aria-label="AI Battle">
      <header className="ai-battle-menu__header"><span className="ai-battle-menu__emblem"><Swords size={22}/></span><div><span className="ai-battle-menu__eyebrow">ATOM XE / PLAY YOUR WAY</span><h2>AI Battle</h2></div><p>Your games. Your avatar.<br/><strong>Your next challenge.</strong></p>{!embedded && <button type="button" className="ai-battle-menu__icon-button" onClick={onClose} aria-label="Close AI Battle"><X size={18}/></button>}</header>
      <nav className="ai-battle-menu__modes" aria-label="Battle mode">{BATTLE_MODES.map(item => { const Icon = MODE_ICONS[item.id]; return <button type="button" key={item.id} aria-pressed={mode === item.id} disabled={locked} onClick={() => chooseMode(item.id)} className={mode === item.id ? 'is-selected' : ''}><Icon size={18}/><span><strong>{item.label}</strong><small>{item.subtitle}</small></span>{mode === item.id && <Check size={14}/>}</button>; })}</nav>
      <div className="ai-battle-menu__body">
        <aside className="ai-battle-menu__genres" aria-label="Choose an arena">
          <span className="ai-battle-menu__eyebrow">CURRENT ARENA</span>
          <button type="button" className={genreId === 'core' ? 'ai-battle-menu__genre is-selected' : 'ai-battle-menu__genre'} aria-pressed={genreId === 'core'} disabled={locked} onClick={() => { chooseMode('pvp'); chooseGenre('core'); }}><Swords size={16}/><span>Avatar Duel<small>Existing PvP queue</small></span><ChevronRight size={13}/></button>
          <div className="ai-battle-menu__genre-heading"><span className="ai-battle-menu__eyebrow">EXPLORE GENRES</span><span>Preview</span></div>
          <label className="ai-battle-menu__search"><Search size={14}/><input aria-label="Find a battle genre" placeholder="Find a genre…" value={search} onChange={e => setSearch(e.target.value)}/>{search && <button type="button" onClick={() => setSearch('')} aria-label="Clear genre search"><X size={13}/></button>}</label>
          <div className="ai-battle-menu__genre-list">{genres.map(item => { const Icon = ICONS[item.icon]; return <button key={item.id} type="button" className={'ai-battle-menu__genre ' + (genreId === item.id ? 'is-selected' : '')} aria-pressed={genreId === item.id} disabled={locked} onClick={() => chooseGenre(item.id)}><Icon size={16}/><span>{item.label}</span>{genreId === item.id && <ChevronRight size={13}/>}</button>; })}{!genres.length && <p className="ai-battle-menu__empty">No genre matches “{search}”. Try fighting, racing or sci-fi.</p>}</div>
        </aside>
        <main className="ai-battle-menu__content">
          <GenreDetail key={genreId + ':' + mode} genre={genre} mode={mode}/>
          <div className="ai-battle-menu__progression" aria-label="Achievement progression"><span><Trophy size={16}/>Earn achievements</span><ArrowRight size={12}/><span><Layers size={16}/>Unlock cards</span><ArrowRight size={12}/><span><Swords size={16}/>Build your playstyle</span></div>
          <section className="ai-battle-menu__loadout" aria-label="Dashboard equipped cards">
            <div className="ai-battle-menu__section-label"><div><h4>Your equipped cards</h4><p>Dashboard preset {String.fromCharCode(65 + (activeRow || 0))} · Match eligibility is checked when you join.</p></div><button type="button" onClick={openSkillBook}><BookOpen size={14}/>Skill Book<ArrowRight size={13}/></button></div>
            <div className="ai-battle-menu__slots">{Array.from({length:10}, (_, index) => { const card = hotbar?.[index]; const name = card?.card_name || card?.title || card?.name; return <div key={index} className={name ? 'has-card' : ''} title={name || 'No card shown in slot ' + (index + 1)}><kbd>{index === 9 ? '0' : index + 1}</kbd>{name ? <><Layers size={14}/><span>{name}</span></> : <span className="ai-battle-menu__slot-empty">—</span>}</div>; })}</div>
            {!Object.values(hotbar || {}).some(Boolean) && <p className="ai-battle-menu__loadout-hint">No equipped cards are shown yet. Open Skill Book to review your saved loadout.</p>}
          </section>
        </main>
      </div>
      <footer className="ai-battle-menu__footer">
        <div className="ai-battle-menu__queue-row"><div role="status" aria-live="polite" className="ai-battle-menu__status">{(battle.busy || queueActive) ? <Loader2 size={18} className="ai-battle-menu__spinner"/> : <span className={'ai-battle-menu__status-dot ' + (availability.available ? 'is-available' : '')}/>}<div><strong>{queueActive ? stateLabel : genre.label + ' · ' + stateLabel}</strong><p>{queueActive || battle.busy ? statusText : availability.reason}</p></div></div>
          {waiting || reserved ? <button type="button" className="ai-battle-menu__queue-button is-cancel" disabled={battle.busy} onClick={leaveQueue}>{battle.busy ? 'Cancelling…' : reserved ? 'Cancel reservation' : 'Cancel queue'}</button>
          : connecting || ready ? <button type="button" className="ai-battle-menu__queue-button" disabled>Entering match…</button>
          : <button type="button" className="ai-battle-menu__queue-button" disabled={battle.busy || battle.isLoading || !availability.available} onClick={enterQueue}>{battle.busy ? 'Joining…' : battle.isLoading ? 'Checking queue…' : availability.available ? <>Find opponent<kbd>Q</kbd></> : 'Not available yet'}</button>}
        </div>
        <div className="ai-battle-menu__footer-meta"><span>{queueActive ? 'Closing this window keeps your queue active.' : availability.available ? 'Opening this menu never starts a queue.' : 'Browse freely. Preview selections do not queue.'}</span><span>All AI Battle: {onlineSummary?.online ?? '—'} online · {onlineSummary?.in_queue ?? '—'} queued · {onlineSummary?.matches_live ?? '—'} matches</span></div>
      </footer>
    </section>
  </div>;
}
