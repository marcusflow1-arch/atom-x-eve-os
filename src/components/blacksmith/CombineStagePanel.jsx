import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ArrowRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// Mock inventory - in real app, this would come from user's inventory
const generateMockInventory = (baseItem) => {
  if (!baseItem) return [];
  return Array.from({ length: 24 }, (_, i) => ({
    id: `inv-${baseItem.id}-${i}`,
    ...baseItem,
    instance_id: i,
    combine_stage: Math.floor(Math.random() * 3),
    enhancement_level: Math.floor(Math.random() * 50),
    level: Math.floor(Math.random() * 10) + 1
  }));
};

const rarityColors = {
  Common: 'border-slate-500',
  Uncommon: 'border-green-500',
  Rare: 'border-blue-500',
  Epic: 'border-purple-500',
  Legendary: 'border-orange-500',
  Mythic: 'border-red-500',
};

const InventoryCard = ({ card, index, isSelected, onSelect, isDragging }) => {
  const borderColor = rarityColors[card?.rarity] || 'border-slate-500';
  
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onSelect(card)}
      className={`
        w-16 h-20 rounded-lg overflow-hidden cursor-pointer relative
        border-2 transition-all
        ${isSelected ? `${borderColor} ring-2 ring-white/50` : 'border-white/20'}
        ${isDragging ? 'opacity-50' : ''}
      `}
      style={{
        background: 'rgba(30, 40, 55, 0.9)',
      }}
    >
      <img src={card.preview_image_url} alt="" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      
      {/* Card Stats */}
      <div className="absolute top-1 left-1 right-1 flex justify-between">
        <span className="text-[8px] bg-black/60 px-1 rounded text-white/80">
          CS{card.combine_stage || 0}
        </span>
        <span className="text-[8px] bg-black/60 px-1 rounded text-amber-400">
          {card.enhancement_level || 0}%
        </span>
      </div>
      
      <div className="absolute bottom-1 left-0 right-0 text-center">
        <span className="text-[8px] bg-black/60 px-1 rounded text-white font-bold">
          LV{card.level || 1}
        </span>
      </div>
      
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute inset-0 bg-white/10 flex items-center justify-center"
        >
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">✓</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

