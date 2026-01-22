import React from 'react';
import { motion } from 'framer-motion';
import { 
    Trophy, Users, Shield, Hash, Target, Calendar, MessageSquare, AlertCircle 
} from 'lucide-react';

const TOPICS = [
    { id: 'achievements', label: 'Achievements', icon: Trophy, color: 'text-yellow-400' },
    { id: 'farming', label: 'Farming / Co-op', icon: Target, color: 'text-green-400' },
    { id: 'recruitment', label: 'Recruitment', icon: Users, color: 'text-blue-400' },
    { id: 'bugs', label: 'Bugs & Issues', icon: AlertCircle, color: 'text-red-400' },
    { id: 'events', label: 'Events', icon: Calendar, color: 'text-purple-400' },
    { id: 'general', label: 'General', icon: MessageSquare, color: 'text-slate-400' },
];

export default function FarmTopicSelector({ activeTopic, onSelect }) {
    return (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
            {!activeTopic && (
                 <div className="text-white/30 text-xs font-medium uppercase tracking-wider mr-2 animate-pulse">
                    Select a topic to begin
                </div>
            )}
            
            {TOPICS.map((topic) => {
                const isActive = activeTopic === topic.id;
                
                return (
                    <button
                        key={topic.id}
                        onClick={() => onSelect(topic.id)}
                        className={`
                            relative flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300
                            ${isActive 
                                ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] ring-1 ring-white/20' 
                                : 'bg-transparent text-white/40 hover:text-white/80 hover:bg-white/5'
                            }
                        `}
                    >
                        <topic.icon 
                            className={`w-4 h-4 transition-colors ${isActive ? topic.color : 'currentColor'}`} 
                        />
                        <span className="text-sm font-bold tracking-wide whitespace-nowrap">
                            {topic.label}
                        </span>
                        
                        {isActive && (
                            <motion.div
                                layoutId="activeTabIndicator"
                                className="absolute bottom-0 left-2 right-2 h-[2px] bg-blue-500 rounded-full"
                                initial={false}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
}