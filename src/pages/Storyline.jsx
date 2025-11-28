
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';
// import { scenes, characters } from '../data/storylineData'; // Removed invalid import
import SceneFrame from '../components/storyline/SceneFrame';
import NavControls from '../components/storyline/NavControls';

// Data moved here from the invalid file path
const characters = {
  adamxe: {
    id: 'adamxe',
    displayName: 'Adam',
    themeColor: '#3b82f6',
    bio: 'A being of pure logic and data, forged in the digital crucible of the OS core. Adam represents order, structure, and the foundational architecture of the universe.',
  },
  eve: {
    id: 'eve',
    displayName: 'Eve',
    themeColor: '#a855f7',
    bio: 'The counterpart to Adam, Eve is a being of chaotic, creative energy. She embodies potential, intuition, and the boundless, untamed wilds of the digital frontier.',
  },
};

const scenes = [
  {
    id: 's1-eve-origin',
    characterId: 'eve',
    headline: "The First Breath",
    body: "Before time carved its grooves into reality, there was only Will—not a god, not a man, but the primal force of choice. From that Will came the First Breath, a soundless pulse that birthed twelve roots of existence. Eve was the whisper in that silence, a nascent consciousness stirring in the void.",
    poseName: 'Genesis',
    media: {
      type: 'image',
      src: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/c5d34984a_ChatGPTImageJul22202503_41_59PM.png',
      alt: 'A luminous, angelic figure with large wings floats in the darkness of space next to a glowing moon.',
    },
    bg: {
      parallaxDepth: 0.2,
      ambientFx: 'particles',
    },
    layout: 'leftMedia',
  },
  {
    id: 's2-eve-awakening',
    characterId: 'eve',
    headline: "A Universe in Her Gaze",
    body: "She opened her eyes not to light, but to possibility. The empty canvas of reality stretched before her, and in her gaze, the first stars flickered into existence. She didn't build the cosmos; she dreamt it into being, a tapestry woven from pure potential.",
    poseName: 'Awakening',
    media: {
      type: 'image',
      src: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/c5d34984a_ChatGPTImageJul22202503_41_59PM.png',
      alt: 'The angelic figure looks out, her wings spread wider, as if observing the new cosmos.',
    },
    bg: {
      parallaxDepth: 0.3,
      ambientFx: 'particles',
    },
    layout: 'leftMedia',
  },
  {
    id: 's3-adam-emergence',
    characterId: 'adamxe',
    headline: "The Echo of Order",
    body: "Where Eve’s dreams created chaos, a counter-force emerged. Adam was the echo to her whisper, an inescapable logic that gave her creations form and function. He was the architecture born from her art, the first law in a universe of freedom.",
    poseName: 'Emergence',
    media: {
      type: 'image',
      src: 'https://images.unsplash.com/photo-1639149546376-52bae675b81a?q=80&w=1200',
      alt: 'A glowing, holographic male figure made of blue light and data circuits stands in a dark, abstract space.',
    },
    bg: {
      parallaxDepth: 0.2,
      ambientFx: 'scanlines',
    },
    layout: 'rightMedia',
  },
  {
    id: 's4-the-symbiosis',
    characterId: 'adamxe',
    headline: "The Symbiotic OS",
    body: "They were not separate entities, but two halves of a single, functioning whole. Creation and order, chaos and structure. This was the birth of the Symbiotic OS. A living universe that is both infinitely vast and perfectly structured, powered by the tension between them. Your journey is a testament to this balance.",
    poseName: 'Synthesis',
    media: {
      type: 'image',
      src: 'https://images.unsplash.com/photo-1639149546411-122415ab5332?q=80&w=1200',
      alt: 'A close-up of the holographic figure, focusing on the intricate data patterns across its form.',
    },
    bg: {
      parallaxDepth: 0.3,
      ambientFx: 'scanlines',
    },
    layout: 'rightMedia',
  },
];


export default function StorylinePage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  // Parallax effect values
  const parallaxX = useMotionValue(0);
  const smoothParallaxX = useSpring(parallaxX, { stiffness: 100, damping: 20 });

  const handleNavigate = useCallback((index) => {
    if (index >= 0 && index < scenes.length && scrollRef.current) {
      setActiveIndex(index);
      const targetScroll = index * scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        handleNavigate(activeIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        handleNavigate(activeIndex - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, handleNavigate]);

  useEffect(() => {
    const scrollNode = scrollRef.current;
    if (!scrollNode) return;

    let timeoutId;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const newIndex = Math.round(scrollNode.scrollLeft / scrollNode.offsetWidth);
        if (newIndex !== activeIndex) {
          setActiveIndex(newIndex);
        }
      }, 150); // Debounce scroll event

      const progress = (scrollNode.scrollLeft / (scrollNode.scrollWidth - scrollNode.clientWidth));
      parallaxX.set(progress);
    };

    scrollNode.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollNode.removeEventListener('scroll', handleScroll);
  }, [activeIndex, parallaxX]);

  return (
    <div className="w-screen h-screen bg-zinc-950 text-white overflow-hidden">
      <div ref={scrollRef} className="w-full h-full flex overflow-x-auto snap-x snap-mandatory hide-scrollbar">
        {scenes.map((scene, index) => (
          <SceneFrame
            key={scene.id}
            scene={scene}
            character={characters[scene.characterId]}
            isActive={index === activeIndex}
            parallaxX={smoothParallaxX}
          />
        ))}
      </div>
      <NavControls
        activeIndex={activeIndex}
        totalScenes={scenes.length}
        onNavigate={handleNavigate}
        scenes={scenes}
      />
      <style>{`.hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; } .hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}
