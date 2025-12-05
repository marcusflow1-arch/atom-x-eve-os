import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Play, Video, TrendingUp, Package, ImageIcon, Monitor, Archive, Users as UsersIcon, Clapperboard, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ActivityHub from '../ActivityHub';
import EntertainmentTab from '../EntertainmentTab';
import SocialHub from '../SocialHub';
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
  const [activeFeature, setActiveFeature] = useState('entertainment');

  const features = [
    { id: 'entertainment', name: 'Entertainment', icon: Clapperboard, color: 'bg-purple-600' },
    { id: 'social', name: 'Social Hub', icon: UsersIcon, color: 'bg-green-600' },
    { id: 'streaming', name: 'Streaming', icon: Radio, color: 'bg-red-600' },
    { id: 'stream_team', name: 'Clan', icon: UsersIcon, color: 'bg-orange-600' }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Section Selector */}
      <div className="flex gap-2 mb-4 bg-slate-900/50 p-2 rounded-xl border border-slate-700/50">
        {features.map((feature) => (
          <button
            key={feature.id}
            onClick={() => setActiveFeature(feature.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
              activeFeature === feature.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <feature.icon className={`w-5 h-5 ${activeFeature === feature.id ? 'text-white' : 'text-slate-400'}`} />
            <span>{feature.name}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden bg-slate-800/20 rounded-xl border border-slate-700/30">
        <motion.div
          key={activeFeature}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="h-full overflow-y-auto"
        >
          {activeFeature === 'entertainment' && <EntertainmentTab />}
          {activeFeature === 'social' && <SocialHub />}
          {activeFeature === 'streaming' && <StreamingHub />}
          {activeFeature === 'stream_team' && <StreamTeam />}
        </motion.div>
      </div>
    </div>
  );
}