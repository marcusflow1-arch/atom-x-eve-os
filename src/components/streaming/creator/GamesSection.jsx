import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Search, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const FALLBACK_GAMES = ['The Elder Scrolls', 'SMITE 2', 'Fallout', 'Cyberpunk 2077', 'Destiny 2', 'Call of Duty', 'Fortnite', 'Rocket League'];

export default function GamesSection({ isEditMode, pinnedGames = [], onUpdateGames, onClose }) {
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');

  const { data: libraryGames = [] } = useQuery({
    queryKey: ['libraryGames'],
    queryFn: () => base44.entities.Game.list(),
  });

  const visibleGames = pinnedGames.length ? pinnedGames : FALLBACK_GAMES;
  const filteredGames = useMemo(() => visibleGames.filter((game) => game.toLowerCase().includes(search.toLowerCase())), [visibleGames, search]);

  const handleAddGame = (gameTitle) => {
    if (!pinnedGames.includes(gameTitle)) onUpdateGames([...pinnedGames, gameTitle]);
    setShowPicker(false);
  };

  const handleRemoveGame = (gameTitle) => onUpdateGames(pinnedGames.filter((g) => g !== gameTitle));

  return (
    <div className="w-full h-full min-h-0 flex flex-col select-none bg-transparent">
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/10 shrink-0">
        <div><div className="text-[10px] uppercase tracking-[0.28em] text-cyan-300/60">Library History</div><h3 className="text-white font-bold text-lg flex items-center gap-2"><Gamepad2 className="w-4 h-4 text-cyan-300" />Games Played {isEditMode && <Badge className="bg-white text-black text-[10px]">EDITING</Badge>}</h3></div>
        {isEditMode && <Button size="sm" className="bg-white text-black hover:bg-slate-200" onClick={() => setShowPicker(true)}><Plus className="w-3 h-3 mr-2" /> Add Game</Button>}
      </div>

      <div className="relative py-4 shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search games played..." className="pl-10 h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-cyan-300/30" />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1">
        {filteredGames.map((game, i) => (
          <div key={game} className="group flex items-center gap-3 p-3 border-b border-white/[0.06] hover:bg-white/[0.06] transition-colors">
            <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-slate-800 to-cyan-950/60 border border-white/10 flex items-center justify-center text-cyan-300/70 font-bold text-sm">{game.charAt(0)}</div>
            <div className="min-w-0 flex-1"><div className="text-sm font-semibold text-white truncate">{game}</div><div className="text-[10px] uppercase tracking-widest text-white/30">Played game {i + 1}</div></div>
            {isEditMode && pinnedGames.includes(game) && <button type="button" className="text-red-400 hover:text-red-300 opacity-60 group-hover:opacity-100 p-2" onClick={() => handleRemoveGame(game)} aria-label={`Remove ${game}`}><Trash2 className="w-3.5 h-3.5" /></button>}
          </div>
        ))}
        {filteredGames.length === 0 && <div className="py-12 text-center text-white/30 text-sm">No games match your search.</div>}
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
  );
}
