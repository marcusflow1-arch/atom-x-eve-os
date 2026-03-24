import React, { useState } from 'react';
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
    <div className={`bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl ${className}`}>
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
        
        {/* Top Left: Clan Overview */}
        <GlassWidget className="absolute top-6 left-6 w-80 pointer-events-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md overflow-hidden">
              {clan?.icon ? <img src={clan.icon} className="w-full h-full object-cover" /> : <Shield className="w-6 h-6 text-white/50" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white uppercase tracking-wider">{clan?.name || 'Stronghold'}</h2>
              <div className="flex items-center gap-2 text-xs text-white/50">
                <span className="flex items-center gap-1"><Crown className="w-3 h-3 text-amber-500" /> LVL {clan?.level || 1}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3 text-cyan-500" /> {members?.length || 0}</span>
              </div>
            </div>
          </div>
          <p className="text-white/60 text-sm leading-relaxed mb-4">
            {clan?.description || 'Your clan\'s base of operations. Build, strategize, and conquer.'}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-xs">
              <Settings className="w-3 h-3 mr-2" /> Manage
            </Button>
          </div>
        </GlassWidget>

        {/* Top Right: Treasury */}
        <GlassWidget className="absolute top-6 right-6 w-72 pointer-events-auto">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-4">
            <Coins className="w-4 h-4 text-amber-400" /> Treasury
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/5">
              <span className="text-white/60 text-xs">Credits</span>
              <span className="text-white font-bold text-sm">1.45M</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/5">
              <span className="text-white/60 text-xs">Energy</span>
              <span className="text-cyan-400 font-bold text-sm">85%</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/5">
              <span className="text-white/60 text-xs">Materials</span>
              <span className="text-green-400 font-bold text-sm">3,240</span>
            </div>
          </div>
        </GlassWidget>

        {/* Middle Left: Schedule / Events */}
        <GlassWidget className="absolute top-[280px] left-6 w-80 pointer-events-auto">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-purple-400" /> Schedule
          </h3>
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-white/5 border border-white/5">
              <div className="text-xs text-white/50 mb-1">Today • 20:00 UTC</div>
              <div className="text-sm text-white font-medium">Sector 7 Domination Raid</div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/5">
              <div className="text-xs text-white/50 mb-1">Tomorrow • 18:00 UTC</div>
              <div className="text-sm text-white font-medium">Weekly Clan Meeting</div>
            </div>
          </div>
        </GlassWidget>

        {/* Middle Right: Upgrade Environment */}
        <GlassWidget className="absolute top-[280px] right-6 w-72 pointer-events-auto">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-blue-400" /> Stronghold Upgrades
          </h3>
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start bg-white/5 border-white/10 hover:bg-white/10 text-sm"
              onClick={() => setEnvironmentUrl('https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/ddff83a29_ModularEnvironment.fbx')}
            >
              <ImageIcon className="w-4 h-4 mr-3 text-white/50" /> Base Hangar
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start bg-white/5 border-white/10 hover:bg-white/10 text-sm"
              onClick={() => setEnvironmentUrl('virtual_room_7.glb')}
            >
              <ImageIcon className="w-4 h-4 mr-3 text-white/50" /> Virtual Room 7
            </Button>
            <Button variant="outline" className="w-full justify-start bg-white/5 border-white/10 hover:bg-white/10 text-sm">
              <Box className="w-4 h-4 mr-3 text-white/50" /> Add Storage Unit
            </Button>
          </div>
        </GlassWidget>

        {/* Bottom Right: Unified Chat & Roster */}
        <div className="absolute bottom-[80px] right-6 h-[400px] flex pointer-events-auto items-end shadow-2xl rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-xl">
          {/* Roster Extension */}
          <AnimatePresence>
            {isRosterOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="h-full overflow-hidden border-r border-white/10"
              >
                <div className="w-[320px] h-full">
                  <MemberList clan={clan} fullView={true} />
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