import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NavControls({ activeIndex, totalScenes, onNavigate, scenes }) {
  return (
    <>
      {/* Arrow Navigation */}
      <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex justify-between pointer-events-none z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="pointer-events-auto rounded-full w-12 h-12 bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white disabled:opacity-30"
          aria-label="Previous Scene"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate(activeIndex + 1)}
          disabled={activeIndex === totalScenes - 1}
          className="pointer-events-auto rounded-full w-12 h-12 bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white disabled:opacity-30"
          aria-label="Next Scene"
        >
          <ArrowRight className="w-6 h-6" />
        </Button>
      </div>

      {/* Dot Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {scenes.map((scene, index) => (
          <button
            key={scene.id}
            onClick={() => onNavigate(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              activeIndex === index ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Go to scene ${index + 1}: ${scene.headline}`}
          />
        ))}
      </div>
    </>
  );
}