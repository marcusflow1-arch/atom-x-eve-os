import React from 'react';
import { Gamepad2 } from 'lucide-react';

export default function OwnedLibraryTile({ game, onSelect, selected = false, compact = false }) {
  return <button type="button" data-owned-game={game.id} aria-label={`Open ${game.title}`} aria-pressed={selected} onClick={() => onSelect(game)} className={`group min-w-0 text-left rounded-xl border p-1.5 ${compact ? 'w-32 shrink-0' : 'w-full'} ${selected ? 'border-primary bg-primary/10' : 'border-border/60 bg-muted/30 hover:border-primary/70'}`}>
    <div className={`relative overflow-hidden rounded-lg bg-muted ${compact ? 'aspect-video' : 'aspect-[3/4]'}`}>
      <Gamepad2 className="absolute inset-0 m-auto h-8 w-8 text-muted-foreground" />
      {(game.cover_image || game.thumb) && <img src={game.cover_image || game.thumb} alt="" loading="lazy" className="relative h-full w-full object-cover" onError={e => { e.currentTarget.style.visibility = 'hidden'; }} />}
    </div>
    <span className="mt-2 block text-xs font-semibold leading-snug break-words">{game.title}</span>
    {!compact && <><span className="mt-1 block text-[10px] capitalize text-muted-foreground">{game.genre}</span><span className="mt-1 block text-[10px] text-muted-foreground">{game.playedHours == null ? 'Playtime not recorded' : `${game.playedHours.toLocaleString(undefined, { maximumFractionDigits: 1 })}h played`}</span></>}
  </button>;
}