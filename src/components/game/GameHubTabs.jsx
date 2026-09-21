import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { WishlistProvider } from '@/components/store/WishlistContext';
import GameDetailPanel from './GameDetailPanel';
import { AtomEvents, trackAtomEvent } from '@/lib/atomTelemetry';

/** One catalog request owns the landing page and the shared studio controls. */
export default function GameHubTabs({ gameId, game: providedGame, onClose, onGameLoaded, returnLabel = 'Store' }) {
  const [state, setState] = useState({ game: null, error: false, loading: true });
  const [retry, setRetry] = useState(0);
  const id = gameId || providedGame?.id;
  useEffect(() => {
    let cancelled = false;
    setState({ game: null, error: false, loading: true });
    const load = providedGame?.id === id ? Promise.resolve(providedGame) : id ? base44.entities.Game.get(id) : Promise.reject(new Error('No game selected'));
    load.then(game => {
      if (cancelled) return;
      if (!game?.id) throw new Error('Game not found');
      setState({ game, error: false, loading: false });
      onGameLoaded?.(game);
      trackAtomEvent(AtomEvents.GAME_HUB_OPENED, { gameId: id, gameTitle: game.title });
    }).catch(() => {
      if (cancelled) return;
      setState({ game: null, error: true, loading: false });
      onGameLoaded?.(null);
    });
    return () => { cancelled = true; };
  }, [id, providedGame, onGameLoaded, retry]);

  // Avoid showing the previous game's price or media while the route changes.
  if (state.loading || (!state.error && state.game?.id !== id)) return <div className="gd-loading" role="status" aria-label="Loading game">
    <p>Opening game…</p><div className="gd-loading-skeleton" aria-hidden="true" />
  </div>;
  if (state.error || !state.game) return <div className="gd-loading gd-load-error" role="alert">
    <h1>This game couldn't be loaded.</h1><p>Try again, or return to the {returnLabel.toLowerCase()}.</p>
    <button onClick={() => setRetry(value => value + 1)}>Try again</button>
    {onClose && <button onClick={onClose}>Back to {returnLabel}</button>}
  </div>;
  return <WishlistProvider><GameDetailPanel key={state.game.id} game={state.game} onClose={onClose} returnLabel={returnLabel} /></WishlistProvider>;
}
