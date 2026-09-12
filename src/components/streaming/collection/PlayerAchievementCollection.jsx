import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, ChevronLeft, ChevronRight, Gamepad2, Search, Trophy, X } from 'lucide-react';
import usePlayerCollection from './usePlayerCollection';
import { filterCollectionGames, measureCollectionDock } from './playerCollectionModel';
import HolographicCard from './HolographicCard';
import CardShowcase from './CardShowcase';
import { moveRailFocus } from '../hub/DirectoryCards';
import './playerCollection.css';
import './cardShowcase.css';
import '../aura/auraOverlayShade.css';

export default function PlayerAchievementCollection({ user, onClose, publicView = false }) {
  const query = usePlayerCollection(user, { publicView });
  const games = query.data || [];
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('All genres');
  const [rarity, setRarity] = useState('All tiers');
  const [gameId, setGameId] = useState(null);
  const [cardId, setCardId] = useState(undefined);
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const gridRef = useRef(null);
  const lastCardRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const filteredGames = useMemo(() => filterCollectionGames(games, search, genre), [games, search, genre]);
  const game = filteredGames.find((item) => item.id === gameId) || filteredGames[0];
  const cards = (game?.cards || []).filter((card) => rarity === 'All tiers' || card.rarity === rarity);
  const selected = cardId === null ? null : cards.find((card) => card.id === cardId) || cards[0];
  const genres = ['All genres', ...new Set(games.map((item) => item.genre))];
  const rarities = ['All tiers', ...new Set((game?.cards || []).map((card) => card.rarity))];
  const back = () => { setCardId(null); requestAnimationFrame(() => { const buttons = [...(gridRef.current?.querySelectorAll('[data-achievement-id]') || [])]; const button = buttons.find((node) => node.dataset.achievementId === lastCardRef.current) || buttons[0]; button?.focus(); }); };

  useEffect(() => {
    const previousFocus = document.activeElement;
    searchRef.current?.focus({ preventScroll: true });
    return () => previousFocus?.focus?.({ preventScroll: true });
  }, []);
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
    <header className="player-collection-header"><div><span className="player-collection-kicker">{publicView ? 'Channel collection' : 'Player collection'}</span><h2>Achievement Cards</h2></div><button type="button" aria-label="Close Cards collection" onClick={onClose}><X size={21} /></button></header>
    <div className="player-collection-columns">
      <aside className="player-collection-games" aria-label="Games and filters">
        <div className="player-collection-search"><Search size={16} /><input ref={searchRef} aria-label="Search collection games" placeholder="Search your games" value={search} onChange={(event) => { setSearch(event.target.value); setCardId(undefined); setRarity('All tiers'); }} /></div>
        <div className="player-collection-select"><select aria-label="Filter collection by genre" value={genre} onChange={(event) => { setGenre(event.target.value); setCardId(undefined); setRarity('All tiers'); }}>{genres.map((value) => <option key={value}>{value}</option>)}</select><ChevronDown size={14} /></div>
        <div className="player-collection-games-label">Your games <span>{filteredGames.length}</span></div>
        <div className="player-collection-game-list flex flex-col overflow-y-auto" onKeyDown={moveGameFocus}>{filteredGames.map((item) => <button key={item.id} type="button" aria-pressed={game?.id === item.id} className={game?.id === item.id ? 'bg-cyan-500/10 border-l-2 border-cyan-400' : ''} onClick={() => { setGameId(item.id); setCardId(undefined); setRarity('All tiers'); }}>{item.image ? <img src={item.image} alt="" /> : <Gamepad2 size={24} />}<span><strong>{item.title}</strong><small>{item.genre} · {item.cards.length} cards</small></span></button>)}</div>
      </aside>
      <div aria-hidden="true" className="player-collection-divider bg-gradient-to-b from-transparent via-cyan-500/40 to-transparent w-[1px]" />
      <section className="player-collection-content" aria-label="Achievement collection">
        {!user?.id ? <div className="player-collection-empty"><Trophy /><h3>Your achievements live here</h3><p>Sign in to see your games and saved achievement cards.</p></div> : query.isPending ? <div className="player-collection-empty" role="status">Loading your collection…</div> : query.isError ? <div className="player-collection-empty" role="alert"><h3>Collection unavailable</h3><p>Your collection could not load.</p><button type="button" onClick={() => query.refetch()}>Try again</button></div> : !game ? <div className="player-collection-empty"><Trophy /><h3>{games.length ? 'No games match' : 'Your next achievement starts here'}</h3><p>{games.length ? 'Try another game name or genre.' : 'Saved achievements and collected cards will appear here.'}</p>{games.length > 0 && <button type="button" onClick={() => { setSearch(''); setGenre('All genres'); }}>Clear filters</button>}</div> : <>
          <div className="player-collection-grid-heading"><div><span className="player-collection-kicker">Overall achievement collection</span><h3>{game.title}</h3><p>{game.cards.length} saved cards · {game.cards.filter((card) => card.status === 'unlocked').length} unlocked</p></div><select aria-label="Filter cards by rarity" value={rarity} onChange={(event) => { setRarity(event.target.value); setCardId(undefined); }}>{rarities.map((value) => <option key={value}>{value}</option>)}</select></div>
          <div className="collection-reel-toolbar"><span>Choose a card to explore its skill or item</span><div><button type="button" aria-label="Previous achievement cards" onClick={() => gridRef.current?.scrollBy({ left: -400, behavior: reducedMotion ? 'auto' : 'smooth' })}><ChevronLeft size={16} /></button><button type="button" aria-label="Next achievement cards" onClick={() => gridRef.current?.scrollBy({ left: 400, behavior: reducedMotion ? 'auto' : 'smooth' })}><ChevronRight size={16} /></button></div></div>
          <div ref={gridRef} className="player-collection-reel" role="group" aria-label="Achievement cards reel" onKeyDown={(event) => { moveRailFocus(event); if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { const id = document.activeElement?.dataset.achievementId; if (id) { lastCardRef.current = id; setCardId(id); } } }}>{cards.map((card) => <HolographicCard key={card.id} card={card} selected={selected?.id === card.id} onSelect={(item) => { lastCardRef.current = item.id; setCardId(item.id); }} />)}</div>
          <div className="collection-horizontal-rule" aria-hidden="true" />
          {selected ? <CardShowcase card={selected} onBack={back} /> : cards.length > 0 && <div className="collection-select-hint"><Trophy size={24} /><h3>Select a card from the reel.</h3><p>Explore its unlock conditions, skill model, and gameplay demonstration.</p></div>}
          {!cards.length && <p className="player-collection-no-cards">{game.cards.length ? 'No cards match this tier.' : 'No achievements have been saved for this game yet.'}</p>}
        </>}
      </section>
    </div>
  </motion.section>;
}
