import { Image as ImageIcon, Play } from 'lucide-react';
import { CATEGORY_META } from './galleryClipData';
import { GAME_ART } from './galleryModel';

export function ClipPreview({ clip }) {
  const image = clip.thumbnail_url || (clip.type === 'image' ? clip.url : null) || GAME_ART[clip.game];
  return <><div className={`gallery-card-tone bg-gradient-to-br ${clip.tone || 'from-cyan-400/20 via-slate-950 to-indigo-950'}`} />{image && <img src={image} alt="" loading="lazy" className="gallery-card-image" />}{clip.type === 'video' && clip.url && !image && <video src={clip.url} muted playsInline preload="metadata" className="gallery-card-image" />}</>;
}

export default function ClipCard({ clip, selected, onSelect }) {
  const meta = CATEGORY_META[clip.category] || CATEGORY_META.SAVED;
  return <button type="button" data-clip-id={clip.id} aria-label={`${clip.title}${clip.isSample ? ', sample moment' : ''}`} aria-pressed={selected} onClick={() => onSelect(clip)} className={`gallery-clip-card ${selected ? 'is-selected ring-1 ring-cyan-500/50' : ''}`}><ClipPreview clip={clip} /><div className="gallery-card-shade" /><span className={`gallery-card-category ${meta.chip}`}>{meta.label}</span><span className="gallery-card-play">{clip.type === 'video' ? <Play size={13} fill="currentColor" /> : <ImageIcon size={13} />}</span><div className="gallery-card-caption"><small>{clip.isSample ? 'SAMPLE' : clip.contributor ? `BY ${clip.contributor}` : clip.time || 'SAVED MOMENT'}</small><strong>{clip.title}</strong><span>{clip.game}</span></div>{selected && <span className="gallery-card-selected-dot" />}</button>;
}
