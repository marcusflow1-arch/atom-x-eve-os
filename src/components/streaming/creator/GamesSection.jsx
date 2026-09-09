import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Maximize2, Minimize2, Search, Mic, Gamepad2, Vote, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import useStreamGameVote from './useStreamGameVote';
import GameAchievementCardsRow from './GameAchievementCardsRow';

const FALLBACK_GAMES = [
  { title: 'The Elder Scrolls', genre: 'Fantasy', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/306130/header.jpg', description: 'Explore Tamriel, discover ancient stories, and revisit the adventures that shaped the channel.' },
  { title: 'SMITE 2', genre: 'MOBA', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2687550/header.jpg', description: 'Mythic battles, ranked matches, and favorite gods from the current streaming rotation.' },
  { title: 'Fallout', genre: 'RPG', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/377160/header.jpg', description: 'Post-apocalyptic exploration, quests, builds, and memorable wasteland sessions.' },
  { title: 'Cyberpunk 2077', genre: 'Action RPG', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg', description: 'Night City builds, story runs, side missions, and high-intensity stream moments.' },
  { title: 'Destiny 2', genre: 'Shooter', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1085660/header.jpg', description: 'Guardians, raids, seasonal progression, and competitive sessions from the channel.' },
  { title: 'Call of Duty', genre: 'Shooter', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200', description: 'Fast matches, loadout testing, and competitive multiplayer sessions.' },
  { title: 'Fortnite', genre: 'Action', image: 'https://images.unsplash.com/photo-1603481546238-487240415921?w=1200', description: 'Battle royale runs, challenges, and community games.' },
  { title: 'Rocket League', genre: 'Sports', image: 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=1200', description: 'Ranked matches, mechanics practice, and competitive highlights.' },
  { title: 'Elden Ring', genre: 'Action RPG', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg', description: 'Bosses, builds, and exploration through the Lands Between.' },
  { title: "Baldur's Gate 3", genre: 'RPG', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/header.jpg', description: 'Story runs, party experiments, and memorable campaign sessions.' },
  { title: 'Starfield', genre: 'Sci-Fi', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1716740/header.jpg', description: 'Space exploration, shipbuilding, and constellation missions.' },
  { title: 'Hogwarts Legacy', genre: 'Fantasy', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/990080/header.jpg', description: 'Spell mastery, magical creatures, and castle secrets.' },
  { title: 'Apex Legends', genre: 'Shooter', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1172470/header.jpg', description: 'Squad matches, legend rotations, and ranked climbs.' },
  { title: 'The Witcher 3', genre: 'RPG', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/292030/header.jpg', description: 'Monster contracts, Gwent sessions, and story quests.' },
];

const GENRES = ['All', 'MMORPG', 'RPG', 'Action RPG', 'MOBA', 'Shooter', 'Fantasy', 'Action', 'Sports'];

// Two blended overlays living inside the streaming box itself:
// achievement cards anchored to the top (~40% of the box), games rail anchored to the bottom (~30%),
// each spanning the full width of the box so they read as part of the stream UI.
export default function GamesSection({ isEditMode, pinnedGames = [], onUpdateGames, onClose }) {
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('All');
  const [selectedGame, setSelectedGame] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);
  const [voiceListening, setVoiceListening] = useState(false);
  const gamesRailRef = useRef(null);
  const { user } = useAuth();
  const vote = useStreamGameVote(user?.id);

  const { data: libraryGames = [] } = useQuery({
    queryKey: ['libraryGames'],
    queryFn: () => base44.entities.Game.list(),
  });

  const games = useMemo(() => {
    const source = pinnedGames.length ? pinnedGames : FALLBACK_GAMES.map((game) => game.title);
    return source.map((entry) => {
      if (typeof entry === 'object') return entry;
      return FALLBACK_GAMES.find((game) => game.title === entry) || {
        title: entry,
        genre: 'Game',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200',
        description: `A game played on this channel. Browse the channel history and featured sessions for ${entry}.`,
      };
    });
  }, [pinnedGames]);

  const filteredGames = useMemo(() => games.filter((game) => {
    const matchesGenre = genre === 'All' || game.genre === genre;
    const matchesSearch = !search.trim() || game.title.toLowerCase().includes(search.trim().toLowerCase());
    return matchesGenre && matchesSearch;
  }), [games, genre, search]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    setPortalTarget(document.querySelector('[data-stream-player-box="true"]'));
    const observer = new MutationObserver(() => setPortalTarget(document.querySelector('[data-stream-player-box="true"]')));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!selectedGame && filteredGames.length) setSelectedGame(filteredGames[0]);
    if (selectedGame && !filteredGames.some((game) => game.title === selectedGame.title)) setSelectedGame(filteredGames[0] || null);
  }, [filteredGames, selectedGame]);

  useEffect(() => {
    if (!fullscreen) return undefined;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [fullscreen]);

  useEffect(() => {
    if (!voiceListening || typeof window === 'undefined') return undefined;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceListening(false);
      return undefined;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => setSearch(event.results?.[0]?.[0].transcript || '');
    recognition.onend = () => setVoiceListening(false);
    recognition.onerror = () => setVoiceListening(false);
    recognition.start();
    return () => { try { recognition.stop(); } catch {} };
  }, [voiceListening]);

  // Wheel over the games rail scrolls it left/right (up = right, down = left), like the Gallery.
  // The rail mounts into the streaming box after the portal target resolves, so resolve it lazily.
  useEffect(() => {
    const onWheel = (event) => {
      const rail = gamesRailRef.current;
      if (!rail || !(event.target instanceof Node) || !rail.contains(event.target)) return;
      event.preventDefault();
      rail.scrollLeft += event.deltaX - event.deltaY;
    };
    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    return () => window.removeEventListener('wheel', onWheel, { capture: true });
  }, []);

  // A / D keys navigate the games rail horizontally, like the Gallery.
  useEffect(() => {
    const onKey = (event) => {
      if (!['a', 'A', 'd', 'D'].includes(event.key) || event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target?.isContentEditable) return;
      event.preventDefault();
      gamesRailRef.current?.scrollBy({ left: event.key.toLowerCase() === 'd' ? 440 : -440, behavior: 'smooth' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleAddGame = (gameTitle) => {
    if (!pinnedGames.includes(gameTitle)) onUpdateGames?.([...pinnedGames, gameTitle]);
    setShowPicker(false);
  };

  const headerNode = (
    <div className="flex items-center justify-between gap-4 shrink-0 pb-2.5">
      <div className="min-w-0 flex items-center gap-3">
        <Gamepad2 className="w-[18px] h-[18px] text-cyan-300/80 shrink-0" />
        <div className="min-w-0">
          <div className="text-[9px] uppercase tracking-[0.3em] text-cyan-300/60">Games Played</div>
          <h3 className="text-base md:text-lg font-bold text-white truncate">Channel Game Library</h3>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isEditMode && <Button size="sm" className="h-7 rounded-full bg-white/10 border border-white/10 text-white hover:bg-white/20" onClick={() => setShowPicker(true)}>Add Game</Button>}
        {vote.isHost && !vote.session && <Button size="sm" className="h-7 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/30 hover:text-white" onClick={vote.startVote} disabled={vote.busy}>Start Audience Vote</Button>}
        {vote.isHost && vote.session && <Button size="sm" className="h-7 rounded-full bg-white/10 border border-white/15 text-white/80 hover:bg-white/20" onClick={vote.endVote} disabled={vote.busy}>End Vote</Button>}
        <button type="button" onClick={() => setFullscreen((value) => !value)} className="h-8 w-8 rounded-full flex items-center justify-center bg-white/[0.06] border border-white/10 hover:bg-white/[0.13] text-white/70 hover:text-white" aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}>
          {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
        {onClose && <button type="button" onClick={onClose} className="h-8 w-8 rounded-full flex items-center justify-center bg-white/[0.06] border border-white/10 hover:bg-white/[0.13] text-white/70 hover:text-white" aria-label="Close Games"><X className="w-4 h-4" /></button>}
      </div>
    </div>
  );

  const voteBannerNode = vote.session && (
    <div className="flex shrink-0 items-center gap-3 px-3 py-1.5 rounded-md border border-cyan-300/25 bg-cyan-300/[0.06]">
      <Vote className="w-4 h-4 text-cyan-300 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-white truncate">{vote.isHost ? 'Audience voting is live — viewers are picking your next game' : 'Vote open — pick the game you want to watch next'}</div>
        <div className="text-[9px] uppercase tracking-widest text-cyan-200/60 mt-0.5">{vote.totalVotes} vote{vote.totalVotes === 1 ? '' : 's'}{vote.myBallot ? ` · you voted ${vote.myBallot.game_name}` : ''}</div>
      </div>
    </div>
  );

  const achievementsNode = (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-4 shrink-0 pb-1 pt-2">
        <div className="min-w-0">
          <div className="text-[9px] uppercase tracking-[0.28em] text-white/35">Achievement Cards</div>
          <div className="text-sm font-semibold text-white/85 truncate">{selectedGame ? selectedGame.title : 'Select a game below'}</div>
        </div>
        <div className="text-[9px] uppercase tracking-[0.2em] text-white/25 shrink-0">Collected achievements &amp; trading cards</div>
      </div>
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden scrollbar-hide">
        {selectedGame
          ? <GameAchievementCardsRow key={selectedGame.title} game={selectedGame} />
          : <div className="h-full flex items-center text-sm text-white/35">No games match your search.</div>}
      </div>
    </div>
  );

  const gamesNode = (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="flex items-center gap-4 shrink-0 pb-1.5">
        <div className="flex-1 min-w-0 flex items-center gap-4 overflow-x-auto scrollbar-hide">
          {GENRES.map((item) => <button key={item} type="button" onClick={() => setGenre(item)} className={`shrink-0 text-[10px] uppercase tracking-[0.16em] pb-1 border-b-2 transition-colors ${genre === item ? 'text-white border-cyan-300' : 'text-white/35 border-transparent hover:text-white/75'}`}>{item}</button>)}
        </div>
        <div className="relative shrink-0 flex items-center w-44">
          <Search className="w-3.5 h-3.5 text-white/35 mr-2 shrink-0" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="w-full bg-transparent border-0 border-b border-white/20 focus:border-cyan-300/60 outline-none px-0 py-1 text-xs text-white placeholder:text-white/30" aria-label="Search games" />
          <button type="button" onClick={() => setVoiceListening((value) => !value)} className={`ml-2 p-1 transition-colors ${voiceListening ? 'text-cyan-300' : 'text-white/35 hover:text-white'}`} aria-label="Voice search"><Mic className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      <div ref={gamesRailRef} className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden scrollbar-hide">
        <div className="h-full min-w-max flex items-stretch gap-3 pr-1">
          {filteredGames.map((game) => {
            const gameKey = game.title;
            const votes = vote.tally[gameKey] || 0;
            const isMyVote = vote.myBallot?.game_key === gameKey;
            const isSelected = selectedGame?.title === game.title;
            return (
              <div key={game.title} className={`relative group shrink-0 w-[210px] h-full flex flex-col border transition-all ${isSelected ? 'border-cyan-300/55 shadow-[0_0_22px_rgba(103,232,249,.16)]' : isMyVote ? 'border-cyan-300/45' : 'border-white/10 hover:border-white/25'}`}>
                <button type="button" onClick={() => setSelectedGame(game)} className="block w-full flex-1 min-h-0 flex flex-col text-left" aria-label={`Show achievement cards for ${game.title}`}>
                  <div className="relative flex-1 min-h-0 overflow-hidden bg-slate-900">
                    <img src={game.image} alt="" className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-transparent to-transparent" />
                  </div>
                  <div className="px-2 py-1.5 shrink-0">
                    <div className="text-[11px] font-semibold text-white truncate">{game.title}</div>
                    <div className="text-[8px] uppercase tracking-widest text-white/35">{game.genre}</div>
                  </div>
                </button>
                {vote.session && (
                  <button
                    type="button"
                    onClick={() => vote.castVote(gameKey, game.title)}
                    disabled={vote.busy}
                    className={`absolute top-1.5 right-1.5 h-6 px-2 flex items-center gap-1 text-[10px] font-bold border backdrop-blur-md transition-all ${isMyVote ? 'border-cyan-300/60 bg-cyan-400/25 text-white' : 'border-white/20 bg-black/45 text-white/80 hover:bg-cyan-400/25 hover:border-cyan-300/50'}`}
                    aria-label={`Vote for ${game.title}`}
                  >
                    <Vote className="w-3 h-3" />{votes > 0 ? votes : ''}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const pickerNode = (
    <Dialog open={showPicker} onOpenChange={setShowPicker}>
      <DialogContent className="bg-[#1a1f2e] border-white/10 text-white max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader><DialogTitle>Add Game from Library</DialogTitle></DialogHeader>
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-4">
          {libraryGames.map((game) => <button key={game.id} type="button" className="flex flex-col items-center gap-2 p-2 border border-transparent hover:border-white/20 hover:bg-white/10 transition-all text-left" onClick={() => handleAddGame(game.title)}><div className="w-full aspect-[3/4] overflow-hidden bg-black/20">{game.cover_image ? <img src={game.cover_image} alt={game.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/20">No Image</div>}</div><span className="text-xs text-center font-medium text-white/80 line-clamp-2">{game.title}</span></button>)}
          {libraryGames.length === 0 && FALLBACK_GAMES.slice(0, 4).map((game) => <button key={game.title} type="button" className="flex flex-col items-center gap-2 p-2 border border-transparent hover:border-white/20 hover:bg-white/10 transition-all" onClick={() => handleAddGame(game.title)}><img src={game.image} alt="" className="w-full aspect-video object-cover" /><span className="text-xs text-center font-medium text-white/80">{game.title}</span></button>)}
        </div>
      </DialogContent>
    </Dialog>
  );

  const hideShellStyle = <style>{`body:has([data-games-overlay="true"]) > div.fixed.inset-0 > section { visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }`}</style>;

  // Full screen: one combined console over the whole page.
  if (fullscreen) {
    return createPortal(
      <div data-games-overlay="true" role="dialog" aria-label="Games and achievements" className="fixed inset-0 z-[100001] flex flex-col overflow-hidden bg-slate-950/96 backdrop-blur-xl text-white">
        {hideShellStyle}
        <div className="h-full w-full min-h-0 flex flex-col px-6 py-5">
          {headerNode}
          {voteBannerNode}
          {achievementsNode}
          <div className="shrink-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent my-3" />
          <div className="h-[38%] shrink-0 flex flex-col">{gamesNode}</div>
        </div>
        {pickerNode}
      </div>,
      document.body
    );
  }

  // Inside the streaming box: two separate, full-width blended panels.
  const content = (
    <>
      {hideShellStyle}
      <motion.div
        data-games-overlay="true"
        role="dialog"
        aria-label="Achievement cards"
        initial={{ y: -36, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
        className="absolute left-0 right-0 top-0 z-[100000] flex h-[40%] min-h-[190px] flex-col overflow-hidden rounded-b-xl px-5 pt-3 pb-2 text-white"
        style={{
          background: 'linear-gradient(180deg, rgba(2,6,23,.94), rgba(2,6,23,.78) 55%, rgba(2,6,23,.25))',
          backdropFilter: 'blur(20px) saturate(150%)',
          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
        }}
      >
        {headerNode}
        {voteBannerNode}
        {achievementsNode}
      </motion.div>
      <motion.div
        data-games-overlay="true"
        initial={{ y: 44, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.36, ease: 'easeOut' }}
        className="absolute bottom-0 left-0 right-0 z-[100000] flex h-[30%] min-h-[150px] flex-col overflow-hidden rounded-t-xl px-5 pb-3 pt-1.5 text-white"
        style={{
          background: 'linear-gradient(0deg, rgba(2,6,23,.94), rgba(2,6,23,.78) 55%, rgba(2,6,23,.25))',
          backdropFilter: 'blur(20px) saturate(150%)',
          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
        }}
      >
        {gamesNode}
      </motion.div>
      {pickerNode}
    </>
  );

  if (portalTarget) return createPortal(content, portalTarget);
  return null;
}