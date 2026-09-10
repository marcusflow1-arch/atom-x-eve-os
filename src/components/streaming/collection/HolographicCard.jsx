import { memo, useEffect, useRef } from 'react';
import { Trophy } from 'lucide-react';
import { cardTilt } from './playerCollectionModel';

export const rarityColor = { Common: '#b9c5d4', Uncommon: '#86efac', Rare: '#7dd3fc', Epic: '#d8b4fe', Legendary: '#fcd38a', Mythic: '#fda4af', Mythical: '#fda4af', Unique: '#a5f3fc', Limitless: '#f0abfc' };
export const statusLabel = { unlocked: 'Unlocked', in_progress: 'In progress', locked: 'Locked', collected: 'Collected' };

export default memo(function HolographicCard({ card, selected, onSelect }) {
  const root = useRef(null), frame = useRef(null);
  const reset = () => {
    cancelAnimationFrame(frame.current);
    root.current?.style.setProperty('--tilt-x', '0deg'); root.current?.style.setProperty('--tilt-y', '0deg');
    root.current?.style.setProperty('--light-x', '50%'); root.current?.style.setProperty('--light-y', '35%');
  };
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  const move = (event) => {
    if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const tilt = cardTilt(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect());
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      root.current?.style.setProperty('--tilt-x', `${tilt.x}deg`); root.current?.style.setProperty('--tilt-y', `${tilt.y}deg`);
      root.current?.style.setProperty('--light-x', `${tilt.lightX}%`); root.current?.style.setProperty('--light-y', `${tilt.lightY}%`);
    });
  };
  return <button ref={root} type="button" data-achievement-id={card.id} className="player-collection-card" aria-label={`Inspect ${card.name}, ${card.rarity}`} aria-pressed={selected} onClick={() => onSelect(card)} onPointerMove={move} onPointerLeave={reset} onPointerCancel={reset} onBlur={reset} style={{ '--tier-color': rarityColor[card.rarity] || rarityColor.Common }}><span className="collection-card-face"><span className="player-collection-card-art">{card.image ? <img src={card.image} alt="" loading="lazy" /> : <Trophy size={34} />}<span className="collection-card-vignette" /><span className="collection-card-tier">{card.rarity}</span></span><span className="player-collection-card-copy"><small>{card.category}</small><strong>{card.name}</strong><span>{statusLabel[card.status]}{card.percent !== null ? ` · ${Math.round(card.percent)}%` : ''}</span></span><span className="collection-card-hologram" aria-hidden="true" /><span className="collection-card-flare" aria-hidden="true" /></span></button>;
});
