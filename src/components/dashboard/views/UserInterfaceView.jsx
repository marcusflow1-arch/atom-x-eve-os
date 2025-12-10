import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Play, Video, TrendingUp, Package, ImageIcon, Monitor, Archive, Users as UsersIcon, Clapperboard, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ActivityHub from '../ActivityHub';

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
  const [activeFeature, setActiveFeature] = useState('social');

  const features = [
    { id: 'social', name: 'Social Hub', icon: UsersIcon, color: 'bg-green-600' },
    { id: 'streaming', name: 'Streaming', icon: Radio, color: 'bg-red-600' },
    { id: 'stream_team', name: 'Clan', icon: UsersIcon, color: 'bg-orange-600' }
  ];

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Top Section: Mode Button + Section Selector Box */}
      <div className="flex items-start gap-4">
        {/* This space is for the mode toggle button that's in the layout */}
        <div className="flex-1 bg-slate-800/20 rounded-xl border border-slate-700/30 p-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white">User Interface</h2>
            <div className="h-4 w-px bg-slate-700" />
            <div className="flex gap-1.5 bg-slate-900/50 p-1 rounded-lg border border-slate-700/50">
              {features.map((feature, index) => (
                <motion.button
                  key={feature.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setActiveFeature(feature.id)}
                  className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium text-xs transition-all ${
                    activeFeature === feature.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  <feature.icon className={`w-3.5 h-3.5 ${activeFeature === feature.id ? 'text-white' : 'text-slate-400'}`} />
                  <span>{feature.name}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Box: Content Area */}
      <div className="flex-1 overflow-hidden bg-slate-800/20 rounded-xl border border-slate-700/30">
        <motion.div
          key={activeFeature}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="h-full overflow-y-auto"
        >
          {activeFeature === 'social' && <SocialHub />}
          {activeFeature === 'streaming' && <StreamingHub />}
          {activeFeature === 'stream_team' && <StreamTeam />}
        </motion.div>
      </div>
    </div>
  );
}