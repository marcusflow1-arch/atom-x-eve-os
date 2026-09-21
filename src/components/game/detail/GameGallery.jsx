import React, { useMemo, useRef, useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight, ChevronLeft, ChevronRight, Maximize2, Play, X, ImageOff } from 'lucide-react';
import { gameMedia } from './gameDetailData';
import GameImage from './GameImage';

export default function GameGallery({ game }) {
  const media = useMemo(() => gameMedia(game), [game]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const strip = useRef(null);
  const selected = media[index] || media[0];
  const choose = value => { setIndex(value); setPlaying(false); };
  const move = direction => choose((index + direction + media.length) % media.length);

  useEffect(() => {
    const button = strip.current?.children[index];
    if (button) strip.current.scrollTo?.({ left: button.offsetLeft - strip.current.offsetLeft - 12, behavior: 'auto' });
  }, [index]);

  if (!selected) return <div className="gd-gallery-empty"><ImageOff size={32} /><p>No media published yet.</p></div>;

  const renderMedia = () => (
    <div className="gd-media-stage">
      {playing && selected.type === 'video' ? selected.kind === 'embed' ? (
        <iframe key={selected.key} src={selected.url} title={game.title + ' — ' + selected.title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
      ) : (
        <video key={selected.key} src={selected.url} poster={selected.image} controls autoPlay playsInline
          onError={() => setPlaying(false)} aria-label={selected.title} />
      ) : (
        <>
          <GameImage src={selected.image} fallback={game.cover_image} alt={game.title + ' — ' + selected.title} className="gd-stage-image" fetchPriority="high" />
          {selected.type === 'video' && (selected.kind === 'external' ? (
            <a className="gd-play" href={selected.url} target="_blank" rel="noopener noreferrer"><span><ArrowUpRight size={25} /></span>Open trailer</a>
          ) : (
            <button className="gd-play" onClick={() => setPlaying(true)}><span><Play size={25} fill="currentColor" /></span>Play trailer</button>
          ))}
        </>
      )}
    </div>
  );

  const arrows = () => media.length > 1 && <>
    <button className="gd-icon-button" aria-label="Previous media" onClick={() => move(-1)}><ChevronLeft size={18} /></button>
    <button className="gd-icon-button" aria-label="Next media" onClick={() => move(1)}><ChevronRight size={18} /></button>
  </>;

  return <section className="gd-gallery" aria-label="Game trailers and screenshots">
    <div className="gd-gallery-main">
      {!expanded ? renderMedia() : <div className="gd-media-stage gd-gallery-empty">Open in theater view</div>}
      <div className="gd-gallery-toolbar">
        <span className="gd-media-label" aria-live="polite">{selected.title}</span>
        <div className="gd-media-controls">
          <span className="gd-media-count">{String(index + 1).padStart(2, '0')} / {String(media.length).padStart(2, '0')}</span>
          {arrows()}
          <Dialog.Root open={expanded} onOpenChange={value => { setExpanded(value); setPlaying(false); }}>
            <Dialog.Trigger asChild><button className="gd-icon-button" aria-label="Expand media"><Maximize2 size={16} /></button></Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="gd-theater-overlay" />
              <Dialog.Content className="gd-theater" onKeyDown={event => {
                if (event.target.closest('video, iframe, input, textarea')) return;
                if (media.length > 1 && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
                  event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1);
                }
              }}>
                <div className="gd-theater-heading">
                  <div><Dialog.Title>{game.title}</Dialog.Title><Dialog.Description>Trailers & screenshots · Use the arrow keys to browse.</Dialog.Description></div>
                  <Dialog.Close className="gd-icon-button" aria-label="Close media"><X size={22} /></Dialog.Close>
                </div>
                {expanded && renderMedia()}
                <div className="gd-gallery-toolbar">
                  <span aria-live="polite">{selected.title}</span>
                  <div className="gd-media-controls"><span className="gd-media-count">{index + 1} / {media.length}</span>{arrows()}</div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </div>
    {media.length > 1 && <div ref={strip} className="gd-thumbnails" aria-label="Choose media">
      {media.map((item, i) => <button key={item.key} className="gd-thumbnail" aria-label={'Show ' + item.title} aria-pressed={index === i} onClick={() => choose(i)}>
        <GameImage src={item.image} fallback={game.cover_image} alt="" loading="lazy" />
        {item.type === 'video' && <span className="gd-thumbnail-play"><Play size={16} fill="currentColor" /></span>}
        <span className="gd-thumbnail-label">{item.type === 'video' ? item.title : String(i + 1).padStart(2, '0')}</span>
      </button>)}
    </div>}
  </section>;
}
