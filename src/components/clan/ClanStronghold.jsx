import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TransparentModel3DViewer from '@/components/dashboard/TransparentModel3DViewer';
import ClanChat from '@/components/clan/ClanChat';
import MemberList from '@/components/clan/MemberList';
import { useRef } from 'react';
import { Shield, Crown, Users, Coins, Zap, Calendar, Settings, Image as ImageIcon, Box, Activity, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ClanStronghold({ clan, activeVoiceRooms, isRosterOpen, isStrongholdEnabled }) {
  const [environmentUrl, setEnvironmentUrl] = useState('https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/ddff83a29_ModularEnvironment.fbx');
  const [upgradesOpen, setUpgradesOpen] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const upgradesDropdownRef = React.useRef(null);

  React.useEffect(() => {
    if (!upgradesOpen) return;
    const handler = (e) => {
      if (upgradesDropdownRef.current && !upgradesDropdownRef.current.contains(e.target)) {
        setUpgradesOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [upgradesOpen]);

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
        {isStrongholdEnabled && (
          <TransparentModel3DViewer 
            roomModelUrl={environmentUrl}
          />
        )}
      </div>

      {/* Subtle Overlay to make UI readable */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />

      {/* UI Layer */}
      <div className="absolute inset-0 z-20 pointer-events-none p-6">
        
        {/* Left Side Widgets */}
        <div className="absolute bottom-[130px] left-8 w-[320px] flex flex-col gap-4 pointer-events-auto">


          {/* Current Status Widget (Disconnected, below) */}
          <GlassWidget className="mt-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-white/80 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400" /> Clan Updates
              </h3>
            </div>
            
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
          </GlassWidget>
        </div>

        {/* Right Side Widgets */}
        <div className="absolute top-20 right-8 w-[320px] flex flex-col gap-4 pointer-events-auto">
          {/* Schedule Widget (Moved here, replacing Treasury) */}
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

        {/* Roster Popup */}
        <AnimatePresence>
          {isRosterOpen && (
            <>
              {/* Shaded Background */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm z-30 pointer-events-auto"
              />
              
              {/* Roster Content */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute top-[180px] bottom-[110px] left-[360px] right-[390px] z-40 pointer-events-auto bg-black/70 border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-2xl flex flex-col min-w-[300px]"
              >
                <MemberList clan={clan} fullView={true} noBorder={true} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Bottom Right: Clan Chat */}
        <div className="absolute bottom-[90px] right-8 w-[350px] h-[380px] flex pointer-events-auto shadow-2xl rounded-2xl overflow-hidden border border-white/10 bg-black/60 backdrop-blur-xl z-20">
          <div className="flex-1 flex flex-col">
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