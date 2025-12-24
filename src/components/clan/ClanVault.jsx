import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Gem, Archive, Search, Filter, Plus, ArrowLeft, Check, Package, Sword, Shield, Sparkles, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

// Mock user inventory - in production, this would come from user's actual inventory
const mockUserInventory = [
    { id: 'inv_1', name: 'Dragonscale Armor', type: 'Armor', rarity: 'Legendary', quantity: 1, icon: '🛡️' },
    { id: 'inv_2', name: 'Void Essence', type: 'Material', rarity: 'Epic', quantity: 25, icon: '💎' },
    { id: 'inv_3', name: 'Phoenix Feather', type: 'Material', rarity: 'Rare', quantity: 10, icon: '🪶' },
    { id: 'inv_4', name: 'Health Potion', type: 'Consumable', rarity: 'Common', quantity: 50, icon: '🧪' },
    { id: 'inv_5', name: 'Mana Crystal', type: 'Material', rarity: 'Rare', quantity: 15, icon: '💠' },
    { id: 'inv_6', name: 'Shadow Blade', type: 'Weapon', rarity: 'Epic', quantity: 1, icon: '⚔️' },
    { id: 'inv_7', name: 'Ancient Rune', type: 'Material', rarity: 'Legendary', quantity: 3, icon: '📜' },
    { id: 'inv_8', name: 'Iron Ore', type: 'Material', rarity: 'Common', quantity: 100, icon: '🪨' },
    { id: 'inv_9', name: 'Enchanted Cloak', type: 'Armor', rarity: 'Rare', quantity: 1, icon: '🧥' },
    { id: 'inv_10', name: 'Fire Essence', type: 'Material', rarity: 'Epic', quantity: 8, icon: '🔥' },
];

