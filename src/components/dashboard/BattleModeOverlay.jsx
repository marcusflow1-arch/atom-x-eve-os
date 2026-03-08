import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Swords, Target, Flame, Zap, Shield, X, Map as MapIcon, 
  Crosshair, Trophy, Globe, ChevronLeft, Search, Navigation
} from 'lucide-react';
import PvPConsole from '@/components/battle/PvPConsole';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- Constants & Data ---

const PVP_GENRES = [
  {
    id: 'fighting',
    name: 'Fighting',
    icon: Swords,
    description: 'Close quarters combat mastery',
    styles: [
      { 
        id: 'tenkaichi', 
        name: 'Z-Arena Style', 
        description: '3D fly-around combat similar to Dragon Ball Tenkaichi 3. High speed, destructible environments.',
        image: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=800&q=80'
      },
      { 
        id: 'mvc', 
        name: 'Hyper Versus', 
        description: 'Team-based chaos with massive assists and air combos akin to MvC3.',
        image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80'
      },
      { 
        id: 'tekken', 
        name: 'Iron Fist Style', 
        description: 'Grounded, technical 3D martial arts focused on spacing and punishment.',
        image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&q=80'
      }
    ]
  },
  {
    id: 'shooting',
    name: 'Shooting',
    icon: Crosshair,
    description: 'Tactical ranged warfare',
    styles: [
      { 
        id: 'tactical', 
        name: 'Tac-Shooter', 
        description: 'Precise, objective-based 5v5 combat. One life per round.',
        image: 'https://images.unsplash.com/photo-1533236897111-3e94666b2edf?w=800&q=80'
      },
      { 
        id: 'arena', 
        name: 'Arena Quake', 
        description: 'Fast movement, jump pads, and power weapon control.',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80'
      },
      { 
        id: 'royale', 
        name: 'Survival Zone', 
        description: 'Drop in, loot up, be the last one standing.',
        image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80'
      }
    ]
  }
];

const TOURNAMENTS = [
  { id: 1, name: 'Sunday Showdown', prize: '$5,000', entry: 'Free', status: 'Registering', game: 'Z-Arena Style' },
  { id: 2, name: 'Pro League Qualifier', prize: '$25,000', entry: '$50', status: 'Live', game: 'Hyper Versus' },
  { id: 3, name: 'Community Cup', prize: '$500', entry: 'Free', status: 'Upcoming', game: 'Tac-Shooter' },
];

const WORLD_EVENTS = [
  { id: 1, name: 'The Void Invasion', type: 'Raid Boss', reward: 'Legendary Gear', status: 'Active' },
  { id: 2, name: 'Double XP Weekend', type: 'Bonus', reward: '2x XP', status: 'Active' },
  { id: 3, name: 'Faction War: Red vs Blue', type: 'PvP Event', reward: 'Exclusive Skins', status: 'Starts in 2h' },
];

// --- Sub-Components ---

