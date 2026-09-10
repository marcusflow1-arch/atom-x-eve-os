import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GamePlayButton({ game, compact = false }) {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const play = e => {
    e.stopPropagation();
    const target = game?.play_link?.trim();
    if (!target) { setMessage(`No launch link is configured for ${game.title}.`); return; }
    if (/^\/(?!\/)/.test(target)) { navigate(target); return; }
    if (/^https?:\/\//i.test(target) || /^steam:\/\/rungameid\/\d+\/?$/i.test(target)) {
      window.open(target, '_blank', 'noopener,noreferrer');
      setMessage('Launch requested. Your browser or game client may ask for confirmation.');
      return;
    }
    setMessage('This launch command cannot run in a browser. A web link or Steam launch link is required.');
  };
  return <div className="relative shrink-0">
    <button type="button" aria-label={`Play ${game.title}`} onClick={play} className={compact ? 'p-2 rounded-lg border border-current/30' : 'flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-3 text-xs font-bold'}><Play className="h-3.5 w-3.5 fill-current" />{!compact && 'PLAY'}</button>
    {message && <div role="status" onClick={e => e.stopPropagation()} className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg bg-popover text-popover-foreground p-3 text-xs shadow-lg"><p>{message}</p><button className="mt-2 underline" onClick={() => setMessage('')}>Dismiss</button></div>}
  </div>;
}