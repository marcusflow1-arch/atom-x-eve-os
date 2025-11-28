import React from 'react';
import { Mail, Bell, User, Settings, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '../auth/AuthContext';

export default function ProfileModule() {
  const { user, isAuthenticated } = useAuth();

  const getDisplayName = () => {
    if (!user) return 'Guest User';
    return user.username || user.full_name || user.email?.split('@')[0] || 'Player';
  };

  const getUserInitial = () => {
    const name = getDisplayName();
    return name.charAt(0).toUpperCase();
  };

  const menuItems = [
    { icon: User, label: 'Profile', href: createPageUrl('Profile'), badge: 0 },
    { icon: Mail, label: 'Messages', href: createPageUrl('Mailbox'), badge: user?.unread_messages || 0 },
    { icon: Bell, label: 'Notifications', href: createPageUrl('Notifications'), badge: user?.unread_notifications || 0 },
    { icon: Trophy, label: 'Achievements', href: createPageUrl('Achievements'), badge: 0 },
    { icon: Settings, label: 'Settings', href: '#', badge: 0 },
  ];

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* User Avatar */}
      <div className="relative">
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-slate-700 border-2 border-slate-500">
          {isAuthenticated && user?.avatar_url ? (
            <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-full" />
          ) : (
            <span className="text-2xl font-bold text-white">{getUserInitial()}</span>
          )}
          <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-slate-800 ${isAuthenticated ? 'bg-green-400' : 'bg-slate-500'}`}></div>
        </div>
      </div>

      {/* Icon Menu Items */}
      <div className="flex flex-col gap-3 w-full">
        {menuItems.map((item, index) => (
          <Link 
            key={index} 
            to={item.href || '#'} 
            className="relative group"
            title={item.label}
          >
            <div className="w-full aspect-square bg-slate-800/70 hover:bg-slate-700/70 border border-slate-600 hover:border-blue-500/50 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 cursor-pointer">
              <item.icon className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors" />
              {item.badge > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-xs text-white font-bold border-2 border-slate-800">
                  {item.badge}
                </div>
              )}
            </div>
            {/* Tooltip on hover */}
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {item.label}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}