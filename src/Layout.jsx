import React, { useEffect, useRef, useState, Suspense, lazy } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
                  LayoutGrid, ShoppingBag, Trophy, User, Gavel, Users, Bot, Library, Download, Mail, Bell, MessageSquare, LogIn, LogOut, Heart, Clapperboard, ArrowLeftRight, Radio, Gamepad2, Settings, Home, Lightbulb, Rocket, Swords, Layers, Crown, Target, TrendingUp, Calendar
                } from 'lucide-react';
import { ALL_NAV_ITEMS, NAV_GROUPS, NAV_HIERARCHY } from './components/dashboard/NavigationConfig';
import { ThemeBackground } from '@/components/shared/ThemeSystem';
import ScrollTransitionOverlay from '@/components/shared/ScrollTransitionOverlay';
import { CartProvider } from './components/CartContext';
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import { DashboardModeProvider, useDashboardMode } from './components/dashboard/DashboardModeContext';
import EnvStatus from './components/env/EnvStatus';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Star, Zap } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';
import DevTools from './components/dev/DevTools';

// Global styles (extracted for CSP compliance)
const globalStyles = `
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
    border-bottom: none;
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
`;

// Eagerly loaded components (critical path)
import PWAManifest from './components/desktop/PWAManifest';
import ServiceWorker from './components/desktop/ServiceWorker';
import SignUpForm from './components/auth/SignUpForm';
import IntroScreen from './components/intro/IntroScreen';
import CartDrawer from './components/cart/CartDrawer';
import { useCart } from './components/CartContext';

// Lazy loaded components (non-critical)
const SocialHub = lazy(() => import('./components/dashboard/SocialHub'));
const IntelligentCalendarOverlay = lazy(() => import('./components/calendar/IntelligentCalendarOverlay'));

// Route-level lazy loading fallback
const RouteLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}>
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-6"></div>
      <p className="text-white/60 text-lg font-medium tracking-wider">Loading...</p>
    </div>
  </div>
);

