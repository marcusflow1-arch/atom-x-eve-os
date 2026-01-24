import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import VirtualizedTradeGrid from "@/components/store/VirtualizedTradeGrid";
import ProFilterSidebar from "@/components/clan/ProFilterSidebar";
import { X, Gamepad2, Shield, Zap, Gem, FlaskConical, Package, Info } from "lucide-react";

const rarityStyles = {
  Common: { ring: "ring-slate-500/40", text: "text-slate-300" },
  Uncommon: { ring: "ring-green-500/40", text: "text-green-300" },
  Rare: { ring: "ring-blue-500/40", text: "text-blue-300" },
  Epic: { ring: "ring-purple-500/40", text: "text-purple-300" },
  Legendary: { ring: "ring-orange-500/40", text: "text-orange-300" },
  Mythic: { ring: "ring-red-500/40", text: "text-red-300" },
};

const sampleItems = [
  { id: "e1", name: "Void Emperor Helm", type: "Gear", rarity: "Mythic", icon: "🛡️", qty: 1, stats: { Defense: 48, MagicRes: 22 } },
  { id: "e2", name: "Cyber Katana", type: "Gear", rarity: "Epic", icon: "⚔️", qty: 1, stats: { Attack: 85, Speed: 95 } },
  { id: "m1", name: "Void Crystal", type: "Materials", rarity: "Rare", icon: "💎", qty: 57 },
  { id: "c1", name: "Elixir of Focus", type: "Consumables", rarity: "Uncommon", icon: "🧪", qty: 9 },
  { id: "q1", name: "Ancient Relic Piece", type: "Quest", rarity: "Legendary", icon: "📜", qty: 3 },
  { id: "o1", name: "Phoenix Feather", type: "Misc", rarity: "Legendary", icon: "🔥", qty: 2 },
  { id: "m2", name: "Enchanted Ore", type: "Materials", rarity: "Uncommon", icon: "🪨", qty: 120 },
  { id: "c2", name: "Mega Health Pack", type: "Consumables", rarity: "Rare", icon: "➕", qty: 4 },
  { id: "e3", name: "Aegis Shield", type: "Gear", rarity: "Legendary", icon: "🛡️", qty: 1, stats: { Block: 32 } },
  { id: "e4", name: "Arcane Tome", type: "Gear", rarity: "Epic", icon: "📘", qty: 1, stats: { Power: 36, Cooldown: -8 } },
];

const tabs = [
  { id: "all", label: "All", icon: Package },
  { id: "Gear", label: "Gear", icon: Shield },
  { id: "Materials", label: "Materials", icon: Gem },
  { id: "Consumables", label: "Consumables", icon: FlaskConical },
  { id: "Quest", label: "Quest", icon: Info },
  { id: "Misc", label: "Misc", icon: Gamepad2 },
];

export default function ClanInventoryModal({ open, onOpenChange, items }) {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cols, setCols] = useState(8);
  const gridRef = useRef(null);

  const [filters, setFilters] = useState({ category: 'all', rarity: [], priceRange: [0, 10000] });

  const data = items && items.length ? items : sampleItems;

  const visibleItems = useMemo(() => {
    if (activeTab === "all") return data;
    return data.filter((i) => i.type === activeTab);
  }, [data, activeTab]);

  const gridItems = useMemo(() => {
    return visibleItems.map((i, idx) => ({
      id: i.id || String(idx),
      name: i.name,
      type: i.type,
      rarity: i.rarity,
      image: i.image || "https://images.unsplash.com/photo-1542751371-331572b78519?w=600&h=600&fit=crop",
      game: i.game || "Clan Supply",
      marketPrice: i.stats?.Power || i.stats?.Attack || i.stats?.Defense || i.qty * 100 || 500
    }));
  }, [visibleItems]);

  const filteredGridItems = useMemo(() => {
    const cat = filters.category;
    return gridItems.filter((item) => {
      // Category
      if (cat !== 'all' && cat !== 'global') {
        if (cat === 'weapon' && item.type !== 'Gear' && !/sword|katana|rifle|weapon/i.test(item.name)) return false;
        if (cat === 'armor' && item.type !== 'Gear' && !/armor|shield/i.test(item.name)) return false;
        if (cat === 'consumable' && item.type !== 'Consumables') return false;
        if (cat === 'material' && item.type !== 'Materials') return false;
        if (cat === 'magic' && !/spell|tome|arcane|magic/i.test(item.name)) return false;
        if (cat === 'tech' && !/cyber|quantum|core|tech/i.test(item.name)) return false;
        if (cat === 'blueprint' && !/blueprint|schematic/i.test(item.name)) return false;
      }
      // Rarity
      if (filters.rarity.length > 0 && !filters.rarity.includes(item.rarity)) return false;
      // Value
      if (item.marketPrice < filters.priceRange[0] || item.marketPrice > filters.priceRange[1]) return false;
      return true;
    });
  }, [gridItems, filters]);

  // Determine columns by viewport width for controller navigation
  useEffect(() => {
    const computeCols = () => {
      const w = window.innerWidth;
      if (w >= 1280) setCols(8);
      else if (w >= 1024) setCols(6);
      else if (w >= 640) setCols(4);
      else setCols(2);
    };
    computeCols();
    window.addEventListener("resize", computeCols);
    return () => window.removeEventListener("resize", computeCols);
  }, []);

  // Reset selection when tab changes or modal opens
  useEffect(() => {
    if (open) setSelectedIndex(0);
  }, [open, activeTab]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === "ArrowRight") setSelectedIndex((i) => Math.min(i + 1, visibleItems.length - 1));
      if (e.key === "ArrowLeft") setSelectedIndex((i) => Math.max(i - 1, 0));
      if (e.key === "ArrowDown") setSelectedIndex((i) => Math.min(i + cols, visibleItems.length - 1));
      if (e.key === "ArrowUp") setSelectedIndex((i) => Math.max(i - cols, 0));
      if (e.key === "Home") setSelectedIndex(0);
      if (e.key === "End") setSelectedIndex(visibleItems.length - 1);
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, cols, visibleItems.length, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="p-0 max-w-[1100px] w-[95vw] h-[85vh] border-white/10 overflow-hidden text-white" style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)",
        backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
      }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-black leading-tight">Clan Inventory</h2>
              <p className="text-xs text-white/50 -mt-0.5">Arrow Keys to navigate • Enter to select • Esc to close</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-white/60 hover:text-white" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white/5 border border-white/10">
              {tabs.map((t) => (
                <TabsTrigger key={t.id} value={t.id} className="gap-2">
                  <t.icon className="w-3.5 h-3.5" /> {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* ProGrid Layout: Filters + Virtualized Grid */}
        <div className="flex-1 overflow-hidden p-5">
          <div className="h-full grid grid-cols-12 gap-5">
            <div className="col-span-12 lg:col-span-3">
              <ProFilterSidebar filters={filters} setFilters={setFilters} />
            </div>
            <div className="col-span-12 lg:col-span-9 h-full">
              <VirtualizedTradeGrid items={filteredGridItems} onSelectItem={() => {}} />
            </div>
          </div>
        </div>

        {/* Footer legend */}
        <div className="px-5 py-3 border-t border-white/10 text-[11px] text-white/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>Arrows: Move</span>
            <span>Enter: Select</span>
            <span>Esc: Close</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/40">Total Items:</span>
            <span className="text-white font-semibold">{visibleItems.length}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}