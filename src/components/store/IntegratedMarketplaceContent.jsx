import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, ShieldCheck, RefreshCw, ArrowLeftRight, Wallet, Banknote } from 'lucide-react';

const rarityTone = {
  Common: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  Uncommon: 'bg-green-500/15 text-green-300 border-green-500/30',
  Rare: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  Epic: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  Legendary: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  Mythic: 'bg-red-500/15 text-red-300 border-red-500/30',
  Unique: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
};

function ListingCard({ listing, onOpen }) {
  const isCard = !!listing.card_id;
  const title = isCard ? listing.card_snapshot?.name : listing.item_name;
  const image = isCard ? listing.card_snapshot?.image : listing.item_image;
  const rarity = isCard ? listing.card_snapshot?.rarity : listing.item_rarity;
  const game = isCard ? listing.card_snapshot?.game : listing.game_name;

  return (
    <button onClick={() => onOpen(listing)} className="text-left rounded-2xl border border-white/10 bg-white/5 hover:bg-white/[0.08] hover:border-white/20 transition-all overflow-hidden">
      <div className="aspect-square bg-slate-900/70 overflow-hidden">
        {image ? <img src={image} alt={title} className="w-full h-full object-cover" /> : <div className="w-full h-full" />}
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-white font-semibold line-clamp-1">{title}</p>
            <p className="text-white/45 text-xs">{game || 'Marketplace'}</p>
          </div>
          <Badge className={rarityTone[rarity] || rarityTone.Common}>{rarity || 'Common'}</Badge>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {listing.asking_price_agp ? <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">{listing.asking_price_agp} AGP</Badge> : null}
          {listing.asking_price_usd ? <Badge className="bg-sky-500/15 text-sky-300 border-sky-500/30">${listing.asking_price_usd}</Badge> : null}
          {listing.price_agp ? <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">{listing.price_agp} AGP</Badge> : null}
          {listing.price_usd ? <Badge className="bg-sky-500/15 text-sky-300 border-sky-500/30">${listing.price_usd}</Badge> : null}
          {(listing.listing_type === 'trade_offer' || listing.listing_mode?.includes('trade')) ? (
            <Badge className="bg-violet-500/15 text-violet-300 border-violet-500/30">Trade enabled</Badge>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function EscrowCard({ session }) {
  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-white font-semibold">Escrow contract</p>
          <p className="text-white/45 text-xs">{session.session_type.replace('_', ' ')}</p>
        </div>
        <Badge className="bg-cyan-500/15 text-cyan-300 border-cyan-500/30">{session.escrow_state}</Badge>
      </div>
      <div className="grid sm:grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-white/40 text-xs mb-1">Status</p>
          <p className="text-white">{session.status}</p>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-white/40 text-xs mb-1">Payment</p>
          <p className="text-white">{session.payment_mode === 'none' ? 'Trade only' : `${session.payment_amount || 0} ${session.payment_mode}`}</p>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-white/40 text-xs mb-1">Confirmations</p>
          <p className="text-white">{session.initiator_confirmed ? '1' : '0'} / {session.recipient_confirmed ? '1' : '0'}</p>
        </div>
      </div>
    </div>
  );
}

export default function IntegratedMarketplaceContent() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [form, setForm] = useState({
    mode: 'card',
    title: '',
    type: 'Equipment',
    rarity: 'Rare',
    image: '',
    game: '',
    description: '',
    listingMode: 'sale_or_trade',
    currency: 'BOTH',
    agp: '',
    usd: '',
    wants: '',
  });

  const { data: cardListings = [] } = useQuery({
    queryKey: ['card-market-listings'],
    queryFn: async () => await base44.entities.CardTrade.filter({ status: 'active' }, '-created_date', 100),
    initialData: [],
  });

  const { data: itemListings = [] } = useQuery({
    queryKey: ['item-market-listings'],
    queryFn: async () => await base44.entities.MarketplaceItem.filter({ status: 'active' }, '-created_date', 100),
    initialData: [],
  });

  const { data: escrowSessions = [] } = useQuery({
    queryKey: ['market-escrow-sessions'],
    queryFn: async () => await base44.entities.TradeSession.list('-created_date', 50),
    initialData: [],
  });

  const createCardListing = useMutation({
    mutationFn: async (payload) => await base44.entities.CardTrade.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-market-listings'] });
      setShowCreate(false);
    },
  });

  const createItemListing = useMutation({
    mutationFn: async (payload) => await base44.entities.MarketplaceItem.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-market-listings'] });
      setShowCreate(false);
    },
  });

  const createEscrowSession = useMutation({
    mutationFn: async (payload) => await base44.entities.TradeSession.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-escrow-sessions'] });
      setSelectedListing(null);
    },
  });

  const listings = useMemo(() => {
    const merged = [...cardListings, ...itemListings];
    return merged.filter((listing) => {
      if (activeTab === 'cards' && !listing.card_id) return false;
      if (activeTab === 'items' && listing.card_id) return false;
      const label = [
        listing.card_snapshot?.name,
        listing.item_name,
        listing.game_name,
        listing.card_snapshot?.game,
        listing.item_type,
      ].join(' ').toLowerCase();
      return label.includes(search.toLowerCase());
    });
  }, [cardListings, itemListings, activeTab, search]);

  const handleCreate = () => {
    const wants = form.wants.split(',').map((item) => item.trim()).filter(Boolean);
    if (form.mode === 'card') {
      createCardListing.mutate({
        seller_id: 'current-user',
        card_id: `manual-${Date.now()}`,
        listing_type: form.listingMode === 'sale' ? 'fixed_price' : 'trade_offer',
        currency_type: form.currency,
        asking_price_agp: form.agp ? Number(form.agp) : null,
        asking_price_usd: form.usd ? Number(form.usd) : null,
        trade_preferences: wants,
        status: 'active',
        card_snapshot: {
          name: form.title,
          rarity: form.rarity,
          image: form.image,
          game: form.game,
          type: form.type,
        },
      });
      return;
    }

    createItemListing.mutate({
      seller_id: 'current-user',
      seller_name: 'Current User',
      item_name: form.title,
      item_type: form.type,
      item_rarity: form.rarity,
      item_image: form.image,
      item_description: form.description,
      game_name: form.game,
      listing_mode: form.listingMode,
      currency_type: form.currency,
      price_agp: form.agp ? Number(form.agp) : null,
      price_usd: form.usd ? Number(form.usd) : null,
      trade_preferences: wants,
      status: 'active',
    });
  };

  const openEscrow = () => {
    const isCard = !!selectedListing?.card_id;
    createEscrowSession.mutate({
      initiator_id: 'current-user',
      recipient_id: selectedListing?.seller_id || 'seller',
      listing_id: selectedListing?.id,
      session_type: isCard ? 'card_trade' : 'item_trade',
      status: 'escrow',
      payment_mode: selectedListing?.asking_price_usd ? 'USD' : selectedListing?.asking_price_agp ? 'AGP' : 'none',
      payment_amount: selectedListing?.asking_price_usd || selectedListing?.price_usd || selectedListing?.asking_price_agp || selectedListing?.price_agp || 0,
      escrow_state: 'holding',
      initiator_offer_items: [],
      recipient_offer_items: [],
    });
  };

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold">Integrated Marketplace</h1>
          <p className="text-white/45 text-sm">List cards and items for AGP, cash, or trades, then move deals into escrow contracts.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreate(true)} className="bg-cyan-500 hover:bg-cyan-600 text-black">
            <Plus className="w-4 h-4 mr-2" /> New listing
          </Button>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1.4fr,0.9fr] gap-6">
        <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/40 backdrop-blur-xl p-5">
          <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
            <div className="relative flex-1 max-w-xl">
              <Search className="w-4 h-4 text-white/35 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search cards, items, games..." className="pl-9 bg-white/5 border-white/10" />
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="cards">Cards</TabsTrigger>
                <TabsTrigger value="items">Items</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} onOpen={setSelectedListing} />
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/40 backdrop-blur-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Secure escrow contracts</h2>
              <p className="text-white/45 text-sm">Deals stay locked until both sides confirm.</p>
            </div>
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </div>

          <div className="space-y-3 max-h-[42rem] overflow-y-auto pr-1">
            {escrowSessions.map((session) => <EscrowCard key={session.id} session={session} />)}
          </div>
        </div>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create a marketplace listing</DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs text-white/45">Listing category</p>
              <div className="flex gap-2">
                <Button type="button" variant={form.mode === 'card' ? 'default' : 'outline'} onClick={() => setForm({ ...form, mode: 'card' })}>Card</Button>
                <Button type="button" variant={form.mode === 'item' ? 'default' : 'outline'} onClick={() => setForm({ ...form, mode: 'item' })}>Item</Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-white/45">Listing mode</p>
              <div className="flex gap-2 flex-wrap">
                <Button type="button" variant={form.listingMode === 'sale' ? 'default' : 'outline'} onClick={() => setForm({ ...form, listingMode: 'sale' })}><Wallet className="w-4 h-4 mr-2" />Sale</Button>
                <Button type="button" variant={form.listingMode === 'trade' ? 'default' : 'outline'} onClick={() => setForm({ ...form, listingMode: 'trade' })}><ArrowLeftRight className="w-4 h-4 mr-2" />Trade</Button>
                <Button type="button" variant={form.listingMode === 'sale_or_trade' ? 'default' : 'outline'} onClick={() => setForm({ ...form, listingMode: 'sale_or_trade' })}><RefreshCw className="w-4 h-4 mr-2" />Both</Button>
              </div>
            </div>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="bg-white/5 border-white/10" />
            <Input value={form.game} onChange={(e) => setForm({ ...form, game: e.target.value })} placeholder="Game" className="bg-white/5 border-white/10" />
            <Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="Type" className="bg-white/5 border-white/10" />
            <Input value={form.rarity} onChange={(e) => setForm({ ...form, rarity: e.target.value })} placeholder="Rarity" className="bg-white/5 border-white/10" />
            <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="Image URL" className="bg-white/5 border-white/10 md:col-span-2" />
            <div className="md:col-span-2 space-y-2">
              <p className="text-xs text-white/45">Currency</p>
              <div className="flex gap-2">
                <Button type="button" variant={form.currency === 'AGP' ? 'default' : 'outline'} onClick={() => setForm({ ...form, currency: 'AGP' })}><Wallet className="w-4 h-4 mr-2" />AGP</Button>
                <Button type="button" variant={form.currency === 'USD' ? 'default' : 'outline'} onClick={() => setForm({ ...form, currency: 'USD' })}><Banknote className="w-4 h-4 mr-2" />USD</Button>
                <Button type="button" variant={form.currency === 'BOTH' ? 'default' : 'outline'} onClick={() => setForm({ ...form, currency: 'BOTH' })}>Both</Button>
              </div>
            </div>
            <Input value={form.agp} onChange={(e) => setForm({ ...form, agp: e.target.value })} placeholder="AGP price" className="bg-white/5 border-white/10" />
            <Input value={form.usd} onChange={(e) => setForm({ ...form, usd: e.target.value })} placeholder="USD price" className="bg-white/5 border-white/10" />
            <Input value={form.wants} onChange={(e) => setForm({ ...form, wants: e.target.value })} placeholder="Trade wants, comma separated" className="bg-white/5 border-white/10 md:col-span-2" />
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="bg-white/5 border-white/10 md:col-span-2 min-h-[120px]" />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} className="bg-cyan-500 hover:bg-cyan-600 text-black">Publish listing</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedListing} onOpenChange={(open) => !open && setSelectedListing(null)}>
        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-xl">
          <DialogHeader>
            <DialogTitle>Deal workspace</DialogTitle>
          </DialogHeader>
          {selectedListing && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-lg font-semibold">{selectedListing.card_snapshot?.name || selectedListing.item_name}</p>
                <p className="text-white/45 text-sm">{selectedListing.card_snapshot?.game || selectedListing.game_name}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {(selectedListing.asking_price_agp || selectedListing.price_agp) ? <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">{selectedListing.asking_price_agp || selectedListing.price_agp} AGP</Badge> : null}
                  {(selectedListing.asking_price_usd || selectedListing.price_usd) ? <Badge className="bg-sky-500/15 text-sky-300 border-sky-500/30">${selectedListing.asking_price_usd || selectedListing.price_usd}</Badge> : null}
                  <Badge className="bg-violet-500/15 text-violet-300 border-violet-500/30">Escrow protected</Badge>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-white/40 text-xs mb-1">Buy with AGP</p>
                  <p className="text-white text-sm">Instant in-app currency checkout</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-white/40 text-xs mb-1">Buy with cash</p>
                  <p className="text-white text-sm">USD listing supported</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-white/40 text-xs mb-1">Trade flow</p>
                  <p className="text-white text-sm">Swap cards or extra items safely</p>
                </div>
              </div>
              <Button onClick={openEscrow} className="w-full bg-cyan-500 hover:bg-cyan-600 text-black">
                <ShieldCheck className="w-4 h-4 mr-2" /> Open escrow contract
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}