import { useRef, useState } from 'react';
import { Check, Diamond, Lock, Sparkles } from 'lucide-react';
import { RARITY_COLORS } from './cardsCatalog';

export function CardArtwork({ src, className = '' }) {
  const [failed, setFailed] = useState(null);
  return src && failed !== src ? <img className={className} src={src} alt="" loading="lazy" onError={() => setFailed(src)} /> : <div className={`cc-art-fallback ${className}`} aria-hidden="true"><Diamond /><span>Atom × Eve</span></div>;
}

export default function CollectibleCard({ card, onSelect, selected, decorative = false, footer }) {
  const ref = useRef(null);
  const move = (event) => {
    if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    ref.current.style.setProperty('--tilt-x', `${(0.5 - y) * 7}deg`);
    ref.current.style.setProperty('--tilt-y', `${(x - 0.5) * 9}deg`);
    ref.current.style.setProperty('--shine-x', `${x * 100}%`);
    ref.current.style.setProperty('--shine-y', `${y * 100}%`);
  };
  const reset = () => { ref.current?.style.setProperty('--tilt-x', '0deg'); ref.current?.style.setProperty('--tilt-y', '0deg'); };
  const Tag = decorative ? 'div' : 'button';
  return <Tag ref={ref} type={decorative ? undefined : 'button'} className="cc-card" data-selected={selected || undefined} style={{ '--rarity': RARITY_COLORS[card.rarity] || RARITY_COLORS.Common }} onClick={decorative ? undefined : () => onSelect(card)} onPointerMove={decorative ? undefined : move} onPointerLeave={reset} onBlur={reset} aria-label={decorative ? undefined : `${card.title}, ${card.rarity || 'Common'}${card.isOwned ? ', collected' : ''}`} aria-pressed={decorative || selected === undefined ? undefined : selected}>
    <div className="cc-card-art"><CardArtwork src={card.image} /><span className="cc-card-shine" /><span className="cc-card-tier"><Sparkles size={10} />{card.rarity || 'Common'}</span><div className="cc-card-caption"><span>{card.series || 'Card collection'}</span><h3>{card.title}</h3></div></div>
    <div className="cc-card-base"><span>{card.group || 'Collectible'}</span>{footer || <span className={card.isOwned ? 'cc-owned' : ''}>{card.isOwned ? <><Check size={11} /> Collected</> : <><Lock size={10} /> To unlock</>}</span>}</div>
  </Tag>;
}
