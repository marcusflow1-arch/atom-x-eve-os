import React from 'react';
import { X } from 'lucide-react';
import GamePlayButton from '@/components/dashboard/gamehub/GamePlayButton';
import LibraryGameSections from '@/components/dashboard/gamehub/LibraryGameSections';
import { libraryCatalog } from '@/components/dashboard/gamehub/libraryCatalog';

export default function LibraryLandingPage({ game: selectedGame, onClose, initialTab = 'Overview', onBack, children }) {
  const game = selectedGame || libraryCatalog[0];
  return <div data-testid="library-full-view" className="library-surface relative h-full min-h-0 flex flex-col overflow-hidden bg-background/90 text-foreground">
    <header className="relative shrink-0 min-h-48 flex items-end p-6">
      <img src={game.image || game.thumb || game.cover_image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="relative flex flex-wrap w-full items-end gap-4">
        <div className="flex-1 min-w-0"><p className="text-xs text-primary">{game.genre}{game.demo ? ' · Demo catalog' : ''}</p><h1 className="mt-2 text-2xl font-bold break-words">{game.title}</h1><p className="mt-2 text-xs text-muted-foreground">{onBack ? 'Browse related games below, or press Esc to return to your full library.' : 'Select games from the library on the left.'}</p></div>
        <GamePlayButton key={game.id} game={game} />
      </div>
      {onBack && <button onClick={onBack} className="absolute left-6 top-3 text-xs rounded-lg bg-background/70 px-3 py-2">← Full Library · Esc</button>}
      {onClose && <button aria-label="Close full view" onClick={onClose} className="absolute right-3 top-3 p-2 rounded-full bg-background/70"><X className="h-4 w-4" /></button>}
    </header>
    {children}
    <div className="flex-1 min-h-0"><LibraryGameSections key={`${game.id}-${initialTab}`} game={game} initialTab={initialTab} /></div>
  </div>;
}