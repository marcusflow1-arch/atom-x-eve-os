import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Swords, Target, Flame, Zap, Shield, X, Map as MapIcon, 
  Crosshair, Trophy, Globe, ChevronLeft, Search, Navigation
} from 'lucide-react';
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
        <div className="w-24 h-24 relative mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-orange-500/30 animate-ping" />
          <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          <Swords className="absolute inset-0 m-auto text-orange-500 w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Searching for Opponent...</h2>
        <p className="text-white/60 mb-8">
          Mode: <span className="text-orange-400">{selectedStyle.name}</span> ({selectedGenre.name})
        </p>
        <button 
          onClick={() => setInQueue(false)}
          className="px-8 py-3 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/50 rounded-lg transition-colors font-bold"
        >
          Cancel Queue
        </button>
      </div>
    );
  }

  if (selectedGenre) {
    return (
      <div className="w-full h-full flex flex-col p-8">
        <button onClick={() => setSelectedGenre(null)} className="flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors self-start">
          <ChevronLeft className="w-5 h-5" /> Back to Genres
        </button>
        
        <h2 className="text-4xl font-black text-white mb-2">{selectedGenre.name} Styles</h2>
        <p className="text-white/60 mb-8">Select your preferred fighting ruleset</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {selectedGenre.styles.map((style) => (
            <div 
              key={style.id}
              onClick={() => setSelectedStyle(style)}
              className={`relative h-96 rounded-2xl overflow-hidden cursor-pointer group border-2 transition-all ${selectedStyle?.id === style.id ? 'border-orange-500 scale-105 shadow-[0_0_30px_rgba(249,115,22,0.4)]' : 'border-transparent hover:border-white/30'}`}
            >
              <img src={style.image} alt={style.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              
              <div className="absolute bottom-0 left-0 p-6 w-full">
                <h3 className="text-2xl font-bold text-white mb-2">{style.name}</h3>
                <p className="text-white/70 text-sm">{style.description}</p>
                {selectedStyle?.id === style.id && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setInQueue(true);
                    }}
                    className="mt-4 w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Swords className="w-4 h-4" /> Enter Queue
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      <h2 className="text-4xl font-black text-white mb-12">Select PvP Genre</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {PVP_GENRES.map((genre) => (
          <button
            key={genre.id}
            onClick={() => setSelectedGenre(genre)}
            className="group relative h-64 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all overflow-hidden"
          >
            <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <genre.icon className="w-10 h-10 text-orange-500" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">{genre.name}</h3>
            <p className="text-white/50">{genre.description}</p>
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
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
        <div className="flex items-center justify-between p-6 bg-black/40 backdrop-blur-md border-b border-white/10 z-10">
          <button onClick={() => setMode(null)} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" /> Exit Map
          </button>
          <div className="flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-white">Real-Time Exploration</span>
          </div>
          <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold border border-blue-500/30">
            GPS Active
          </div>
        </div>
        
        <div className="flex-1 relative bg-slate-900">
          <MapContainer 
            center={[40.7128, -74.0060]} // Default NYC
            zoom={13} 
            style={{ width: '100%', height: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {/* Mock Player */}
            <Marker position={[40.7128, -74.0060]}>
              <Popup>You are here</Popup>
            </Marker>
            
            {/* Mock Chests */}
            <Marker position={[40.7150, -74.0090]}>
              <Popup>
                <div className="text-center">
                  <h3 className="font-bold">Rare Chest</h3>
                  <p className="text-xs mb-2">Contains: Gold, XP</p>
                  <button className="px-3 py-1 bg-blue-500 text-white rounded text-xs w-full">Open</button>
                </div>
              </Popup>
            </Marker>
            <Marker position={[40.7100, -74.0020]}>
              <Popup>
                <div className="text-center">
                  <h3 className="font-bold text-purple-600">Epic Chest</h3>
                  <p className="text-xs mb-2">Contains: Weapon Part</p>
                  <button className="px-3 py-1 bg-purple-500 text-white rounded text-xs w-full">Open</button>
                </div>
              </Popup>
            </Marker>
          </MapContainer>

          {/* Overlay UI for Exploration */}
          <div className="absolute bottom-8 left-8 right-8 z-[400] flex justify-between items-end pointer-events-none">
            <div className="bg-black/80 backdrop-blur p-4 rounded-xl border border-white/10 pointer-events-auto">
              <h4 className="text-white font-bold mb-1">Nearby Scanners</h4>
              <p className="text-white/50 text-xs">2 Chests detected within 1km</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-lg pointer-events-auto transition-transform hover:scale-110">
              <Navigation className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'ai') {
    return (
      <div className="w-full h-full flex flex-col p-8 items-center justify-center">
        <button onClick={() => setMode(null)} className="absolute top-8 left-8 flex items-center gap-2 text-white/50 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { name: 'Training Dummies', level: '1-10', diff: 'Easy', color: 'bg-green-500' },
            { name: 'Cyber Sentinels', level: '10-30', diff: 'Medium', color: 'bg-yellow-500' },
            { name: 'Void Walkers', level: '30-50', diff: 'Hard', color: 'bg-red-500' },
            { name: 'Omega Boss', level: '50+', diff: 'Extreme', color: 'bg-purple-500' },
          ].map((fight, i) => (
            <button key={i} className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 p-6 rounded-2xl flex items-center justify-between group transition-all">
              <div className="text-left">
                <h3 className="text-xl font-bold text-white mb-1">{fight.name}</h3>
                <p className="text-white/50 text-sm">Level {fight.level}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold text-black ${fight.color}`}>
                {fight.diff}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      <h2 className="text-4xl font-black text-white mb-12">Select PvE Mode</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <button
          onClick={() => setMode('ai')}
          className="group h-80 bg-gradient-to-br from-blue-900/40 to-black border border-white/10 hover:border-blue-500 rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all"
        >
          <Target className="w-16 h-16 text-blue-400 mb-6 group-hover:scale-110 transition-transform" />
          <h3 className="text-3xl font-bold text-white mb-2">Fight AI Units</h3>
          <p className="text-white/50">Challenge artificial intelligence opponents in arena combat to gain XP and loot.</p>
        </button>

        <button
          onClick={() => setMode('explore')}
          className="group h-80 bg-gradient-to-br from-emerald-900/40 to-black border border-white/10 hover:border-emerald-500 rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all"
        >
          <MapIcon className="w-16 h-16 text-emerald-400 mb-6 group-hover:scale-110 transition-transform" />
          <h3 className="text-3xl font-bold text-white mb-2">Real-World Explore</h3>
          <p className="text-white/50">Use GPS to find chests, events, and resources on the real-world map (Pokemon Go style).</p>
        </button>
      </div>
    </div>
  );
};

const TournamentsView = () => (
  <div className="w-full h-full p-8 overflow-y-auto">
    <div className="max-w-5xl mx-auto">
      <h2 className="text-4xl font-black text-white mb-2">Active Tournaments</h2>
      <p className="text-white/50 mb-8">Compete for real cash prizes and glory.</p>

      <div className="grid gap-4">
        {TOURNAMENTS.map((t) => (
          <div key={t.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between hover:bg-white/[0.08] transition-colors">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-yellow-600/20 rounded-xl flex items-center justify-center border border-yellow-600/30">
                <Trophy className="w-8 h-8 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{t.name}</h3>
                <div className="flex items-center gap-4 text-sm text-white/50 mt-1">
                  <span>{t.game}</span>
                  <span className="w-1 h-1 bg-white/20 rounded-full" />
                  <span className={t.status === 'Live' ? 'text-red-400 font-bold animate-pulse' : ''}>{t.status}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-white/40 text-xs uppercase tracking-wider">Prize Pool</p>
                <p className="text-2xl font-black text-green-400">{t.prize}</p>
              </div>
              <button className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:scale-105 transition-transform">
                {t.status === 'Live' ? 'Watch' : 'Enter'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const WorldEventsView = () => (
  <div className="w-full h-full p-8 overflow-y-auto">
    <div className="max-w-5xl mx-auto">
      <h2 className="text-4xl font-black text-white mb-2">World Events</h2>
      <p className="text-white/50 mb-8">Global challenges and limited-time modes.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {WORLD_EVENTS.map((evt) => (
          <div key={evt.id} className="relative h-64 rounded-2xl overflow-hidden group cursor-pointer border border-white/10 hover:border-purple-500 transition-colors">
            {/* Background Image Placeholder */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-black" />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-500" />
            
            <div className="absolute bottom-0 left-0 p-6 w-full">
              <div className="flex justify-between items-start mb-2">
                <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full uppercase">
                  {evt.type}
                </span>
                <span className="text-white/70 text-sm font-mono">{evt.status}</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{evt.name}</h3>
              <p className="text-purple-300 text-sm">Reward: {evt.reward}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// --- Main Overlay Component ---

export default function BattleModeOverlay({ onClose }) {
  const [activeView, setActiveView] = useState('menu'); // menu, pvp, pve, tournaments, world

  const renderContent = () => {
    switch (activeView) {
      case 'pvp': return <PvPView onBack={() => setActiveView('menu')} />;
      case 'pve': return <PvEView onBack={() => setActiveView('menu')} />;
      case 'tournaments': return <TournamentsView />;
      case 'world': return <WorldEventsView />;
      default: return (
        <div className="flex flex-col items-center text-center max-w-6xl w-full px-6 py-12">
          {/* Main Menu Content */}
          <div className="w-24 h-24 rounded-full bg-orange-600 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(234,88,12,0.4)]">
            <Swords className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-6xl font-black text-white mb-4 tracking-tight">BATTLE MODE</h1>
          <p className="text-slate-300 text-lg max-w-2xl mb-16 leading-relaxed">
            Choose your arena. Fight for glory, explore the world, or compete for real prizes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
            {[
              { id: 'pvp', title: 'PvP Arena', desc: 'Select Fighting or Shooting styles', icon: Swords, color: 'bg-orange-500' },
              { id: 'pve', title: 'PvE & Explore', desc: 'Fight AI or find chests IRL', icon: MapIcon, color: 'bg-blue-500' },
              { id: 'tournaments', title: 'Tournaments', desc: 'Win real money prizes', icon: Trophy, color: 'bg-yellow-500' },
              { id: 'world', title: 'World Events', desc: 'Global Raids & Events', icon: Globe, color: 'bg-purple-500' },
            ].map((mode) => (
              <motion.button
                key={mode.id}
                onClick={() => setActiveView(mode.id)}
                whileHover={{ y: -5 }}
                className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col items-start text-left h-72 relative overflow-hidden group hover:bg-white/10 hover:border-white/20 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl ${mode.color} flex items-center justify-center mb-auto shadow-lg`}>
                  <mode.icon className="w-6 h-6 text-white" />
                </div>
                <div className="relative z-10 mt-4">
                  <h3 className="text-xl font-black text-white mb-2">{mode.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{mode.desc}</p>
                </div>
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
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black"
    >
      {/* Background Gradient */}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, #ef4444 0%, #7f1d1d 40%, #450a0a 80%, #000000 100%)'
        }}
      />

      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Back Button (if not on menu) */}
      {activeView !== 'menu' && (
        <button 
          onClick={() => setActiveView('menu')}
          className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Main Menu
        </button>
      )}

      {/* Content Container */}
      <div className="relative z-10 w-full h-full flex flex-col overflow-y-auto">
        {renderContent()}
      </div>
    </motion.div>
  );
}