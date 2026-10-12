import { useEffect, useId, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Check, ChevronDown, Gamepad2, LayoutGrid, Lock, Plus, Volume2 } from 'lucide-react';
import useSkillBookLoadout from '@/components/luna/hooks/useSkillBookLoadout';
import { SKILL_KEYS } from '@/components/luna/skillSlots';
import { showError } from '@/components/error/ErrorToast';
import LibraryVoiceSearch from './gamehub/LibraryVoiceSearch';
import DashboardWindow, { focusDashboardWindow } from './windows/DashboardWindow';
import { SkillBookCrest } from './SkillBookOrnament';
import './luna-skill-book.css';

const normalize = value => String(value || '').trim().toLowerCase();
const compare = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare;
const baseGenres = ['Action', 'Adventure', 'RPG', 'Shooter', 'Strategy', 'Racing', 'Sports', 'Simulation', 'Puzzle'];
const gameName = skill => normalize(skill.game_name || 'Unknown Game');
const learned = skill => Boolean(skill.owned && skill.user_card_id && Number(skill.card?.quantity ?? 1) > 0);
const cardKey = skill => String(skill.user_card_id || skill.id);
const cardPayload = skill => ({
  ...(skill.card || {}), id: skill.user_card_id, user_card_id: skill.user_card_id,
  title: skill.title, card_name: skill.title,
  image: skill.image || skill.card?.card_image || '', card_image: skill.image || skill.card?.card_image || '',
  game_name: skill.game_name, rarity: skill.rarity, description: skill.description,
  card_type: 'Ability', type: 'ability', showcaseOnly: false,
  owned: true, can_equip: skill.can_equip, equip_error: skill.equip_error, selectionSource: 'skill-book',
});

