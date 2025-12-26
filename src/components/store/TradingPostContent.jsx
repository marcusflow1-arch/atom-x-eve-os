import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Globe, Sword, Shield, Zap, Sparkles, ScrollText, Hammer, Database,
  SlidersHorizontal, ChevronLeft, ChevronRight, Grid, List, Rocket, Crosshair, 
  DollarSign, ArrowLeftRight, Lock, Star, AlertTriangle, Scale, FileText, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '../auth/AuthContext';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Game } from '@/entities/Game';
import InventoryItemOverlay from './InventoryItemOverlay';

// --- Reputation Component ---
const ReputationBadge = ({ score, tier }) => {
  const tiers = {
    'S': { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
    'A': { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
    'B': { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    'C': { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
    'D': { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30' },
  };
  const style = tiers[tier] || tiers['D'];

  return (
    <div className={`flex items-center gap-2 px-2 py-1 rounded-lg border ${style.bg} ${style.border}`}>
      <Shield className={`w-3 h-3 ${style.color}`} />
      <span className={`text-xs font-bold ${style.color}`}>Tier {tier}</span>
      <span className="text-[10px] text-white/40">({score}%)</span>
    </div>
  );
};

// --- Escrow / Anti-Scam Visuals ---
const SecurityBadge = () => (
  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 rounded border border-green-500/20 text-[10px] text-green-400 font-medium">
    <Lock className="w-3 h-3" />
    <span>Escrow Secured</span>
  </div>
);

// --- Listing Card ---
const ListingCard = ({ offer, onClick }) => (
  <div 
    onClick={() => onClick(offer)}
    className="group bg-slate-900/40 border border-white/10 hover:border-white/20 rounded-xl p-4 cursor-pointer transition-all hover:bg-slate-800/50"
  >
    <div className="flex gap-4">
      {/* Item Image */}
      <div className="w-20 h-20 rounded-lg bg-black/50 overflow-hidden relative border border-white/5">
        <img src={offer.item_image} alt={offer.item_name} className="w-full h-full object-cover" />
        <div className="absolute top-0 left-0 px-1.5 py-0.5 bg-black/60 text-[9px] text-white font-bold backdrop-blur-sm border-r border-b border-white/10 rounded-br">
          LV.{offer.item_level}
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-white font-bold text-sm truncate pr-2 group-hover:text-blue-400 transition-colors">{offer.item_name}</h3>
            <Badge variant="outline" className="text-[9px] h-5 border-white/10 text-white/50">{offer.item_rarity}</Badge>
          </div>
          <p className="text-white/40 text-xs truncate">{offer.game_name}</p>
        </div>

        <div className="flex items-end justify-between mt-2">
          {/* Seller Info */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full overflow-hidden border border-white/10">
              <img src={offer.trader_avatar} className="w-full h-full object-cover" />
            </div>
            <span className="text-xs text-white/70">{offer.trader_name}</span>
            <ReputationBadge score={98} tier="A" />
          </div>

          {/* Price / Type */}
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end mb-0.5">
              {offer.offer_type === 'sale' && <Badge className="bg-green-500/20 text-green-400 border-none text-[9px]">SELL</Badge>}
              {offer.offer_type === 'trade' && <Badge className="bg-blue-500/20 text-blue-400 border-none text-[9px]">TRADE</Badge>}
              {offer.offer_type === 'bail' && <Badge className="bg-orange-500/20 text-orange-400 border-none text-[9px]">BAIL</Badge>}
            </div>
            {offer.price && <span className="text-white font-bold font-mono">{offer.price.toLocaleString()} AGP</span>}
          </div>
        </div>
      </div>
    </div>
    
    {/* Footer: Security & Status */}
    <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
      <SecurityBadge />
      <span className="text-[10px] text-white/30">Expires in 2d</span>
    </div>
  </div>
);

// --- Create Listing Modal ---
const CreateListingModal = ({ isOpen, onClose, item }) => {
  const [type, setType] = useState('sale'); // sale, trade, bail, keep
  const [price, setPrice] = useState('');
  const [seeking, setSeeking] = useState('');
  const [bailDuration, setBailDuration] = useState('3'); // days
  const [bailCollateral, setBailCollateral] = useState('');

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 border border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-400" />
            Create Contract
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Selected Item Summary */}
          <div className="flex gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
            <img src={item.image} className="w-16 h-16 rounded-lg object-cover" />
            <div>
              <h4 className="font-bold">{item.name}</h4>
              <p className="text-xs text-white/50">{item.rarity} • {item.type}</p>
            </div>
          </div>

          {/* Type Selector */}
          <Tabs value={type} onValueChange={setType}>
            <TabsList className="grid grid-cols-4 bg-white/5">
              <TabsTrigger value="sale">Sell</TabsTrigger>
              <TabsTrigger value="trade">Trade</TabsTrigger>
              <TabsTrigger value="bail">Bail</TabsTrigger>
              <TabsTrigger value="keep" disabled>Keep</TabsTrigger>
            </TabsList>

            <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/5">
              <TabsContent value="sale" className="mt-0 space-y-4">
                <div>
                  <label className="text-xs uppercase font-bold text-white/50 mb-1.5 block">Price (AGP)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      className="bg-black/50 border-white/10 pl-9" 
                    />
                  </div>
                  <p className="text-[10px] text-white/30 mt-1">Platform fee: 5%</p>
                </div>
              </TabsContent>

              <TabsContent value="trade" className="mt-0 space-y-4">
                <div>
                  <label className="text-xs uppercase font-bold text-white/50 mb-1.5 block">Seeking Items</label>
                  <Textarea 
                    placeholder="List items you are looking for..." 
                    value={seeking}
                    onChange={e => setSeeking(e.target.value)}
                    className="bg-black/50 border-white/10 h-24"
                  />
                </div>
              </TabsContent>

              <TabsContent value="bail" className="mt-0 space-y-4">
                <div className="flex items-center gap-2 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg mb-4">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <p className="text-xs text-orange-200">Item is loaned for a set duration. Collateral is held in escrow.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs uppercase font-bold text-white/50 mb-1.5 block">Duration (Days)</label>
                    <Input type="number" value={bailDuration} onChange={e => setBailDuration(e.target.value)} className="bg-black/50 border-white/10" />
                  </div>
                  <div>
                    <label className="text-xs uppercase font-bold text-white/50 mb-1.5 block">Collateral (AGP)</label>
                    <Input type="number" value={bailCollateral} onChange={e => setBailCollateral(e.target.value)} className="bg-black/50 border-white/10" />
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5" />
            <div className="text-xs text-blue-200">
              <p className="font-bold mb-0.5">Secure Contract</p>
              <p className="opacity-80">This transaction will be logged on the platform. Escrow services prevent fraud.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 border-white/10 hover:bg-white/5">Cancel</Button>
            <Button className="flex-1 bg-white text-black font-bold hover:bg-white/90">Create Listing</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- Main Page ---
export default function TradingPostContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);

  // Mock Data
  const listings = [
    { id: 1, item_name: 'Void Blade', item_rarity: 'Legendary', item_level: 50, item_image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop', game_name: 'Elder Scrolls', trader_name: 'TraderJo', trader_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop', offer_type: 'sale', price: 5000 },
    { id: 2, item_name: 'Cyber Core', item_rarity: 'Epic', item_level: 25, item_image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=200&fit=crop', game_name: 'Cyberpunk 2088', trader_name: 'NeonSamurai', trader_avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=64&h=64&fit=crop', offer_type: 'trade' },
    { id: 3, item_name: 'Ancient Tome', item_rarity: 'Rare', item_level: 10, item_image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=200&h=200&fit=crop', game_name: 'Mage Wars', trader_name: 'Wizard101', trader_avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=64&h=64&fit=crop', offer_type: 'bail', price: 500 }, // Bail price is fee
  ];

  return (
    <div className="flex flex-col h-screen max-h-[calc(100vh-80px)] p-6 gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <ArrowLeftRight className="w-8 h-8 text-cyan-400" />
            Trading Post
          </h1>
          <p className="text-white/40 text-sm mt-1">Player-to-Player Economy • Secure Contracts • Reputation System</p>
        </div>
        
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] uppercase text-white/40 font-bold">Your Rep</p>
              <p className="text-sm font-bold text-white">Tier A <span className="text-green-400">(98%)</span></p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-white/5 border border-white/10 p-1 rounded-full">
            <TabsTrigger value="browse" className="rounded-full px-6 data-[state=active]:bg-blue-600">Browse Listings</TabsTrigger>
            <TabsTrigger value="inventory" className="rounded-full px-6 data-[state=active]:bg-blue-600">My Inventory</TabsTrigger>
            <TabsTrigger value="active" className="rounded-full px-6 data-[state=active]:bg-blue-600">Active Contracts</TabsTrigger>
          </TabsList>

          <div className="flex gap-3">
            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 gap-2">
              <Filter className="w-4 h-4" /> Filter
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input placeholder="Search..." className="pl-9 w-64 bg-white/5 border-white/10" />
            </div>
          </div>
        </div>

        <TabsContent value="browse" className="flex-1 min-h-0 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-6 custom-scrollbar h-full">
            {listings.map(offer => (
              <ListingCard key={offer.id} offer={offer} onClick={(o) => console.log('Clicked', o)} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="flex-1 min-h-0 mt-0">
          <div className="flex flex-col h-full items-center justify-center text-white/30 border-2 border-dashed border-white/10 rounded-2xl">
            <Database className="w-12 h-12 mb-4 opacity-50" />
            <p>Connect inventory to create listings</p>
            <Button className="mt-4 bg-white text-black hover:bg-white/90" onClick={() => setShowCreateModal(true)}>
              Mock Create Listing
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="active" className="flex-1 min-h-0 mt-0">
          <div className="flex flex-col h-full items-center justify-center text-white/30">
            <FileText className="w-12 h-12 mb-4 opacity-50" />
            <p>No active contracts</p>
          </div>
        </TabsContent>
      </Tabs>

      <CreateListingModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        item={{ name: 'Sample Item', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=200&h=200&fit=crop', rarity: 'Legendary', type: 'Weapon' }} 
      />
    </div>
  );
}