import React from 'react';

/**
 * Skill slot component for ability hotbar
 * @param {Object} props
 * @param {number} props.index - Slot index (0-4)
 * @param {boolean} props.isActive - Whether skill is currently active
 * @param {Function} props.onClick - Click handler
 */
export default function SkillSlot({ index, isActive, onClick }) {
  const assigned = window.LUNA_HOTBAR?.[index] || null;

  const onDragOver = (e) => {
    if (e.dataTransfer) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    try {
      const json = e.dataTransfer.getData('application/json');
      const payload = json ? JSON.parse(json) : null;
      
      if (payload?.source === 'luna-card' && payload.card) {
        if (!window.LUNA_HOTBAR) window.LUNA_HOTBAR = {};
        window.LUNA_HOTBAR[index] = payload.card;
        
        // Visual feedback
        if (onClick) onClick();
      }
    } catch (error) {
      console.error('Drop failed:', error);
    }
  };

  return (
    <div
      onClick={onClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`w-10 h-10 rounded-lg border cursor-pointer flex items-center justify-center relative overflow-hidden group transition-all duration-700 ${
        isActive ? 'border-white/25 shadow-[inset_0_1px_3px_rgba(255,255,255,0.15)]' : ''
      }`}
      style={{ 
        background: 'rgba(11, 11, 11, 0.85)', 
        backdropFilter: 'blur(35px)', 
        WebkitBackdropFilter: 'blur(35px)', 
        borderColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.12)', 
        boxShadow: isActive 
          ? 'inset 0 1px 3px rgba(255, 255, 255, 0.15), 0 0 12px rgba(255, 255, 255, 0.1)' 
          : 'inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)' 
      }}
      title={assigned ? `${assigned.title} (${assigned.type})` : 'Drag a card here to assign'}
    >
      {/* Hover Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* Slot Number */}
      <span className="text-[#9A9A9A] text-xs font-light relative z-10">{index + 1}</span>
      
      {/* Assigned Card Preview */}
      {assigned && (
        <div className="absolute inset-0 flex items-center justify-center">
          {assigned.image ? (
            <img src={assigned.image} alt={assigned.title} className="w-full h-full object-cover opacity-30" />
          ) : (
            <span className="text-white/50 text-[10px] font-semibold px-1 text-center leading-tight line-clamp-2">
              {assigned.title}
            </span>
          )}
        </div>
      )}
    </div>
  );
}