export default function LunaCardsPanel({ slotDockRef }) {
  const { games, skills, slots, isLoading, isSaving, error, refetch } = useSkillBookLoadout();
  const [selectedGameKey, setSelectedGameKey] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('all');
  const [view, setView] = useState('games');
  const [ownership, setOwnership] = useState('all');
  const [rarity, setRarity] = useState('all');
  const [savedMessage, setSavedMessage] = useState('');
  const [prefabOpen, setPrefabOpen] = useState(true);
  const id = useId();
  // Real achievement catalog supplies unlearned cards; depleted inventory is never equipable.
  const catalog = useMemo(() => [...new Map((skills || [])
    .filter(skill => !skill.owned || learned(skill))
    .map(skill => [cardKey(skill), skill])).values()].sort((a, b) => compare(a.title || '', b.title || '')), [skills]);
  const chapters = useMemo(() => {
    const grouped = new Map();
    for (const skill of catalog) {
      const key = gameName(skill);
      if (!grouped.has(key)) {
        const game = (games || []).find(entry => normalize(entry.title) === key);
        grouped.set(key, { key, id: game?.id, title: game?.title || skill.game_name || 'Unknown Game',
          genre: game?.genre || skill.genre || 'Uncategorized', image: game?.image || '', cards: [] });
      }
      grouped.get(key).cards.push(skill);
    }
    return [...grouped.values()].sort((a, b) => compare(a.title, b.title));
  }, [games, catalog]);
  const genres = useMemo(() => [...new Set([...baseGenres, ...chapters.map(game => game.genre)].filter(Boolean))].sort(compare), [chapters]);
  const selectedGame = chapters.find(game => game.key === selectedGameKey);
  const selectedCard = catalog.find(card => cardKey(card) === selectedCardId);
  const equipped = useMemo(() => {
    const map = new Map();
    for (const slot of slots || []) {
      const key = slot.card?.user_card_id || slot.card?.id;
      if (key && SKILL_KEYS[slot.index]) map.set(String(key), [...(map.get(String(key)) || []), SKILL_KEYS[slot.index]]);
    }
    return map;
  }, [slots]);
  const needle = normalize(query);
  const matchesGenre = game => genre === 'all' || normalize(game.genre).includes(normalize(genre));
  const filteredGames = chapters.filter(game => matchesGenre(game) && (!needle || [game.title, game.genre, ...game.cards.map(card => card.title)].some(value => normalize(value).includes(needle))));
  const scope = (selectedGame ? [selectedGame] : chapters).filter(matchesGenre).flatMap(game => game.cards);
  const results = scope.filter(card => (!needle || [card.title, card.game_name, card.rarity, card.description].some(value => normalize(value).includes(needle))))
    .filter(card => ownership === 'all' || (ownership === 'learned' ? learned(card) : !learned(card)))
    .filter(card => rarity === 'all' || (card.rarity || 'Common') === rarity).sort((a, b) => compare(a.title, b.title));
  const rarities = [...new Set(scope.map(card => card.rarity || 'Common'))].sort(compare);
  const learnedCount = scope.filter(learned).length;
  const clearSelection = () => {
    setSelectedCardId(null);
    if (window.__lunaSelectedShowcaseCard?.selectionSource === 'skill-book') {
      window.__lunaSelectedShowcaseCard = null;
      window.dispatchEvent(new CustomEvent('lunaShowcaseCardSelected', { detail: { card: null } }));
    }
  };
  useEffect(() => {
    const selectionChanged = event => { if (!event.detail?.card) setSelectedCardId(null); };
    const placed = event => {
      if (event.detail?.card?.selectionSource !== 'skill-book') return;
      setSelectedCardId(null);
      setSavedMessage(`${event.detail.card.title} saved to skill ${SKILL_KEYS[event.detail.index]}.`);
    };
    window.addEventListener('lunaShowcaseCardPlaced', placed);
    window.addEventListener('lunaShowcaseCardSelected', selectionChanged);
    return () => {
      window.removeEventListener('lunaShowcaseCardPlaced', placed);
      window.removeEventListener('lunaShowcaseCardSelected', selectionChanged);
      if (window.__lunaSelectedShowcaseCard?.selectionSource === 'skill-book') {
        window.__lunaSelectedShowcaseCard = null;
        window.dispatchEvent(new CustomEvent('lunaShowcaseCardSelected', { detail: { card: null } }));
      }
    };
  }, []);
  useEffect(() => {
    if (selectedCardId && (!selectedCard || !learned(selectedCard) || selectedCard.can_equip === false)) clearSelection();
  }, [selectedCardId, selectedCard, selectedCard?.can_equip]);
  const showPrefab = () => { setPrefabOpen(true); focusDashboardWindow('skill-prefab'); };
  const selectCard = (skill, forceSelect = false) => {
    if (isSaving) return;
    if (!learned(skill) || skill.can_equip === false) {
      showError(skill.equip_error || skill.unlock_condition || 'Earn this ability through its game achievement to equip it.', 'Equip Skill');
      return;
    }
    if (!forceSelect && selectedCardId === cardKey(skill)) { clearSelection(); return; }
    const card = cardPayload(skill);
    setSelectedCardId(cardKey(skill)); setSavedMessage(''); showPrefab();
    window.__lunaSelectedShowcaseCard = card;
    window.dispatchEvent(new CustomEvent('lunaShowcaseCardSelected', { detail: { card } }));
  };
  const dragCard = (event, skill) => {
    if (isSaving || !learned(skill) || skill.can_equip === false || !event.dataTransfer) { event.preventDefault(); return; }
    showPrefab();
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('application/json', JSON.stringify({ source: 'luna-skill-book', user_card_id: skill.user_card_id, card: cardPayload(skill) }));
    event.dataTransfer.setData('text/plain', skill.title);
  };
  const openGame = game => { clearSelection(); setSelectedGameKey(game?.key || null); setQuery(''); setSavedMessage(''); setRarity('all'); };
  const resetFilters = () => { clearSelection(); setQuery(''); setGenre('all'); setOwnership('all'); setRarity('all'); setSelectedGameKey(null); };

  return <>
    <section className="luna-skill-book" data-luna-skill-book-open aria-label="Skill Book" aria-busy={isLoading || isSaving} onWheel={event => event.stopPropagation()}>
      <div className="lsb-controls">
        <LibraryVoiceSearch value={query} onChange={setQuery} subject="cards" label="Search Skill Book games and skills" placeholder="Search games, skills, or keywords…" VoiceIcon={Volume2}/>
        <label className="lsb-genre"><select aria-label="Skill Book genre" value={genre} onChange={event => { setGenre(event.target.value); openGame(null); }}>
          <option value="all">Genre · All</option>{genres.map(value => <option key={value} value={value}>{value}</option>)}
        </select><ChevronDown size={17} aria-hidden="true"/></label>
        <div className="lsb-view-switch" aria-label="Skill Book view">{['games', 'cards'].map(mode => <button key={mode} type="button" aria-pressed={view === mode} onClick={() => { setView(mode); if (mode === 'cards') setSelectedGameKey(null); }}>{mode === 'games' ? 'Games' : 'Cards'}</button>)}</div>
      </div>
      <div className="lsb-content" data-view={view}>
        {view === 'games' && <nav className="lsb-game-rail" aria-label="Skill Book games">
          <button type="button" className="lsb-all-games" aria-pressed={!selectedGame} onClick={() => openGame(null)}><LayoutGrid size={25}/><strong>All Games</strong><span>{chapters.length}</span></button>
          {filteredGames.map(game => <button type="button" className="lsb-game" key={game.key} aria-pressed={selectedGameKey === game.key} onClick={() => openGame(game)}>
            <span className="lsb-game-art">{game.image ? <img src={game.image} alt="" loading="lazy"/> : <Gamepad2 size={28}/>}</span>
            <span><strong>{game.title}</strong><small>{game.genre}</small></span><span className="lsb-game-count" title="Learned skills">{game.cards.filter(learned).length}</span>
          </button>)}
          {!filteredGames.length && !isLoading && <p className="lsb-rail-empty">No matching games.</p>}
          <p className="lsb-rail-note"><BookOpen size={17}/><span>Your achievements.<br/>Your abilities. Your story.</span></p>
        </nav>}
        <div className="lsb-main">
          <header className="lsb-game-banner">
            {selectedGame?.image && <img className="lsb-banner-art" src={selectedGame.image} alt=""/>}
            <SkillBookCrest prefab/>
            <div className="lsb-game-summary"><h2>{selectedGame?.title || 'Across Your Worlds'}</h2><span>{selectedGame?.genre || 'Your achievement skill collection'}</span><p>{selectedGame ? 'Earn achievements in this world. Bring their abilities into your own loadout.' : 'Discover skills from your games. Learn, combine, and make them your own.'}</p></div>
            <div className="lsb-game-progress"><span>{learnedCount} / {scope.length} Skills Learned</span><div role="progressbar" aria-label="Skills learned" aria-valuenow={learnedCount} aria-valuemin={0} aria-valuemax={Math.max(1, scope.length)}><i style={{width: `${scope.length ? learnedCount / scope.length * 100 : 0}%`}}/></div>
              {selectedGame?.id ? <a href={`/GameDetail?id=${encodeURIComponent(selectedGame.id)}`}>View Game <ArrowRight size={15}/></a> : <button type="button" onClick={showPrefab}>Skill Prefab <ArrowRight size={15}/></button>}
            </div>
          </header>
          <div className="lsb-filters">
            <div className="lsb-learned-tabs" aria-label="Skill ownership">{[['all','All'],['learned',`Learned (${learnedCount})`],['unlearned',`Unlearned (${scope.length - learnedCount})`]].map(([value, label]) => <button type="button" key={value} aria-pressed={ownership === value} onClick={() => setOwnership(value)}>{label}</button>)}</div>
            <select aria-label="Skill rarity" value={rarity} onChange={event => setRarity(event.target.value)}><option value="all">All rarities</option>{rarities.map(value => <option key={value}>{value}</option>)}</select>
          </div>
          <div className="lsb-results">
            {isLoading ? <p className="lsb-empty">Loading your skills…</p> : error ? <div className="lsb-empty" role="alert"><p>Your Skill Book could not load.</p><button type="button" onClick={() => refetch()}>Try again</button></div>
              : !results.length ? <div className="lsb-empty"><BookOpen size={35}/><p>{catalog.length ? 'No matches. Try another search or filter.' : 'Your game achievement skills will appear here.'}</p><button type="button" onClick={resetFilters}>Clear filters</button></div>
              : <div className="lsb-cards">{results.map((skill, index) => {
                const owned = learned(skill), blocked = !owned || skill.can_equip === false;
                const keys = equipped.get(String(skill.user_card_id));
                const damage = skill.progression?.combat?.effective_damage;
                const reasonId = `${id}-reason-${index}`;
                return <button type="button" className="lsb-card" key={cardKey(skill)} data-skill-card={cardKey(skill)} data-learned={owned}
                  draggable={!blocked && !isSaving} disabled={isSaving} aria-label={skill.title} aria-pressed={selectedCardId === cardKey(skill)} aria-disabled={blocked || undefined} aria-describedby={blocked ? reasonId : undefined}
                  onDragStart={event => dragCard(event, skill)} onClick={() => selectCard(skill)} onContextMenu={event => { event.preventDefault(); selectCard(skill, true); }}>
                  <span className="lsb-card-status">{owned ? <><Check size={12}/>Learned</> : <><Lock size={12}/>Not Learned</>}<span className="lsb-card-add">{blocked ? <Lock size={12}/> : <Plus size={14}/>}</span></span>
                  <span className="lsb-card-identity"><span className="lsb-card-art">{skill.image ? <img src={skill.image} alt="" draggable={false} loading="lazy"/> : <BookOpen size={29}/>}</span><span><strong>{skill.title}</strong><span className="lsb-card-tags"><span>{skill.rarity || 'Common'}</span>{skill.progression?.level != null && <span>Lv {skill.progression.level}</span>}</span></span></span>
                  <span className="lsb-card-description">{skill.description || skill.unlock_condition || `An ability from ${skill.game_name || 'your collection'}.`}</span>
                  {view === 'cards' && <small className="lsb-card-origin">{skill.game_name}</small>}
                  {damage != null && Number.isFinite(Number(damage)) && <small className="lsb-damage">{Math.round(Number(damage)).toLocaleString()} damage</small>}
                  {keys && <small className="lsb-equipped"><Check size={11}/> Equipped · {keys.join(', ')}</small>}
                  {blocked && <small id={reasonId} className="lsb-blocked">{owned ? skill.equip_error || 'Unavailable for this avatar.' : skill.unlock_condition || 'Unlock through its game achievement.'}</small>}
                </button>;
              })}</div>}
          </div>
        </div>
      </div>
      <footer className="lsb-footer"><p className="lsb-help" role="status" aria-live="polite">{isSaving ? 'Saving loadout…' : selectedCard ? `Choose a skill slot for ${selectedCard.title}. Click the card again to cancel.` : savedMessage || 'Choose a learned skill, then a slot. Your loadout saves automatically.'}</p><button type="button" onClick={showPrefab}>Skill Prefab <ArrowRight size={13}/></button></footer>
    </section>
    {prefabOpen && <DashboardWindow id="skill-prefab" title="Skill Prefab" subtitle="Create and equip your skill loadout." appearance="skillbook" anchor="skill-prefab" onClose={() => { clearSelection(); setPrefabOpen(false); }}>
      <div className="lsb-slot-dock" ref={slotDockRef}/>
    </DashboardWindow>}
  </>;
}
