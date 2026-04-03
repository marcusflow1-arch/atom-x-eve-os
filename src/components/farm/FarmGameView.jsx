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
import CreatePostModal from './CreatePostModal';

import { toast } from 'sonner';

export default function FarmGameView({ game, onBack }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTopic = searchParams.get('topic');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [activeVoiceRoom, setActiveVoiceRoom] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const videoRef = useRef(null);

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
      {/* VIDEO BANNER HEADER */}
      <div className="relative flex-shrink-0" style={{
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* Video Banner — 35-40% taller */}
        <div className="relative w-full h-[220px] overflow-hidden">
          {/* Video or fallback image */}
          {game.trailer_url || (game.video_urls && game.video_urls.length > 0) ? (
            <video
              ref={videoRef}
              src={game.trailer_url || game.video_urls[0]}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              loop
              muted={isMuted}
              playsInline
              poster={game.banner_image || game.image}
            />
          ) : (
            <img
              src={game.banner_image || game.image}
              alt={game.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1419] via-[#0f1419]/40 to-transparent z-[1]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1419]/80 via-transparent to-transparent z-[1]" />

          {/* Mute toggle */}
          {(game.trailer_url || (game.video_urls && game.video_urls.length > 0)) && (
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/15"
              style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-white/60" /> : <Volume2 className="w-3.5 h-3.5 text-white/60" />}
            </button>
          )}

          {/* Back button over banner */}
          <div className="absolute top-4 left-4 z-10">
            <Button variant="ghost" size="sm" onClick={handleBack} className="text-white/60 hover:text-white hover:bg-white/10 h-8 px-2 rounded-full"
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>

          {/* Game info overlay at bottom of banner */}
          <div className="absolute bottom-0 left-0 right-0 z-[2] px-6 pb-3 flex items-end justify-between">
            <div className="flex items-end gap-4">
              {/* Game Cover */}
              <img src={game.image} alt={game.title} className="w-14 h-20 rounded-lg object-cover border border-white/15 flex-shrink-0 shadow-2xl" />

              <div className="mb-1">
                <h1 className="text-xl font-bold text-white tracking-tight drop-shadow-lg">{game.title}</h1>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1.5 text-green-400 text-[11px] font-semibold">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    {game.activeUsers?.toLocaleString()} online
                  </div>
                  <div className="flex items-center gap-1.5 text-white/40 text-[11px]">
                    <Mic2 className="w-3 h-3" /> {game.voiceRooms} rooms
                  </div>
                  {!isOwned && (
                    <div className="flex items-center gap-1 text-yellow-500/80 text-[10px] font-bold">
                      <Shield className="w-3 h-3" /> GUEST
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-shrink-0 mb-1">
              <Button size="sm" variant="ghost" onClick={() => navigate(createPageUrl('Community'))} className="text-white/50 hover:text-white text-xs h-8 gap-1.5 rounded-full"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Forum
              </Button>
              <Button size="sm" onClick={() => setShowCreatePostModal(true)} className="bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/25 text-xs h-8 gap-1.5 rounded-full">
                <Plus className="w-3.5 h-3.5" /> New Post
              </Button>
            </div>
          </div>
        </div>

        {/* Topic Selector — below banner */}
        <div className="relative z-10 px-6 py-2.5" style={{ background: 'rgba(15, 20, 25, 0.7)', backdropFilter: 'blur(20px)' }}>
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

      <CreatePostModal 
        open={showCreatePostModal} 
        onClose={() => setShowCreatePostModal(false)}
        topic={activeTopic || 'achievements'}
        gameTitle={game.title}
        gameId={game.id}
        onCreated={() => {
          setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('refresh', String(Date.now()));
            return newParams;
          });
        }}
      />
    </div>
  );
}