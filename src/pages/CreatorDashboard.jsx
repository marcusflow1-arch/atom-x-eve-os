import React, { useState } from 'react';
import VolumetricFogBackground from '@/components/creator/VolumetricFogBackground';
import RefractingGearNav from '@/components/creator/RefractingGearNav';
import LiquidMetalToggle from '@/components/creator/LiquidMetalToggle';
import MercuryRippleTransition from '@/components/creator/MercuryRippleTransition';
import { Crown, Shield, Zap, Bell, Mic, Video, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CreatorDashboard() {
  const [activeTab, setActiveTab] = useState('settings');
  const [toggles, setToggles] = useState({
    autoGoLive: true,
    recordStreams: true,
    allowClips: true,
    chatModeration: true,
    subscriberOnly: false,
    lowLatency: true,
    hdrEnabled: false,
    seasonActive: true,
    premiumRewards: true,
    autoClaim: false,
    publicVoter: true
  });

  const handleToggle = (key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'seasonpass':
        return (
          <div className="max-w-3xl mx-auto p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-white mb-2">Seasonal Pass Builder</h1>
                <p className="text-white/40">Configure the rewards and progression for the current season.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md mb-8">
                <div className="flex items-center gap-2 mb-6 text-yellow-400">
                    <Crown size={18} />
                    <h2 className="text-sm font-bold uppercase tracking-widest">Season Configuration</h2>
                </div>
                <div className="grid grid-cols-1 gap-2">
                    <LiquidMetalToggle 
                        label="Season Active" 
                        isOn={toggles.seasonActive} 
                        onToggle={() => handleToggle('seasonActive')} 
                    />
                    <LiquidMetalToggle 
                        label="Enable Premium Reward Track" 
                        isOn={toggles.premiumRewards} 
                        onToggle={() => handleToggle('premiumRewards')} 
                    />
                     <LiquidMetalToggle 
                        label="Allow Auto-Claim Rewards" 
                        isOn={toggles.autoClaim} 
                        onToggle={() => handleToggle('autoClaim')} 
                    />
                     <LiquidMetalToggle 
                        label="Public Community Voting" 
                        isOn={toggles.publicVoter} 
                        onToggle={() => handleToggle('publicVoter')} 
                    />
                </div>
            </div>

            {/* Visual Placeholder for Builder */}
            <div className="rounded-2xl border-2 border-dashed border-white/10 p-12 flex flex-col items-center justify-center text-white/20 bg-black/20">
                <Crown size={48} className="mb-4 opacity-50" />
                <p>Drag and drop reward nodes here to build the track.</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="max-w-2xl mx-auto p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-white mb-2">Stream Configuration</h1>
                <p className="text-white/40">Manage your broadcast settings and automation preferences.</p>
            </div>

            <div className="space-y-8">
                {/* Broadcast Section */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                    <div className="flex items-center gap-2 mb-6 text-cyan-400">
                        <Video size={18} />
                        <h2 className="text-sm font-bold uppercase tracking-widest">Broadcast</h2>
                    </div>
                    <LiquidMetalToggle 
                        label="Auto-Go Live when source detected" 
                        isOn={toggles.autoGoLive} 
                        onToggle={() => handleToggle('autoGoLive')} 
                    />
                    <LiquidMetalToggle 
                        label="Record VODs automatically" 
                        isOn={toggles.recordStreams} 
                        onToggle={() => handleToggle('recordStreams')} 
                    />
                    <LiquidMetalToggle 
                        label="Enable HDR Transcoding" 
                        isOn={toggles.hdrEnabled} 
                        onToggle={() => handleToggle('hdrEnabled')} 
                    />
                     <LiquidMetalToggle 
                        label="Low Latency Mode" 
                        isOn={toggles.lowLatency} 
                        onToggle={() => handleToggle('lowLatency')} 
                    />
                </div>

                {/* Community Section */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                    <div className="flex items-center gap-2 mb-6 text-purple-400">
                        <Shield size={18} />
                        <h2 className="text-sm font-bold uppercase tracking-widest">Community Safety</h2>
                    </div>
                    <LiquidMetalToggle 
                        label="AI Chat Moderation" 
                        isOn={toggles.chatModeration} 
                        onToggle={() => handleToggle('chatModeration')} 
                    />
                    <LiquidMetalToggle 
                        label="Allow Viewers to Clip" 
                        isOn={toggles.allowClips} 
                        onToggle={() => handleToggle('allowClips')} 
                    />
                     <LiquidMetalToggle 
                        label="Subscriber-Only Chat" 
                        isOn={toggles.subscriberOnly} 
                        onToggle={() => handleToggle('subscriberOnly')} 
                    />
                </div>
            </div>
          </div>
        );
      case 'overview':
        return (
            <div className="max-w-4xl mx-auto p-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
                 <div className="w-24 h-24 rounded-full bg-cyan-500/10 flex items-center justify-center mb-6 border border-cyan-500/30">
                    <Globe className="text-cyan-400" size={40} />
                 </div>
                 <h2 className="text-2xl font-bold text-white mb-2">Dashboard Overview</h2>
                 <p className="text-white/40">Metrics and stream health summary would appear here.</p>
            </div>
        );
      default:
        return (
             <div className="max-w-4xl mx-auto p-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
                 <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                    <Crown className="text-white/40" size={40} />
                 </div>
                 <h2 className="text-2xl font-bold text-white mb-2">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
                 <p className="text-white/40">This section is currently under construction.</p>
            </div>
        );
    }
  };

  return (
    <div className="min-h-screen relative font-sans text-slate-200 flex">
      <VolumetricFogBackground />
      
      {/* Sidebar Navigation */}
      <div className="h-screen sticky top-0">
        <RefractingGearNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 overflow-y-auto h-screen">
         <MercuryRippleTransition transitionKey={activeTab}>
            {renderContent()}
         </MercuryRippleTransition>
      </main>
    </div>
  );
}