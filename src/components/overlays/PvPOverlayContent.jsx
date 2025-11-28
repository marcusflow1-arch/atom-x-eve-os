import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Swords, Crown, Users, Play, Settings, Zap, Shield, Target, 
  TrendingUp, Clock, Star, Plus, Edit2, Trash2
} from 'lucide-react';

// Mock loadouts data
const mockLoadouts = [
  {
    id: 1,
    name: 'RPG Warrior',
    genre: 'RPG',
    abilities: [
      { id: 'a1', name: 'Berserker Rage', rarity: 'Epic', icon: '⚔️' },
      { id: 'a2', name: 'Shield Wall', rarity: 'Rare', icon: '🛡️' },
      { id: 'a3', name: 'Life Drain', rarity: 'Legendary', icon: '💀' }
    ],
    equipment: [
      { id: 'e1', name: 'Dragon Sword', slot: 'Weapon', rarity: 'Legendary' },
      { id: 'e2', name: 'Titan Armor', slot: 'Armor', rarity: 'Epic' }
    ],
    power: 8500,
    wins: 47,
    losses: 12,
    isActive: true
  },
  {
    id: 2,
    name: 'Cyber Sniper',
    genre: 'Shooter',
    abilities: [
      { id: 'a4', name: 'EMP Blast', rarity: 'Rare', icon: '⚡' },
      { id: 'a5', name: 'Stealth Cloak', rarity: 'Epic', icon: '👻' },
      { id: 'a6', name: 'Auto-Turret', rarity: 'Rare', icon: '🤖' }
    ],
    equipment: [
      { id: 'e3', name: 'Plasma Rifle', slot: 'Weapon', rarity: 'Epic' },
      { id: 'e4', name: 'Nano Suit', slot: 'Armor', rarity: 'Rare' }
    ],
    power: 7200,
    wins: 32,
    losses: 18,
    isActive: false
  }
];

const rarityColors = {
  Common: 'text-slate-400 bg-slate-500/20 border-slate-500/30',
  Uncommon: 'text-green-400 bg-green-500/20 border-green-500/30',
  Rare: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
  Epic: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
  Legendary: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
  Mythical: 'text-red-400 bg-red-500/20 border-red-500/30',
  Godlike: 'text-fuchsia-400 bg-fuchsia-500/20 border-fuchsia-500/30'
};

