import React, { useEffect, useMemo, useState } from 'react';
import { Brain, FileText, Gamepad2, Map as MapIcon, MessageSquare, Mic, Target, UserPlus, Users, Wheat } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthContext';
import { useEntitySubscription } from '@/components/clan/shared/useEntitySubscription';
import VoiceRoomManager from '@/components/clan/voice/VoiceRoomManager';
import PartyOperations from '@/components/clan/party/PartyOperations';
import FarmingZone from '@/components/clan/zones/FarmingZone';
import ExplorationOperations from '@/components/clan/zones/ExplorationOperations';
import StrategyZone from '@/components/clan/zones/StrategyZone';
import ZoneChatPanel from '@/components/clan/shared/ZoneChatPanel';
import ClanForumsZone from '@/components/clan/forms/ClanForumsZone';
import InviteModal from '@/components/clan/modals/InviteModal';

const ZONES = [
  { id: 'exploration', label: 'Exploration', icon: MapIcon, desc: 'Reveal locations, routes and discoveries' },
  { id: 'farming', label: 'Farming', icon: Wheat, desc: 'Resources, routes and card-upgrade farming' },
  { id: 'strategy', label: 'Tactics', icon: Brain, desc: 'Plans, meetings and game strategies' },
  { id: 'party', label: 'Party Formation', icon: Users, desc: 'Create squads and join objectives' },
  { id: 'chat', label: 'Game Chat', icon: MessageSquare, desc: 'General clan chat for this game' },
  { id: 'forms', label: 'Clan Forums', icon: FileText, desc: 'Topics, leaders and cross-clan coordination' },
  { id: 'voice', label: 'Voice Room', icon: Mic, desc: 'Live tactical voice channels' },
];

const invoke = async (action, data) => {
  const result = await base44.functions.invoke('clanOperations', { action, data });
  const payload = result?.data || result;
  if (payload?.success === false) throw new Error(payload.error || 'Clan operation failed');
  return payload;
};

