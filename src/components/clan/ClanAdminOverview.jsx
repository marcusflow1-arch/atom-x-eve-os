import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CalendarDays, ClipboardList, Package, Shield, TrendingUp, Users } from 'lucide-react';
import ClanTreasuryPage from '@/components/clan/ClanTreasuryPage';
import ClanSchedulePage from '@/components/clan/ClanSchedulePage';
import ClanUpgradesPage from '@/components/clan/ClanUpgradesPage';
import AssignmentManager from '@/components/clan/assignments/AssignmentManager';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Shield },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'tasks', label: 'Tasks', icon: ClipboardList },
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'upgrades', label: 'Upgrades', icon: TrendingUp },
];

const invoke = async (action, data) => {
  const result = await base44.functions.invoke('clanOperations', { action, data });
  const payload = result?.data || result;
  if (payload?.success === false) throw new Error(payload.error || 'Clan admin request failed');
  return payload;
};

export default function ClanAdminOverview({ clan }) {
  const [activeTab, setActiveTab] = useState('overview');
  const { data: state, isLoading } = useQuery({
    queryKey: ['clanAdminState', clan?.id],
    queryFn: () => invoke('admin_state', { clanId: clan.id }),
    enabled: !!clan?.id,
    refetchInterval: 15000,
  });

  const progress = state?.progress || {};
  const completion = progress.assignmentsTotal ? Math.round((progress.assignmentsCompleted / progress.assignmentsTotal) * 100) : 0;

  return (
    <div className="absolute inset-0 flex flex-col bg-[#171c22]/84 text-white backdrop-blur-2xl">
      <header className="flex min-h-20 shrink-0 items-center gap-5 border-b border-white/[0.07] px-7">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.055] text-amber-100/70"><Shield className="h-5 w-5" /></div>
        <div><div className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">Clan operations</div><h2 className="mt-1 text-lg font-semibold tracking-tight text-white/90">Admin Console</h2></div>
        <nav className="ml-auto flex items-center gap-1 rounded-2xl bg-black/10 p-1">
          {TABS.map((tab) => { const Icon = tab.icon; const active = activeTab === tab.id; return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-[10px] font-semibold transition ${active ? 'bg-white/[0.08] text-white' : 'text-white/38 hover:bg-white/[0.035] hover:text-white/70'}`}><Icon className="h-3.5 w-3.5" />{tab.label}</button>; })}
        </nav>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab === 'overview' && (
          <div className="h-full overflow-y-auto p-6 md:p-8">
            <div className="mx-auto max-w-6xl">
              <div className="mb-7"><h3 className="text-2xl font-semibold tracking-tight text-white/92">{clan?.name}</h3><p className="mt-1 text-xs text-white/38">Live clan progress, resources and operational workload. Values below come from persisted clan records.</p></div>
              {isLoading ? <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-10 text-center text-xs text-white/30">Loading clan operations…</div> : <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                  {[
                    ['Members', progress.memberCount || 0, Users],
                    ['Vault Units', progress.inventoryUnits || 0, Package],
                    ['Active Upgrades', progress.activeUpgrades || 0, TrendingUp],
                    ['Tasks Complete', `${progress.assignmentsCompleted || 0}/${progress.assignmentsTotal || 0}`, ClipboardList],
                    ['Upcoming Events', progress.upcomingEvents || 0, CalendarDays],
                  ].map(([label, value, Icon]) => <div key={label} className="rounded-2xl border border-white/[0.06] bg-white/[0.028] p-4 shadow-[inset_0_1px_rgba(255,255,255,.025)]"><Icon className="h-4 w-4 text-cyan-100/45" /><strong className="mt-5 block text-2xl font-semibold text-white/88">{value}</strong><span className="mt-1 block text-[9px] uppercase tracking-wider text-white/30">{label}</span></div>)}
                </div>
                <div className="mt-5 grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
                  <section className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5"><div className="flex items-center justify-between"><div><div className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/28">Guild progress</div><h4 className="mt-1 text-sm font-semibold text-white/78">Task completion</h4></div><strong className="text-xl text-cyan-100/70">{completion}%</strong></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-black/20"><div className="h-full rounded-full bg-cyan-200/45 transition-all" style={{ width: `${completion}%` }} /></div><p className="mt-3 text-[10px] leading-5 text-white/32">Assignments issued here are also available to GAME Chats when they target a specific game, so clan planning and per-game operations remain connected.</p></section>
                  <section className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5"><div className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/28">Operations queue</div><div className="mt-4 space-y-3 text-xs">{(state?.upgrades || []).filter((item) => item.status === 'in_progress').slice(0, 4).map((item) => <div key={item.id} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2"><span className="text-white/58">{item.upgrade_name}</span><span className="text-amber-100/50">Building</span></div>)}{!(state?.upgrades || []).some((item) => item.status === 'in_progress') && <p className="py-4 text-center text-white/25">No upgrades are currently building.</p>}</div></section>
                </div>
              </>}
            </div>
          </div>
        )}
        {activeTab === 'inventory' && <ClanTreasuryPage clan={clan} />}
        {activeTab === 'tasks' && <AssignmentManager clanId={clan?.id} members={state?.members || []} />}
        {activeTab === 'events' && <ClanSchedulePage clan={clan} />}
        {activeTab === 'upgrades' && <ClanUpgradesPage clan={clan} />}
      </div>
    </div>
  );
}
