import React, { useMemo } from "react";

export default function InterestsSlide({ streamers = [] }) {
  const tags = useMemo(() => {
    const map = new Map();
    streamers.forEach((s) => {
      if (Array.isArray(s.tags)) {
        s.tags.forEach((t) => map.set(t, (map.get(t) || 0) + 1));
      }
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 18);
  }, [streamers]);

  return (
    <div className="p-4 md:p-6 h-full overflow-auto">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Interests</h2>
      <p className="text-white/60 text-sm mb-4">Popular topics among streamers right now.</p>
      <div className="flex flex-wrap gap-2">
        {tags.map(([t, c]) => (
          <span
            key={t}
            className="px-3 py-1.5 rounded-full text-sm text-white/90"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(8px)",
            }}
          >
            {t} <span className="text-white/50">· {c}</span>
          </span>
        ))}
        {tags.length === 0 && <span className="text-white/60">No interests yet.</span>}
      </div>
    </div>
  );
}