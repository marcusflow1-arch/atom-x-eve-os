import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Film } from 'lucide-react';
import StreamMedia from '../hub/StreamMedia';
import SkillModelViewer from './SkillModelViewer';
import { rarityColor, statusLabel } from './HolographicCard';

function GameplayDemo({ card }) {
  const root = useRef(null);
  const [active, setActive] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const screenshot = !card.demoUrl && /\.(png|jpe?g|webp|gif|avif)([?#]|$)/i.test(card.proofUrl || '');
  const url = card.demoUrl || card.proofUrl;
  useEffect(() => {
    let visible = false;
    const update = () => setActive(visible && !document.hidden);
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    if (root.current) observer?.observe(root.current);
    if (!observer) { visible = true; update(); }
    document.addEventListener('visibilitychange', update);
    return () => { observer?.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);
  return <figure ref={root} className="collection-gameplay"><div className="collection-gameplay-stage">{url && !imageFailed ? screenshot ? <img src={url} alt={`${card.name} unlock screenshot`} onError={() => setImageFailed(true)} /> : <StreamMedia url={url} poster={card.image} title={`${card.name} gameplay demonstration`} active={active} loop /> : <div className="collection-media-placeholder"><Film size={27} /><strong>See the skill in action.</strong><span>No gameplay demonstration has been linked to this card yet.</span></div>}</div><figcaption><Film size={12} />{screenshot ? 'Unlock screenshot' : card.demoUrl ? 'Gameplay demonstration' : 'The unlock moment'}<span>{screenshot ? 'Saved proof' : url ? 'Looping playback' : 'Awaiting linked media'}</span></figcaption></figure>;
}

export default function CardShowcase({ card, onBack }) {
  const date = card.unlockDate ? new Date(card.unlockDate) : null;
  return <section className="player-collection-inspector" aria-label={`${card.name} skill showcase`}>
    <div className="collection-inspector-toolbar"><span className="player-collection-kicker">Selected card / Skill showcase</span><button type="button" className="player-collection-back" onClick={onBack}><ArrowLeft size={14} />Back to Collection</button></div>
    <div className="player-collection-detail-layout"><div className="player-collection-detail-copy"><span className="player-collection-kicker">{card.game.title} / {card.category}</span><h3>{card.name}</h3><div className="player-collection-badges"><span style={{ color: rarityColor[card.rarity] || rarityColor.Common }}>{card.rarity}</span><span>{statusLabel[card.status]}</span></div><p>{card.description}</p>{card.unlockCondition && <div className="collection-unlock-condition"><h4>Unlock condition</h4><p>{card.unlockCondition}</p></div>}<dl className="player-collection-stats"><div><dt>Unlocked</dt><dd>{date && Number.isFinite(date.getTime()) ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : card.status === 'unlocked' ? 'Date not recorded' : 'Not yet unlocked'}</dd></div><div><dt>Achievement points</dt><dd>{card.points === null ? '—' : card.points.toLocaleString()}</dd></div>{(card.stats || []).map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{String(value)}</dd></div>)}</dl><div className="player-collection-progress"><div><span>Progress</span><strong>{card.current !== null && card.total > 0 ? `${card.current.toLocaleString()} / ${card.total.toLocaleString()}` : card.percent === 100 ? 'Complete' : 'Not recorded'}</strong></div>{card.percent !== null && <progress aria-label={`${card.name} progress`} max="100" value={card.percent} />}</div></div><div className="collection-dual-display"><SkillModelViewer key={`model:${card.id}:${card.modelUrl}:${card.animationClip}`} card={card} /><GameplayDemo key={`video:${card.id}:${card.demoUrl}:${card.proofUrl}`} card={card} /></div></div>
  </section>;
}
