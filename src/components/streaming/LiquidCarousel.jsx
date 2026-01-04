import React, { useEffect, useMemo, useRef, useState } from "react";

export default function LiquidCarousel({ children, intervalMs = 15000 }) {
  const slides = useMemo(() => React.Children.toArray(children).filter(Boolean), [children]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (slides.length <= 1) return;
    if (paused) return;

    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length, intervalMs, paused]);

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides track */}
      <div
        className="flex h-full"
        style={{
          width: `${slides.length * 100}%`,
          transform: `translateX(-${index * (100 / slides.length)}%)`,
          transition: "transform 1200ms cubic-bezier(0.22, 0.61, 0.36, 1)",
        }}
      >
        {slides.map((slide, i) => (
          <div key={i} className="w-full flex-shrink-0 h-full">
            {slide}
          </div>
        ))}
      </div>

      {/* Subtle liquid sheen overlay */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute -inset-[20%] opacity-20"
          style={{
            background:
              "radial-gradient(1200px 600px at 10% 10%, rgba(59,130,246,0.18), transparent 60%), radial-gradient(800px 400px at 90% 80%, rgba(34,211,238,0.15), transparent 55%)",
            filter: "blur(20px)",
          }}
        />
      </div>

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "bg-white/90 w-6" : "bg-white/40 w-3 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}