import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Hash, Plus, MessageCircle } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import ClanChat from '@/components/clan/ClanChat';
import ClanWhisperDrawer from '@/components/clan/ClanWhisperDrawer';

export default function ClanChatHub({ clan, myRole }) {
  const queryClient = useQueryClient();
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [whisperOpen, setWhisperOpen] = useState(false);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const isPrivileged = myRole === 'leader' || myRole === 'officer';

  const { data: channels } = useQuery({
    queryKey: ['clanChannels', clan?.id],
    queryFn: () => base44.entities.ClanChannel.filter({ divisionId: clan.id }),
    enabled: !!clan?.id,
  });

  const createChannel = useMutation({
    mutationFn: (name) => base44.entities.ClanChannel.create({ divisionId: clan.id, name, type: 'text' }),
    onSuccess: () => {
      setNewChannelName('');
      setShowAddChannel(false);
      queryClient.invalidateQueries({ queryKey: ['clanChannels', clan?.id] });
    },
  });

  const textChannels = (channels || []).filter((c) => c.type !== 'voice').sort((a, b) => (a.position || 0) - (b.position || 0));
  const activeChannel = textChannels.find((c) => c.id === selectedChannelId) || textChannels[0];

  return (
    <div className="relative w-full h-full flex overflow-hidden rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl">
      {/* Channels rail */}
      <div className="w-52 flex-shrink-0 flex flex-col border-r border-white/10 bg-black/30">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Channels</span>
          {isPrivileged && (
            <button
              onClick={() => setShowAddChannel((v) => !v)}
              className="w-5 h-5 rounded-full bg-white/10 hover:bg-cyan-500/30 flex items-center justify-center text-white/60 hover:text-cyan-300 transition-colors"
              title="Add channel"
            >
              <Plus className="w-3 h-3" />
            </button>
          )}
        </div>
        {showAddChannel && (
          <div className="p-2 border-b border-white/10 space-y-1.5">
            <input
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="channel-name"
              className="w-full bg-white/10 text-white text-xs rounded-lg px-2.5 py-1.5 outline-none border border-white/10 placeholder-white/30"
            />
            <button
              onClick={() => { if (newChannelName.trim()) createChannel.mutate(newChannelName.trim().toLowerCase().replace(/\s+/g, '-')); }}
              className="w-full py-1.5 rounded-lg bg-cyan-500/30 hover:bg-cyan-500/50 text-cyan-300 text-xs font-semibold transition-colors"
            >
              Create
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: 'none' }}>
          {textChannels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setSelectedChannelId(ch.id)}
              className={`w-full flex items-center gap-2 px-4 py-2 text-left text-xs transition-colors ${
                activeChannel?.id === ch.id ? 'bg-cyan-500/15 text-cyan-300 border-r-2 border-cyan-400' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Hash className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate font-medium">{ch.name}</span>
            </button>
          ))}
          {textChannels.length === 0 && (
            <div className="px-4 py-6 text-center">
              <p className="text-white/30 text-[11px] mb-3">No channels yet</p>
              <button
                onClick={() => createChannel.mutate('general')}
                disabled={createChannel.isPending}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/30 hover:bg-cyan-500/50 text-cyan-300 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Create #general
              </button>
            </div>
          )}
        </div>
        {/* Whisper trigger */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => setWhisperOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/35 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" /> Whisper
          </button>
        </div>
      </div>

      {/* Main clan chat */}
      <div className="flex-1 min-w-0 relative">
        {activeChannel ? (
          <ClanChat key={activeChannel.id} clan={clan} channel={activeChannel} myRole={myRole} />
        ) : (
          <div className="h-full flex items-center justify-center text-white/40 text-sm">Select or create a channel to start chatting</div>
        )}
      </div>

      {/* Whisper pull-out drawer — fades only the right portion */}
      <AnimatePresence>
        {whisperOpen && <ClanWhisperDrawer clan={clan} onClose={() => setWhisperOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}