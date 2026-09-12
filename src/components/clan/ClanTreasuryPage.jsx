import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Archive, Package, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const invoke = async (action, data) => {
  const result = await base44.functions.invoke('clanOperations', { action, data });
  const payload = result?.data || result;
  if (payload?.success === false) throw new Error(payload.error || 'Clan inventory request failed');
  return payload;
};

export default function ClanTreasuryPage({ clan }) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [item, setItem] = useState({ item_name: '', quantity: 1, rarity: 'common', category: 'material', note: '' });

  const { data: state, isLoading } = useQuery({
    queryKey: ['clanAdminState', clan?.id],
    queryFn: () => invoke('admin_state', { clanId: clan.id }),
    enabled: !!clan?.id,
    refetchInterval: 15000,
  });
  const inventory = state?.inventory || [];

  const visible = useMemo(() => inventory.filter((row) => {
    if (category !== 'all' && (row.category || 'material') !== category) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [row.item_name, row.rarity, row.category, row.note].some((value) => String(value || '').toLowerCase().includes(q));
  }), [inventory, category, query]);

  const deposit = useMutation({
    mutationFn: () => invoke('deposit_inventory', { clanId: clan.id, item }),
    onSuccess: () => {
      setAddOpen(false);
      setItem({ item_name: '', quantity: 1, rarity: 'common', category: 'material', note: '' });
      queryClient.invalidateQueries({ queryKey: ['clanAdminState', clan.id] });
    },
  });

  const withdraw = useMutation({
    mutationFn: (row) => invoke('withdraw_inventory', { clanId: clan.id, itemId: row.id, quantity: row.quantity || 1 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clanAdminState', clan.id] }),
  });

  const totalUnits = inventory.reduce((sum, row) => sum + Number(row.quantity || 1), 0);

  return (
    <div className="h-full overflow-y-auto p-5 md:p-7">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between gap-5">
          <div><div className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">Persistent clan vault</div><h3 className="mt-1 text-lg font-semibold text-white/90">Inventory</h3><p className="mt-1 text-xs text-white/38">Shared equipment, materials, consumables and upgrade resources. Nothing here is sample data.</p></div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button className="gap-2 bg-white/[0.08] text-white hover:bg-white/[0.12]"><Plus className="h-4 w-4" />Deposit Item</Button></DialogTrigger>
            <DialogContent className="border-white/10 bg-[#20262e] text-white">
              <DialogHeader><DialogTitle>Deposit to clan inventory</DialogTitle></DialogHeader>
              <div className="grid gap-3 py-2">
                <Input value={item.item_name} onChange={(e) => setItem({ ...item, item_name: e.target.value })} placeholder="Item or resource name" className="border-white/10 bg-black/10" />
                <div className="grid grid-cols-2 gap-3"><Input type="number" min="1" value={item.quantity} onChange={(e) => setItem({ ...item, quantity: Number(e.target.value) || 1 })} className="border-white/10 bg-black/10" /><Select value={item.rarity} onValueChange={(value) => setItem({ ...item, rarity: value })}><SelectTrigger className="border-white/10 bg-black/10"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="common">Common</SelectItem><SelectItem value="uncommon">Uncommon</SelectItem><SelectItem value="rare">Rare</SelectItem><SelectItem value="epic">Epic</SelectItem><SelectItem value="legendary">Legendary</SelectItem><SelectItem value="mythic">Mythic</SelectItem></SelectContent></Select></div>
                <Select value={item.category} onValueChange={(value) => setItem({ ...item, category: value })}><SelectTrigger className="border-white/10 bg-black/10"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="material">Materials</SelectItem><SelectItem value="equipment">Equipment</SelectItem><SelectItem value="card">Achievement Cards</SelectItem><SelectItem value="consumable">Consumables</SelectItem><SelectItem value="currency">Currency</SelectItem></SelectContent></Select>
                <Input value={item.note} onChange={(e) => setItem({ ...item, note: e.target.value })} placeholder="Optional note" className="border-white/10 bg-black/10" />
              </div>
              <DialogFooter><Button onClick={() => deposit.mutate()} disabled={!item.item_name.trim() || deposit.isPending}>Deposit</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.027] p-4"><Archive className="h-4 w-4 text-cyan-100/45" /><strong className="mt-4 block text-2xl text-white/85">{inventory.length}</strong><span className="text-[9px] uppercase tracking-wider text-white/28">Unique entries</span></div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.027] p-4"><Package className="h-4 w-4 text-cyan-100/45" /><strong className="mt-4 block text-2xl text-white/85">{totalUnits}</strong><span className="text-[9px] uppercase tracking-wider text-white/28">Total units</span></div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.027] p-4"><span className="text-sm text-cyan-100/45">◆</span><strong className="mt-4 block text-2xl text-white/85">{inventory.filter((row) => ['legendary', 'mythic'].includes(String(row.rarity).toLowerCase())).length}</strong><span className="text-[9px] uppercase tracking-wider text-white/28">High rarity</span></div>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-2.5">
          <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-xl bg-black/10 px-3"><Search className="h-3.5 w-3.5 text-white/30" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search inventory" className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/25" /></label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 rounded-xl border border-white/[0.06] bg-[#20262e] px-3 text-xs text-white/55 outline-none"><option value="all">All categories</option><option value="material">Materials</option><option value="equipment">Equipment</option><option value="card">Achievement Cards</option><option value="consumable">Consumables</option><option value="currency">Currency</option></select>
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.022]">
          {isLoading ? <div className="p-10 text-center text-xs text-white/30">Loading vault…</div> : visible.length ? visible.map((row) => <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_110px_90px_90px_40px] items-center gap-3 border-b border-white/[0.045] px-4 py-3 last:border-0 hover:bg-white/[0.025]"><div className="min-w-0"><strong className="block truncate text-xs font-medium text-white/78">{row.item_name}</strong><span className="mt-1 block truncate text-[9px] text-white/28">{row.note || `Deposited ${row.deposited_at ? new Date(row.deposited_at).toLocaleDateString() : ''}`}</span></div><span className="text-[10px] capitalize text-white/42">{row.category || 'material'}</span><span className="text-[10px] capitalize text-white/42">{row.rarity || 'common'}</span><strong className="text-right text-xs text-white/62">×{row.quantity || 1}</strong><button type="button" title="Withdraw item" onClick={() => withdraw.mutate(row)} className="grid h-8 w-8 place-items-center rounded-lg text-white/25 hover:bg-red-400/10 hover:text-red-200"><Trash2 className="h-3.5 w-3.5" /></button></div>) : <div className="p-12 text-center"><Package className="mx-auto h-8 w-8 text-white/12" /><p className="mt-3 text-xs text-white/30">No matching clan inventory.</p></div>}
        </div>
      </div>
    </div>
  );
}
