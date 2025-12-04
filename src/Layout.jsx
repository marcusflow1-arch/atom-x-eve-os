import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  LayoutGrid, ShoppingBag, Trophy, User, Gavel, Users, Bot, Library, Download, Mail, Bell, MessageSquare, LogIn, LogOut, Heart, Hammer, Clapperboard, ArrowLeftRight, Radio, Gamepad2, Settings, Home, Lightbulb, Rocket, Swords, Layers
} from 'lucide-react';
import { ThemeBackground } from '@/components/shared/ThemeSystem';
import { CartProvider } from './components/CartContext';
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
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
  const [drawerOpen, setDrawerOpen] = useState(false);

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
        { name: 'Cards', icon: Layers, path: createPageUrl('TradingCards') },
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
        { name: 'Trading Post', icon: ArrowLeftRight, path: createPageUrl('TradingPost') },
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
    { name: 'Trading Cards', icon: Layers, path: createPageUrl('TradingCards') },
    { name: 'Blacksmith', icon: Hammer, path: createPageUrl('Blacksmith') },
    { name: 'Events', icon: Trophy, path: createPageUrl('Events') },
    { name: 'Forums', icon: MessageSquare, path: createPageUrl('Community') },
    { name: 'Clans', icon: Users, path: createPageUrl('Clan') },
    { name: 'Game Dev Hub', icon: Rocket, path: createPageUrl('GameDevHub') },
    { name: 'Challenges', icon: Swords, path: createPageUrl('Challenges') },
    { name: 'AI Console', icon: Bot, path: createPageUrl('AIConsole') },
    { name: 'Trading Post', icon: ArrowLeftRight, path: createPageUrl('TradingPost') },
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
        <ThemeBackground themeId="electric_blue" />
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

      {/* Modern Top Navigation - Apple Liquid Glass Style */}
      <header className="modern-nav-header flex-shrink-0 z-20">
          <div className="nav-container">
            {/* Left: Nav Menu */}
            <nav className="nav-menu justify-self-start">
                {Object.entries(navGroups).map(([groupName, group]) => {
                  if (group.isLink) {
                    const isActive = location.pathname === group.path;
                    return (
                      <Link
                        key={groupName}
                        to={group.path}
                        className={`nav-item ${isActive ? 'active' : ''}`}
                      >
                        <group.icon size={16} className="nav-icon" />
                        <span className="nav-label">{groupName}</span>
                      </Link>
                    )
                  }
                  return (
                    <NavDropdown
                      key={groupName}
                      groupName={groupName}
                      icon={group.icon}
                      items={group.items}
                      currentPath={location.pathname}
                    />
                  )
                })}
            </nav>

            {/* Center: Brand Name */}
            <Link to={createPageUrl('Dashboard')} className="nav-brand">
                ATOM×EVE
            </Link>

            {/* Right: User Actions */}
            <div className="nav-actions flex items-center gap-3 justify-self-end">
                {isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden ring-2 ring-white/20">
                        {user?.avatar_url ? (
                          <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          getUserInitial()
                        )}
                      </div>
                      <span className="text-sm text-white/80 font-medium">{getDisplayName()}</span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white transition-all border border-white/10"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleSignIn}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white font-medium transition-all border border-white/10"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </button>
                )}
            </div>
          </div>
      </header>

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
        <CartProvider>
          <Suspense fallback={<LoadingFallback />}>
            <LayoutContent children={children} currentPageName={currentPageName} />
          </Suspense>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}