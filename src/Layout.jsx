import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  LayoutGrid, ShoppingBag, Trophy, User, Gavel, Users, Bot, Library, Download, Mail, Bell, MessageSquare, LogIn, LogOut, Heart, Hammer, Clapperboard, ArrowLeftRight, Radio, Gamepad2, Settings, Home, Lightbulb, Rocket
} from 'lucide-react';
import { ThemeBackground } from '@/components/shared/ThemeSystem';
import { CartProvider } from './components/CartContext';
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
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
            background: rgba(15, 23, 42, 0.7);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(59, 130, 246, 0.2);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            position: relative;
            z-index: 20;
          }

          .nav-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 24px;
            position: relative;
            z-index: 10;
          }

          .nav-brand {
            font-size: 1.6rem;
            font-weight: 900;
            letter-spacing: -1px;
            background: linear-gradient(45deg, #e0e7ff, #a5b4fc, #6366f1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .nav-brand:hover {
            transform: scale(1.03);
            text-shadow: 0 0 25px rgba(99, 102, 241, 0.6);
          }

          .nav-menu {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .nav-item {
            position: relative;
            padding: 8px 16px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            font-size: 0.9rem;
            text-decoration: none;
            color: #cbd5e1;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid transparent;
            background: rgba(45, 55, 72, 0.3);
            backdrop-filter: blur(5px);
            white-space: nowrap;
          }

          .nav-item:hover {
            transform: translateY(-2px);
            color: #f1f5f9;
            background: rgba(59, 130, 246, 0.2);
            border-color: rgba(59, 130, 246, 0.4);
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.2);
          }

          .nav-item.active {
            color: #ffffff;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(168, 85, 247, 0.3) 100%);
            border-color: rgba(59, 130, 246, 0.6);
            box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4), inset 0 1px 3px rgba(255, 255, 255, 0.2);
            transform: translateY(-1px);
          }

          .nav-item.active:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 25px rgba(59, 130, 246, 0.5), inset 0 1px 3px rgba(255, 255, 255, 0.3);
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

      {/* Modern Top Navigation */}
      <header className="modern-nav-header flex-shrink-0 z-20">
          <div className="nav-container">
            <Link to={createPageUrl('Dashboard')} className="nav-brand">
                ATOM×EVE OS
            </Link>

            <nav className="nav-menu">
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

            <div className="nav-actions flex items-center gap-4">
                {isAuthenticated ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                        {user?.avatar_url ? (
                          <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          getUserInitial()
                        )}
                      </div>
                      <span className="text-sm text-slate-300">{getDisplayName()}</span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
                      title="Sign Out"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleSignIn}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
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