export default function GameWorkspace({ game, clan, onBack, initialZone }) {
  const { user, updatePresenceContext } = useAuth();
  const queryClient = useQueryClient();
  const [activeZone, setActiveZone] = useState(initialZone || 'chat');
  const [showInvite, setShowInvite] = useState(false);
  const [visitedZones, setVisitedZones] = useState({ [initialZone || 'chat']: true });

  const visibleZones = useMemo(() => game?.isGlobalChat ? ZONES.filter((zone) => ['chat', 'voice'].includes(zone.id)) : ZONES, [game?.isGlobalChat]);
  const activeDefinition = ZONES.find((zone) => zone.id === activeZone) || ZONES[4];
  const ActiveIcon = activeDefinition.icon;

  useEffect(() => {
    updatePresenceContext?.({ type: 'game', name: game?.title, id: game?.id, zoneId: activeZone });
  }, [activeZone, game?.id, game?.title, updatePresenceContext]);

  useEffect(() => () => {
    if (clan?.id) updatePresenceContext?.({ type: 'clan', name: clan?.name, id: clan.id });
  }, [clan?.id, clan?.name, updatePresenceContext]);

  const handleZoneChange = (zoneId) => {
    setActiveZone(zoneId);
    setVisitedZones((current) => ({ ...current, [zoneId]: true }));
  };

  const { data: objectives = [] } = useQuery({
    queryKey: ['gameObjectives', clan?.id, game?.id],
    queryFn: () => base44.entities.ClanAssignment.filter({ clanId: clan.id, targetId: game.id, status: 'pending' }, '-created_date', 100),
    enabled: !!clan?.id && !!game?.id && !game?.isGlobalChat,
  });
  useEntitySubscription('ClanAssignment', ['gameObjectives', clan?.id, game?.id]);

  const completeObjective = useMutation({
    mutationFn: (assignmentId) => invoke('set_assignment_status', { clanId: clan.id, assignmentId, status: 'completed' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gameObjectives', clan?.id, game?.id] }),
  });

  const { data: workspace } = useQuery({
    queryKey: ['gameWorkspace', clan?.id, game?.id],
    queryFn: async () => {
      const rows = await base44.entities.GameWorkspace.filter({ clan_id: clan.id, game_id: game.id });
      return rows?.[0] || null;
    },
    enabled: !!clan?.id && !!game?.id && !game?.isGlobalChat,
  });
  useEntitySubscription('GameWorkspace', ['gameWorkspace', clan?.id, game?.id]);

  const activeMemberIds = Array.isArray(workspace?.active_member_ids) ? workspace.active_member_ids : [];
  const gameArt = game?.cover_image || game?.cover || '';
  const openGlobalComms = () => window.dispatchEvent(new Event('openClanChatOverlay'));

  return <div className="relative flex h-full w-full overflow-hidden bg-[#171c22] text-white">
    {gameArt && <div className="pointer-events-none absolute inset-0 opacity-[0.12]"><img src={gameArt} alt="" className="h-full w-full object-cover blur-2xl" /><div className="absolute inset-0 bg-[#171c22]/75" /></div>}
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_0%,rgba(118,165,191,.10),transparent_38%),linear-gradient(135deg,rgba(255,255,255,.018),transparent_46%)]" />

    <aside className="relative z-10 flex w-[286px] shrink-0 flex-col border-r border-white/[0.07] bg-[#1d232b]/82 backdrop-blur-3xl">
      <div className="border-b border-white/[0.07] p-4">
        <button type="button" onClick={openGlobalComms} className="flex w-full items-center gap-2 rounded-xl bg-cyan-100/[0.055] px-3 py-2.5 text-left text-[10px] font-semibold text-cyan-100/65 transition hover:bg-cyan-100/[0.09]"><MessageSquare className="h-3.5 w-3.5" /> Atom X Eve Global Comms</button>
        <button type="button" onClick={onBack} className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[10px] text-white/38 transition hover:bg-white/[0.04] hover:text-white/70"><Gamepad2 className="h-3.5 w-3.5" /> All GAME Chats</button>
        <div className="mt-4 flex items-center gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.04]">{gameArt ? <img src={gameArt} alt="" className="h-full w-full object-cover" /> : <Gamepad2 className="h-4 w-4 text-white/28" />}</div><div className="min-w-0"><h2 className="truncate text-sm font-semibold text-white/88">{game?.title || 'Game'}</h2><div className="mt-1 flex items-center gap-2 text-[9px] text-white/30"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300/70" />{activeMemberIds.length} active in workspace</div></div></div>
      </div>

      {!game?.isGlobalChat && <section className="max-h-[220px] overflow-y-auto border-b border-white/[0.07] p-3"><div className="mb-2 flex items-center gap-2 px-1 text-[8px] font-bold uppercase tracking-[0.18em] text-white/28"><Target className="h-3 w-3" /> Active tasks</div>{objectives.length ? <div className="space-y-1.5">{objectives.map((objective) => <div key={objective.id} className="rounded-xl border border-white/[0.045] bg-white/[0.025] p-2.5"><div className="flex gap-2"><div className="min-w-0 flex-1"><strong className="block truncate text-[10px] font-medium text-white/70">{objective.targetName || objective.title || 'Clan task'}</strong><p className="mt-1 line-clamp-2 text-[9px] leading-4 text-white/28">{objective.notes || objective.type || 'Objective'}</p></div><button type="button" onClick={() => completeObjective.mutate(objective.id)} className="self-start rounded-md bg-white/[0.04] px-1.5 py-1 text-[8px] text-white/35 hover:bg-white/[0.08] hover:text-emerald-200/70">Done</button></div></div>)}</div> : <p className="px-1 py-3 text-[9px] text-white/22">No active tasks for this game.</p>}</section>}

      <nav className="min-h-0 flex-1 overflow-y-auto p-3"><div className="mb-2 px-1 text-[8px] font-bold uppercase tracking-[0.18em] text-white/25">Operational zones</div><div className="space-y-1">{visibleZones.map((zone) => { const Icon = zone.icon; const selected = zone.id === activeZone; return <button key={zone.id} type="button" onClick={() => handleZoneChange(zone.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${selected ? 'bg-white/[0.075] text-white' : 'text-white/42 hover:bg-white/[0.035] hover:text-white/72'}`}><div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${selected ? 'bg-cyan-100/[0.09] text-cyan-100/70' : 'bg-white/[0.035] text-white/32'}`}><Icon className="h-3.5 w-3.5" /></div><div className="min-w-0"><strong className="block truncate text-[10px] font-semibold">{zone.label}</strong><span className="mt-0.5 block truncate text-[8px] text-white/25">{zone.desc}</span></div></button>; })}</div></nav>
    </aside>

    <main className="relative z-10 flex min-w-0 flex-1 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.07] bg-black/[0.08] px-5 backdrop-blur-xl"><ActiveIcon className="h-4 w-4 text-cyan-100/50" /><div><h3 className="text-sm font-semibold text-white/84">{activeDefinition.label}</h3><p className="text-[9px] text-white/28">{activeDefinition.desc}</p></div><div className="ml-auto flex items-center gap-2"><Badge variant="outline" className="border-white/[0.07] bg-white/[0.025] text-[9px] text-white/38">{activeMemberIds.length} Active</Badge><Button size="sm" variant="outline" onClick={() => setShowInvite(true)} className="h-8 gap-1.5 border-white/[0.08] bg-white/[0.025] text-[9px] text-white/50 hover:bg-white/[0.06] hover:text-white"><UserPlus className="h-3 w-3" />Invite</Button></div></header>

      <div className="min-h-0 flex-1 overflow-hidden">
        {visitedZones.chat && <div className="h-full" style={{ display: activeZone === 'chat' ? 'block' : 'none' }}><ZoneChatPanel clanId={clan?.id} gameId={game?.id} zoneId="chat" title="Game Chat" className="border-l-0" /></div>}
        {visitedZones.farming && <div className="h-full" style={{ display: activeZone === 'farming' ? 'block' : 'none' }}><FarmingZone game={game} clan={clan} /></div>}
        {visitedZones.exploration && <div className="h-full" style={{ display: activeZone === 'exploration' ? 'block' : 'none' }}><ExplorationOperations game={game} clan={clan} /></div>}
        {visitedZones.strategy && <div className="h-full" style={{ display: activeZone === 'strategy' ? 'block' : 'none' }}><StrategyZone game={game} clan={clan} /></div>}
        {visitedZones.forms && <div className="h-full" style={{ display: activeZone === 'forms' ? 'block' : 'none' }}><ClanForumsZone game={game} clan={clan} user={user} /></div>}
        {visitedZones.voice && <div className="h-full" style={{ display: activeZone === 'voice' ? 'flex' : 'none' }}><div className="min-w-0 flex-1"><VoiceRoomManager clanId={clan?.id} gameId={game?.id} /></div><div className="w-72 shrink-0 border-l border-white/[0.055]"><ZoneChatPanel clanId={clan?.id} gameId={game?.id} zoneId="voice" title="Voice Notes" /></div></div>}
        {visitedZones.party && <div className="h-full" style={{ display: activeZone === 'party' ? 'block' : 'none' }}><PartyOperations clanId={clan?.id} gameId={game?.id} /></div>}
      </div>
    </main>

    <InviteModal open={showInvite} onClose={() => setShowInvite(false)} game={game} />
  </div>;
}
