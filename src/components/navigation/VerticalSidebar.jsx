import React from 'react';
import { Menu, Bell, Home, Radio, Compass, User } from 'lucide-react';

export default function VerticalSidebar() {
  return (
    <aside className="hidden md:block fixed left-0 top-0 bottom-0 z-30" style={{ width: 280 }}>
      {/* Acrylic pane */}
      <div
        className="relative w-full h-full"
        style={{
          background:
            'linear-gradient(180deg, rgba(15,23,42,0.32) 0%, rgba(17,24,39,0.30) 45%, rgba(24,24,35,0.28) 100%)',
          backdropFilter: 'blur(55px) saturate(180%)',
          WebkitBackdropFilter: 'blur(55px) saturate(180%)',
          borderRight: '1px solid rgba(255,255,255,0.10)',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.06), 0 10px 40px rgba(0,0,0,0.45), 0 0 42px rgba(34,211,238,0.10)',
        }}
      >
        {/* Soft edge glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow: 'inset 0 0 40px rgba(255,255,255,0.06)',
          }}
        />
        <div
          className="pointer-events-none absolute -right-[1px] top-0 bottom-0 w-1"
          style={{
            background: 'linear-gradient(to bottom, rgba(34,211,238,0.35), rgba(99,102,241,0.25))',
            filter: 'blur(8px)',
          }}
        />

        {/* Content */}
        <div className="relative h-full flex flex-col px-4 py-5">
          {/* Top: Neon Hamburger */}
          <div className="flex items-center justify-between mb-6">
            <button
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-cyan-300 border border-cyan-500/30 shadow-[0_0_18px_rgba(6,182,212,0.35)]"
              style={{
                background:
                  'linear-gradient(135deg, rgba(34,211,238,0.15) 0%, rgba(99,102,241,0.12) 100%)',
              }}
              aria-label="Open Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Profile shortcut chip */}
            <div
              className="px-3 py-2 rounded-xl text-white/80 text-xs border border-white/10"
              style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)' }}
            >
              Aura
            </div>
          </div>

          {/* Nav icons */}
          <nav className="flex-1">
            <ul className="space-y-2">
              {[
                { key: 'home', icon: Home, label: 'Home' },
                { key: 'discover', icon: Compass, label: 'Discover' },
                { key: 'streaming', icon: Radio, label: 'Streaming' },
                { key: 'profile', icon: User, label: 'Profile' },
              ].map((item) => (
                <li key={item.key}>
                  <button
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:text-white border border-transparent hover:border-white/10 transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)' }}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Bottom: Etched Notification Bell */}
          <div className="mt-auto pt-4">
            <button
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white/80 border border-white/15 hover:text-white transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)' }}
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}