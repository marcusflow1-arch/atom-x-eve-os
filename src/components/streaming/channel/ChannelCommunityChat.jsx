import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { publicChatMessages } from './channelHomeModel';

export default function ChannelCommunityChat({ streamId, isLive, user, compact = false }) {
  const client = useQueryClient(), feedRef = useRef(null);
  const [draft, setDraft] = useState(''), [sending, setSending] = useState(false), [error, setError] = useState('');
  const query = useQuery({ queryKey: ['channel-community-chat', streamId], enabled: Boolean(streamId), queryFn: async () => {
    const result = await base44.entities.StreamChatMessage.filter({ stream_id: streamId, is_deleted: false, message_type: { $in: ['text', 'system'] } }, '-created_date', 30, 0, ['id', 'stream_id', 'username', 'content', 'message_type', 'is_deleted', 'created_date']);
    return publicChatMessages(Array.isArray(result) ? result : result?.data || [], streamId);
  }, staleTime: 10000, refetchInterval: isLive ? 15000 : false, refetchIntervalInBackground: false, retry: 1 });
  const messages = useMemo(() => (query.data || []).slice(compact ? -3 : -30), [query.data, compact]);
  useEffect(() => {
    if (!streamId) return;
    let timer, cleanup;
    try { cleanup = base44.entities.StreamChatMessage.subscribe((event) => {
      if (event.type !== 'delete' && event.data?.stream_id !== streamId) return;
      clearTimeout(timer); timer = setTimeout(() => client.invalidateQueries({ queryKey: ['channel-community-chat', streamId] }), 250);
    }); } catch { /* Polling keeps live chat current. */ }
    return () => { clearTimeout(timer); cleanup?.(); };
  }, [client, streamId]);
  useEffect(() => { const node = feedRef.current; if (node && node.scrollHeight - node.scrollTop - node.clientHeight < 180) node.scrollTop = node.scrollHeight; }, [messages]);
  const send = async (event) => {
    event.preventDefault();
    const content = draft.trim();
    if (!user?.id || !streamId || !isLive || !content || sending) return;
    setSending(true); setError('');
    try { await base44.entities.StreamChatMessage.create({ stream_id: streamId, user_id: user.id, username: user.username || user.full_name || 'Viewer', message_type: 'text', content, is_deleted: false }); setDraft(''); await client.invalidateQueries({ queryKey: ['channel-community-chat', streamId] }); }
    catch { setError('Your message could not send. Please try again.'); }
    finally { setSending(false); }
  };
  return <section className={`channel-community-chat ${compact ? 'is-compact' : ''}`} aria-label={compact ? 'Community chat highlights' : 'Stream chat'}><header><span><MessageSquare size={15} />{compact ? 'Active Community Chat' : 'Stream Chat'}</span><small>{isLive ? 'LIVE' : 'OFFLINE'}</small></header><div ref={feedRef} className="channel-chat-feed" role="log" aria-live="polite" aria-relevant="additions">{messages.map((message) => <p key={message.id}><strong>{message.username || 'Channel'}</strong><span>{message.content}</span></p>)}{!messages.length && <div className="channel-chat-empty"><MessageSquare size={23} /><p>{query.isError ? 'Chat could not load.' : query.isPending && streamId ? 'Loading the conversation…' : isLive ? 'The conversation starts here.' : 'Chat returns with the next live stream.'}</p>{query.isError && <button type="button" onClick={() => query.refetch()}>Retry chat</button>}</div>}</div>{!compact && <form onSubmit={send}><label className="sr-only" htmlFor="channel-chat-message">Message this channel</label><input id="channel-chat-message" maxLength={500} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={!isLive ? 'Chat is offline' : !user?.id ? 'Sign in to join the chat' : 'Join the conversation'} disabled={!isLive || !user?.id || sending} /><button type="submit" aria-label="Send chat message" disabled={!isLive || !user?.id || !draft.trim() || sending}><Send size={15} /></button></form>}{error && <p className="channel-inline-notice" role="alert">{error}</p>}</section>;
}
