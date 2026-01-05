import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Heart, Star, Crown, Gift, Zap, Shield, Play } from 'lucide-react';
import StreamHeader from '@/components/streaming/profile/StreamHeader';
import VideoBox from '@/components/streaming/profile/VideoBox';
import AbilityRewardCarousel from '@/components/streaming/profile/AbilityRewardCarousel';
import SponsorsSection from '@/components/streaming/profile/SponsorsSection';
import ProductsGrid from '@/components/streaming/profile/ProductsGrid';
import AboutMeAutoTabs from '@/components/streaming/profile/AboutMeAutoTabs';
import ViewerSeasonPass from '@/components/streaming/profile/ViewerSeasonPass';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MOCK_STREAMERS } from '../components/streaming/mockData';

export default function StreamerProfile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const streamerId = searchParams.get('id') || '1';
  const streamer = MOCK_STREAMERS.find(s => s.id === streamerId) || MOCK_STREAMERS[0];
  const [activeTab, setActiveTab] = useState('overview');
  const [preview, setPreview] = useState({
    title: 'Elder Scrolls Online',
    keyArtUrl: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=1200&auto=format&fit=crop'
  });

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
        <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-slate-900/50 backdrop-blur-xl shadow-2xl mb-8">
           {/* Cover / Intro Video Bg */}
           <div className="h-72 w-full relative">
              <video src={streamer.intro_video_url} className="w-full h-full object-cover opacity-40" autoPlay loop muted playsInline />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1419] via-transparent to-transparent" />
           </div>

           <div className="px-8 pb-8 -mt-16 relative flex items-end justify-between">
              <div className="flex items-end gap-6">
                <div className="w-32 h-32 rounded-full border-4 border-[#0f1419] overflow-hidden shadow-2xl">
                  <img src={streamer.avatar_url} className="w-full h-full object-cover" />
                </div>
                <div className="pb-3">
                   <div className="flex items-center gap-3 mb-1">
                     <h1 className="text-3xl font-black text-white">{streamer.username}</h1>
                     <Badge className="bg-cyan-500 text-black font-bold">PRO</Badge>
                   </div>
                   <p className="text-lg text-white/60 font-light italic">"{streamer.tagline}"</p>
                </div>
              </div>

              <div className="pb-3" />
           </div>
        </div>

        {/* Stream Header + Video + Rewards */}
        <StreamHeader gameTitle={preview.title} viewCount={3421} />
        <VideoBox title={preview.title} keyArtUrl={preview.keyArtUrl} />
        <AbilityRewardCarousel onSelect={(it) => setPreview((p) => ({ ...p, keyArtUrl: it.image }))} />

        {/* Sponsors */}
        <SponsorsSection />
        <ProductsGrid />

        {/* About */}
        <AboutMeAutoTabs />

        {/* Seasonal Pass at bottom */}
        <ViewerSeasonPass />

      </div>
    </div>
  );
}