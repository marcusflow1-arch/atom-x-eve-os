import { useEffect, useId, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Gamepad2, Lock, Volume2, X } from 'lucide-react';
import useSkillBookLoadout from '@/components/luna/hooks/useSkillBookLoadout';
import { SKILL_KEYS, SKILL_SLOT_COUNT } from '@/components/luna/skillSlots';
import { showError } from '@/components/error/ErrorToast';
import LibraryVoiceSearch from './gamehub/LibraryVoiceSearch';
import './luna-skill-book.css';

const normalize = value => String(value || '').trim().toLowerCase();
const compare = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare;
const baseGenres = ['Action', 'Adventure', 'RPG', 'Shooter', 'Strategy', 'Racing', 'Sports', 'Simulation', 'Puzzle'];
const gameName = skill => normalize(skill.game_name || 'Unknown Game');
const cardPayload = skill => ({
  ...(skill.card || {}),
  id: skill.user_card_id, user_card_id: skill.user_card_id,
  title: skill.title, card_name: skill.title,
  image: skill.image || skill.card?.card_image || '',
  card_image: skill.image || skill.card?.card_image || '',
  game_name: skill.game_name, rarity: skill.rarity,
  card_type: 'Ability', type: 'ability', showcaseOnly: false,
  owned: true, can_equip: skill.can_equip, selectionSource: 'skill-book',
});

