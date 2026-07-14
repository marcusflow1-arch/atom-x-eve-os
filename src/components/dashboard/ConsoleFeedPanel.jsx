import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Users, Trophy, Gamepad2, Bell, TrendingUp, Zap, Star, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../auth/AuthContext';

const MOCK_WHATS_NEW = [
  { id: 1, type: 'feature', title: 'Living Quest System', desc: 'Branching storylines with continuous NPC dialogue now live.', icon: '🎯', tag: 'New Feature', color: 'from-cyan-500/20 to-blue-500/20', borderColor: 'border-cyan-400/30' },
  { id: 2, type: 'update', title: 'Storefront Redesign', desc: 'Six new scrollable sections: New Releases, Top Sellers, Coming Soon, Special Offers, Free to Play & Editor\'s Choice.', icon: '🛒', tag: 'Update', color: 'from-purple-500/20 to-pink-500/20', borderColor: 'border-purple-400/30' },
  { id: 3, type: 'event', title: 'Season 3 Begins', desc: 'New achievement cards, weapon mastery paths, and boss raids available now.', icon: '⚔️', tag: 'Seasonal', color: 'from-amber-500/20 to-orange-500/20', borderColor: 'border-amber-400/30' },
  { id: 4, type: 'feature', title: 'Clan Hall Upgrades', desc: 'GW2-style upgrade lanes: Tactics, Economy, Politics, War, and Art of War.', icon: '🏰', tag: 'New Feature', color: 'from-emerald-500/20 to-teal-500/20', borderColor: 'border-emerald-400/30' },
  { id: 5, type: 'update', title: 'AI Behavior Profiles', desc: 'NPCs now have evolving moods, moral alignment, and environmental awareness.', icon: '🤖', tag: 'Update', color: 'from-indigo-500/20 to-violet-500/20', borderColor: 'border-indigo-400/30' },
  { id: 6, type: 'event', title: 'Trading Post Live', desc: 'Player-to-player item exchange with card listings and auction system.', icon: '💱', tag: 'New Feature', color: 'from-rose-500/20 to-red-500/20', borderColor: 'border-rose-400/30' },
];

const MOCK_FRIEND_ACTIVITY = [
  { id: 1, name: 'Shadow_Striker', avatar: 'https://i.pravatar.cc/150?u=1', action: 'unlocked', achievement: 'Dragon Slayer', game: 'Cyberpunk 2088', rarity: 'Legendary', time: '2 min ago' },
  { id: 2, name: 'CyberVixen', avatar: 'https://i.pravatar.cc/150?u=2', action: 'reached', achievement: 'Level 50', game: 'Final Fantasy XIV', rarity: 'Epic', time: '15 min ago' },
  { id: 3, name: 'GhostReaper', avatar: 'https://i.pravatar.cc/150?u=3', action: 'completed', achievement: 'Speed Demon', game: 'Neon Legends', rarity: 'Rare', time: '1 hour ago' },
  { id: 4, name: 'IronFist', avatar: 'https://i.pravatar.cc/150?u=4', action: 'unlocked', achievement: 'Arena Champion', game: 'Apex Surge', rarity: 'Epic', time: '2 hours ago' },
  { id: 5, name: 'NovaStar', avatar: 'https://i.pravatar.cc/150?u=5', action: 'collected', achievement: 'Mythic Blade', game: 'Shadow Realm', rarity: 'Mythical', time: '3 hours ago' },
  { id: 6, name: 'Shadow_Striker', avatar: 'https://i.pravatar.cc/150?u=1', action: 'unlocked', achievement: 'Explorer', game: 'Stellar Odyssey', rarity: 'Common', time: '5 hours ago' },
];

