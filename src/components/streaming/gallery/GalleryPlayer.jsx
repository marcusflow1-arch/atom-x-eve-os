import { useRef, useState } from 'react';
import { Film, Image as ImageIcon, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { GAME_ART } from './galleryModel';

const clock = (seconds) => `${Math.floor((seconds || 0) / 60)}:${String(Math.floor((seconds || 0) % 60)).padStart(2, '0')}`;

// One mounted player preserves playback during the transition into theater mode.
export default function GalleryPlayer({ clip, fullscreen }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState('');
  const video = clip?.type === 'video' && clip?.url;
  const artwork = clip?.thumbnail_url || GAME_ART[clip?.game];
  const togglePlay = async () => {
    const media = videoRef.current;
    if (!media) return;
    if (!media.paused) { media.pause(); return; }
    try { await media.play(); } catch { setError('Playback could not start. Try again.'); }
  };
  return <div className={`gallery-player ${fullscreen ? 'is-theater' : ''}`} aria-label="Active clip player">
    {artwork && <img src={artwork} alt="" className="gallery-player-art" />}
    <div className={`gallery-player-atmosphere bg-gradient-to-br ${clip?.tone || 'from-cyan-400/10 via-slate-950/80 to-indigo-950/80'}`} />
    {video ? <video ref={videoRef} src={clip.url} poster={clip.thumbnail_url} playsInline preload="metadata" aria-label={clip.title} className="gallery-media" onClick={togglePlay} onPlay={() => { setPlaying(true); setError(''); }} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onLoadedMetadata={(event) => { event.currentTarget.volume = volume; setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0); }} onTimeUpdate={(event) => setPosition(event.currentTarget.currentTime)} onError={() => setError('This video is unavailable. Choose another moment or try again later.')} /> : clip?.url ? <img src={clip.url} alt={clip.title} className="gallery-media" onError={() => setError('This image is unavailable. Choose another moment.')} /> : null}
    <div className="gallery-player-vignette" />
    {(!clip?.url || error) && <div className="gallery-media-empty" role="status"><span className="gallery-media-symbol">{clip?.type === 'image' ? <ImageIcon /> : <Film />}</span><span className="gallery-eyebrow">{error ? 'Media unavailable' : clip?.isSample ? 'Sample moment' : 'Your media center'}</span><p>{error || (clip ? 'No media attached to this moment yet.' : 'Choose a moment to start watching.')}</p></div>}
    {video && <div className="gallery-playback-controls">
      <button type="button" onClick={togglePlay} className="gallery-icon-button" aria-label={playing ? 'Pause clip' : 'Play clip'}><span>{playing ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}</span></button>
      <span className="gallery-time">{clock(position)}</span><input aria-label="Seek clip" type="range" min="0" max={duration || 1} step="0.1" value={position} disabled={!duration} onChange={(event) => { videoRef.current.currentTime = Number(event.target.value); setPosition(Number(event.target.value)); }} /><span className="gallery-time">{clock(duration)}</span>
      <button type="button" className="gallery-icon-button" aria-label={muted ? 'Unmute clip' : 'Mute clip'} onClick={() => { videoRef.current.muted = !muted; setMuted(!muted); }}>{muted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>
      <input className="gallery-volume" aria-label="Clip volume" type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={(event) => { const value = Number(event.target.value); videoRef.current.volume = value; videoRef.current.muted = false; setVolume(value); setMuted(false); }} />
    </div>}
  </div>;
}
