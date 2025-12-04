import React from 'react';
import { Calendar, Hammer, Star, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const events = [
  {
    id: 1,
    title: "Winter Solstice Forge",
    description: "Craft unique ice-themed weapons. +50% Luck on Ice enchantments.",
    timeLeft: "2 Days",
    rewards: ["Frostbite Hammer", "Glacial Shard"],
    difficulty: "Hard"
  },
  {
    id: 2,
    title: "Guild Banner Weaving",
    description: "Collaborate with your guild to create a legendary banner.",
    timeLeft: "5 Days",
    rewards: ["Guild Reputation", "Banner Artifact"],
    difficulty: "Medium"
  }
];

export default function CraftingChallenges() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      {events.map(event => (
        <div key={event.id} className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5 relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="absolute top-0 right-0 p-3">
            <Badge className="bg-blue-600 text-white">{event.timeLeft} Left</Badge>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-900/20 rounded-lg">
              <Hammer className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">{event.title}</h3>
              <p className="text-slate-400 text-sm mb-3">{event.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {event.rewards.map((reward, i) => (
                  <Badge key={i} variant="outline" className="border-yellow-500/30 text-yellow-400 text-xs flex items-center gap-1">
                    <Star className="w-3 h-3" /> {reward}
                  </Badge>
                ))}
              </div>
              
              <Button size="sm" className="w-full bg-slate-700 hover:bg-blue-600 transition-colors">
                Enter Challenge
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}