export default function ClanVault({ clan }) {
    const vaultTabs = ["General", "Raid Supplies", "Crafting", "Officer's Cache"];

    const { user } = useAuth();
    const queryClient = useQueryClient();
    
    // View state: 'vault' or 'inventory'
    const [viewMode, setViewMode] = useState('vault');
    const [selectedItems, setSelectedItems] = useState([]);
    const [inventorySearch, setInventorySearch] = useState('');
    const [inventoryFilter, setInventoryFilter] = useState('all');

    const { data: approved = [] } = useQuery({
        queryKey: ['guildVaultApproved', clan?.id],
        queryFn: async () => {
            if (!clan?.id) return [];
            return await base44.entities.GuildResource.filter({ guild_id: clan.id, status: 'approved' });
        },
        enabled: !!clan?.id
    });

    const { data: pending = [] } = useQuery({
        queryKey: ['guildVaultPending', clan?.id],
        queryFn: async () => {
            if (!clan?.id) return [];
            return await base44.entities.GuildResource.filter({ guild_id: clan.id, status: 'pending' });
        },
        enabled: !!clan?.id
    });

    const createResource = useMutation({
        mutationFn: (payload) => base44.entities.GuildResource.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['guildVaultPending'] });
        }
    });

    const updateResource = useMutation({
        mutationFn: ({ id, data }) => base44.entities.GuildResource.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['guildVaultApproved'] });
            queryClient.invalidateQueries({ queryKey: ['guildVaultPending'] });
        }
    });

    const [openAdd, setOpenAdd] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', rarity: 'Common', quantity: 1, note: '' });
    const [activeTab, setActiveTab] = useState("General");

    // Handle item selection in inventory view
    const toggleItemSelection = (item) => {
        setSelectedItems(prev => {
            const exists = prev.find(i => i.id === item.id);
            if (exists) {
                return prev.filter(i => i.id !== item.id);
            }
            return [...prev, { ...item, depositQuantity: 1 }];
        });
    };

    const updateDepositQuantity = (itemId, quantity) => {
        setSelectedItems(prev => prev.map(item => 
            item.id === itemId ? { ...item, depositQuantity: Math.min(quantity, item.quantity) } : item
        ));
    };

    const handleDepositItems = () => {
        selectedItems.forEach(item => {
            createResource.mutate({
                guild_id: clan.id,
                contributor_id: user?.id,
                resource_type: 'item',
                item_id: item.name,
                amount: item.depositQuantity,
                note: `Deposited from inventory`,
                status: 'pending'
            });
        });
        setSelectedItems([]);
        setViewMode('vault');
    };

    // Filter inventory
    const filteredInventory = mockUserInventory.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(inventorySearch.toLowerCase());
        const matchesFilter = inventoryFilter === 'all' || item.type.toLowerCase() === inventoryFilter;
        return matchesSearch && matchesFilter;
    });

    const items = approved.map((r, i) => ({
        id: r.id,
        name: r.item_id || `Item ${i + 1}`,
        rarity: 'Common',
        quantity: r.amount || 1,
        icon: `https://api.dicebear.com/7.x/shapes/svg?seed=${i}`
    }));

    const rarityColors = {
        Common: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
        Rare: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
        Epic: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
        Legendary: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
    };

    // Inventory View
    if (viewMode === 'inventory') {
        return (
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="flex-1 p-8 flex flex-col h-full overflow-hidden"
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => { setViewMode('vault'); setSelectedItems([]); }}
                            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Package className="w-6 h-6 text-blue-400" /> Select Items to Deposit
                            </h1>
                            <p className="text-white/50 text-sm">Choose items from your inventory to add to the guild vault</p>
                        </div>
                    </div>
                    
                    {selectedItems.length > 0 && (
                        <Button 
                            onClick={handleDepositItems}
                            className="bg-green-600 hover:bg-green-700 text-white gap-2"
                        >
                            <Check className="w-4 h-4" />
                            Deposit {selectedItems.length} Item{selectedItems.length > 1 ? 's' : ''}
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input 
                            placeholder="Search inventory..." 
                            value={inventorySearch}
                            onChange={(e) => setInventorySearch(e.target.value)}
                            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                        />
                    </div>
                    <div className="flex gap-2">
                        {['all', 'weapon', 'armor', 'material', 'consumable'].map(filter => (
                            <button
                                key={filter}
                                onClick={() => setInventoryFilter(filter)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    inventoryFilter === filter 
                                        ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50' 
                                        : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                                }`}
                            >
                                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Selected Items Bar */}
                {selectedItems.length > 0 && (
                    <div className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-green-300 font-medium text-sm">Selected Items ({selectedItems.length})</span>
                            <button 
                                onClick={() => setSelectedItems([])}
                                className="text-white/40 hover:text-white text-xs"
                            >
                                Clear All
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {selectedItems.map(item => (
                                <div key={item.id} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
                                    <span className="text-lg">{item.icon}</span>
                                    <span className="text-white text-sm">{item.name}</span>
                                    <input
                                        type="number"
                                        min={1}
                                        max={item.quantity}
                                        value={item.depositQuantity}
                                        onChange={(e) => updateDepositQuantity(item.id, parseInt(e.target.value) || 1)}
                                        className="w-14 bg-white/10 border border-white/20 rounded px-2 py-0.5 text-white text-sm text-center"
                                    />
                                    <button 
                                        onClick={() => toggleItemSelection(item)}
                                        className="text-white/40 hover:text-red-400"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Inventory Grid */}
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {filteredInventory.map(item => {
                            const isSelected = selectedItems.some(i => i.id === item.id);
                            const rarityColors = {
                                Common: 'border-slate-500/30 bg-slate-500/10',
                                Rare: 'border-blue-500/30 bg-blue-500/10',
                                Epic: 'border-purple-500/30 bg-purple-500/10',
                                Legendary: 'border-orange-500/30 bg-orange-500/10',
                            };
                            
                            return (
                                <motion.div
                                    key={item.id}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => toggleItemSelection(item)}
                                    className={`relative aspect-square rounded-xl border-2 p-3 flex flex-col items-center justify-center cursor-pointer transition-all ${
                                        isSelected 
                                            ? 'border-green-400 bg-green-500/20 ring-2 ring-green-400/50' 
                                            : rarityColors[item.rarity]
                                    }`}
                                >
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/30 text-white/70">
                                        x{item.quantity}
                                    </div>
                                    <span className="text-3xl mb-2">{item.icon}</span>
                                    <div className="text-center">
                                        <div className="text-xs font-bold text-white truncate max-w-full">{item.name}</div>
                                        <div className={`text-[10px] uppercase tracking-wider font-semibold mt-0.5 ${
                                            item.rarity === 'Legendary' ? 'text-orange-400' : 
                                            item.rarity === 'Epic' ? 'text-purple-400' :
                                            item.rarity === 'Rare' ? 'text-blue-400' : 'text-slate-400'
                                        }`}>
                                            {item.rarity}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="flex-1 p-8 flex flex-col h-full overflow-hidden">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Archive className="w-8 h-8 text-amber-500" /> Guild Vault
                    </h1>
                    <p className="text-white/50 mt-1">Manage communal resources and spoils of war.</p>
                </div>
                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-sm">
                    {/* Add to Vault - Now transitions to inventory */}
                    <Button 
                        onClick={() => setViewMode('inventory')} 
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add to Vault
                    </Button>
                    <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-amber-500" />
                        <span className="font-mono font-bold text-white text-lg">1,240,500</span>
                        <span className="text-xs text-white/50 uppercase font-bold">Gold</span>
                    </div>
                    <div className="w-px h-6 bg-white/20" />
                    <div className="flex items-center gap-2">
                        <Gem className="w-4 h-4 text-purple-500" />
                        <span className="font-mono font-bold text-white text-lg">450</span>
                        <span className="text-xs text-white/50 uppercase font-bold">Gems</span>
                    </div>
                </div>
            </div>

            {/* Vault Container */}
            <div className="flex-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden flex flex-col shadow-sm">
                {/* Tabs */}
                <div className="flex items-center gap-1 p-2 border-b border-white/10 bg-white/5">
                    {vaultTabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                                activeTab === tab 
                                    ? 'bg-white/10 text-white shadow-md ring-1 ring-white/20' 
                                    : 'text-white/50 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                    <div className="ml-auto flex items-center gap-2 px-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                            <input 
                                placeholder="Search vault..." 
                                className="bg-white/10 border border-white/20 rounded-lg pl-9 pr-4 py-1.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 w-48"
                            />
                        </div>
                        <button className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors border border-transparent hover:border-white/20">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Pending Approvals */}
                {pending.length > 0 && (
                  <div className="px-6 pt-4">
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
                      <h3 className="font-bold text-amber-300 mb-2 text-sm">Pending Member Deposits</h3>
                      <div className="space-y-2">
                        {pending.map((p) => (
                          <div key={p.id} className="flex items-center justify-between bg-white/5 rounded-lg border border-amber-500/20 px-3 py-2">
                            <div className="text-sm text-white">
                              <span className="font-semibold">{p.item_id || 'Item'}</span>
                              <span className="text-white/40"> × {p.amount || 1}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateResource.mutate({ id: p.id, data: { status: 'approved', approved_by: user?.id, approved_at: new Date().toISOString() } })}>Accept</Button>
                              <Button size="sm" variant="outline" className="border-white/20 text-white/70" onClick={() => updateResource.mutate({ id: p.id, data: { status: 'rejected', approved_by: user?.id, approved_at: new Date().toISOString() } })}>Reject</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {items.map(item => (
                            <motion.div
                                key={item.id}
                                whileHover={{ scale: 1.02, y: -2 }}
                                className={`relative aspect-square rounded-2xl border ${rarityColors[item.rarity].split(' ')[0]} bg-white/5 p-3 flex flex-col items-center justify-center gap-2 cursor-pointer group shadow-sm hover:shadow-md transition-all`}
                            >
                                <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold border ${rarityColors[item.rarity]}`}>
                                    {item.quantity}x
                                </div>
                                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center border border-white/20 group-hover:border-blue-400/50 transition-colors">
                                    <Archive className="w-6 h-6 text-white/40 group-hover:text-blue-400 transition-colors" />
                                </div>
                                <div className="text-center w-full px-1">
                                    <div className="text-xs font-bold text-white truncate">{item.name}</div>
                                    <div className={`text-[10px] uppercase tracking-wider font-semibold mt-1 ${
                                        item.rarity === 'Legendary' ? 'text-orange-400' : 
                                        item.rarity === 'Epic' ? 'text-purple-400' :
                                        item.rarity === 'Rare' ? 'text-blue-400' : 'text-white/40'
                                    }`}>
                                        {item.rarity}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {/* Empty Slots */}
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square rounded-2xl border border-dashed border-white/20 bg-white/5 flex items-center justify-center">
                                <div className="w-8 h-8 text-white/20">
                                    <PlusIcon className="w-full h-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Footer Controls */}
                <div className="p-4 border-t border-white/10 bg-white/5 flex justify-between items-center text-xs text-white/50 font-mono">
                    <div>
                        Capacity: 24/100 Slots
                    </div>
                    <div className="flex gap-4 font-sans font-bold">
                        <button className="hover:text-blue-400 transition-colors">View Logs</button>
                        <button className="hover:text-blue-400 transition-colors">Permissions</button>
                    </div>
                </div>
            </div>

            {/* Add to Vault Dialog */}
            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle>Add Item to Guild Vault</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Item Name</label>
                    <Input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="e.g. Ancient Artifact" />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Rarity</label>
                      <Select value={newItem.rarity} onValueChange={(v) => setNewItem({ ...newItem, rarity: v })}>
                        <SelectTrigger><SelectValue placeholder="Select rarity" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Common">Common</SelectItem>
                          <SelectItem value="Rare">Rare</SelectItem>
                          <SelectItem value="Epic">Epic</SelectItem>
                          <SelectItem value="Legendary">Legendary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-32">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Quantity</label>
                      <Input type="number" min={1} value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value || '1', 10) })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Note (optional)</label>
                    <Input value={newItem.note} onChange={(e) => setNewItem({ ...newItem, note: e.target.value })} placeholder="e.g. For raid supplies" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenAdd(false)}>Cancel</Button>
                  <Button
                    onClick={() => {
                      if (!clan?.id || !user?.id || !newItem.name) return;
                      createResource.mutate({
                        guild_id: clan.id,
                        contributor_id: user.id,
                        resource_type: 'item',
                        item_id: newItem.name,
                        amount: newItem.quantity,
                        note: newItem.note,
                        status: 'pending'
                      });
                      setOpenAdd(false);
                      setNewItem({ name: '', rarity: 'Common', quantity: 1, note: '' });
                    }}
                  >Submit</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>
    );
}

const PlusIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);