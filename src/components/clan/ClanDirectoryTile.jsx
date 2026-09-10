import React from 'react';
import { Target } from 'lucide-react';

export default function ClanDirectoryTile({ game, onSelect, compact = false }) {
  return <button type="button" onClick={() => onSelect(game)} className={compact ? 'clan-game-tile is-compact' : 'clan-game-tile'} aria-label={`Open ${game.title} chat`}>
    <span className="clan-game-art"><img src={game.cover_image || game.cover} alt="" loading="lazy" draggable={false} />
      {game.isAssigned && <span className="clan-game-assigned" title="Assigned"><Target size={13} /></span>}
      {game.isFarming && !compact && <span className="clan-game-farming">Farming</span>}
    </span>
    <span className="clan-game-copy"><strong>{game.title}</strong><small>{game.genre}</small></span>
  </button>;
}