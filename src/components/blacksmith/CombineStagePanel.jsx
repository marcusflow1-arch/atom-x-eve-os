import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ArrowRight, Package, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock inventory - in real app, this would come from user's inventory
const generateMockInventory = (baseItem) => {
  if (!baseItem) return [];
  
  // Generate cards with some duplicates of same type
  const types = ['Warrior', 'Mage', 'Rogue', 'Healer', 'Tank'];
  return Array.from({ length: 20 }, (_, i) => {
    const typeIndex = i % 5;
    return {
      id: `inv-${baseItem.id}-${i}`,
      ...baseItem,
      card_type: types[typeIndex],
      instance_id: i,
      combine_stage: Math.floor(Math.random() * 3),
      enhancement_level: Math.floor(Math.random() * 50),
      level: Math.floor(Math.random() * 10) + 1
    };
  });
};

const rarityColors = {
  Common: 'border-slate-500',
  Uncommon: 'border-green-500',
  Rare: 'border-blue-500',
  Epic: 'border-purple-500',
  Legendary: 'border-orange-500',
  Mythic: 'border-red-500',
};

const InventoryCard = ({ card, isSelected, onClick }) => {
  const borderColor = rarityColors[card?.rarity] || 'border-slate-500';
  
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        w-28 h-36 rounded-xl overflow-hidden cursor-pointer relative flex-shrink-0
        border-2 transition-all
        ${isSelected ? `${borderColor} ring-2 ring-white/50 shadow-lg` : 'border-white/20 hover:border-white/40'}
      `}
      style={{
        background: 'linear-gradient(135deg, rgba(30, 40, 55, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
      }}
    >
      <img src={card.preview_image_url} alt="" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      
      {/* Card Stats */}
      <div className="absolute top-1.5 left-1.5 right-1.5 flex justify-between">
        <span className="text-[9px] bg-black/70 px-1.5 py-0.5 rounded text-white/80 font-medium">
          CS{card.combine_stage || 0}
        </span>
        <span className="text-[9px] bg-black/70 px-1.5 py-0.5 rounded text-amber-400 font-medium">
          {card.enhancement_level || 0}%
        </span>
      </div>
      
      {/* Card Type Badge */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 text-center">
        <span className="text-[8px] bg-purple-500/80 px-2 py-0.5 rounded-full text-white font-bold uppercase">
          {card.card_type}
        </span>
      </div>
      
      <div className="absolute bottom-1.5 left-0 right-0 text-center">
        <span className="text-xs bg-black/70 px-2 py-0.5 rounded text-white font-bold">
          LV{card.level || 1}
        </span>
      </div>
      
      {/* Selection Indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute inset-0 bg-green-500/20 flex items-center justify-center"
        >
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
            <span className="text-white text-lg font-bold">✓</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

const DropZone = ({ card, onRemove, onClick, hasSelection }) => {
  return (
    <motion.div 
      onClick={onClick}
      whileHover={hasSelection ? { scale: 1.02 } : {}}
      className={`
        w-36 h-48 rounded-xl border-2 border-dashed transition-all cursor-pointer
        flex items-center justify-center
        ${card ? 'border-white/40 bg-white/5' : hasSelection ? 'border-green-500/50 bg-green-500/5 hover:border-green-500 hover:bg-green-500/10' : 'border-white/20 bg-white/[0.02]'}
      `}
    >
      {card ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-full h-full rounded-lg overflow-hidden"
        >
          <img src={card.preview_image_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          
          <div className="absolute top-2 left-2 right-2 flex justify-between">
            <span className="text-xs bg-black/60 px-1.5 py-0.5 rounded text-white/80">
              CS{card.combine_stage || 0}
            </span>
            <span className="text-xs bg-black/60 px-1.5 py-0.5 rounded text-amber-400">
              {card.enhancement_level || 0}%
            </span>
          </div>
          
          <div className="absolute bottom-2 left-0 right-0 text-center">
            <span className="text-sm bg-black/60 px-2 py-0.5 rounded text-white font-bold">
              LV{card.level || 1}
            </span>
          </div>
          
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white text-sm font-bold"
          >
            ×
          </button>
        </motion.div>
      ) : (
        <div className="text-center text-white/30">
          <Package className="w-10 h-10 mx-auto mb-2" />
          <p className="text-xs">{hasSelection ? 'Click to place card' : 'Select a card first'}</p>
        </div>
      )}
    </motion.div>
  );
};

const ResultCard = ({ card }) => {
  if (!card) return null;
  
  const newCombineStage = (card.combine_stage || 0) + 1;
  const borderColor = rarityColors[card?.rarity] || 'border-slate-500';
  
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, rotateY: -180 }}
      animate={{ scale: 1, opacity: 1, rotateY: 0 }}
      transition={{ duration: 0.6, type: "spring" }}
      className={`w-36 h-48 rounded-xl overflow-hidden border-2 ${borderColor} relative`}
      style={{
        boxShadow: `0 0 40px rgba(34, 197, 94, 0.4)`
      }}
    >
      <img src={card.preview_image_url} alt="" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      {/* Glow Effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          boxShadow: ['inset 0 0 20px rgba(34, 197, 94, 0.2)', 'inset 0 0 40px rgba(34, 197, 94, 0.4)', 'inset 0 0 20px rgba(34, 197, 94, 0.2)']
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      <div className="absolute top-2 left-2 right-2 flex justify-between">
        <div className="bg-green-500 px-2 py-0.5 rounded flex items-center gap-1">
          <span className="text-xs text-white font-bold">CS{newCombineStage}</span>
          <span className="text-[10px] text-green-200">+1</span>
        </div>
        <span className="text-xs bg-black/60 px-1.5 py-0.5 rounded text-amber-400">
          {card.enhancement_level || 0}%
        </span>
      </div>
      
      <div className="absolute bottom-2 left-0 right-0 text-center">
        <span className="text-sm bg-black/60 px-2 py-0.5 rounded text-white font-bold">
          LV{card.level || 1}
        </span>
      </div>
    </motion.div>
  );
};

export default function CombineStagePanel({ item, onCombine }) {
  const [selectedCard, setSelectedCard] = useState(null);
  const [combineCount, setCombineCount] = useState(1);
  const [dropZoneCard, setDropZoneCard] = useState(null);
  const [autoSelectedCards, setAutoSelectedCards] = useState([]);
  const [isCombining, setIsCombining] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const inventory = useMemo(() => generateMockInventory(item), [item]);
  const maxCombine = 12;

  const handleSelectCard = (card) => {
    if (selectedCard?.id === card.id) {
      // Deselect
      setSelectedCard(null);
      setAutoSelectedCards([]);
    } else {
      // Select this card and auto-select same type cards
      setSelectedCard(card);
      
      // Find other cards of same type
      const sameTypeCards = inventory.filter(c => 
        c.card_type === card.card_type && c.id !== card.id
      );
      
      // Auto-select up to combineCount - 1 additional cards (since we already have the main one)
      const additionalCards = sameTypeCards.slice(0, combineCount - 1);
      setAutoSelectedCards(additionalCards);
    }
  };

  const handleDropZoneClick = () => {
    if (selectedCard && !dropZoneCard) {
      setDropZoneCard(selectedCard);
    }
  };

  const handleIncrement = () => {
    if (combineCount < maxCombine) {
      const newCount = combineCount + 1;
      setCombineCount(newCount);
      
      // Update auto-selected cards if we have a selection
      if (selectedCard) {
        const sameTypeCards = inventory.filter(c => 
          c.card_type === selectedCard.card_type && c.id !== selectedCard.id
        );
        setAutoSelectedCards(sameTypeCards.slice(0, newCount - 1));
      }
    }
  };

  const handleDecrement = () => {
    if (combineCount > 1) {
      const newCount = combineCount - 1;
      setCombineCount(newCount);
      
      // Update auto-selected cards
      if (selectedCard) {
        const sameTypeCards = inventory.filter(c => 
          c.card_type === selectedCard.card_type && c.id !== selectedCard.id
        );
        setAutoSelectedCards(sameTypeCards.slice(0, newCount - 1));
      }
    }
  };

  const handleCombineStage = async () => {
    if (!dropZoneCard) return;
    
    setIsCombining(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setShowResult(true);
    setIsCombining(false);
    
    if (onCombine) {
      onCombine(dropZoneCard, [selectedCard, ...autoSelectedCards]);
    }
  };

  const resetCombine = () => {
    setSelectedCard(null);
    setAutoSelectedCards([]);
    setDropZoneCard(null);
    setShowResult(false);
  };

  const isCardSelected = (card) => {
    if (selectedCard?.id === card.id) return true;
    return autoSelectedCards.some(c => c.id === card.id);
  };

  const totalSelected = selectedCard ? 1 + autoSelectedCards.length : 0;

  if (!item) {
    return (
      <div className="flex items-center justify-center h-full text-white/40">
        <p>Select a card to combine</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-start justify-center gap-12 w-full h-full p-6 overflow-hidden"
    >
      {/* Left Side - Inventory */}
      <div className="flex flex-col gap-4 flex-shrink-0">
        {/* Header with Counter */}
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">Select Cards</h3>
          
          {/* Counter - No box */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleDecrement}
              disabled={combineCount <= 1}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center text-white transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-white font-bold text-xl min-w-[2ch] text-center">{combineCount}</span>
            <button
              onClick={handleIncrement}
              disabled={combineCount >= maxCombine}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <p className="text-white/40 text-sm">{totalSelected}/{combineCount} cards selected</p>

        {/* Inventory Grid - 5 columns, 4 rows visible, scrollable */}
        <div 
          className="grid grid-cols-5 gap-3 max-h-[600px] overflow-y-auto pr-2"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}
        >
          {inventory.map((card) => (
            <InventoryCard
              key={card.id}
              card={card}
              isSelected={isCardSelected(card)}
              onClick={() => handleSelectCard(card)}
            />
          ))}
        </div>
      </div>

      {/* Right Side - Drop Zone and Result */}
      <div className="flex flex-col items-center gap-6 pt-8">
        <h3 className="text-white font-bold text-lg">Refinement & Fusion</h3>
        
        <div className="flex items-center gap-8">
          {/* Drop Zone */}
          <DropZone 
            card={dropZoneCard} 
            onRemove={() => setDropZoneCard(null)}
            onClick={handleDropZoneClick}
            hasSelection={!!selectedCard && !dropZoneCard}
          />

          {/* Arrow */}
          <motion.div
            animate={{ x: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ArrowRight className="w-8 h-8 text-white/40" />
          </motion.div>

          {/* Result */}
          <div className="w-36 h-48 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center bg-white/[0.02]">
            {showResult && dropZoneCard ? (
              <ResultCard card={dropZoneCard} />
            ) : (
              <div className="text-center text-white/30">
                <Sparkles className="w-10 h-10 mx-auto mb-2" />
                <p className="text-xs">Result</p>
              </div>
            )}
          </div>
        </div>

        {/* Combine Button */}
        <Button
          onClick={showResult ? resetCombine : handleCombineStage}
          disabled={isCombining || (!showResult && !dropZoneCard)}
          className="w-64 h-14 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-lg rounded-xl disabled:opacity-50"
        >
          {isCombining ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-6 h-6" />
            </motion.div>
          ) : showResult ? (
            'Combine Another'
          ) : (
            <>
              <Plus className="w-5 h-5 mr-2" />
              Combine Stage
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}