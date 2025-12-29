import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../components/auth/AuthContext';
import { base44 } from '@/api/base44Client';
import LauncherBoot from '../components/launcher/LauncherBoot';
import LauncherSidebar from '../components/launcher/LauncherSidebar';
import LauncherGameGrid from '../components/launcher/LauncherGameGrid';
import LaunchModal from '../components/launcher/LaunchModal';
import { allMockGames } from '../components/store/mockData';
import { Home, Library, ShoppingBag, Users, Settings, X, Minus, Square } from 'lucide-react';

export default function Launcher() {
  const { user, isAuthenticated } = useAuth();
  const [bootComplete, setBootComplete] = useState(false);
  const [activeTab, setActiveTab] = useState('library');
  const [ownedGames, setOwnedGames] = useState([]);
  const [launchingGame, setLaunchingGame] = useState(null);

  useEffect(() => {
    // Load games
    const fetchGames = async () => {
      let games = Object.values(allMockGames);
      // Simulate "installed" state for some
      games = games.map(g => ({
        ...g,
        installed: Math.random() > 0.5 
      }));
      setOwnedGames(games);
    };
    fetchGames();
  }, []);

  const handleLaunch = (game) => {
    setLaunchingGame(game);
  };

  const handleLaunchComplete = () => {
    // In a real app, this would open the game window or exe
    setTimeout(() => {
      setLaunchingGame(null);
    }, 500);
  };

  if (!bootComplete) {
    return <LauncherBoot onComplete={() => setBootComplete(true)} />;
  }

  return (
    <div className="h-screen w-screen bg-[#09090b] text-white font-sans flex flex-col overflow-hidden select-none">
      {/* Title Bar (Draggable) */}
      <div className="h-8 bg-[#0F1115] border-b border-white/5 flex items-center justify-between px-4 app-region-drag select-none">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-500/20 border border-cyan-500/50" />
          <span className="text-xs font-bold text-white/40 tracking-widest uppercase">Atom x Eve Launcher</span>
        </div>
        <div className="flex items-center gap-4 app-region-no-drag">
          <div className="flex gap-1 text-[10px] text-white/30 font-mono">
            <span>ONLINE</span>
            <span className="text-green-500">●</span>
          </div>
          <div className="flex gap-2 text-white/40">
            <Minus className="w-4 h-4 hover:text-white cursor-pointer" />
            <Square className="w-3 h-3 hover:text-white cursor-pointer mt-0.5" />
            <X className="w-4 h-4 hover:text-red-500 cursor-pointer" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <LauncherSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Dashboard Area */}
        <div className="flex-1 flex flex-col bg-[#050505] relative">
          {/* Top Nav / Taskbar */}
          <div className="h-16 border-b border-white/5 flex items-center px-8 gap-8 bg-[#0F1115]/50 backdrop-blur">
            {[
              { id: 'home', label: 'Home', icon: Home },
              { id: 'library', label: 'Library', icon: Library },
              { id: 'store', label: 'Store', icon: ShoppingBag },
              { id: 'clan', label: 'Clan', icon: Users },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id ? 'text-white' : 'text-white/40 hover:text-white'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-cyan-400' : ''}`} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Page Content */}
          <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none" />
            
            {activeTab === 'library' && (
              <LauncherGameGrid games={ownedGames} onLaunch={handleLaunch} />
            )}
            
            {activeTab !== 'library' && (
              <div className="flex flex-col items-center justify-center h-full text-white/20">
                <p className="text-sm font-mono uppercase tracking-widest">Module Loading...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Launch Modal */}
      <AnimatePresence>
        {launchingGame && (
          <LaunchModal 
            game={launchingGame} 
            onClose={() => setLaunchingGame(null)} 
            onLaunchComplete={handleLaunchComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}