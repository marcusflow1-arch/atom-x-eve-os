import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import WaterRippleAvatar from './WaterRippleAvatar';

const DEFAULT_PROFILE = {
  name: 'NeonRider',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop',
  bio: "I explore the darkest corners of cyberpunk lore so you don't have to.",
  traits: ['Lore-Focused', 'Story-Driven', 'High Empathy', 'Risk-Moderate']
};

export default function PersonalityCarousel({ profile = DEFAULT_PROFILE }) {
  const slides = useMemo(() => ([
    { key: 'identity', title: 'Identity', content: profile.bio },
    { key: 'traits', title: 'Traits', content: profile.traits.join(' • ') },
    { key: 'focus', title: 'Focus', content: 'Stream focus: Lore, RPG, Narrative Q&A' },
  ]), [profile]);

  const [index, setIndex] = useState(0);
  const next = () => setIndex((i) => (i + 1) % slides.length);
  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);

  return (
    <section className="h-full w-full flex flex-col items-center">
      {/* Avatar with Water Ripple Frame (#22) */}
      <div className="pt-4 md:pt-6">
        <WaterRippleAvatar src={profile.avatar} name={profile.name} />
      </div>

      {/* Carousel header */}
      <div className="mt-4 text-center">
        <div className="text-white/90 text-xl font-semibold tracking-wide flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-300" />
          {profile.name}
        </div>
        <div className="text-white/40 text-xs tracking-wider uppercase">Personality</div>
      </div>

      {/* Carousel body with Dark Semi-Transparent Layer (#24) */}
      <div className="relative w-full max-w-2xl mt-4 px-3 md:px-0">
        <div
          className="rounded-2xl p-5 md:p-6 border"
          style={{
            background: 'rgba(10,12,20,0.55)',
            borderColor: 'rgba(255,255,255,0.10)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
          }}
        >
          <div className="text-white/80 text-base md:text-lg leading-relaxed min-h-[88px]">
            {slides[index].content}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={prev}
              className="px-3 py-2 rounded-xl text-white/70 hover:text-white border border-white/10 hover:bg-white/5 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-1.5">
              {slides.map((s, i) => (
                <span key={s.key} className={`w-2 h-2 rounded-full ${i===index ? 'bg-cyan-400' : 'bg-white/20'}`} />
              ))}
            </div>
            <button
              onClick={next}
              className="px-3 py-2 rounded-xl text-white/70 hover:text-white border border-white/10 hover:bg-white/5 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}