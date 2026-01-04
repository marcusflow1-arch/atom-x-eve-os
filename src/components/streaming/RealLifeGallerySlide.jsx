import React from "react";

export default function RealLifeGallerySlide() {
  const images = [
    "https://images.unsplash.com/photo-1558980664-10fc00d4fd04?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop&auto=format",
  ];

  return (
    <div className="p-4 md:p-6 h-full overflow-auto">
      <div className="mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-white">Real Life Gallery</h2>
        <p className="text-white/60 text-sm">Photos and vibes from the community.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {images.map((src, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-xl ring-1 ring-white/10 shadow-lg"
            style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(10px)" }}
          >
            <img
              src={src}
              alt={`gallery-${i}`}
              className="w-full h-40 md:h-48 object-cover transition-transform duration-500 ease-out hover:scale-[1.05]"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}