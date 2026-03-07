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

  // Fallback stats if not in DB
  const defaultStats = [
    { name: 'HP', value: progression?.stats?.HP || 100, icon: Heart, color: 'text-red-400' },
    { name: 'Stamina', value: progression?.stats?.Stamina || 100, icon: Activity, color: 'text-green-400' },
    { name: 'Tenacity', value: progression?.stats?.Tenacity || 10, icon: Shield, color: 'text-yellow-400' },
    { name: 'Strength', value: progression?.stats?.Strength || 15, icon: Swords, color: 'text-orange-400' },
    { name: 'Agility', value: progression?.stats?.Agility || 12, icon: Zap, color: 'text-cyan-400' },
    { name: 'Intelligence', value: progression?.stats?.Intelligence || 8, icon: Brain, color: 'text-purple-400' },
    { name: 'Critical Hit', value: progression?.stats?.Luck || 5, icon: Crosshair, color: 'text-pink-400' },
  ];

  const handleLevelUp = (genreName) => {
    // Optimistic UI update for leveling up a genre
    if (!progression || progression.available_points <= 0) return;
    
    const updatedGenres = progression.genres.map(g => {
      if (g.name === genreName) {
        return { ...g, level: (g.level || 1) + 1 };
      }
      return g;
    });

    setProgression({
      ...progression,
      genres: updatedGenres,
      available_points: progression.available_points - 1
    });

    // We could update DB here if we had backend access
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col p-6 text-white overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
      
      {/* Global Status Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
        <div>
          <h3 className="text-sm text-white/50 uppercase tracking-widest font-semibold mb-1">Global Level</h3>
          <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            {progression?.global_level || 1}
          </div>
        </div>
        <div className="text-right">
          <h3 className="text-sm text-white/50 uppercase tracking-widest font-semibold mb-1">Available Points</h3>
          <div className="text-3xl font-bold text-yellow-400">
            {progression?.available_points || 0}
          </div>
        </div>
      </div>

      {/* Core Stats Grid */}
      <div className="mb-10">
        <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4" /> Core Attributes
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {defaultStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
                <Icon className={`w-6 h-6 mb-2 ${stat.color}`} />
                <span className="text-2xl font-bold mb-1">{stat.value}</span>
                <span className="text-xs text-white/50 uppercase tracking-wider">{stat.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Genre Proficiency */}
      <div>
        <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Genre Proficiency
        </h4>
        <div className="space-y-4">
          {(progression?.genres || []).map((genre, idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                <Swords className="w-6 h-6 text-purple-400" />
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-end mb-2">
                  <span className="font-bold text-lg">{genre.name}</span>
                  <span className="text-cyan-400 font-mono text-sm">Lv. {genre.level || 1}</span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    style={{ width: `${((genre.exp || 0) / (genre.next_level_exp || 100)) * 100}%` }}
                  />
                </div>
                <div className="text-[10px] text-white/40 mt-1 text-right">
                  {genre.exp || 0} / {genre.next_level_exp || 100} XP
                </div>
              </div>

              <button 
                onClick={() => handleLevelUp(genre.name)}
                disabled={!progression || progression.available_points <= 0}
                className={`ml-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  progression?.available_points > 0 
                    ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/40 border border-cyan-500/50' 
                    : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
                }`}
              >
                UPGRADE
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}