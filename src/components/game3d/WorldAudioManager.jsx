import { useEffect, useRef } from 'react';

/**
 * Manages background music for the 3D game world.
 * Plays the theme audio from HeroBackground when in the world.
 */
export default function WorldAudioManager({ themeAudioUrl, soundVolume = 1.0 }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!themeAudioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(themeAudioUrl);
      audioRef.current.loop = true;
      audioRef.current.volume = soundVolume;
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.volume = soundVolume;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [themeAudioUrl, soundVolume]);

  // Render nothing — this is just for audio management
  return null;
}