import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Radio, ShoppingBag, MessageSquare } from 'lucide-react';

export default function FloatingDock() {
  const location = useLocation();

  const items = [
    { key: 'home', label: 'Home', to: createPageUrl('LunaTemplate'), icon: Home },
    { key: 'stream', label: 'Streaming', to: createPageUrl('Streaming'), icon: Radio },
    { key: 'store', label: 'Store', to: createPageUrl('Store'), icon: ShoppingBag },
    { key: 'community', label: 'Community', to: createPageUrl('Community'), icon: MessageSquare },
  ];

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-4 md:bottom-6 z-[70] pointer-events-none">
      <div
        className="pointer-events-auto relative mx-auto flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-full"
        style={{
          background: 'rgba(255,255,255,0.10)',
          border: '1px solid rgba(255,255,255,0.18)',
          backdropFilter: 'blur(26px) saturate(140%)',
          WebkitBackdropFilter: 'blur(26px) saturate(140%)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.55), 0 10px 30px rgba(0,0,0,0.35)',
        }}
      >
        {/* subtle inner highlight */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -2px 6px rgba(0,0,0,0.25)' }}
        />

        {items.map(({ key, label, to, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={key}
              to={to}
              title={label}
              className={`relative group rounded-full px-3 md:px-3.5 py-2 flex items-center gap-2 transition-all ${
                isActive ? 'text-white' : 'text-white/70 hover:text-white'
              }`}
              style={{
                border: '1px solid rgba(255,255,255,0.12)',
                background: isActive ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
              }}
            >
              <Icon
                className="w-5 h-5"
                style={{
                  filter: isActive
                    ? 'drop-shadow(0 0 8px rgba(34,211,238,0.35))'
                    : 'drop-shadow(0 1px 0 rgba(255,255,255,0.25))',
                }}
              />
              <span className="hidden md:inline text-sm font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}