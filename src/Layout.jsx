import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
        LayoutGrid, ShoppingBag, Trophy, User, Gavel, Users, Bot, Library, Download, Mail, Bell, MessageSquare, LogIn, LogOut, Heart, Hammer, Clapperboard, ArrowLeftRight, Radio, Gamepad2, Settings, Home, Lightbulb, Rocket, Swords, Layers, Crown, Target
      } from 'lucide-react';
import { ThemeBackground } from '@/components/shared/ThemeSystem';
import { CartProvider } from './components/CartContext';
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import { DashboardModeProvider, useDashboardMode } from './components/dashboard/DashboardModeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Circle } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';

import PWAManifest from './components/desktop/PWAManifest';
import ServiceWorker from './components/desktop/ServiceWorker';
import SignUpForm from './components/auth/SignUpForm';
import IntroScreen from './components/intro/IntroScreen';

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-400">Loading...</p>
    </div>
  </div>
);

const NavDropdown = ({ groupName, icon: Icon, items, currentPath }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isGroupActive = items.some(item => item.path === currentPath);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className={`nav-item ${isGroupActive ? 'active' : ''}`}>
        <Icon size={16} className="nav-icon" />
        <span className="nav-label">{groupName}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 w-56 bg-slate-800/90 backdrop-blur-md border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden"
          >
            {items.map((item) => {
              const isActive = item.path === currentPath;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors duration-200 ${
                    isActive ? 'bg-blue-600/50 text-white' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <item.icon size={16} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const audioRef = useRef(null);
  const { user, isAuthenticated, login, logout, showSignUp, completeSignUp, setShowSignUp } = useAuth();
  const { mode, toggleMode } = useDashboardMode();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [blankDrawerOpen, setBlankDrawerOpen] = useState(false);

  const navGroups = {
    'Home': {
      isLink: true,
      path: createPageUrl('Dashboard'),
      icon: Home,
    },
    'Games': {
      icon: Gamepad2,
      items: [
        { name: 'Store', icon: ShoppingBag, path: createPageUrl('Store') },
        { name: 'Library', icon: Library, path: createPageUrl('Library') },
        { name: 'Achievements', icon: Trophy, path: createPageUrl('Achievements') },
        { name: 'Skill Tree', icon: Layers, path: createPageUrl('GenreMastery') },
        { name: 'Blacksmith', icon: Hammer, path: createPageUrl('Blacksmith') },
        { name: 'Events', icon: Trophy, path: createPageUrl('Events') },
      ],
    },
    'Community': {
      icon: Users,
      items: [
        { name: 'Forums', icon: MessageSquare, path: createPageUrl('Community') },
        { name: 'Clans', icon: Users, path: createPageUrl('Clan') },
        { name: 'Game Dev Hub', icon: Rocket, path: createPageUrl('GameDevHub') },
        { name: 'Challenges', icon: Swords, path: createPageUrl('Challenges') },
      ],
    },
    'AI & Tools': {
      icon: Bot,
      items: [
        { name: 'AI Console', icon: Bot, path: createPageUrl('AIConsole') },
        { name: 'Marketplace', icon: Gavel, path: createPageUrl('Marketplace') },
      ],
    },
    'Profile': {
      icon: User,
      items: [
        { name: 'My Profile', icon: User, path: createPageUrl('Profile') },
        { name: 'Ideals', icon: Lightbulb, path: createPageUrl('Ideals') },
        { name: 'Support', icon: Heart, path: createPageUrl('AdamXEve') },
      ],
    },
  };

  const allNavItems = [
    { name: 'Dashboard', icon: Home, path: createPageUrl('Dashboard') },
    { name: 'Store', icon: ShoppingBag, path: createPageUrl('Store') },
    { name: 'Library', icon: Library, path: createPageUrl('Library') },
    { name: 'Achievements', icon: Trophy, path: createPageUrl('Achievements') },
    { name: 'Skill Tree', icon: Layers, path: createPageUrl('GenreMastery') },
    { name: 'Luna Template', icon: LayoutGrid, path: createPageUrl('LunaTemplate') },
    { name: 'Seasonal Pass', icon: Crown, path: createPageUrl('SeasonalPass') },
    { name: 'Blacksmith', icon: Hammer, path: createPageUrl('Blacksmith') },
    { name: 'Events', icon: Trophy, path: createPageUrl('Events') },
    { name: 'Forums', icon: MessageSquare, path: createPageUrl('Community') },
    { name: 'Clans', icon: Users, path: createPageUrl('Clan') },
    { name: 'Game Dev Hub', icon: Rocket, path: createPageUrl('GameDevHub') },
    { name: 'Challenges', icon: Swords, path: createPageUrl('Challenges') },
    { name: 'AI Console', icon: Bot, path: createPageUrl('AIConsole') },
    { name: 'Marketplace', icon: Gavel, path: createPageUrl('Marketplace') },
    { name: 'My Profile', icon: User, path: createPageUrl('Profile') },
    { name: 'Ideals', icon: Lightbulb, path: createPageUrl('Ideals') },
    { name: 'Support', icon: Heart, path: createPageUrl('AdamXEve') },
    { name: 'Admin', icon: Settings, path: createPageUrl('Admin') },
  ];

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('https://cdn.jsdelivr.net/gh/k-next/sounds-for-content-media@main/sounds/ui-hover.mp3');
      audioRef.current.volume = 0.1;
    }

    const interactiveSelectors = 'button, a, [role="button"], .nav-item, .console-tile, .game-card';

    const handleMouseOver = (event) => {
      if (event.target.closest(interactiveSelectors)) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    return () => document.removeEventListener('mouseover', handleMouseOver);
  }, []);

  const handleSignIn = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const getDisplayName = () => {
    if (!user) return null;
    return user.username || user.full_name || user.email?.split('@')[0] || 'User';
  };

  const getUserInitial = () => {
    const name = getDisplayName();
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <div className="h-screen w-screen bg-slate-900 text-slate-300 font-sans flex flex-col overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <ThemeBackground themeId="moon_essence" />
      </div>

      <PWAManifest />
      <ServiceWorker />

      {/* Global Style */}
      <style>{`
          * {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          
          *::-webkit-scrollbar {
            display: none;
          }

          .page-container {
            height: 100%;
            overflow-y: auto;
          }

          *:focus {
            outline: 2px solid rgba(59, 130, 246, 0.6);
            outline-offset: 2px;
          }

          *:focus:not(:focus-visible) {
            outline: none;
          }

          *:focus-visible {
            outline: 2px solid rgba(59, 130, 246, 0.8);
            outline-offset: 2px;
          }

          @keyframes pulse-bg {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
          }

          .modern-nav-header {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            position: relative;
            z-index: 20;
          }

          .nav-container {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            padding: 12px 24px;
            position: relative;
            z-index: 10;
          }

          .nav-brand {
            font-size: 1.4rem;
            font-weight: 800;
            letter-spacing: 2px;
            background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 50%, #6366f1 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            cursor: pointer;
            transition: all 0.3s ease;
            justify-self: center;
          }

          .nav-brand:hover {
            transform: scale(1.03);
            filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.5));
          }

          .nav-menu {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .nav-item {
            position: relative;
            padding: 6px 14px;
            border-radius: 9999px;
            display: flex;
            align-items: center;
            gap: 6px;
            font-weight: 500;
            font-size: 0.85rem;
            text-decoration: none;
            color: rgba(255, 255, 255, 0.7);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid transparent;
            background: transparent;
            white-space: nowrap;
          }

          .nav-item:hover {
            color: #ffffff;
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.1);
          }

          .nav-item.active {
            color: #ffffff;
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.2);
          }

          .nav-item.active:hover {
            background: rgba(255, 255, 255, 0.2);
          }

          .nav-icon {
            filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
          }

          .nav-item:hover .nav-icon {
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
          }

          .nav-item.active .nav-icon {
            filter: drop-shadow(0 0 5px currentColor);
          }

          @media (max-width: 1200px) {
            .nav-menu {
              gap: 6px;
            }
            .nav-item {
              padding: 7px 14px;
              font-size: 0.85rem;
            }
          }

          @media (max-width: 992px) {
            .nav-container {
              padding: 8px 16px;
            }
            .nav-brand {
              font-size: 1.4rem;
            }
            .nav-menu {
              gap: 4px;
            }
            .nav-item {
              padding: 6px 10px;
              font-size: 0.8rem;
            }
          }

          @media (max-width: 768px) {
            .nav-container {
              flex-direction: column;
              gap: 10px;
              padding: 10px;
            }
            .nav-menu {
              flex-wrap: wrap;
              justify-content: center;
              gap: 8px;
            }
            .nav-item {
              font-size: 0.75rem;
              padding: 5px 8px;
            }
            .nav-brand {
              font-size: 1.5rem;
            }
          }
      `}</style>

      {/* Blank Drawer */}
      <AnimatePresence>
        {blankDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setBlankDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-white/[0.03] backdrop-blur-3xl z-50 shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col rounded-r-3xl border-r border-white/10"
              style={{ WebkitBackdropFilter: 'blur(50px) saturate(200%)' }}
            >
              <div className="p-6 flex justify-end">
                  <button 
                    onClick={() => setBlankDrawerOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-all"
                  >
                    <X className="w-4 h-4 text-white/60" />
                  </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Global Navigation Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-white/[0.03] backdrop-blur-3xl z-50 shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col rounded-r-3xl"
              style={{ WebkitBackdropFilter: 'blur(50px) saturate(200%)' }}
            >
              {/* Drawer Header */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white font-bold text-xl tracking-wider">ATOM×EVE</span>
                  <button 
                    onClick={() => setDrawerOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-all"
                  >
                    <X className="w-4 h-4 text-white/60" />
                  </button>
                </div>
                
                {/* User Info */}
                {isAuthenticated ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04]">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden ring-2 ring-white/20">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        getUserInitial()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{getDisplayName()}</p>
                      <p className="text-white/40 text-xs truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center text-white/50 hover:text-white transition-all"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleSignIn}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/[0.06] hover:bg-white/[0.1] rounded-xl text-white font-medium transition-all"
                    >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </button>
                )}
              </div>

              {/* Nav Items */}
              <div className="flex-1 overflow-y-auto p-4">
                <p className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-3 px-2">Navigation</p>
                <div className="space-y-1">
                  {allNavItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        onClick={() => setDrawerOpen(false)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                          isActive 
                            ? 'bg-white/[0.1] text-white' 
                            : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4">
                <p className="text-white/20 text-xs text-center">© 2025 ATOM×EVE</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Menu Button - Custom Header Logic */}
      {(() => {
        const p = location.pathname.toLowerCase();

        // Default Config
        let headerConfig = { 
          showMenu: true,
          title: "Adam - Marcus", 
          showLevel: true, 
          showDiscord: true,
          hidden: false,
          showModeToggle: false,
          showDock: false
        };

        // Page Specific Overrides
        if (p === '/' || p.endsWith('/dashboard')) {
             headerConfig.title = mode === 'ai' ? "AI Dashboard Home Page" : "User Interface";
             headerConfig.showModeToggle = true;
             headerConfig.showDock = true;
             headerConfig.showMenu = true;
        } else if (p.includes('/store')) {
          headerConfig.hidden = true;
        } else if (p.includes('/clan')) {
          headerConfig.hidden = true; // Hide everything for clan page
        } else if (p.includes('/library')) {
          headerConfig.title = "Adam - Marcus | My Library";
          headerConfig.showLevel = false;
          headerConfig.showDiscord = false;
        } else if (p.includes('/achievements')) {
          headerConfig.title = "Adam - Marcus | Achievements";
          headerConfig.showLevel = false;
          headerConfig.showDiscord = false;
        } else if (p.includes('/genremastery')) {
          headerConfig.title = "Adam - Marcus | Skill Tree";
          headerConfig.showLevel = false;
          headerConfig.showDiscord = false;
        } else if (p.includes('/lunatemplate')) {
          headerConfig.title = "Adam - Marcus | Luna Template";
          headerConfig.showLevel = false;
          headerConfig.showDiscord = false;
        } else if (p.includes('/seasonalpass')) {
          headerConfig.title = "Adam - Marcus | Seasonal Pass";
          headerConfig.showLevel = false;
          headerConfig.showDiscord = false;
        } else if (p.includes('/blacksmith')) {
          headerConfig.title = "Adam - Marcus | Blacksmith";
          headerConfig.showLevel = false;
          headerConfig.showDiscord = false;
        } else if (p.includes('/tradingpost')) {
          headerConfig.title = "Adam - Marcus | Avatar Profile";
          headerConfig.showLevel = false;
          headerConfig.showDiscord = false;
        }

        if (headerConfig.hidden) return null;

        const DOCK_ITEMS = [
          { id: 'profile', label: 'Profile', icon: User, route: 'Profile' },
          { id: 'achievements', label: 'Achievements', icon: Trophy, route: 'Achievements' },
          { id: 'community', label: 'Community', icon: MessageSquare, route: 'Community' },
          { id: 'marketplace', label: 'Market', icon: Target, route: 'Marketplace' },
        ];

        return (
          <div className="fixed top-4 left-4 z-40 flex flex-col gap-1.5">
            <div className="flex items-center gap-4">
            {headerConfig.showMenu && (
              <button
                onClick={() => setDrawerOpen(true)}
                className="w-11 h-11 rounded-xl bg-white/[0.05] backdrop-blur-2xl hover:bg-white/[0.1] flex items-center justify-center transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                style={{ WebkitBackdropFilter: 'blur(40px) saturate(200%)' }}
              >
                <div className="flex flex-col gap-1">
                  <span className="w-4 h-0.5 bg-white/80 rounded-full"></span>
                  <span className="w-4 h-0.5 bg-white/80 rounded-full"></span>
                  <span className="w-4 h-0.5 bg-white/80 rounded-full"></span>
                </div>
              </button>
            )}

            <div className="flex items-center gap-3">
              <span className="text-white font-semibold text-sm">{headerConfig.title}</span>
              {headerConfig.showLevel && (
                <>
                  <div className="w-px h-4 bg-white/20"></div>
                  <span className="text-white font-semibold text-sm">Level 1</span>
                </>
              )}
            </div>

            {headerConfig.showDiscord && (
              <a
                href="https://discord.gg/psyA8Qwm"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium transition-all hover:scale-105"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 13.46 13.46 0 0 0-1.044 2.149 18.257 18.257 0 0 0-4.606 0 13.623 13.623 0 0 0-1.048-2.149.074.074 0 0 0-.079-.037C6.88 3.323 5.16 3.864 3.682 4.37a.069.069 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.118.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107 14.282 14.282 0 0 0 1.226 1.994.076.076 0 0 0 .084.028 19.883 19.883 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/>
                </svg>
                <span>Discord</span>
              </a>
            )}

            {headerConfig.showModeToggle && (
              <button
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all overflow-hidden"
                onClick={toggleMode}
                title="Toggle Interface Mode"
              >
                <AnimatePresence mode="wait">
                  {mode === 'ai' ? (
                    <motion.div
                      key="user-icon"
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 90 }}
                      className="flex items-center justify-center w-full h-full"
                    >
                      <User className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="ai-icon"
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 90 }}
                      className="flex items-center justify-center w-full h-full"
                    >
                      <Bot className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            )}
            </div>

            {/* Minimized Experience Bar */}
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/5 shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]" 
                style={{ width: '16.25%' }} 
              />
            </div>

            {/* Under Bar Content: Page Name & Dock Items */}
            <div className="flex items-center gap-6 mt-1 pl-1">
                <button
                  onClick={() => setBlankDrawerOpen(true)}
                  className="w-11 h-11 rounded-full bg-white/[0.05] backdrop-blur-2xl hover:bg-white/[0.1] flex items-center justify-center transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-white/10"
                  style={{ WebkitBackdropFilter: 'blur(40px) saturate(200%)' }}
                >
                  <Circle className="w-5 h-5 text-white/80" />
                </button>


                {/* Dock Items */}
                {headerConfig.showDock && mode === 'ai' && (
                   <div className="flex items-center gap-2">
                       {DOCK_ITEMS.map(item => (
                           <Link 
                             key={item.id} 
                             to={createPageUrl(item.route)}
                             className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-white hover:bg-white/20 transition-all hover:scale-105"
                             title={item.label}
                           >
                               <item.icon className="w-4 h-4" />
                           </Link>
                       ))}
                   </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Main Content with Error Boundary */}
      <main className="flex-grow overflow-hidden">
        <div className="page-container">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              {children}
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>

      {/* Sign Up Modal */}
      {showSignUp && isAuthenticated && (
        <SignUpForm
          onComplete={completeSignUp}
          onCancel={() => setShowSignUp(false)}
        />
      )}
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem('atom_eve_intro_seen_session');
  });

  const handleIntroComplete = () => {
    setShowIntro(false);
    sessionStorage.setItem('atom_eve_intro_seen_session', 'true');
  };

  if (showIntro) {
    return <IntroScreen onComplete={handleIntroComplete} />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <DashboardModeProvider>
          <CartProvider>
            <Suspense fallback={<LoadingFallback />}>
              <LayoutContent children={children} currentPageName={currentPageName} />
            </Suspense>
          </CartProvider>
        </DashboardModeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}