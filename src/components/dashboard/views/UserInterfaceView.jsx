import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Play, Video, TrendingUp, Package, ImageIcon, Monitor, Archive, Users as UsersIcon, Clapperboard, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ActivityHub from '../ActivityHub';

import SocialHub from '../SocialHub';
import StreamingHub from '../../../pages/StreamingHub';
import StreamTeam from '../streaming/StreamTeam';
import StreamingDiscovery from '../../streaming/StreamingDiscovery';

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
      {/* Top Box: Section Selector */}
      <div className="rounded-xl p-4" style={{
        background: 'linear-gradient(135deg, rgba(71, 85, 105, 0.15) 0%, rgba(100, 116, 139, 0.25) 50%, rgba(71, 85, 105, 0.15) 100%)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 8px 32px rgba(71, 85, 105, 0.3)'
      }}>
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white">User Interface</h2>
          <div className="h-4 w-px" style={{ background: 'rgba(148, 163, 184, 0.3)' }} />
          <div className="flex gap-1.5 p-1 rounded-lg" style={{
            background: 'rgba(71, 85, 105, 0.3)',
            border: '1px solid rgba(148, 163, 184, 0.2)'
          }}>
            {features.map((feature, index) => (
              <motion.button
                key={feature.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setActiveFeature(feature.id)}
                className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium text-xs transition-all ${
                  activeFeature === feature.id
                    ? 'text-white'
                    : 'text-slate-300'
                }`}
                style={activeFeature === feature.id ? {
                  background: 'rgba(100, 116, 139, 0.5)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  boxShadow: '0 4px 12px rgba(71, 85, 105, 0.4)'
                } : {
                  background: 'transparent'
                }}
              >
                <feature.icon className={`w-3.5 h-3.5 ${activeFeature === feature.id ? 'text-white' : 'text-slate-400'}`} />
                <span>{feature.name}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Box: Content Area */}
      <div className="flex-1 overflow-hidden rounded-xl" style={{
        background: 'rgba(71, 85, 105, 0.15)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
      }}>
        <motion.div
          key={activeFeature}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="h-full overflow-y-auto"
        >
          {activeFeature === 'social' && <SocialHub />}
          {activeFeature === 'streaming' && <StreamingDiscovery />}
          {activeFeature === 'stream_team' && <StreamTeam />}
        </motion.div>
      </div>
    </div>
  );
}