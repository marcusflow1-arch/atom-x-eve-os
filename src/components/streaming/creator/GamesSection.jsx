import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Search, Gamepad2, Mic, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const FALLBACK_GAMES = ['The Elder Scrolls', 'SMITE 2', 'Fallout', 'Cyberpunk 2077', 'Destiny 2', 'Call of Duty', 'Fortnite', 'Rocket League'];
const GENRES = ['All', 'MMORPG', 'RPG', 'Action RPG', 'MOBA', 'Shooter', 'Fantasy', 'Sci-Fi'];

const GAME_META = {
  'The Elder Scrolls': { genre: 'Fantasy', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/306130/header.jpg' },
  'SMITE 2': { genre: 'MOBA', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2687550/header.jpg' },
  Fallout: { genre: 'RPG', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/377160/header.jpg' },
  'Cyberpunk 2077': { genre: 'Action RPG', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg' },
  'Destiny 2': { genre: 'Shooter', image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1085660/header.jpg' },
};

const getMeta = (title) => GAME_META[title] || { genre: 'Game', image: '' };

export default function GamesSection({ isEditMode, pinnedGames = [], onUpdateGames, onClose, fullscreen = false, onToggleFullscreen }) {
  const panelRef = useRef(null);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('All');
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const panel = panelRef.current;
    const overlay = panel?.closest('[role="dialog"]');
    if (!overlay) return undefined;

    overlay.dataset.gamesOverlay = 'true';
    const style = document.createElement('style');
    style.dataset.gamesOverlayStyle = 'true';
    style.textContent = `
      section[data-games-overlay="true"] { transform: none !important; background: transparent !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; border: 0 !important; box-shadow: none !important; pointer-events: none !important; }
      section[data-games-overlay="true"] > div { padding: 0 !important; }
      section[data-games-overlay="true"] [data-games-panel="true"] { pointer-events: auto !important; }
    `;
    document.head.appendChild(style);
    return () => {
      overlay.removeAttribute('data-games-overlay');
      style.remove();
    };
  }, []);

  const { data: libraryGames = [] } = useQuery({
    queryKey: ['libraryGames'],
    queryFn: () => base44.entities.Game.list(),
  });

  const visibleGames = pinnedGames.length ? pinnedGames : FALLBACK_GAMES;
  const filteredGames = useMemo(() => visibleGames.filter((game) => {
    const meta = getMeta(game);
    const genreMatches = genre === 'All' || meta.genre === genre || (genre === 'RPG' && meta.genre === 'Action RPG');
    const searchMatches = !search.trim() || game.toLowerCase().includes(search.trim().toLowerCase());
    return genreMatches && searchMatches;
  }), [visibleGames, search, genre]);

  const handleAddGame = (gameTitle) => {
    if (!pinnedGames.includes(gameTitle)) onUpdateGames([...pinnedGames, gameTitle]);
    setShowPicker(false);
  };

  const handleRemoveGame = (gameTitle) => onUpdateGames(pinnedGames.filter((g) => g !== gameTitle));

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event) => setSearch(event.results?.[0]?.[0]?.transcript || '');
    recognition.start();
  };

  return (
    <motion.div ref={panelRef} data-games-panel="true" initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 30 }} className={`${fullscreen ? 'absolute inset-0' : 'absolute inset-x-0 bottom-0 h-[40%] min-h-[220px]'} z-50 overflow-hidden select-none bg-slate-950/88 backdrop-blur-xl border-t border-white/15 shadow-[0_-24px_70px_rgba(0,0,0,.55)]`}>
      <div className="h-full w-full flex flex-col px-5 py-4 md:px-7 md:py-5">
        <div className="flex items-center justify-between gap-4 shrink-0 pb-3 border-b border-white/10">
          <div className="min-w-0">
            <div className="text-[9px] uppercase tracking-[0.28em] text-cyan-300/60">{fullscreen ? 'Games Directory' : 'Games Played'}</div>
            <h3 className="text-white font-bold text-lg md:text-xl flex items-center gap-2 truncate"><Gamepad2 className="w-4 h-4 text-cyan-300 shrink-0" />Games Played {isEditMode && <Badge className="bg-white text-black text-[10px]">EDITING</Badge>}</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isEditMode && <Button size="sm" className="bg-white text-black hover:bg-slate-200" onClick={() => setShowPicker(true)}><Plus className="w-3 h-3 mr-2" /> Add Game</Button>}
            {onToggleFullscreen && <button type="button" onClick={onToggleFullscreen} className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white border border-white/10 bg-white/5 hover:bg-white/10" aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}>{fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</button>}
          </div>
        </div>

        <div className={`${fullscreen ? 'flex-1 min-h-0 flex flex-col' : 'shrink-0'}`}>
          <div className="flex items-center gap-5 overflow-x-auto scrollbar-hide py-3 border-b border-white/10">
            {GENRES.map((item) => <button key={item} type="button" onClick={() => setGenre(item)} className={`relative shrink-0 pb-1 text-[10px] uppercase tracking-[0.16em] font-semibold transition-colors ${genre === item ? 'text-cyan-200' : 'text-white/35 hover:text-white/70'}`}>{item}{genre === item && <span className="absolute left-0 right-0 -bottom-[1px] h-px bg-cyan-300" />}</button>)}
          </div>

          <div className="flex items-center gap-3 py-3 border-b border-white/10">
            <Search className="w-4 h-4 text-white/35 shrink-0" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" aria-label="Search games" className="min-w-0 flex-1 bg-transparent border-0 border-b border-white/20 focus:border-cyan-300/50 outline-none text-sm text-white placeholder:text-white/35 py-1" />
            <button type="button" onClick={handleVoiceSearch} className={`shrink-0 p-1 ${isListening ? 'text-cyan-300' : 'text-white/35 hover:text-white'}`} aria-label="Voice search"><Mic className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden pt-3">
          {fullscreen ? (
            <div className="h-full overflow-y-auto pr-1 scrollbar-hide grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredGames.map((game, i) => {
                const meta = getMeta(game);
                return <div key={game} className="group flex items-center gap-4 min-h-[92px] p-3 border border-white/10 bg-white/[0.025] hover:bg-white/[0.06] hover:border-cyan-300/30 transition-all">
                  <div className="w-28 h-16 shrink-0 overflow-hidden bg-slate-900 border border-white/10">{meta.image ? <img src={meta.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-cyan-300/60 font-bold text-lg">{game.charAt(0)}</div>}</div>
                  <div className="min-w-0 flex-1"><div className="text-sm font-semibold text-white truncate">{game}</div><div className="text-[9px] uppercase tracking-[0.18em] text-cyan-200/45 mt-1">{meta.genre}</div><div className="text-[9px] uppercase tracking-wider text-white/25 mt-2">Played game {i + 1}</div></div>
                  {isEditMode && pinnedGames.includes(game) && <button type="button" className="text-red-400 hover:text-red-300 p-2" onClick={() => handleRemoveGame(game)} aria-label={`Remove ${game}`}><Trash2 className="w-3.5 h-3.5" /></button>}
                </div>;
              })}
              {filteredGames.length === 0 && <div className="col-span-full text-center text-white/30 text-sm py-10">No games match your search.</div>}
            </div>
          ) : (
            <div className="h-full overflow-x-auto overflow-y-hidden scrollbar-hide flex items-center gap-4 pr-2">
              {filteredGames.map((game, i) => {
                const meta = getMeta(game);
                return <div key={game} className="group relative w-[220px] md:w-[260px] h-full min-h-[125px] shrink-0 overflow-hidden border border-white/10 bg-white/[0.025] hover:border-cyan-300/35 transition-all">
                  <div className="absolute inset-0">{meta.image ? <img src={meta.image} alt="" className="w-full h-full object-cover opacity-65 group-hover:opacity-80 transition-opacity" /> : <div className="w-full h-full bg-gradient-to-br from-slate-800 to-cyan-950/50" />}</div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3"><div className="text-sm font-bold text-white truncate">{game}</div><div className="text-[9px] uppercase tracking-[0.18em] text-cyan-200/50 mt-1">{meta.genre} · Played {i + 1}</div></div>
                  {isEditMode && pinnedGames.includes(game) && <button type="button" className="absolute top-2 right-2 p-2 bg-black/55 text-red-300 hover:text-red-200" onClick={() => handleRemoveGame(game)} aria-label={`Remove ${game}`}><Trash2 className="w-3.5 h-3.5" /></button>}
                </div>;
              })}
              {filteredGames.length === 0 && <div className="w-full text-center text-white/30 text-sm py-10">No games match your search.</div>}
            </div>
          )}
        </div>

        <Dialog open={showPicker} onOpenChange={setShowPicker}>
          <DialogContent className="bg-[#1a1f2e] border-white/10 text-white max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader><DialogTitle>Add Game from Library</DialogTitle></DialogHeader>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-4">
              {libraryGames.map((game) => <div key={game.id} className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-white/10 cursor-pointer border border-transparent hover:border-white/20 transition-all" onClick={() => handleAddGame(game.title)}><div className="w-full aspect-[3/4] rounded-md overflow-hidden bg-black/20">{game.cover_image ? <img src={game.cover_image} alt={game.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/20">No Image</div>}</div><span className="text-xs text-center font-medium text-white/80 line-clamp-2">{game.title}</span></div>)}
              {libraryGames.length === 0 && FALLBACK_GAMES.slice(0, 4).map((g) => <div key={g} className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-white/10 cursor-pointer border border-transparent hover:border-white/20 transition-all" onClick={() => handleAddGame(g)}><div className="w-full aspect-[3/4] bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white/30 font-bold">{g.charAt(0)}</div><span className="text-xs text-center font-medium text-white/80 line-clamp-2">{g}</span></div>)}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  );
}
