import { useEffect, useMemo, useState } from 'react';
import { Crosshair, Globe, Rocket, Crown, Swords, Map, Ghost, Monitor, Search, Layers, Store, ArrowLeftRight, Gamepad2, X, Brain, Trophy, Navigation, Shield } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import GlassPageFrame from '@/components/shared/GlassPageFrame';
import { useSidebarVisible } from '../hooks/useSidebarVisible';
import SidebarOverlays from '@/components/dashboard/SidebarOverlays';
import GenreGameDetail from '@/components/genremastery/GenreGameDetail';
import SkillTreeContent from '@/components/genremastery/CardsSkillTree';
import AchievementsContent from '@/components/genremastery/AchievementsContent';
import GenreBottomNav from '@/components/genremastery/GenreBottomNav';
import CardsHome from '@/components/genremastery/CardsHome';
import CardsExchange from '@/components/genremastery/CardsExchange';
import { CardArtwork } from '@/components/genremastery/CollectibleCard';
import useCardsCatalog from '@/components/genremastery/useCardsCatalog';
import { gameMatchesGenre, readCardPages } from '@/components/genremastery/cardsCatalog';
import '@/components/genremastery/cardsConsole.css';

// These IDs intentionally match the genreSkillTree backend catalog. The visible
// navigation can grow without changing the skill runtime contract.
const GENRES = [
  { id: 'shooter', name: 'Shooter', short: 'FPS', icon: Crosshair, color: 'from-emerald-500 to-green-600', accent: 'text-emerald-400', xpType: 'Aim XP', level: 1, maxLevel: 50, rank: 'Recruit', xp: 0, skillPoints: 0, matchGenres: ['shooter', 'shooting', 'fps'] },
  { id: 'action', name: 'Action', short: 'ACT', icon: Swords, color: 'from-red-500 to-rose-600', accent: 'text-red-400', xpType: 'Combat XP', level: 1, maxLevel: 50, rank: 'Fighter', xp: 0, skillPoints: 0, matchGenres: ['action'] },
  { id: 'fighting', name: 'Fighting', short: 'FGT', icon: Swords, color: 'from-orange-500 to-red-600', accent: 'text-orange-400', xpType: 'Duel XP', level: 1, maxLevel: 50, rank: 'Challenger', xp: 0, skillPoints: 0, matchGenres: ['fighting'] },
  { id: 'rpg', name: 'RPG', short: 'RPG', icon: Crown, color: 'from-purple-500 to-fuchsia-600', accent: 'text-purple-400', xpType: 'Adventure XP', level: 1, maxLevel: 50, rank: 'Adventurer', xp: 0, skillPoints: 0, matchGenres: ['rpg', 'fantasy'] },
  { id: 'mmorpg', name: 'MMORPG', short: 'MMO', icon: Globe, color: 'from-violet-500 to-indigo-600', accent: 'text-violet-400', xpType: 'Social XP', level: 1, maxLevel: 50, rank: 'Initiate', xp: 0, skillPoints: 0, matchGenres: ['mmo', 'mmorpg'] },
  { id: 'adventure', name: 'Adventure', short: 'ADV', icon: Map, color: 'from-yellow-400 to-orange-400', accent: 'text-yellow-400', xpType: 'Discovery XP', level: 1, maxLevel: 50, rank: 'Explorer', xp: 0, skillPoints: 0, matchGenres: ['adventure'] },
  { id: 'scifi', name: 'Sci-Fi', short: 'SCI', icon: Rocket, color: 'from-cyan-500 to-blue-600', accent: 'text-cyan-400', xpType: 'Tech XP', level: 1, maxLevel: 50, rank: 'Pilot', xp: 0, skillPoints: 0, matchGenres: ['sci-fi', 'scifi', 'sci_fi'] },
  { id: 'strategy', name: 'Strategy', short: 'STR', icon: Brain, color: 'from-blue-500 to-indigo-600', accent: 'text-blue-400', xpType: 'Command XP', level: 1, maxLevel: 50, rank: 'Tactician', xp: 0, skillPoints: 0, matchGenres: ['strategy'] },
  { id: 'simulation', name: 'Simulation', short: 'SIM', icon: Monitor, color: 'from-indigo-400 to-violet-500', accent: 'text-indigo-300', xpType: 'Logic XP', level: 1, maxLevel: 50, rank: 'Operator', xp: 0, skillPoints: 0, matchGenres: ['simulation'] },
  { id: 'sports', name: 'Sports', short: 'SPT', icon: Trophy, color: 'from-green-400 to-emerald-600', accent: 'text-green-400', xpType: 'Athlete XP', level: 1, maxLevel: 50, rank: 'Prospect', xp: 0, skillPoints: 0, matchGenres: ['sports'] },
  { id: 'racing', name: 'Racing', short: 'RAC', icon: Navigation, color: 'from-orange-400 to-amber-600', accent: 'text-orange-400', xpType: 'Driver XP', level: 1, maxLevel: 50, rank: 'Rookie', xp: 0, skillPoints: 0, matchGenres: ['racing'] },
  { id: 'puzzle', name: 'Puzzle', short: 'PUZ', icon: Search, color: 'from-pink-400 to-fuchsia-600', accent: 'text-pink-400', xpType: 'Insight XP', level: 1, maxLevel: 50, rank: 'Solver', xp: 0, skillPoints: 0, matchGenres: ['puzzle'] },
  { id: 'platformer', name: 'Platformer', short: 'PLT', icon: Layers, color: 'from-teal-400 to-cyan-600', accent: 'text-teal-400', xpType: 'Movement XP', level: 1, maxLevel: 50, rank: 'Runner', xp: 0, skillPoints: 0, matchGenres: ['platformer'] },
  { id: 'horror', name: 'Horror', short: 'HOR', icon: Ghost, color: 'from-slate-600 to-gray-900', accent: 'text-slate-300', xpType: 'Nerve XP', level: 1, maxLevel: 50, rank: 'Witness', xp: 0, skillPoints: 0, matchGenres: ['horror'] },
  { id: 'survival', name: 'Survival', short: 'SUR', icon: Shield, color: 'from-lime-500 to-green-700', accent: 'text-lime-400', xpType: 'Survival XP', level: 1, maxLevel: 50, rank: 'Survivor', xp: 0, skillPoints: 0, matchGenres: ['survival'] },
  { id: 'sandbox', name: 'Sandbox', short: 'SBX', icon: Gamepad2, color: 'from-sky-400 to-blue-600', accent: 'text-sky-400', xpType: 'Freedom XP', level: 1, maxLevel: 50, rank: 'Creator', xp: 0, skillPoints: 0, matchGenres: ['sandbox', 'open_world'] },
];