const DropZone = ({ card, onRemove }) => {
  return (
    <div 
      className={`
        w-32 h-44 rounded-xl border-2 border-dashed transition-all
        flex items-center justify-center
        ${card ? 'border-white/40 bg-white/5' : 'border-white/20 bg-white/[0.02]'}
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
            onClick={onRemove}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white text-xs"
          >
            ×
          </button>
        </motion.div>
      ) : (
        <div className="text-center text-white/30">
          <Package className="w-8 h-8 mx-auto mb-2" />
          <p className="text-xs">Drop card here</p>
        </div>
      )}
    </div>
  );
};

const ResultCard = ({ card, combineCount }) => {
  if (!card) return null;
  
  const newCombineStage = (card.combine_stage || 0) + 1;
  const borderColor = rarityColors[card?.rarity] || 'border-slate-500';
  
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`w-32 h-44 rounded-xl overflow-hidden border-2 ${borderColor} relative`}
      style={{
        boxShadow: `0 0 30px ${borderColor.replace('border-', 'rgb(').replace('-500', ', 0.5)')}`
      }}
    >
      <img src={card.preview_image_url} alt="" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      {/* Glow Effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          boxShadow: ['inset 0 0 20px rgba(255,255,255,0.1)', 'inset 0 0 40px rgba(255,255,255,0.2)', 'inset 0 0 20px rgba(255,255,255,0.1)']
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      <div className="absolute top-2 left-2 right-2 flex justify-between">
        <div className="bg-green-500/80 px-1.5 py-0.5 rounded flex items-center gap-1">
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
      
      {/* "RESULT" Label */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 rounded-full"
        >
          <span className="text-white font-bold text-xs">RESULT</span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default function CombineStagePanel({ item, onCombine }) {
  const [selectedCards, setSelectedCards] = useState([]);
  const [combineCount, setCombineCount] = useState(1);
  const [dropZoneCard, setDropZoneCard] = useState(null);
  const [isCombining, setIsCombining] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const inventory = useMemo(() => generateMockInventory(item), [item]);
  const maxCombine = 12;

  const handleSelectCard = (card) => {
    if (selectedCards.find(c => c.id === card.id)) {
      setSelectedCards(prev => prev.filter(c => c.id !== card.id));
    } else if (selectedCards.length < combineCount) {
      setSelectedCards(prev => [...prev, card]);
    }
  };

  const handleIncrement = () => {
    if (combineCount < maxCombine) {
      setCombineCount(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (combineCount > 1) {
      setCombineCount(prev => prev - 1);
      if (selectedCards.length > combineCount - 1) {
        setSelectedCards(prev => prev.slice(0, combineCount - 1));
      }
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    if (result.destination.droppableId === 'dropzone' && result.source.droppableId === 'inventory') {
      const cardId = result.draggableId;
      const card = inventory.find(c => c.id === cardId);
      if (card) {
        setDropZoneCard(card);
      }
    }
  };

  const handleCombineStage = async () => {
    if (!dropZoneCard || selectedCards.length < combineCount) return;
    
    setIsCombining(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setShowResult(true);
    setIsCombining(false);
    
    if (onCombine) {
      onCombine(dropZoneCard, selectedCards);
    }
  };

  const resetCombine = () => {
    setSelectedCards([]);
    setDropZoneCard(null);
    setShowResult(false);
  };

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
      className="flex items-start justify-center gap-8 w-full h-full p-8 overflow-hidden"
    >
      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Inventory Grid */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold">Inventory</h3>
            <span className="text-white/50 text-sm">{selectedCards.length}/{combineCount} selected</span>
          </div>
          
          {/* Counter Controls */}
          <div className="flex items-center gap-4 bg-white/5 rounded-xl p-3 border border-white/10">
            <button
              onClick={handleDecrement}
              disabled={combineCount <= 1}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center text-white transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="text-center">
              <span className="text-white font-bold text-2xl">{combineCount}</span>
              <p className="text-white/40 text-xs">Cards to combine</p>
            </div>
            <button
              onClick={handleIncrement}
              disabled={combineCount >= maxCombine}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <Droppable droppableId="inventory" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="grid grid-cols-6 gap-2 p-4 bg-white/[0.03] rounded-xl border border-white/10 max-h-[400px] overflow-y-auto"
              >
                {inventory.map((card, index) => (
                  <Draggable key={card.id} draggableId={card.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <InventoryCard
                          card={card}
                          index={index}
                          isSelected={selectedCards.some(c => c.id === card.id)}
                          onSelect={handleSelectCard}
                          isDragging={snapshot.isDragging}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* Drop Zone and Result */}
        <div className="flex flex-col items-center gap-6">
          <h3 className="text-white font-bold">Combine Stage</h3>
          
          <div className="flex items-center gap-6">
            {/* Drop Zone */}
            <Droppable droppableId="dropzone">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`transition-all ${snapshot.isDraggingOver ? 'scale-105' : ''}`}
                >
                  <DropZone 
                    card={dropZoneCard} 
                    onRemove={() => setDropZoneCard(null)}
                  />
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {/* Arrow */}
            <motion.div
              animate={{ x: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className="w-8 h-8 text-white/40" />
            </motion.div>

            {/* Result */}
            <div className="w-32 h-44 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center bg-white/[0.02]">
              {showResult && dropZoneCard ? (
                <ResultCard card={dropZoneCard} combineCount={combineCount} />
              ) : (
                <div className="text-center text-white/30">
                  <Sparkles className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-xs">Result</p>
                </div>
              )}
            </div>
          </div>

          {/* Combine Button */}
          <Button
            onClick={showResult ? resetCombine : handleCombineStage}
            disabled={isCombining || (!showResult && (!dropZoneCard || selectedCards.length < combineCount))}
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl disabled:opacity-50"
          >
            {isCombining ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-5 h-5" />
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
          
          {!showResult && (
            <p className="text-white/40 text-xs text-center max-w-[250px]">
              Drag a card to the drop zone and select {combineCount} cards from inventory to combine
            </p>
          )}
        </div>
      </DragDropContext>
    </motion.div>
  );
}