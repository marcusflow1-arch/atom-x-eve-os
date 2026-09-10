import { memo, useState } from 'react';
import { Gamepad2, Radio, Play } from 'lucide-react';
import { formatCount } from './discoveryModel';

export function Artwork({ src, className = '', avatar = false }) {
  const [failed, setFailed] = useState(false);
  return <span className={`console-artwork ${className}`}>{src && !failed ? <img src={src} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} /> : avatar ? <Radio size={18} /> : <Gamepad2 size={30} />}</span>;
}

export const StreamCard = memo(function StreamCard({ stream, onSelect, ...props }) {
  return <button type="button" className="console-stream-card" onClick={() => onSelect(stream)} aria-label={`${stream.name}: ${stream.title}, ${formatCount(stream.viewers)} watching`} {...props}>
    <div className="console-stream-art"><Artwork key={stream.thumbnail} src={stream.thumbnail} /><div className="console-card-vignette" /><span className="console-live-badge">LIVE <span>• {formatCount(stream.viewers)}</span></span><span className="console-card-play"><Play size={20} fill="currentColor" /></span></div>
    <div className="console-stream-meta"><Artwork key={stream.avatar} src={stream.avatar} avatar className="console-avatar" /><div><strong>{stream.name}</strong><p>{stream.title}</p><small>{stream.game}</small></div></div>
    <div className="console-card-tags">{stream.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
  </button>;
});

export const GameCard = memo(function GameCard({ game, onSelect, hot = false, ...props }) {
  return <button type="button" className={`console-game-card ${hot ? 'is-hot' : ''}`} aria-label={`${game.title}, ${game.liveCount} live streams`} onClick={() => onSelect(game)} {...props}>
    <div className="console-game-art"><Artwork key={game.image} src={game.image} /><div className="console-card-vignette" />{game.liveCount > 0 && <span><i />{formatCount(game.liveCount)} live</span>}</div>
    <strong>{game.title}</strong><small>{formatCount(game.viewers)} Viewers · {formatCount(game.liveCount)} Live Streams</small>
  </button>;
});

export function moveRailFocus(event) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  const buttons = [...event.currentTarget.querySelectorAll('button')];
  const index = buttons.indexOf(document.activeElement);
  if (index < 0) return;
  event.preventDefault();
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, index + (event.key === 'ArrowRight' ? 1 : -1)));
  buttons[next]?.focus(); buttons[next]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
