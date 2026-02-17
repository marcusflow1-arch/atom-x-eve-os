import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, Target, Calendar, AlertCircle, Video, UserPlus, MessageSquare } from 'lucide-react';

const TOPICS = [
  { id: 'achievements', label: 'Achievements', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { id: 'farming', label: 'Farm Queues', icon: Target, color: 'text-green-400', bg: 'bg-green-500/10' },
  { id: 'recruitment', label: 'Recruit', icon: UserPlus, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'bugs', label: 'Bugs & Issues', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  { id: 'events', label: 'Events', icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { id: 'content', label: 'Videos & Guides', icon: Video, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
];

export { TOPICS };

export default function FarmTopicSelector({ activeTopic, onSelect }) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
      {TOPICS.map((topic) => {
        const isActive = activeTopic === topic.id;
        return (
          <button
            key={topic.id}
            onClick={() => onSelect(isActive ? null : topic.id)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
              isActive
                ? 'text-white border border-white/15'
                : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04] border border-transparent'
            }`}
            style={isActive ? {
              background: 'rgba(255,255,255,0.08)',
              boxShadow: '0 0 12px rgba(255,255,255,0.04)',
            } : {}}
          >
            <topic.icon className={`w-3.5 h-3.5 ${isActive ? topic.color : ''}`} />
            <span className="text-xs font-semibold tracking-wide">{topic.label}</span>
            {isActive && (
              <motion.div
                layoutId="farmTopicPill"
                className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-cyan-400"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}