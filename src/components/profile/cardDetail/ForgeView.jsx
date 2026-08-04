import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hammer, TrendingUp, Sparkles, Merge, Crown, ArrowLeftRight, Zap, Package, Flame, Star } from 'lucide-react';
import GlassPanel from './GlassPanel';
import TiltCard from './TiltCard';
import { LevelPanel, EnhancePanel, CombinePanel, AscendPanel, TradePanelView } from './ForgeSystemPanels';
import { MaterialCard } from '@/components/blacksmith/MaterialSystem';
import { MarketValueDisplay } from '@/components/blacksmith/MarketValuation';
import TradingPanel from '@/components/blacksmith/TradingPanel';
import { calculateEvolutionTier, EvolutionBadge, EvolutionPreview } from '@/components/blacksmith/CardVisualEvolution';
import { NFCInfoPanel } from '@/components/blacksmith/NFCCardSync';

const UPGRADE_SYSTEMS = [
  { id: 'level', name: 'Level', icon: TrendingUp },
  { id: 'enhance', name: 'Enhance', icon: Sparkles },
  { id: 'combine', name: 'Combine', icon: Merge },
  { id: 'ascend', name: 'Ascend', icon: Crown },
  { id: 'trade', name: 'Trade', icon: ArrowLeftRight },
];

const MOCK_MATERIALS = [
  { id: 'gold', material_type: 'gold', name: 'Gold', icon: '🪙', quantity: 25000, rarity: 'Currency' },
  { id: 'precision_shard', material_type: 'precision_shard', quantity: 45, rarity: 'Rare' },
  { id: 'combat_core', material_type: 'combat_core', quantity: 28, rarity: 'Epic' },
  { id: 'ascension_core', material_type: 'ascension_core', quantity: 8, rarity: 'Epic' },
  { id: 'skill_catalyst', material_type: 'skill_catalyst', quantity: 35, rarity: 'Rare' },
  { id: 'fusion_currency', material_type: 'fusion_currency', quantity: 120, rarity: 'Uncommon' },
  { id: 'wildcard', material_type: 'wildcard', quantity: 5, rarity: 'Legendary' },
];

const generateDuplicates = (card) =>
  Array.from({ length: 4 }, (_, i) => ({ id: `dup-${i}`, ...card, level: Math.floor(Math.random() * 10) + 1 }));

