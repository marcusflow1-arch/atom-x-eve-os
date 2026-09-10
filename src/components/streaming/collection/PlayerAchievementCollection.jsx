import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ChevronDown, Film, Gamepad2, Search, Trophy, X } from 'lucide-react';
import usePlayerCollection from './usePlayerCollection';
import { filterCollectionGames, measureCollectionDock } from './playerCollectionModel';
import './playerCollection.css';

const rarityColor = { Common: '#b9c5d4', Uncommon: '#86efac', Rare: '#7dd3fc', Epic: '#d8b4fe', Legendary: '#fcd38a', Mythic: '#fda4af', Mythical: '#fda4af', Unique: '#a5f3fc', Limitless: '#f0abfc' };
const statusLabel = { unlocked: 'Unlocked', in_progress: 'In progress', locked: 'Locked', collected: 'Collected' };

function UnlockMoment({ card }) {
  const [failed, setFailed] = useState(false);
  const url = card.proofUrl;
  const image = /\.(png|jpe?g|webp|gif|avif)([?#]|$)/i.test(url || '');
  return <figure className="player-collection-proof">
    <div className="aspect-video rounded-lg">
      {url && !failed ? image ? <img src={url} alt={`Unlock proof for ${card.name}`} onError={() => setFailed(true)} /> : <video src={url} controls autoPlay muted playsInline preload="metadata" aria-label={`${card.name} unlock moment`} onError={() => setFailed(true)} /> : <div className="player-collection-proof-empty"><Film size={24} /><span>{failed ? 'This unlock clip is unavailable.' : 'No unlock clip saved for this achievement.'}</span></div>}
    </div>
    <figcaption>{image ? 'Unlock screenshot' : 'The unlock moment'}</figcaption>
  </figure>;
}

function CardInspector({ card, onBack, backRef }) {
  const date = card.unlockDate ? new Date(card.unlockDate) : null;
  return <div className="player-collection-inspector">
    <button ref={backRef} type="button" className="player-collection-back" onClick={onBack}><ArrowLeft size={16} />Back to Collection</button>
    <div className="player-collection-detail-layout">
      <div className="player-collection-detail-copy">
        <span className="player-collection-kicker">{card.game.title} / {card.category}</span>
        <h3>{card.name}</h3>
        <div className="player-collection-badges"><span style={{ color: rarityColor[card.rarity] || rarityColor.Common }}>{card.rarity}</span><span>{statusLabel[card.status]}</span></div>
        <p>{card.description}</p>
        <dl className="player-collection-stats"><div><dt>Unlock date</dt><dd>{date && Number.isFinite(date.getTime()) ? date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : card.status === 'unlocked' ? 'Not recorded' : 'Not unlocked'}</dd></div><div><dt>Achievement points</dt><dd>{card.points === null ? 'Not recorded' : card.points.toLocaleString()}</dd></div></dl>
        <div className="player-collection-progress"><div><span>Progress</span><strong>{card.current !== null && card.total > 0 ? `${card.current.toLocaleString()} / ${card.total.toLocaleString()}` : card.percent === 100 ? 'Complete' : 'Not recorded'}</strong></div>{card.percent !== null && <progress aria-label={`${card.name} progress`} max="100" value={card.percent} />}<small>{card.percent !== null ? `${Math.round(card.percent)}% complete` : 'Progress updates appear when saved by the game.'}</small></div>
        {card.acquisition && <p className="player-collection-acquisition">Acquisition: {card.acquisition}</p>}
      </div>
      <UnlockMoment key={card.id} card={card} />
    </div>
  </div>;
}

export default function PlayerAchievementCollection({ user, onClose }) {
  const query = usePlayerCollection(user);
  const games = query.data || [];
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('All genres');
  const [rarity, setRarity] = useState('All tiers');
  const [gameId, setGameId] = useState(null);
  const [cardId, setCardId] = useState(null);
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const backRef = useRef(null);
  const gridRef = useRef(null);
  const lastCardRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const filteredGames = useMemo(() => filterCollectionGames(games, search, genre), [games, search, genre]);
  const game = filteredGames.find((item) => item.id === gameId) || filteredGames[0];
  const cards = (game?.cards || []).filter((card) => rarity === 'All tiers' || card.rarity === rarity);
  const selected = game?.cards.find((card) => card.id === cardId);
  const genres = ['All genres', ...new Set(games.map((item) => item.genre))];
  const rarities = ['All tiers', ...new Set((game?.cards || []).map((card) => card.rarity))];
  const back = () => { setCardId(null); requestAnimationFrame(() => { const button = [...(gridRef.current?.querySelectorAll('[data-achievement-id]') || [])].find((node) => node.dataset.achievementId === lastCardRef.current); button?.focus(); }); };

  useEffect(() => {
    const previousFocus = document.activeElement;
    searchRef.current?.focus({ preventScroll: true });
    return () => previousFocus?.focus?.({ preventScroll: true });
  }, []);
  useEffect(() => { if (selected) backRef.current?.focus({ preventScroll: true }); }, [selected?.id]);
  useEffect(() => {
    const chrome = [...document.querySelectorAll('.fixed.top-0.left-0.right-0, .fixed.bottom-0.left-0.right-0')];
    const measure = () => {
      const bounds = measureCollectionDock(chrome.map((node) => node.getBoundingClientRect()), window.innerHeight, window.innerWidth);
      rootRef.current?.style.setProperty('--collection-top', `${bounds.top}px`);
      rootRef.current?.style.setProperty('--collection-bottom', `${bounds.bottom}px`);
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    chrome.forEach((node) => observer?.observe(node));
    window.addEventListener('resize', measure);
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); };
  }, []);
  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (selected) back(); else onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });
  const moveGameFocus = (event) => {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const buttons = [...event.currentTarget.querySelectorAll('button')];
    const index = buttons.indexOf(document.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)));
    buttons[next]?.focus(); buttons[next]?.click();
  };

  return <motion.section ref={rootRef} id="player-achievement-collection" role="dialog" aria-label="Overall player achievement cards collection" className="player-collection-hud border-none" initial={{ opacity: 0, x: reducedMotion ? 0 : -35 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reducedMotion ? 0 : -35 }} transition={{ duration: 0.25 }}>
    <div className="player-collection-backdrop bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-transparent backdrop-blur-md" aria-hidden="true" />
    <header className="player-collection-header"><div><span className="player-collection-kicker">Player collection</span><h2>Achievement Cards</h2></div><button type="button" aria-label="Close Cards collection" onClick={onClose}><X size={21} /></button></header>
    <div className="player-collection-columns">
      <aside className="player-collection-games" aria-label="Games and filters">
        <div className="player-collection-search"><Search size={16} /><input ref={searchRef} aria-label="Search collection games" placeholder="Search your games" value={search} onChange={(event) => { setSearch(event.target.value); setCardId(null); setRarity('All tiers'); }} /></div>
        <div className="player-collection-select"><select aria-label="Filter collection by genre" value={genre} onChange={(event) => { setGenre(event.target.value); setCardId(null); setRarity('All tiers'); }}>{genres.map((value) => <option key={value}>{value}</option>)}</select><ChevronDown size={14} /></div>
        <div className="player-collection-games-label">Your games <span>{filteredGames.length}</span></div>
        <div className="player-collection-game-list flex flex-col overflow-y-auto" onKeyDown={moveGameFocus}>{filteredGames.map((item) => <button key={item.id} type="button" aria-pressed={game?.id === item.id} className={game?.id === item.id ? 'bg-cyan-500/10 border-l-2 border-cyan-400' : ''} onClick={() => { setGameId(item.id); setCardId(null); setRarity('All tiers'); }}>{item.image ? <img src={item.image} alt="" /> : <Gamepad2 size={24} />}<span><strong>{item.title}</strong><small>{item.genre} · {item.cards.length} cards</small></span></button>)}</div>
      </aside>
      <div aria-hidden="true" className="player-collection-divider bg-gradient-to-b from-transparent via-cyan-500/40 to-transparent w-[1px]" />
      <section className="player-collection-content" aria-label="Achievement collection">
        {!user?.id ? <div className="player-collection-empty"><Trophy /><h3>Your achievements live here</h3><p>Sign in to see your games and saved achievement cards.</p></div> : query.isPending ? <div className="player-collection-empty" role="status">Loading your collection…</div> : query.isError ? <div className="player-collection-empty" role="alert"><h3>Collection unavailable</h3><p>Your collection could not load.</p><button type="button" onClick={() => query.refetch()}>Try again</button></div> : !game ? <div className="player-collection-empty"><Trophy /><h3>{games.length ? 'No games match' : 'Your next achievement starts here'}</h3><p>{games.length ? 'Try another game name or genre.' : 'Saved achievements and collected cards will appear here.'}</p>{games.length > 0 && <button type="button" onClick={() => { setSearch(''); setGenre('All genres'); }}>Clear filters</button>}</div> : selected ? <CardInspector card={selected} onBack={back} backRef={backRef} /> : <>
          <div className="player-collection-grid-heading"><div><span className="player-collection-kicker">Overall achievement collection</span><h3>{game.title}</h3><p>{game.cards.length} saved cards · {game.cards.filter((card) => card.status === 'unlocked').length} unlocked</p></div><select aria-label="Filter cards by rarity" value={rarity} onChange={(event) => setRarity(event.target.value)}>{rarities.map((value) => <option key={value}>{value}</option>)}</select></div>
          <div ref={gridRef} className="player-collection-grid">{cards.map((card) => <button key={card.id} type="button" data-achievement-id={card.id} className="player-collection-card border-none" aria-label={`Inspect ${card.name}, ${card.rarity}`} onClick={() => { lastCardRef.current = card.id; setCardId(card.id); }} style={{ '--tier-color': rarityColor[card.rarity] || rarityColor.Common }}><div className="player-collection-card-art">{card.image ? <img src={card.image} alt="" loading="lazy" /> : <Trophy size={34} />}<div /><span>{card.rarity}</span></div><div className="player-collection-card-copy"><small>{card.category}</small><h4>{card.name}</h4><p>{statusLabel[card.status]}{card.percent !== null ? ` · ${Math.round(card.percent)}%` : ''}</p></div></button>)}</div>
          {!cards.length && <p className="player-collection-no-cards">{game.cards.length ? 'No cards match this tier.' : 'No achievements have been saved for this game yet.'}</p>}
        </>}
      </section>
    </div>
  </motion.section>;
}
