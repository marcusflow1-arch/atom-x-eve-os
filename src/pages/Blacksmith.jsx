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
    <div className="w-64 bg-slate-900/80 border-r border-white/10 flex flex-col h-full">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-white font-bold text-sm tracking-widest uppercase flex items-center gap-2">
          <Filter className="w-4 h-4 text-cyan-400" />
          Repositories
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {['All Cards', 'Weapons', 'Armor', 'Abilities', 'Passives', 'AI Traits'].map((filter) => (
          <button
            key={filter}
            onClick={() => onFilterChange(filter)}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeFilter === filter 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>
      <div className="p-4 border-t border-white/10 bg-slate-950/50">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">System Status</div>
        <div className="flex items-center justify-between text-slate-300 text-sm">
          <span>Forge</span>
          <span className="text-green-400">Online</span>
        </div>
        <div className="flex items-center justify-between text-slate-300 text-sm mt-1">
          <span>Sync</span>
          <span className="text-green-400">Stable</span>
        </div>
      </div>
    </div>
  );
};

// --- Center Column: Card Library ---
const CardLibrary = ({ cards, onSelectCard, selectedCard }) => {
  return (
    <div className="flex-1 bg-slate-900/50 flex flex-col h-full min-w-0">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-white font-bold text-sm tracking-widest uppercase">Card Instances</h2>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>{cards.length} Items</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
        {cards.map(card => (
          <div
            key={card.id}
            onClick={() => onSelectCard(card)}
            className={`
              relative aspect-[3/4] rounded-xl border-2 cursor-pointer transition-all duration-200 overflow-hidden group
              ${selectedCard?.id === card.id 
                ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] bg-slate-800' 
                : 'border-white/10 bg-slate-900/40 hover:border-white/30 hover:bg-slate-800/60'}
            `}
          >
            {/* Rarity Stripe */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${
              card.rarity === 'Legendary' ? 'bg-amber-500' : 
              card.rarity === 'Epic' ? 'bg-purple-500' : 
              card.rarity === 'Rare' ? 'bg-blue-500' : 
              'bg-slate-500'
            }`} />

            <div className="p-3 h-full flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  card.rarity === 'Legendary' ? 'bg-amber-500/20 text-amber-300' : 
                  card.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-300' : 
                  'bg-slate-700 text-slate-300'
                }`}>
                  {card.rarity}
                </span>
                {card.is_locked && <Lock className="w-3 h-3 text-slate-500" />}
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                {/* Placeholder for Card Art */}
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-white/40 transition-colors">
                  <Shield className="w-6 h-6" />
                </div>
              </div>

              <div className="mt-2">
                <h3 className="text-white text-sm font-bold truncate">{card.template_id || 'Unknown Item'}</h3>
                <div className="flex justify-between items-center mt-1 text-[10px] text-slate-400">
                  <span>Lv.{card.level}</span>
                  <span className="text-cyan-400">CS.{card.combine_level}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {cards.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500">
            <Search className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No cards found in this category.</p>
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
    
    // In real app: Call API here
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-slate-900 rounded-lg border border-white/10">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <ArrowUp className="w-4 h-4 text-green-400" />
          Train Level
        </h3>
        
        <div className="flex items-center justify-between mb-6">
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase">Current</div>
            <div className="text-2xl font-bold text-white">Lv.{card.level}</div>
          </div>
          <div className="text-slate-600">→</div>
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase">Target</div>
            <div className="text-2xl font-bold text-green-400">Lv.{card.level + trainAmount}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-950 p-3 rounded">
            <span className="text-sm text-slate-400">Levels to Add</span>
            <div className="flex items-center gap-3">
              <button onClick={() => setTrainAmount(Math.max(1, trainAmount - 1))} className="w-8 h-8 rounded bg-slate-800 text-white hover:bg-slate-700">-</button>
              <span className="text-white font-bold w-8 text-center">{trainAmount}</span>
              <button onClick={() => setTrainAmount(trainAmount + 1)} className="w-8 h-8 rounded bg-slate-800 text-white hover:bg-slate-700">+</button>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">Cost (APS)</span>
            <span className={canAfford ? 'text-white' : 'text-red-400'}>{totalCost} / {user?.aps || 0}</span>
          </div>

          <button
            onClick={handleTrain}
            disabled={!canAfford}
            className={`w-full py-3 rounded-lg font-bold uppercase tracking-wider transition-all ${
              canAfford 
                ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Confirm Training
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-500 text-center">
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
      // Failure logic (could implement durability loss here)
      alert("Enchantment Failed!");
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-slate-900 rounded-lg border border-white/10">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          Risk Enchantment
        </h3>

        <div className="text-center py-6">
          <div className="text-4xl font-black text-yellow-400 mb-1">
            {card.enchant_level || 0}
            <span className="text-lg text-yellow-600/80 ml-1">%</span>
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-widest">Current Modifier</div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-950 p-3 rounded border border-white/5">
            <div className="text-xs text-slate-500 mb-1">Success Chance</div>
            <div className={`font-bold ${successChance < 50 ? 'text-red-400' : 'text-green-400'}`}>
              {successChance}%
            </div>
          </div>
          <div className="bg-slate-950 p-3 rounded border border-white/5">
            <div className="text-xs text-slate-500 mb-1">Instability Risk</div>
            <div className={`font-bold ${riskLevel === 'High' ? 'text-red-400' : riskLevel === 'Medium' ? 'text-amber-400' : 'text-slate-300'}`}>
              {riskLevel}
            </div>
          </div>
        </div>

        <button
          onClick={handleEnchant}
          className="w-full py-3 rounded-lg font-bold uppercase tracking-wider bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white shadow-lg shadow-amber-500/20"
        >
          Attempt Enchant
        </button>
      </div>
      <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-500/20 rounded text-xs text-red-300">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <p>Warning: Higher enchantment levels carry a risk of destabilizing the card structure or failing completely.</p>
      </div>
    </div>
  );
};

// 3. Combine System
const CombineSystem = ({ card, inventory, onUpdateCard }) => {
  // Filter compatible cards (same template, different instance)
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
    // Logic to consume fodder and upgrade primary
    const xpGain = selectedFodder.length * 100; // Simplified logic
    const newCombineLevel = Math.min(12, (card.combine_level || 0) + Math.floor(selectedFodder.length / 2));
    
    // In a real implementation, we would delete fodder cards via API
    onUpdateCard({ 
      ...card, 
      combine_level: newCombineLevel,
      xp: (card.xp || 0) + xpGain 
    });
    setSelectedFodder([]);
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-slate-900 rounded-lg border border-white/10">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          Structural Fusion
        </h3>

        <div className="flex items-center justify-between mb-4 bg-slate-950 p-3 rounded border border-white/5">
          <span className="text-sm text-slate-400">Selected Catalysts</span>
          <span className="text-white font-bold">{selectedFodder.length} / 11</span>
        </div>

        {/* Fodder Selector */}
        <div className="mb-6">
          <div className="text-xs text-slate-500 mb-2">Available Catalysts (Consumed)</div>
          <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
            {compatibleCards.map(fodder => (
              <div 
                key={fodder.id}
                onClick={() => toggleFodder(fodder)}
                className={`
                  aspect-square rounded border cursor-pointer flex items-center justify-center text-xs font-bold transition-all
                  ${selectedFodder.find(c => c.id === fodder.id) 
                    ? 'bg-red-500/20 border-red-500 text-red-400' 
                    : 'bg-slate-800 border-white/10 text-slate-500 hover:border-white/30'}
                `}
              >
                CS.{fodder.combine_level}
              </div>
            ))}
            {compatibleCards.length === 0 && (
              <div className="col-span-full text-center text-xs text-slate-600 py-4">
                No compatible cards found.
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleCombine}
          disabled={selectedFodder.length === 0}
          className={`w-full py-3 rounded-lg font-bold uppercase tracking-wider transition-all ${
            selectedFodder.length > 0
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          Initiate Fusion
        </button>
      </div>
      <p className="text-xs text-slate-500 text-center">
        Fusion consumes selected catalysts to reinforce the primary card's structure.
      </p>
    </div>
  );
};

// 4. Ascend System
const AscendSystem = ({ card, onUpdateCard }) => {
  const canAscend = (card.level || 1) >= 50; // Example req

  const handleAscend = () => {
    if (!canAscend) return;
    onUpdateCard({
      ...card,
      level: 1, // Reset level
      ascension_tier: (card.ascension_tier || 0) + 1,
      stats: { ...card.stats, power: (card.stats?.power || 10) * 1.5 } // Permanent boost
    });
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-slate-900 rounded-lg border border-white/10">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Crown className="w-4 h-4 text-purple-400" />
          Ascension Ceremony
        </h3>

        <div className="text-center py-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-4">
            <Crown className="w-10 h-10 text-purple-400" />
          </div>
          <div className="text-sm text-white mb-1">Current Tier: {card.ascension_tier || 0}</div>
          <div className="text-xs text-slate-500">Max Tier: 5</div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Level Requirement</span>
            <span className={card.level >= 50 ? 'text-green-400' : 'text-red-400'}>{card.level} / 50</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Effect</span>
            <span className="text-purple-300">Reset Level + Permanent Boost</span>
          </div>
        </div>

        <button
          onClick={handleAscend}
          disabled={!canAscend}
          className={`w-full py-3 rounded-lg font-bold uppercase tracking-wider transition-all ${
            canAscend
              ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          Ascend
        </button>
      </div>
    </div>
  );
};

// 5. Cross-Fusion System (Placeholder for complexity)
const CrossFusionSystem = () => {
  return (
    <div className="p-4 bg-slate-900 rounded-lg border border-white/10 text-center py-12">
      <div className="w-16 h-16 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-4">
        <RefreshCw className="w-8 h-8 text-slate-600" />
      </div>
      <h3 className="text-white font-bold mb-2">Cross-Fusion Reactor</h3>
      <p className="text-sm text-slate-500 max-w-xs mx-auto">
        Requires Rank 5 Blacksmith and at least 2 Legendary anomalies.
      </p>
    </div>
  );
};

const Workspace = ({ activeSystem, card, inventory, user, onUpdateCard, onUpdateUser }) => {
  if (!card) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-slate-900 mb-6 flex items-center justify-center">
          <Hammer className="w-8 h-8 opacity-20" />
        </div>
        <h3 className="text-white font-bold text-lg mb-2">Workspace Idle</h3>
        <p className="text-sm max-w-xs">Select a card from the library to begin operations.</p>
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
    <div className="h-full flex flex-col">
      {/* Workspace Header */}
      <div className="p-6 border-b border-white/10 bg-slate-900/50">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-lg bg-slate-800 border border-white/10 flex-shrink-0 overflow-hidden">
             {/* Card Preview Image would go here */}
             <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                <Shield className="w-8 h-8 text-slate-600" />
             </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white leading-none mb-1">{card.template_id}</h2>
            <div className="flex items-center gap-3 text-sm">
              <span className={`font-bold ${
                card.rarity === 'Legendary' ? 'text-amber-400' : 'text-slate-400'
              }`}>{card.rarity}</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300">Lv. {card.level}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operation Area */}
      <div className="flex-1 overflow-y-auto p-6">
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
    <div className="h-screen w-full bg-slate-950 flex flex-col overflow-hidden text-slate-200 font-sans">
      {/* Top Navigation Bar Placeholder (Matches app layout) */}
      <div className="h-16 bg-slate-900 border-b border-white/10 flex items-center px-6 justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Hammer className="w-5 h-5 text-amber-500" />
          <h1 className="font-bold text-lg tracking-wider text-white">BLACKSMITH <span className="text-slate-600 font-normal">OS v2.0</span></h1>
        </div>
        
        {/* System Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-white/5">
          {Object.entries(SYSTEM_ICONS).map(([key, Icon]) => (
            <button
              key={key}
              onClick={() => setActiveSystem(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold uppercase transition-all ${
                activeSystem === key 
                  ? 'bg-slate-800 text-white shadow-lg' 
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {key}
            </button>
          ))}
        </div>

        {/* User Stats */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex flex-col items-end">
            <span className="text-slate-500 uppercase tracking-wider text-[10px]">APS Balance</span>
            <span className="text-green-400 font-bold font-mono text-lg">{currentUser?.aps || 0}</span>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex flex-col items-end">
            <span className="text-slate-500 uppercase tracking-wider text-[10px]">Smith Rank</span>
            <span className="text-amber-400 font-bold font-mono text-lg">{currentUser?.blacksmith_rank || 1}</span>
          </div>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Column 1: Filter */}
        <SidebarFilter 
          activeFilter={activeFilter} 
          onFilterChange={setActiveFilter} 
        />

        {/* Column 2: Library */}
        <div className="flex-1 min-w-[400px] border-r border-white/10 flex flex-col">
          <CardLibrary 
            cards={cards} // In real app, filter these by activeFilter
            selectedCard={selectedCard}
            onSelectCard={setSelectedCard}
          />
        </div>

        {/* Column 3: Workspace (Persistent Right Panel) */}
        <div className="w-[450px] bg-slate-950 flex-shrink-0 border-l border-white/10 shadow-2xl relative z-10">
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