const PvPView = ({ onBack }) => {
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [inQueue, setInQueue] = useState(false);

  if (inQueue) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-32 h-32 relative mb-12">
          <div className="absolute inset-0 rounded-full border border-white/10 animate-ping opacity-20" />
          <div className="absolute inset-0 rounded-full border border-white/20 animate-spin opacity-40" style={{ borderTopColor: 'transparent', borderLeftColor: 'transparent' }} />
          <div className="absolute inset-4 rounded-full border border-orange-500/20 animate-reverse-spin opacity-60" style={{ borderTopColor: 'transparent', borderRightColor: 'transparent' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Swords className="w-8 h-8 text-white/80 animate-pulse" />
          </div>
        </div>
        
        <h2 className="text-2xl font-light text-white mb-2 tracking-wider uppercase">Searching for Opponent</h2>
        <div className="h-px w-16 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent mb-6" />
        
        <p className="text-white/40 text-sm mb-12 font-light">
          Protocol: <span className="text-orange-400 font-normal">{selectedStyle.name}</span> <span className="text-white/20 mx-2">|</span> {selectedGenre.name}
        </p>
        
        <button 
          onClick={() => setInQueue(false)}
          className="px-10 py-3 bg-white/[0.03] hover:bg-white/[0.08] text-white/60 hover:text-white border border-white/10 hover:border-red-500/30 rounded-full transition-all duration-300 text-xs tracking-widest uppercase"
        >
          Abort Sequence
        </button>
      </div>
    );
  }

  if (selectedGenre) {
    return (
      <div className="w-full h-full flex flex-col p-12">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl font-thin text-white mb-2 tracking-wide uppercase">{selectedGenre.name}</h2>
            <p className="text-white/40 font-light tracking-wide text-sm">Select Combat Style</p>
          </div>
          <button onClick={() => setSelectedGenre(null)} className="text-white/40 hover:text-white transition-colors text-xs tracking-widest uppercase">
            Cancel Selection
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {selectedGenre.styles.map((style, i) => (
            <motion.div 
              key={style.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelectedStyle(style)}
              className={`group relative h-[450px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ${selectedStyle?.id === style.id ? 'ring-1 ring-white/50 scale-[1.02]' : 'hover:ring-1 hover:ring-white/20'}`}
            >
              {/* Background Image with Overlay */}
              <div className="absolute inset-0 bg-black">
                <img 
                  src={style.image} 
                  alt={style.name} 
                  className={`w-full h-full object-cover transition-all duration-700 opacity-60 group-hover:opacity-80 group-hover:scale-110 ${selectedStyle?.id === style.id ? 'scale-110 opacity-80' : 'grayscale'}`} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              </div>
              
              {/* Content */}
              <div className="absolute bottom-0 left-0 p-8 w-full">
                <div className="mb-4">
                  <h3 className="text-2xl font-light text-white mb-2 tracking-wide">{style.name}</h3>
                  <div className="h-0.5 w-12 bg-white/20 mb-3 group-hover:w-full transition-all duration-500" />
                  <p className="text-white/60 text-xs font-light leading-relaxed">{style.description}</p>
                </div>
                
                <AnimatePresence>
                  {selectedStyle?.id === style.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setInQueue(true);
                        }}
                        className="mt-4 w-full py-4 bg-white text-black font-medium tracking-widest text-xs uppercase rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-3"
                      >
                        <Swords className="w-4 h-4" /> Engage
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-thin text-white mb-3 tracking-[0.2em] uppercase">Combat Discipline</h2>
        <div className="h-px w-20 bg-white/20 mx-auto" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
        {PVP_GENRES.map((genre, i) => (
          <motion.button
            key={genre.id}
            initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => setSelectedGenre(genre)}
            className="group relative h-80 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/20 rounded-3xl overflow-hidden transition-all duration-500"
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <div className="w-24 h-24 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                <genre.icon className="w-10 h-10 text-white/40 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-light text-white mb-2 tracking-widest uppercase group-hover:text-orange-200 transition-colors">{genre.name}</h3>
              <p className="text-white/30 text-xs font-light tracking-wide">{genre.description}</p>
            </div>
            
            {/* Hover Effect Background */}
            <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          </motion.button>
        ))}
      </div>
    </div>
  );
};

const PvEView = ({ onBack }) => {
  const [mode, setMode] = useState(null); // 'ai' or 'explore'

  if (mode === 'explore') {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex items-center justify-between p-6 bg-black/40 backdrop-blur-md border-b border-white/5 z-10">
          <button onClick={() => setMode(null)} className="flex items-center gap-3 text-white/50 hover:text-white transition-colors text-xs tracking-widest uppercase">
            <ChevronLeft className="w-4 h-4" /> Terminate Map
          </button>
          
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-white/80 text-xs font-mono tracking-wider">GPS: ACTIVE</span>
          </div>
        </div>
        
        <div className="flex-1 relative bg-[#050505]">
          <MapContainer 
            center={[40.7128, -74.0060]} 
            zoom={13} 
            style={{ width: '100%', height: '100%', filter: 'grayscale(100%) invert(100%) contrast(90%) brightness(80%)' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {/* Mock Player */}
            <Marker position={[40.7128, -74.0060]}>
              <Popup className="custom-popup">
                <div className="text-xs font-mono">OPERATOR</div>
              </Popup>
            </Marker>
            
            {/* Mock Chests */}
            <Marker position={[40.7150, -74.0090]}>
              <Popup>
                <div className="text-center p-2">
                  <h3 className="font-bold text-sm mb-1">Cache detected</h3>
                  <button className="px-4 py-1 bg-black text-white text-xs border border-white/20">Extract</button>
                </div>
              </Popup>
            </Marker>
          </MapContainer>

          {/* Overlay UI for Exploration */}
          <div className="absolute bottom-8 left-8 z-[400] pointer-events-none">
            <div className="bg-black/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10 pointer-events-auto min-w-[200px]">
              <h4 className="text-white font-light text-xs uppercase tracking-widest mb-4">Scanner Feed</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40">Signal Strength</span>
                  <span className="text-emerald-400">98%</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40">Objects Nearby</span>
                  <span className="text-white">2</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'ai') {
    return (
      <div className="w-full h-full flex flex-col p-8 items-center justify-center">
        <button onClick={() => setMode(null)} className="absolute top-8 left-8 flex items-center gap-3 text-white/50 hover:text-white transition-colors text-xs tracking-widest uppercase">
          <ChevronLeft className="w-4 h-4" /> Abort
        </button>
        
        <div className="text-center mb-12">
          <h2 className="text-3xl font-thin text-white mb-2 tracking-[0.2em] uppercase">Simulation Training</h2>
          <p className="text-white/30 text-xs font-light tracking-wide">Select Difficulty Protocol</p>
        </div>

        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { name: 'Training Dummies', level: '01-10', diff: 'Low', color: 'border-green-500/30' },
            { name: 'Cyber Sentinels', level: '10-30', diff: 'Med', color: 'border-yellow-500/30' },
            { name: 'Void Walkers', level: '30-50', diff: 'High', color: 'border-orange-500/30' },
            { name: 'Omega Boss', level: '50+', diff: 'Ext', color: 'border-red-500/30' },
          ].map((fight, i) => (
            <motion.button 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/20 p-8 rounded-xl flex items-center justify-between group transition-all duration-300 overflow-hidden`}
            >
              <div className="flex items-center gap-6 relative z-10">
                <div className={`w-12 h-12 rounded-full border ${fight.color} bg-white/[0.02] flex items-center justify-center text-xs font-mono text-white/60`}>
                  {fight.level}
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-light text-white mb-1 tracking-wide group-hover:text-white transition-colors">{fight.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-white/60 transition-colors" />
                    <span className="text-white/30 text-xs uppercase tracking-wider">Simulation</span>
                  </div>
                </div>
              </div>
              
              <div className="relative z-10 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0">
                <ChevronLeft className="w-5 h-5 text-white rotate-180" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-thin text-white mb-3 tracking-[0.2em] uppercase">Operations</h2>
        <div className="h-px w-20 bg-white/20 mx-auto" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setMode('ai')}
          className="group relative h-72 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-blue-500/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all duration-500 overflow-hidden"
        >
          <div className="mb-6 p-4 rounded-full bg-blue-500/10 border border-blue-500/20 group-hover:scale-110 transition-transform duration-500">
            <Target className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-light text-white mb-2 tracking-widest uppercase">Combat Sim</h3>
          <p className="text-white/30 text-xs font-light tracking-wide max-w-xs">Engage artificial constructs in controlled environments.</p>
          
          <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </motion.button>

        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setMode('explore')}
          className="group relative h-72 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-emerald-500/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all duration-500 overflow-hidden"
        >
          <div className="mb-6 p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
            <MapIcon className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-xl font-light text-white mb-2 tracking-widest uppercase">World Scan</h3>
          <p className="text-white/30 text-xs font-light tracking-wide max-w-xs">Initialize GPS tracking for resource acquisition.</p>
          
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </motion.button>
      </div>
    </div>
  );
};

const TournamentsView = ({ onBack }) => (
  <div className="w-full h-full p-12 overflow-y-auto">
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-3xl font-thin text-white mb-2 tracking-[0.2em] uppercase">Competitive Events</h2>
          <p className="text-white/30 text-xs font-light tracking-wide">Official Sanctioned Tournaments</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-light text-yellow-400">$30,500</div>
          <div className="text-white/20 text-xs uppercase tracking-widest">Total Active Prize Pool</div>
        </div>
      </div>

      <div className="space-y-4">
        {TOURNAMENTS.map((t, i) => (
          <motion.div 
            key={t.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-xl p-6 flex items-center justify-between transition-all duration-300 overflow-hidden"
          >
            {/* Hover Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="flex items-center gap-8 relative z-10">
              <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center text-white/20 group-hover:text-yellow-400 group-hover:border-yellow-500/30 transition-all duration-300">
                <Trophy className="w-6 h-6" />
              </div>
              
              <div>
                <h3 className="text-xl font-light text-white mb-1 tracking-wide">{t.name}</h3>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-white/40 uppercase tracking-wider">{t.game}</span>
                  <span className="w-1 h-1 bg-white/20 rounded-full" />
                  <span className={`${t.status === 'Live' ? 'text-red-400 animate-pulse' : 'text-white/40'} uppercase tracking-wider`}>
                    {t.status}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-12 relative z-10">
              <div className="text-right">
                <p className="text-white/20 text-[10px] uppercase tracking-widest mb-1">Prize Pool</p>
                <p className="text-xl font-light text-white tracking-wide">{t.prize}</p>
              </div>
              
              <button className="px-8 py-3 border border-white/10 hover:bg-white text-white hover:text-black text-xs font-medium tracking-widest uppercase rounded-full transition-all duration-300">
                {t.status === 'Live' ? 'Spectate' : 'Register'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

const WorldEventsView = ({ onBack }) => (
  <div className="w-full h-full p-12 overflow-y-auto">
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-thin text-white mb-3 tracking-[0.2em] uppercase">Global Conflict</h2>
        <div className="h-px w-20 bg-white/20 mx-auto" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {WORLD_EVENTS.map((evt, i) => (
          <motion.div 
            key={evt.id} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:border-purple-500/30 transition-all duration-500"
          >
            {/* Background Image Placeholder */}
            <div className="absolute inset-0 bg-[#0a0a0a]" />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80" />
            
            {/* Hover Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Content */}
            <div className="absolute inset-0 p-8 flex flex-col justify-between relative z-10">
              <div className="flex justify-between items-start">
                <span className="px-4 py-1.5 bg-white/5 backdrop-blur-md border border-white/10 text-white/60 text-[10px] font-medium tracking-widest uppercase rounded-full group-hover:bg-purple-500/20 group-hover:text-purple-200 group-hover:border-purple-500/30 transition-all">
                  {evt.type}
                </span>
                <span className="flex items-center gap-2 text-white/40 text-xs font-mono tracking-wider">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  {evt.status}
                </span>
              </div>
              
              <div>
                <h3 className="text-3xl font-thin text-white mb-2 tracking-wide group-hover:translate-x-2 transition-transform duration-500">{evt.name}</h3>
                <div className="h-px w-full bg-white/10 mb-4 group-hover:bg-purple-500/50 transition-colors duration-500" />
                <div className="flex items-center gap-2 text-white/60 text-xs font-light tracking-wide">
                  <span className="text-purple-400">REWARD:</span>
                  {evt.reward}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

// --- Main Overlay Component ---

export default function BattleModeOverlay({ onClose }) {
  const [activeView, setActiveView] = useState('menu'); // menu, pvp, pve, tournaments, world

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('battleOverlay:open'));
    return () => window.dispatchEvent(new CustomEvent('battleOverlay:close'));
  }, []);

  const renderContent = () => {
    switch (activeView) {
      case 'pvp': return <PvPConsole onBack={() => setActiveView('menu')} />;
      case 'pve': return <PvEView onBack={() => setActiveView('menu')} />;
      case 'tournaments': return <TournamentsView onBack={() => setActiveView('menu')} />;
      case 'world': return <WorldEventsView onBack={() => setActiveView('menu')} />;
      default: return (
        <div className="flex flex-col items-center justify-center h-full px-6 py-12">
          {/* Main Menu Content */}
          <div className="mb-12 text-center">
            <h1 className="text-5xl font-thin text-white mb-2 tracking-widest uppercase">Battle Mode</h1>
            <div className="h-px w-24 bg-white/30 mx-auto mb-6" />
            <p className="text-white/40 text-sm max-w-lg mx-auto leading-relaxed tracking-wide">
              Select your engagement protocol. Compete, explore, or conquer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-6xl w-full h-[400px]">
            {[
              { id: 'pvp', title: 'PvP Arena', desc: 'Fighting & Shooting', icon: Swords, accent: 'group-hover:text-orange-400', border: 'group-hover:border-orange-500/30' },
              { id: 'pve', title: 'PvE & Explore', desc: 'AI Combat & GPS', icon: MapIcon, accent: 'group-hover:text-blue-400', border: 'group-hover:border-blue-500/30' },
              { id: 'tournaments', title: 'Tournaments', desc: 'Cash Prize Events', icon: Trophy, accent: 'group-hover:text-yellow-400', border: 'group-hover:border-yellow-500/30' },
              { id: 'world', title: 'World Events', desc: 'Global Raids', icon: Globe, accent: 'group-hover:text-purple-400', border: 'group-hover:border-purple-500/30' },
            ].map((mode, i) => (
              <motion.button
                key={mode.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setActiveView(mode.id)}
                className={`group relative h-full bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all duration-500 hover:bg-white/[0.05] hover:scale-[1.02] ${mode.border}`}
              >
                <div className={`mb-8 p-4 rounded-full bg-white/[0.03] border border-white/5 transition-all duration-500 group-hover:scale-110 group-hover:bg-white/[0.08]`}>
                  <mode.icon className={`w-8 h-8 text-white/60 transition-colors duration-300 ${mode.accent}`} />
                </div>
                
                <h3 className="text-xl font-light text-white mb-2 tracking-wider group-hover:text-white transition-colors">
                  {mode.title}
                </h3>
                <p className="text-white/30 text-xs font-light tracking-wide group-hover:text-white/50 transition-colors">
                  {mode.desc}
                </p>

                {/* Subtle Hover Glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </motion.button>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      id="battle-overlay-root"
      className="relative w-full h-full flex items-center justify-center overflow-hidden bg-transparent"
    >
      {/* Content Container */}
      <div className="relative z-10 w-full h-full flex flex-col overflow-y-auto">
        {renderContent()}
      </div>
    </motion.div>
  );
}