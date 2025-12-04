import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, Target, Calendar, ChevronRight, Star, Shield, Swords, Flame, Globe, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MOCK_CHALLENGES = [
  {
    id: 1,
    title: "The Grand Raid Marathon",
    description: "Complete 5 raid achievements within 7 days. Form a team of 4.",
    type: "team",
    status: "active",
    timeLeft: "2d 14h",
    participants: 1240,
    reward: "Legendary 'Raid Master' Card",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=400&fit=crop",
    progress: 60
  },
  {
    id: 2,
    title: "Speedrun Legends",
    description: "Achieve 'Speed Demon' in any supported platformer game.",
    type: "solo",
    status: "active",
    timeLeft: "5d 02h",
    participants: 3500,
    reward: "Epic 'Flash' Card + 500 Coins",
    image: "https://images.unsplash.com/photo-1542751371-331572b78519?w=800&h=400&fit=crop",
    progress: 0
  },
  {
    id: 3,
    title: "Global Conquest",
    description: "Community goal: Reach 1,000,000 total kills in Cyberpunk 2088.",
    type: "global",
    status: "active",
    timeLeft: "12d",
    participants: 15420,
    reward: "Unique 'Cyber Warlord' Card for all participants",
    image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&h=400&fit=crop",
    progress: 85
  }
];

const ChallengeCard = ({ challenge }) => {
  return (
    <motion.div 
        whileHover={{ y: -5 }}
        className="group relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-blue-500/50 transition-all"
    >
        <div className="h-48 overflow-hidden relative">
            <img src={challenge.image} alt={challenge.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
            <div className="absolute top-4 right-4">
                <Badge className={`${
                    challenge.type === 'team' ? 'bg-purple-500' : 
                    challenge.type === 'global' ? 'bg-green-500' : 'bg-blue-500'
                } capitalize shadow-lg`}>
                    {challenge.type} Event
                </Badge>
            </div>
            <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-2xl font-bold text-white mb-1">{challenge.title}</h3>
                <div className="flex items-center gap-4 text-xs text-slate-300">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {challenge.timeLeft} Left</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {challenge.participants.toLocaleString()} Joined</span>
                </div>
            </div>
        </div>
        
        <div className="p-6">
            <p className="text-slate-400 mb-4 text-sm">{challenge.description}</p>
            
            <div className="bg-slate-800/50 rounded-lg p-3 mb-4 border border-slate-700">
                <div className="flex items-center gap-2 text-yellow-400 text-sm font-bold mb-1">
                    <Trophy className="w-4 h-4" /> Reward
                </div>
                <p className="text-white text-sm">{challenge.reward}</p>
            </div>

            {challenge.type === 'global' && (
                <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Community Progress</span>
                        <span>{challenge.progress}%</span>
                    </div>
                    <Progress value={challenge.progress} className="h-2" />
                </div>
            )}

            <Button className="w-full bg-blue-600 hover:bg-blue-700 font-bold">
                {challenge.progress > 0 ? 'Continue Challenge' : 'Join Challenge'}
            </Button>
        </div>
    </motion.div>
  );
};

export default function Challenges() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 pb-24">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
            <h1 className="text-4xl font-black text-white mb-4 flex items-center gap-3">
                <Swords className="w-10 h-10 text-red-500" />
                COMMUNITY BATTLES
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl">
                Compete in limited-time events, form squads, and unlock exclusive trading cards that can never be obtained again.
            </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Challenge Feed */}
            <div className="lg:col-span-2 space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Active Operations</h2>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">All</Button>
                        <Button variant="ghost" size="sm">Solo</Button>
                        <Button variant="ghost" size="sm">Team</Button>
                    </div>
                </div>

                <div className="space-y-6">
                    {MOCK_CHALLENGES.map(challenge => (
                        <ChallengeCard key={challenge.id} challenge={challenge} />
                    ))}
                </div>
            </div>

            {/* Sidebar - My Teams & Leaderboard */}
            <div className="space-y-8">
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-purple-400" /> My Squad
                    </h3>
                    <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                        <div className="w-16 h-16 bg-slate-700 rounded-full mx-auto mb-3 flex items-center justify-center">
                            <Users className="w-8 h-8 text-slate-500" />
                        </div>
                        <p className="text-slate-400 text-sm mb-3">You aren't in a squad for the "Grand Raid" event yet.</p>
                        <Button variant="outline" className="w-full">Create Squad</Button>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-green-400" /> Global Leaderboard
                    </h3>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((rank) => (
                            <div key={rank} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
                                <div className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${
                                    rank === 1 ? 'bg-yellow-500 text-black' :
                                    rank === 2 ? 'bg-slate-400 text-black' :
                                    rank === 3 ? 'bg-orange-700 text-white' : 'bg-slate-800 text-slate-500'
                                }`}>
                                    {rank}
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-700" />
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-white">Player_{rank}</div>
                                    <div className="text-xs text-slate-500">15,420 Pts</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}