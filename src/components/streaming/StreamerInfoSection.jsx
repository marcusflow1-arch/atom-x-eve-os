import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Users, Trophy, Target, Calendar, Star } from 'lucide-react';

export default function StreamerInfoSection({ streamer }) {
  const sponsors = [
    { name: 'RazerGear', logo: '🎮' },
    { name: 'EnergyDrink Co.', logo: '⚡' },
    { name: 'TechSetup', logo: '💻' }
  ];

  const funFacts = [
    { label: 'Favorite Game Genre', value: 'RPG & FPS', icon: Trophy },
    { label: 'Total Stream Hours', value: '2,400+', icon: Calendar },
    { label: 'Community Size', value: '15K Followers', icon: Users },
    { label: 'Rarest Card Owned', value: 'Void Emperor Set', icon: Sparkles }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-8">
      {/* Why I Stream */}
      <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Star className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-white font-bold text-xl">Why I Stream</h3>
        </div>
        
        <p className="text-white/80 leading-relaxed">
          {streamer.why_stream || `I love connecting with people who share my passion for gaming. Every stream is a journey—whether we're hunting rare cards, tackling impossible challenges, or just vibing to great gameplay. This community is everything to me, and I want to build something we can all be proud of.`}
        </p>

        {/* Fun Facts Grid */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
          {funFacts.map((fact, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <fact.icon className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">{fact.label}</p>
                <p className="text-white font-bold text-sm">{fact.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sponsors */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-purple-400" />
          <h3 className="text-white font-bold text-lg">Sponsored By</h3>
        </div>
        
        <div className="space-y-3">
          {sponsors.map((sponsor, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl cursor-pointer transition-all"
            >
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-2xl">
                {sponsor.logo}
              </div>
              <span className="text-white font-medium text-sm">{sponsor.name}</span>
            </motion.div>
          ))}
        </div>

        <div className="pt-4 border-t border-white/10">
          <p className="text-white/40 text-xs leading-relaxed">
            These partnerships help keep the stream running and bring you exclusive giveaways!
          </p>
        </div>
      </div>
    </div>
  );
}