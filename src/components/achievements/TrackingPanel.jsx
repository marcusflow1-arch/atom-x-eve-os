import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, X, Search, Star, Trophy, Shield, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function TrackingPanel({ isVisible, onToggle, trackedAchievements, allAchievements, onSelectAchievement, onUntrack }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredTracked = useMemo(() => {
    if (!trackedAchievements || !Array.isArray(trackedAchievements)) return [];
    
    return trackedAchievements.filter(ach => {
      if (!ach) return false; // Safety check
      const searchMatch = searchTerm === '' || ach.title?.toLowerCase().includes(searchTerm.toLowerCase());
      return searchMatch;
    });
  }, [trackedAchievements, searchTerm]);

  // Handle drop events for drag-and-drop tracking
  const handleDrop = (e) => {
    e.preventDefault();
    try {
      const achievementData = e.dataTransfer.getData('achievement');
      if (achievementData) {
        const achievement = JSON.parse(achievementData);
        // This would trigger tracking in the parent component
        console.log('Dropped achievement for tracking:', achievement.title);
      }
    } catch (error) {
      console.error('Failed to parse dropped achievement:', error);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="absolute top-0 right-0 h-full w-[360px] bg-slate-900/95 backdrop-blur-lg p-4 border-l border-blue-500/30 z-20 flex flex-col"
      style={{ 
        boxShadow: '-10px 0 30px rgba(59, 130, 246, 0.1)',
        cursor: 'default'
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h3 className="text-lg font-bold text-white">Achievement Tracking</h3>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 hover:bg-blue-600/20 border border-blue-500/30" 
          onClick={onToggle}
          style={{ cursor: 'pointer' }}
        >
          <ChevronRight className="w-5 h-5 text-blue-400" />
        </Button>
      </div>

      <div className="mb-4 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Search tracked..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-800 border-slate-700 focus:border-blue-500"
          />
        </div>
        
        {/* Drop zone indicator */}
        <div className="mt-3 p-3 border-2 border-dashed border-slate-600/50 rounded-lg text-center text-slate-500 text-sm hover:border-blue-500/50 transition-colors">
          <Package className="w-6 h-6 mx-auto mb-1 opacity-50" />
          Drop achievements here to track
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto space-y-2 pr-1">
        {filteredTracked.length > 0 ? filteredTracked.map(ach => (
          <div 
            key={ach.id} 
            className="bg-slate-800 p-3 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors border border-slate-700/30" 
            onClick={() => onSelectAchievement(ach)}
            style={{ cursor: 'pointer' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{ach.icon}</span>
              <div className="flex-grow overflow-hidden">
                <p className="font-semibold text-white truncate">{ach.title}</p>
                <p className="text-xs text-slate-400">{ach.game}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {ach.rarity}
                  </Badge>
                  <span className="text-yellow-400 text-xs font-semibold">{ach.points} pts</span>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onUntrack(ach.id); 
                }}
                className="text-xs px-2 py-1 h-auto"
                style={{ cursor: 'pointer' }}
              >
                Remove
              </Button>
            </div>
          </div>
        )) : (
          <div className="text-center text-slate-500 pt-16">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No tracked achievements</p>
            <p className="text-xs mt-1 opacity-70">Drag achievements from games to track them</p>
          </div>
        )}
      </div>

      {/* Statistics footer */}
      {filteredTracked.length > 0 && (
        <div className="border-t border-slate-700/50 pt-3 mt-3 flex-shrink-0">
          <div className="text-xs text-slate-400 text-center">
            Tracking {filteredTracked.length} achievement{filteredTracked.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </motion.div>
  );
}