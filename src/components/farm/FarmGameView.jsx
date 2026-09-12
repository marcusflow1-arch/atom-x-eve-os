import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeft, MessageSquare, Plus, Route, Sprout } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import FarmTopicSelector from './FarmTopicSelector';
import FarmTopicContent from './FarmTopicContent';
import VoiceRoomPreviewModal from './voice/VoiceRoomPreviewModal';
import ActiveVoiceControls from './voice/ActiveVoiceControls';
import CreatePostModal from './CreatePostModal';
import CreateFarmRouteModal from './CreateFarmRouteModal';
import { toast } from 'sonner';

export default function FarmGameView({ game, onBack }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTopic = searchParams.get('topic');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [activeVoiceRoom, setActiveVoiceRoom] = useState(null);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);

  const art = game?.banner_image || game?.cover_image || game?.image || '';
  const cover = game?.cover_image || game?.image || game?.banner_image || '';
  const isOwned = game?.tags?.includes('Owned');

  const setActiveTopic = (topic) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (topic) next.set('topic', topic);
      else next.delete('topic');
      return next;
    });
  };

  const handleJoinRequest = (room) => {
    if (activeVoiceRoom) {
      toast.error('Already in a call', { description: 'Leave your current voice room first.' });
      return;
    }
    setSelectedRoom(room);
  };
  const confirmJoinRoom = (room) => {
    setActiveVoiceRoom(room);
    setSelectedRoom(null);
    toast.success(`Joined ${room.name}`, { description: 'Mic is live.' });
  };
  const handleLeaveVoice = () => {
    setActiveVoiceRoom(null);
    toast.info('Disconnected', { description: 'You left the voice room.' });
  };
  const handleBack = () => activeTopic ? setActiveTopic(null) : onBack?.();
  const triggerRefresh = () => setSearchParams((previous) => { const next = new URLSearchParams(previous); next.set('refresh', String(Date.now())); return next; });

  return <div className="flex h-full flex-col overflow-hidden bg-[#020617] text-white">
    <header className="relative shrink-0 overflow-hidden border-b border-white/[0.06]">
      {art && <img src={art} alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.18] blur-[1px]" />}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#020617_0%,rgba(2,6,23,.86)_48%,rgba(2,6,23,.66)_100%)]" />
      <div className="relative flex min-h-[132px] items-center gap-4 px-6 py-5">
        <button type="button" onClick={handleBack} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.045] text-white/45 hover:bg-white/[0.08] hover:text-white"><ArrowLeft className="h-4 w-4" /></button>
        {cover ? <img src={cover} alt="" className="h-[78px] w-[58px] rounded-lg object-cover shadow-xl" /> : <div className="grid h-[78px] w-[58px] place-items-center rounded-lg bg-white/[0.04]"><Sprout className="h-5 w-5 text-emerald-200/50" /></div>}
        <div className="min-w-0"><p className="text-[9px] font-semibold uppercase tracking-[.2em] text-emerald-200/45">Farming workspace</p><h1 className="mt-1 truncate text-xl font-semibold">{game?.title}</h1><p className="mt-1 text-[11px] text-white/35">{game?.genre || 'Game'}{game?.developer ? ` · ${game.developer}` : ''}{isOwned ? ' · In Library' : ''}</p></div>
        <div className="ml-auto flex items-center gap-2"><button type="button" onClick={() => navigate(createPageUrl('Community'))} className="flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-2 text-[11px] text-white/45 hover:bg-white/[0.07] hover:text-white"><MessageSquare className="h-3.5 w-3.5" />Forum</button><button type="button" onClick={() => setShowRouteModal(true)} className="flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-2 text-[11px] text-white/55 hover:bg-white/[0.07] hover:text-white"><Route className="h-3.5 w-3.5" />Route</button><button type="button" onClick={() => setShowCreatePostModal(true)} className="flex items-center gap-1.5 rounded-full bg-emerald-300/12 px-3 py-2 text-[11px] font-semibold text-emerald-100"><Plus className="h-3.5 w-3.5" />New Post</button></div>
      </div>
      <div className="relative border-t border-white/[0.045] bg-black/10 px-6 py-2.5 backdrop-blur-xl"><FarmTopicSelector activeTopic={activeTopic} onSelect={setActiveTopic} /></div>
    </header>

    <div className="min-h-0 flex-1 overflow-hidden bg-[#020617]/70"><FarmTopicContent topic={activeTopic} gameId={game?.id} gameTitle={game?.title} isOwned={isOwned} onJoinRoomRequest={handleJoinRequest} /></div>

    <VoiceRoomPreviewModal room={selectedRoom} isOpen={!!selectedRoom} onClose={() => setSelectedRoom(null)} onConfirm={confirmJoinRoom} />
    <AnimatePresence>{activeVoiceRoom && <ActiveVoiceControls room={activeVoiceRoom} onLeave={handleLeaveVoice} />}</AnimatePresence>
    <CreatePostModal open={showCreatePostModal} onClose={() => setShowCreatePostModal(false)} topic={activeTopic || 'farming'} gameTitle={game?.title} gameId={game?.id} onCreated={triggerRefresh} />
    <CreateFarmRouteModal open={showRouteModal} onClose={() => setShowRouteModal(false)} gameId={game?.id} onCreated={triggerRefresh} />
  </div>;
}
