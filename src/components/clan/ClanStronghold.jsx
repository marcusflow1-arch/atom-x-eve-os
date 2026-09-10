import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TransparentModel3DViewer from '@/components/dashboard/TransparentModel3DViewer';
import MemberList from '@/components/clan/MemberList';
import { useRef } from 'react';
import { Shield, Crown, Users, Coins, Zap, Calendar, Settings, Image as ImageIcon, Box, Activity, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ClanHomeSummary from '@/components/clan/ClanHomeSummary';

export default function ClanStronghold({ clan, activeVoiceRooms, isRosterOpen, isStrongholdEnabled, header }) {
  const [environmentUrl, setEnvironmentUrl] = useState('https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/ddff83a29_ModularEnvironment.fbx');
  const [upgradesOpen, setUpgradesOpen] = useState(false);
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

  return (
    <div className="absolute inset-0 overflow-hidden" data-testid="clan-home">
      {isStrongholdEnabled && <div className="absolute inset-0 z-0 pointer-events-auto"><TransparentModel3DViewer roomModelUrl={environmentUrl} /></div>}
      {isStrongholdEnabled && <div className="absolute inset-0 z-10 bg-background/70 pointer-events-none" />}
      <div className="clan-home-content">
        {header}
        <ClanHomeSummary />
      </div>
    </div>
  );
}