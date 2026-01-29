import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Send, FolderPlus, MessageSquarePlus } from 'lucide-react';
import StrategyUpload from '@/components/clan/strategy/StrategyUpload';
import StrategyCard from '@/components/clan/strategy/StrategyCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ClanFormsZone({ game, clan, user }) {
  const qc = useQueryClient();
  const [selectedChannel, setSelectedChannel] = React.useState(null);
  const [selectedTopic, setSelectedTopic] = React.useState(null);
  const [generalChannel, setGeneralChannel] = React.useState(null);
  const [leaderChannel, setLeaderChannel] = React.useState(null);
  const [selectedTopicTitle, setSelectedTopicTitle] = React.useState('');
  const [messageGeneral, setMessageGeneral] = React.useState('');
  const [messageLeader, setMessageLeader] = React.useState('');

  // New channel state
  const [newChannelOpen, setNewChannelOpen] = React.useState(false);
  const [channelName, setChannelName] = React.useState('');
  const [channelDesc, setChannelDesc] = React.useState('');

  // New topic state
  const [newTopicOpen, setNewTopicOpen] = React.useState(false);
  const [topicTitle, setTopicTitle] = React.useState('');

  // Message composer
  const [message, setMessage] = React.useState('');

  // Strategies panel mode: 'list' or 'create'
  const [strategiesMode, setStrategiesMode] = React.useState('list');

  // Channels for this game (cross-clan)
  const { data: channels = [] } = useQuery({
    queryKey: ['clanFormChannels', game.id, clan.id],
    queryFn: async () => {
      const res = await base44.entities.ClanFormChannel.filter({ game_id: game.id, clan_id: clan.id });
      return res || [];
    }
  });

  // Track joined channel to allow graceful leave on unmount
  const joinedChannelRef = React.useRef(null);
  React.useEffect(() => {
    return () => {
      const ch = joinedChannelRef.current;
      if (ch?.id) {
        base44.functions.invoke('leaveClanFormChannel', { channel_id: ch.id }).catch(() => {});
      }
    };
  }, []);

  // Ensure default channels exist and join them
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const [genRes, leadRes] = await Promise.all([
        base44.functions.invoke('joinClanFormChannel', { game_id: game.id, clan_id: clan.id, desired_name: 'clan-form', desired_capacity: 100 }),
        base44.functions.invoke('joinClanFormChannel', { game_id: game.id, clan_id: clan.id, desired_name: 'clan-leader', desired_capacity: 100 })
      ]);
      if (!mounted) return;
      const gen = genRes?.data?.channel;
      const leader = leadRes?.data?.channel;
      if (gen) setGeneralChannel(gen);
      if (leader) setLeaderChannel(leader);
      const defaultTitle =
        (genRes?.data?.topics || []).find(t => (t.title || '').toLowerCase() === 'general')?.title ||
        (leadRes?.data?.topics || []).find(t => (t.title || '').toLowerCase() === 'general')?.title || '';
      setSelectedTopicTitle(defaultTitle);
    })();
    return () => { mounted = false; };
  }, [game.id, clan.id]);

   // Topics for default channels
  const { data: topicsGeneral = [] } = useQuery({
    queryKey: ['clanFormTopics', generalChannel?.id],
    queryFn: async () => {
      if (!generalChannel?.id) return [];
      const res = await base44.entities.ClanFormTopic.filter({ channel_id: generalChannel.id }, '-updated_date', 100);
      return res || [];
    },
    enabled: !!generalChannel?.id,
  });

  const { data: topicsLeader = [] } = useQuery({
    queryKey: ['clanFormTopics', leaderChannel?.id],
    queryFn: async () => {
      if (!leaderChannel?.id) return [];
      const res = await base44.entities.ClanFormTopic.filter({ channel_id: leaderChannel.id }, '-updated_date', 100);
      return res || [];
    },
    enabled: !!leaderChannel?.id,
  });

  // Strategies for this clan/game
  const { data: strategies = [], refetch: refetchStrategies } = useQuery({
    queryKey: ['strategies', game.id, clan.id],
    queryFn: async () => {
      const res = await base44.entities.Strategy.filter({ game_id: game.id, clan_id: clan.id }, '-created_date', 100);
      return res?.data || res || [];
    }
  });

  // Build combined topics and selected topics per channel
  const topicTitles = React.useMemo(() => {
    const set = new Set();
    (topicsGeneral || []).forEach(t => t?.title && set.add(t.title));
    (topicsLeader || []).forEach(t => t?.title && set.add(t.title));
    return Array.from(set);
  }, [topicsGeneral, topicsLeader]);

  const selectedTopicGeneral = React.useMemo(() => {
    return (topicsGeneral || []).find(t => (t.title || '').toLowerCase() === (selectedTopicTitle || '').toLowerCase()) || null;
  }, [topicsGeneral, selectedTopicTitle]);

  const selectedTopicLeader = React.useMemo(() => {
    return (topicsLeader || []).find(t => (t.title || '').toLowerCase() === (selectedTopicTitle || '').toLowerCase()) || null;
  }, [topicsLeader, selectedTopicTitle]);

  React.useEffect(() => {
    if (!selectedTopicTitle && topicTitles.length) {
      setSelectedTopicTitle(topicTitles[0]);
    }
  }, [topicTitles, selectedTopicTitle]);

  // Messages for both chats
  const { data: messagesGeneral = [] } = useQuery({
    queryKey: ['clanFormMessages', selectedTopicGeneral?.id],
    queryFn: async () => {
      if (!selectedTopicGeneral?.id) return [];
      const res = await base44.entities.ClanFormMessage.filter({ topic_id: selectedTopicGeneral.id }, 'created_date', 200);
      return res || [];
    },
    enabled: !!selectedTopicGeneral?.id,
    initialData: [],
  });

  const { data: messagesLeader = [] } = useQuery({
    queryKey: ['clanFormMessages', selectedTopicLeader?.id],
    queryFn: async () => {
      if (!selectedTopicLeader?.id) return [];
      const res = await base44.entities.ClanFormMessage.filter({ topic_id: selectedTopicLeader.id }, 'created_date', 200);
      return res || [];
    },
    enabled: !!selectedTopicLeader?.id,
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
    const { data } = await base44.functions.invoke('joinClanFormChannel', {
      game_id: game.id,
      clan_id: clan.id,
      desired_name: channelName.trim(),
      desired_capacity: 100
    });
    const ch = data?.channel;
    if (ch) {
      joinedChannelRef.current = ch;
      setSelectedChannel(ch);
      const general = (data?.topics || []).find(t => (t.title || '').toLowerCase() === 'general');
      setSelectedTopic(general || null);
    }
    setChannelName('');
    setChannelDesc('');
    setNewChannelOpen(false);
    qc.invalidateQueries({ queryKey: ['clanFormChannels', game.id] });
  };

  const createTopic = async () => {
    if (!generalChannel?.id || !topicTitle.trim()) return;
    const topic = await base44.entities.ClanFormTopic.create({
      channel_id: generalChannel.id,
      title: topicTitle.trim(),
      created_by_user_id: user?.id,
      status: 'open'
    });
    setTopicTitle('');
    setNewTopicOpen(false);
    setSelectedTopicTitle(topic.title);
    qc.invalidateQueries({ queryKey: ['clanFormTopics', generalChannel.id] });
  };

  const sendMessageTo = async (topicId, content) => {
    if (!topicId || !content?.trim()) return;
    await base44.entities.ClanFormMessage.create({
      topic_id: topicId,
      user_id: user?.id,
      clan_id: clan?.id,
      username: user?.full_name || user?.email?.split('@')[0] || 'User',
      content: content.trim(),
    });
    qc.invalidateQueries({ queryKey: ['clanFormMessages', topicId] });
  };

  return (
    <div className="h-full w-full grid grid-cols-12 min-h-0" role="region" aria-label="Clan Forms">
      {/* Left Chat - Clan Form */}
      <div className="col-span-4 col-start-1 border-r border-white/10 bg-black/20 backdrop-blur-sm flex flex-col min-h-0" aria-label="Clan Form chat">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-white mr-2">Clan Chat</p>
            <Select onValueChange={async (val) => {
              const desired_name = `channel-${val}`;
              const { data } = await base44.functions.invoke('joinClanFormChannel', {
                game_id: game.id,
                clan_id: clan.id,
                desired_name,
                desired_capacity: 100
              });
              const ch = data?.channel;
              if (ch) {
                joinedChannelRef.current = ch;
                setSelectedChannel(ch);
                const general = (data?.topics || []).find(t => (t.title || '').toLowerCase() === 'general');
                setSelectedTopic(general || null);
                qc.invalidateQueries({ queryKey: ['clanFormChannels', game.id, clan.id] });
              }
            }}>
              <SelectTrigger className="h-8 w-36 bg-white/5 border-white/10 text-white" title="Quick switch channel">
                <SelectValue placeholder="Channel 1-10" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900/95 text-white border-white/10">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={String(n)}>{`Channel ${n}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/50">Channels</h4>
            {/* Topic select (affects both chats) */}
            <Select value={selectedTopicTitle || ''} onValueChange={(val) => setSelectedTopicTitle(val)}>
              <SelectTrigger className="h-8 w-48 bg-white/5 border-white/10 text-white" title="Select topic">
                <SelectValue placeholder="General" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900/95 text-white border-white/10 max-h-72">
                {topicTitles.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
                {topicTitles.length === 0 && (
                  <div className="px-3 py-2 text-xs text-white/40">No topics yet</div>
                )}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setNewChannelOpen((v) => !v)}>
            <FolderPlus className="w-4 h-4" /> New
          </Button>
        </div>
        {/* Messages list */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-4">
            <div className="space-y-3">
              {selectedTopicGeneral && messagesGeneral.map((m) => (
                <div key={m.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xs text-white/50 mb-1 flex items-center gap-2">
                    <strong className="text-white/80">{m.username || m.user_id}</strong>
                    <span className="text-white/30">·</span>
                    <span>{new Date(m.created_date).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-white/90 whitespace-pre-wrap">{m.content}</p>
                </div>
              ))}
              {selectedTopicGeneral && messagesGeneral.length === 0 && <p className="text-xs text-white/40">No messages yet.</p>}
              {!selectedTopicGeneral && <p className="text-xs text-white/40">Select a topic to start chatting.</p>}
            </div>
          </ScrollArea>
        </div>
        {/* Composer */}
        <div className="h-16 border-t border-white/10 bg-black/30 px-4 flex items-center gap-2">
          <Input
            placeholder={selectedTopicGeneral ? 'Write a message…' : 'Select a topic to start messaging'}
            value={messageGeneral}
            onChange={(e) => setMessageGeneral(e.target.value)}
            disabled={!selectedTopicGeneral}
          />
          <Button onClick={async () => { await sendMessageTo(selectedTopicGeneral?.id, messageGeneral); setMessageGeneral(''); }} disabled={!selectedTopicGeneral || !messageGeneral.trim()} className="gap-2">
            <Send className="w-4 h-4" /> Send
          </Button>
        </div>
      </div>

      {/* Topics (Center) */}
      <div className="hidden" aria-label="Topics list">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white/50">Topics</h4>
          <Button size="sm" variant="outline" className="gap-2" disabled={!generalChannel} onClick={() => setNewTopicOpen((v) => !v)}>
            <MessageSquarePlus className="w-4 h-4" /> New
          </Button>
        </div>
        {newTopicOpen && generalChannel && (
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
            {topicTitles.map((title) => (
              <button key={title} onClick={() => setSelectedTopicTitle(title)} className={`w-full text-left p-3 rounded-lg border transition-all ${selectedTopicTitle === title ? 'bg-white/10 border-white/20' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white truncate">{title}</p>
                </div>
                <p className="text-[10px] text-white/40 mt-1">Select to discuss this topic in both chats</p>
              </button>
            ))}
            {topicTitles.length === 0 && <p className="text-xs text-white/40">No topics yet. Create the first one.</p>}
          </div>
        </ScrollArea>
      </div>

      {/* Strategies Board */}
      <div className="col-span-5 col-start-8 flex flex-col min-h-0" aria-label="Strategies board">
        <div className="h-12 flex items-center justify-between px-4 border-b border-white/10 bg-black/20">
          <div>
            <p className="text-sm font-semibold text-white">Strategies</p>
            <p className="text-[11px] text-white/50">{strategiesMode === "list" ? "Browse all strategies" : "Create a new strategy"}</p>
          </div>
          <div className="flex items-center gap-2">
            {strategiesMode === "list" ? (
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setStrategiesMode("create")} title="New Strategy">
                <Plus className="w-4 h-4" /> New
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setStrategiesMode("list")} title="Back to list">
                <Minus className="w-4 h-4" /> Back
              </Button>
            )}
          </div>
        </div>
        <div className="p-4 space-y-4 overflow-auto">
          {strategiesMode === "create" ? (
            <div className="space-y-4">
              <StrategyUpload 
                clanId={clan.id} 
                gameId={game.id} 
                canSetVisibility={clan?.leaderId === user?.id || user?.role === 'admin'}
                onCreated={() => { setStrategiesMode("list"); refetchStrategies(); }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {strategies.map((s) => (
                <StrategyCard key={s.id} s={s} />
              ))}
              {strategies.length === 0 && <div className="text-white/40 text-sm text-center py-6 border border-white/10 rounded-xl">No strategies yet. Click New to add one.</div>}
            </div>
          )}
        </div>
      </div>

      {/* Right Chat - Clan Leader Chat */}
      <div className="col-span-3 col-start-5 flex flex-col min-h-0" aria-label="Clan Leader chat window">
        <div className="h-12 flex items-center justify-between px-4 border-b border-white/10 bg-black/20">
          <div>
            <p className="text-sm font-semibold text-white">Clan Leader Chat</p>
            <p className="text-[11px] text-white/50">Topic: {selectedTopicTitle || 'Select a topic'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedTopicTitle || ''} onValueChange={(val) => setSelectedTopicTitle(val)}>
              <SelectTrigger className="h-8 w-48 bg-white/5 border-white/10 text-white" title="Select topic">
                <SelectValue placeholder="General" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900/95 text-white border-white/10 max-h-72">
                {topicTitles.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
                {topicTitles.length === 0 && (
                  <div className="px-3 py-2 text-xs text-white/40">No topics yet</div>
                )}
              </SelectContent>
            </Select>
            {(clan?.leaderId === user?.id || user?.role === 'admin') && (
              <Button size="sm" variant="outline" onClick={() => setNewTopicOpen((v) => !v)}>New Topic</Button>
            )}
            <Badge variant="outline" className="text-[10px] border-white/15 text-white/60">Leaders Only</Badge>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-4">
            <div className="space-y-3">
              {selectedTopicLeader && messagesLeader.map((m) => (
                <div key={m.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xs text-white/50 mb-1 flex items-center gap-2">
                    <strong className="text-white/80">{m.username || m.user_id}</strong>
                    <span className="text-white/30">·</span>
                    <span>{new Date(m.created_date).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-white/90 whitespace-pre-wrap">{m.content}</p>
                </div>
              ))}
              {selectedTopicLeader && messagesLeader.length === 0 && <p className="text-xs text-white/40">No messages yet.</p>}
              {!selectedTopicLeader && <p className="text-xs text-white/40">Select a topic to start chatting.</p>}
            </div>
          </ScrollArea>
        </div>
        <div className="h-16 border-t border-white/10 bg-black/30 px-4 flex items-center gap-2">
          <Input
            placeholder={selectedTopicLeader ? 'Write a message…' : 'Select a topic to start messaging'}
            value={messageLeader}
            onChange={(e) => setMessageLeader(e.target.value)}
            disabled={!selectedTopicLeader || !(clan?.leaderId === user?.id || user?.role === 'admin')}
          />
          <Button onClick={async () => { await sendMessageTo(selectedTopicLeader?.id, messageLeader); setMessageLeader(''); }} disabled={!selectedTopicLeader || !(clan?.leaderId === user?.id || user?.role === 'admin') || !messageLeader.trim()} className="gap-2">
            <Send className="w-4 h-4" /> Send
          </Button>
        </div>
      </div>

      {/* Bottom Topics (shared) */}
      <div className="col-span-12 border-t border-white/10 bg-black/10 p-4" aria-label="Topics">
        {newTopicOpen && generalChannel && (
          <div className="mb-3 p-3 rounded-xl border border-white/10 bg-white/5 space-y-2">
            <Input placeholder="Topic title" value={topicTitle} onChange={(e) => setTopicTitle(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setNewTopicOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={createTopic}>Create</Button>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white/50">Topics</h4>
        </div>
        <ScrollArea className="h-28 pr-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {topicTitles.map((title) => (
              <button key={title} onClick={() => setSelectedTopicTitle(title)} className={`w-full text-left p-3 rounded-lg border transition-all ${selectedTopicTitle === title ? 'bg-white/10 border-white/20' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white truncate">{title}</p>
                </div>
                <p className="text-[10px] text-white/40 mt-1">Tap to select for both chats</p>
              </button>
            ))}
            {topicTitles.length === 0 && <p className="text-xs text-white/40">No topics yet. Create the first one.</p>}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}