import React, { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';

export default function GameImage({ src, fallback, alt = '', className = '', ...props }) {
  const [failed, setFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);
  useEffect(() => { setFailed(false); setFallbackFailed(false); }, [src, fallback]);
  const current = failed ? fallback : src || fallback;
  if (!current || fallbackFailed || (failed && (!fallback || fallback === src))) {
    return <div className={'gd-image-fallback ' + className} role={alt ? 'img' : undefined} aria-label={alt || undefined}><ImageOff size={28} aria-hidden="true" /><span>Artwork unavailable</span></div>;
  }
  return <img {...props} src={current} alt={alt} className={className} onError={() => failed || !src ? setFallbackFailed(true) : setFailed(true)} />;
}