export default function ForgeView({ card }) {
  const [activeSystem, setActiveSystem] = useState('level');
  const [cardLevel, setCardLevel] = useState(card?.level || 1);
  const [cardStars, setCardStars] = useState(card?.stars || 1);
  const [cardAscension, setCardAscension] = useState(card?.ascension || 0);
  const [enhancedStats, setEnhancedStats] = useState({ attack: 0, defense: 0, magic: 0 });
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [materials, setMaterials] = useState(MOCK_MATERIALS);
  const [showTradePanel, setShowTradePanel] = useState(false);
  const [selectedDuplicates, setSelectedDuplicates] = useState([]);

  const duplicates = useMemo(() => generateDuplicates(card), [card]);

  const baseStats = useMemo(() => ({
    attack: 100 + (cardLevel * 15) + (cardAscension * 50) + enhancedStats.attack,
    defense: 80 + (cardLevel * 12) + (cardAscension * 40) + enhancedStats.defense,
    magic: 90 + (cardLevel * 10) + (cardAscension * 30) + enhancedStats.magic,
    power: Math.floor((100 + (cardLevel * 15) + 80 + (cardLevel * 12) + 90 + (cardLevel * 10)) * (1 + cardAscension * 0.2) * (1 + cardStars * 0.1)),
  }), [cardLevel, cardStars, cardAscension, enhancedStats]);

  const maxLevel = 10 + (cardAscension * 10);
  const levelCost = cardLevel * 100;
  const gold = materials.find((m) => m.id === 'gold')?.quantity || 0;
  const canLevelUp = cardLevel < maxLevel && gold >= levelCost;
  const canAscend = cardLevel >= maxLevel && cardAscension < 5;
  const ascensionCost = (cardAscension + 1) * 5000;

  const flash = () => { setShowSuccess(true); setTimeout(() => setShowSuccess(false), 1500); };
  const spendGold = (cost) => setMaterials((prev) => prev.map((m) => m.id === 'gold' ? { ...m, quantity: m.quantity - cost } : m));

  const handleLevelUp = () => {
    if (!canLevelUp) return;
    setIsUpgrading(true);
    setTimeout(() => { setCardLevel((p) => p + 1); spendGold(levelCost); setIsUpgrading(false); flash(); }, 800);
  };

  const handleEnhance = (stat) => {
    if (gold < 500) return;
    setIsUpgrading(true);
    setTimeout(() => { setEnhancedStats((p) => ({ ...p, [stat]: p[stat] + 10 })); spendGold(500); setIsUpgrading(false); flash(); }, 600);
  };

  const handleCombine = () => {
    if (selectedDuplicates.length < 1) return;
    setIsUpgrading(true);
    setTimeout(() => { setCardStars((p) => Math.min(p + selectedDuplicates.length, 5)); setSelectedDuplicates([]); setIsUpgrading(false); flash(); }, 1000);
  };

  const handleAscend = () => {
    if (!canAscend || gold < ascensionCost) return;
    setIsUpgrading(true);
    setTimeout(() => { setCardAscension((p) => p + 1); spendGold(ascensionCost); setIsUpgrading(false); flash(); }, 1200);
  };

  const liveCard = { ...card, level: cardLevel, stars: cardStars, ascension: cardAscension, enhanced_stats: enhancedStats };

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-5 flex-shrink-0 flex-wrap">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-orange-500/15 border border-orange-400/30 flex items-center justify-center shadow-[0_0_24px_rgba(249,115,22,0.25)]">
            <Hammer className="w-5 h-5 text-orange-300" />
          </div>
          <div>
            <h3 className="text-white font-black text-2xl tracking-tight leading-none">The Forge</h3>
            <p className="text-white/45 text-sm mt-0.5">Shape your card's true potential</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {materials.slice(0, 2).map((mat) => (
            <div key={mat.id} className="flex items-center gap-2 h-9 px-3.5 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md">
              <span className="text-sm">{mat.icon || '💠'}</span>
              <span className="text-white font-bold text-sm tabular-nums">{mat.quantity.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        {/* LEFT — card */}
        <div className="w-[270px] flex-shrink-0 flex flex-col items-center overflow-y-auto pr-1">
          <div className="relative w-full">
            <AnimatePresence>
              {showSuccess && (
                <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1.35, opacity: [0, 0.9, 0] }} exit={{ opacity: 0 }}
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-300/50 to-orange-500/50 z-30 pointer-events-none" />
              )}
            </AnimatePresence>
            {isUpgrading && (
              <motion.div className="absolute inset-0 rounded-2xl z-20 pointer-events-none"
                animate={{ boxShadow: ['0 0 30px rgba(251,146,60,0.3)', '0 0 60px rgba(251,146,60,0.65)', '0 0 30px rgba(251,146,60,0.3)'] }}
                transition={{ duration: 0.4, repeat: Infinity }} />
            )}
            <TiltCard card={card} level={cardLevel} stars={cardStars} ascension={cardAscension} />
          </div>

          <div className="mt-5 text-center w-full">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Total Power</p>
            <div className="flex items-center justify-center gap-2">
              <Flame className="w-6 h-6 text-orange-400" />
              <span className="text-4xl font-black text-white tabular-nums">{baseStats.power.toLocaleString()}</span>
            </div>
            <div className="mt-2.5 flex justify-center">
              <EvolutionBadge tier={calculateEvolutionTier({ level: cardLevel, stars: cardStars, ascension: cardAscension })} />
            </div>
          </div>
        </div>

        {/* CENTER — systems */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex gap-1.5 mb-4 p-1.5 rounded-2xl overflow-x-auto scrollbar-hide"
            style={{ background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
            {UPGRADE_SYSTEMS.map((sys) => {
              const on = activeSystem === sys.id;
              return (
                <button key={sys.id} onClick={() => setActiveSystem(sys.id)}
                  className={`relative flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl whitespace-nowrap transition-colors ${on ? 'text-black' : 'text-white/45 hover:text-white'}`}>
                  {on && <motion.div layoutId="forge-tab" className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-300 to-orange-400" transition={{ type: 'spring', damping: 26, stiffness: 320 }} />}
                  <sys.icon className="w-4 h-4 relative" />
                  <span className="font-bold text-sm relative">{sys.name}</span>
                </button>
              );
            })}
          </div>

          <GlassPanel className="flex-1 min-h-0 overflow-y-auto custom-scrollbar" padded={false}>
            <div className="p-6 h-full">
              <AnimatePresence mode="wait">
                {activeSystem === 'level' && <LevelPanel {...{ cardLevel, maxLevel, baseStats, canLevelUp, isUpgrading, levelCost }} onLevelUp={handleLevelUp} />}
                {activeSystem === 'enhance' && <EnhancePanel {...{ enhancedStats, isUpgrading }} onEnhance={handleEnhance} />}
                {activeSystem === 'combine' && <CombinePanel {...{ cardStars, duplicates, card, selectedDuplicates, setSelectedDuplicates, isUpgrading }} onCombine={handleCombine} StarIcon={Star} />}
                {activeSystem === 'ascend' && <AscendPanel {...{ cardAscension, canAscend, isUpgrading, ascensionCost }} onAscend={handleAscend} />}
                {activeSystem === 'trade' && <TradePanelView liveCard={liveCard} onOpenTrade={() => setShowTradePanel(true)} />}
              </AnimatePresence>
            </div>
          </GlassPanel>
        </div>

        {/* RIGHT — stats & materials */}
        <div className="w-[255px] flex-shrink-0 flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
          <MarketValueDisplay card={liveCard} />

          <GlassPanel>
            <h4 className="text-white font-bold mb-4 flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-amber-300" /> Card Stats
            </h4>
            <div className="space-y-2.5">
              {Object.entries(baseStats).map(([stat, value]) => (
                <div key={stat} className="flex items-center justify-between">
                  <span className="text-white/50 capitalize text-xs">{stat}</span>
                  <span className="text-white font-bold text-sm tabular-nums">{value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel>
            <h4 className="text-white font-bold mb-4 flex items-center gap-2 text-sm">
              <Package className="w-4 h-4 text-cyan-300" /> Materials
            </h4>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
              {materials.filter((m) => m.material_type !== 'gold').map((mat) => (
                <MaterialCard key={mat.id} material={mat.material_type} quantity={mat.quantity} size="small" />
              ))}
            </div>
          </GlassPanel>

          <GlassPanel>
            <h4 className="text-white font-bold mb-3.5 text-sm">Requirements</h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between"><span className="text-white/50">Next Level</span><span className="text-amber-300 font-bold">{levelCost.toLocaleString()} 🪙</span></div>
              <div className="flex justify-between"><span className="text-white/50">Ascension</span><span className="text-fuchsia-300 font-bold">{ascensionCost.toLocaleString()} 🪙</span></div>
            </div>
          </GlassPanel>

          <EvolutionPreview card={{ ...card, level: cardLevel, stars: cardStars, ascension: cardAscension }} />
          <NFCInfoPanel physicalCardData={null} onScan={() => {}} />
        </div>
      </div>

      <AnimatePresence>
        {showTradePanel && (
          <TradingPanel card={liveCard} onClose={() => setShowTradePanel(false)} onListCard={() => setShowTradePanel(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}