const RARITY_STYLES = {
  Legendary: { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-400/30' },
  Epic: { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-400/30' },
  Rare: { bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-400/30' },
  Common: { bg: 'bg-white/10', text: 'text-white/60', border: 'border-white/20' },
  Mythical: { bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-400/30' },
};

function WhatsNewSection() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.PlatformUpdate.filter({ published: true });
        if (data && data.length > 0) {
          setUpdates(data.slice(0, 8).map((u, i) => ({
            id: u.id || i,
            type: u.type || 'update',
            title: u.title || 'Platform Update',
            desc: u.description || u.summary || '',
            icon: u.icon || '✨',
            tag: u.category || 'Update',
            color: MOCK_WHATS_NEW[i % MOCK_WHATS_NEW.length].color,
            borderColor: MOCK_WHATS_NEW[i % MOCK_WHATS_NEW.length].borderColor,
          })));
        } else {
          setUpdates(MOCK_WHATS_NEW);
        }
      } catch {
        setUpdates(MOCK_WHATS_NEW);
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {updates.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className={`relative rounded-xl border ${item.borderColor} p-4 overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform`}
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-50 group-hover:opacity-80 transition-opacity`} />
          <div className="relative flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xl flex-shrink-0">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                  {item.tag}
                </span>
              </div>
              <h4 className="text-white font-bold text-sm leading-tight truncate">{item.title}</h4>
              <p className="text-white/50 text-[11px] leading-snug mt-1 line-clamp-2">{item.desc}</p>
            </div>
            <Sparkles className="w-4 h-4 text-white/20 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function FriendsActivitySection() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.UserAchievement.list('-created_date', 12);
        const list = Array.isArray(data) ? data : (data?.data || []);
        if (list.length > 0) {
          setActivities(list.slice(0, 8).map((ua, i) => ({
            id: ua.id || i,
            name: ua.user_name || ua.username || 'Player',
            avatar: ua.user_avatar || `https://i.pravatar.cc/150?u=${ua.user_id || i}`,
            action: 'unlocked',
            achievement: ua.achievement_title || ua.title || 'Achievement',
            game: ua.game || 'Unknown Game',
            rarity: ua.rarity || 'Common',
            time: ua.created_date ? new Date(ua.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently',
          })));
        } else {
          setActivities(MOCK_FRIEND_ACTIVITY);
        }
      } catch {
        setActivities(MOCK_FRIEND_ACTIVITY);
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {activities.map((act, i) => {
        const rarity = RARITY_STYLES[act.rarity] || RARITY_STYLES.Common;
        return (
          <motion.div
            key={act.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`relative rounded-xl border ${rarity.border} p-3 flex items-center gap-3 group hover:bg-white/[0.04] transition-colors cursor-pointer`}
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <img src={act.avatar} alt={act.name} className="w-10 h-10 rounded-lg object-cover border border-white/10" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-[#0a0d14]" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-white font-semibold text-xs truncate">{act.name}</span>
                <span className="text-white/40 text-[10px]">{act.action}</span>
                <span className={`text-[10px] font-bold truncate ${rarity.text}`}>{act.achievement}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Gamepad2 className="w-3 h-3 text-white/30" />
                <span className="text-white/40 text-[10px] truncate">{act.game}</span>
                <span className="text-white/20 text-[10px]">•</span>
                <Clock className="w-2.5 h-2.5 text-white/20" />
                <span className="text-white/30 text-[10px]">{act.time}</span>
              </div>
            </div>

            {/* Rarity Badge */}
            <div className={`flex-shrink-0 px-2 py-1 rounded-lg ${rarity.bg} ${rarity.text} text-[9px] font-bold uppercase tracking-wider border ${rarity.border}`}>
              {act.rarity}
            </div>

            {/* Trophy Icon */}
            <Trophy className={`w-5 h-5 ${rarity.text} flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity`} />
          </motion.div>
        );
      })}
    </div>
  );
}

export default function ConsoleFeedPanel() {
  const [activeTab, setActiveTab] = useState('whatsnew');

  const tabs = [
    { id: 'whatsnew', label: "What's New", icon: Bell },
    { id: 'friends', label: 'Friends Activity', icon: Users },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.3 }}
      className="pointer-events-auto mt-3 overflow-hidden rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Toggle Header */}
      <div className="flex items-center gap-2 p-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5 mr-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-cyan-300" />
          </div>
          <span className="text-white/80 font-bold text-xs uppercase tracking-wider">Console Feed</span>
        </div>

        <div className="flex gap-1 ml-auto p-0.5 rounded-lg bg-black/30 border border-white/[0.06]">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                  isActive ? 'text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="console-feed-tab"
                    className="absolute inset-0 rounded-md"
                    style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}
                <Icon className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10 whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[calc(100vh-320px)] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'whatsnew' && <WhatsNewSection />}
            {activeTab === 'friends' && <FriendsActivitySection />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}