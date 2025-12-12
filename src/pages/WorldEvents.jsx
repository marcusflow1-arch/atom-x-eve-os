import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { 
  Users, Filter, X, Crosshair, Backpack, MessageSquare, Calendar, Gift, Sword
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import L from 'leaflet';
import { InventoryOverlay, LoadoutOverlay, MessagesOverlay, FriendsOverlay, EventsOverlay } from '../components/worldevents/WorldEventOverlays';
import BattleModal from '../components/worldevents/BattleModal';
import { ALL_NAV_ITEMS } from '../components/dashboard/NavigationConfig';

// --- Custom Marker Icons ---
const monsterIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1628/1628003.png', // More aggressive monster icon
  iconSize: [48, 48],
  iconAnchor: [24, 24],
  popupAnchor: [0, -24],
  className: 'drop-shadow-lg filter hue-rotate-15'
});

const chestIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/9335/9335359.png', // Crystal/Mining icon style
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
  className: 'drop-shadow-lg'
});

const playerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15]
});

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// --- Components ---

const FilterOverlay = ({ filters, toggleFilter }) => (
  <motion.div 
    initial={{ x: 300, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: 300, opacity: 0 }}
    className="absolute top-24 right-6 w-64 rounded-3xl p-6 z-[1000]"
    style={{
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
    }}
  >
    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
      <Filter className="w-4 h-4" /> Map Filters
    </h3>
    <div className="space-y-3">
      {Object.keys(filters).map(key => (
        <label key={key} className="flex items-center gap-3 cursor-pointer group">
          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${filters[key] ? 'bg-cyan-500 border-cyan-500' : 'border-white/30 bg-white/5'}`}>
             <input 
               type="checkbox" 
               checked={filters[key]} 
               onChange={() => toggleFilter(key)}
               className="hidden"
             />
             {filters[key] && <X className="w-3 h-3 text-white rotate-45" />}
          </div>
          <span className="text-white/80 group-hover:text-white capitalize">{key}s</span>
        </label>
      ))}
    </div>
  </motion.div>
);

const BottomMenu = ({ onAction, activeAction }) => {
  const menuItems = [
    { id: 'inventory', label: 'Inventory', icon: Backpack },
    { id: 'loadout', label: 'Loadout', icon: Crosshair },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'friends', label: 'Friends', icon: Users },
  ];

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000]">
      <div 
        className="flex items-center gap-2 p-2 rounded-full"
        style={{
            background: 'rgba(15, 23, 42, 0.3)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
        }}
      >
        {menuItems.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ y: -5, scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onAction(item.id)}
            className={`w-12 h-12 rounded-full flex flex-col items-center justify-center gap-0.5 transition-colors relative group ${
                activeAction === item.id ? 'text-cyan-400 bg-white/20' : 'text-white/80 hover:text-white bg-white/10'
            }`}
            style={{
                border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <item.icon className="w-5 h-5" />
            <span className="absolute -top-8 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {item.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// Map Updater to center on user
const MapRecenter = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
};

export default function WorldEvents() {
  const [userLocation, setUserLocation] = useState({ lat: 40.7128, lng: -74.0060 });
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({ monster: true, chest: true, player: true });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Auto-open Event Hub if URL has ?open=events (optional, for external links)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('open') === 'events') {
      setActiveMenu('events');
    }
  }, []);
  
  // Mock Players moving
  const [otherPlayers, setOtherPlayers] = useState([
    { id: 'p1', name: 'SlayerX', lat: 40.7135, lng: -74.0065 },
    { id: 'p2', name: 'LunaFan', lat: 40.7120, lng: -74.0055 },
  ]);

  // Procedural Event Generation (Simulating MH Now density)
  const generateProceduralEvents = (centerLat, centerLng) => {
    const newEvents = [];
    const radius = 0.005; // approx 500m
    const count = 20; // Density

    // Pseudo-random generator based on location to keep it deterministic-ish
    const seed = Math.floor(centerLat * 1000) + Math.floor(centerLng * 1000);
    
    for (let i = 0; i < count; i++) {
        // Use seed to make random-looking but stable offsets
        const offsetLat = (Math.sin(seed + i) * radius * 0.8) + (Math.cos(i * 13) * 0.001);
        const offsetLng = (Math.cos(seed + i * 2) * radius * 0.8) + (Math.sin(i * 7) * 0.001);
        
        const type = i % 3 === 0 ? 'Chest' : 'Monster';
        const difficulty = i % 5 === 0 ? 'Hard' : (i % 2 === 0 ? 'Medium' : 'Easy');
        
        newEvents.push({
            id: `proc_${seed}_${i}`,
            type: type,
            name: type === 'Monster' 
                ? ['Rathalos', 'Diablos', 'Great Jagras', 'Pukei-Pukei', 'Anjanath'][i % 5] 
                : ['Gathering Point', 'Bonepile', 'Mining Outcrop'][i % 3],
            description: type === 'Monster' 
                ? `A ${difficulty.toLowerCase()} threat level monster.` 
                : 'Contains valuable crafting materials.',
            latitude: centerLat + offsetLat,
            longitude: centerLng + offsetLng,
            level: Math.floor(Math.random() * 50) + 1,
            difficulty: difficulty,
            rewards: type === 'Monster' ? ['Monster Bone', 'Scale'] : ['Iron Ore', 'Herb']
        });
    }
    return newEvents;
  };

  useEffect(() => {
    // Load initial events from DB and merge with procedural ones
    const loadEvents = async () => {
        try {
            const dbData = await base44.entities.WorldEvent.list();
            
            // Generate local events around user
            const localEvents = generateProceduralEvents(userLocation.lat, userLocation.lng);
            
            // Combine, preferring DB events if IDs clash (unlikely with prefix)
            setEvents([...dbData, ...localEvents]);
        } catch (error) {
            console.error("Failed to load world events", error);
            // Fallback to just procedural if DB fails
            setEvents(generateProceduralEvents(userLocation.lat, userLocation.lng));
        }
    };
    loadEvents();
  }, [userLocation.lat, userLocation.lng]);

  // Real Geolocation Tracking
  useEffect(() => {
    if (!navigator.geolocation) {
        console.error("Geolocation is not supported by this browser.");
        return;
    }

    const success = (position) => {
        setPermissionGranted(true);
        const { latitude, longitude } = position.coords;
        // Basic noise filter to prevent jitter if needed, but leaflet handles it okay usually
        setUserLocation({ lat: latitude, lng: longitude });
        
        // Simulate movement for demo if static
        // setUserLocation(prev => ({ lat: prev.lat + 0.0001, lng: prev.lng + 0.0001 })); 
    };

    const error = (err) => {
        console.warn(`ERROR(${err.code}): ${err.message}`);
        setPermissionGranted(false);
    };

    const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };

    const id = navigator.geolocation.watchPosition(success, error, options);
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // Simulate other players moving
  useEffect(() => {
    const interval = setInterval(() => {
        setOtherPlayers(prev => prev.map(p => ({
            ...p,
            lat: p.lat + (Math.random() - 0.5) * 0.0002,
            lng: p.lng + (Math.random() - 0.5) * 0.0002
        })));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggleFilter = (key) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleMenuAction = (action) => {
    setActiveMenu(prev => prev === action ? null : action);
  };

  const handleVictory = (event) => {
      // Remove event from map after victory
      setEvents(prev => prev.filter(e => e.id !== event.id));
      setSelectedEvent(null);
  };

  const visibleEvents = events.filter(e => {
    if (e.type === 'Monster' && !filters.monster) return false;
    if (e.type === 'Chest' && !filters.chest) return false;
    return true;
  });

  return (
    <div className="h-screen w-full relative overflow-hidden bg-slate-900">
        
        {/* Full Screen Map */}
        <MapContainer 
            center={[userLocation.lat, userLocation.lng]} 
            zoom={16} 
            scrollWheelZoom={true} 
            className="w-full h-full z-0"
            zoomControl={false}
            style={{ background: '#0f172a' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            
            {permissionGranted && <MapRecenter lat={userLocation.lat} lng={userLocation.lng} />}

            {/* User Marker */}
            <Marker position={[userLocation.lat, userLocation.lng]} icon={playerIcon}>
                <Popup className="custom-popup">You are here</Popup>
            </Marker>

            {/* Other Players */}
            {filters.player && otherPlayers.map(p => (
                <Marker key={p.id} position={[p.lat, p.lng]} icon={playerIcon} opacity={0.7}>
                    <Popup>{p.name}</Popup>
                </Marker>
            ))}

            {/* Events */}
            {visibleEvents.map(event => (
                <Marker 
                    key={event.id} 
                    position={[event.latitude, event.longitude]} 
                    icon={event.type === 'Monster' ? monsterIcon : chestIcon}
                    eventHandlers={{
                        click: () => setSelectedEvent(event),
                    }}
                >
                </Marker>
            ))}

        </MapContainer>

        {/* UI Overlay - Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 z-[1000] flex justify-between items-center pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-4">
                {/* Menu Button */}
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-md hover:bg-white/10 flex items-center justify-center transition-all border border-white/10"
                >
                  <div className="flex flex-col gap-[3px]">
                    <span className="w-4 h-[2px] bg-white/90 rounded-full"></span>
                    <span className="w-4 h-[2px] bg-white/90 rounded-full"></span>
                    <span className="w-4 h-[2px] bg-white/90 rounded-full"></span>
                  </div>
                </button>

                {/* Title */}
                <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                    <span className="text-white font-bold text-sm">World Events</span>
                </div>

                {/* Discord */}
                <a
                  href="https://discord.gg/psyA8Qwm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium transition-all bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white/10"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 13.46 13.46 0 0 0-1.044 2.149 18.257 18.257 0 0 0-4.606 0 13.623 13.623 0 0 0-1.048-2.149.074.074 0 0 0-.079-.037C6.88 3.323 5.16 3.864 3.682 4.37a.069.069 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.118.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107 14.282 14.282 0 0 0 1.226 1.994.076.076 0 0 0 .084.028 19.883 19.883 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/>
                  </svg>
                </a>

                {/* GPS Indicator (Moved Here) */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${permissionGranted ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                     <span className="text-white text-xs font-bold tracking-wide">{permissionGranted ? 'LIVE' : 'OFF'}</span>
                </div>
            </div>
            
            <button 
                onClick={() => setShowFilters(!showFilters)}
                className="pointer-events-auto w-10 h-10 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            >
                {showFilters ? <X className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
            </button>
        </div>

        {/* Event Hub Button - Pulls from Right */}
        <button
            onClick={() => setActiveMenu(activeMenu === 'events' ? null : 'events')}
            className="fixed top-24 right-6 z-[1000] w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all shadow-[0_0_20px_rgba(0,0,0,0.3)] group"
        >
            <Calendar className="w-6 h-6 group-hover:text-cyan-400 transition-colors" />
        </button>

        {/* App Drawer Overlay */}
        <AnimatePresence>
            {drawerOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000]"
                        onClick={() => setDrawerOpen(false)}
                    />
                    <motion.div
                        initial={{ x: -320, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -320, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 bottom-0 w-80 bg-white/[0.03] backdrop-blur-3xl z-[2001] shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col rounded-r-3xl"
                        style={{ WebkitBackdropFilter: 'blur(50px) saturate(200%)' }}
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-white font-bold text-xl tracking-wider">ATOM×EVE</span>
                                <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-all">
                                    <X className="w-4 h-4 text-white/60" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            <p className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-3 px-2">Navigation</p>
                            <div className="space-y-1">
                                {ALL_NAV_ITEMS.map((page) => (
                                    <Link
                                        key={page.name}
                                        to={page.path}
                                        onClick={() => setDrawerOpen(false)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left text-white/60 hover:text-white hover:bg-white/[0.05]"
                                    >
                                        <page.icon className="w-5 h-5" />
                                        <span className="font-medium">{page.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="p-4">
                            <p className="text-white/20 text-xs text-center">© 2025 ATOM×EVE</p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>

        <AnimatePresence>
            {showFilters && <FilterOverlay filters={filters} toggleFilter={toggleFilter} />}
        </AnimatePresence>

        <BottomMenu onAction={handleMenuAction} activeAction={activeMenu} />

        {/* Dynamic Overlays */}
        <AnimatePresence>
            {activeMenu === 'inventory' && <InventoryOverlay onClose={() => setActiveMenu(null)} />}
            {activeMenu === 'loadout' && <LoadoutOverlay onClose={() => setActiveMenu(null)} />}
            {activeMenu === 'messages' && <MessagesOverlay onClose={() => setActiveMenu(null)} />}
            {activeMenu === 'friends' && <FriendsOverlay onClose={() => setActiveMenu(null)} />}
            {activeMenu === 'events' && <EventsOverlay onClose={() => setActiveMenu(null)} />}
        </AnimatePresence>

        {/* Battle/Event Modal */}
        <AnimatePresence>
            {selectedEvent && (
                <BattleModal 
                    event={selectedEvent} 
                    onClose={() => setSelectedEvent(null)} 
                    onVictory={handleVictory}
                />
            )}
        </AnimatePresence>

        <style>{`
            .leaflet-popup-content-wrapper {
                background: rgba(15, 23, 42, 0.8);
                backdrop-filter: blur(10px);
                color: white;
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 12px;
            }
            .leaflet-popup-tip {
                background: rgba(15, 23, 42, 0.8);
            }
        `}</style>

    </div>
  );
}