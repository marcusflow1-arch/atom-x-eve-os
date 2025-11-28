import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Wrench, Calendar, Award, ShieldAlert, CheckCircle } from 'lucide-react';

const notifications = [
    { id: 1, type: 'patch', title: 'Patch 1.2.5 Live', description: 'New balance changes for Cyberpunk 2088 and StarCraft: Ghost Protocol have been deployed. Added new legendary items to the Blacksmith.', timestamp: '3 hours ago', read: false, icon: <Wrench className="w-6 h-6 text-cyan-400"/> },
    { id: 2, type: 'event', title: "Event Starting: Leviathan's Rise", description: 'The world event has begun! Join the fight against the Abyssal Leviathan to earn exclusive rewards.', timestamp: '1 day ago', read: false, icon: <Calendar className="w-6 h-6 text-yellow-400"/> },
    { id: 3, type: 'achievement', title: 'Achievement Unlocked: "Dragon Slayer"', description: 'Congratulations! You have unlocked a Legendary achievement in Elder Scrolls: Reborn. +250 AGP awarded.', timestamp: '2 days ago', read: true, icon: <Award className="w-6 h-6 text-orange-400"/> },
    { id: 4, type: 'system', title: 'Account Security Update', description: 'Two-factor authentication is now available for your account. Visit settings to enable it for enhanced security.', timestamp: '4 days ago', read: true, icon: <ShieldAlert className="w-6 h-6 text-red-400"/> },
    { id: 5, type: 'patch', title: 'Hotfix 1.2.4a', description: 'Fixed a critical bug causing crashes in the Blacksmith interface. Performance improvements across the OS.', timestamp: '1 week ago', read: true, icon: <Wrench className="w-6 h-6 text-cyan-400"/> },
];

export default function Notifications() {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-black min-h-screen text-slate-200 p-8">
      <style>{`.glass-panel { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(16px); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 16px; }`}</style>
      
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
          <Bell /> Notifications
        </h1>
        <p className="text-slate-400 text-lg">All your system updates, alerts, and news in one place.</p>
      </header>

      <div className="max-w-4xl mx-auto space-y-4">
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className={`glass-panel p-5 flex items-start gap-5 transition-all duration-300 ${!notification.read ? 'border-blue-500/50' : 'opacity-70'}`}
          >
            <div className={`flex-shrink-0 p-3 rounded-full bg-slate-800/50 ${!notification.read ? 'shadow-lg' : ''}`}>
              {notification.icon}
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-center mb-1">
                <h3 className={`font-bold text-lg ${!notification.read ? 'text-white' : 'text-slate-300'}`}>{notification.title}</h3>
                <p className="text-xs text-slate-400">{notification.timestamp}</p>
              </div>
              <p className="text-slate-300">{notification.description}</p>
            </div>
            {!notification.read && (
              <div className="w-3 h-3 bg-blue-400 rounded-full self-start mt-2 animate-pulse"></div>
            )}
          </motion.div>
        ))}
        
        <div className="text-center pt-4">
            <button className="text-slate-400 hover:text-white transition-colors">Mark all as read</button>
        </div>
      </div>
    </div>
  );
}