import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minimize2, Search, Mic, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const FALLBACK_GAMES = [
  { title: 'The Elder Scrolls', genre: 'Fantasy', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/306130/header.jpg', description: 'Explore Tamriel, discover ancient stories, and revisit the adventures that shaped the channel.' },
  { title: 'SMITE 2', genre: 'MOBA', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2687550/header.jpg', description: 'Mythic battles, ranked matches, and favorite gods from the current streaming rotation.' },
  { title: 'Fallout', genre: 'RPG', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/377160/header.jpg', description: 'Post-apocalyptic exploration, quests, builds, and memorable wasteland sessions.' },
  { title: 'Cyberpunk 2077', genre: 'Action RPG', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg', description: 'Night City builds, story runs, side missions, and high-intensity stream moments.' },
  { title: 'Destiny 2', genre: 'Shooter', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1085660/header.jpg', description: 'Guardians, raids, seasonal progression, and competitive sessions from the channel.' },
  { title: 'Call of Duty', genre: 'Shooter', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200', description: 'Fast matches, loadout testing, and competitive multiplayer sessions.' },
  { title: 'Fortnite', genre: 'Action', image: 'https://images.unsplash.com/photo-1603481546238-487240415921?w=1200', description: 'Battle royale runs, challenges, and community games.' },
  { title: 'Rocket League', genre: 'Sports', image: 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=1200', description: 'Ranked matches, mechanics practice, and competitive highlights.' },
];

const GENRES = ['All', 'MMORPG', 'RPG', 'Action RPG', 'MOBA', 'Shooter', 'Fantasy', 'Action', 'Sports'];

export default function GamesSection({ isEditMode, pinnedGames = [], onUpdateGames }) {
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('All');
  const [selectedGame, setSelectedGame] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);
  const [voiceListening, setVoiceListening] = useState(false);

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
    recognition.onresult = (event) => setSearch(event.results?.[0]?.[0]?.transcript || '');
    recognition.onend = () => setVoiceListening(false);
    recognition.onerror = () => setVoiceListening(false);
    recognition.start();
    return () => { try { recognition.stop(); } catch {} };
  }, [voiceListening]);

  const handleAddGame = (gameTitle) => {
    if (!pinnedGames.includes(gameTitle)) onUpdateGames?.([...pinnedGames, gameTitle]);
    setShowPicker(false);
  };

  const toggleFullscreen = () => setFullscreen((value) => !value);

  const content = (
    <div
      data-games-overlay="true"
      className={fullscreen
        ? 'fixed inset-0 z-[100001] flex flex-col overflow-hidden border-0 bg-slate-950/96 backdrop-blur-xl text-white'
        : 'absolute inset-x-0 bottom-0 z-[100000] h-[40%] min-h-[220px] overflow-hidden border-t border-white/15 bg-slate-950/82 backdrop-blur-xl text-white shadow-[0_-24px_70px_rgba(0,0,0,.55)]'}
      role="dialog"
      aria-label="Games played"
    >
      <style>{`body:has([data-games-overlay="true"]) > div.fixed.inset-0 > section { visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }`}</style>
      <div className={fullscreen ? 'h-full w-full flex flex-col p-6 md:p-10' : 'h-full w-full flex flex-col p-4 md:p-5'}>
        <div className="flex items-center justify-between gap-4 shrink-0 border-b border-white/10 pb-3">
          <div className="min-w-0">
            <div className="text-[9px] uppercase tracking-[0.3em] text-cyan-300/60">Games Played</div>
            <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2"><Gamepad2 className="w-4 h-4 text-cyan-300" />Channel Game Library</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isEditMode && <Button size="sm" className="bg-white text-black hover:bg-slate-200" onClick={() => setShowPicker(true)}>Add Game</Button>}
            <button type="button" onClick={toggleFullscreen} className="h-8 w-8 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 text-white/75" aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}>
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-5 shrink-0 py-3 overflow-x-auto scrollbar-hide border-b border-white/[0.06]">
          {GENRES.map((item) => <button key={item} type="button" onClick={() => setGenre(item)} className={`shrink-0 text-[10px] uppercase tracking-[0.16em] pb-1 border-b-2 transition-colors ${genre === item ? 'text-white border-cyan-300' : 'text-white/35 border-transparent hover:text-white/75'}`}>{item}</button>)}
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="relative flex items-center shrink-0 border-b border-white/10 py-2 max-w-md">
            <Search className="w-4 h-4 text-white/35 mr-2" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="w-full bg-transparent border-0 border-b border-white/20 focus:border-cyan-300/60 outline-none px-0 py-1.5 text-xs text-white placeholder:text-white/30" aria-label="Search games" />
            <button type="button" onClick={() => setVoiceListening((value) => !value)} className={`ml-2 p-1 transition-colors ${voiceListening ? 'text-cyan-300' : 'text-white/35 hover:text-white'}`} aria-label="Voice search"><Mic className="w-4 h-4" /></button>
          </div>

          {!fullscreen ? (
            <div className="flex-1 min-h-0 flex items-center gap-3 overflow-x-auto scrollbar-hide pt-3">
              {filteredGames.map((game) => <button key={game.title} type="button" onClick={() => setSelectedGame(game)} className={`relative shrink-0 w-[190px] md:w-[220px] h-full max-h-[150px] overflow-hidden border text-left transition-all ${selectedGame?.title === game.title ? 'border-cyan-300/60 shadow-[0_0_24px_rgba(103,232,249,.14)]' : 'border-white/10 hover:border-white/25'}`}>
                <img src={game.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-55" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3"><div className="text-sm font-bold text-white truncate">{game.title}</div><div className="text-[8px] uppercase tracking-widest text-cyan-200/55 mt-1">{game.genre}</div></div>
              </button>)}
              {filteredGames.length === 0 && <div className="text-sm text-white/35 py-8">No games match your search.</div>}
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto pt-5">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredGames.map((game) => <button key={game.title} type="button" onClick={() => setSelectedGame(game)} className={`group flex gap-5 p-4 text-left border transition-all ${selectedGame?.title === game.title ? 'border-cyan-300/55 bg-cyan-300/[0.05]' : 'border-white/10 bg-white/[0.02] hover:border-white/25'}`}>
                  <div className="w-44 md:w-56 aspect-video shrink-0 overflow-hidden bg-slate-900 border border-white/10"><img src={game.image} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" /></div>
                  <div className="min-w-0 py-1"><Badge className="bg-white/5 border-white/10 text-cyan-200/70 text-[8px] uppercase tracking-widest">{game.genre}</Badge><h4 className="text-xl font-bold text-white mt-3">{game.title}</h4><p className="text-sm leading-relaxed text-white/45 mt-2 max-w-xl">{game.description}</p></div>
                </button>)}
              </div>
            </div>
          )}
        </div>

        {!fullscreen && selectedGame && <div className="hidden lg:flex items-center justify-between gap-4 shrink-0 pt-2 text-[9px] text-white/30"><span>{selectedGame.title}</span><span>{selectedGame.description}</span></div>}
      </div>

      <Dialog open={showPicker} onOpenChange={setShowPicker}>
        <DialogContent className="bg-[#1a1f2e] border-white/10 text-white max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader><DialogTitle>Add Game from Library</DialogTitle></DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-4">
            {libraryGames.map((game) => <button key={game.id} type="button" className="flex flex-col items-center gap-2 p-2 border border-transparent hover:border-white/20 hover:bg-white/10 transition-all text-left" onClick={() => handleAddGame(game.title)}><div className="w-full aspect-[3/4] overflow-hidden bg-black/20">{game.cover_image ? <img src={game.cover_image} alt={game.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/20">No Image</div>}</div><span className="text-xs text-center font-medium text-white/80 line-clamp-2">{game.title}</span></button>)}
            {libraryGames.length === 0 && FALLBACK_GAMES.slice(0, 4).map((game) => <button key={game.title} type="button" className="flex flex-col items-center gap-2 p-2 border border-transparent hover:border-white/20 hover:bg-white/10 transition-all" onClick={() => handleAddGame(game.title)}><img src={game.image} alt="" className="w-full aspect-video object-cover" /><span className="text-xs text-center font-medium text-white/80">{game.title}</span></button>)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (fullscreen) return createPortal(content, document.body);
  if (portalTarget) return createPortal(content, portalTarget);
  return null;
}
