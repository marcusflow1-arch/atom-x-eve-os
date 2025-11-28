import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Target, Users, Clock, Trophy, Zap, Shield, Skull, 
  Flame, Crown, Star, Play, ChevronRight
} from 'lucide-react';

// Mock world events
const mockEvents = [
  {
    id: 1,
    name: 'Dragon Siege',
    description: 'Defend the castle from waves of dragons',
    difficulty: 'Hard',
    players: 847,
    maxPlayers: 1000,
    timeLeft: 3600,
    rewards: ['500 XP', 'Legendary Weapon', 'Dragon Scale x5'],
    icon: '🐉',
    active: true,
    progress: 65
  },
  {
    id: 2,
    name: 'Cyber Outbreak',
    description: 'Stop the AI virus from spreading',
    difficulty: 'Extreme',
    players: 432,
    maxPlayers: 500,
    timeLeft: 7200,
    rewards: ['1000 XP', 'Mythical Ability', 'Cyber Core x3'],
    icon: '🤖',
    active: true,
    progress: 42
  },
  {
    id: 3,
    name: 'Shadow Realm',
    description: 'Explore the darkness and defeat shadow creatures',
    difficulty: 'Medium',
    players: 1205,
    maxPlayers: 2000,
    timeLeft: 5400,
    rewards: ['300 XP', 'Epic Equipment', 'Shadow Essence x10'],
    icon: '👻',
    active: true,
    progress: 28
  }
];

const difficultyColors = {
  Easy: 'bg-green-500/20 text-green-300 border-green-500/30',
  Medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  Hard: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  Extreme: 'bg-red-500/20 text-red-300 border-red-500/30'
};

const EventCard = ({ event }) => {
  const [timeRemaining, setTimeRemaining] = useState(event.timeLeft);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{event.icon}</div>
            <div>
              <h3 className="text-white font-bold text-xl">{event.name}</h3>
              <p className="text-slate-400 text-sm">{event.description}</p>
            </div>
          </div>
          <Badge className={difficultyColors[event.difficulty]}>
            {event.difficulty}
          </Badge>
        </div>

        {/* Event Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-400">Event Progress</span>
            <span className="text-white font-semibold">{event.progress}%</span>
          </div>
          <Progress value={event.progress} className="h-2" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs">Players</span>
            </div>
            <div className="text-white font-bold">{event.players}/{event.maxPlayers}</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Time Left</span>
            </div>
            <div className="text-white font-bold text-sm">{formatTime(timeRemaining)}</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-400 mb-1">
              <Trophy className="w-4 h-4" />
              <span className="text-xs">Rewards</span>
            </div>
            <div className="text-white font-bold">{event.rewards.length}</div>
          </div>
        </div>

        {/* Rewards Preview */}
        <div className="mb-4">
          <div className="text-xs text-slate-400 mb-2">Rewards</div>
          <div className="flex flex-wrap gap-2">
            {event.rewards.map((reward, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {reward}
              </Badge>
            ))}
          </div>
        </div>

        {/* Join Button */}
        <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12">
          <Play className="w-4 h-4 mr-2" />
          Join Event
        </Button>
      </div>
    </motion.div>
  );
};

export default function PvEOverlayContent() {
  return (
    <Tabs defaultValue="events" className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-slate-800">
        <TabsTrigger value="events">World Events</TabsTrigger>
        <TabsTrigger value="dungeons">Dungeons</TabsTrigger>
        <TabsTrigger value="raids">Raids</TabsTrigger>
      </TabsList>

      {/* World Events Tab */}
      <TabsContent value="events" className="space-y-4">
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-blue-400" />
              <div>
                <h3 className="text-white font-semibold">Active World Events</h3>
                <p className="text-slate-400 text-sm">Join massive co-op battles with players worldwide</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {mockEvents.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </TabsContent>

      {/* Dungeons Tab */}
      <TabsContent value="dungeons">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <Skull className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Dungeons Coming Soon</h3>
            <p className="text-slate-400 text-sm">
              Challenging dungeons with unique bosses and rare loot
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Raids Tab */}
      <TabsContent value="raids">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <Crown className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Raids Coming Soon</h3>
            <p className="text-slate-400 text-sm">
              Epic battles requiring coordination and strategy
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}