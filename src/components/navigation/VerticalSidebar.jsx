import React, { useState } from 'react';
import { Menu, Bell, Home, Radio, Compass, User } from 'lucide-react';

export default function VerticalSidebar() {
  const [bellActive, setBellActive] = useState(false);
  return (
    <aside className="hidden md:block fixed left-0 top-0 bottom-0 z-30" style={{ width: 280 }}>
      {/* Acrylic pane */}
      <div
        className="relative w-full h-full"
        style={{
          // ~70% transparency via 0.30 alpha stops
          background:
            'linear-gradient(180deg, rgba(15,23,42,0.30) 0%, rgba(17,24,39,0.30) 45%, rgba(24,24,35,0.30) 100%)',
          backdropFilter: 'blur(60px) saturate(180%)',
          WebkitBackdropFilter: 'blur(60px) saturate(180%)',
          borderRight: '1px solid rgba(255,255,255,0.10)',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.06), 0 10px 45px rgba(0,0,0,0.48), 0 0 52px rgba(34,211,238,0.12), 0 0 48px rgba(99,102,241,0.10)',
        }}
      >
        {/* Soft edge glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow: 'inset 0 0 40px rgba(255,255,255,0.06)'
          }}
        />
        {/* Edge glow accents */}
        <div
          className="pointer-events-none absolute -right-[1px] top-0 bottom-0 w-1"
          style={{
            background: 'linear-gradient(to bottom, rgba(34,211,238,0.35), rgba(99,102,241,0.25))',
            filter: 'blur(10px)'
          }}
        />
        <div
          className="pointer-events-none absolute -left-[1px] top-0 bottom-0 w-1"
          style={{
            background: 'linear-gradient(to bottom, rgba(34,211,238,0.20), rgba(99,102,241,0.18))',
            filter: 'blur(10px)'
          }}
        />
        {/* Subtle acrylic grain */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: 'linear-gradient(0deg, rgba(255,255,255,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.25) 1px, transparent 1px)',
            backgroundSize: '3px 3px'
          }}
        />

        {/* Content */}
        <div className="relative h-full flex flex-col px-4 py-5">
          {/* Top: Etched Neon Hamburger (#19) */}
          <div className="flex items-center justify-between mb-6">
            <button
              className="w-11 h-11 rounded-2xl flex items-center justify-center border transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(255,255,255,0.08)',
                boxShadow:
                  'inset 0 1px 2px rgba(255,255,255,0.15), inset 0 -2px 6px rgba(0,0,0,0.35)'
              }}
              aria-label="Open Menu"
            >
              <Menu
                className="w-5 h-5"
                style={{
                  stroke: 'rgba(255,255,255,0.45)',
                  strokeWidth: 1.8,
                  filter:
                    'drop-shadow(0 1px 0 rgba(255,255,255,0.35)) drop-shadow(0 -1px 0 rgba(0,0,0,0.55)) drop-shadow(0 0 10px rgba(34,211,238,0.22))',
                  mixBlendMode: 'overlay'
                }}
              />
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

          {/* Bottom: Etched Notification Bell (#18) */}
          <div className="mt-auto pt-4">
            <button
              onClick={() => setBellActive(v => !v)}
              aria-pressed={bellActive}
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all border"
              style={{
                background: 'rgba(255,255,255,0.06)',
                borderColor: bellActive ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.15)',
                boxShadow: bellActive
                  ? '0 0 20px rgba(251,191,36,0.18), inset 0 1px 2px rgba(255,255,255,0.15), inset 0 -2px 6px rgba(0,0,0,0.35)'
                  : 'inset 0 1px 2px rgba(255,255,255,0.12), inset 0 -2px 6px rgba(0,0,0,0.35)'
              }}
              aria-label="Notifications"
              title={bellActive ? 'Notifications (active)' : 'Notifications'}
            >
              <Bell
                className="w-5 h-5"
                style={{
                  stroke: bellActive ? 'rgba(251,191,36,0.9)' : 'rgba(255,255,255,0.55)',
                  strokeWidth: 1.8,
                  filter: bellActive
                    ? 'drop-shadow(0 0 6px rgba(251,191,36,0.55)) drop-shadow(0 0 12px rgba(251,191,36,0.35)) drop-shadow(0 0 20px rgba(251,191,36,0.25))'
                    : 'drop-shadow(0 1px 0 rgba(255,255,255,0.35)) drop-shadow(0 -1px 0 rgba(0,0,0,0.5))',
                  mixBlendMode: 'overlay'
                }}
              />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}