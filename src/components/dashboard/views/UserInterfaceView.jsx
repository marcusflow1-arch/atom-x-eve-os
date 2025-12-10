import React from 'react';
import { motion } from 'framer-motion';
import { Users as UsersIcon, Radio } from 'lucide-react';
import SocialHub from '../SocialHub';
import StreamingHub from '../../../pages/StreamingHub';
import StreamTeam from '../streaming/StreamTeam';
import { useDashboardMode } from '../DashboardModeContext';

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
  const { activeSection, setActiveSection } = useDashboardMode();

  const features = [
    { id: 'social', name: 'Social Hub', icon: UsersIcon, color: 'bg-green-600' },
    { id: 'streaming', name: 'Streaming', icon: Radio, color: 'bg-red-600' },
    { id: 'stream_team', name: 'Clan', icon: UsersIcon, color: 'bg-orange-600' }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header with Section Selector - Now always visible at top */}

      {/* Content Area */}
      <div className="flex-1 overflow-hidden bg-slate-800/20 rounded-xl border border-slate-700/30">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="h-full overflow-y-auto"
        >
          {activeSection === 'social' && <SocialHub />}
          {activeSection === 'streaming' && <StreamingHub />}
          {activeSection === 'stream_team' && <StreamTeam />}
        </motion.div>
      </div>
    </div>
  );
}