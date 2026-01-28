import React, { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Play, AudioWaveform, Plus, Shield, AlertTriangle, Hash, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/auth/AuthContext';

// Single chat message
const Message = ({ msg }) => {
  const isVoice = msg.type === 'voice';
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-2 p-2 rounded-lg ${isVoice ? 'bg-blue-900/40' : 'bg-slate-800/50'}`}
    >
      <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center font-bold text-sm">
        {msg.author.charAt(0)}
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-blue-300 text-sm truncate">{msg.author}</p>
          <span className="text-[10px] text-white/40">{new Date(msg.ts || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        {isVoice ? (
          <div className="flex items-center gap-2 mt-1 cursor-pointer group">
            <Play className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />
            <AudioWaveform className="w-10 h-5 text-slate-400 group-hover:text-slate-200 transition-colors" />
            <span className="text-xs text-slate-400">0:07</span>
          </div>
        ) : (
          <p className="text-slate-200 break-words">{msg.content}</p>
        )}
      </div>
    </motion.div>
  );
};

// Three-column Game Chat (Chat | Topics | Guild Channels)
export default function StreamChatPanel() {
  const { user } = useAuth();
  const canManageGuildChannels = user?.role === 'admin'; // map admin -> master/officer for this UI

  // Topic channels (static examples)
  const [topics] = useState([
    { id: 'topic:strategy', name: 'Strategy' },
    { id: 'topic:lfg', name: 'LFG' },
    { id: 'topic:trades', name: 'Trades' },
    { id: 'topic:spoilers', name: 'Spoilers' },
  ]);

  // Guild channels (mock), with soft 100 cap indicator
  const [guildChannels, setGuildChannels] = useState([
    { id: 'guild:alpha:general', name: 'Alpha Guild - General', members: 96 },
    { id: 'guild:alpha:raids', name: 'Alpha Guild - Raids', members: 102 },
    { id: 'guild:omega:pvp', name: 'Omega Guild - PvP', members: 64 },
  ]);

  // Messages per channel id
  const [messagesByChannel, setMessagesByChannel] = useState(() => ({
    'topic:strategy': [
      { id: 1, author: 'Shadow_Stryker', content: 'Best build for Act II boss?', type: 'text', ts: Date.now() - 600000 },
      { id: 2, author: 'Glitch_Witch', content: 'Stack frost + bleed, kite adds.', type: 'text', ts: Date.now() - 540000 },
    ],
    'topic:lfg': [
      { id: 3, author: 'TankyTom', content: 'LF Healer for dungeon run', type: 'text', ts: Date.now() - 300000 },
    ],
    'guild:alpha:general': [
      { id: 4, author: 'GuildMaster', content: 'Welcome new members!', type: 'text', ts: Date.now() - 720000 },
    ],
    'guild:alpha:raids': [
      { id: 5, author: 'RaidLead', content: 'Meeting at 8pm UTC', type: 'text', ts: Date.now() - 360000 },
    ],
    'guild:omega:pvp': [
      { id: 6, author: 'OmegaLead', content: 'Queue ready? Need 2 more.', type: 'text', ts: Date.now() - 420000 },
    ],
  }));

  // Current selection defaults to first topic
  const defaultChannel = topics[0];
  const [selectedChannelId, setSelectedChannelId] = useState(defaultChannel.id);

  const selectedChannelMeta = useMemo(() => {
    if (selectedChannelId.startsWith('topic:')) {
      const t = topics.find(t => t.id === selectedChannelId);
      return { type: 'topic', name: t?.name || 'Topic', members: undefined };
    }
    const g = guildChannels.find(c => c.id === selectedChannelId);
    return { type: 'guild', name: g?.name || 'Guild Channel', members: g?.members };
  }, [selectedChannelId, topics, guildChannels]);

  const chatEndRef = useRef(null);
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const currentMessages = messagesByChannel[selectedChannelId] || [];

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const msg = { id: Date.now(), author: user?.full_name || 'You', content: newMessage.trim(), type: 'text', ts: Date.now() };
    setMessagesByChannel(prev => ({
      ...prev,
      [selectedChannelId]: [...(prev[selectedChannelId] || []), msg],
    }));
    setNewMessage('');
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleVoiceMessage = () => {
    setIsRecording(true);
    setTimeout(() => {
      const msg = { id: Date.now(), author: user?.full_name || 'You', content: 'Voice Message', type: 'voice', ts: Date.now() };
      setMessagesByChannel(prev => ({
        ...prev,
        [selectedChannelId]: [...(prev[selectedChannelId] || []), msg],
      }));
      setIsRecording(false);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 1200);
  };

  const [newGuildChannelName, setNewGuildChannelName] = useState('');
  const createGuildChannel = () => {
    if (!canManageGuildChannels || !newGuildChannelName.trim()) return;
    const id = `guild:new:${newGuildChannelName.toLowerCase().replace(/\s+/g, '-')}`;
    if (guildChannels.some(c => c.id === id)) return;
    const channel = { id, name: newGuildChannelName.trim(), members: 1 };
    setGuildChannels(prev => [channel, ...prev]);
    setMessagesByChannel(prev => ({ ...prev, [id]: [] }));
    setNewGuildChannelName('');
    setSelectedChannelId(id);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/70 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700/50">
        <h3 className="text-base font-bold">Game Chat</h3>
        <div className="text-[11px] text-white/50 uppercase tracking-wider flex items-center gap-2">
          <Hash className="w-3 h-3" />
          <span className="truncate max-w-[240px]">{selectedChannelMeta.name}</span>
          {typeof selectedChannelMeta.members === 'number' && (
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[10px]">
              <Users className="w-3 h-3" /> {selectedChannelMeta.members}
            </span>
          )}
        </div>
      </div>

      {/* Columns */}
      <div className="flex-1 grid grid-cols-12 gap-0">
        {/* Left: Chat */}
        <div className="col-span-12 lg:col-span-7 flex flex-col min-w-0 border-r border-slate-700/50">
          <div className="flex-1 p-3 space-y-3 overflow-y-auto">
            {currentMessages.map(m => (<Message key={m.id} msg={m} />))}
            <div ref={chatEndRef} />
          </div>
          <div className="p-3 border-t border-slate-700/50 flex items-center gap-2">
            <Input
              placeholder={selectedChannelMeta.type === 'guild' ? 'Message guild channel…' : 'Message topic…'}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="bg-slate-800 border-slate-700"
            />
            <Button size="icon" onClick={handleSend} aria-label="Send"><Send className="w-4 h-4" /></Button>
            <Button
              size="icon"
              variant={isRecording ? 'destructive' : 'outline'}
              onClick={handleVoiceMessage}
              disabled={isRecording}
              aria-label="Record voice"
            >
              <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Middle: Topics */}
        <div className="hidden lg:flex lg:col-span-3 flex-col min-w-0 border-r border-slate-700/50">
          <div className="p-3 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/80">
              <Hash className="w-4 h-4" />
              <span className="text-sm font-semibold">Channel Topics</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {topics.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedChannelId(t.id)}
                className={`w-full text-left px-3 py-2 rounded-lg border mb-2 transition-colors ${
                  selectedChannelId === t.id
                    ? 'bg-white/15 border-white/20 text-white'
                    : 'bg-white/[0.03] border-white/10 text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5" />
                  <span className="text-sm font-medium">{t.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Guild Channels */}
        <div className="hidden lg:flex lg:col-span-2 flex-col min-w-0">
          <div className="p-3 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/80">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-semibold">Guild Channels</span>
            </div>
          </div>

          {/* Soft cap notice visible if any channel >=100 */}
          <div className="px-3 pt-3">
            <AnimatePresence>
              {guildChannels.some(c => c.members >= 100) && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mb-3 flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-500/10 text-amber-200 p-2"
                >
                  <AlertTriangle className="w-4 h-4 mt-0.5" />
                  <p className="text-xs leading-snug">Some channels are at the soft 100-user cap. You can still join, but consider creating or switching to another channel.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Create channel (masters/officers) */}
          <div className="px-3 pb-2">
            <div className="flex items-center gap-2">
              <Input
                placeholder={canManageGuildChannels ? 'Create guild channel…' : 'Insufficient permission'}
                value={newGuildChannelName}
                onChange={(e) => setNewGuildChannelName(e.target.value)}
                disabled={!canManageGuildChannels}
                className="bg-slate-800 border-slate-700 h-9"
              />
              <Button size="icon" onClick={createGuildChannel} disabled={!canManageGuildChannels || !newGuildChannelName.trim()} aria-label="Create channel">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {!canManageGuildChannels && (
              <p className="mt-1 text-[10px] text-white/40">Only guild masters/officers can create channels.</p>)
            }
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-2">
            {guildChannels.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedChannelId(c.id)}
                className={`w-full text-left px-3 py-2 rounded-lg border mb-2 transition-colors ${
                  selectedChannelId === c.id
                    ? 'bg-white/15 border-white/20 text-white'
                    : 'bg-white/[0.03] border-white/10 text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">{c.name}</span>
                  <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${c.members >= 100 ? 'bg-amber-500/10 border-amber-400/30 text-amber-200' : 'bg-white/5 border-white/10 text-white/60'}`}>
                    <Users className="w-3 h-3" /> {c.members}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}