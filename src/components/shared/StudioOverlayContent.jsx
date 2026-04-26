import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, Calendar, Star, ArrowRight } from 'lucide-react';

const STUDIO_DATA = {
  'naughty-dog': {
    id: 'naughty-dog',
    name: 'Naughty Dog',
    tagline: 'Crafting Extraordinary Games',
    description: 'Award-winning developer creating narrative-driven experiences.',
    philosophy: 'We believe in the power of games to move people emotionally.',
    founded: 1984,
    location: 'Santa Monica, California',
    primaryColor: '#DC2626',
    logo: '🎮',
    games: [
      { id: 1, title: 'The Last of Us Part II', rating: 9.2 },
      { id: 2, title: 'Uncharted 4', rating: 9.3 },
      { id: 3, title: 'Intergalactic: The Heretic Prophet', rating: 8.8 },
    ]
  },
  'supergiant': {
    id: 'supergiant',
    name: 'Supergiant Games',
    tagline: 'Small Developer, Big Ambitions',
    description: 'Independent studio known for beautifully crafted indie games with stunning visuals.',
    philosophy: 'We create games that spark imagination with unforgettable music.',
    founded: 2009,
    location: 'San Francisco, California',
    primaryColor: '#7C3AED',
    logo: '✨',
    games: [
      { id: 1, title: 'Hades II', rating: 9.1 },
      { id: 2, title: 'Transistor', rating: 8.5 },
      { id: 3, title: 'Bastion', rating: 8.7 },
    ]
  },
  'bethesda': {
    id: 'bethesda',
    name: 'Bethesda Game Studios',
    tagline: 'Where Worlds Come Alive',
    description: 'Creating some of the most ambitious and immersive gaming universes.',
    philosophy: 'We believe in creating living, breathing worlds where players can forge their own paths.',
    founded: 1986,
    location: 'Rockville, Maryland',
    primaryColor: '#1F5FA0',
    logo: '🎮',
    games: [
      { id: 1, title: 'Starfield', rating: 8.4 },
      { id: 2, title: 'The Elder Scrolls V: Skyrim', rating: 9.4 },
      { id: 3, title: 'Fallout 4', rating: 8.9 },
    ]
  }
};

export default function StudioOverlayContent() {
  const [activeStudio, setActiveStudio] = useState('naughty-dog');
  const studio = STUDIO_DATA[activeStudio];

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Studio Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-start gap-6 mb-8">
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl font-bold"
              style={{ background: `${studio.primaryColor}20`, border: `1px solid ${studio.primaryColor}60` }}
            >
              {studio.logo}
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-black text-white mb-2">{studio.name}</h2>
              <p className="text-lg text-white/60 mb-4">{studio.tagline}</p>
              <p className="text-white/70 leading-relaxed">{studio.description}</p>
            </div>
          </div>

          {/* Studio Info Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div
              className="p-4 rounded-lg border"
              style={{ 
                background: `${studio.primaryColor}10`,
                borderColor: `${studio.primaryColor}40`
              }}
            >
              <div className="flex items-center gap-2 text-xs text-white/60 uppercase tracking-wider mb-2">
                <Calendar className="w-3 h-3" />
                Founded
              </div>
              <p className="text-2xl font-bold text-white">{studio.founded}</p>
            </div>
            <div
              className="p-4 rounded-lg border"
              style={{ 
                background: `${studio.primaryColor}10`,
                borderColor: `${studio.primaryColor}40`
              }}
            >
              <div className="flex items-center gap-2 text-xs text-white/60 uppercase tracking-wider mb-2">
                <Building2 className="w-3 h-3" />
                Location
              </div>
              <p className="text-sm text-white font-medium">{studio.location}</p>
            </div>
            <div
              className="p-4 rounded-lg border"
              style={{ 
                background: `${studio.primaryColor}10`,
                borderColor: `${studio.primaryColor}40`
              }}
            >
              <div className="flex items-center gap-2 text-xs text-white/60 uppercase tracking-wider mb-2">
                <Users className="w-3 h-3" />
                Active Games
              </div>
              <p className="text-2xl font-bold text-white">{studio.games.length}</p>
            </div>
          </div>
        </motion.div>

        {/* Featured Games */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h3 className="text-xl font-bold text-white mb-6">Featured Games</h3>
          <div className="grid grid-cols-3 gap-4">
            {studio.games.map((game, idx) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
                className="p-4 rounded-lg border"
                style={{ 
                  background: `${studio.primaryColor}10`,
                  borderColor: `${studio.primaryColor}40`
                }}
              >
                <h4 className="text-sm font-bold text-white mb-3">{game.title}</h4>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-3 h-3 fill-current" />
                  <span className="text-xs font-semibold">{game.rating}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Studio Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="pt-8 border-t border-white/10"
        >
          <p className="text-xs text-white/60 uppercase tracking-widest font-bold mb-4">Explore Studios</p>
          <div className="flex gap-3 flex-wrap">
            {Object.values(STUDIO_DATA).map(st => (
              <button
                key={st.id}
                onClick={() => setActiveStudio(st.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                  activeStudio === st.id 
                    ? 'text-white border-2' 
                    : 'text-white/60 border-white/20 hover:text-white'
                }`}
                style={{
                  borderColor: activeStudio === st.id ? st.primaryColor : 'rgba(255,255,255,0.2)',
                  background: activeStudio === st.id ? `${st.primaryColor}15` : 'transparent'
                }}
              >
                {st.name}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}