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
        
        {/* Floating Widgets moved to global tabs in Clan.jsx */}

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