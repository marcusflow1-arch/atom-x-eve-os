import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const ActivityHub = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const quests = [
    { id: 1, title: 'Dragon Slayer Daily', description: 'Defeat 5 dragons in any RPG game', reward: '500 XP + Rare Weapon', type: 'daily', progress: 60 },
    { id: 2, title: 'Multiplayer Mayhem', description: 'Win 3 multiplayer matches', reward: '300 XP + Avatar Skin', type: 'daily', progress: 33 },
    { id: 3, title: 'World Event: Cyber Storm', description: 'Global event - Survive 10 minutes in Cyberpunk zones', reward: 'Legendary Gear', type: 'world', progress: 0 },
    { id: 4, title: 'Achievement Hunter', description: 'Unlock 5 achievements this week', reward: '1000 XP + Title', type: 'weekly', progress: 80 }
  ];

  const getQuestTypeColor = (type) => {
    switch (type) {
      case 'daily': return 'bg-blue-500';
      case 'weekly': return 'bg-purple-500';
      case 'world': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 mb-6">
      <style jsx>{`
        .invisible-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .invisible-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold">Activity Hub</h3>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </motion.div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <div className="space-y-3 invisible-scrollbar" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {quests.map(quest => (
                  <Card key={quest.id} className="bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-semibold text-sm">{quest.title}</h4>
                            <Badge className={`${getQuestTypeColor(quest.type)} text-white text-xs`}>
                              {quest.type}
                            </Badge>
                          </div>
                          <p className="text-slate-400 text-xs mb-2">{quest.description}</p>
                          <div className="flex items-center gap-2">
                            <div className="bg-slate-700 rounded-full h-2 flex-1">
                              <div
                                className={`${getQuestTypeColor(quest.type)} h-2 rounded-full transition-all duration-500`}
                                style={{ width: `${quest.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-400">{quest.progress}%</span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="ml-2">
                          <Target className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-green-400 text-xs font-medium">🏆 {quest.reward}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActivityHub;