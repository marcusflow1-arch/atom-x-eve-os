import React from 'react';

/**
 * Equipment slot component with liquid glass styling
 * @param {Object} props
 * @param {string} props.slotId - Unique slot identifier
 * @param {Object} props.equippedItem - Currently equipped item
 * @param {Function} props.onClick - Click handler
 */
export default function EquipmentSlot({ slotId, equippedItem, onClick, shape = 'square' }) {
  const isRound = shape === 'round';
  
  return (
    <div 
      onClick={() => onClick(slotId)}
      className={`w-[60px] h-[60px] ${isRound ? 'rounded-full' : 'rounded-xl'} border cursor-pointer flex items-center justify-center overflow-hidden relative group transition-all duration-700`}
      style={{ 
        background: 'rgba(11, 11, 11, 0.85)', 
        backdropFilter: 'blur(35px)', 
        WebkitBackdropFilter: 'blur(35px)', 
        borderColor: 'rgba(255, 255, 255, 0.12)', 
        boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' 
      }}
    >
      {/* Hover Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* Equipped Item Icon */}
      {equippedItem && (
        <img 
          src={equippedItem.icon_url || equippedItem.icon} 
          alt={equippedItem.name} 
          className="w-full h-full object-contain p-2 relative z-10" 
        />
      )}
    </div>
  );
}