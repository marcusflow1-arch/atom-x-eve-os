import React, { useEffect, useRef, useState } from "react";
import WaterTubeVolumeSlider from "@/components/streaming/WaterTubeVolumeSlider";
import NeonSubscribeButton from "@/components/streaming/NeonSubscribeButton";
import WaterVortexSpinner from "@/components/streaming/WaterVortexSpinner";

export default function HighRefractionVideoPlayer({
  src = "https://cdn.coverr.co/videos/coverr-person-playing-a-video-game-with-a-controller-5396/1080p.mp4",
  poster = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=675&fit=crop&auto=format",
}) {
  const videoRef = useRef(null);
  const [initializing, setInitializing] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onLoadStart = () => setInitializing(true);
    const onCanPlay = () => setInitializing(false);
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);
    const onStalled = () => setBuffering(true);

    v.addEventListener("loadstart", onLoadStart);
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("stalled", onStalled);

    // Autoplay if allowed
    const tryPlay = async () => {
      try {
        await v.play();
      } catch (_) {
        // Autoplay blocked; keep controls/overlays visible
      }
    };
    tryPlay();

    return () => {
      v.removeEventListener("loadstart", onLoadStart);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("stalled", onStalled);
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
      videoRef.current.volume = volume;
    }
  }, [muted, volume]);

  return (
    <div
      className="relative w-full h-[64vh] md:h-[68vh] rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow:
          "0 30px 90px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 0 120px rgba(255,255,255,0.06)",
        backdropFilter: "blur(18px) saturate(160%)",
        WebkitBackdropFilter: "blur(18px) saturate(160%)",
      }}
    >
      {/* Refraction edge sheen */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 120% at 0% 0%, rgba(255,255,255,0.25), transparent 60%), radial-gradient(90% 90% at 100% 0%, rgba(146,209,255,0.2), transparent 55%)",
          mixBlendMode: "screen",
        }}
      />

      <video
        ref={videoRef}
        playsInline
        autoPlay
        loop
        poster={poster}
        className="absolute inset-0 w-full h-full object-cover"
        src={src}
      />

      {/* Overlays during initialization */}
      {(initializing || buffering) && (
        <div className="absolute inset-0 grid place-items-center bg-black/20">
          <WaterVortexSpinner />
        </div>
      )}

      {/* Controls overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top-right Subscribe */}
        <div className="absolute top-4 right-4 pointer-events-auto">
          <NeonSubscribeButton />
        </div>

        {/* Bottom-right volume tube */}
        <div className="absolute bottom-4 right-4 pointer-events-auto">
          <WaterTubeVolumeSlider
            value={muted ? 0 : volume}
            onChange={(v) => setVolume(v)}
            onToggleMute={() => setMuted((m) => !m)}
          />
        </div>
      </div>
    </div>
  );
}