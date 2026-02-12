import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function GamesSection({ isEditMode, pinnedGames = [], onUpdateGames, onClose }) {
  const [showPicker, setShowPicker] = useState(false);

  const { data: libraryGames = [] } = useQuery({
    queryKey: ['libraryGames'],
    queryFn: () => base44.entities.Game.list(),
  });

  const handleAddGame = (gameTitle) => {
    if (!pinnedGames.includes(gameTitle)) {
      onUpdateGames([...pinnedGames, gameTitle]);
    }
    setShowPicker(false);
  };

  const handleRemoveGame = (gameTitle) => {
    onUpdateGames(pinnedGames.filter(g => g !== gameTitle));
  };

  return (
    <div className="w-full select-none pt-4 bg-white/5 rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          Games Played
          {isEditMode && <Badge className="bg-white text-black text-[10px]">EDITING</Badge>}
        </h3>
        <div className="flex items-center gap-2">
          {isEditMode && (
            <Button size="sm" className="bg-white text-black hover:bg-slate-200" onClick={() => setShowPicker(true)}>
              <Plus className="w-3 h-3 mr-2" /> Add Game
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {isEditMode && (
          <div
            onClick={() => setShowPicker(true)}
            className="w-[200px] flex-shrink-0 bg-white/5 border-2 border-dashed border-white/10 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 min-h-[80px]"
          >
            <Plus className="w-6 h-6 text-white/40 mb-2" />
            <span className="text-xs font-bold text-white/40">Add Game from Library</span>
          </div>
        )}
        {pinnedGames.map((game, i) => (
          <div key={game} className="w-[200px] flex-shrink-0 bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer group relative">
            <div className="w-12 h-12 rounded-lg bg-black/40 overflow-hidden flex-shrink-0">
              <div className="w-full h-full bg-gradient-to-br from-indigo-800 to-purple-900 flex items-center justify-center text-white/30 text-xs font-bold">
                {game.charAt(0)}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate">{game}</div>
            </div>
            {isEditMode && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="text-red-400 hover:text-red-300 bg-black/50 rounded-full p-1"
                  onClick={(e) => { e.stopPropagation(); handleRemoveGame(game); }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ))}
        {pinnedGames.length === 0 && !isEditMode && (
          <div className="w-full py-8 text-center text-white/30 text-sm">No games pinned yet</div>
        )}
      </div>

      <Dialog open={showPicker} onOpenChange={setShowPicker}>
        <DialogContent className="bg-[#1a1f2e] border-white/10 text-white max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Game from Library</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-4">
            {libraryGames.map(game => (
              <div
                key={game.id}
                className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-white/10 cursor-pointer border border-transparent hover:border-white/20 transition-all"
                onClick={() => handleAddGame(game.title)}
              >
                <div className="w-full aspect-[3/4] rounded-md overflow-hidden bg-black/20">
                  {game.cover_image ? (
                    <img src={game.cover_image} alt={game.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">No Image</div>
                  )}
                </div>
                <span className="text-xs text-center font-medium text-white/80 line-clamp-2">{game.title}</span>
              </div>
            ))}
            {libraryGames.length === 0 && ['Call of Duty', 'Fortnite', 'Rocket League', 'Genshin Impact'].map(g => (
              <div
                key={g}
                className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-white/10 cursor-pointer border border-transparent hover:border-white/20 transition-all"
                onClick={() => handleAddGame(g)}
              >
                <div className="w-full aspect-[3/4] rounded-md overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white/30 font-bold">
                  {g.charAt(0)}
                </div>
                <span className="text-xs text-center font-medium text-white/80 line-clamp-2">{g}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}