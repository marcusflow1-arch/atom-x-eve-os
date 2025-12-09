import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Users, Map as MapIcon, Filter, X, Crosshair, Gift, Shield, 
  Sword, Backpack, MessageSquare, Menu, Calendar, Sparkles, User
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import L from 'leaflet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// --- Custom Marker Icons ---
// Note: In a real app we'd import images. For now we use custom HTML markers or default ones.
// We'll simulate custom markers using L.divIcon if needed, or just standard ones.
const monsterIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3065/3065746.png', // Dragon/Monster icon
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

const chestIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/4230/4230569.png', // Chest icon
  iconSize: [35, 35],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17]
});

const playerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', // User icon
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15]
});

// Fix for default Leaflet marker icons in React
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

const BottomMenu = ({ onAction }) => {
  const menuItems = [
    { id: 'inventory', label: 'Inventory', icon: Backpack },
    { id: 'loadout', label: 'Loadout', icon: Crosshair },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'events', label: 'Events', icon: Calendar },
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
            className="w-12 h-12 rounded-full flex flex-col items-center justify-center gap-0.5 text-white/80 hover:text-white transition-colors relative group"
            style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <item.icon className="w-5 h-5" />
            <span className="absolute -top-8 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {item.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

const EventModal = ({ event, onClose }) => {
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl overflow-hidden relative"
        style={{
            background: 'rgba(30, 41, 59, 0.6)',
            backdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="h-32 bg-gradient-to-br from-indigo-500/50 to-purple-500/50 relative">
            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors">
                <X className="w-4 h-4" />
            </button>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-20 h-20 rounded-2xl bg-slate-900 border-4 border-slate-800 flex items-center justify-center shadow-xl">
                 {event.type === 'Monster' ? <Sword className="w-10 h-10 text-red-500" /> : <Gift className="w-10 h-10 text-yellow-500" />}
            </div>
        </div>

        <div className="pt-10 pb-8 px-6 text-center">
            <Badge className={`mb-2 ${event.difficulty === 'Hard' ? 'bg-red-500' : 'bg-blue-500'}`}>
                {event.difficulty || 'Normal'}
            </Badge>
            <h2 className="text-2xl font-bold text-white mb-2">{event.name}</h2>
            <p className="text-white/60 text-sm mb-6">{event.description}</p>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <div className="text-white/40 text-xs uppercase font-bold mb-1">Level</div>
                    <div className="text-xl font-bold text-white">{event.level || 1}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                     <div className="text-white/40 text-xs uppercase font-bold mb-1">Rewards</div>
                     <div className="text-sm font-medium text-white line-clamp-1">
                        {event.rewards?.join(', ') || 'Unknown'}
                     </div>
                </div>
            </div>

            <Button className="w-full h-12 rounded-xl text-lg font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 border-0">
                {event.type === 'Monster' ? 'Start Battle' : 'Open Chest'}
            </Button>
        </div>
      </motion.div>
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
  const [userLocation, setUserLocation] = useState({ lat: 40.7128, lng: -74.0060 }); // Default NYC
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({ monster: true, chest: true, player: true });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Mock Players moving
  const [otherPlayers, setOtherPlayers] = useState([
    { id: 'p1', name: 'SlayerX', lat: 40.7135, lng: -74.0065 },
    { id: 'p2', name: 'LunaFan', lat: 40.7120, lng: -74.0055 },
  ]);

  useEffect(() => {
    // Load initial events from DB
    const loadEvents = async () => {
        try {
            const data = await base44.entities.WorldEvent.list();
            setEvents(data);
        } catch (error) {
            console.error("Failed to load world events", error);
        }
    };
    loadEvents();
  }, []);

  // Simulate user movement (walking)
  useEffect(() => {
    const interval = setInterval(() => {
        // Very slight random movement to simulate GPS jitter/walking
        setUserLocation(prev => ({
            lat: prev.lat + (Math.random() - 0.5) * 0.0001,
            lng: prev.lng + (Math.random() - 0.5) * 0.0001
        }));
        
        // Move other players towards random points
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
    console.log("Menu action:", action);
    // In a real app, this would open modals or navigate
  };

  // Filtered Events
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
            style={{ background: '#0f172a' }} // Dark background for loading
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" // Dark theme map tiles
            />
            
            <MapRecenter lat={userLocation.lat} lng={userLocation.lng} />

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

            {/* Events (Monsters/Chests) */}
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
        <div className="absolute top-0 left-0 right-0 p-6 z-[1000] flex justify-between items-start pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-4">
                 <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                     <span className="text-white text-sm font-bold tracking-wide">LIVE EVENTS</span>
                 </div>
            </div>
            
            <button 
                onClick={() => setShowFilters(!showFilters)}
                className="pointer-events-auto w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            >
                {showFilters ? <X className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
            </button>
        </div>

        {/* Filter Overlay */}
        <AnimatePresence>
            {showFilters && <FilterOverlay filters={filters} toggleFilter={toggleFilter} />}
        </AnimatePresence>

        {/* Bottom Menu */}
        <BottomMenu onAction={handleMenuAction} />

        {/* Event Modal */}
        <AnimatePresence>
            {selectedEvent && (
                <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
            )}
        </AnimatePresence>

        {/* Global Styles for Leaflet customization */}
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