const LoadoutCard = ({ loadout, onSelect, onEdit, onDelete }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className={`relative rounded-xl overflow-hidden border-2 transition-all ${
        loadout.isActive 
          ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20' 
          : 'border-slate-700 bg-slate-800/50'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-white font-bold text-lg">{loadout.name}</h3>
            <Badge className="mt-1 bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
              {loadout.genre}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-yellow-400 font-bold text-xl">{loadout.power}</div>
              <div className="text-xs text-slate-400">Power</div>
            </div>
            {loadout.isActive && (
              <Badge className="bg-green-500 text-white">Active</Badge>
            )}
          </div>
        </div>

        {/* Abilities */}
        <div className="mb-3">
          <div className="text-xs text-slate-400 mb-2">Abilities</div>
          <div className="flex gap-2">
            {loadout.abilities.map(ability => (
              <div 
                key={ability.id}
                className={`px-2 py-1 rounded text-xs border ${rarityColors[ability.rarity]}`}
                title={ability.name}
              >
                {ability.icon}
              </div>
            ))}
          </div>
        </div>

        {/* Equipment */}
        <div className="mb-3">
          <div className="text-xs text-slate-400 mb-2">Equipment</div>
          <div className="space-y-1">
            {loadout.equipment.map(item => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <span className="text-slate-300">{item.name}</span>
                <Badge variant="outline" className={`text-xs ${rarityColors[item.rarity]}`}>
                  {item.rarity}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <span>W/L: {loadout.wins}/{loadout.losses}</span>
          <span>Win Rate: {Math.round((loadout.wins / (loadout.wins + loadout.losses)) * 100)}%</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {!loadout.isActive && (
            <Button onClick={() => onSelect(loadout)} className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Play className="w-4 h-4 mr-1" /> Activate
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={() => onEdit(loadout)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => onDelete(loadout)} className="text-red-400 border-red-400/50">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default function PvPOverlayContent() {
  const [loadouts, setLoadouts] = useState(mockLoadouts);
  const [isQueueing, setIsQueueing] = useState(false);
  const [queueTime, setQueueTime] = useState(0);

  const handleSelectLoadout = (loadout) => {
    setLoadouts(prev => prev.map(l => ({ ...l, isActive: l.id === loadout.id })));
  };

  const handleQueueMatch = (matchType) => {
    setIsQueueing(true);
    setQueueTime(0);
    
    // Simulate queue timer
    const interval = setInterval(() => {
      setQueueTime(prev => prev + 1);
    }, 1000);

    // Simulate finding match after 5 seconds
    setTimeout(() => {
      clearInterval(interval);
      setIsQueueing(false);
      alert('Match found! (This is a demo)');
    }, 5000);
  };

  const activeLoadout = loadouts.find(l => l.isActive);

  return (
    <Tabs defaultValue="quick" className="w-full">
      <TabsList className="grid w-full grid-cols-4 bg-slate-800">
        <TabsTrigger value="quick">Quick Match</TabsTrigger>
        <TabsTrigger value="ranked">Ranked</TabsTrigger>
        <TabsTrigger value="custom">Custom</TabsTrigger>
        <TabsTrigger value="loadouts">Loadouts</TabsTrigger>
      </TabsList>

      {/* Quick Match Tab */}
      <TabsContent value="quick" className="space-y-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Quick Match
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-slate-300 text-sm">
              Jump into a fast-paced battle with players of similar skill level.
            </div>

            {/* Active Loadout Display */}
            {activeLoadout && (
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="text-xs text-slate-400 mb-2">Active Loadout</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-semibold">{activeLoadout.name}</div>
                    <div className="text-xs text-slate-400">{activeLoadout.genre} • {activeLoadout.power} Power</div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    Ready
                  </Badge>
                </div>
              </div>
            )}

            {/* Queue Status */}
            <AnimatePresence>
              {isQueueing ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 text-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
                  />
                  <div className="text-white font-semibold mb-2">Finding Match...</div>
                  <div className="text-slate-400 text-sm">Queue Time: {queueTime}s</div>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setIsQueueing(false)}
                  >
                    Cancel Queue
                  </Button>
                </motion.div>
              ) : (
                <Button 
                  onClick={() => handleQueueMatch('quick')}
                  className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-lg"
                  disabled={!activeLoadout}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Find Match
                </Button>
              )}
            </AnimatePresence>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">47</div>
                <div className="text-xs text-slate-400">Wins</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-400">12</div>
                <div className="text-xs text-slate-400">Losses</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">79%</div>
                <div className="text-xs text-slate-400">Win Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Ranked Match Tab */}
      <TabsContent value="ranked" className="space-y-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              Ranked Match
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-slate-300 text-sm">
              Compete for glory and climb the ranked ladder!
            </div>

            {/* Current Rank */}
            <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 mb-1">Current Rank</div>
                  <div className="text-2xl font-bold text-white flex items-center gap-2">
                    <Crown className="w-6 h-6 text-yellow-400" />
                    Diamond III
                  </div>
                  <div className="text-xs text-slate-400 mt-1">2,450 / 3,000 LP</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-green-400 font-semibold">+45 LP</div>
                  <div className="text-xs text-slate-400">Last match</div>
                </div>
              </div>
              <div className="mt-3 bg-slate-900/50 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-full" style={{ width: '81%' }} />
              </div>
            </div>

            {/* Season Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/50 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Season 3</div>
                <div className="text-lg font-semibold text-white">28 days left</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Global Rank</div>
                <div className="text-lg font-semibold text-yellow-400">#1,247</div>
              </div>
            </div>

            <Button 
              onClick={() => handleQueueMatch('ranked')}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-14 text-lg"
              disabled={!activeLoadout || isQueueing}
            >
              <Crown className="w-5 h-5 mr-2" />
              Queue Ranked
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Custom Match Tab */}
      <TabsContent value="custom" className="space-y-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-400" />
              Custom Match
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-slate-300 text-sm">
              Create a private match with custom rules.
            </div>

            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 h-14">
              <Plus className="w-5 h-5 mr-2" />
              Create Custom Match
            </Button>

            <div className="text-xs text-slate-500 text-center">
              Feature coming soon
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Loadouts Tab */}
      <TabsContent value="loadouts" className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg">Your Loadouts</h3>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Loadout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loadouts.map(loadout => (
            <LoadoutCard
              key={loadout.id}
              loadout={loadout}
              onSelect={handleSelectLoadout}
              onEdit={(l) => console.log('Edit', l)}
              onDelete={(l) => console.log('Delete', l)}
            />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}