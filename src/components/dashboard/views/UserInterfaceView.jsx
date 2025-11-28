import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Play, Video, TrendingUp, Package, ImageIcon, Monitor, Archive, Users as UsersIcon, Clapperboard, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ActivityHub from '../ActivityHub';
import EntertainmentTab from '../EntertainmentTab';
import CommandCenter from '../CommandCenter';
import TheVault from '../TheVault';
import SocialHub from '../SocialHub';
import HallOfRecordsView from './HallOfRecordsView';
import StreamingHub from '../../../pages/StreamingHub';
import StreamTeam from '../streaming/StreamTeam';

const NewsCard = ({ title, description, image, time }) => (
  <div className="bg-slate-700/30 rounded-lg overflow-hidden hover:bg-slate-700/50 transition-colors cursor-pointer">
    <div className="flex gap-4 items-center">
      <div className="w-24 h-20 flex-shrink-0">
        <img src={image} alt={title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 p-3 py-4">
        <h4 className="text-white font-semibold mb-1 line-clamp-1">{title}</h4>
        <p className="text-slate-300 text-xs line-clamp-2">{description}</p>
        <p className="text-slate-500 text-xs mt-2">{time}</p>
      </div>
    </div>
  </div>
);

export default function UserInterfaceView({ 
  setShowGameHub, 
  setShowClips,
  setShowAINewsOverlay 
}) {
  const [activeFeature, setActiveFeature] = useState('command_center');

  const features = [
    { id: 'command_center', name: 'Command Center', icon: Monitor, color: 'bg-blue-600' },
    { id: 'entertainment', name: 'Entertainment', icon: Clapperboard, color: 'bg-purple-600' },
    { id: 'vault', name: 'The Vault', icon: Archive, color: 'bg-cyan-600' },
    { id: 'social', name: 'Social Hub', icon: UsersIcon, color: 'bg-green-600' },
    { id: 'hall_of_fame', name: 'Hall of Fame', icon: TrendingUp, color: 'bg-yellow-600' },
    { id: 'streaming', name: 'Streaming', icon: Radio, color: 'bg-red-600' },
    { id: 'stream_team', name: 'Stream Team', icon: UsersIcon, color: 'bg-orange-600' }
  ];

  return (
    <div className="flex h-full">
      {/* Left Sidebar - 15% */}
      <div className="w-[15%] bg-slate-800/30 rounded-l-xl border border-slate-700/50 p-3 overflow-y-auto">
        <h3 className="text-white font-bold text-sm mb-4">User Interface</h3>
        <div className="space-y-2">
          {features.map((feature) => (
            <motion.button
              key={feature.id}
              whileHover={{ scale: 1.02, x: 3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveFeature(feature.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                activeFeature === feature.id
                  ? 'bg-blue-600 shadow-lg shadow-blue-500/30'
                  : 'bg-slate-700/30 hover:bg-slate-700/50'
              }`}
            >
              <div className={`w-8 h-8 ${feature.color} rounded flex items-center justify-center flex-shrink-0`}>
                <feature.icon className="w-4 h-4 text-white" />
              </div>
              <span className={`text-sm font-semibold truncate ${activeFeature === feature.id ? 'text-white' : 'text-slate-300'}`}>
                {feature.name}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Vertical Divider */}
      <div className="w-px bg-gradient-to-b from-transparent via-blue-500/50 to-transparent"></div>

      {/* Right Stage - 85% */}
      <div className="flex-1 bg-slate-800/20 rounded-r-xl border border-slate-700/50 border-l-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFeature}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full overflow-y-auto"
          >
            {activeFeature === 'command_center' && <CommandCenter />}
            {activeFeature === 'entertainment' && <EntertainmentTab />}
            {activeFeature === 'vault' && <TheVault />}
            {activeFeature === 'social' && <SocialHub />}
            {activeFeature === 'hall_of_fame' && (
              <div className="p-6">
                <HallOfRecordsView />
              </div>
            )}
            {activeFeature === 'streaming' && <StreamingHub />}
            {activeFeature === 'stream_team' && <StreamTeam />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}