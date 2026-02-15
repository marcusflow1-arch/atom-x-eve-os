import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Send, FolderPlus, MessageSquarePlus, ChevronDown } from 'lucide-react';
import StrategyUpload from '@/components/clan/strategy/StrategyUpload';
import StrategyCard from '@/components/clan/strategy/StrategyCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function ClanFormsZone({ game, clan, user }) {
  const qc = useQueryClient();
  const [selectedChannel, setSelectedChannel] = React.useState(null);
  const [selectedTopic, setSelectedTopic] = React.useState(null);
  const [generalChannel, setGeneralChannel] = React.useState(null);
  const [leaderChannel, setLeaderChannel] = React.useState(null);
  const [selectedTopicTitleGeneral, setSelectedTopicTitleGeneral] = React.useState('');
  const [selectedTopicTitleLeader, setSelectedTopicTitleLeader] = React.useState('');
  const [messageGeneral, setMessageGeneral] = React.useState('');
  const [messageLeader, setMessageLeader] = React.useState('');

  // New channel state
  const [newChannelOpen, setNewChannelOpen] = React.useState(false);
  const [channelName, setChannelName] = React.useState('');
  const [channelDesc, setChannelDesc] = React.useState('');
  const [channelPassword, setChannelPassword] = React.useState('');
  const [channelScope, setChannelScope] = React.useState('all_clans');
  const [channelType, setChannelType] = React.useState('chat');

  // New topic state
          const [newTopicOpen, setNewTopicOpen] = React.useState(false);
          const [topicScope, setTopicScope] = React.useState('clan');
          const [topicTitle, setTopicTitle] = React.useState('');

  // Message composer
  const [message, setMessage] = React.useState('');

  // Strategies panel mode: 'list' or 'create'
          const [strategiesMode, setStrategiesMode] = React.useState('list');
          const isLeaderUser = (clan?.leaderId === user?.id) || (user?.role === 'admin');

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
      const defaultGeneralTitle =
        (genRes?.data?.topics || []).find(t => (t.title || '').toLowerCase() === 'general')?.title || '';
      const defaultLeaderTitle =
        (leadRes?.data?.topics || []).find(t => (t.title || '').toLowerCase() === 'general')?.title || '';
      if (defaultGeneralTitle) setSelectedTopicTitleGeneral(defaultGeneralTitle);
      if (defaultLeaderTitle) setSelectedTopicTitleLeader(defaultLeaderTitle);
    })();
    return () => { mounted = false; };
  }, [game.id, clan.id]);

   // Topics for default channels
  const { data: topicsGeneral = [] } = useQuery({
    queryKey: ['clanFormTopics', generalChannel?.id],
    queryFn: async () => {
      if (!generalChannel?.id) return [];
      const res = await base44.entities.ClanFormTopic.filter({ channel_id: generalChannel.id, game_id: game.id }, '-updated_date', 100);
      return res || [];
    },
    enabled: !!generalChannel?.id,
  });

  const { data: topicsLeader = [] } = useQuery({
    queryKey: ['clanFormTopics', leaderChannel?.id],
    queryFn: async () => {
      if (!leaderChannel?.id) return [];
      const res = await base44.entities.ClanFormTopic.filter({ channel_id: leaderChannel.id, game_id: game.id }, '-updated_date', 100);
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

  const topicTitlesGeneral = React.useMemo(() => ['All', ...(topicsGeneral || []).map(t => t.title)], [topicsGeneral]);
  const topicTitlesLeader = React.useMemo(() => ['All', ...(topicsLeader || []).map(t => t.title)], [topicsLeader]);

  const selectedTopicGeneral = React.useMemo(() => {
    if (selectedTopicTitleGeneral === 'All') return null;
    return (topicsGeneral || []).find(t => (t.title || '').toLowerCase() === (selectedTopicTitleGeneral || '').toLowerCase()) || null;
  }, [topicsGeneral, selectedTopicTitleGeneral]);

  const selectedTopicLeader = React.useMemo(() => {
    if (selectedTopicTitleLeader === 'All') return null;
    return (topicsLeader || []).find(t => (t.title || '').toLowerCase() === (selectedTopicTitleLeader || '').toLowerCase()) || null;
  }, [topicsLeader, selectedTopicTitleLeader]);

  React.useEffect(() => {
    if (!selectedTopicTitleGeneral && topicTitlesGeneral.length) {
      setSelectedTopicTitleGeneral(topicTitlesGeneral[0]); // Default to All or first topic
    }
  }, [topicTitlesGeneral, selectedTopicTitleGeneral]);

  React.useEffect(() => {
    if (!selectedTopicTitleLeader && topicTitlesLeader.length) {
      setSelectedTopicTitleLeader(topicTitlesLeader[0]); // Default to All or first topic
    }
  }, [topicTitlesLeader, selectedTopicTitleLeader]);

  // Messages for Clan Chat - ONLY from generalChannel, never from leaderChannel
  const { data: messagesGeneral = [] } = useQuery({
    queryKey: ['clanFormMessages', 'general', generalChannel?.id, selectedTopicTitleGeneral],
    queryFn: async () => {
      if (!generalChannel?.id) return [];
      if (selectedTopicTitleGeneral === 'All') {
        const res = await base44.entities.ClanFormMessage.filter({ channel_id: generalChannel.id, game_id: game.id }, 'created_date', 200);
        return res || [];
      }
      if (!selectedTopicGeneral?.id) return [];
      // Filter by both topic AND channel to ensure no leader messages leak
      const res = await base44.entities.ClanFormMessage.filter({ topic_id: selectedTopicGeneral.id, channel_id: generalChannel.id, game_id: game.id }, 'created_date', 200);
      return res || [];
    },
    enabled: !!generalChannel?.id && (selectedTopicTitleGeneral === 'All' || !!selectedTopicGeneral?.id),
    initialData: [],
  });

  // Messages for Leader Chat - ONLY from leaderChannel, completely separate
  const { data: messagesLeader = [] } = useQuery({
    queryKey: ['clanFormMessages', 'leader', leaderChannel?.id, selectedTopicTitleLeader],
    queryFn: async () => {
      if (!leaderChannel?.id) return [];
      if (selectedTopicTitleLeader === 'All') {
        const res = await base44.entities.ClanFormMessage.filter({ channel_id: leaderChannel.id, game_id: game.id }, 'created_date', 200);
        return res || [];
      }
      if (!selectedTopicLeader?.id) return [];
      // Filter by both topic AND channel to ensure no clan messages leak
      const res = await base44.entities.ClanFormMessage.filter({ topic_id: selectedTopicLeader.id, channel_id: leaderChannel.id, game_id: game.id }, 'created_date', 200);
      return res || [];
    },
    enabled: !!leaderChannel?.id && (selectedTopicTitleLeader === 'All' || !!selectedTopicLeader?.id),
    initialData: [],
  });

  // Realtime updates - ensure channel-scoped invalidation for strict separation
  React.useEffect(() => {
    const unsubs = [];
    unsubs.push(base44.entities.ClanFormChannel.subscribe((e) => {
      if (e.data?.game_id === game.id) qc.invalidateQueries({ queryKey: ['clanFormChannels', game.id] });
    }));
    unsubs.push(base44.entities.ClanFormTopic.subscribe((e) => {
      if (e.data?.channel_id === generalChannel?.id) qc.invalidateQueries({ queryKey: ['clanFormTopics', generalChannel.id] });
      if (e.data?.channel_id === leaderChannel?.id) qc.invalidateQueries({ queryKey: ['clanFormTopics', leaderChannel.id] });
    }));
    unsubs.push(base44.entities.ClanFormMessage.subscribe((e) => {
      // Only invalidate the specific channel where the message belongs
      if (e.data?.channel_id === generalChannel?.id) {
        qc.invalidateQueries({ queryKey: ['clanFormMessages', 'general', generalChannel.id] });
      }
      if (e.data?.channel_id === leaderChannel?.id) {
        qc.invalidateQueries({ queryKey: ['clanFormMessages', 'leader', leaderChannel.id] });
      }
    }));
    return () => unsubs.forEach((u) => { try { u(); } catch {} });
  }, [game.id, generalChannel?.id, leaderChannel?.id, qc]);

  const createChannel = async () => {
    if (!channelName.trim()) return;
    const { data, status } = await base44.functions.invoke('joinClanFormChannel', {
      game_id: game.id,
      clan_id: clan.id,
      desired_name: channelName.trim(),
      desired_capacity: 100,
      create_new_channel: true,
      access_scope: channelScope,
      join_password: channelPassword,
      channel_type: channelType
    });
    if (status && status >= 400) return;
    const ch = data?.channel;
    if (ch) {
      joinedChannelRef.current = ch;
      setSelectedChannel(ch);
      const general = (data?.topics || []).find(t => (t.title || '').toLowerCase() === 'general');
      setSelectedTopic(general || null);
    }
    setChannelName('');
    setChannelDesc('');
    setChannelPassword('');
    setChannelScope('all_clans');
    setChannelType('chat');
    setNewChannelOpen(false);
    qc.invalidateQueries({ queryKey: ['clanFormChannels', game.id] });
  };

  const createTopic = async () => {
            if (!topicTitle.trim()) return;
            const title = topicTitle.trim();
            const creations = [];
            if (topicScope === 'leaders') {
              if (isLeaderUser && leaderChannel?.id) {
                creations.push(base44.entities.ClanFormTopic.create({
                  channel_id: leaderChannel.id,
                  game_id: game.id,
                  title,
                  created_by_user_id: user?.id,
                  status: 'open',
                  visibility_scope: 'leaders'
                }));
              } else {
                // Fallback for non-leaders
                if (generalChannel?.id) {
                  creations.push(base44.entities.ClanFormTopic.create({
                    channel_id: generalChannel.id,
                    game_id: game.id,
                    title,
                    created_by_user_id: user?.id,
                    status: 'open',
                    visibility_scope: 'clan'
                  }));
                }
              }
            } else if (topicScope === 'both') {
              if (isLeaderUser) {
                if (generalChannel?.id) creations.push(base44.entities.ClanFormTopic.create({
                  channel_id: generalChannel.id,
                  game_id: game.id,
                  title,
                  created_by_user_id: user?.id,
                  status: 'open',
                  visibility_scope: 'both'
                }));
                if (leaderChannel?.id) creations.push(base44.entities.ClanFormTopic.create({
                  channel_id: leaderChannel.id,
                  game_id: game.id,
                  title,
                  created_by_user_id: user?.id,
                  status: 'open',
                  visibility_scope: 'both'
                }));
              } else {
                if (generalChannel?.id) creations.push(base44.entities.ClanFormTopic.create({
                  channel_id: generalChannel.id,
                  game_id: game.id,
                  title,
                  created_by_user_id: user?.id,
                  status: 'open',
                  visibility_scope: 'clan'
                }));
              }
            } else {
              if (generalChannel?.id) creations.push(base44.entities.ClanFormTopic.create({
                channel_id: generalChannel.id,
                game_id: game.id,
                title,
                created_by_user_id: user?.id,
                status: 'open',
                visibility_scope: 'clan'
              }));
            }

            await Promise.all(creations);
            setTopicTitle('');
            setTopicScope('clan');
            setNewTopicOpen(false);
            if (topicScope === 'leaders') {
              setSelectedTopicTitleLeader(title);
            } else if (topicScope === 'both') {
              if (isLeaderUser) {
                setSelectedTopicTitleGeneral(title);
                setSelectedTopicTitleLeader(title);
              } else {
                setSelectedTopicTitleGeneral(title);
              }
            } else {
              setSelectedTopicTitleGeneral(title);
            }
            if (generalChannel?.id) qc.invalidateQueries({ queryKey: ['clanFormTopics', generalChannel.id] });
            if (leaderChannel?.id) qc.invalidateQueries({ queryKey: ['clanFormTopics', leaderChannel.id] });
          };

  const sendMessageTo = async (topicId, channelId, content) => {
    if ((!topicId && !channelId) || !content?.trim()) return;
    if (!topicId) return;
    
    await base44.entities.ClanFormMessage.create({
      topic_id: topicId,
      channel_id: channelId, 
      game_id: game.id,
      user_id: user?.id,
      clan_id: clan?.id,
      username: user?.full_name || user?.email?.split('@')[0] || 'User',
      content: content.trim(),
    });
    // Only invalidate the specific channel's messages, not both
    qc.invalidateQueries({ queryKey: ['clanFormMessages', channelId, selectedTopicTitleGeneral === 'All' ? 'All' : undefined] });
    qc.invalidateQueries({ queryKey: ['clanFormMessages', channelId] });
  };

  return (
    <div className="h-full w-full grid grid-cols-12 grid-rows-[1fr_auto] min-h-0" role="region" aria-label="Clan Forms">
      {/* Left Chat - Clan Form */}
      <div className="col-span-4 col-start-1 row-start-1 h-full border-r border-white/10 bg-black/20 backdrop-blur-sm flex flex-col min-h-0" aria-label="Clan Form chat">
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
            {/* Topic select (Clan Chat only topics) */}
            <Select value={selectedTopicTitleGeneral || ''} onValueChange={(val) => setSelectedTopicTitleGeneral(val)}>
              <SelectTrigger className="h-7 w-auto bg-transparent border-0 px-1 text-white/80 hover:text-white min-w-0" title="Select topic">
                <SelectValue placeholder="General" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900/95 text-white border-white/10 max-h-72">
                {topicTitlesGeneral.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
                {topicTitlesGeneral.length === 0 && (
                  <div className="px-3 py-2 text-xs text-white/40">No topics yet</div>
                )}
              </SelectContent>
            </Select>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="gap-2">
                <FolderPlus className="w-4 h-4" /> New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-900/95 text-white border-white/10">
              <DropdownMenuItem onClick={() => setNewChannelOpen((v) => !v)}>
                <FolderPlus className="w-4 h-4 mr-2" /> New Channel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setNewTopicOpen((v) => !v)}>
                <MessageSquarePlus className="w-4 h-4 mr-2" /> New Topic
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {newChannelOpen && (
          <div className="mb-3 p-3 rounded-xl border border-white/10 bg-white/5 space-y-3">
            <Input placeholder="Channel name" value={channelName} onChange={(e) => setChannelName(e.target.value)} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input type="password" placeholder="Password (optional)" value={channelPassword} onChange={(e) => setChannelPassword(e.target.value)} />
              <Select value={channelScope} onValueChange={(v) => setChannelScope(v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Access" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900/95 text-white border-white/10">
                  <SelectItem value="all_clans">All clans can join</SelectItem>
                  <SelectItem value="clan_only">Only my clan</SelectItem>
                </SelectContent>
              </Select>
              <Select value={channelType} onValueChange={(v) => setChannelType(v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900/95 text-white border-white/10">
                  <SelectItem value="chat">Chat channel</SelectItem>
                  <SelectItem value="party">Party channel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setNewChannelOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={createChannel} disabled={!channelName.trim()}>Create</Button>
            </div>
          </div>
        )}
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
          <Button onClick={async () => { 
            await sendMessageTo(selectedTopicGeneral?.id, generalChannel?.id, messageGeneral); 
            setMessageGeneral(''); 
            qc.invalidateQueries({ queryKey: ['clanFormMessages', 'general', generalChannel?.id] });
          }} disabled={!selectedTopicGeneral || !messageGeneral.trim()} className="gap-2">
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
                        <div className="mb-3 p-3 rounded-xl border border-white/10 bg-white/5 space-y-3">
                          <Input placeholder="Topic title" value={topicTitle} onChange={(e) => setTopicTitle(e.target.value)} />
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Select value={topicScope} onValueChange={(v) => setTopicScope(v)} disabled={!isLeaderUser}>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Visibility" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900/95 text-white border-white/10">
                                <SelectItem value="clan">Clan Chat</SelectItem>
                                <SelectItem value="leaders">Leader/Officers</SelectItem>
                                <SelectItem value="both">Both Chats</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" onClick={() => setNewTopicOpen(false)}>Cancel</Button>
                            <Button size="sm" onClick={createTopic}>Create</Button>
                          </div>
                        </div>
                      )}
        <ScrollArea className="h-[calc(100%-52px)] pr-2">
          <div className="space-y-2">
            {topicTitles.map((title) => (
              <button key={title} onClick={() => setSelectedTopicTitleGeneral(title)} className={`w-full text-left p-3 rounded-lg border transition-all ${selectedTopicTitleGeneral === title ? 'bg-white/10 border-white/20' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white truncate">{title}</p>
                </div>
                <p className="text-[10px] text-white/40 mt-1">Shown where available</p>
              </button>
            ))}
            {topicTitles.length === 0 && <p className="text-xs text-white/40">No topics yet. Create the first one.</p>}
          </div>
        </ScrollArea>
      </div>

      {/* Strategies Board */}
      <div className="col-span-4 col-start-9 row-start-1 h-full flex flex-col min-h-0 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm overflow-hidden" aria-label="Strategies board">
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
        <div className="flex-1 p-4 space-y-4 overflow-auto">
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
      <div className="col-span-4 col-start-5 row-start-1 h-full flex flex-col min-h-0 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm overflow-hidden" aria-label="Clan Leader chat window">
        <div className="h-12 flex items-center justify-between px-4 border-b border-white/10 bg-black/20">
          <div>
            <p className="text-sm font-semibold text-white">Clan Leader Chat</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedTopicTitleLeader || ''} onValueChange={(val) => setSelectedTopicTitleLeader(val)}>
              <SelectTrigger className="h-7 w-auto bg-transparent border-0 px-1 text-white/80 hover:text-white min-w-0" title="Select topic">
                <SelectValue placeholder="General" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900/95 text-white border-white/10 max-h-72">
                {topicTitlesLeader.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
                {topicTitlesLeader.length === 0 && (
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
          <Button onClick={async () => { await sendMessageTo(selectedTopicLeader?.id, leaderChannel?.id, messageLeader); setMessageLeader(''); }} disabled={!selectedTopicLeader || !(clan?.leaderId === user?.id || user?.role === 'admin') || !messageLeader.trim()} className="gap-2">
            <Send className="w-4 h-4" /> Send
          </Button>
        </div>
      </div>

      {/* Bottom Topics (shared) */}
      <div className="col-span-12 row-start-2 border-t border-white/10 bg-black/10 p-4" aria-label="Topics">
        {newTopicOpen && generalChannel && (
                        <div className="mb-3 p-3 rounded-xl border border-white/10 bg-white/5 space-y-3">
                          <Input placeholder="Topic title" value={topicTitle} onChange={(e) => setTopicTitle(e.target.value)} />
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Select value={topicScope} onValueChange={(v) => setTopicScope(v)} disabled={!isLeaderUser}>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Visibility" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900/95 text-white border-white/10">
                                <SelectItem value="clan">Clan Chat</SelectItem>
                                <SelectItem value="leaders">Leader/Officers</SelectItem>
                                <SelectItem value="both">Both Chats</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
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
              <button key={title} onClick={() => setSelectedTopicTitleGeneral(title)} className={`w-full text-left p-3 rounded-lg border transition-all ${selectedTopicTitleGeneral === title ? 'bg-white/10 border-white/20' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white truncate">{title}</p>
                </div>
                <p className="text-[10px] text-white/40 mt-1">Shown where available</p>
              </button>
            ))}
            {topicTitles.length === 0 && <p className="text-xs text-white/40">No topics yet. Create the first one.</p>}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}