export default function LunaCardsPanel({ onClose }) {
  const { games, skills, slots, isLoading, isSaving, error, refetch } = useSkillBookLoadout();
  const [selectedGameKey, setSelectedGameKey] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('all');
  const [savedMessage, setSavedMessage] = useState('');
  const id = useId();

  // Ownership, rather than the public achievement catalog, defines this book.
  // Unusable owned cards remain visible with the server's compatibility reason.
  const ownedCards = useMemo(() => [...new Map((skills || [])
    .filter(skill => skill.owned && skill.user_card_id && Number(skill.card?.quantity ?? 1) > 0)
    .map(skill => [String(skill.user_card_id), skill])).values()]
    .sort((a, b) => compare(a.title || '', b.title || '')), [skills]);
  const chapters = useMemo(() => {
    const grouped = new Map();
    for (const skill of ownedCards) {
      const key = gameName(skill);
      if (!grouped.has(key)) {
        const game = (games || []).find(entry => normalize(entry.title) === key);
        grouped.set(key, {
          key, title: game?.title || skill.game_name || 'Unknown Game',
          genre: game?.genre || skill.genre || 'Uncategorized', image: game?.image || '', cards: [],
        });
      }
      grouped.get(key).cards.push(skill);
    }
    return [...grouped.values()].sort((a, b) => compare(a.title, b.title));
  }, [games, ownedCards]);
  const genres = useMemo(() => [...new Set([...baseGenres, ...chapters.map(game => game.genre)].filter(Boolean))]
    .sort(compare), [chapters]);
  const selectedGame = chapters.find(game => game.key === selectedGameKey);
  const selectedCard = ownedCards.find(card => String(card.user_card_id) === selectedCardId);
  const equipped = useMemo(() => {
    const map = new Map();
    for (const slot of slots || []) {
      const key = slot.card?.user_card_id || slot.card?.id;
      if (key && SKILL_KEYS[slot.index]) map.set(String(key), [...(map.get(String(key)) || []), SKILL_KEYS[slot.index]]);
    }
    return map;
  }, [slots]);
  const needle = normalize(query);
  const results = selectedGame
    ? selectedGame.cards.filter(card => [card.title, card.rarity, card.description].some(value => normalize(value).includes(needle)))
    : chapters.filter(game => (genre === 'all' || normalize(game.genre).includes(normalize(genre)))
      && (!needle || [game.title, game.genre, ...game.cards.map(card => card.title)].some(value => normalize(value).includes(needle))));
  const clearSelection = () => {
    setSelectedCardId(null);
    if (window.__lunaSelectedShowcaseCard?.selectionSource === 'skill-book') {
      window.__lunaSelectedShowcaseCard = null;
      window.dispatchEvent(new CustomEvent('lunaShowcaseCardSelected', { detail: { card: null } }));
    }
  };
  useEffect(() => {
    const placed = event => {
      if (event.detail?.card?.selectionSource !== 'skill-book') return;
      setSelectedCardId(null);
      setSavedMessage(`${event.detail.card.title} saved to skill ${SKILL_KEYS[event.detail.index]}.`);
    };
    window.addEventListener('lunaShowcaseCardPlaced', placed);
    return () => {
      window.removeEventListener('lunaShowcaseCardPlaced', placed);
      if (window.__lunaSelectedShowcaseCard?.selectionSource === 'skill-book') {
        window.__lunaSelectedShowcaseCard = null;
        window.dispatchEvent(new CustomEvent('lunaShowcaseCardSelected', { detail: { card: null } }));
      }
    };
  }, []);
  useEffect(() => {
    // A body switch or trade can make a previously selected card unavailable.
    if (selectedCardId && (!selectedCard || selectedCard.can_equip === false)) clearSelection();
  }, [selectedCardId, selectedCard?.can_equip]);

  const selectCard = skill => {
    if (isSaving) return;
    if (skill.can_equip === false) {
      showError(skill.equip_error || 'This card is unavailable for your current avatar.', 'Equip Skill');
      return;
    }
    if (selectedCardId === String(skill.user_card_id)) { clearSelection(); return; }
    const card = cardPayload(skill);
    setSelectedCardId(String(skill.user_card_id)); setSavedMessage('');
    window.__lunaSelectedShowcaseCard = card;
    window.dispatchEvent(new CustomEvent('lunaShowcaseCardSelected', { detail: { card } }));
  };
  const dragCard = (event, skill) => {
    if (isSaving || skill.can_equip === false || !event.dataTransfer) { event.preventDefault(); return; }
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('application/json', JSON.stringify({
      source: 'luna-skill-book', user_card_id: skill.user_card_id, card: cardPayload(skill),
    }));
    event.dataTransfer.setData('text/plain', skill.title);
  };
  const openGame = game => { clearSelection(); setSelectedGameKey(game.key); setQuery(''); setSavedMessage(''); };
  const goBack = () => { clearSelection(); setSelectedGameKey(null); setQuery(''); setSavedMessage(''); };

  return <section className="luna-skill-book" aria-label="Skill Book" aria-busy={isLoading || isSaving}
    onWheel={event => event.stopPropagation()}>
    <header className="lsb-heading">
      <h2><BookOpen size={16} aria-hidden="true" /> Skill Book</h2>
      <span>{(slots || []).filter(slot => slot.card).length} / {SKILL_SLOT_COUNT} equipped</span>
      {onClose && <button type="button" aria-label="Close Skill Book" onClick={onClose}><X size={17} /></button>}
    </header>
    <div className="lsb-controls">
      <LibraryVoiceSearch value={query} onChange={setQuery} subject={selectedGame ? 'cards' : 'games'}
        label={selectedGame ? 'Search Skill Book cards' : 'Search Skill Book games'} placeholder="Search" VoiceIcon={Volume2} />
      <label className="lsb-genre"><span>Genre</span><select aria-label="Skill Book genre" value={genre}
        onChange={event => { setGenre(event.target.value); goBack(); }}>
        <option value="all">All genres</option>
        {genres.map(value => <option key={value} value={value}>{value}</option>)}
      </select></label>
    </div>
    <div className="lsb-path">
      {selectedGame
        ? <><button type="button" onClick={goBack}><ArrowLeft size={13} /> Games</button><span>/</span><h3>{selectedGame.title}</h3></>
        : <h3>Your games</h3>}
      <span className="lsb-count">{results.length} {selectedGame ? 'cards' : 'games'}</span>
    </div>
    <p className="lsb-help" role="status" aria-live="polite">
      {isSaving ? 'Saving loadout…' : selectedCard ? `Choose a skill slot for ${selectedCard.title}. Click the card again to cancel.`
        : savedMessage || 'Drag a card onto a skill slot below. Changes save automatically.'}
    </p>
    <div className="lsb-results">
      {isLoading ? <p className="lsb-empty">Loading your cards…</p>
        : error ? <div className="lsb-empty" role="alert"><p>Your Skill Book could not load.</p><button onClick={() => refetch()}>Try again</button></div>
        : !results.length ? <div className="lsb-empty">
          <p>{ownedCards.length ? 'No matches. Try another search or genre.' : 'Your earned ability cards will appear here, grouped by game.'}</p>
          {(query || genre !== 'all') && <button onClick={() => { setQuery(''); setGenre('all'); }}>Clear filters</button>}
        </div>
        : selectedGame ? <div className="lsb-cards">
          {results.map((skill, index) => {
            const blocked = skill.can_equip === false;
            const keys = equipped.get(String(skill.user_card_id));
            const damage = skill.progression?.combat?.effective_damage;
            const reasonId = `${id}-reason-${index}`;
            return <button type="button" className="lsb-card" key={skill.user_card_id}
              data-skill-card={skill.user_card_id} draggable={!blocked && !isSaving} disabled={isSaving}
              aria-label={skill.title} aria-pressed={selectedCardId === String(skill.user_card_id)}
              aria-disabled={blocked || undefined} aria-describedby={blocked ? reasonId : undefined}
              onDragStart={event => dragCard(event, skill)} onClick={() => selectCard(skill)}>
              <span className="lsb-card-art">
                {skill.image ? <img src={skill.image} alt="" draggable={false} loading="lazy" /> : <BookOpen size={25} />}
                <span className="lsb-rarity">{skill.rarity || 'Common'}</span>
                {keys && <span className="lsb-equipped"><Check size={11} /> Skill {keys.join(', ')}</span>}
              </span>
              <strong>{skill.title}</strong>
              {damage != null && Number.isFinite(Number(damage)) && <small>{Math.round(Number(damage)).toLocaleString()} damage</small>}
              {blocked && <small id={reasonId} className="lsb-blocked"><Lock size={11} />{skill.equip_error || 'Unavailable for this avatar.'}</small>}
            </button>;
          })}
        </div> : <div className="lsb-games">
          {results.map(game => <button type="button" className="lsb-game" key={game.key} onClick={() => openGame(game)}>
            <span className="lsb-game-art">{game.image ? <img src={game.image} alt="" loading="lazy" /> : <Gamepad2 size={20} />}</span>
            <span><strong>{game.title}</strong><small>{game.genre} · {game.cards.length} owned {game.cards.length === 1 ? 'card' : 'cards'}</small></span>
            <ArrowRight size={15} aria-hidden="true" />
          </button>)}
        </div>}
    </div>
  </section>;
}
