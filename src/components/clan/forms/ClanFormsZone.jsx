import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Plus, Send, FolderPlus, MessageSquarePlus } from 'lucide-react';

export default function ClanFormsZone({ game, clan, user }) {
  const qc = useQueryClient();
  const [selectedChannel, setSelectedChannel] = React.useState(null);
  const [selectedTopic, setSelectedTopic] = React.useState(null);

  // New channel state
  const [newChannelOpen, setNewChannelOpen] = React.useState(false);
  const [channelName, setChannelName] = React.useState('');
  const [channelDesc, setChannelDesc] = React.useState('');

  // New topic state
  const [newTopicOpen, setNewTopicOpen] = React.useState(false);
  const [topicTitle, setTopicTitle] = React.useState('');

  // Message composer
  const [message, setMessage] = React.useState('');

  // Channels for this game (cross-clan)
  const { data: channels = [] } = useQuery({
    queryKey: ['clanFormChannels', game.id],
    queryFn: async () => {
      const res = await base44.entities.ClanFormChannel.filter({ game_id: game.id });
      return res || [];
    }
  });

  // Topics for selected channel
  const { data: topics = [] } = useQuery({
    queryKey: ['clanFormTopics', selectedChannel?.id],
    queryFn: async () => {
      if (!selectedChannel?.id) return [];
      const res = await base44.entities.ClanFormTopic.filter({ channel_id: selectedChannel.id }, '-updated_date', 100);
      return res || [];
    },
    enabled: !!selectedChannel?.id,
  });

  // Messages for selected topic
  const { data: messages = [] } = useQuery({
    queryKey: ['clanFormMessages', selectedTopic?.id],
    queryFn: async () => {
      if (!selectedTopic?.id) return [];
      const res = await base44.entities.ClanFormMessage.filter({ topic_id: selectedTopic.id }, 'created_date', 200);
      return res || [];
    },
    enabled: !!selectedTopic?.id,
    initialData: [],
  });

  // Realtime updates
  React.useEffect(() => {
    const unsubs = [];
    unsubs.push(base44.entities.ClanFormChannel.subscribe((e) => {
      if (e.data?.game_id === game.id) qc.invalidateQueries({ queryKey: ['clanFormChannels', game.id] });
    }));
    unsubs.push(base44.entities.ClanFormTopic.subscribe((e) => {
      if (e.data?.channel_id === selectedChannel?.id) qc.invalidateQueries({ queryKey: ['clanFormTopics', selectedChannel.id] });
    }));
    unsubs.push(base44.entities.ClanFormMessage.subscribe((e) => {
      if (e.data?.topic_id === selectedTopic?.id) qc.invalidateQueries({ queryKey: ['clanFormMessages', selectedTopic.id] });
    }));
    return () => unsubs.forEach((u) => { try { u(); } catch {} });
  }, [game.id, selectedChannel?.id, selectedTopic?.id, qc]);

  const createChannel = async () => {
    if (!channelName.trim()) return;
    await base44.entities.ClanFormChannel.create({
      game_id: game.id,
      name: channelName.trim(),
      description: channelDesc.trim(),
      created_by_clan_id: clan.id,
      participating_clan_ids: [clan.id],
      is_open: true,
    });
    setChannelName('');
    setChannelDesc('');
    setNewChannelOpen(false);
    qc.invalidateQueries({ queryKey: ['clanFormChannels', game.id] });
  };

  const createTopic = async () => {
    if (!selectedChannel?.id || !topicTitle.trim()) return;
    const topic = await base44.entities.ClanFormTopic.create({
      channel_id: selectedChannel.id,
      title: topicTitle.trim(),
      created_by_user_id: user?.id,
      status: 'open'
    });
    setTopicTitle('');
    setNewTopicOpen(false);
    setSelectedTopic(topic);
    qc.invalidateQueries({ queryKey: ['clanFormTopics', selectedChannel.id] });
  };

  const sendMessage = async () => {
    if (!selectedTopic?.id || !message.trim()) return;
    await base44.entities.ClanFormMessage.create({
      topic_id: selectedTopic.id,
      user_id: user?.id,
      clan_id: clan?.id,
      username: user?.full_name || user?.email?.split('@')[0] || 'User',
      content: message.trim(),
    });
    setMessage('');
    qc.invalidateQueries({ queryKey: ['clanFormMessages', selectedTopic.id] });
  };

  return (
    <div className="h-full w-full grid grid-cols-12">
      {/* Channels */}
      <div className="col-span-3 border-r border-white/10 bg-black/20 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white/50">Channels</h4>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setNewChannelOpen((v) => !v)}>
            <FolderPlus className="w-4 h-4" /> New
          </Button>
        </div>
        {newChannelOpen && (
          <div className="mb-3 p-3 rounded-xl border border-white/10 bg-white/5 space-y-2">
            <Input placeholder="Channel name" value={channelName} onChange={(e) => setChannelName(e.target.value)} />
            <Textarea placeholder="Description (optional)" value={channelDesc} onChange={(e) => setChannelDesc(e.target.value)} className="min-h-[60px]" />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setNewChannelOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={createChannel}>Create</Button>
            </div>
          </div>
        )}
        <ScrollArea className="h-[calc(100%-52px)] pr-2">
          <div className="space-y-2">
            {channels.map((ch) => (
              <button key={ch.id} onClick={() => { setSelectedChannel(ch); setSelectedTopic(null); }} className={`w-full text-left p-3 rounded-lg border transition-all ${selectedChannel?.id === ch.id ? 'bg-white/10 border-white/20' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{ch.name}</p>
                    <p className="text-xs text-white/50 line-clamp-1">{ch.description || '—'}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-white/15 text-white/60">{(ch.participating_clan_ids || []).length} clans</Badge>
                </div>
              </button>
            ))}
            {channels.length === 0 && <p className="text-xs text-white/40">No channels yet. Create the first one.</p>}
          </div>
        </ScrollArea>
      </div>

      {/* Topics */}
      <div className="col-span-4 border-r border-white/10 bg-black/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white/50">Topics</h4>
          <Button size="sm" variant="outline" className="gap-2" disabled={!selectedChannel} onClick={() => setNewTopicOpen((v) => !v)}>
            <MessageSquarePlus className="w-4 h-4" /> New
          </Button>
        </div>
        {newTopicOpen && selectedChannel && (
          <div className="mb-3 p-3 rounded-xl border border-white/10 bg-white/5 space-y-2">
            <Input placeholder="Topic title" value={topicTitle} onChange={(e) => setTopicTitle(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setNewTopicOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={createTopic}>Create</Button>
            </div>
          </div>
        )}
        <ScrollArea className="h-[calc(100%-52px)] pr-2">
          <div className="space-y-2">
            {topics.map((t) => (
              <button key={t.id} onClick={() => setSelectedTopic(t)} className={`w-full text-left p-3 rounded-lg border transition-all ${selectedTopic?.id === t.id ? 'bg-white/10 border-white/20' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white truncate">{t.title}</p>
                  <Badge variant="outline" className="text-[10px] border-white/15 text-white/60">{t.status || 'open'}</Badge>
                </div>
                <p className="text-[10px] text-white/40 mt-1">Last updated {new Date(t.updated_date || t.created_date).toLocaleString()}</p>
              </button>
            ))}
            {selectedChannel && topics.length === 0 && <p className="text-xs text-white/40">No topics in this channel yet.</p>}
            {!selectedChannel && <p className="text-xs text-white/40">Select a channel to view topics.</p>}
          </div>
        </ScrollArea>
      </div>

      {/* Messages */}
      <div className="col-span-5 flex flex-col">
        <div className="h-12 flex items-center justify-between px-4 border-b border-white/10 bg-black/20">
          <p className="text-sm font-semibold text-white/80 truncate">{selectedTopic ? selectedTopic.title : 'Select a topic'}</p>
        </div>
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-4">
            <div className="space-y-3">
              {messages.map((m) => (
                <div key={m.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xs text-white/50 mb-1 flex items-center gap-2">
                    <strong className="text-white/80">{m.username || m.user_id}</strong>
                    <span className="text-white/30">·</span>
                    <span>{new Date(m.created_date).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-white/90 whitespace-pre-wrap">{m.content}</p>
                </div>
              ))}
              {selectedTopic && messages.length === 0 && <p className="text-xs text-white/40">No messages yet. Be the first to say hi!</p>}
              {!selectedTopic && <p className="text-xs text-white/40">Choose a topic on the left to view conversation.</p>}
            </div>
          </ScrollArea>
        </div>
        {/* Composer */}
        <div className="h-16 border-t border-white/10 bg-black/30 px-4 flex items-center gap-2">
          <Input
            placeholder={selectedTopic ? 'Write a message…' : 'Select a topic to start messaging'}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={!selectedTopic}
          />
          <Button onClick={sendMessage} disabled={!selectedTopic || !message.trim()} className="gap-2">
            <Send className="w-4 h-4" /> Send
          </Button>
        </div>
      </div>
    </div>
  );
}