import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Heart, Activity, Swords, Brain, Crosshair, Skull, Minus, Plus } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { base44 } from '@/api/base44Client';
import { showError } from '@/components/error/ErrorToast';

export default function AvatarStatsOverlay({ onClose }) {
  const { user } = useAuth();
  const [progression, setProgression] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const fetchProgression = async () => {
      try {
        const records = await base44.entities.AvatarProgression.filter({ user_id: user.id });
        if (records && records.length > 0) {
          setProgression(records[0]);
        } else {
          // Generate mock/default progression if none exists
          setProgression({
            global_level: user.level || 1,
            stats: {
              HP: 100,
              Stamina: 100,
              Tenacity: 10,
              Strength: 15,
              Agility: 12,
              Intelligence: 8,
              Luck: 5
            },
            genres: [
              { name: 'RPG', level: 5, exp: 450, next_level_exp: 1000 },
              { name: 'Shooter', level: 3, exp: 200, next_level_exp: 500 },
              { name: 'Action', level: 4, exp: 350, next_level_exp: 800 },
              { name: 'Strategy', level: 2, exp: 150, next_level_exp: 400 },
              { name: 'Simulation', level: 1, exp: 50, next_level_exp: 200 }
            ],
            available_points: 3
          });
        }
      } catch (error) {
        showError(error, 'Loading Stats');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProgression();
  }, [user]);

  // Stats definitions
  const statsList = [
    { key: 'HP', name: 'HP', icon: Heart, color: 'text-red-400' },
    { key: 'Stamina', name: 'Stamina', icon: Activity, color: 'text-green-400' },
    { key: 'Tenacity', name: 'Tenacity', icon: Shield, color: 'text-yellow-400' },
    { key: 'Strength', name: 'Strength', icon: Swords, color: 'text-orange-400' },
    { key: 'Agility', name: 'Agility', icon: Zap, color: 'text-cyan-400' },
    { key: 'Intelligence', name: 'Intelligence', icon: Brain, color: 'text-purple-400' },
    { key: 'Luck', name: 'Critical Hit', icon: Crosshair, color: 'text-pink-400' },
  ];

  const handleStatChange = (statName, delta) => {
    if (!progression) return;
    
    // Check if we can add/remove points
    if (delta > 0 && progression.available_points <= 0) return;
    
    const currentVal = progression.stats[statName] || 0;
    // Allow decrementing points back to a minimum (let's assume base is 0 or whatever they had)
    if (delta < 0 && currentVal <= 0) return;

    setProgression(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        [statName]: currentVal + delta
      },
      available_points: prev.available_points - delta
    }));
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col p-6 text-white overflow-hidden">
      
      {/* Global Status Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10 shrink-0">
        <div>
          <h3 className="text-xs text-white/50 uppercase tracking-widest font-semibold mb-1">Global Level</h3>
          <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            {progression?.global_level || 1}
          </div>
        </div>
        <div className="text-right">
          <h3 className="text-xs text-white/50 uppercase tracking-widest font-semibold mb-1">Available Points</h3>
          <div className="text-2xl font-bold text-yellow-400">
            {progression?.available_points || 0}
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        
        {/* Left Side: Core Attributes */}
        <div className="w-1/2 flex flex-col min-h-0">
          <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2 shrink-0">
            <Activity className="w-4 h-4" /> Core Attributes
          </h4>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2" style={{ scrollbarWidth: 'none' }}>
            {statsList.map((stat, idx) => {
              const Icon = stat.icon;
              const val = progression?.stats?.[stat.key] || 0;
              return (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-black/20 ${stat.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider">{stat.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold w-8 text-center">{val}</span>
                    <div className="flex items-center gap-0.5 bg-black/40 rounded-lg p-1 border border-white/10">
                      <button 
                        onClick={() => handleStatChange(stat.key, -1)}
                        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        disabled={val <= 0}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => handleStatChange(stat.key, 1)}
                        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        disabled={progression?.available_points <= 0}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Genre Proficiency */}
        <div className="w-1/2 flex flex-col min-h-0 pl-2 border-l border-white/10">
          <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2 shrink-0">
            <Shield className="w-4 h-4" /> Genre Proficiency
          </h4>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2" style={{ scrollbarWidth: 'none' }}>
            {(progression?.genres || []).map((genre, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <Swords className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-end mb-1">
                      <span className="font-bold text-sm truncate">{genre.name}</span>
                      <span className="text-cyan-400 font-mono text-xs">Lv. {genre.level || 1}</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                        style={{ width: `${((genre.exp || 0) / (genre.next_level_exp || 100)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-[9px] text-white/40 text-right uppercase tracking-widest">
                  {genre.exp || 0} / {genre.next_level_exp || 100} XP
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}