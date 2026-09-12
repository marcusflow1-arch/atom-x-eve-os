import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Hash, MessageCircle, Send, Shield, Swords, Users } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import ClanWhisperDrawer from '@/components/clan/ClanWhisperDrawer';
import { useAuth } from '@/components/auth/AuthContext';

const CHANNELS = [
  { id: 'clan_global', name: 'Clan Chat', description: 'Everyone in the clan', icon: Users },
  { id: 'clan_strategy', name: 'Strategy', description: 'Plans, meetings and operations', icon: Swords },
  { id: 'clan_leaders', name: 'Clan Leaders', description: 'Leader and officer channel', icon: Shield, privileged: true },
];

const invoke = async (action, data) => {
  const result = await base44.functions.invoke('clanOperations', { action, data });
  const payload = result?.data || result;
  if (payload?.success === false) throw new Error(payload.error || 'Clan communications request failed');
  return payload;
};

export default function ClanChatHub({ clan, myRole }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [channelId, setChannelId] = useState('clan_global');
  const [message, setMessage] = useState('');
  const [whisperOpen, setWhisperOpen] = useState(false);
  const isPrivileged = myRole === 'leader' || myRole === 'officer';
  const visibleChannels = useMemo(() => CHANNELS.filter((channel) => !channel.privileged || isPrivileged), [isPrivileged]);
  const activeChannel = visibleChannels.find((channel) => channel.id === channelId) || visibleChannels[0];

  useEffect(() => {
    if (!visibleChannels.some((channel) => channel.id === channelId)) setChannelId('clan_global');
  }, [channelId, visibleChannels]);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['clanComms', clan?.id, activeChannel?.id],
    queryFn: async () => {
      if (!clan?.id || !activeChannel?.id) return [];
      const payload = await invoke('list_messages', { clanId: clan.id, channelId: activeChannel.id });
      return payload.messages || [];
    },
    enabled: !!clan?.id && !!activeChannel?.id,
    refetchInterval: 3500,
  });

  useEffect(() => {
    if (!clan?.id || !activeChannel?.id) return undefined;
    const unsubscribe = base44.entities.ClanMessage.subscribe((event) => {
      if (event.data?.divisionId === clan.id && event.data?.channelId === activeChannel.id) {
        queryClient.invalidateQueries({ queryKey: ['clanComms', clan.id, activeChannel.id] });
      }
    });
    return () => { try { unsubscribe?.(); } catch (_) {} };
  }, [activeChannel?.id, clan?.id, queryClient]);

  const send = useMutation({
    mutationFn: async () => invoke('send_message', { clanId: clan.id, channelId: activeChannel.id, content: message }),
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['clanComms', clan.id, activeChannel.id] });
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!message.trim() || send.isPending) return;
    send.mutate();
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden rounded-2xl border border-white/[0.07] bg-[#1d232b]/72 backdrop-blur-2xl">
      <aside className="flex w-56 flex-shrink-0 flex-col border-r border-white/[0.07] bg-black/10">
        <div className="border-b border-white/[0.07] px-4 py-4">
          <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/35">Atom X Eve Global Comms</div>
          <div className="mt-1 truncate text-sm font-semibold text-white/85">{clan?.name}</div>
        </div>
        <div className="flex-1 space-y-1 p-2">
          {visibleChannels.map((channel) => {
            const Icon = channel.icon;
            const active = activeChannel?.id === channel.id;
            return <button
              key={channel.id}
              type="button"
              onClick={() => setChannelId(channel.id)}
              className={`w-full rounded-xl px-3 py-3 text-left transition ${active ? 'bg-white/[0.075] text-white' : 'text-white/52 hover:bg-white/[0.04] hover:text-white/80'}`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold"><Icon className="h-3.5 w-3.5" />{channel.name}</div>
              <div className="mt-1 pl-[22px] text-[9px] text-white/28">{channel.description}</div>
            </button>;
          })}
        </div>
        <div className="border-t border-white/[0.07] p-3">
          <button type="button" onClick={() => setWhisperOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.045] py-2.5 text-[10px] font-semibold uppercase tracking-wider text-white/52 hover:bg-white/[0.075] hover:text-white">
            <MessageCircle className="h-3.5 w-3.5" /> Whisper
          </button>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.07] px-5">
          <Hash className="h-4 w-4 text-cyan-200/55" />
          <div><div className="text-sm font-semibold text-white/88">{activeChannel?.name}</div><div className="text-[9px] text-white/30">{activeChannel?.description}</div></div>
          <div className="ml-auto text-[9px] text-white/25">{messages.length} messages</div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? <div className="grid h-full place-items-center text-xs text-white/30">Loading communications…</div> : messages.length ? (
            <div className="space-y-1.5">
              {messages.map((item) => {
                const mine = String(item.userId || '') === String(user?.id || '');
                return <div key={item.id} className={`rounded-xl px-3 py-2.5 ${mine ? 'bg-cyan-200/[0.045]' : 'hover:bg-white/[0.028]'}`}>
                  <div className="flex items-center gap-2 text-[9px] text-white/30">
                    <strong className="text-[10px] font-semibold text-white/72">{item.author || 'Player'}</strong>
                    {item.role && <span className="rounded bg-white/[0.04] px-1.5 py-0.5 uppercase tracking-wider">{item.role}</span>}
                    <span className="ml-auto">{item.created_date ? new Date(item.created_date).toLocaleString() : ''}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-white/67">{item.content}</p>
                </div>;
              })}
            </div>
          ) : <div className="grid h-full place-items-center text-center"><div><Hash className="mx-auto h-7 w-7 text-white/15" /><p className="mt-3 text-xs text-white/35">No messages here yet.</p><p className="mt-1 text-[10px] text-white/20">Start the conversation for this channel.</p></div></div>}
        </div>

        <form onSubmit={handleSubmit} className="flex shrink-0 items-center gap-2 border-t border-white/[0.07] p-3">
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={`Message ${activeChannel?.name || 'clan'}`}
            maxLength={4000}
            className="h-10 min-w-0 flex-1 rounded-xl border border-white/[0.055] bg-black/10 px-3 text-xs text-white outline-none placeholder:text-white/25 focus:border-cyan-200/20"
          />
          <button type="submit" disabled={!message.trim() || send.isPending} className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-200/[0.09] text-cyan-100/70 transition hover:bg-cyan-200/[0.15] disabled:opacity-30">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </section>

      <AnimatePresence>
        {whisperOpen && <ClanWhisperDrawer clan={clan} onClose={() => setWhisperOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