export default function GenreMastery({ onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameSearch, setGameSearch] = useState('');
  const [mobileGames, setMobileGames] = useState(false);
  const [rightPanel, setRightPanel] = useState('games');
  const [marketView, setMarketView] = useState('cards');
  const [sidebarVisible, toggleSidebar] = useSidebarVisible();
  const gamesQuery = useQuery({ queryKey: ['games-for-genre-mastery'], queryFn: () => readCardPages((limit, skip) => base44.entities.Game.list('-created_date', limit, skip)), staleTime: 60000 });
  const allGames = gamesQuery.data || [];
  const catalog = useCardsCatalog(allGames);
  const genreGames = useMemo(() => allGames.filter((game) => gameMatchesGenre(game, selectedGenre)), [allGames, selectedGenre]);
  const visibleGames = useMemo(() => genreGames.filter((game) => String(game.title || '').toLowerCase().includes(gameSearch.toLowerCase())), [genreGames, gameSearch]);
  const genreCards = useMemo(() => { const ids = new Set(genreGames.map((game) => game.id)); return catalog.cards.filter((card) => ids.has(card.gameId)); }, [catalog.cards, genreGames]);
  const cards = useMemo(() => selectedGame ? genreCards.filter((card) => card.gameId === selectedGame.id) : genreCards, [genreCards, selectedGame]);
  const selectView = (view) => {
    if (view === 'blackmarket' || view === 'tradingpost') setMarketView(view);
    else { setMarketView('cards'); setRightPanel(view); }
    setMobileGames(false);
  };
  const selectGame = (game) => { setSelectedGame(game); setMobileGames(false); if (rightPanel === 'skilltree') setRightPanel('games'); };
  useEffect(() => {
    const mode = new URLSearchParams(location.search).get('mode');
    setMarketView(mode === 'blackmarket' || mode === 'tradingpost' ? mode : 'cards');
    setRightPanel(mode === 'achievements' || mode === 'skilltree' ? mode : 'games');
  }, [location.search]);
  useEffect(() => {
    const escape = (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('[data-card-overlay="true"], .cc-exchange-dialog')) return;
      if (mobileGames) { setMobileGames(false); return; }
      if (marketView !== 'cards') { setMarketView('cards'); return; }
      if (onClose) onClose(); else navigate(createPageUrl('LunaTemplate'));
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [onClose, navigate, marketView, mobileGames]);
  return <GlassPageFrame className="cards-console-frame" sidebarVisible={sidebarVisible} onSidebarToggle={toggleSidebar} bottomContent={<GenreBottomNav activeTab={rightPanel} marketView={marketView} onTabSelect={selectView} />}>
    <main className="cards-console" data-market={marketView}>
      <header className="cc-topbar"><button className="cc-brand" onClick={() => { selectView('games'); setSelectedGame(null); }} aria-label="Cards home"><Layers size={23} strokeWidth={1.3} /><span>Cards<small>Collection & exchange</small></span></button><nav className="cc-genres" aria-label="Game genres">{GENRES.map((genre) => <button key={genre.id} aria-pressed={genre.id === selectedGenre.id} onClick={() => { setSelectedGenre(genre); setSelectedGame(null); setGameSearch(''); }}><genre.icon size={14} /><span>{genre.name}</span></button>)}</nav><nav className="cc-market-nav" aria-label="Card exchanges"><button aria-pressed={marketView === 'blackmarket'} onClick={() => selectView(marketView === 'blackmarket' ? rightPanel : 'blackmarket')}><Store size={16} />Black Market</button><button aria-pressed={marketView === 'tradingpost'} onClick={() => selectView(marketView === 'tradingpost' ? rightPanel : 'tradingpost')}><ArrowLeftRight size={16} />Trading Post</button></nav></header>
      <button className="cc-mobile-games cc-button" aria-expanded={mobileGames} aria-controls="cc-game-library" onClick={() => setMobileGames(!mobileGames)}><Gamepad2 size={16} />{selectedGame?.title || `${selectedGenre.name} game library`} <span>{mobileGames ? 'Close' : 'Change'}</span></button>
      <div className="cc-workspace">
        <aside id="cc-game-library" className="cc-library" data-mobile-open={mobileGames} aria-label="Game library"><div className="cc-library-heading"><span className="cc-eyebrow">Game library</span><span>{genreGames.length}</span></div><label className="cc-search"><Search size={14} /><input aria-label="Search games" placeholder="Search games" value={gameSearch} onChange={(event) => setGameSearch(event.target.value)} />{gameSearch && <button onClick={() => setGameSearch('')} aria-label="Clear game search"><X size={13} /></button>}</label><div className="cc-game-list"><button className="cc-all-games" aria-pressed={!selectedGame} onClick={() => selectGame(null)}><Layers size={16} /><span>All {selectedGenre.name} games</span></button>{gamesQuery.isLoading ? <p role="status" className="cc-library-note">Loading games…</p> : visibleGames.map((game) => <button key={game.id} className="cc-game-link" aria-pressed={selectedGame?.id === game.id} onClick={() => selectGame(game)}><CardArtwork src={game.cover_image || game.cover} /><span><strong>{game.title}</strong><small>{genreCards.filter((card) => card.gameId === game.id).length} cards</small></span></button>)}{!gamesQuery.isLoading && !visibleGames.length && <p className="cc-library-note">{gameSearch ? 'No games match your search.' : 'No games in this genre yet.'}</p>}{gamesQuery.isError && <button className="cc-button" onClick={() => gamesQuery.refetch()}>Retry games</button>}</div><div className="cc-library-footer"><selectedGenre.icon size={19} /><div><strong>{selectedGenre.name} mastery</strong><span>Account-wide genre perks</span></div></div></aside>
        <div className="cc-content">
          {marketView !== 'cards' ? <CardsExchange key={`${marketView}:${selectedGenre.id}:${selectedGame?.id || 'all'}`} mode={marketView} selectedGame={selectedGame} games={genreGames} cards={cards} user={catalog.user} /> : rightPanel === 'achievements' ? <AchievementsContent genre={selectedGenre} selectedGame={selectedGame} cards={cards} isLoading={catalog.isLoading} isError={catalog.isError} onRetry={catalog.retry} /> : rightPanel === 'skilltree' ? <SkillTreeContent key={selectedGenre.id} genre={selectedGenre} /> : selectedGame ? <div className="cc-game-detail"><GenreGameDetail game={selectedGame} genre={selectedGenre} onClose={() => setSelectedGame(null)} /></div> : <CardsHome genre={selectedGenre} games={genreGames} cards={genreCards} onGameSelect={selectGame} onViewSelect={selectView} isLoading={gamesQuery.isLoading} isError={gamesQuery.isError} onRetry={() => gamesQuery.refetch()} />}
        </div>
      </div>
      <SidebarOverlays className="absolute top-0 left-0 right-0 bottom-0 z-[80]" />
    </main>
  </GlassPageFrame>;
}
