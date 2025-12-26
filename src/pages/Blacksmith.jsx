import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { 
  Hammer, Zap, Layers, Crown, Play,
  Search, Filter, Lock, Unlock, ArrowUp, 
  Shield, Sword, RefreshCw, AlertTriangle
} from 'lucide-react';

// Icons for systems
const SYSTEM_ICONS = {
  train: ArrowUp,
  enchant: Zap,
  combine: Layers,
  ascend: Crown,
  fusion: RefreshCw
};

// --- Left Column: Filter & Selection ---
const SidebarFilter = ({ onFilterChange, activeFilter }) => {
  return (
    <div className="w-64 backdrop-blur-xl bg-black/20 border-r border-white/5 flex flex-col h-full">
      <div className="p-6">
        <h2 className="text-white/60 font-medium text-xs tracking-widest uppercase mb-4 pl-2">
          Repositories
        </h2>
        <div className="flex-1 overflow-y-auto space-y-1">
          {['All Cards', 'Weapons', 'Armor', 'Abilities', 'Passives', 'AI Traits'].map((filter) => (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeFilter === filter 
                  ? 'bg-white/10 text-white shadow-lg shadow-white/5 backdrop-blur-md' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
      
      <div className="mt-auto p-6 bg-gradient-to-t from-black/40 to-transparent">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
          <span className="text-xs font-medium text-white/40">System Online</span>
        </div>
      </div>
    </div>
  );
};

// --- Center Column: Card Library ---
const CardLibrary = ({ cards, onSelectCard, selectedCard }) => {
  return (
    <div className="flex-1 flex flex-col h-full min-w-0 relative">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent pointer-events-none" />
      
      <div className="p-6 flex items-center justify-between relative z-10">
        <h2 className="text-white font-semibold text-lg tracking-tight">Card Collection</h2>
        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs text-white/40 font-medium backdrop-blur-md">
          {cards.length} Items
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start relative z-10">
        {cards.map(card => (
          <motion.div
            key={card.id}
            layoutId={card.id}
            onClick={() => onSelectCard(card)}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative aspect-[3/4] rounded-2xl cursor-pointer overflow-hidden backdrop-blur-xl transition-all duration-300
              ${selectedCard?.id === card.id 
                ? 'bg-white/10 shadow-[0_0_30px_rgba(255,255,255,0.15)] ring-1 ring-white/30' 
                : 'bg-white/5 hover:bg-white/10 shadow-lg hover:shadow-xl ring-1 ring-white/5 hover:ring-white/10'}
            `}
          >
            {/* Glass Shine */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="p-4 h-full flex flex-col relative z-10">
              <div className="flex justify-between items-start mb-2">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  card.rarity === 'Legendary' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 
                  card.rarity === 'Epic' ? 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]' : 
                  'bg-slate-400'
                }`} />
                {card.is_locked && <Lock className="w-3 h-3 text-white/30" />}
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                <Shield className="w-8 h-8 text-white/20 drop-shadow-lg" />
              </div>

              <div className="mt-4">
                <h3 className="text-white text-sm font-medium truncate tracking-wide">{card.template_id || 'Unknown Item'}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Lv.{card.level}</span>
                  {card.combine_level > 0 && (
                    <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider shadow-cyan-500/20 drop-shadow-sm">CS.{card.combine_level}</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        
        {cards.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-32 text-white/20">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 backdrop-blur-md">
              <Search className="w-6 h-6 opacity-50" />
            </div>
            <p className="text-sm font-medium">No items found</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Right Column: System Workspaces ---

// 1. Training System
const TrainSystem = ({ card, user, onUpdateUser, onUpdateCard }) => {
  const [trainAmount, setTrainAmount] = useState(1);
  const costPerLevel = 10; // APS cost
  const totalCost = trainAmount * costPerLevel;
  const canAfford = (user?.aps || 0) >= totalCost;

  const handleTrain = async () => {
    if (!canAfford) return;
    
    // Optimistic update
    const newAps = (user.aps || 0) - totalCost;
    const newLevel = (card.level || 1) + trainAmount;
    const newXp = (user.blacksmith_xp || 0) + (trainAmount * 5); // 5 XP per level trained

    onUpdateUser({ ...user, aps: newAps, blacksmith_xp: newXp });
    onUpdateCard({ ...card, level: newLevel });
  };

  return (
    <div className="space-y-8">
      <div className="p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-md shadow-xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-green-500/20 rounded-full blur-[50px] pointer-events-none" />
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <ArrowUp className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-white font-bold text-xl tracking-tight">Train Level</h3>
          </div>
          <div className="px-3 py-1 rounded-full bg-white/10 border border-white/5 text-xs text-white/60 font-medium">
            APS Required
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-8 mb-8 relative z-10">
          <div className="text-center">
            <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Current</div>
            <div className="text-4xl font-black text-white">Lv.{card.level}</div>
          </div>
          <div className="text-white/20">
            <ArrowUp className="w-6 h-6 rotate-90" />
          </div>
          <div className="text-center">
            <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Target</div>
            <div className="text-4xl font-black text-green-400">Lv.{card.level + trainAmount}</div>
          </div>
        </div>

        <div className="space-y-6 relative z-10">
          <div className="flex justify-between items-center bg-black/20 p-2 rounded-2xl border border-white/5">
            <button 
              onClick={() => setTrainAmount(Math.max(1, trainAmount - 1))} 
              className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all"
            >
              -
            </button>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Add Levels</span>
              <span className="text-white font-bold text-xl">{trainAmount}</span>
            </div>
            <button 
              onClick={() => setTrainAmount(trainAmount + 1)} 
              className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all"
            >
              +
            </button>
          </div>

          <div className="flex justify-between items-center px-2">
            <span className="text-sm text-white/40 font-medium">Total Cost</span>
            <span className={`text-lg font-bold font-mono ${canAfford ? 'text-white' : 'text-red-400'}`}>
              {totalCost} <span className="text-xs text-white/40 font-sans">APS</span>
            </span>
          </div>

          <button
            onClick={handleTrain}
            disabled={!canAfford}
            className={`w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all shadow-xl ${
              canAfford 
                ? 'bg-white text-black hover:bg-slate-200 hover:scale-[1.02] active:scale-[0.98]' 
                : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
            }`}
          >
            Confirm Training
          </button>
        </div>
      </div>
      <p className="text-xs text-white/30 text-center max-w-xs mx-auto leading-relaxed">
        Training consumes Achievement Spend Points (APS). Level caps apply based on rarity.
      </p>
    </div>
  );
};

// 2. Enchant System
const EnchantSystem = ({ card, user, onUpdateCard }) => {
  const successChance = Math.max(10, 90 - ((card.enchant_level || 0) * 5)); // Decaying chance
  const riskLevel = card.enchant_level > 10 ? 'High' : card.enchant_level > 5 ? 'Medium' : 'Low';

  const handleEnchant = () => {
    const roll = Math.random() * 100;
    const isSuccess = roll <= successChance;
    
    if (isSuccess) {
      onUpdateCard({ ...card, enchant_level: (card.enchant_level || 0) + 1 });
    } else {
      alert("Enchantment Failed!");
    }
  };

  return (
    <div className="space-y-8">
      <div className="p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-md shadow-xl relative overflow-hidden group">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
        
        <div className="flex items-center gap-3 mb-8 relative z-10">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="text-white font-bold text-xl tracking-tight">Risk Enchantment</h3>
        </div>

        <div className="text-center py-8 relative z-10">
          <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500 mb-2 drop-shadow-lg">
            {card.enchant_level || 0}<span className="text-2xl ml-1">%</span>
          </div>
          <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Current Power Modifier</div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
          <div className="bg-black/20 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
            <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Success Rate</div>
            <div className={`text-xl font-bold ${successChance < 50 ? 'text-red-400' : 'text-green-400'}`}>
              {successChance}%
            </div>
          </div>
          <div className="bg-black/20 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
            <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Instability</div>
            <div className={`text-xl font-bold ${riskLevel === 'High' ? 'text-red-400' : riskLevel === 'Medium' ? 'text-amber-400' : 'text-white'}`}>
              {riskLevel}
            </div>
          </div>
        </div>

        <button
          onClick={handleEnchant}
          className="w-full py-4 rounded-2xl font-bold uppercase tracking-wider bg-white text-black hover:bg-amber-50 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-amber-500/10 relative z-10"
        >
          Attempt Enchant
        </button>
      </div>
      
      <div className="flex items-start gap-3 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl backdrop-blur-md">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400" />
        <p className="text-xs text-red-200/80 leading-relaxed font-medium">
          Warning: High-tier enchantment carries significant risk. Failed attempts may result in permanent instability or structural degradation.
        </p>
      </div>
    </div>
  );
};

// 3. Combine System
const CombineSystem = ({ card, inventory, onUpdateCard }) => {
  const compatibleCards = inventory.filter(c => c.template_id === card.template_id && c.id !== card.id);
  const [selectedFodder, setSelectedFodder] = useState([]);

  const toggleFodder = (fodderCard) => {
    if (selectedFodder.find(c => c.id === fodderCard.id)) {
      setSelectedFodder(selectedFodder.filter(c => c.id !== fodderCard.id));
    } else {
      if (selectedFodder.length < 11) {
        setSelectedFodder([...selectedFodder, fodderCard]);
      }
    }
  };

  const handleCombine = () => {
    const xpGain = selectedFodder.length * 100; 
    const newCombineLevel = Math.min(12, (card.combine_level || 0) + Math.floor(selectedFodder.length / 2));
    onUpdateCard({ 
      ...card, 
      combine_level: newCombineLevel,
      xp: (card.xp || 0) + xpGain 
    });
    setSelectedFodder([]);
  };

  return (
    <div className="space-y-8">
      <div className="p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-md shadow-xl relative overflow-hidden">
        {/* Blue ambient glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Layers className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-white font-bold text-xl tracking-tight">Structural Fusion</h3>
          </div>
          <div className="px-3 py-1 rounded-full bg-white/10 border border-white/5 text-xs text-white/60 font-medium">
            {selectedFodder.length} / 11 Selected
          </div>
        </div>

        {/* Fodder Selector */}
        <div className="mb-8 relative z-10">
          <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-3">Select Catalysts (Consumed)</div>
          <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {compatibleCards.map(fodder => (
              <motion.div 
                key={fodder.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleFodder(fodder)}
                className={`
                  aspect-square rounded-xl cursor-pointer flex flex-col items-center justify-center transition-all border
                  ${selectedFodder.find(c => c.id === fodder.id) 
                    ? 'bg-red-500/20 border-red-500/50 text-red-300' 
                    : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:border-white/10'}
                `}
              >
                <div className="text-xs font-bold mb-1">CS.{fodder.combine_level}</div>
                <div className="text-[9px] opacity-60">Lv.{fodder.level}</div>
              </motion.div>
            ))}
            {compatibleCards.length === 0 && (
              <div className="col-span-full py-8 text-center bg-white/5 rounded-xl border border-white/5 border-dashed">
                <p className="text-sm text-white/30">No compatible cards found</p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleCombine}
          disabled={selectedFodder.length === 0}
          className={`w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all shadow-xl relative z-10 ${
            selectedFodder.length > 0
              ? 'bg-white text-black hover:bg-blue-50 hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
          }`}
        >
          Initiate Fusion
        </button>
      </div>
      <p className="text-xs text-white/30 text-center leading-relaxed">
        Fusion permanently consumes selected catalysts to reinforce the primary card's structure and increase Combine Score.
      </p>
    </div>
  );
};

// 4. Ascend System
const AscendSystem = ({ card, onUpdateCard }) => {
  const canAscend = (card.level || 1) >= 50; 

  const handleAscend = () => {
    if (!canAscend) return;
    onUpdateCard({
      ...card,
      level: 1, 
      ascension_tier: (card.ascension_tier || 0) + 1,
      stats: { ...card.stats, power: (card.stats?.power || 10) * 1.5 } 
    });
  };

  return (
    <div className="space-y-8">
      <div className="p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-md shadow-xl relative overflow-hidden text-center">
        {/* Purple Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-purple-900/20 border border-purple-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
            <Crown className="w-10 h-10 text-purple-300 drop-shadow-md" />
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-1 tracking-tight">Ascension Ceremony</h3>
          <p className="text-white/40 text-sm mb-8 font-light">Elevate card to the next tier of existence.</p>

          <div className="grid grid-cols-2 gap-4 mb-8 text-left">
            <div className="p-4 rounded-2xl bg-black/20 border border-white/5 backdrop-blur-sm">
              <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Current Tier</div>
              <div className="text-xl font-bold text-white">{card.ascension_tier || 0} <span className="text-white/20 text-sm font-normal">/ 5</span></div>
            </div>
            <div className="p-4 rounded-2xl bg-black/20 border border-white/5 backdrop-blur-sm">
              <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Level Req</div>
              <div className={`text-xl font-bold ${card.level >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                {card.level} <span className="text-white/20 text-sm font-normal">/ 50</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleAscend}
            disabled={!canAscend}
            className={`w-full py-4 rounded-2xl font-bold uppercase tracking-wider transition-all shadow-xl ${
              canAscend
                ? 'bg-white text-purple-900 hover:bg-purple-50 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
            }`}
          >
            Ascend
          </button>
        </div>
      </div>
    </div>
  );
};

// 5. Cross-Fusion System (Placeholder for complexity)
const CrossFusionSystem = () => {
  return (
    <div className="p-12 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-md text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      <div className="w-20 h-20 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 backdrop-blur-xl shadow-2xl relative z-10">
        <RefreshCw className="w-8 h-8 text-white/20" />
      </div>
      <h3 className="text-white font-bold text-xl mb-2 relative z-10">Cross-Fusion Reactor</h3>
      <p className="text-sm text-white/40 max-w-xs mx-auto relative z-10 font-light leading-relaxed">
        Requires Rank 5 Blacksmith and at least 2 Legendary anomalies to initialize sequence.
      </p>
    </div>
  );
};

const Workspace = ({ activeSystem, card, inventory, user, onUpdateCard, onUpdateUser }) => {
  if (!card) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
        <div className="w-24 h-24 rounded-full bg-white/5 mb-6 flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-2xl">
          <Hammer className="w-8 h-8 text-white/20" />
        </div>
        <h3 className="text-white font-medium text-lg mb-2 tracking-tight">Ready to Forge</h3>
        <p className="text-sm text-white/40 max-w-xs font-light">Select an item from your collection to begin enhancement.</p>
      </div>
    );
  }

  const components = {
    train: TrainSystem,
    enchant: EnchantSystem,
    combine: CombineSystem,
    ascend: AscendSystem,
    fusion: CrossFusionSystem
  };

  const ActiveComponent = components[activeSystem] || TrainSystem;

  return (
    <div className="h-full flex flex-col bg-white/[0.02] backdrop-blur-3xl relative">
      {/* Workspace Header */}
      <div className="p-8 relative z-10">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex-shrink-0 overflow-hidden shadow-2xl backdrop-blur-md flex items-center justify-center">
             <Shield className="w-8 h-8 text-white/40 drop-shadow-md" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight mb-2 tracking-tight">{card.template_id}</h2>
            <div className="flex items-center gap-3 text-sm">
              <span className={`font-medium px-3 py-1 rounded-full text-xs backdrop-blur-md ${
                card.rarity === 'Legendary' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/20' : 'bg-white/10 text-white/60 border border-white/10'
              }`}>{card.rarity}</span>
              <span className="text-white/20">|</span>
              <span className="text-white/80 font-medium">Lv. {card.level}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operation Area */}
      <div className="flex-1 overflow-y-auto px-8 pb-8 relative z-10">
        <ActiveComponent 
          card={card} 
          inventory={inventory} 
          user={user} 
          onUpdateCard={onUpdateCard}
          onUpdateUser={onUpdateUser}
        />
      </div>
    </div>
  );
};

// --- Main Page Component ---
export default function BlacksmithPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('All Cards');
  const [activeSystem, setActiveSystem] = useState('train');
  const [selectedCard, setSelectedCard] = useState(null);
  const [cards, setCards] = useState([]);
  const [currentUser, setCurrentUser] = useState(user);

  // Load cards on mount
  useEffect(() => {
    const fetchCards = async () => {
      try {
        const res = await base44.entities.UserCard.list();
        setCards(res.data || []);
      } catch (err) {
        console.error("Failed to load cards", err);
      }
    };
    fetchCards();
  }, []);

  // Sync user
  useEffect(() => {
    if (user) setCurrentUser(user);
  }, [user]);

  // Handlers
  const handleUpdateCard = async (updatedCard) => {
    // Optimistic UI update
    setCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
    setSelectedCard(updatedCard);
    
    // API Call
    try {
      await base44.entities.UserCard.update(updatedCard.id, updatedCard);
    } catch (err) {
      console.error("Failed to update card", err);
      // Revert logic would go here
    }
  };

  const handleUpdateUser = async (updatedUser) => {
    setCurrentUser(updatedUser);
    // API Call to user entity...
    // Note: base44.auth.updateMe usually handles this, or direct entity update if allowed
  };

  return (
    <div className="h-screen w-full bg-[#050505] flex flex-col overflow-hidden text-white font-sans relative">
      {/* Global Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/20 via-purple-900/10 to-blue-900/20 pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <div className="h-20 flex items-center px-8 justify-between flex-shrink-0 z-20 backdrop-blur-md bg-black/10 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Hammer className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-2xl tracking-tight text-white">Blacksmith <span className="text-white/20 font-light">OS</span></h1>
        </div>
        
        {/* System Tabs - Pill Style */}
        <div className="flex items-center bg-white/5 p-1.5 rounded-full border border-white/5 backdrop-blur-md">
          {Object.entries(SYSTEM_ICONS).map(([key, Icon]) => (
            <button
              key={key}
              onClick={() => setActiveSystem(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                activeSystem === key 
                  ? 'bg-white text-black shadow-lg shadow-white/10 scale-105' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {key}
            </button>
          ))}
        </div>

        {/* User Stats - Glass Cards */}
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 backdrop-blur-md flex flex-col items-end min-w-[100px]">
            <span className="text-white/40 uppercase tracking-wider text-[9px] font-bold mb-0.5">APS Balance</span>
            <span className="text-green-400 font-bold font-mono text-lg leading-none">{currentUser?.aps || 0}</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 backdrop-blur-md flex flex-col items-end min-w-[100px]">
            <span className="text-white/40 uppercase tracking-wider text-[9px] font-bold mb-0.5">Smith Rank</span>
            <span className="text-amber-400 font-bold font-mono text-lg leading-none">{currentUser?.blacksmith_rank || 1}</span>
          </div>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Column 1: Filter - Glass Sidebar */}
        <SidebarFilter 
          activeFilter={activeFilter} 
          onFilterChange={setActiveFilter} 
        />

        {/* Column 2: Library - Clean Grid */}
        <div className="flex-1 min-w-[400px] border-r border-white/5 flex flex-col backdrop-blur-sm bg-white/[0.01]">
          <CardLibrary 
            cards={cards} 
            selectedCard={selectedCard}
            onSelectCard={setSelectedCard}
          />
        </div>

        {/* Column 3: Workspace (Persistent Right Panel) - Frosted Glass */}
        <div className="w-[500px] flex-shrink-0 border-l border-white/5 shadow-2xl relative z-20 backdrop-blur-2xl bg-black/40">
          <Workspace 
            activeSystem={activeSystem} 
            card={selectedCard} 
            inventory={cards}
            user={currentUser}
            onUpdateCard={handleUpdateCard}
            onUpdateUser={handleUpdateUser}
          />
        </div>
      </div>
    </div>
  );
}