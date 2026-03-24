import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TransparentModel3DViewer from '@/components/dashboard/TransparentModel3DViewer';
import ClanChat from '@/components/clan/ClanChat';
import MemberList from '@/components/clan/MemberList';
import { Shield, Crown, Users, Coins, Zap, Calendar, Settings, Image as ImageIcon, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ClanStronghold({ clan, activeVoiceRooms, isRosterOpen }) {
  const [environmentUrl, setEnvironmentUrl] = useState('https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/ddff83a29_ModularEnvironment.fbx');

  React.useEffect(() => {
    const handleEnvChange = (e) => {
      setEnvironmentUrl(e.detail);
    };
    window.addEventListener('changeStrongholdEnv', handleEnvChange);
    return () => window.removeEventListener('changeStrongholdEnv', handleEnvChange);
  }, []);

  const { data: members } = useQuery({
    queryKey: ['clanMembers', clan?.id],
    queryFn: async () => {
      if (!clan?.id) return [];
      return await base44.entities.ClanMember.filter({ clan_id: clan.id });
    },
    enabled: !!clan?.id
  });

  const { data: channels } = useQuery({
    queryKey: ['clanChannels', clan?.id],
    queryFn: async () => {
      if (!clan?.id) return [];
      return await base44.entities.ClanChannel.filter({ divisionId: clan.id });
    },
    enabled: !!clan?.id
  });

  const generalChannel = channels?.find(c => c.name.toLowerCase() === 'general') || channels?.[0];

  const GlassWidget = ({ children, className = '' }) => (
    <div className={`bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl ${className}`}>
      {children}
    </div>
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 3D Environment Background */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <TransparentModel3DViewer 
          roomModelUrl={environmentUrl}
        />
      </div>

      {/* Subtle Overlay to make UI readable */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />

      {/* UI Layer */}
      <div className="absolute inset-0 z-20 pointer-events-none p-6">
        
        {/* Left Side Widgets */}
        <div className="absolute top-[140px] left-8 w-[320px] flex flex-col gap-4 pointer-events-auto">
          
          {/* Stronghold Upgrades Widget */}
          <GlassWidget>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-white/80 uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-400" /> Stronghold Upgrades
              </h3>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-white/50 hover:text-white bg-white/5 rounded-full">
                <Settings className="w-3 h-3" />
              </Button>
            </div>
            
            {/* Environment select */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              <button 
                className={`border rounded-xl p-2 text-xs transition-colors flex items-center justify-center gap-2 ${environmentUrl.includes('ddff') ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}
                onClick={() => setEnvironmentUrl('https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/ddff83a29_ModularEnvironment.fbx')}
              >
                <ImageIcon className="w-3 h-3" /> Hangar
              </button>
              <button 
                className={`border rounded-xl p-2 text-xs transition-colors flex items-center justify-center gap-2 ${environmentUrl.includes('virtual_room') ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}
                onClick={() => setEnvironmentUrl('virtual_room_7.glb')}
              >
                <ImageIcon className="w-3 h-3" /> Room 7
              </button>
            </div>

            {/* Facilities */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] font-medium text-white/70 mb-1.5 uppercase tracking-wider">
                  <span>Command Center <span className="text-white/40 ml-1">T3</span></span>
                  <span className="text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]">72%</span>
                </div>
                <div className="h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
                  <div className="h-full w-[72%] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-medium text-white/70 mb-1.5 uppercase tracking-wider">
                  <span>Armory <span className="text-white/40 ml-1">T2</span></span>
                  <span className="text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]">45%</span>
                </div>
                <div className="h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
                  <div className="h-full w-[45%] bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-medium text-white/70 mb-1.5 uppercase tracking-wider">
                  <span>Barracks <span className="text-white/40 ml-1">T1</span></span>
                  <span className="text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]">15%</span>
                </div>
                <div className="h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
                  <div className="h-full w-[15%] bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                </div>
              </div>
            </div>
            
            <Button className="w-full mt-5 bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs py-1 h-8 rounded-xl shadow-lg">
              Manage Facilities
            </Button>
          </GlassWidget>

          {/* Schedule Widget */}
          <GlassWidget>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-white/80 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" /> Schedule
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex flex-col items-center justify-center border border-purple-500/30 shrink-0 group-hover:bg-purple-500/30 transition-colors">
                  <span className="text-[9px] uppercase leading-none font-bold">Oct</span>
                  <span className="text-sm font-black leading-none mt-1">24</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white/90 truncate">Sector 7 Domination Raid</div>
                  <div className="text-[10px] text-white/50 mt-0.5">20:00 UTC • 12/24 Joined</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex flex-col items-center justify-center border border-blue-500/30 shrink-0 group-hover:bg-blue-500/30 transition-colors">
                  <span className="text-[9px] uppercase leading-none font-bold">Oct</span>
                  <span className="text-sm font-black leading-none mt-1">25</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white/90 truncate">Weekly Meeting</div>
                  <div className="text-[10px] text-white/50 mt-0.5">18:00 UTC • Voice Chat</div>
                </div>
              </div>
            </div>
            <Button className="w-full mt-3 bg-white/5 hover:bg-white/10 text-white/70 border border-transparent text-xs py-1 h-8 rounded-xl">
              View Calendar
            </Button>
          </GlassWidget>

        </div>

        {/* Right Side Widgets */}
        <div className="absolute top-20 right-8 w-[320px] flex flex-col gap-4 pointer-events-auto">
          {/* Treasury Widget */}
          <GlassWidget>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-white/80 uppercase tracking-widest flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" /> Treasury
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-xl p-3 shadow-inner">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Zap className="w-3 h-3" /> Credits
                </div>
                <div className="text-xl font-black text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">1.45M</div>
              </div>
              <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-xl p-3 shadow-inner">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Box className="w-3 h-3" /> Materials
                </div>
                <div className="text-xl font-black text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]">3,240</div>
              </div>
            </div>
            
            <Button className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs py-1 h-9 rounded-xl font-bold shadow-[0_0_15px_rgba(245,158,11,0.15)] transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]">
              Contribute Resources
            </Button>
          </GlassWidget>
        </div>

        {/* Bottom Right: Unified Chat & Roster */}
        <div className="absolute bottom-[90px] right-8 h-[380px] flex pointer-events-auto items-end shadow-2xl rounded-2xl overflow-hidden border border-white/10 bg-black/60 backdrop-blur-xl">
          {/* Roster Extension */}
          <AnimatePresence>
            {isRosterOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "calc(100vw - 750px)", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="h-full overflow-hidden border-r border-white/10 bg-black/40"
              >
                <div style={{ width: "calc(100vw - 750px)" }} className="min-w-[400px] h-full">
                  <MemberList clan={clan} fullView={true} noBorder={true} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Clan Chat */}
          <div className="w-[350px] h-full flex flex-col">
            {generalChannel ? (
              <ClanChat clan={clan} channel={generalChannel} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-white/50">No channel available</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}