import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthContext';
import { NAV_HIERARCHY } from '@/components/dashboard/NavigationConfig';
import {
  X, LogIn, LogOut, Settings, Rocket, Sparkles
} from 'lucide-react';

export default function MobileDrawer({ onClose }) {
  const { user, isAuthenticated, login, logout } = useAuth();
  const location = useLocation();

  const displayName = user?.username || user?.full_name || user?.email?.split('@')[0] || 'User';
  const initial = displayName ? displayName.charAt(0).toUpperCase() : 'U';

  const searchParams = new URLSearchParams(location.search);

  // Filter out legacy paths
  const legacyPaths = ['/adamxeve', '/home', '/dashboard'];
  const filteredNav = NAV_HIERARCHY.filter(
    item => !legacyPaths.includes(item.path.toLowerCase())
  );

  const isMainActive = (item) =>
    location.pathname === item.path && !searchParams.get('panel') && !searchParams.get('subview');

  const isSubActive = (mainItem, subItem) => {
    const subUrl = new URL(subItem.path, window.location.origin);
    const subParams = new URLSearchParams(subUrl.search);
    const panel = subParams.get('panel');
    const subview = subParams.get('subview');
    return (
      (panel && location.pathname === mainItem.path && searchParams.get('panel') === panel) ||
      (subview && location.pathname === mainItem.path && searchParams.get('subview') === subview)
    );
  };

  const isAdminMode =
    window.location.hostname === 'localhost' ||
    window.location.hostname.includes('preview') ||
    (isAuthenticated && user?.role === 'admin');

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: -320, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -320, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 left-0 bottom-0 w-80 z-[101] flex flex-col rounded-r-3xl"
        style={{
          background: 'rgba(100, 120, 140, 0.12)',
          backdropFilter: 'blur(30px) saturate(150%)',
          WebkitBackdropFilter: 'blur(30px) saturate(150%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.10)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Header */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white font-bold text-xl tracking-wider">ATOM×EVE</span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* User Info */}
          {isAuthenticated ? (
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(100, 120, 140, 0.10)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
            >
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden ring-2 ring-white/20">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{displayName}</p>
                <p className="text-white/40 text-xs truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { logout(); onClose(); }}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center text-white/50 hover:text-white transition-all"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { login(); onClose(); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-medium transition-all"
              style={{ background: 'rgba(100, 120, 140, 0.10)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
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
            {filteredNav.map((mainItem) => {
              const mainActive = isMainActive(mainItem);
              return (
                <div key={mainItem.name}>
                  <Link
                    to={mainItem.path}
                    onClick={onClose}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                      mainActive
                        ? 'text-white border border-cyan-400/30'
                        : 'text-white/60 hover:text-white border border-transparent'
                    }`}
                    style={mainActive ? {
                      background: 'rgba(34, 211, 238, 0.12)',
                      boxShadow: '0 0 12px rgba(34, 211, 238, 0.15)',
                    } : { background: 'transparent' }}
                  >
                    <mainItem.icon className="w-5 h-5" />
                    <span className="font-medium">{mainItem.name}</span>
                  </Link>

                  {mainItem.subPages && mainItem.subPages.length > 0 && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                      {mainItem.subPages.map((subItem) => {
                        const subActive = isSubActive(mainItem, subItem);
                        return (
                          <Link
                            key={subItem.name}
                            to={subItem.path}
                            onClick={onClose}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left ${
                              subActive
                                ? 'text-white border border-cyan-400/20'
                                : 'text-white/50 hover:text-white/80 border border-transparent'
                            }`}
                            style={subActive ? { background: 'rgba(34, 211, 238, 0.08)' } : { background: 'transparent' }}
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

            {/* Admin Links */}
            {isAdminMode && (
              <>
                <div className="my-2 border-t border-white/10" />
                <Link
                  to={createPageUrl('Engine')}
                  onClick={onClose}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                    location.pathname === createPageUrl('Engine')
                      ? 'bg-white/[0.1] text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Rocket className="w-5 h-5" />
                  <span className="font-medium">Engine</span>
                </Link>
                <Link
                  to={createPageUrl('Admin')}
                  onClick={onClose}
                  className={`mt-1 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
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
                  onClick={onClose}
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

        {/* Footer */}
        <div className="p-4">
          <p className="text-white/20 text-xs text-center">© 2025 ATOM×EVE</p>
        </div>
      </motion.div>
    </>
  );
}