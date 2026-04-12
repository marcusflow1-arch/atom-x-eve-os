import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';

export default function GameListPanel({ games, selectedGame, onSelectGame, onClose, categoryLabel }) {
  return (
    <div className="w-[280px] h-full border-r border-white/10 flex flex-col bg-black/30 flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-xs font-bold text-white/70 uppercase tracking-widest truncate flex-1">
          {categoryLabel}
        </h3>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center transition-all flex-shrink-0"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Games List */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-3">
          {games.map(g => (
            <button
              key={g.id}
              onClick={() => onSelectGame(g)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all text-xs font-medium truncate ${
                selectedGame?.id === g.id
                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/40'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
              title={g.title}
            >
              {g.title}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}