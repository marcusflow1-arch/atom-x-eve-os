import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Globe2, LockKeyhole, MessageSquare, Plus, Send, Shield, Users } from 'lucide-react';

const invoke = async (action, data) => {
  const result = await base44.functions.invoke('clanForumOperations', { action, data });
  const payload = result?.data || result;
  if (payload?.success === false) throw new Error(payload.error || 'Clan forum request failed');
  return payload;
};

const joinChannel = async ({ gameId, clanId, name, create = false, accessScope = 'clan_only' }) => {
  const result = await base44.functions.invoke('joinClanFormChannel', {
    game_id: gameId,
    clan_id: clanId,
    desired_name: name,
    desired_capacity: 100,
    create_new_channel: create,
    access_scope: accessScope,
    channel_type: 'chat',
  });
  return result?.data || result || {};
};

export default function ClanForumsZone({ game, clan, user }) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState('member');
  const [mode, setMode] = useState('clan');
  const [generalChannel, setGeneralChannel] = useState(null);
  const [leaderChannel, setLeaderChannel] = useState(null);
  const [sharedChannel, setSharedChannel] = useState(null);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [topicDraft, setTopicDraft] = useState('');
  const [messageDraft, setMessageDraft] = useState('');
  const [sharedName, setSharedName] = useState('');
  const [busy, setBusy] = useState(false);
  const joinedSharedRef = useRef(null);

  const privileged = role === 'leader' || role === 'officer';
  const activeChannel = mode === 'leaders' ? leaderChannel : mode === 'shared' ? sharedChannel : generalChannel;

  useEffect(() => {
    let cancelled = false;
    if (!clan?.id || !user?.id) return;
    base44.entities.ClanMember.filter({ clan_id: clan.id, user_id: user.id }).then((rows) => {
      if (!cancelled) setRole(rows?.[0]?.role || 'member');
    });
    return () => { cancelled = true; };
  }, [clan?.id, user?.id]);

  useEffect(() => {
    let cancelled = false;
    if (!game?.id || !clan?.id) return;
    (async () => {
      try {
        const general = await joinChannel({ gameId: game.id, clanId: clan.id, name: 'clan-forum' });
        if (!cancelled) setGeneralChannel(general?.channel || null);
        if (privileged) {
          const leaders = await joinChannel({ gameId: game.id, clanId: clan.id, name: 'clan-leaders' });
          if (!cancelled) setLeaderChannel(leaders?.channel || null);
        }
      } catch (error) {
        console.warn('Could not prepare clan forums', error);
      }
    })();
    return () => { cancelled = true; };
  }, [clan?.id, game?.id, privileged]);

  useEffect(() => () => {
    const channel = joinedSharedRef.current;
    if (channel?.id) base44.functions.invoke('leaveClanFormChannel', { channel_id: channel.id }).catch(() => {});
  }, []);

  useEffect(() => {
    if (mode === 'leaders' && !privileged) setMode('clan');
    setSelectedTopicId(null);
    setMessageDraft('');
  }, [mode, privileged, activeChannel?.id]);

  const { data: sharedChannels = [] } = useQuery({
    queryKey: ['sharedClanForumChannels', game?.id],
    queryFn: async () => {
      if (!game?.id) return [];
      const rows = await base44.entities.ClanFormChannel.filter({ game_id: game.id }, '-created_date', 150);
      return (rows || []).filter((channel) => channel.access_scope === 'all_clans');
    },
    enabled: !!game?.id,
    refetchInterval: 12000,
  });

  const { data: topics = [] } = useQuery({
    queryKey: ['clanForumTopics', activeChannel?.id, game?.id],
    queryFn: () => activeChannel?.id ? base44.entities.ClanFormTopic.filter({ channel_id: activeChannel.id, game_id: game.id }, '-updated_date', 150) : [],
    enabled: !!activeChannel?.id && !!game?.id,
    refetchInterval: 6000,
  });

  useEffect(() => {
    if (!topics.length) { setSelectedTopicId(null); return; }
    if (!topics.some((topic) => topic.id === selectedTopicId)) setSelectedTopicId(topics[0].id);
  }, [topics, selectedTopicId]);

  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId) || null;

  const { data: messages = [] } = useQuery({
    queryKey: ['clanForumMessages', activeChannel?.id, selectedTopicId],
    queryFn: () => activeChannel?.id && selectedTopicId ? base44.entities.ClanFormMessage.filter({ channel_id: activeChannel.id, topic_id: selectedTopicId, game_id: game.id }, 'created_date', 300) : [],
    enabled: !!activeChannel?.id && !!selectedTopicId,
    refetchInterval: 3500,
  });

  useEffect(() => {
    if (!activeChannel?.id) return undefined;
    const unsubscribe = base44.entities.ClanFormMessage.subscribe((event) => {
      if (event.data?.channel_id === activeChannel.id) queryClient.invalidateQueries({ queryKey: ['clanForumMessages', activeChannel.id] });
    });
    return () => { try { unsubscribe?.(); } catch (_) {} };
  }, [activeChannel?.id, queryClient]);

  const createTopic = async () => {
    if (!topicDraft.trim() || !activeChannel?.id) return;
    setBusy(true);
    try {
      const payload = await invoke('create_topic', {
        clanId: clan.id,
        gameId: game.id,
        channelId: activeChannel.id,
        title: topicDraft.trim(),
        visibilityScope: mode === 'leaders' ? 'leaders' : mode === 'shared' ? 'shared' : 'clan',
      });
      setTopicDraft('');
      setSelectedTopicId(payload.topic?.id || null);
      queryClient.invalidateQueries({ queryKey: ['clanForumTopics', activeChannel.id, game.id] });
    } finally { setBusy(false); }
  };

  const sendMessage = async () => {
    if (!messageDraft.trim() || !activeChannel?.id || !selectedTopicId) return;
    setBusy(true);
    try {
      await invoke('send_message', { clanId: clan.id, gameId: game.id, channelId: activeChannel.id, topicId: selectedTopicId, content: messageDraft.trim() });
      setMessageDraft('');
      queryClient.invalidateQueries({ queryKey: ['clanForumMessages', activeChannel.id, selectedTopicId] });
    } finally { setBusy(false); }
  };

  const openSharedChannel = async (channel) => {
    setBusy(true);
    try {
      const payload = await joinChannel({ gameId: game.id, clanId: clan.id, name: channel.name || channel.channel_name || 'shared-clan-forum' });
      const joined = payload.channel || channel;
      joinedSharedRef.current = joined;
      setSharedChannel(joined);
      setMode('shared');
    } finally { setBusy(false); }
  };

  const createSharedChannel = async () => {
    if (!sharedName.trim()) return;
    setBusy(true);
    try {
      const payload = await joinChannel({ gameId: game.id, clanId: clan.id, name: sharedName.trim(), create: true, accessScope: 'all_clans' });
      const channel = payload.channel;
      if (channel) {
        joinedSharedRef.current = channel;
        setSharedChannel(channel);
        setMode('shared');
        setSharedName('');
        queryClient.invalidateQueries({ queryKey: ['sharedClanForumChannels', game.id] });
      }
    } finally { setBusy(false); }
  };

  const channelTitle = mode === 'leaders' ? 'Clan Leaders' : mode === 'shared' ? (activeChannel?.name || 'Shared Clan Forum') : 'Clan Forum';

  return <div className="grid h-full min-h-0 grid-cols-[210px_260px_minmax(0,1fr)] bg-[#191f26]/55">
    <aside className="flex min-h-0 flex-col border-r border-white/[0.055] p-3">
      <div className="px-2 py-2"><div className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/25">Forum spaces</div><h4 className="mt-1 text-sm font-semibold text-white/82">Clan Forums</h4></div>
      <div className="mt-2 space-y-1">
        <button type="button" onClick={() => setMode('clan')} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[10px] ${mode === 'clan' ? 'bg-white/[0.075] text-white' : 'text-white/42 hover:bg-white/[0.035]'}`}><Users className="h-3.5 w-3.5" />Clan Topics</button>
        {privileged && <button type="button" onClick={() => setMode('leaders')} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[10px] ${mode === 'leaders' ? 'bg-white/[0.075] text-white' : 'text-white/42 hover:bg-white/[0.035]'}`}><Shield className="h-3.5 w-3.5" />Clan Leaders</button>}
      </div>
      <div className="my-3 h-px bg-white/[0.05]" />
      <div className="px-2 text-[8px] font-bold uppercase tracking-[0.18em] text-white/25">Shared with other clans</div>
      <div className="mt-2 min-h-0 flex-1 overflow-y-auto space-y-1">{sharedChannels.map((channel) => <button key={channel.id} type="button" onClick={() => openSharedChannel(channel)} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[9px] ${mode === 'shared' && activeChannel?.id === channel.id ? 'bg-white/[0.07] text-white' : 'text-white/38 hover:bg-white/[0.03]'}`}><Globe2 className="h-3 w-3 shrink-0" /><span className="truncate">{channel.name || channel.channel_name || 'Shared Forum'}</span></button>)}{!sharedChannels.length && <p className="px-2 py-4 text-[9px] text-white/20">No shared clan forums yet.</p>}</div>
      <div className="mt-2 flex gap-1.5"><input value={sharedName} onChange={(e) => setSharedName(e.target.value)} placeholder="New shared forum" className="h-8 min-w-0 flex-1 rounded-lg border border-white/[0.05] bg-black/10 px-2 text-[9px] text-white outline-none placeholder:text-white/20" /><button type="button" disabled={!sharedName.trim() || busy} onClick={createSharedChannel} className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.05] text-white/40 disabled:opacity-30"><Plus className="h-3 w-3" /></button></div>
    </aside>

    <aside className="flex min-h-0 flex-col border-r border-white/[0.055]">
      <div className="border-b border-white/[0.05] px-4 py-4"><div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.16em] text-white/28">{mode === 'leaders' ? <LockKeyhole className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}{channelTitle}</div><p className="mt-1 text-[9px] text-white/20">Pick a topic or start a new discussion.</p></div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">{topics.map((topic) => <button type="button" key={topic.id} onClick={() => setSelectedTopicId(topic.id)} className={`mb-1 w-full rounded-xl px-3 py-2.5 text-left ${selectedTopicId === topic.id ? 'bg-white/[0.07]' : 'hover:bg-white/[0.03]'}`}><strong className="block truncate text-[10px] font-medium text-white/65">{topic.title}</strong><span className="mt-1 block text-[8px] text-white/22">{topic.status || 'open'} discussion</span></button>)}{!topics.length && <p className="px-3 py-8 text-center text-[9px] text-white/20">No topics in this forum yet.</p>}</div>
      <div className="border-t border-white/[0.05] p-2"><div className="flex gap-1.5"><input value={topicDraft} onChange={(e) => setTopicDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') createTopic(); }} placeholder="New topic" className="h-8 min-w-0 flex-1 rounded-lg border border-white/[0.05] bg-black/10 px-2 text-[9px] text-white outline-none placeholder:text-white/20" /><button type="button" disabled={!topicDraft.trim() || !activeChannel?.id || busy} onClick={createTopic} className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-100/[0.06] text-cyan-100/50 disabled:opacity-30"><Plus className="h-3 w-3" /></button></div></div>
    </aside>

    <section className="flex min-h-0 min-w-0 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.055] px-5"><MessageSquare className="h-4 w-4 text-cyan-100/45" /><div className="min-w-0"><h5 className="truncate text-xs font-semibold text-white/78">{selectedTopic?.title || channelTitle}</h5><p className="mt-0.5 text-[8px] text-white/22">{mode === 'shared' ? 'Cross-clan discussion' : mode === 'leaders' ? 'Leader and officer discussion' : 'Clan discussion'}</p></div></header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">{selectedTopic ? messages.length ? <div className="space-y-2">{messages.map((message) => <article key={message.id} className="rounded-xl px-3 py-2.5 hover:bg-white/[0.025]"><div className="flex items-center gap-2 text-[8px] text-white/24"><strong className="text-[10px] font-medium text-white/60">{message.username || 'Player'}</strong><span className="ml-auto">{message.created_date ? new Date(message.created_date).toLocaleString() : ''}</span></div><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-white/55">{message.content}</p></article>)}</div> : <div className="grid h-full place-items-center text-center"><div><MessageSquare className="mx-auto h-7 w-7 text-white/10" /><p className="mt-3 text-xs text-white/28">No replies yet.</p></div></div> : <div className="grid h-full place-items-center text-center"><div><MessageSquare className="mx-auto h-7 w-7 text-white/10" /><p className="mt-3 text-xs text-white/28">Select or create a topic.</p></div></div>}</div>
      <div className="flex shrink-0 gap-2 border-t border-white/[0.055] p-3"><input value={messageDraft} onChange={(e) => setMessageDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} disabled={!selectedTopic} placeholder={selectedTopic ? 'Write a reply…' : 'Select a topic first'} className="h-10 min-w-0 flex-1 rounded-xl border border-white/[0.055] bg-black/10 px-3 text-xs text-white outline-none placeholder:text-white/20 disabled:opacity-40" /><button type="button" disabled={!selectedTopic || !messageDraft.trim() || busy} onClick={sendMessage} className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-100/[0.07] text-cyan-100/55 disabled:opacity-30"><Send className="h-4 w-4" /></button></div>
    </section>
  </div>;
}
