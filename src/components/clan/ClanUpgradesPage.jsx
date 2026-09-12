import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Radio, Shield, Swords, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CATALOG = [
  { key: 'command_network', name: 'Command Network', category: 'command', icon: Shield, description: 'Improves clan coordination capacity and operational tooling.', buildSeconds: 300 },
  { key: 'communications_array', name: 'Communications Array', category: 'communications', icon: Radio, description: 'Expands communications infrastructure for GAME Chats and clan operations.', buildSeconds: 420 },
  { key: 'armory_systems', name: 'Armory Systems', category: 'armory', icon: Swords, description: 'Improves shared equipment management and future equipment bonuses.', buildSeconds: 480 },
  { key: 'barracks_capacity', name: 'Barracks Capacity', category: 'members', icon: Users, description: 'Expands support for parties, assignments and coordinated squads.', buildSeconds: 360 },
  { key: 'aether_grid', name: 'Aether Grid', category: 'power', icon: Zap, description: 'Raises stronghold power capacity for advanced facilities.', buildSeconds: 600 },
];

const invoke = async (action, data) => {
  const result = await base44.functions.invoke('clanOperations', { action, data });
  const payload = result?.data || result;
  if (payload?.success === false) throw new Error(payload.error || 'Clan upgrade request failed');
  return payload;
};

export default function ClanUpgradesPage({ clan }) {
  const queryClient = useQueryClient();
  const { data: state, isLoading } = useQuery({
    queryKey: ['clanAdminState', clan?.id],
    queryFn: () => invoke('admin_state', { clanId: clan.id }),
    enabled: !!clan?.id,
    refetchInterval: 5000,
  });
  const upgrades = state?.upgrades || [];

  const start = useMutation({
    mutationFn: (definition) => invoke('start_upgrade', { clanId: clan.id, upgrade: definition }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clanAdminState', clan.id] }),
  });

  const getState = (definition) => upgrades.find((row) => row.upgrade_key === definition.key);
  const progressFor = (row) => {
    if (!row) return 0;
    if (row.status === 'active') return 100;
    if (row.status !== 'in_progress' || !row.started_at) return 0;
    const elapsed = Math.max(0, (Date.now() - new Date(row.started_at).getTime()) / 1000);
    return Math.min(100, Math.round((elapsed / Math.max(1, Number(row.build_seconds || 1))) * 100));
  };

  return (
    <div className="h-full overflow-y-auto p-5 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div><div className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">Persistent progression</div><h3 className="mt-1 text-lg font-semibold text-white/90">Clan Upgrades</h3><p className="mt-1 max-w-2xl text-xs leading-5 text-white/38">Upgrades are stored on the clan, build over time, and advance tiers when their build timer completes. This replaces the previous hard-coded stronghold preview.</p></div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {CATALOG.map((definition) => {
            const Icon = definition.icon;
            const row = getState(definition);
            const tier = Number(row?.tier || 0);
            const maxTier = Number(row?.max_tier || 5);
            const progress = progressFor(row);
            const inProgress = row?.status === 'in_progress';
            const maxed = tier >= maxTier;
            return <section key={definition.key} className="rounded-2xl border border-white/[0.065] bg-white/[0.027] p-5 shadow-[inset_0_1px_rgba(255,255,255,.025)]">
              <div className="flex items-start gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.05] text-cyan-100/55"><Icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><h4 className="text-sm font-semibold text-white/82">{definition.name}</h4><span className="text-[9px] uppercase tracking-wider text-white/30">Tier {tier}/{maxTier}</span></div><p className="mt-1 text-[10px] leading-4 text-white/34">{definition.description}</p></div></div>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-black/20"><div className={`h-full rounded-full transition-all ${inProgress ? 'bg-amber-200/55' : 'bg-cyan-200/45'}`} style={{ width: `${row?.status === 'active' ? 100 : progress}%` }} /></div>
              <div className="mt-3 flex items-center justify-between"><span className="text-[9px] text-white/28">{inProgress ? `Building · ${progress}%` : maxed ? 'Maximum tier' : row?.status === 'active' ? 'Active · ready for next tier' : 'Not installed'}</span><Button size="sm" disabled={inProgress || maxed || start.isPending} onClick={() => start.mutate({ ...definition, maxTier })} className="h-8 bg-white/[0.065] px-3 text-[10px] text-white hover:bg-white/[0.1]">{tier ? 'Upgrade' : 'Install'}</Button></div>
            </section>;
          })}
        </div>
        {isLoading && <div className="mt-5 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 text-center text-xs text-white/30">Synchronizing upgrade state…</div>}
      </div>
    </div>
  );
}
