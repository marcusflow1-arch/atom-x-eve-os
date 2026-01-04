import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Heart, Star, Crown, Gift, Zap, Shield, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MOCK_STREAMERS } from '../components/streaming/mockData';
import ViewerSeasonalPass from '@/components/streaming/ViewerSeasonalPass';

export default function StreamerProfile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const streamerId = searchParams.get('id') || '1';
  const streamer = MOCK_STREAMERS.find(s => s.id === streamerId) || MOCK_STREAMERS[0];
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-[#0f1419] text-white p-6 md:p-12 overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto">
        
        {/* Header / Nav */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/50 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={18} /> Back to Hub
        </button>

        {/* Hero Identity Section */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-slate-900/50 backdrop-blur-xl shadow-2xl mb-12">
           {/* Cover / Intro Video Bg */}
           <div className="h-80 w-full relative">
              <video src={streamer.intro_video_url} className="w-full h-full object-cover opacity-40" autoPlay loop muted playsInline />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1419] via-transparent to-transparent" />
           </div>

           <div className="px-10 pb-10 -mt-20 relative flex items-end justify-between">
              <div className="flex items-end gap-8">
                <div className="w-40 h-40 rounded-full border-4 border-[#0f1419] overflow-hidden shadow-2xl">
                  <img src={streamer.avatar_url} className="w-full h-full object-cover" />
                </div>
                <div className="pb-4">
                   <div className="flex items-center gap-3 mb-2">
                     <h1 className="text-4xl font-black text-white">{streamer.username}</h1>
                     <Badge className="bg-cyan-500 text-black font-bold">PRO</Badge>
                   </div>
                   <p className="text-xl text-white/60 font-light italic">"{streamer.tagline}"</p>
                </div>
              </div>

              <div className="pb-4 flex gap-4">
                 <Button className="bg-white text-black hover:bg-cyan-50 font-bold px-8 rounded-full h-12 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                   <Heart className="mr-2 fill-black" size={18} /> Follow
                 </Button>
                 <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold px-8 rounded-full h-12 border-0 shadow-[0_0_20px_rgba(147,51,234,0.4)]">
                   <Zap className="mr-2 fill-white" size={18} /> Subscribe
                 </Button>
              </div>
           </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-12 gap-8">
          
          {/* Main Column (8) */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            
            {/* About / Context */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <User className="text-cyan-400" /> The Human Behind the Screen
              </h2>
              <div className="space-y-6">
                <div className="bg-black/20 rounded-xl p-6 border border-white/5">
                  <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Bio</h3>
                  <p className="text-white/80 leading-relaxed text-lg">{streamer.bio_short}</p>
                </div>
                {streamer.context_disclaimer && (
                  <div className="bg-cyan-900/20 rounded-xl p-6 border border-cyan-500/20 flex gap-4 items-start">
                    <Shield className="text-cyan-400 shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">Reality Check</h3>
                      <p className="text-cyan-100/80">{streamer.context_disclaimer}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>



          </div>

          {/* Sidebar Column (4) */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            
            {/* Sponsors */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Supported By</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-16 bg-white/10 rounded-xl flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                  <span className="font-black text-white/20 tracking-tighter text-xl">RAZER</span>
                </div>
                <div className="h-16 bg-white/10 rounded-xl flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                  <span className="font-black text-white/20 tracking-tighter text-xl">RED BULL</span>
                </div>
              </div>
            </div>

            {/* Platform Perks */}
            <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-3xl p-6">
              <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Zap size={12} /> Subscriber Perks
              </h3>
              <ul className="space-y-3">
                {streamer.perks?.map((perk, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-white/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>{perk.type}: <span className="font-bold text-white">{perk.value}</span></span>
                  </li>
                ))}
              </ul>
              <Button className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl h-10">
                Unlock Perks
              </Button>
            </div>

          </div>

        </div>

        {/* Full Width Seasonal Pass - Bottom of Page */}
        <ViewerSeasonalPass />

      </div>
    </div>
  );
}