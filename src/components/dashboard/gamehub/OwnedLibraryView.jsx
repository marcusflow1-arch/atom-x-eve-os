import React from 'react';
import useOwnedLibrary from '@/components/dashboard/gamehub/useOwnedLibrary';
import OwnedLibraryGrid from '@/components/dashboard/gamehub/OwnedLibraryGrid';
import LibraryLandingPage from '@/components/dashboard/gamehub/LibraryLandingPage';
import RelatedLibraryGames from '@/components/dashboard/gamehub/RelatedLibraryGames';

export default function OwnedLibraryView({ selectedGame, onSelectGame, onBack, onClose }) {
  const { games, loading, error, retry } = useOwnedLibrary();
  const selected = selectedGame && (games.find(game => game.id === selectedGame.id) || selectedGame);
  return <div data-testid="owned-library-view" className="library-surface h-full min-h-0 overflow-hidden bg-background/90 text-foreground">
    <div className={selected ? 'hidden' : 'h-full'} aria-hidden={!!selected}>
      <OwnedLibraryGrid games={games} loading={loading} error={error} retry={retry} onSelect={onSelectGame} onClose={onClose} />
    </div>
    {selected && <LibraryLandingPage game={selected} onClose={onClose} onBack={onBack}>
      <RelatedLibraryGames games={games} selectedGame={selected} onSelect={onSelectGame} />
    </LibraryLandingPage>}
  </div>;
}