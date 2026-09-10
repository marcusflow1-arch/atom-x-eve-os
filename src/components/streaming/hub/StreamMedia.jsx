import { useEffect, useMemo, useRef, useState } from 'react';
import { Radio, Volume2 } from 'lucide-react';

export function resolveMedia(value, hostname = 'localhost', preview = false) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    const host = url.hostname.replace(/^www\./, '');
    if (['youtube.com', 'youtu.be', 'youtube-nocookie.com'].includes(host)) {
      const id = host === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|live|shorts)\/([^/]+)/)?.[1];
      if (!id || !/^[\w-]{11}$/.test(id)) return null;
      return { type: 'embed', url: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&playsinline=1&controls=${preview ? 0 : 1}&rel=0` };
    }
    if (host === 'twitch.tv' || host === 'player.twitch.tv') {
      const channel = url.searchParams.get('channel') || url.pathname.split('/').filter(Boolean)[0];
      if (!channel || !/^[\w]{1,25}$/.test(channel)) return null;
      return { type: 'embed', url: `https://player.twitch.tv/?${new URLSearchParams({ channel, parent: hostname, autoplay: 'true', muted: 'true' })}` };
    }
    return { type: /\.m3u8([?#]|$)/i.test(url.href) ? 'hls' : 'video', url: url.href };
  } catch { return null; }
}

export default function StreamMedia({ url, poster, title, preview = false, active = true, offline = false }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  const [failed, setFailed] = useState(false);
  const [muted, setMuted] = useState(true);
  const media = useMemo(() => resolveMedia(url, window.location.hostname, preview), [url, preview]);

  useEffect(() => {
    setFailed(false); setMuted(true);
    const video = videoRef.current;
    if (!video || !media || media.type === 'embed') return;
    let cancelled = false;
    if (media.type === 'hls' && !video.canPlayType('application/vnd.apple.mpegurl')) {
      import('hls.js').then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) { setFailed(true); return; }
        const hls = new Hls({ autoStartLoad: activeRef.current, capLevelToPlayerSize: true, maxBufferLength: preview ? 10 : 30 });
        hlsRef.current = hls;
        hls.loadSource(media.url); hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => { if (activeRef.current) video.play().catch(() => {}); });
        hls.on(Hls.Events.ERROR, (_, error) => { if (error.fatal) { setFailed(true); hls.destroy(); hlsRef.current = null; } });
      }).catch(() => { if (!cancelled) setFailed(true); });
    } else { video.src = media.url; if (activeRef.current) video.play().catch(() => {}); }
    return () => { cancelled = true; hlsRef.current?.destroy(); hlsRef.current = null; video.pause(); video.removeAttribute('src'); video.load(); };
  }, [media, preview]);
  useEffect(() => {
    if (active) { hlsRef.current?.startLoad(); videoRef.current?.play()?.catch(() => {}); }
    else { videoRef.current?.pause(); hlsRef.current?.stopLoad(); }
  }, [active]);

  return <div className={`console-media ${preview ? 'is-preview' : ''}`}>
    {poster && <img className="console-media-poster" src={poster} alt="" />}
    {media && !failed && (media.type === 'embed'
      ? active && <iframe src={media.url} title={title || 'Live stream'} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" tabIndex={preview ? -1 : 0} />
      : <video ref={videoRef} poster={poster} controls={!preview} autoPlay={active} muted={muted} playsInline loop={preview && media.type === 'video'} preload={preview ? 'none' : 'metadata'} aria-label={title || 'Live stream'} onError={() => setFailed(true)} onVolumeChange={(event) => setMuted(event.currentTarget.muted)} />)}
    {(!media || failed) && !preview && <div className="console-media-empty"><Radio size={28} /><p>{offline ? 'This broadcast has ended.' : failed ? 'This broadcast is temporarily unavailable.' : 'This channel has not shared a playback link yet.'}</p></div>}
    {!preview && media && media.type !== 'embed' && muted && !failed && <button type="button" className="console-unmute" onClick={() => { if (videoRef.current) videoRef.current.muted = false; setMuted(false); }}><Volume2 size={16} />Sound on</button>}
  </div>;
}
