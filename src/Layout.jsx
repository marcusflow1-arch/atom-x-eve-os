import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
              LayoutGrid, ShoppingBag, Trophy, User, Gavel, Users, Bot, Library, Download, Mail, Bell, MessageSquare, LogIn, LogOut, Heart, Hammer, Clapperboard, ArrowLeftRight, Radio, Gamepad2, Settings, Home, Lightbulb, Rocket, Swords, Layers, Crown, Target, TrendingUp
            } from 'lucide-react';
import { ALL_NAV_ITEMS, NAV_GROUPS } from './components/dashboard/NavigationConfig';
import { ThemeBackground } from '@/components/shared/ThemeSystem';
import ScrollTransitionOverlay from '@/components/shared/ScrollTransitionOverlay';
import { CartProvider } from './components/CartContext';
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import { DashboardModeProvider, useDashboardMode } from './components/dashboard/DashboardModeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';

import PWAManifest from './components/desktop/PWAManifest';
import ServiceWorker from './components/desktop/ServiceWorker';
import SignUpForm from './components/auth/SignUpForm';
import IntroScreen from './components/intro/IntroScreen';
import SocialHub from './components/dashboard/SocialHub';

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
  const navigate = useNavigate();
  const [showRouteTransition, setShowRouteTransition] = useState(false);
  const [pendingRoute, setPendingRoute] = useState(null);
  const showLunaHeaderBar = ['/lunatemplate','/blacksmith','/seasonalpass','/entertainment','/clan'].some(s => location.pathname.toLowerCase().includes(s));
  const audioRef = useRef(null);
  const { user, isAuthenticated, login, logout, showSignUp, completeSignUp, setShowSignUp } = useAuth();
  const { mode, toggleMode } = useDashboardMode();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [socialHubOpen, setSocialHubOpen] = useState(false);

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

                  {/* Admin Link - Only in Editor */}
                  {(window.location.hostname === 'localhost' || window.location.hostname.includes('base44.app')) && (
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
        } else if (p.includes('/library')) {
          headerConfig.title = "";
          headerConfig.showLevel = false;
          headerConfig.showDiscord = false;
        } else if (p.includes('/achievements')) {
          headerConfig.title = "";
          headerConfig.showLevel = false;
          headerConfig.showDiscord = false;
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
          headerConfig.title = "";
          headerConfig.showLevel = false;
          headerConfig.showDiscord = false;
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

        const DOCK_ITEMS = [

          { id: 'achievements', label: 'Achievements', icon: Trophy, route: 'Achievements' },
          { id: 'community', label: 'Community', icon: MessageSquare, route: 'Community' },
          { id: 'marketplace', label: 'Market', icon: Target, route: 'Store?mode=marketplace' },
        ];

        return (
          <div className="fixed top-4 left-4 z-40 flex flex-col gap-1.5">
            {headerConfig.showMenu && (
                                <div className="flex items-center gap-3">
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

                                  {showLunaHeaderBar && (
                                                                            <div className="flex items-center gap-6 ml-4">
                                                                              <span className="text-base md:text-lg font-semibold text-white/90 tracking-wide">
                                                                                                                            Atom X Eve Dashboard Home
                                                                                                                          </span>

                                                                              <div className="h-6 w-px bg-white/20" />

                                                                              <button
                                                                                onClick={() => navigate(createPageUrl(location.pathname.toLowerCase().includes('/blacksmith') ? 'LunaTemplate' : 'Blacksmith'))}
                                                                                className={`relative px-5 py-2 rounded-full text-base font-medium transition-all backdrop-blur-md border ${
                                                                                  location.pathname.toLowerCase().includes('/blacksmith')
                                                                                    ? 'bg-white/20 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                                                                                    : 'bg-transparent border-transparent text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20'
                                                                                }`}
                                                                              >
                                                                                <span className="flex items-center gap-2">
                                                                                  <Hammer className="w-4 h-4" />
                                                                                  {location.pathname.toLowerCase().includes('/blacksmith') ? 'Dashboard' : 'Blacksmith'}
                                                                                </span>
                                                                              </button>

                                                                              <button
                                                                                onClick={() => navigate(createPageUrl(location.pathname.toLowerCase().includes('/seasonalpass') ? 'LunaTemplate' : 'SeasonalPass'))}
                                                                                className={`relative px-5 py-2 rounded-full text-base font-medium transition-all backdrop-blur-md border ${
                                                                                  location.pathname.toLowerCase().includes('/seasonalpass')
                                                                                    ? 'bg-white/20 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                                                                                    : 'bg-transparent border-transparent text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20'
                                                                                }`}
                                                                              >
                                                                                <span className="flex items-center gap-2">
                                                                                  <Crown className="w-4 h-4" />
                                                                                  {location.pathname.toLowerCase().includes('/seasonalpass') ? 'Dashboard' : 'Season Pass'}
                                                                                </span>
                                                                              </button>

                                                                              <button
                                                                                onClick={() => navigate(createPageUrl(location.pathname.toLowerCase().includes('/entertainment') ? 'LunaTemplate' : 'Entertainment'))}
                                                                                className={`relative px-5 py-2 rounded-full text-base font-medium transition-all backdrop-blur-md border ${
                                                                                  location.pathname.toLowerCase().includes('/entertainment')
                                                                                    ? 'bg-white/20 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                                                                                    : 'bg-transparent border-transparent text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20'
                                                                                }`}
                                                                              >
                                                                                <span className="flex items-center gap-2">
                                                                                  <Clapperboard className="w-4 h-4" />
                                                                                  {location.pathname.toLowerCase().includes('/entertainment') ? 'Dashboard' : 'Entertainment'}
                                                                                </span>
                                                                              </button>

                                                                              <button
                                                                                onClick={() => navigate(createPageUrl(location.pathname.toLowerCase().includes('/clan') ? 'LunaTemplate' : 'Clan'))}
                                                                                className={`relative px-5 py-2 rounded-full text-base font-medium transition-all backdrop-blur-md border ${
                                                                                  location.pathname.toLowerCase().includes('/clan')
                                                                                    ? 'bg-white/20 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                                                                                    : 'bg-transparent border-transparent text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20'
                                                                                }`}
                                                                              >
                                                                                <span className="flex items-center gap-2">
                                                                                  <Users className="w-4 h-4" />
                                                                                  {location.pathname.toLowerCase().includes('/clan') ? 'Dashboard' : 'Clan'}
                                                                                </span>
                                                                              </button>

                                                                              <button
                                                                                onClick={() => navigate(createPageUrl(location.pathname.toLowerCase().includes('/community') ? 'LunaTemplate' : 'Community'))}
                                                                                className={`relative px-5 py-2 rounded-full text-base font-medium transition-all backdrop-blur-md border ${
                                                                                  location.pathname.toLowerCase().includes('/community')
                                                                                    ? 'bg-white/20 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                                                                                    : 'bg-transparent border-transparent text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20'
                                                                                }`}
                                                                              >
                                                                                <span className="flex items-center gap-2">
                                                                                  <MessageSquare className="w-4 h-4" />
                                                                                  {location.pathname.toLowerCase().includes('/community') ? 'Dashboard' : 'Forum'}
                                                                                </span>
                                                                              </button>
                                                                              </div>
                                                                              )}
                                </div>
                              )}

            {/* Under Bar Content: Page Name & Dock Items */}
            {(headerConfig.showModeToggle || headerConfig.showDock) && (
              <div className="flex items-center gap-6 mt-1 pl-1">


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
                       <button
                         onClick={() => setSocialHubOpen(true)}
                         className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-white hover:bg-white/20 transition-all hover:scale-105"
                         title="Social Hub"
                       >
                         <TrendingUp className="w-4 h-4" />
                       </button>
                   </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {showLunaHeaderBar && (
                    <div className="fixed inset-x-0 top-0 h-20 bg-white/[0.06] backdrop-blur-xl border-b border-white/10 z-20 pointer-events-none" />
                  )}

      {showLunaHeaderBar && (
        <div className="fixed top-4 right-4 z-40 flex items-center gap-4">
          <motion.button
            className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 flex items-center justify-center transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)] border-2 border-white/20"
            style={{ WebkitBackdropFilter: 'blur(40px) saturate(200%)' }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`${location.pathname}?panel=profile`)}
            title="Profile"
          >
            <User className="w-6 h-6 text-white" />
          </motion.button>
          <motion.button
            className="w-12 h-12 rounded-full bg-white/[0.05] backdrop-blur-2xl hover:bg-white/[0.1] flex items-center justify-center transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-white/10"
            style={{ WebkitBackdropFilter: 'blur(40px) saturate(200%)' }}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`${location.pathname}?panel=settings`)}
            title="Settings"
          >
            <Settings className="w-6 h-6 text-white/80" />
          </motion.button>
        </div>
      )}

      {/* Main Content with Error Boundary */}
      <main className="flex-grow overflow-hidden">
        <div className="page-container">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              {showLunaHeaderBar ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={location.pathname}
                    className="pt-[81px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              ) : (
                children
              )}
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
                <SocialHub />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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