// Generic loading fallback for overlays
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
  const navigate = useNavigate();
  const [showRouteTransition, setShowRouteTransition] = useState(false);
  const [pendingRoute, setPendingRoute] = useState(null);
  const showLunaHeaderBar = ['/lunatemplate','/blacksmith','/seasonalpass','/entertainment','/clan','/community','/storyline','/worldevents'].some(s => location.pathname.toLowerCase().includes(s));
  const audioRef = useRef(null);
  const { user, isAuthenticated, login, logout, showSignUp, completeSignUp, setShowSignUp } = useAuth();
  const { mode, toggleMode } = useDashboardMode();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [socialHubOpen, setSocialHubOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { openCart, getCartCount } = useCart();

  const navGroups = NAV_GROUPS;
  const allNavItems = ALL_NAV_ITEMS;

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
    <div className="h-screen w-screen text-slate-300 font-sans flex flex-col overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}>
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <ThemeBackground themeId="moon_essence" />
      </div>

      <EnvStatus />
      <Toaster position="top-right" />
      <PWAManifest />
      <ServiceWorker />

      {/* Global Style */}
      {/* Global Styles - Extracted to reduce inline violations */}
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />



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
              className="fixed top-0 left-0 bottom-0 w-80 z-50 flex flex-col rounded-r-3xl"
              style={{ 
                background: 'rgba(100, 120, 140, 0.12)',
                backdropFilter: 'blur(30px) saturate(150%)',
                WebkitBackdropFilter: 'blur(30px) saturate(150%)',
                borderRight: '1px solid rgba(255, 255, 255, 0.10)',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
              }}
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
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(100, 120, 140, 0.10)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
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
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-medium transition-all hover:border-cyan-400/30"
                    style={{ background: 'rgba(100, 120, 140, 0.10)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
                    >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </button>
                )}
              </div>

              {/* Nav Items - Hierarchical */}
              <div className="flex-1 overflow-y-auto p-4">
                <p className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-3 px-2">Navigation</p>
                <div className="space-y-1">
                  {NAV_HIERARCHY.map((mainItem) => {
                    const searchParams = new URLSearchParams(location.search);
                    const isMainActive = location.pathname === mainItem.path && !searchParams.get('panel') && !searchParams.get('subview');

                    return (
                      <div key={mainItem.name}>
                        {/* Main Page Link */}
                        <Link
                          to={mainItem.path}
                          onClick={() => setDrawerOpen(false)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                            isMainActive 
                              ? 'text-white border border-cyan-400/30' 
                              : 'text-white/60 hover:text-white border border-transparent'
                          }`}
                          style={isMainActive ? { 
                            background: 'rgba(34, 211, 238, 0.12)', 
                            boxShadow: '0 0 12px rgba(34, 211, 238, 0.15)' 
                          } : { 
                            background: 'transparent' 
                          }}
                        >
                          <mainItem.icon className="w-5 h-5" />
                          <span className="font-medium">{mainItem.name}</span>
                        </Link>

                        {/* Sub-pages */}
                        {mainItem.subPages && mainItem.subPages.length > 0 && (
                          <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                            {mainItem.subPages.map((subItem) => {
                              const subUrl = new URL(subItem.path, window.location.origin);
                              const subParams = new URLSearchParams(subUrl.search);
                              const panel = subParams.get('panel');
                              const subview = subParams.get('subview');
                              
                              const isSubActive = 
                                (panel && location.pathname === mainItem.path && searchParams.get('panel') === panel) ||
                                (subview && location.pathname === mainItem.path && searchParams.get('subview') === subview);

                              return (
                                <Link
                                  key={subItem.name}
                                  to={subItem.path}
                                  onClick={() => setDrawerOpen(false)}
                                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left ${
                                    isSubActive 
                                      ? 'text-white border border-cyan-400/20' 
                                      : 'text-white/50 hover:text-white/80 border border-transparent'
                                  }`}
                                  style={isSubActive ? { 
                                    background: 'rgba(34, 211, 238, 0.08)', 
                                  } : { 
                                    background: 'transparent' 
                                  }}
                                >
                                  <subItem.icon className="w-4 h-4" />
                                  <span className="text-sm">{subItem.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Admin Link - Only in Editor/Preview (not in published app) */}
                  {(window.location.hostname === 'localhost' || window.location.hostname.includes('base44.app') || window.location.hostname.includes('preview')) && (
                    <>
                      <div className="my-2 border-t border-white/10" />
                      <Link
                            to={createPageUrl('Admin')}
                            onClick={() => setDrawerOpen(false)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                              location.pathname === createPageUrl('Admin')
                                ? 'bg-white/[0.1] text-white' 
                                : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                            }`}
                          >
                            <Settings className="w-5 h-5" />
                            <span className="font-medium">Admin</span>
                          </Link>

                          <Link
                            to={createPageUrl('AdminUIBuilder')}
                            onClick={() => setDrawerOpen(false)}
                            className={`mt-1 w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left ${
                              location.pathname === createPageUrl('AdminUIBuilder')
                                ? 'bg-white/[0.1] text-white' 
                                : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                            }`}
                          >
                            <Sparkles className="w-5 h-5" />
                            <span className="font-medium">UI Prompt Lab</span>
                          </Link>
                    </>
                  )}
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
        } else if (p.includes('/steamlibrary')) {
          headerConfig.hidden = true;
        } else if (p.includes('/store')) {
          headerConfig.hidden = true;
        } else if (p.includes('/clan')) {
          headerConfig.title = "";
          headerConfig.showLevel = false;
          headerConfig.showDiscord = false;
        } else if (p.includes('/worldevents')) {
                        headerConfig.hidden = true;
                      } else if (p.includes('/friends')) {
                                      headerConfig.hidden = true;
                                    } else if (p.includes('/genremastery')) {
                                      headerConfig.hidden = true;
                                    } else if (p.includes('/library')) {
          headerConfig.title = "";
          headerConfig.showLevel = false;
          headerConfig.showDiscord = false;
        } else if (p.includes('/achievements') || p.includes('/aiachievements')) {
          headerConfig.hidden = false;
          headerConfig.showMenu = true;
          headerConfig.title = "Achievement Cards";
          headerConfig.showLevel = false;
          headerConfig.showDiscord = false;
        } else if (p.includes('/leaderboard')) {
          headerConfig.hidden = true;
        } else if (p.includes('/library')) {
          headerConfig.hidden = true;
        } else if (p.includes('/genremastery')) {
          headerConfig.title = "Adam - Marcus | Skill Tree";
          headerConfig.showLevel = false;
          headerConfig.showDiscord = false;
        } else if (p.includes('/lunatemplate')) {
          headerConfig.title = "ATOM - Marcus | Luna Dashboard";
          headerConfig.showLevel = true;
          headerConfig.showDiscord = true;
          headerConfig.showModeToggle = true;
        } else if (p.includes('/seasonalpass')) {
          headerConfig.hidden = true;
        } else if (p.includes('/blacksmith')) {
          headerConfig.title = "";
          headerConfig.showLevel = false;
          headerConfig.showDiscord = false;
        } else if (p.includes('/tradingpost')) {
          headerConfig.title = "Adam - Marcus | Avatar Profile";
          headerConfig.showLevel = false;
          headerConfig.showDiscord = false;
        } else if (p.includes('/community')) {
          headerConfig.title = "";
          headerConfig.showLevel = false;
          headerConfig.discordSmall = true;
        }

        if (headerConfig.hidden) return null;

        // Check if we're in editor/preview mode (not published)
        const isEditorMode = window.location.hostname === 'localhost' || window.location.hostname.includes('base44.app') || window.location.hostname.includes('preview');

        const DOCK_ITEMS_LEFT = [
          { id: 'achievements', label: 'Achievements', icon: Trophy, route: 'Achievements' },
          { id: 'community', label: 'Community', icon: MessageSquare, route: 'Community' },
        ];

        const DOCK_ITEMS_RIGHT = [
          { id: 'marketplace', label: 'Market', icon: Target, route: 'Store?mode=marketplace' },
          { id: 'social', label: 'Social Hub', icon: TrendingUp, action: () => setSocialHubOpen(true) },
        ];

        return (
          <div className="fixed top-0 left-0 right-0 z-40 flex flex-col" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 100%)' }}>
            <div className="h-16 flex items-center justify-between px-6">
              <div className="flex items-center gap-6">
                {headerConfig.showMenu && (
                  <>
                    {/* Menu Button - circular like Store */}
                    <button
                      onClick={() => setDrawerOpen(true)}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all shadow-lg border border-white/10"
                    >
                      <div className="flex flex-col gap-[3px]">
                        <span className="w-4 h-[2px] bg-white/90 rounded-full"></span>
                        <span className="w-4 h-[2px] bg-white/90 rounded-full"></span>
                        <span className="w-4 h-[2px] bg-white/90 rounded-full"></span>
                      </div>
                    </button>

                    {!showLunaHeaderBar && headerConfig.title && (
                      <span className="text-xl font-bold tracking-wider text-white/90 drop-shadow-md ml-4">
                        {headerConfig.title}
                      </span>
                    )}

                    {showLunaHeaderBar && (
                      <>
                        {/* Title - same size as Store */}
                        <span className="text-xl font-bold tracking-wider text-white/90 drop-shadow-md">
                          Atom X Eve Dashboard Home
                        </span>

                        {/* Divider */}
                        <div className="h-6 w-px bg-white/20 mx-2"></div>

                        {/* Sub-Page Links */}
                        <div className="flex items-center gap-2">
                          {/* Home Button with layered effect like Store */}
                          <div className="relative inline-block">
                            <button
                              onClick={() => {
                                const isOnLunaPage = location.pathname.toLowerCase().includes('/lunatemplate');
                                if (!isOnLunaPage) {
                                  navigate(createPageUrl('LunaTemplate'));
                                } else {
                                  navigate(createPageUrl('Store'));
                                }
                              }}
                              className="relative z-10 px-4 py-2 rounded-full text-sm font-medium transition-all backdrop-blur-md border bg-white/20 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                            >
                              Home
                            </button>
                            <div
                              aria-hidden
                              className="pointer-events-none absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-full px-4 py-2 border bg-white/10 border-white/20 text-white/60 backdrop-blur-md z-0 flex items-center justify-center"
                            >
                              <span className="text-sm font-medium">Store</span>
                            </div>
                          </div>

                          {/* Clan */}
                          <button
                            onClick={() => navigate(createPageUrl(location.pathname.toLowerCase().includes('/clan') ? 'LunaTemplate' : 'Clan'))}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all backdrop-blur-md border ${
                              location.pathname.toLowerCase().includes('/clan')
                                ? 'bg-white/20 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                                : 'bg-transparent border-transparent text-white/60 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            Clan
                          </button>

                          {/* Forum */}
                          <button
                            onClick={() => navigate(createPageUrl(location.pathname.toLowerCase().includes('/community') ? 'LunaTemplate' : 'Community'))}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all backdrop-blur-md border ${
                              location.pathname.toLowerCase().includes('/community')
                                ? 'bg-white/20 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                                : 'bg-transparent border-transparent text-white/60 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            Forum
                          </button>

                          {/* Aura */}
                          <button
                            onClick={() => navigate(createPageUrl(location.pathname.toLowerCase().includes('/aura') ? 'LunaTemplate' : 'Aura'))}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all backdrop-blur-md border ${
                              location.pathname.toLowerCase().includes('/aura')
                                ? 'bg-white/20 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                                : 'bg-transparent border-transparent text-white/60 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            Aura
                          </button>

                          {/* Discord */}
                          <a
                            href="https://discord.gg/VJQQNxAa"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 rounded-full text-sm font-medium transition-all backdrop-blur-md border bg-[#5865F2]/20 border-[#5865F2]/30 text-[#5865F2] hover:bg-[#5865F2]/30 hover:text-white flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                            </svg>
                            Discord
                          </a>
                        </div>
                      </>
                    )}
                  </>
                )}

            </div>
            </div>


            </div>
            );
      })()}

      {/* Removed Luna header bar - now part of page content for seamless animation */}





      {/* Main Content with Error Boundary */}
      <main className="flex-grow overflow-hidden">
        <div className="page-container">
          <ErrorBoundary>
            <Suspense fallback={<RouteLoadingFallback />}>
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

      {/* Social Hub Overlay */}
      <AnimatePresence>
        {socialHubOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
              onClick={() => setSocialHubOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-4 bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-3xl z-[60] overflow-hidden shadow-2xl"
            >
              {/* Close Button */}
              <button
                onClick={() => setSocialHubOpen(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Social Hub Content */}
              <div className="w-full h-full overflow-hidden">
                <Suspense fallback={<LoadingFallback />}>
                  <SocialHub />
                </Suspense>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Calendar Overlay */}
      <AnimatePresence>
        {calendarOpen && (
          <Suspense fallback={<LoadingFallback />}>
            <IntelligentCalendarOverlay 
              onClose={() => setCalendarOpen(false)} 
              currentUserId={user?.id} 
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <CartDrawer />



      {/* Route Transition Overlay */}
      <AnimatePresence>
        {showRouteTransition && (
          <ScrollTransitionOverlay
            onComplete={() => {
              const to = pendingRoute;
              setShowRouteTransition(false);
              setPendingRoute(null);
              if (to) navigate(to);
            }}
          />
        )}
      </AnimatePresence>

      {/* Dev Tools Panel */}
      <DevTools />
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem('atom_eve_intro_seen_session');
  });

  const handleIntroComplete = () => {
    setTimeout(() => {
      setShowIntro(false);
      sessionStorage.setItem('atom_eve_intro_seen_session', 'true');
      navigate(createPageUrl('LunaTemplate'));
    }, 400);
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