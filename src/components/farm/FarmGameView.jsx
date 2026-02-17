import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, MessageSquare, Plus, ArrowLeft, Shield, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

import FarmTopicSelector from './FarmTopicSelector';
import FarmTopicContent from './FarmTopicContent';
import VoiceRoomPreviewModal from './voice/VoiceRoomPreviewModal';
import ActiveVoiceControls from './voice/ActiveVoiceControls';

import { toast } from 'sonner';

export default function FarmGameView({ game, onBack }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTopic = searchParams.get('topic');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [activeVoiceRoom, setActiveVoiceRoom] = useState(null);

  const setActiveTopic = (topic) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (topic) newParams.set('topic', topic);
      else newParams.delete('topic');
      return newParams;
    });
  };

  const isOwned = game.tags?.includes('Owned');

  const handleJoinRequest = (room) => {
    if (activeVoiceRoom) {
      toast.error("Already in a call", { description: "Please leave your current voice room first." });
      return;
    }
    setSelectedRoom(room);
  };

  const confirmJoinRoom = (room) => {
    setActiveVoiceRoom(room);
    setSelectedRoom(null);
    toast.success(`Joined ${room.name}`, { description: "Mic is live." });
  };

  const handleLeaveVoice = () => {
    setActiveVoiceRoom(null);
    toast.info("Disconnected", { description: "You left the voice room." });
  };

  const handleBack = () => {
    if (activeTopic) setActiveTopic(null);
    else onBack();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* COMPACT HEADER */}
      <div className="relative flex-shrink-0" style={{
        background: 'rgba(15, 20, 25, 0.6)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* Subtle banner BG */}
        <div className="absolute inset-0 overflow-hidden z-0">
          <img src={game.image} alt="" className="w-full h-full object-cover opacity-[0.07]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1419] via-[#0f1419]/90 to-[#0f1419]/70" />
        </div>

        <div className="relative z-10 px-6 py-3 flex items-center gap-4">
          {/* Back */}
          <Button variant="ghost" size="sm" onClick={handleBack} className="text-white/40 hover:text-white hover:bg-white/5 h-8 px-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>

          {/* Game Cover */}
          <img src={game.image} alt={game.title} className="w-10 h-14 rounded-md object-cover border border-white/10 flex-shrink-0" />

          {/* Game Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-white truncate">{game.title}</h1>
            <div className="flex items-center gap-4 mt-0.5">
              <div className="flex items-center gap-1.5 text-green-400 text-[11px] font-semibold">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {game.activeUsers?.toLocaleString()} online
              </div>
              <div className="flex items-center gap-1.5 text-white/30 text-[11px]">
                <Mic2 className="w-3 h-3" /> {game.voiceRooms} rooms
              </div>
              {!isOwned && (
                <div className="flex items-center gap-1 text-yellow-500/80 text-[10px] font-bold">
                  <Shield className="w-3 h-3" /> GUEST
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button size="sm" variant="ghost" onClick={() => navigate(createPageUrl('Community'))} className="text-white/40 hover:text-white text-xs h-8 gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Forum
            </Button>
            <Button size="sm" className="bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/20 text-xs h-8 gap-1.5 rounded-lg">
              <Plus className="w-3.5 h-3.5" /> New Post
            </Button>
          </div>
        </div>

        {/* Topic Selector */}
        <div className="relative z-10 px-6 pb-2.5">
          <FarmTopicSelector activeTopic={activeTopic} onSelect={setActiveTopic} />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-hidden" style={{ background: 'rgba(15, 20, 25, 0.4)' }}>
        <FarmTopicContent
          topic={activeTopic}
          gameId={game.id}
          gameTitle={game.title}
          isOwned={isOwned}
          onJoinRoomRequest={handleJoinRequest}
        />
      </div>

      {/* Voice Overlays */}
      <VoiceRoomPreviewModal room={selectedRoom} isOpen={!!selectedRoom} onClose={() => setSelectedRoom(null)} onConfirm={confirmJoinRoom} />
      <AnimatePresence>
        {activeVoiceRoom && <ActiveVoiceControls room={activeVoiceRoom} onLeave={handleLeaveVoice} />}
      </AnimatePresence>
    </div>
  );
}