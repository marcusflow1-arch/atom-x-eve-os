import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ClanChatHub from '@/components/clan/ClanChatHub';

export default function ClanChatOverlayBody({ user, loading, onClose }) {
  const [selectedId, setSelectedId] = useState(null);
  const { data: memberships = [], isLoading, error, refetch } = useQuery({
    queryKey: ['clanChatMemberships', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const members = await base44.entities.ClanMember.filter({ user_id: user.id });
      const ids = [...new Set(members.map(member => member.clan_id).filter(Boolean))];
      if (!ids.length) return [];
      const clans = await base44.entities.Division.filter({ id: { $in: ids } });
      return members.map(member => ({ ...member, clan: clans.find(clan => clan.id === member.clan_id) })).filter(member => member.clan);
    },
  });
  if (loading || (user && isLoading)) return <p role="status" className="clan-chat-overlay-status">Loading your clan chat…</p>;
  if (!user) return <div className="clan-chat-overlay-status"><p>Sign in to use Clan Chat.</p><button className="clan-text-action" onClick={() => base44.auth.redirectToLogin(window.location.href)}>Sign in</button></div>;
  if (error) return <div className="clan-chat-overlay-status" role="alert"><p>Unable to load your clan chat.</p><button className="clan-text-action" onClick={() => refetch()}>Try again</button></div>;
  if (!memberships.length) return <div className="clan-chat-overlay-status"><p>Join a clan to start chatting.</p><Link to="/Clan" onClick={onClose} className="clan-text-action">Find a clan</Link></div>;
  const active = memberships.find(member => member.clan_id === selectedId) || memberships[0];
  return <div className="flex h-full min-h-0 flex-col" data-testid="clan-chat-membership" data-clan-id={active.clan_id}>
    <div className="clan-chat-overlay-clan">
      {memberships.length > 1 ? <label className="flex items-center gap-3">Clan<select aria-label="Chat clan" value={active.clan_id} onChange={event => setSelectedId(event.target.value)} className="rounded border border-border bg-background px-3 py-1 text-foreground">{memberships.map(member => <option key={member.id} value={member.clan_id}>{member.clan.name}</option>)}</select></label> : <span>{active.clan.name}</span>}
    </div>
    <div className="min-h-0 flex-1"><ClanChatHub key={active.clan_id} clan={active.clan} myRole={active.role} /></div>
  </div>;
}