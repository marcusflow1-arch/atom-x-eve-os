import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import GameDetailPanel from './GameDetailPanel';
import { AtomEvents, trackAtomEvent } from '@/lib/atomTelemetry';

/**
 * Game detail content for a selected store game.
 * The bottom Dev Info bar in GlassPageFrame owns the Game/Studio/Stream
 * navigation; this component intentionally does not render a second tab bar.
 */
export default function GameHubTabs({ gameId, onClose, onGameLoaded }) {
  const [game, setGame] = useState(null);

  useEffect(() => {
    let cancelled = false;

    base44.entities.Game.get(gameId)
      .then((loadedGame) => {
        if (cancelled) return;
        setGame(loadedGame);
        onGameLoaded?.(loadedGame);
        trackAtomEvent(AtomEvents.GAME_HUB_OPENED, {
          gameId,
          gameTitle: loadedGame?.title,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setGame(null);
        onGameLoaded?.(null);
      });

    return () => {
      cancelled = true;
    };
  }, [gameId, onGameLoaded]);

  if (!game) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#0d0d0d] text-white/30">
        Loading game hub…
      </div>
    );
  }

  return (
    <div className="h-full w-full relative bg-[#0d0d0d] text-white overflow-hidden">
      <GameDetailPanel gameId={gameId} onClose={onClose} />
    </div>
  );
}
