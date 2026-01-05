import React from "react";

export default function VideoBox({
  title = "Elder Scrolls Online",
  keyArtUrl = "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=1200&auto=format&fit=crop",
}) {
  return (
    <div className="rounded-3xl overflow-hidden border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl mb-8">
      <div className="relative aspect-video w-full">
        <img src={keyArtUrl} alt={`${title} key art`} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/40 border border-white/10 text-white/90 text-xs">
          {title}
        </div>
      </div>
    </div>
  );
}