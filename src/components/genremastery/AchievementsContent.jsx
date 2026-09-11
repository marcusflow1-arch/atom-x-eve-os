import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Trophy } from 'lucide-react';
import CardEnhancementOverlay from '@/components/profile/CardEnhancementOverlay';
import CollectibleCard from './CollectibleCard';

export default function AchievementsContent({ genre, selectedGame, cards = [], isLoading, isError, onRetry }) {
  const [search, setSearch] = useState('');
  const [ownership, setOwnership] = useState('all');
  const [rarity, setRarity] = useState('all');
  const [selectedCard, setSelectedCard] = useState(null);
  const [visibleCount, setVisibleCount] = useState(48);
  const opener = useRef(null);
  const inspector = useRef(null);
  const filtered = useMemo(() => cards.filter((card) => `${card.title} ${card.series} ${card.group}`.toLowerCase().includes(search.toLowerCase()) && (rarity === 'all' || card.rarity === rarity) && (ownership === 'all' || (ownership === 'owned' ? card.isOwned : !card.isOwned))), [cards, search, rarity, ownership]);
  const close = () => { setSelectedCard(null); requestAnimationFrame(() => opener.current?.focus()); };
  useEffect(() => { setSelectedCard(null); setVisibleCount(48); }, [selectedGame?.id, genre.id]);
  useEffect(() => { setVisibleCount(48); }, [search, rarity, ownership]);
  useEffect(() => {
    if (!selectedCard) return;
    const element = inspector.current;
    const buttons = () => [...element.querySelectorAll('button, a[href], input, select, [tabindex="0"]')].filter((item) => !item.disabled);
    buttons()[0]?.focus();
    const keydown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
      if (event.key === 'Tab') {
        const items = buttons(); const first = items[0]; const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener('keydown', keydown, true);
    return () => window.removeEventListener('keydown', keydown, true);
  }, [selectedCard]);
  return <section className="cc-view cc-collection" aria-label="Achievement collection">
    <header className="cc-view-heading"><div><p className="cc-eyebrow">Your achievement collection</p><h1>{selectedGame?.title || `${genre.name} collection`}</h1><p>Records of your progress. Rewards worth keeping.</p></div><div className="cc-total"><strong>{cards.filter((card) => card.isOwned).length}<small> / {cards.length}</small></strong><span>Collected</span></div></header>
    <div className="cc-toolbar"><label className="cc-search"><Search size={15} /><input aria-label="Search achievement cards" placeholder="Find a card, skill, or item" value={search} onChange={(event) => setSearch(event.target.value)} /></label><div className="cc-segments" aria-label="Collection filters">{[['all', 'All cards'], ['owned', 'Collected'], ['locked', 'To unlock']].map(([id, label]) => <button key={id} aria-pressed={ownership === id} onClick={() => setOwnership(id)}>{label}</button>)}</div><label className="cc-select"><span className="sr-only">Card rarity</span><select aria-label="Card rarity" value={rarity} onChange={(event) => setRarity(event.target.value)}><option value="all">All rarities</option>{['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Unique'].map((tier) => <option key={tier}>{tier}</option>)}</select></label></div>
    <div className="cc-scroll">
      {isError && <div className="cc-notice" role="alert">Some cards could not be loaded. <button onClick={onRetry}>Try again</button></div>}
      {isLoading ? <div className="cc-empty" role="status">Loading your collection…</div> : filtered.length ? <><div className="cc-card-grid">{filtered.slice(0, visibleCount).map((card) => <CollectibleCard key={card.id} card={card} onSelect={(item) => { opener.current = document.activeElement; setSelectedCard(item); }} />)}</div>{filtered.length > visibleCount && <button className="cc-button cc-load-more" onClick={() => setVisibleCount((count) => count + 48)}>Show more cards</button>}</> : <div className="cc-empty"><Trophy /><h2>{cards.length ? 'No cards match these filters' : 'Your next achievement starts here'}</h2><p>{cards.length ? 'Try another name or rarity.' : 'Achievement cards for this game will appear here as they are added.'}</p>{cards.length > 0 && <button className="cc-button" onClick={() => { setSearch(''); setRarity('all'); setOwnership('all'); }}>Clear filters</button>}</div>}
    </div>
    {selectedCard && <div ref={inspector} className="cc-inspector" role="dialog" aria-modal="true" aria-label={`${selectedCard.title} card details`}><CardEnhancementOverlay card={selectedCard} onClose={close} /></div>}
  </section>;
}
