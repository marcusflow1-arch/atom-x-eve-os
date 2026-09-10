import React, { useState } from 'react';
import { Target, Gamepad2 } from 'lucide-react';

export default function ClanDirectoryTile({ game, onSelect, compact = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  return <button type="button" onClick={() => onSelect(game)} className={compact ? 'clan-game-tile is-compact' : 'clan-game-tile'} aria-label={`Open ${game.title} chat`}>
    <span className="clan-game-art">{!imageFailed && (game.cover_image || game.cover) ? <img src={game.cover_image || game.cover} alt="" loading="lazy" draggable={false} onError={() => setImageFailed(true)} /> : <span className="flex h-full items-center justify-center text-muted-foreground"><Gamepad2 size={28} /></span>}
      {game.isAssigned && <span className="clan-game-assigned" title="Assigned"><Target size={13} /></span>}
      {game.isFarming && !compact && <span className="clan-game-farming">Farming</span>}
    </span>
    <span className="clan-game-copy"><strong>{game.title}</strong><small>{game.genre}</small></span>
  </button>;
}