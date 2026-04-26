import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, ExternalLink, Star, Users, Gamepad2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Mock studio data - can be extended with real data from database
const STUDIO_DATA = {
  'naughty-dog': {
    id: 'naughty-dog',
    name: 'Naughty Dog',
    tagline: 'Crafting Extraordinary Games',
    description: 'Naughty Dog is an American video game developer and subsidiary of Sony Interactive Entertainment. Founded in 1984, we are committed to creating innovative and emotionally resonant gaming experiences that push the boundaries of interactive storytelling.',
    philosophy: 'We believe in the power of games to move people emotionally. Our focus is on narrative-driven experiences that blend cinematic presentation with engaging gameplay.',
    founded: 1984,
    location: 'Santa Monica, California',
    primaryColor: '#DC2626',
    secondaryColor: '#1F2937',
    accentColor: '#F97316',
    heroImage: 'https://images.unsplash.com/photo-1538481527238-c5a6e5a34c16?w=1200&h=600&fit=crop',
    logo: '🎮',
    games: [
      { id: 1, title: 'The Last of Us Part II', genre: 'Action-Adventure', rating: 9.2, image: 'https://images.unsplash.com/photo-1460925895917-adf4e5e3c9b5?w=300&h=400&fit=crop' },
      { id: 2, title: 'Uncharted 4', genre: 'Action-Adventure', rating: 9.3, image: 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=300&h=400&fit=crop' },
      { id: 3, title: 'Intergalactic: The Heretic Prophet', genre: 'Action-Adventure', rating: 8.8, image: 'https://images.unsplash.com/photo-1556438328-b6760a6eda4e?w=300&h=400&fit=crop' },
    ]
  },
  'supergiant': {
    id: 'supergiant',
    name: 'Supergiant Games',
    tagline: 'Small Developer, Big Ambitions',
    description: 'Supergiant Games is an independent video game developer known for creating beautifully crafted indie games. Since our founding, we\'ve focused on artistry, emotional storytelling, and memorable soundtracks.',
    philosophy: 'We create games that spark imagination like the games you played as a kid. Each title is a labor of love combining stunning visuals with unforgettable music.',
    founded: 2009,
    location: 'San Francisco, California',
    primaryColor: '#7C3AED',
    secondaryColor: '#1E1B4B',
    accentColor: '#EC4899',
    heroImage: 'https://images.unsplash.com/photo-1535869797c3-4b61b3f0fbf9?w=1200&h=600&fit=crop',
    logo: '✨',
    games: [
      { id: 1, title: 'Hades II', genre: 'Roguelike', rating: 9.1, image: 'https://images.unsplash.com/photo-1551863775-4ac6e30696b6?w=300&h=400&fit=crop' },
      { id: 2, title: 'Transistor', genre: 'Action RPG', rating: 8.5, image: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=300&h=400&fit=crop' },
      { id: 3, title: 'Bastion', genre: 'Action RPG', rating: 8.7, image: 'https://images.unsplash.com/photo-1516905041604-1c1e1c84c397?w=300&h=400&fit=crop' },
    ]
  },
  'bethesda': {
    id: 'bethesda',
    name: 'Bethesda Game Studios',
    tagline: 'Where Worlds Come Alive',
    description: 'Bethesda Game Studios is a world-renowned developer creating some of the most ambitious and immersive gaming universes. From the expansive worlds of The Elder Scrolls and Fallout franchises to innovative new experiences like Starfield, we craft games that captivate millions of players worldwide.',
    philosophy: 'We believe in creating living, breathing worlds where players can forge their own paths and stories. Our focus is on player freedom, deep roleplay mechanics, and immersive environments that challenge the boundaries of interactive entertainment.',
    founded: 1986,
    location: 'Rockville, Maryland',
    primaryColor: '#1F5FA0',
    secondaryColor: '#0D0F12',
    accentColor: '#FFB81C',
    heroImage: 'https://images.unsplash.com/photo-1538481527238-c5a6e5a34c16?w=1200&h=600&fit=crop',
    logo: '🎮',
    games: [
      { id: 1, title: 'Starfield', genre: 'Action RPG', rating: 8.4, image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=400&fit=crop' },
      { id: 2, title: 'The Elder Scrolls V: Skyrim', genre: 'Action RPG', rating: 9.4, image: 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=300&h=400&fit=crop' },
      { id: 3, title: 'Fallout 4', genre: 'Action RPG', rating: 8.9, image: 'https://images.unsplash.com/photo-1556438328-b6760a6eda4e?w=300&h=400&fit=crop' },
    ]
  }
};

function StudioGameCard({ game, studioColor }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer"
      style={{
        background: `linear-gradient(135deg, rgba(${parseInt(studioColor.slice(1,3), 16)}, ${parseInt(studioColor.slice(3,5), 16)}, ${parseInt(studioColor.slice(5,7), 16)}, 0.1) 0%, transparent 100%)`,
        border: `1px solid ${studioColor}40`
      }}
    >
      <img 
        src={game.image} 
        alt={game.title} 
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform">
        <h4 className="text-white font-bold text-sm mb-2">{game.title}</h4>
        <div className="flex items-center justify-between text-xs text-white/80">
          <span>{game.genre}</span>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span>{game.rating}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function DevStudio() {
  const navigate = useNavigate();
  const [activeStudio, setActiveStudio] = useState('naughty-dog');
  
  const studio = STUDIO_DATA[activeStudio];
  const rgb = studio.primaryColor.slice(1).match(/.{1,2}/g).map(x => parseInt(x, 16)).join(', ');

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar" style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}>
      {/* HERO SECTION */}
      <div className="relative w-full h-[500px] overflow-hidden">
        {/* Background with overlay */}
        <div className="absolute inset-0">
          <img 
            src={studio.heroImage} 
            alt={studio.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
          <div className="absolute inset-0" style={{
            background: `radial-gradient(circle at 100% 50%, rgba(${rgb}, 0.3), transparent 60%)`
          }} />
        </div>

        {/* Hero Content */}
        <div className="relative h-full flex items-center px-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-4 mb-6">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-bold shadow-lg"
                style={{ background: `linear-gradient(135deg, ${studio.primaryColor}, ${studio.accentColor})` }}
              >
                {studio.logo}
              </div>
              <div>
                <h1 className="text-5xl font-black text-white tracking-tight mb-2">{studio.name}</h1>
                <p className="text-xl text-white/80">{studio.tagline}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-8">
              <button 
                className="px-6 py-3 rounded-lg font-bold text-white transition-all hover:scale-105"
                style={{ background: `linear-gradient(135deg, ${studio.primaryColor}, ${studio.accentColor})`, boxShadow: `0 0 30px ${studio.primaryColor}40` }}
              >
                View Portfolio
              </button>
              <button className="px-6 py-3 rounded-lg font-bold text-white/80 border border-white/20 hover:bg-white/10 transition-all flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Official Site
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-12 py-16">
        {/* Studio Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
          style={{
            background: `linear-gradient(135deg, rgba(${rgb}, 0.08), transparent)`,
            border: `1px solid ${studio.primaryColor}30`,
            borderRadius: '16px',
            padding: '32px',
            backdropFilter: 'blur(20px)'
          }}
        >
          <div className="grid grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 text-sm text-white/60 uppercase tracking-wider mb-2">
                <Building2 className="w-4 h-4" />
                Founded
              </div>
              <p className="text-3xl font-bold text-white">{studio.founded}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-white/60 uppercase tracking-wider mb-2">
                <Users className="w-4 h-4" />
                Location
              </div>
              <p className="text-xl text-white">{studio.location}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-white/60 uppercase tracking-wider mb-2">
                <Gamepad2 className="w-4 h-4" />
                Active Games
              </div>
              <p className="text-3xl font-bold text-white">{studio.games.length}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-3">Studio Philosophy</h3>
              <p className="text-white/70 leading-relaxed">{studio.philosophy}</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-3">About</h3>
              <p className="text-white/70 leading-relaxed">{studio.description}</p>
            </div>
          </div>
        </motion.div>

        {/* Games Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-4xl font-black text-white mb-2">Featured Games</h2>
              <p className="text-white/60">Explore the incredible portfolio</p>
            </div>
            <button className="px-6 py-3 rounded-lg text-white/80 border border-white/20 hover:bg-white/10 transition-all flex items-center gap-2 group">
              View All
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-20">
            {studio.games.map((game, idx) => (
              <StudioGameCard key={game.id} game={game} studioColor={studio.primaryColor} />
            ))}
          </div>
        </motion.div>

        {/* Studio Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="py-16 text-center border-t border-white/10"
        >
          <p className="text-white/60 mb-6">Explore Other Studios</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {Object.values(STUDIO_DATA).map(st => (
              <button
                key={st.id}
                onClick={() => setActiveStudio(st.id)}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${
                  activeStudio === st.id 
                    ? 'text-white border-2' 
                    : 'text-white/60 border border-white/20 hover:text-white'
                }`}
                style={{
                  borderColor: activeStudio === st.id ? st.primaryColor : 'rgba(255,255,255,0.2)',
                  background: activeStudio === st.id ? `${st.primaryColor}20` : 'transparent'
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