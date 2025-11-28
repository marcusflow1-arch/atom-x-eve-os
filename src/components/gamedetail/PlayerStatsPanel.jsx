import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Clock, Trophy, Percent, Users, User } from 'lucide-react';

export default function PlayerStatsPanel({ game }) {
  // Mocked player progress data
  const progress = {
    completion: 72,
    hoursPlayed: 84.5,
    lastPlayed: '2 days ago',
    achievementsUnlocked: 28,
    totalAchievements: game.achievements?.length || 45,
    multiplayerTime: 30.2,
    singlePlayerTime: 54.3,
    milestones: [
      'First Boss Defeated',
      'Reached Level 50',
      'Completed Main Quest'
    ]
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-slate-800/50 rounded-xl p-6 border border-slate-700"
    >
      <h3 className="text-2xl font-bold mb-6 text-cyan-300">Your Progress</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Core Stats */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-300"><Percent className="w-4 h-4" /> Game Completion</span>
            <span className="font-bold text-lg text-white">{progress.completion}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2.5">
            <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${progress.completion}%` }}></div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-300"><Clock className="w-4 h-4" /> Hours Played</span>
            <span className="font-bold text-lg text-white">{progress.hoursPlayed}h</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-300"><Trophy className="w-4 h-4" /> Achievements</span>
            <span className="font-bold text-lg text-white">{progress.achievementsUnlocked} / {progress.totalAchievements}</span>
          </div>

          <div className="pt-2">
            <p className="text-sm text-slate-400">Last played: {progress.lastPlayed}</p>
          </div>
        </div>

        {/* Right Column: Time Breakdown & Milestones */}
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2 text-slate-300">Time Breakdown</h4>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1"><User className="w-3 h-3" /> Single Player</span>
              <span>{progress.singlePlayerTime}h</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Multiplayer</span>
              <span>{progress.multiplayerTime}h</span>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2 text-slate-300">Milestones</h4>
            <div className="flex flex-wrap gap-2">
              {progress.milestones.map(m => (
                <Badge key={m} variant="secondary" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                  {m}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}